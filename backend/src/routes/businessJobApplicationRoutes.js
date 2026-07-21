import express from 'express';
import { authenticateBusiness } from '../middleware/businessAuth.js';
import { businessJobApplicationController } from '../controllers/business/businessJobApplicationController.js';

const router = express.Router();

router.use(authenticateBusiness);

router.get('/stats', businessJobApplicationController.getStats);
router.get('/', businessJobApplicationController.listApplications);
router.get('/:id/cv-file-list', businessJobApplicationController.getCvFileList);
router.get('/:id/cv', businessJobApplicationController.getCv);
router.patch('/:id/status', businessJobApplicationController.updateStatus);
router.get('/:id', businessJobApplicationController.getById);

export default router;
