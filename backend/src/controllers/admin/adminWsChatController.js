import {
  getWsChatSessionForAdmin,
  listWsChatMessagesForAdmin,
  listWsChatSessionsForAdmin,
  searchWsChatCandidateMentions,
  sendWsChatMessageFromAdmin,
  acceptPerformanceRequestInChat,
  rejectPerformanceRequestInChat,
  acceptCreditRequestInChat,
  rejectCreditRequestInChat,
  acceptListingRequestInChat,
  rejectListingRequestInChat,
  getWsChatSessionByPerformanceRequestId,
  listScoutPerformanceCandidatesForWsSession,
  updateScoutPerformanceApproachStatusInWsChat,
} from '../../services/businessWsChatService.js';

function getAdminId(req) {
  return req.adminId || req.admin?.id || null;
}

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
        adminId: getAdminId(req),
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
        adminId: getAdminId(req),
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
        adminId: getAdminId(req),
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

  acceptCreditRequest: async (req, res, next) => {
    try {
      const data = await acceptCreditRequestInChat({
        sessionId: req.params.id,
        adminId: getAdminId(req),
        requestId: req.body.requestId,
        note: req.body.note,
      });
      res.json({ success: true, data, message: 'Đã duyệt yêu cầu nạp credit' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  rejectCreditRequest: async (req, res, next) => {
    try {
      const data = await rejectCreditRequestInChat({
        sessionId: req.params.id,
        adminId: getAdminId(req),
        requestId: req.body.requestId,
        note: req.body.note,
      });
      res.json({ success: true, data, message: 'Đã từ chối yêu cầu nạp credit' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  acceptListingRequest: async (req, res, next) => {
    try {
      const data = await acceptListingRequestInChat({
        sessionId: req.params.id,
        adminId: getAdminId(req),
        listingId: req.body.listingId,
        platformFeePercent: req.body.platformFeePercent,
        note: req.body.note,
        autoPublish: req.body.autoPublish,
      });
      res.json({ success: true, data, message: 'Đã duyệt và publish job lên Sàn CTV' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  rejectListingRequest: async (req, res, next) => {
    try {
      const data = await rejectListingRequestInChat({
        sessionId: req.params.id,
        adminId: getAdminId(req),
        listingId: req.body.listingId,
        note: req.body.note,
        rejectionReason: req.body.rejectionReason,
      });
      res.json({ success: true, data, message: 'Đã từ chối yêu cầu đăng Sàn CTV' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  listScoutPerformanceCandidates: async (req, res, next) => {
    try {
      const data = await listScoutPerformanceCandidatesForWsSession({ sessionId: req.params.id });
      res.json({ success: true, data });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  updateScoutPerformanceApproachStatus: async (req, res, next) => {
    try {
      const data = await updateScoutPerformanceApproachStatusInWsChat({
        sessionId: req.params.id,
        adminId: getAdminId(req),
        cvId: req.params.cvId,
        pipelineStatus: req.body.pipelineStatus,
      });
      res.json({
        success: true,
        data,
        message: data?.message?.content || 'Đã cập nhật trạng thái tiếp cận',
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};
