import {
  approveScoutPerformanceRequest,
  listScoutPerformanceRequests,
  rejectScoutPerformanceRequest,
} from '../../services/scoutPerformanceService.js';

function handleError(res, error, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
}

export const adminScoutPerformanceController = {
  list: async (req, res, next) => {
    try {
      const { page, limit, status, search } = req.query;
      const data = await listScoutPerformanceRequests({ page, limit, status, search });
      res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  approve: async (req, res, next) => {
    try {
      const requestId = parseInt(req.params.id, 10);
      if (Number.isNaN(requestId)) {
        return res.status(400).json({ success: false, message: 'ID yêu cầu không hợp lệ' });
      }
      const { note } = req.body || {};
      const request = await approveScoutPerformanceRequest({
        requestId,
        adminId: req.admin.id,
        note,
      });
      res.json({
        success: true,
        message: 'Đã duyệt yêu cầu Scout Performance',
        data: { request },
      });
    } catch (error) {
      return handleError(res, error, next);
    }
  },

  reject: async (req, res, next) => {
    try {
      const requestId = parseInt(req.params.id, 10);
      if (Number.isNaN(requestId)) {
        return res.status(400).json({ success: false, message: 'ID yêu cầu không hợp lệ' });
      }
      const { note } = req.body || {};
      const request = await rejectScoutPerformanceRequest({
        requestId,
        adminId: req.admin.id,
        note,
      });
      res.json({
        success: true,
        message: 'Đã từ chối yêu cầu Scout Performance',
        data: { request },
      });
    } catch (error) {
      return handleError(res, error, next);
    }
  },
};

export default adminScoutPerformanceController;
