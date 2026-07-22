import express from 'express';
import { adminPublicCandidateChatController } from '../controllers/admin/adminPublicCandidateChatController.js';
import { authenticate, authenticateOrQueryToken, isSuperAdminOrBackoffice } from '../middleware/auth.js';
import { uploadMessageAttachment } from '../middleware/messageAttachmentUploadMiddleware.js';

const router = express.Router();

router.get(
  '/sessions',
  authenticate,
  isSuperAdminOrBackoffice,
  adminPublicCandidateChatController.listSessions
);
router.get(
  '/sessions/:sessionId/messages',
  authenticate,
  isSuperAdminOrBackoffice,
  adminPublicCandidateChatController.getMessages
);
router.post(
  '/sessions/:sessionId/mark-read',
  authenticate,
  isSuperAdminOrBackoffice,
  adminPublicCandidateChatController.markRead
);
router.post(
  '/sessions/:sessionId/messages',
  authenticate,
  isSuperAdminOrBackoffice,
  uploadMessageAttachment,
  adminPublicCandidateChatController.postMessage
);
router.get(
  '/unread-summary',
  authenticate,
  isSuperAdminOrBackoffice,
  adminPublicCandidateChatController.unreadSummary
);
router.get(
  '/inbox-stream',
  authenticateOrQueryToken,
  isSuperAdminOrBackoffice,
  adminPublicCandidateChatController.inboxStream
);

export default router;
