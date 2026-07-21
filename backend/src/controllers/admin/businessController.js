import { Op } from 'sequelize';
import {
  Business,
  BusinessCreditHistory,
  JobCategory,
  Admin,
} from '../../models/index.js';
import { hashPassword } from '../../utils/password.js';
import {
  adjustBusinessCredit,
  CREDIT_HISTORY_TYPES,
} from '../../services/businessCreditService.js';

const JOB_CATEGORY_INCLUDE = {
  model: JobCategory,
  as: 'jobCategories',
  required: false,
  attributes: ['id', 'name', 'nameEn', 'nameJp', 'slug', 'status'],
  through: { attributes: [] },
};

const CREDIT_HISTORY_INCLUDE = {
  model: BusinessCreditHistory,
  as: 'creditHistories',
  required: false,
  separate: true,
  limit: 20,
  order: [['created_at', 'DESC']],
  include: [
    {
      model: Admin,
      as: 'admin',
      required: false,
      attributes: ['id', 'name', 'email'],
    },
  ],
};

function sanitizeBusiness(business) {
  const data = business.toJSON ? business.toJSON() : { ...business };
  delete data.password;
  delete data.emailVerificationTokenHash;
  delete data.passwordResetTokenHash;
  return data;
}

/** Bỏ query rác từ URLSearchParams (undefined/null literal). */
function normalizeQueryParam(value) {
  if (value == null) return '';
  const s = String(value).trim();
  if (!s || s === 'undefined' || s === 'null') return '';
  return s;
}

