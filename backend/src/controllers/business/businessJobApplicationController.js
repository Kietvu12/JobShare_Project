import {
  getBusinessJobApplicationById,
  getBusinessJobApplicationStats,
  listBusinessJobApplications,
  getBusinessApplicationCv,
  getBusinessApplicationCvFileList,
  updateBusinessJobApplicationStatus,
} from '../../services/businessJobApplicationService.js';

export const businessJobApplicationController = {
  listApplications: async (req, res, next) => {
    try {
      const data = await listBusinessJobApplications({
        businessId: req.business.id,
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        jobId: req.query.jobId,
        status: req.query.status,
        tab: req.query.tab,
        sourceType: req.query.sourceType,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        onlyUnreadMessages: req.query.onlyUnreadMessages,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getStats: async (req, res, next) => {
    try {
      const stats = await getBusinessJobApplicationStats({ businessId: req.business.id });
      res.json({ success: true, data: { stats } });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const application = await getBusinessJobApplicationById({
        businessId: req.business.id,
        applicationId: parseInt(req.params.id, 10),
      });
      if (!application) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn tiến cử' });
      }
      res.json({ success: true, data: { application } });
    } catch (error) {
      next(error);
    }
  },

  getCv: async (req, res, next) => {
    try {
      const data = await getBusinessApplicationCv({
        businessId: req.business.id,
        applicationId: parseInt(req.params.id, 10),
      });
      res.json({ success: true, data });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  getCvFileList: async (req, res, next) => {
    try {
      const { originals, templates } = await getBusinessApplicationCvFileList({
        businessId: req.business.id,
        applicationId: parseInt(req.params.id, 10),
        req,
      });
      res.json({ success: true, data: { originals, templates } });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  updateStatus: async (req, res, next) => {
    try {
      const { status, rejectNote, paymentAmount, interviewDate } = req.body;
      if (status === undefined) {
        return res.status(400).json({ success: false, message: 'Trạng thái là bắt buộc' });
      }
      const data = await updateBusinessJobApplicationStatus({
        businessId: req.business.id,
        applicationId: parseInt(req.params.id, 10),
        status,
        rejectNote,
        paymentAmount,
        interviewDate,
      });
      res.json({
        success: true,
        message: 'Cập nhật trạng thái đơn tiến cử thành công',
        data,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

export default businessJobApplicationController;
