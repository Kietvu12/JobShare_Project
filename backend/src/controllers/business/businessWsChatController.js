import {
  getWsChatSessionForBusiness,
  getWsChatSessionByPerformanceRequestId,
  listWsChatMessagesForBusiness,
  listWsChatSessionsForBusiness,
  sendWsChatMessageFromBusiness,
  syncAllPendingCreditRequestsForBusiness,
  createBusinessServiceRequest,
} from '../../services/businessWsChatService.js';

export const businessWsChatController = {
  listSessions: async (req, res, next) => {
    try {
      const data = await listWsChatSessionsForBusiness({
        businessId: req.business.id,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getSession: async (req, res, next) => {
    try {
      const session = await getWsChatSessionForBusiness({
        sessionId: req.params.id,
        businessId: req.business.id,
      });
      res.json({ success: true, data: { session } });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  getSessionByPerformanceRequest: async (req, res, next) => {
    try {
      const session = await getWsChatSessionByPerformanceRequestId({
        requestId: req.params.requestId,
        businessId: req.business.id,
      });
      res.json({ success: true, data: { session } });
    } catch (error) {
      next(error);
    }
  },

  listMessages: async (req, res, next) => {
    try {
      const messages = await listWsChatMessagesForBusiness({
        sessionId: req.params.id,
        businessId: req.business.id,
      });
      res.json({ success: true, data: { messages } });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  sendMessage: async (req, res, next) => {
    try {
      const message = await sendWsChatMessageFromBusiness({
        sessionId: req.params.id,
        businessId: req.business.id,
        content: req.body.content,
      });
      res.json({ success: true, data: { message }, message: 'Đã gửi tin nhắn' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  syncCreditRequests: async (req, res, next) => {
    try {
      const result = await syncAllPendingCreditRequestsForBusiness({ businessId: req.business.id });
      res.json({ success: true, data: result, message: 'Đã đồng bộ yêu cầu credit vào chat' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  createServiceRequest: async (req, res, next) => {
    try {
      const body = req.body || {};
      const serviceKey = body.serviceKey ?? body.service_key;
      const serviceTitle = body.serviceTitle ?? body.service_title;
      const note = body.note;
      const data = await createBusinessServiceRequest({
        businessId: req.business.id,
        serviceKey,
        serviceTitle,
        note,
      });
      res.status(201).json({
        success: true,
        message: 'Đã gửi yêu cầu dịch vụ. WS sẽ liên hệ xác nhận trong thời gian sớm nhất.',
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
