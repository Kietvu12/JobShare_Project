import express from 'express';
import { authenticate, isSuperAdminOrBackoffice } from '../middleware/auth.js';
import { adminScoutPerformanceController } from '../controllers/admin/scoutPerformanceController.js';

const router = express.Router();

router.use(authenticate, isSuperAdminOrBackoffice);

router.get('/performance-requests', adminScoutPerformanceController.list);
router.post('/performance-requests/:id/approve', adminScoutPerformanceController.approve);
router.post('/performance-requests/:id/reject', adminScoutPerformanceController.reject);

export default router;
