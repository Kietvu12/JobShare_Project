import {
  listAdminCreditRequests,
  getBusinessCreditRequestById,
  updateBusinessCreditRequest,
  cancelBusinessCreditRequest,
  approveBusinessCreditRequest,
  rejectBusinessCreditRequest,
} from '../../services/businessCreditRequestService.js';

function handleServiceError(res, error, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
}

export const adminCreditRequestController = {
  list: async (req, res, next) => {
    try {
      const data = await listAdminCreditRequests({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        search: req.query.search,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  approve: async (req, res, next) => {
    try {
      const request = await approveBusinessCreditRequest({
        requestId: req.params.id,
        adminId: req.adminId || req.admin?.id || null,
        adminNote: req.body?.adminNote || req.body?.note,
      });
      res.json({
        success: true,
        message: 'Đã duyệt và cộng credit cho doanh nghiệp',
        data: { request },
      });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  reject: async (req, res, next) => {
    try {
      const request = await rejectBusinessCreditRequest({
        requestId: req.params.id,
        adminId: req.adminId || req.admin?.id || null,
        adminNote: req.body?.adminNote || req.body?.note,
      });
      res.json({
        success: true,
        message: 'Đã từ chối yêu cầu nạp credit',
        data: { request },
      });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  getById: async (req, res, next) => {
    try {
      const request = await getBusinessCreditRequestById({
        requestId: req.params.id,
      });
      res.json({ success: true, data: { request } });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  update: async (req, res, next) => {
    try {
      const { amount, note, paymentMethod } = req.body || {};
      const request = await updateBusinessCreditRequest({
        requestId: req.params.id,
        amount,
        note,
        paymentMethod,
      });
      res.json({
        success: true,
        message: 'Đã cập nhật yêu cầu nạp credit',
        data: { request },
      });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  cancel: async (req, res, next) => {
    try {
      const request = await cancelBusinessCreditRequest({
        requestId: req.params.id,
        adminId: req.adminId || req.admin?.id || null,
      });
      res.json({
        success: true,
        message: 'Đã hủy yêu cầu nạp credit',
        data: { request },
      });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },
};

export default adminCreditRequestController;
