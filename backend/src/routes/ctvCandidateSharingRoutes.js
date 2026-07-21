import express from 'express';
import { ctvCandidateSharingController } from '../controllers/collaborator/ctvCandidateSharingController.js';
import { authenticateCTV } from '../middleware/ctvAuth.js';

const router = express.Router();
router.use(authenticateCTV);

router.get('/stats', ctvCandidateSharingController.getStats);
router.get('/jobs', ctvCandidateSharingController.listJobs);
router.post('/jobs/:id/interest', ctvCandidateSharingController.expressInterest);

export default router;
