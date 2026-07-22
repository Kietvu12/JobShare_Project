import express from 'express';
import { publicCandidateChatController } from '../controllers/public/publicCandidateChatController.js';
import { uploadMessageAttachment } from '../middleware/messageAttachmentUploadMiddleware.js';

const router = express.Router();

router.post('/sessions', publicCandidateChatController.ensureSession);
router.get('/messages', publicCandidateChatController.getMessages);
router.post('/messages', uploadMessageAttachment, publicCandidateChatController.postMessage);
router.get('/stream', publicCandidateChatController.stream);

export default router;
