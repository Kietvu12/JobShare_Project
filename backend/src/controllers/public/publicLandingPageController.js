import {
  getPublicLandingPageBySlug,
  submitPublicLandingPageForm,
} from '../../services/businessLandingPageService.js';

function handleError(res, error, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
}

export const publicLandingPageController = {
  getBySlug: async (req, res, next) => {
    try {
      const { slug } = req.params;
      const trackView = req.query.trackView !== 'false';
      const data = await getPublicLandingPageBySlug(slug, { trackView });
      res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  submitForm: async (req, res, next) => {
    try {
      const { slug } = req.params;
      const result = await submitPublicLandingPageForm(slug, req.body || {});
      res.status(201).json({
        success: true,
        message: 'Đã gửi hồ sơ ứng tuyển thành công',
        data: result,
      });
    } catch (error) {
      return handleError(res, error, next);
    }
  },
};

export default publicLandingPageController;
