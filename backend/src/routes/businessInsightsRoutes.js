import express from 'express';
import { authenticateBusiness } from '../middleware/businessAuth.js';
import { businessInsightsController } from '../controllers/business/businessInsightsController.js';
import { getBusinessRecruitmentHealth } from '../services/businessInsightsService.js';

const router = express.Router();

router.use(authenticateBusiness);
router.get('/report', businessInsightsController.getReport);
router.get('/recruitment-health', async (req, res, next) => {
  try {
    const data = await getBusinessRecruitmentHealth(req.business.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
