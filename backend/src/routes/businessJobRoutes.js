import express from 'express';
import { businessJobController } from '../controllers/business/businessJobController.js';
import { jobController } from '../controllers/admin/jobController.js';
import { authenticateBusiness } from '../middleware/businessAuth.js';
import { uploadJdOriginalOptional } from '../middleware/jdOriginalUploadMiddleware.js';
import { parseMultipartJobData } from '../middleware/parseMultipartJobData.js';

const router = express.Router();

router.use(authenticateBusiness);

router.get('/', businessJobController.getJobs);
router.get('/:id', businessJobController.getJobById);
router.post('/', uploadJdOriginalOptional, parseMultipartJobData, jobController.createJob);
router.put('/:id', businessJobController.updateJob);
router.delete('/:id', businessJobController.deleteJob);

export default router;
