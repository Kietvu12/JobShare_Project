import {
  expressCtvInterest,
  getCtvMarketplaceStats,
  listCtvMarketplaceJobs,
} from '../../services/candidateSharingService.js';

export const ctvCandidateSharingController = {
  getStats: async (req, res, next) => {
    try {
      const stats = await getCtvMarketplaceStats({ collaboratorId: req.collaborator.id });
      res.json({ success: true, data: stats });
    } catch (e) {
      next(e);
    }
  },

  listJobs: async (req, res, next) => {
    try {
      const data = await listCtvMarketplaceJobs({
        collaboratorId: req.collaborator.id,
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  expressInterest: async (req, res, next) => {
    try {
      const result = await expressCtvInterest({
        listingId: req.params.id,
        collaboratorId: req.collaborator.id,
      });
      res.json({ success: true, data: result, message: 'Đã ghi nhận quan tâm' });
    } catch (e) {
      next(e);
    }
  },
};

export default ctvCandidateSharingController;
