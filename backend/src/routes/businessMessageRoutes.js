import express from 'express';
import multer from 'multer';
import { authenticateBusiness } from '../middleware/businessAuth.js';
import { businessMessageController } from '../controllers/business/businessMessageController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.use(authenticateBusiness);

router.get('/job-application/:jobApplicationId', businessMessageController.getMessagesByJobApplication);
router.post('/', upload.single('attachment'), businessMessageController.createMessage);

export default router;
