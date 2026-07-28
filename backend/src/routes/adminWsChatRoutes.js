import express from 'express';
import { authenticate, isSuperAdminOrBackoffice } from '../middleware/auth.js';
import { adminWsChatController } from '../controllers/admin/adminWsChatController.js';

const router = express.Router();

router.use(authenticate, isSuperAdminOrBackoffice);

router.get('/sessions/by-performance-request/:requestId', adminWsChatController.getSessionByPerformanceRequest);
router.get('/sessions', adminWsChatController.listSessions);
router.get('/cv-search', adminWsChatController.searchCandidates);
router.get('/sessions/:id', adminWsChatController.getSession);
router.get('/sessions/:id/messages', adminWsChatController.listMessages);
router.post('/sessions/:id/messages', adminWsChatController.sendMessage);
router.post('/sessions/:id/performance-request/accept', adminWsChatController.acceptPerformanceRequest);
router.post('/sessions/:id/performance-request/reject', adminWsChatController.rejectPerformanceRequest);

export default router;
