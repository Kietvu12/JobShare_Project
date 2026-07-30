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
router.post('/sessions/:id/credit-request/accept', adminWsChatController.acceptCreditRequest);
router.post('/sessions/:id/credit-request/reject', adminWsChatController.rejectCreditRequest);
router.post('/sessions/:id/listing-request/accept', adminWsChatController.acceptListingRequest);
router.post('/sessions/:id/listing-request/reject', adminWsChatController.rejectListingRequest);
router.get('/sessions/:id/scout-performance-candidates', adminWsChatController.listScoutPerformanceCandidates);
router.patch(
  '/sessions/:id/scout-performance-candidates/:cvId/approach-status',
  adminWsChatController.updateScoutPerformanceApproachStatus,
);

export default router;
