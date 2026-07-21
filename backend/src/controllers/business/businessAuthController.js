import { Business, BusinessJobCategory, JobCategory } from '../../models/index.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import crypto from 'crypto';
import path from 'path';
import sequelize from '../../config/database.js';
import emailService from '../../services/emailService.js';
import { deleteFileFromS3, getSignedUrlForFile, uploadBufferToS3 } from '../../services/s3Service.js';

const EMAIL_VERIFY_EXPIRES_HOURS = parseInt(process.env.EMAIL_VERIFY_EXPIRES_HOURS || '72', 10);
const PASSWORD_RESET_EXPIRES_MINUTES = 30;
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.WEB_URL || 'http://localhost:5173').replace(/\/+$/, '');
const BUSINESS_LICENSE_FOLDER = 'Business';
const LICENSE_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;

const JOB_CATEGORY_INCLUDE = {
  model: JobCategory,
  as: 'jobCategories',
  required: false,
  attributes: ['id', 'name', 'nameEn', 'nameJp', 'slug', 'status'],
  through: { attributes: [] }
};

function normalizeLicensePath(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' ')).trim() || null;
  } catch {
    return raw.replace(/\+/g, ' ').trim() || null;
  }
}

function buildEmailVerificationData() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_EXPIRES_HOURS * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

function buildVerifyEmailUrl(token) {
  return `${FRONTEND_URL}/business/verify-email?token=${encodeURIComponent(token)}`;
}

function buildResetPasswordUrl(token) {
  return `${FRONTEND_URL}/business/reset-password?token=${encodeURIComponent(token)}`;
}

function parseJobCategoryIds(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((id) => parseInt(id, 10)).filter((id) => Number.isInteger(id) && id > 0))];
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parseJobCategoryIds(parsed);
    } catch {
      // fall through
    }
    return [...new Set(trimmed.split(/[,;\s]+/).map((id) => parseInt(id, 10)).filter((id) => Number.isInteger(id) && id > 0))];
  }
  const single = parseInt(raw, 10);
  return Number.isInteger(single) && single > 0 ? [single] : [];
}

async function verifyBusinessPassword(plainPassword, hashedOrPlain) {
  if (!hashedOrPlain) return false;
  const isPasswordHashed =
    hashedOrPlain.startsWith('$2a$') ||
    hashedOrPlain.startsWith('$2b$') ||
    hashedOrPlain.startsWith('$2y$');
  if (isPasswordHashed) {
    return comparePassword(plainPassword, hashedOrPlain);
  }
  return plainPassword === hashedOrPlain;
}

/** Xác thực email = kích hoạt tài khoản (không cần admin duyệt thủ công). */
async function activateBusinessAfterEmailVerification(business, verifiedAt = new Date()) {
  const updates = {
    status: 1,
    approvedAt: business.approvedAt || verifiedAt,
    rejectedAt: null,
    rejectionReason: null,
    rejectionReasonEn: null,
    rejectionReasonJp: null,
  };
  if (!business.emailVerifiedAt) {
    updates.emailVerifiedAt = verifiedAt;
    updates.emailVerificationTokenHash = null;
    updates.emailVerificationExpiresAt = null;
  }
  await business.update(updates);
}

