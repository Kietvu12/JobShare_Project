import {
  getBusinessBillingDashboard,
  listBusinessBillingTransactions,
  listBusinessBillingRequests,
  listBusinessBillingInvoices,
} from '../../services/businessBillingService.js';
import {
  createBusinessCreditRequest,
  listBusinessCreditRequests,
  getBusinessCreditRequestById,
  updateBusinessCreditRequest,
  cancelBusinessCreditRequest,
} from '../../services/businessCreditRequestService.js';

function handleServiceError(res, error, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
}

export const businessBillingController = {
  getDashboard: async (req, res, next) => {
    try {
      const data = await getBusinessBillingDashboard({
        businessId: req.business.id,
        credit: req.business.credit,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getTransactions: async (req, res, next) => {
    try {
      const data = await listBusinessBillingTransactions({
        businessId: req.business.id,
        page: req.query.page,
        limit: req.query.limit,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getRequests: async (req, res, next) => {
    try {
      const data = await listBusinessBillingRequests({
        businessId: req.business.id,
        page: req.query.page,
        limit: req.query.limit,
        tab: req.query.tab,
        type: req.query.type,
        search: req.query.search,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getInvoices: async (req, res, next) => {
    try {
      const data = await listBusinessBillingInvoices({
        businessId: req.business.id,
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  createCreditRequest: async (req, res, next) => {
    try {
      const { amount, note, paymentMethod } = req.body || {};
      const request = await createBusinessCreditRequest({
        businessId: req.business.id,
        amount,
        note,
        paymentMethod,
      });
      res.status(201).json({
        success: true,
        message: 'Đã gửi yêu cầu nạp credit. WS sẽ xử lý trong thời gian sớm nhất.',
        data: { request },
      });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  getCreditRequests: async (req, res, next) => {
    try {
      const data = await listBusinessCreditRequests({
        businessId: req.business.id,
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getCreditRequestById: async (req, res, next) => {
    try {
      const request = await getBusinessCreditRequestById({
        requestId: req.params.id,
        businessId: req.business.id,
      });
      res.json({ success: true, data: { request } });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  updateCreditRequest: async (req, res, next) => {
    try {
      const { amount, note, paymentMethod } = req.body || {};
      const request = await updateBusinessCreditRequest({
        requestId: req.params.id,
        businessId: req.business.id,
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

  cancelCreditRequest: async (req, res, next) => {
    try {
      const request = await cancelBusinessCreditRequest({
        requestId: req.params.id,
        businessId: req.business.id,
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

export default businessBillingController;
