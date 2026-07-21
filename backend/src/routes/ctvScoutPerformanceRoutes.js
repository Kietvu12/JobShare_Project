import express from 'express';
import { authenticateCTV } from '../middleware/ctvAuth.js';
import { ctvScoutPerformanceController } from '../controllers/collaborator/scoutPerformanceController.js';

const router = express.Router();

router.use(authenticateCTV);

router.get('/performance-requests', ctvScoutPerformanceController.list);
router.post('/performance-requests/:id/approve', ctvScoutPerformanceController.approve);
router.post('/performance-requests/:id/reject', ctvScoutPerformanceController.reject);

export default router;
