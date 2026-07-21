import express from 'express';
import { businessScoutController } from '../controllers/business/businessScoutController.js';
import { authenticateBusiness } from '../middleware/businessAuth.js';

const router = express.Router();

router.use(authenticateBusiness);

router.get('/settings', businessScoutController.getSettings);
router.get('/unlocked-candidates', businessScoutController.listUnlockedCandidates);
router.get('/unlocked-candidates/:id', businessScoutController.getUnlockedCandidate);
router.get('/performance-requests', businessScoutController.listPerformanceRequests);
router.get('/candidates', businessScoutController.listCandidates);
router.get('/candidates/:id', businessScoutController.getCandidate);
router.post('/candidates/:id/performance-request', businessScoutController.createPerformanceRequest);
router.post('/candidates/:id/unlock', businessScoutController.unlockCandidate);

export default router;
