import express from 'express';
import { publicCtvChatController } from '../controllers/public/publicCtvChatController.js';
import { optionalAuthenticateCTV } from '../middleware/ctvAuth.js';
import { uploadMessageAttachment } from '../middleware/messageAttachmentUploadMiddleware.js';

const router = express.Router();

router.post('/sessions', optionalAuthenticateCTV, publicCtvChatController.ensureSession);
router.get('/messages', optionalAuthenticateCTV, publicCtvChatController.getMessages);
router.get('/unread-summary', optionalAuthenticateCTV, publicCtvChatController.unreadSummary);
router.post('/mark-read', optionalAuthenticateCTV, publicCtvChatController.markRead);
router.post('/messages', optionalAuthenticateCTV, uploadMessageAttachment, publicCtvChatController.postMessage);
router.get('/stream', optionalAuthenticateCTV, publicCtvChatController.stream);

export default router;
