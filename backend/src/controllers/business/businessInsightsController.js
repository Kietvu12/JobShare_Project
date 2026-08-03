import { getBusinessInsightsReport, getBusinessRecruitmentHealth } from '../../services/businessInsightsService.js';

export const businessInsightsController = {
  getReport: async (req, res, next) => {
    try {
      const { from, to, period, departmentId } = req.query || {};
      const data = await getBusinessInsightsReport({
        businessId: req.business.id,
        from,
        to,
        period,
        departmentId,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getRecruitmentHealth: async (req, res, next) => {
    try {
      const data = await getBusinessRecruitmentHealth(req.business.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};

export default businessInsightsController;
