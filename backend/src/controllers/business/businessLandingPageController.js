import {
  closeLandingPage,
  createCompanyLandingPage,
  createLandingPageFromJob,
  getLandingPageDashboard,
  getLandingPageForBusiness,
  listLandingPageSubmissions,
  listLandingPageTemplates,
  listLandingPagesForBusiness,
  pauseLandingPage,
  publishLandingPage,
  updateLandingPageForBusiness,
} from '../../services/businessLandingPageService.js';
import fs from 'fs/promises';
import path from 'path';
import config from '../../config/index.js';
import {
  s3Enabled,
  uploadBufferToS3,
  getSignedUrlForFile,
  buildLandingPageMediaKey,
} from '../../services/s3Service.js';

function handleError(res, error, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
}

export const businessLandingPageController = {
  getTemplates: async (_req, res) => {
    res.json({ success: true, data: { templates: listLandingPageTemplates() } });
  },

  getDashboard: async (req, res, next) => {
    try {
      const data = await getLandingPageDashboard({ businessId: req.business.id });
      res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  list: async (req, res, next) => {
    try {
      const { page, limit, status, search } = req.query;
      const data = await listLandingPagesForBusiness({
        businessId: req.business.id,
        page,
        limit,
        status,
        search,
      });
      res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  getById: async (req, res, next) => {
    try {
      const pageId = parseInt(req.params.id, 10);
      if (Number.isNaN(pageId)) {
        return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
      }
      const landingPage = await getLandingPageForBusiness({ businessId: req.business.id, pageId });
      res.json({ success: true, data: { landingPage } });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  create: async (req, res, next) => {
    try {
      const { jobId, templateKey, title, content } = req.body || {};
      const parsedJobId = jobId != null && jobId !== '' ? parseInt(jobId, 10) : null;

      const landingPage = Number.isFinite(parsedJobId)
        ? await createLandingPageFromJob({
            businessId: req.business.id,
            jobId: parsedJobId,
            templateKey,
            title,
          })
        : await createCompanyLandingPage({
            businessId: req.business.id,
            templateKey,
            title,
            content,
          });

      res.status(201).json({
        success: true,
        message: Number.isFinite(parsedJobId)
          ? 'Đã tạo landing page (nháp). Chỉnh sửa và publish để phát hành.'
          : 'Đã tạo trang giới thiệu doanh nghiệp (nháp). Mở trình chỉnh sửa để tùy biến.',
        data: { landingPage },
      });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  update: async (req, res, next) => {
    try {
      const pageId = parseInt(req.params.id, 10);
      if (Number.isNaN(pageId)) {
        return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
      }
      const landingPage = await updateLandingPageForBusiness({
        businessId: req.business.id,
        pageId,
        payload: req.body || {},
      });
      res.json({ success: true, data: { landingPage } });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  publish: async (req, res, next) => {
    try {
      const pageId = parseInt(req.params.id, 10);
      const landingPage = await publishLandingPage({ businessId: req.business.id, pageId });
      res.json({ success: true, message: 'Đã phát hành landing page', data: { landingPage } });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  pause: async (req, res, next) => {
    try {
      const pageId = parseInt(req.params.id, 10);
      const landingPage = await pauseLandingPage({ businessId: req.business.id, pageId });
      res.json({ success: true, message: 'Đã tạm dừng landing page', data: { landingPage } });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  close: async (req, res, next) => {
    try {
      const pageId = parseInt(req.params.id, 10);
      const landingPage = await closeLandingPage({ businessId: req.business.id, pageId });
      res.json({ success: true, message: 'Đã đóng landing page', data: { landingPage } });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  listSubmissions: async (req, res, next) => {
    try {
      const pageId = parseInt(req.params.id, 10);
      const { page, limit } = req.query;
      const data = await listLandingPageSubmissions({
        businessId: req.business.id,
        pageId,
        page,
        limit,
      });
      res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  uploadMedia: async (req, res, next) => {
    try {
      const pageId = parseInt(req.params.id, 10);
      if (Number.isNaN(pageId)) {
        return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
      }
      await getLandingPageForBusiness({ businessId: req.business.id, pageId });

      if (!req.file?.buffer) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh' });
      }

      let url;
      let key;
      if (s3Enabled()) {
        key = buildLandingPageMediaKey(pageId, req.business.id, req.file.originalname);
        await uploadBufferToS3(req.file.buffer, key, req.file.mimetype);
        url = await getSignedUrlForFile(key, 'view');
        if (!url) url = key;
      } else {
        const uploadDir = path.join(
          process.cwd(),
          config.upload.dir,
          'landing-pages',
          String(req.business.id),
          String(pageId),
        );
        await fs.mkdir(uploadDir, { recursive: true });
        const ext = path.extname(req.file.originalname) || '.jpg';
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, req.file.buffer);
        key = `/uploads/landing-pages/${req.business.id}/${pageId}/${filename}`;
        url = key;
      }

      res.json({
        success: true,
        data: {
          url,
          key,
          name: req.file.originalname,
        },
      });
    } catch (error) {
      return handleError(res, error, next);
    }
  },
};

export default businessLandingPageController;
