import express from 'express';
import { adminCandidateSharingController } from '../controllers/business/businessCandidateSharingController.js';
import { authenticate, isSuperAdminOrBackoffice } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, isSuperAdminOrBackoffice);

router.get('/listings', adminCandidateSharingController.listListings);
router.post('/listings/:id/approve', adminCandidateSharingController.approve);
router.post('/listings/:id/reject', adminCandidateSharingController.reject);
router.post('/listings/:id/pause', adminCandidateSharingController.pause);
router.post('/listings/:id/publish', adminCandidateSharingController.publish);

export default router;
