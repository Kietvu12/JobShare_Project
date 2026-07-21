import {
  closeLandingPage,
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
      const { jobId, templateKey, title } = req.body || {};
      const parsedJobId = parseInt(jobId, 10);
      if (Number.isNaN(parsedJobId)) {
        return res.status(400).json({ success: false, message: 'jobId là bắt buộc' });
      }
      const landingPage = await createLandingPageFromJob({
        businessId: req.business.id,
        jobId: parsedJobId,
        templateKey,
        title,
      });
      res.status(201).json({
        success: true,
        message: 'Đã tạo landing page (nháp). Chỉnh sửa và publish để phát hành.',
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
};

export default businessLandingPageController;
