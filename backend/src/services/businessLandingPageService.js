import { Op } from 'sequelize';
import {
  Business,
  BusinessLandingPage,
  BusinessLandingPageActivity,
  BusinessLandingPageSubmission,
  Job,
} from '../models/index.js';
import {
  getLandingPageTemplate,
  getPublicLandingPagePath,
  LANDING_PAGE_ACTIVITY_TYPES,
  LANDING_PAGE_STATUS,
  LANDING_PAGE_STATUS_LABELS,
  LANDING_PAGE_TEMPLATES,
} from '../constants/businessLandingPage.js';
import {
  buildCompanyContentFromTemplate,
  isCompanyBuilderContent,
} from '../utils/companyLandingPageSchema.js';
import {
  getRegisteredTemplateKeys,
  isTemplateRegistered,
} from '../constants/templatePageRegistry.js';

function slugify(text) {
  return (
    String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 180) || 'landing'
  );
}

async function generateUniqueSlug(base, excludeId = null) {
  let slug = slugify(base);
  let suffix = 0;
  while (true) {
    const candidate = suffix ? `${slug}-${suffix}` : slug;
    const where = { slug: candidate };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await BusinessLandingPage.findOne({ where });
    if (!existing) return candidate;
    suffix += 1;
  }
}

function parseJsonField(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function stripHtml(text) {
  return String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildDefaultForm() {
  return {
    title: 'Đăng ký ứng tuyển',
    submitText: 'Gửi hồ sơ',
    fields: [
      { key: 'name', label: 'Họ và tên', required: true, type: 'text' },
      { key: 'email', label: 'Email', required: true, type: 'email' },
      { key: 'phone', label: 'Số điện thoại', required: false, type: 'tel' },
      { key: 'message', label: 'Lời nhắn', required: false, type: 'textarea' },
    ],
  };
}

function buildContentFromJob(job, business, templateKey) {
  const template = getLandingPageTemplate(templateKey);
  const jobTitle = job.title || job.titleEn || 'Vị trí tuyển dụng';
  const companyName = business?.companyName || 'Doanh nghiệp';
  const description = stripHtml(job.description || job.recruitmentReason || '').slice(0, 1200);
  const highlights = stripHtml(job.highlights || '').slice(0, 600);
  const requirements = stripHtml(job.instruction || job.description || '').slice(0, 800)
    || 'Xem chi tiết trong form ứng tuyển.';
  const form = buildDefaultForm();
  const jobSnapshot = {
    id: job.id,
    title: jobTitle,
    jobCode: job.jobCode || null,
    slug: job.slug || null,
  };
  const theme = { folder: template.folder, primaryColor: template.previewColor };

  if (template.layout === 'lp3') {
    return {
      templateKey: template.key,
      layout: template.layout,
      theme,
      heroMedia: template.heroMedia || 'slide',
      companyName,
      announcement: `${companyName} đang tuyển dụng vị trí ${jobTitle}`,
      hero: {
        headline: jobTitle,
        subheadline: `${companyName} — cơ hội nghề nghiệp hấp dẫn, ứng tuyển ngay hôm nay`,
        ctaText: 'Ứng tuyển ngay',
      },
      sections: {
        kodawari: [{
          title: 'Giới thiệu công việc',
          subtitle: 'About the role',
          body: description || `Cơ hội làm việc tại ${companyName} với vị trí ${jobTitle}.`,
        }],
        service: [{
          title: 'Quyền lợi & điểm nổi bật',
          subtitle: 'Benefits',
          body: highlights || 'Môi trường chuyên nghiệp, cơ hội phát triển sự nghiệp.',
        }],
        flow: [
          { step: 1, title: 'Gửi hồ sơ', body: 'Điền form ứng tuyển bên dưới.' },
          { step: 2, title: 'Phỏng vấn', body: 'HR sẽ liên hệ trong 3–5 ngày làm việc.' },
          { step: 3, title: 'Nhận việc', body: 'Hoàn tất onboarding và bắt đầu công việc.' },
        ],
        voice: [{
          title: 'Cơ hội phát triển',
          body: 'Gia nhập đội ngũ năng động, phát triển sự nghiệp bền vững.',
        }],
        faq: [
          { q: 'Yêu cầu ứng viên?', a: requirements },
          { q: 'Quy trình tuyển dụng?', a: 'Gửi hồ sơ → Phỏng vấn → Offer → Onboarding.' },
        ],
      },
      form,
      jobSnapshot,
    };
  }

  return {
    templateKey: template.key,
    layout: template.layout,
    theme,
    companyName,
    hero: {
      headline: jobTitle,
      subheadline: `${companyName} đang tuyển dụng — ứng tuyển ngay hôm nay`,
      ctaPrimary: 'Ứng tuyển ngay',
      ctaSecondary: 'Xem chi tiết',
    },
    sections: [
      {
        type: 'about',
        title: 'Giới thiệu công việc',
        body: description || `Cơ hội làm việc tại ${companyName} với vị trí ${jobTitle}.`,
      },
      {
        type: 'highlights',
        title: 'Điểm nổi bật',
        body: highlights || 'Môi trường chuyên nghiệp, cơ hội phát triển sự nghiệp.',
      },
      {
        type: 'requirements',
        title: 'Yêu cầu ứng viên',
        body: requirements,
      },
    ],
    form,
    jobSnapshot,
  };
}

function buildSeoFields({ title, contentJson, business, job }) {
  const headline = contentJson?.hero?.headline
    || contentJson?.pages?.[0]?.sections?.find((s) => s.type === 'hero')?.props?.headline
    || contentJson?.companyName
    || title;
  const about = contentJson?.sections?.find?.((s) => s.type === 'about')?.body
    || contentJson?.sections?.kodawari?.[0]?.body
    || contentJson?.pages?.[0]?.sections?.find((s) => s.type === 'text_image')?.props?.body
    || contentJson?.hero?.subheadline
    || '';
  const companyName = business?.companyName || contentJson?.companyName || '';
  const metaTitle = `${headline}${companyName ? ` | ${companyName}` : ''} | WS JobShare`;
  const metaDescription = stripHtml(about).slice(0, 160)
    || `Tuyển dụng ${headline} — ứng tuyển trực tuyến qua WS JobShare.`;
  const keywords = [
    headline,
    companyName,
    job?.jobCode,
    'tuyển dụng',
    'việc làm',
    'ứng tuyển',
  ].filter(Boolean).join(', ');

  return {
    metaTitle,
    metaDescription,
    metaKeywords: keywords.slice(0, 500),
    metaImage: contentJson?.hero?.imageUrl || null,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
  };
}

async function logActivity({ landingPageId, businessId, activityType, message, metadata }) {
  await BusinessLandingPageActivity.create({
    landingPageId,
    businessId,
    activityType,
    message,
    metadataJson: metadata || null,
  });
}

function formatLandingPage(row, { includeContent = true } = {}) {
  const json = row.toJSON ? row.toJSON() : row;
  const status = Number(json.status);
  return {
    id: json.id,
    businessId: json.businessId,
    jobId: json.jobId,
    title: json.title,
    slug: json.slug,
    templateKey: json.templateKey,
    status,
    statusLabel: LANDING_PAGE_STATUS_LABELS[status] || '—',
    publicPath: getPublicLandingPagePath(json.slug),
    publishedAt: json.publishedAt || null,
    viewsCount: json.viewsCount || 0,
    formSubmissionsCount: json.formSubmissionsCount || 0,
    candidatesCount: json.candidatesCount || 0,
    metaTitle: json.metaTitle || null,
    metaDescription: json.metaDescription || null,
    metaKeywords: json.metaKeywords || null,
    metaImage: json.metaImage || null,
    ogTitle: json.ogTitle || null,
    ogDescription: json.ogDescription || null,
    content: includeContent ? parseJsonField(json.contentJson) : undefined,
    job: json.job
      ? {
          id: json.job.id,
          title: json.job.title,
          jobCode: json.job.jobCode,
          slug: json.job.slug,
        }
      : null,
    builderType: isCompanyBuilderContent(json.contentJson) ? 'company' : (json.jobId ? 'job' : 'company'),
    business: json.business
      ? { id: json.business.id, companyName: json.business.companyName }
      : null,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
}

async function assertOwnedJob(businessId, jobId) {
  const job = await Job.findOne({ where: { id: jobId, businessId } });
  if (!job) {
    const err = new Error('Không tìm thấy JD hoặc không thuộc doanh nghiệp');
    err.statusCode = 404;
    throw err;
  }
  return job;
}

async function assertOwnedPage(businessId, pageId) {
  const page = await BusinessLandingPage.findOne({
    where: { id: pageId, businessId },
    include: [
      { model: Job, as: 'job', required: false, attributes: ['id', 'title', 'jobCode', 'slug'] },
      { model: Business, as: 'business', required: false, attributes: ['id', 'companyName'] },
    ],
  });
  if (!page) {
    const err = new Error('Không tìm thấy landing page');
    err.statusCode = 404;
    throw err;
  }
  return page;
}

export function listLandingPageTemplates() {
  const registered = new Set(getRegisteredTemplateKeys());
  return LANDING_PAGE_TEMPLATES.filter((t) => registered.has(t.key));
}

export async function createCompanyLandingPage({
  businessId,
  templateKey,
  title,
  content: clientContent = null,
}) {
  const business = await Business.findByPk(businessId, {
    attributes: ['id', 'companyName', 'website', 'address', 'city', 'country'],
  });
  if (!business) {
    const err = new Error('Không tìm thấy doanh nghiệp');
    err.statusCode = 404;
    throw err;
  }

  const rawKey = templateKey != null ? String(templateKey).trim() : '';
  if (!rawKey) {
    const err = new Error('Thiếu templateKey — chọn template trước khi tạo trang');
    err.statusCode = 400;
    throw err;
  }

  const resolvedKey = getLandingPageTemplate(rawKey).key;

  if (!isTemplateRegistered(resolvedKey)) {
    const err = new Error(`Template "${templateKey}" chưa được đăng ký cho builder`);
    err.statusCode = 400;
    throw err;
  }

  const clientKey = clientContent?.templateKey
    ? getLandingPageTemplate(String(clientContent.templateKey).trim()).key
    : null;

  let contentJson;
  if (clientContent && clientKey === resolvedKey) {
    contentJson = { ...clientContent, templateKey: resolvedKey };
  } else {
    contentJson = buildCompanyContentFromTemplate(resolvedKey, business);
  }

  if (contentJson.templateKey !== resolvedKey) {
    contentJson.templateKey = resolvedKey;
  }
  const pageTitle = title?.trim()
    || `${business.companyName || 'Doanh nghiệp'} — Trang giới thiệu`;
  const slug = await generateUniqueSlug(pageTitle);
  const seo = buildSeoFields({ title: pageTitle, contentJson, business, job: null });

  const page = await BusinessLandingPage.create({
    businessId,
    jobId: null,
    title: pageTitle,
    slug,
    templateKey: contentJson.templateKey,
    contentJson,
    status: LANDING_PAGE_STATUS.DRAFT,
    ...seo,
  });

  await logActivity({
    landingPageId: page.id,
    businessId,
    activityType: LANDING_PAGE_ACTIVITY_TYPES.CREATED,
    message: `Đã tạo trang giới thiệu doanh nghiệp "${pageTitle}"`,
  });

  return formatLandingPage(await assertOwnedPage(businessId, page.id));
}

export async function createLandingPageFromJob({
  businessId,
  jobId,
  templateKey = 'tp_lp3_biz_movie1',
  title,
}) {
  const job = await assertOwnedJob(businessId, jobId);
  const business = await Business.findByPk(businessId, { attributes: ['id', 'companyName'] });
  const pageTitle = title?.trim() || `Tuyển dụng ${job.title || job.jobCode || job.id}`;
  const slug = await generateUniqueSlug(pageTitle);
  const contentJson = buildContentFromJob(job, business, templateKey);
  const seo = buildSeoFields({ title: pageTitle, contentJson, business, job });

  const page = await BusinessLandingPage.create({
    businessId,
    jobId,
    title: pageTitle,
    slug,
    templateKey: getLandingPageTemplate(templateKey).key,
    contentJson,
    status: LANDING_PAGE_STATUS.DRAFT,
    ...seo,
  });

  await logActivity({
    landingPageId: page.id,
    businessId,
    activityType: LANDING_PAGE_ACTIVITY_TYPES.CREATED,
    message: `Đã tạo landing page "${pageTitle}"`,
  });

  return formatLandingPage(await assertOwnedPage(businessId, page.id));
}

export async function listLandingPagesForBusiness({
  businessId,
  page = 1,
  limit = 20,
  status,
  search,
}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const where = { businessId };

  if (status != null && status !== '') {
    where.status = parseInt(status, 10);
  }
  if (search?.trim()) {
    const q = `%${search.trim()}%`;
    where[Op.or] = [{ title: { [Op.like]: q } }, { slug: { [Op.like]: q } }];
  }

  const { count, rows } = await BusinessLandingPage.findAndCountAll({
    where,
    include: [
      { model: Job, as: 'job', required: false, attributes: ['id', 'title', 'jobCode', 'slug'] },
    ],
    order: [['updated_at', 'DESC'], ['id', 'DESC']],
    limit: safeLimit,
    offset,
  });

  return {
    landingPages: rows.map((r) => formatLandingPage(r, { includeContent: false })),
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

export async function getLandingPageForBusiness({ businessId, pageId }) {
  const page = await assertOwnedPage(businessId, pageId);
  return formatLandingPage(page);
}

export async function updateLandingPageForBusiness({ businessId, pageId, payload }) {
  const page = await assertOwnedPage(businessId, pageId);
  const business = page.business || await Business.findByPk(businessId, { attributes: ['id', 'companyName'] });
  const job = page.job || (page.jobId ? await Job.findByPk(page.jobId) : null);

  const updates = {};
  if (payload.title?.trim()) updates.title = payload.title.trim();
  if (payload.templateKey) updates.templateKey = getLandingPageTemplate(payload.templateKey).key;
  if (payload.content != null) updates.contentJson = payload.content;

  if (payload.slug?.trim()) {
    updates.slug = await generateUniqueSlug(payload.slug.trim(), page.id);
  }

  if (payload.metaTitle != null) updates.metaTitle = payload.metaTitle;
  if (payload.metaDescription != null) updates.metaDescription = payload.metaDescription;
  if (payload.metaKeywords != null) updates.metaKeywords = payload.metaKeywords;
  if (payload.metaImage != null) updates.metaImage = payload.metaImage;
  if (payload.ogTitle != null) updates.ogTitle = payload.ogTitle;
  if (payload.ogDescription != null) updates.ogDescription = payload.ogDescription;

  if (payload.regenerateSeo) {
    const contentJson = updates.contentJson || parseJsonField(page.contentJson);
    Object.assign(updates, buildSeoFields({
      title: updates.title || page.title,
      contentJson,
      business,
      job,
    }));
  }

  await page.update(updates);
  return formatLandingPage(await assertOwnedPage(businessId, page.id));
}

export async function publishLandingPage({ businessId, pageId }) {
  const page = await assertOwnedPage(businessId, pageId);
  await page.update({
    status: LANDING_PAGE_STATUS.ACTIVE,
    publishedAt: page.publishedAt || new Date(),
  });
  await logActivity({
    landingPageId: page.id,
    businessId,
    activityType: LANDING_PAGE_ACTIVITY_TYPES.PUBLISHED,
    message: `Landing page "${page.title}" đã được phát hành`,
  });
  return formatLandingPage(await assertOwnedPage(businessId, page.id));
}

export async function pauseLandingPage({ businessId, pageId }) {
  const page = await assertOwnedPage(businessId, pageId);
  await page.update({ status: LANDING_PAGE_STATUS.PAUSED });
  await logActivity({
    landingPageId: page.id,
    businessId,
    activityType: LANDING_PAGE_ACTIVITY_TYPES.PAUSED,
    message: `Landing page "${page.title}" đã tạm dừng`,
  });
  return formatLandingPage(await assertOwnedPage(businessId, page.id));
}

export async function closeLandingPage({ businessId, pageId }) {
  const page = await assertOwnedPage(businessId, pageId);
  await page.update({ status: LANDING_PAGE_STATUS.CLOSED });
  await logActivity({
    landingPageId: page.id,
    businessId,
    activityType: LANDING_PAGE_ACTIVITY_TYPES.CLOSED,
    message: `Landing page "${page.title}" đã đóng`,
  });
  return formatLandingPage(await assertOwnedPage(businessId, page.id));
}

export async function getLandingPageDashboard({ businessId }) {
  const pages = await BusinessLandingPage.findAll({
    where: { businessId },
    attributes: ['viewsCount', 'formSubmissionsCount', 'candidatesCount', 'status'],
  });

  const totals = pages.reduce(
    (acc, p) => ({
      views: acc.views + (p.viewsCount || 0),
      forms: acc.forms + (p.formSubmissionsCount || 0),
      candidates: acc.candidates + (p.candidatesCount || 0),
      active: acc.active + (Number(p.status) === LANDING_PAGE_STATUS.ACTIVE ? 1 : 0),
    }),
    { views: 0, forms: 0, candidates: 0, active: 0 },
  );

  const conversionRate = totals.views > 0
    ? Number(((totals.forms / totals.views) * 100).toFixed(1))
    : 0;

  const recent = await listLandingPagesForBusiness({ businessId, page: 1, limit: 5 });
  const activities = await BusinessLandingPageActivity.findAll({
    where: { businessId },
    order: [['created_at', 'DESC']],
    limit: 10,
  });

  return {
    stats: {
      views: totals.views,
      formSubmissions: totals.forms,
      candidates: totals.candidates,
      conversionRate,
      activePages: totals.active,
      totalPages: pages.length,
    },
    recentLandingPages: recent.landingPages,
    activities: activities.map((a) => ({
      id: a.id,
      type: a.activityType,
      message: a.message,
      landingPageId: a.landingPageId,
      createdAt: a.createdAt,
    })),
  };
}

export async function getPublicLandingPageBySlug(slug, { trackView = true } = {}) {
  const page = await BusinessLandingPage.findOne({
    where: {
      slug,
      status: LANDING_PAGE_STATUS.ACTIVE,
    },
    include: [
      {
        model: Business,
        as: 'business',
        required: true,
        attributes: ['id', 'companyName', 'companyNameEn', 'website'],
      },
      {
        model: Job,
        as: 'job',
        required: false,
        attributes: ['id', 'title', 'titleEn', 'titleJp', 'jobCode', 'slug', 'description'],
      },
    ],
  });

  if (!page) {
    const err = new Error('Landing page không tồn tại hoặc chưa được phát hành');
    err.statusCode = 404;
    throw err;
  }

  if (trackView) {
    const newViews = (page.viewsCount || 0) + 1;
    await page.update({ viewsCount: newViews });
    const milestones = [100, 500, 1000, 5000];
    if (milestones.includes(newViews)) {
      await logActivity({
        landingPageId: page.id,
        businessId: page.businessId,
        activityType: LANDING_PAGE_ACTIVITY_TYPES.VIEW_MILESTONE,
        message: `Landing page "${page.title}" vượt ${newViews} lượt xem`,
        metadata: { views: newViews },
      });
    }
  }

  const formatted = formatLandingPage(page);
  return {
    ...formatted,
    seo: {
      title: page.metaTitle || page.ogTitle || page.title,
      description: page.metaDescription || page.ogDescription || '',
      keywords: page.metaKeywords || '',
      image: page.metaImage || null,
      ogTitle: page.ogTitle || page.metaTitle || page.title,
      ogDescription: page.ogDescription || page.metaDescription || '',
      canonicalPath: getPublicLandingPagePath(page.slug),
    },
  };
}

export async function submitPublicLandingPageForm(slug, formData) {
  const page = await BusinessLandingPage.findOne({
    where: { slug, status: LANDING_PAGE_STATUS.ACTIVE },
  });
  if (!page) {
    const err = new Error('Landing page không khả dụng');
    err.statusCode = 404;
    throw err;
  }

  const name = String(formData.name || formData.applicantName || '').trim();
  const email = String(formData.email || formData.applicantEmail || '').trim();
  if (!name || !email) {
    const err = new Error('Vui lòng nhập họ tên và email');
    err.statusCode = 400;
    throw err;
  }

  const submission = await BusinessLandingPageSubmission.create({
    landingPageId: page.id,
    businessId: page.businessId,
    jobId: page.jobId,
    applicantName: name,
    applicantEmail: email,
    applicantPhone: formData.phone || formData.applicantPhone || null,
    message: formData.message || null,
    payloadJson: formData,
  });

  await page.update({
    formSubmissionsCount: (page.formSubmissionsCount || 0) + 1,
    candidatesCount: (page.candidatesCount || 0) + 1,
  });

  await logActivity({
    landingPageId: page.id,
    businessId: page.businessId,
    activityType: LANDING_PAGE_ACTIVITY_TYPES.FORM_SUBMITTED,
    message: `Có form ứng tuyển mới từ landing page "${page.title}"`,
    metadata: { submissionId: submission.id, applicantName: name },
  });

  return { success: true, submissionId: submission.id };
}

export async function listLandingPageSubmissions({ businessId, pageId, page = 1, limit = 20 }) {
  await assertOwnedPage(businessId, pageId);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const { count, rows } = await BusinessLandingPageSubmission.findAndCountAll({
    where: { landingPageId: pageId, businessId },
    order: [['created_at', 'DESC']],
    limit: safeLimit,
    offset,
  });

  return {
    submissions: rows.map((r) => ({
      id: r.id,
      applicantName: r.applicantName,
      applicantEmail: r.applicantEmail,
      applicantPhone: r.applicantPhone,
      message: r.message,
      createdAt: r.createdAt,
    })),
    pagination: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 0,
    },
  };
}

export default {
  listLandingPageTemplates,
  createCompanyLandingPage,
  createLandingPageFromJob,
  listLandingPagesForBusiness,
  getLandingPageForBusiness,
  updateLandingPageForBusiness,
  publishLandingPage,
  pauseLandingPage,
  closeLandingPage,
  getLandingPageDashboard,
  getPublicLandingPageBySlug,
  submitPublicLandingPageForm,
  listLandingPageSubmissions,
};