function buildRegistrationVerificationEmail(verifyUrl) {
  const subject = '[JobShare Business] 登録確認 / Registration Verification / Xác thực đăng ký doanh nghiệp';
  const text = `ご登録ありがとうございます。以下のリンクよりメールアドレスを認証してください:
${verifyUrl}

========================================
Thank you for registering. Please verify your email using the link below:
${verifyUrl}

========================================
Cảm ơn bạn đã đăng ký tài khoản doanh nghiệp JobShare Business.
Vui lòng nhấn vào link dưới đây để xác thực email:
${verifyUrl}`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.55;">
      <p>ご登録ありがとうございます。<br/>以下のリンクよりメールアドレスを認証してください:<br/>
        <a href="${verifyUrl}" style="color: #7c3aed; text-decoration: underline;">${verifyUrl}</a>
      </p>
      <p style="margin: 14px 0;">========================================</p>
      <p>Thank you for registering.<br/>Please verify your email using the link below:<br/>
        <a href="${verifyUrl}" style="color: #7c3aed; text-decoration: underline;">${verifyUrl}</a>
      </p>
      <p style="margin: 14px 0;">========================================</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản doanh nghiệp JobShare Business.<br/>Vui lòng nhấn vào link dưới đây để xác thực email:<br/>
        <a href="${verifyUrl}" style="color: #7c3aed; text-decoration: underline;">${verifyUrl}</a>
      </p>
      <p style="margin: 16px 0 0; font-weight: 700;">JobShare Business</p>
    </div>
  `;
  return { subject, text, html };
}

function buildPasswordResetEmail(resetUrl) {
  const subject = '[JobShare Business] パスワードリセット / Password Reset / Đặt lại mật khẩu';
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.55;">
      <p>パスワードリセットのリクエストを受け付けました（有効期限: ${PASSWORD_RESET_EXPIRES_MINUTES}分）:<br/>
        <a href="${resetUrl}" style="color: #7c3aed; text-decoration: underline;">${resetUrl}</a>
      </p>
      <p style="margin: 14px 0;">========================================</p>
      <p>We received a password reset request (expires in ${PASSWORD_RESET_EXPIRES_MINUTES} minutes):<br/>
        <a href="${resetUrl}" style="color: #7c3aed; text-decoration: underline;">${resetUrl}</a>
      </p>
      <p style="margin: 14px 0;">========================================</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu (hết hạn sau ${PASSWORD_RESET_EXPIRES_MINUTES} phút):<br/>
        <a href="${resetUrl}" style="color: #7c3aed; text-decoration: underline;">${resetUrl}</a>
      </p>
      <p style="margin: 16px 0 0;">このメールに心当たりがない場合は無視してください。</p>
      <p style="margin: 16px 0 0; font-weight: 700;">JobShare Business</p>
    </div>
  `;
  return { subject, html };
}

async function formatBusinessResponse(business) {
  const data = business.toJSON ? business.toJSON() : { ...business };
  delete data.password;
  delete data.emailVerificationTokenHash;
  delete data.passwordResetTokenHash;

  const licenseKey = normalizeLicensePath(data.businessLicensePath);
  if (licenseKey) {
    data.businessLicensePath = licenseKey;
    data.businessLicenseUrl = await getSignedUrlForFile(licenseKey, 'view');
  } else {
    data.businessLicenseUrl = null;
  }
  return data;
}

/**
 * Business Authentication Controller
 */
