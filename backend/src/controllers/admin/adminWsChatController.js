import {
  getWsChatSessionForAdmin,
  listWsChatMessagesForAdmin,
  listWsChatSessionsForAdmin,
  searchWsChatCandidateMentions,
  sendWsChatMessageFromAdmin,
  acceptPerformanceRequestInChat,
  rejectPerformanceRequestInChat,
  getWsChatSessionByPerformanceRequestId,
} from '../../services/businessWsChatService.js';

export const adminWsChatController = {
  listSessions: async (req, res, next) => {
    try {
      const data = await listWsChatSessionsForAdmin({
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
      const session = await getWsChatSessionForAdmin({ sessionId: req.params.id });
      res.json({ success: true, data: { session } });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  listMessages: async (req, res, next) => {
    try {
      const messages = await listWsChatMessagesForAdmin({ sessionId: req.params.id });
      res.json({ success: true, data: { messages } });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  searchCandidates: async (req, res, next) => {
    try {
      const candidates = await searchWsChatCandidateMentions({
        search: req.query.search,
        limit: req.query.limit,
      });
      res.json({ success: true, data: { candidates } });
    } catch (error) {
      next(error);
    }
  },

  getSessionByPerformanceRequest: async (req, res, next) => {
    try {
      const session = await getWsChatSessionByPerformanceRequestId({
        requestId: req.params.requestId,
      });
      res.json({ success: true, data: { session } });
    } catch (error) {
      next(error);
    }
  },

  sendMessage: async (req, res, next) => {
    try {
      const cvIds = Array.isArray(req.body.cvIds) ? req.body.cvIds : [];
      const message = await sendWsChatMessageFromAdmin({
        sessionId: req.params.id,
        adminId: req.user.id,
        content: req.body.content,
        cvIds,
      });
      res.json({ success: true, data: { message }, message: 'Đã gửi tin nhắn' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  acceptPerformanceRequest: async (req, res, next) => {
    try {
      const cvIds = Array.isArray(req.body.cvIds) ? req.body.cvIds : [];
      const data = await acceptPerformanceRequestInChat({
        sessionId: req.params.id,
        adminId: req.user.id,
        cvIds,
        note: req.body.note,
      });
      res.json({ success: true, data, message: 'Đã chấp nhận yêu cầu Scout Performance' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  rejectPerformanceRequest: async (req, res, next) => {
    try {
      const data = await rejectPerformanceRequestInChat({
        sessionId: req.params.id,
        adminId: req.user.id,
        note: req.body.note,
      });
      res.json({ success: true, data, message: 'Đã từ chối yêu cầu Scout Performance' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};
