import express from 'express';
import { adminPublicCtvChatController } from '../controllers/admin/adminPublicCtvChatController.js';
import { authenticate, authenticateOrQueryToken, isSuperAdminOrBackoffice } from '../middleware/auth.js';
import { uploadMessageAttachment } from '../middleware/messageAttachmentUploadMiddleware.js';

const router = express.Router();

router.get(
  '/search-collaborators',
  authenticate,
  isSuperAdminOrBackoffice,
  adminPublicCtvChatController.searchCollaborators
);
router.get(
  '/sessions',
  authenticate,
  isSuperAdminOrBackoffice,
  adminPublicCtvChatController.listSessions
);
router.post(
  '/sessions',
  authenticate,
  isSuperAdminOrBackoffice,
  adminPublicCtvChatController.createSession
);
router.get(
  '/sessions/:sessionId/messages',
  authenticate,
  isSuperAdminOrBackoffice,
  adminPublicCtvChatController.getMessages
);
router.post(
  '/sessions/:sessionId/mark-read',
  authenticate,
  isSuperAdminOrBackoffice,
  adminPublicCtvChatController.markRead
);
router.post(
  '/sessions/:sessionId/messages',
  authenticate,
  isSuperAdminOrBackoffice,
  uploadMessageAttachment,
  adminPublicCtvChatController.postMessage
);
router.get(
  '/unread-summary',
  authenticate,
  isSuperAdminOrBackoffice,
  adminPublicCtvChatController.unreadSummary
);
router.get(
  '/inbox-stream',
  authenticateOrQueryToken,
  isSuperAdminOrBackoffice,
  adminPublicCtvChatController.inboxStream
);

export default router;