export const businessAuthController = {
  /**
   * POST /api/business/auth/register
   */
  register: async (req, res, next) => {
    try {
      const body = req.body || {};
      const {
        companyName,
        companyNameEn,
        companyNameJp,
        taxCode,
        companySize,
        companySizeEn,
        companySizeJp,
        website,
        address,
        addressEn,
        addressJp,
        city,
        cityEn,
        cityJp,
        country = 'Việt Nam',
        countryEn,
        countryJp,
        contactName,
        contactNameEn,
        contactNameJp,
        contactTitle,
        contactTitleEn,
        contactTitleJp,
        contactEmail,
        contactPhone,
        loginEmail,
        email: loginEmailAlt,
        password,
        acceptTerms
      } = body;

      const email = String(loginEmail || loginEmailAlt || '').trim();
      const jobCategoryIds = parseJobCategoryIds(body.jobCategoryIds ?? body.jobCategoryId ?? body.industryIds);

      if (!companyName?.trim() || !taxCode?.trim() || !address?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên doanh nghiệp, mã số thuế và địa chỉ là bắt buộc'
        });
      }
      if (!contactName?.trim() || !contactTitle?.trim() || !contactEmail?.trim() || !contactPhone?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Thông tin người liên hệ là bắt buộc'
        });
      }
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email đăng nhập và mật khẩu là bắt buộc'
        });
      }
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 8 ký tự'
        });
      }
      if (!jobCategoryIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn ít nhất một lĩnh vực kinh doanh (job category)'
        });
      }
      if (![true, 'true', 1, '1'].includes(acceptTerms)) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng đồng ý điều khoản sử dụng'
        });
      }

      const categories = await JobCategory.findAll({
        where: { id: jobCategoryIds },
        attributes: ['id']
      });
      if (categories.length !== jobCategoryIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Một hoặc nhiều lĩnh vực kinh doanh không hợp lệ'
        });
      }

      const existingEmail = await Business.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Email đăng nhập đã được sử dụng' });
      }

      const existingTax = await Business.findOne({ where: { taxCode: String(taxCode).trim() } });
      if (existingTax) {
        return res.status(409).json({ success: false, message: 'Mã số thuế đã được đăng ký' });
      }

      const hashedPassword = await hashPassword(password);
      const verifyData = buildEmailVerificationData();
      const now = new Date();

      let uploadedLicenseKey = null;
      if (req.file?.buffer?.length) {
        if (req.file.size > LICENSE_UPLOAD_LIMIT_BYTES) {
          return res.status(400).json({ success: false, message: 'File giấy phép quá lớn (tối đa 10MB)' });
        }
        const ext = path.extname(req.file.originalname || '.pdf') || '.pdf';
        const safeTax = String(taxCode).trim().replace(/[^\w-]+/g, '_');
        uploadedLicenseKey = await uploadBufferToS3(
          req.file.buffer,
          `${BUSINESS_LICENSE_FOLDER}/${safeTax}/business-license${ext}`,
          req.file.mimetype || 'application/pdf'
        );
      }

      const business = await sequelize.transaction(async (transaction) => {
        const created = await Business.create({
          companyName: companyName.trim(),
          companyNameEn: companyNameEn?.trim() || null,
          companyNameJp: companyNameJp?.trim() || null,
          taxCode: String(taxCode).trim(),
          companySize: companySize?.trim() || null,
          companySizeEn: companySizeEn?.trim() || null,
          companySizeJp: companySizeJp?.trim() || null,
          website: website?.trim() || null,
          address: address.trim(),
          addressEn: addressEn?.trim() || null,
          addressJp: addressJp?.trim() || null,
          city: city?.trim() || null,
          cityEn: cityEn?.trim() || null,
          cityJp: cityJp?.trim() || null,
          country: country?.trim() || 'Việt Nam',
          countryEn: countryEn?.trim() || null,
          countryJp: countryJp?.trim() || null,
          businessLicensePath: uploadedLicenseKey,
          contactName: contactName.trim(),
          contactNameEn: contactNameEn?.trim() || null,
          contactNameJp: contactNameJp?.trim() || null,
          contactTitle: contactTitle.trim(),
          contactTitleEn: contactTitleEn?.trim() || null,
          contactTitleJp: contactTitleJp?.trim() || null,
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          email,
          password: hashedPassword,
          status: 0,
          approvedAt: null,
          termsAcceptedAt: now,
          emailVerifiedAt: null,
          emailVerificationTokenHash: verifyData.tokenHash,
          emailVerificationExpiresAt: verifyData.expiresAt,
          emailVerificationSentAt: now
        }, { transaction });

        await BusinessJobCategory.bulkCreate(
          jobCategoryIds.map((jobCategoryId) => ({
            businessId: created.id,
            jobCategoryId
          })),
          { transaction }
        );

        return created;
      });

      try {
        const verifyUrl = buildVerifyEmailUrl(verifyData.token);
        const emailContent = buildRegistrationVerificationEmail(verifyUrl);
        await emailService.sendEmail({
          to: business.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html
        });
      } catch (emailError) {
        console.error('[business register] Send verification email failed:', emailError);
      }

      await business.reload({ include: [JOB_CATEGORY_INCLUDE] });

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản. Hồ sơ sẽ được xem xét trong 1–2 ngày làm việc.',
        data: {
          business: await formatBusinessResponse(business)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/business/auth/login
   */
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email và mật khẩu là bắt buộc'
        });
      }

      const normalizedEmail = String(email).trim();
      const business = await Business.findOne({
        where: { email: normalizedEmail },
        include: [JOB_CATEGORY_INCLUDE]
      });

      if (!business) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng'
        });
      }

      if (!business.emailVerifiedAt) {
        if (business.status === 1 && business.approvedAt) {
          await business.update({
            emailVerifiedAt: new Date(),
            emailVerificationTokenHash: null,
            emailVerificationExpiresAt: null,
          });
          await business.reload({ include: [JOB_CATEGORY_INCLUDE] });
        } else {
          return res.status(403).json({
            success: false,
            message: 'Vui lòng xác thực email trước khi đăng nhập. Kiểm tra hộp thư hoặc yêu cầu gửi lại email xác thực.'
          });
        }
      }

      // Tài khoản đã xác thực email nhưng chưa kích hoạt (dữ liệu cũ) — tự phê duyệt khi đăng nhập
      if (
        business.emailVerifiedAt &&
        business.status !== 2 &&
        business.status !== 3 &&
        (!business.approvedAt || business.status !== 1)
      ) {
        await activateBusinessAfterEmailVerification(business);
        await business.reload({ include: [JOB_CATEGORY_INCLUDE] });
      }

      if (business.status === 2) {
        return res.status(403).json({
          success: false,
          message: 'Hồ sơ doanh nghiệp đã bị từ chối. Vui lòng liên hệ JobShare để biết thêm chi tiết.'
        });
      }

      if (business.status === 3) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản doanh nghiệp đã bị tạm khóa. Vui lòng liên hệ quản trị viên.'
        });
      }

      if (!business.approvedAt || business.status !== 1) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đang chờ duyệt. Chúng tôi sẽ gửi email thông báo khi hồ sơ được phê duyệt.'
        });
      }

      const isPasswordValid = await verifyBusinessPassword(password, business.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng'
        });
      }

      if (
        business.password &&
        !business.password.startsWith('$2a$') &&
        !business.password.startsWith('$2b$') &&
        !business.password.startsWith('$2y$')
      ) {
        business.password = await hashPassword(password);
        await business.save();
      }

      business.lastLoginAt = new Date();
      await business.save();

      const token = generateToken({
        id: business.id,
        email: business.email,
        role: 'BUSINESS'
      });

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          business: await formatBusinessResponse(business),
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/business/auth/verify-email?token=...
   */
  verifyEmail: async (req, res, next) => {
    try {
      const token = String(req.query.token || '').trim();
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu token xác thực email'
        });
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const business = await Business.findOne({
        where: { emailVerificationTokenHash: tokenHash }
      });

      if (!business) {
        return res.status(400).json({
          success: false,
          message: 'Link xác thực không hợp lệ hoặc đã được sử dụng'
        });
      }

      const now = new Date();
      const alreadyVerified = !!business.emailVerifiedAt;
      const isExpired =
        business.emailVerificationExpiresAt &&
        new Date(business.emailVerificationExpiresAt).getTime() < now.getTime();

      if (isExpired && !alreadyVerified) {
        return res.status(400).json({
          success: false,
          message: 'Link xác thực đã hết hạn'
        });
      }

      if (!alreadyVerified) {
        await activateBusinessAfterEmailVerification(business, now);
      } else if (!business.approvedAt || business.status !== 1) {
        await activateBusinessAfterEmailVerification(business, business.emailVerifiedAt || now);
      }

      return res.json({
        success: true,
        message: alreadyVerified
          ? 'Email đã được xác thực trước đó. Bạn có thể đăng nhập ngay.'
          : 'Xác thực email thành công. Bạn có thể đăng nhập ngay.',
        data: {
          result: alreadyVerified ? 'already_verified' : 'verified'
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/business/auth/resend-verification
   */
  resendVerification: async (req, res, next) => {
    try {
      const email = String(req.body.email || '').trim();
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email là bắt buộc' });
      }

      const business = await Business.findOne({ where: { email } });
      if (!business) {
        return res.json({
          success: true,
          message: 'Nếu email tồn tại trong hệ thống, email xác thực sẽ được gửi lại.'
        });
      }

      if (business.emailVerifiedAt) {
        if (!business.approvedAt || business.status !== 1) {
          await activateBusinessAfterEmailVerification(business);
        }
        return res.json({
          success: true,
          message: 'Email đã được xác thực. Bạn có thể đăng nhập.'
        });
      }

      const verifyData = buildEmailVerificationData();
      await business.update({
        emailVerificationTokenHash: verifyData.tokenHash,
        emailVerificationExpiresAt: verifyData.expiresAt,
        emailVerificationSentAt: new Date()
      });

      try {
        const verifyUrl = buildVerifyEmailUrl(verifyData.token);
        const emailContent = buildRegistrationVerificationEmail(verifyUrl);
        await emailService.sendEmail({
          to: business.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html
        });
      } catch (emailError) {
        console.error('[business resendVerification] Send email failed:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Không thể gửi email xác thực. Vui lòng thử lại sau.'
        });
      }

      return res.json({
        success: true,
        message: 'Email xác thực đã được gửi lại.'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/business/auth/me
   */
  getMe: async (req, res, next) => {
    try {
      const business = await Business.findByPk(req.business.id, {
        include: [JOB_CATEGORY_INCLUDE]
      });
      if (!business) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin doanh nghiệp' });
      }

      res.json({
        success: true,
        data: {
          business: await formatBusinessResponse(business)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/business/auth/forgot-password
   */
  forgotPassword: async (req, res, next) => {
    try {
      const email = String(req.body.email || '').trim();
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email là bắt buộc' });
      }

      const business = await Business.findOne({ where: { email } });
      if (!business) {
        return res.json({
          success: true,
          message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu.'
        });
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000);
      const payload = `${expiresAt.getTime()}.${rawToken}`;
      const tokenHash = crypto.createHash('sha256').update(payload).digest('hex');

      await business.update({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt
      });

      const resetUrl = buildResetPasswordUrl(payload);
      const { subject, html } = buildPasswordResetEmail(resetUrl);

      try {
        await emailService.sendEmail({ to: business.email, subject, html });
      } catch (emailError) {
        console.error('[business forgotPassword] Send email failed:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.'
        });
      }

      return res.json({
        success: true,
        message: 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/business/auth/reset-password
   */
  resetPassword: async (req, res, next) => {
    try {
      const token = String(req.body.token || '').trim();
      const newPassword = String(req.body.password || '');

      if (!token) {
        return res.status(400).json({ success: false, message: 'Token không hợp lệ' });
      }
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 8 ký tự' });
      }

      const dotIdx = token.indexOf('.');
      if (dotIdx === -1) {
        return res.status(400).json({ success: false, message: 'Token không hợp lệ' });
      }

      const expiresAtMs = parseInt(token.substring(0, dotIdx), 10);
      if (Number.isNaN(expiresAtMs) || Date.now() > expiresAtMs) {
        return res.status(400).json({
          success: false,
          message: 'Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.'
        });
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const business = await Business.findOne({ where: { passwordResetTokenHash: tokenHash } });
      if (!business) {
        return res.status(400).json({
          success: false,
          message: 'Token không hợp lệ hoặc đã được sử dụng'
        });
      }

      if (
        business.passwordResetExpiresAt &&
        new Date(business.passwordResetExpiresAt).getTime() < Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.'
        });
      }

      await business.update({
        password: await hashPassword(newPassword),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null
      });

      return res.json({
        success: true,
        message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/business/auth/change-password
   */
  changePassword: async (req, res, next) => {
    try {
      const currentPassword = String(req.body.currentPassword || '');
      const newPassword = String(req.body.newPassword || req.body.password || '');

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'
        });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 8 ký tự'
        });
      }
      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải khác mật khẩu hiện tại'
        });
      }

      const business = await Business.findByPk(req.business.id);
      if (!business) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      }

      const isValid = await verifyBusinessPassword(currentPassword, business.password);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
      }

      business.password = await hashPassword(newPassword);
      await business.save();

      return res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/business/auth/logout
   */
  logout: async (req, res, next) => {
    try {
      res.json({ success: true, message: 'Đăng xuất thành công' });
    } catch (error) {
      next(error);
    }
  }
};