export const adminBusinessController = {
  getBusinesses: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        sortBy = 'id',
        sortOrder = 'DESC',
      } = req.query;

      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const where = {};

      const searchText = normalizeQueryParam(search);
      if (searchText) {
        const pattern = `%${searchText}%`;
        where[Op.or] = [
          { companyName: { [Op.like]: pattern } },
          { email: { [Op.like]: pattern } },
          { taxCode: { [Op.like]: pattern } },
          { contactName: { [Op.like]: pattern } },
          { contactPhone: { [Op.like]: pattern } },
        ];
      }

      const statusText = normalizeQueryParam(status);
      if (statusText !== '') {
        const statusNum = parseInt(statusText, 10);
        if (!Number.isNaN(statusNum)) {
          where.status = statusNum;
        }
      }

      const allowedSort = ['id', 'companyName', 'email', 'credit', 'createdAt', 'lastLoginAt'];
      const sortField = allowedSort.includes(sortBy) ? sortBy : 'id';
      const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const { count, rows } = await Business.findAndCountAll({
        where,
        limit: parseInt(limit, 10),
        offset,
        order: [[sortField, orderDir]],
        include: [JOB_CATEGORY_INCLUDE],
      });

      res.json({
        success: true,
        data: {
          businesses: rows.map(sanitizeBusiness),
          pagination: {
            total: count,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(count / parseInt(limit, 10)) || 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getBusinessById: async (req, res, next) => {
    try {
      const business = await Business.findByPk(req.params.id, {
        include: [JOB_CATEGORY_INCLUDE, CREDIT_HISTORY_INCLUDE],
      });
      if (!business) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy doanh nghiệp' });
      }
      res.json({
        success: true,
        data: { business: sanitizeBusiness(business) },
      });
    } catch (error) {
      next(error);
    }
  },

  createBusiness: async (req, res, next) => {
    try {
      const body = req.body || {};
      const email = String(body.email || '').trim();
      const password = String(body.password || '');
      const companyName = String(body.companyName || '').trim();
      const taxCode = String(body.taxCode || '').trim();
      const contactName = String(body.contactName || '').trim();
      const contactTitle = String(body.contactTitle || 'Admin').trim();
      const contactEmail = String(body.contactEmail || email).trim();
      const contactPhone = String(body.contactPhone || '').trim();
      const address = String(body.address || '—').trim();

      if (!email || !password || !companyName || !taxCode || !contactName || !contactPhone) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập email, mật khẩu, tên công ty, mã số thuế và thông tin liên hệ',
        });
      }
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 8 ký tự' });
      }

      const exists = await Business.findOne({ where: { [Op.or]: [{ email }, { taxCode }] } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Email hoặc mã số thuế đã tồn tại' });
      }

      const now = new Date();
      const initialCredit = Math.max(0, parseInt(body.credit, 10) || 0);
      const business = await Business.create({
        companyName,
        taxCode,
        contactName,
        contactTitle,
        contactEmail,
        contactPhone,
        address,
        email,
        password: await hashPassword(password),
        status: 1,
        approvedAt: now,
        emailVerifiedAt: now,
        credit: 0,
        termsAcceptedAt: now,
      });

      if (initialCredit > 0) {
        await adjustBusinessCredit({
          businessId: business.id,
          changeAmount: initialCredit,
          type: CREDIT_HISTORY_TYPES.ADMIN_GRANT,
          note: 'Credit khởi tạo khi tạo tài khoản',
          adminId: req.adminId || req.admin?.id || null,
        });
        await business.reload();
      }

      res.status(201).json({
        success: true,
        message: 'Tạo tài khoản doanh nghiệp thành công',
        data: { business: sanitizeBusiness(business) },
      });
    } catch (error) {
      next(error);
    }
  },

  updateBusiness: async (req, res, next) => {
    try {
      const business = await Business.findByPk(req.params.id);
      if (!business) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy doanh nghiệp' });
      }

      const body = req.body || {};
      const allowed = [
        'companyName', 'companyNameEn', 'companyNameJp',
        'taxCode', 'companySize', 'website',
        'address', 'addressEn', 'addressJp',
        'city', 'country',
        'contactName', 'contactTitle', 'contactEmail', 'contactPhone',
        'status', 'rejectionReason',
      ];

      const updates = {};
      for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key];
      }

      if (body.status !== undefined) {
        const st = parseInt(body.status, 10);
        if (st === 1 && !business.approvedAt) updates.approvedAt = new Date();
        if (st === 2) updates.rejectedAt = new Date();
      }

      await business.update(updates);
      await business.reload({ include: [JOB_CATEGORY_INCLUDE] });

      res.json({
        success: true,
        message: 'Cập nhật doanh nghiệp thành công',
        data: { business: sanitizeBusiness(business) },
      });
    } catch (error) {
      next(error);
    }
  },

  deleteBusiness: async (req, res, next) => {
    try {
      const business = await Business.findByPk(req.params.id);
      if (!business) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy doanh nghiệp' });
      }
      await business.destroy();
      res.json({ success: true, message: 'Đã xóa tài khoản doanh nghiệp' });
    } catch (error) {
      next(error);
    }
  },

  adjustCredit: async (req, res, next) => {
    try {
      const business = await Business.findByPk(req.params.id);
      if (!business) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy doanh nghiệp' });
      }

      const amount = Math.abs(Math.trunc(Number(req.body?.amount)));
      const action = String(req.body?.action || req.body?.type || 'grant').toLowerCase();
      const note = req.body?.note || req.body?.reason || '';

      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Số credit phải lớn hơn 0' });
      }

      const isDeduct = action === 'deduct' || action === 'admin_deduct' || action === 'subtract';
      const changeAmount = isDeduct ? -amount : amount;
      const type = isDeduct ? CREDIT_HISTORY_TYPES.ADMIN_DEDUCT : CREDIT_HISTORY_TYPES.ADMIN_GRANT;

      const result = await adjustBusinessCredit({
        businessId: business.id,
        changeAmount,
        type,
        note,
        adminId: req.adminId || req.admin?.id || null,
      });

      res.json({
        success: true,
        message: isDeduct ? 'Đã khấu trừ credit' : 'Đã cấp credit',
        data: {
          credit: result.balanceAfter,
          history: result.history,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  getCreditHistory: async (req, res, next) => {
    try {
      const business = await Business.findByPk(req.params.id, { attributes: ['id', 'credit', 'companyName'] });
      if (!business) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy doanh nghiệp' });
      }

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = (page - 1) * limit;

      const { count, rows } = await BusinessCreditHistory.findAndCountAll({
        where: { businessId: business.id },
        limit,
        offset,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: Admin,
            as: 'admin',
            required: false,
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      res.json({
        success: true,
        data: {
          businessId: business.id,
          currentCredit: business.credit,
          histories: rows,
          pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit) || 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
