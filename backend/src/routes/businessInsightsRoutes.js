import express from 'express';
import { authenticateBusiness } from '../middleware/businessAuth.js';
import { businessInsightsController } from '../controllers/business/businessInsightsController.js';

const router = express.Router();

router.use(authenticateBusiness);
router.get('/report', businessInsightsController.getReport);
router.get('/recruitment-health', businessInsightsController.getRecruitmentHealth);

export default router;
