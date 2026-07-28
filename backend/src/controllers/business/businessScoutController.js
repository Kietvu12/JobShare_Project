import { Business } from '../../models/index.js';
import {
  getScoutCandidateForBusiness,
  getUnlockedCandidateForBusiness,
  listScoutCandidatesForBusiness,
  listUnlockedCandidatesForBusiness,
  unlockScoutCandidateForBusiness,
} from '../../services/businessScoutService.js';
import { getScoutCreditCost } from '../../services/scoutCreditService.js';
import {
  createScoutPerformanceRequest,
  getScoutPerformanceRequestDetail,
  listScoutPerformanceRequests,
  markScoutPerformanceRequestViewed,
  requestSimilarScoutPerformanceCandidates,
  setScoutPerformanceExploreStatus,
} from '../../services/scoutPerformanceService.js';

function handleServiceError(res, error, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
}

export const businessScoutController = {
  /**
   * GET /api/business/scout/candidates
   */
  listCandidates: async (req, res, next) => {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      const data = await listScoutCandidatesForBusiness({
        businessId: req.business.id,
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: {
          ...data,
          credit: Number(req.business.credit) || 0,
        },
      });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  /**
   * GET /api/business/scout/unlocked-candidates
   */
  listUnlockedCandidates: async (req, res, next) => {
    try {
      const { page, limit, search, pipelineStatus, sortBy, sortOrder } = req.query;
      const data = await listUnlockedCandidatesForBusiness({
        businessId: req.business.id,
        page,
        limit,
        search,
        pipelineStatus,
        sortBy,
        sortOrder,
      });

      res.json({ success: true, data });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  /**
   * GET /api/business/scout/unlocked-candidates/:id
   */
  getUnlockedCandidate: async (req, res, next) => {
    try {
      const cvId = parseInt(req.params.id, 10);
      if (Number.isNaN(cvId)) {
        return res.status(400).json({ success: false, message: 'ID hồ sơ không hợp lệ' });
      }

      const data = await getUnlockedCandidateForBusiness({
        businessId: req.business.id,
        cvId,
      });

      res.json({ success: true, data });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  /**
   * GET /api/business/scout/candidates/:id
   */
  getCandidate: async (req, res, next) => {
    try {
      const cvId = parseInt(req.params.id, 10);
      if (Number.isNaN(cvId)) {
        return res.status(400).json({ success: false, message: 'ID hồ sơ không hợp lệ' });
      }

      const { search } = req.query;
      const data = await getScoutCandidateForBusiness({
        businessId: req.business.id,
        cvId,
        search,
      });

      res.json({
        success: true,
        data: {
          ...data,
          credit: Number(req.business.credit) || 0,
        },
      });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  /**
   * POST /api/business/scout/candidates/:id/unlock
   */
  unlockCandidate: async (req, res, next) => {
    try {
      const cvId = parseInt(req.params.id, 10);
      if (Number.isNaN(cvId)) {
        return res.status(400).json({ success: false, message: 'ID hồ sơ không hợp lệ' });
      }

      const result = await unlockScoutCandidateForBusiness({
        businessId: req.business.id,
        cvId,
      });

      const business = await Business.findByPk(req.business.id, {
        attributes: ['id', 'credit'],
      });

      res.json({
        success: true,
        message: result.alreadyUnlocked
          ? 'Hồ sơ đã được mở trước đó'
          : 'Đã mở hồ sơ bằng Scout Credit',
        data: {
          candidate: result.candidate,
          scoutCreditCost: result.scoutCreditCost,
          creditCost: result.creditCost,
          alreadyUnlocked: result.alreadyUnlocked,
          unlockedAt: result.unlockedAt,
          credit: Number(business?.credit) || 0,
        },
      });
    } catch (error) {
      if (error.message?.includes('credit') || error.message?.includes('Credit')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return handleServiceError(res, error, next);
    }
  },

  /**
   * POST /api/business/scout/candidates/:id/performance-request
   */
  createPerformanceRequest: async (req, res, next) => {
    try {
      const cvId = parseInt(req.params.id, 10);
      if (Number.isNaN(cvId)) {
        return res.status(400).json({ success: false, message: 'ID hồ sơ không hợp lệ' });
      }
      const { message } = req.body || {};
      const request = await createScoutPerformanceRequest({
        businessId: req.business.id,
        cvId,
        message,
      });
      res.json({
        success: true,
        message: 'Đã mở hồ sơ bằng Scout Performance.',
        data: { request },
      });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  requestSimilarCandidates: async (req, res, next) => {
    try {
      const requestId = parseInt(req.params.id, 10);
      if (Number.isNaN(requestId)) {
        return res.status(400).json({ success: false, message: 'ID yêu cầu không hợp lệ' });
      }
      const { message } = req.body || {};
      const request = await requestSimilarScoutPerformanceCandidates({
        businessId: req.business.id,
        requestId,
        message,
      });
      res.json({
        success: true,
        message: 'Đã gửi yêu cầu tìm thêm ứng viên tương tự. JobShare WS sẽ trao đổi qua Tin nhắn.',
        data: { request },
      });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  /**
   * GET /api/business/scout/performance-requests
   */
  listPerformanceRequests: async (req, res, next) => {
    try {
      const { page, limit, status } = req.query;
      const data = await listScoutPerformanceRequests({
        page,
        limit,
        status,
        businessId: req.business.id,
      });
      res.json({ success: true, data });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  getPerformanceRequest: async (req, res, next) => {
    try {
      const requestId = parseInt(req.params.id, 10);
      if (Number.isNaN(requestId)) {
        return res.status(400).json({ success: false, message: 'ID yêu cầu không hợp lệ' });
      }
      const request = await getScoutPerformanceRequestDetail({
        requestId,
        businessId: req.business.id,
      });
      res.json({ success: true, data: { request } });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  markPerformanceRequestViewed: async (req, res, next) => {
    try {
      const requestId = parseInt(req.params.id, 10);
      if (Number.isNaN(requestId)) {
        return res.status(400).json({ success: false, message: 'ID yêu cầu không hợp lệ' });
      }
      const data = await markScoutPerformanceRequestViewed({
        requestId,
        businessId: req.business.id,
      });
      res.json({ success: true, data });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  setPerformanceExploreStatus: async (req, res, next) => {
    try {
      const requestId = parseInt(req.params.id, 10);
      if (Number.isNaN(requestId)) {
        return res.status(400).json({ success: false, message: 'ID yêu cầu không hợp lệ' });
      }
      const { action } = req.body || {};
      const data = await setScoutPerformanceExploreStatus({
        requestId,
        businessId: req.business.id,
        action,
      });
      res.json({
        success: true,
        message: action === 'interested'
          ? 'Cảm ơn bạn. JobShare WS sẽ liên hệ hỗ trợ thêm.'
          : 'Đã ghi nhận phản hồi của bạn.',
        data,
      });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },

  /**
   * GET /api/business/scout/settings
   */
  getSettings: async (req, res, next) => {
    try {
      const scoutCreditCost = await getScoutCreditCost();
      res.json({
        success: true,
        data: {
          scoutCreditCost,
          credit: Number(req.business.credit) || 0,
        },
      });
    } catch (error) {
      return handleServiceError(res, error, next);
    }
  },
};

export default businessScoutController;
