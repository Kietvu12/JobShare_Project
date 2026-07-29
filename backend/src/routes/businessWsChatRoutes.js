import express from 'express';
import { authenticateBusiness } from '../middleware/businessAuth.js';
import { businessWsChatController } from '../controllers/business/businessWsChatController.js';

const router = express.Router();

router.use(authenticateBusiness);

router.get('/sessions', businessWsChatController.listSessions);
router.post('/sync-credit-requests', businessWsChatController.syncCreditRequests);
router.get('/sessions/by-performance-request/:requestId', businessWsChatController.getSessionByPerformanceRequest);
router.get('/sessions/:id', businessWsChatController.getSession);
router.get('/sessions/:id/messages', businessWsChatController.listMessages);
router.post('/sessions/:id/messages', businessWsChatController.sendMessage);

export default router;
