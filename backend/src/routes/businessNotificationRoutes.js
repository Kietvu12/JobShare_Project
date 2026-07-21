import express from 'express';
import { businessNotificationController } from '../controllers/business/businessNotificationController.js';
import { authenticateBusiness } from '../middleware/businessAuth.js';

const router = express.Router();

router.use(authenticateBusiness);

router.get('/', businessNotificationController.getNotifications);
router.get('/unread-count', businessNotificationController.getUnreadCount);
router.get('/stream', businessNotificationController.stream);
router.patch('/read-all', businessNotificationController.markAllRead);
router.patch('/:id/read', businessNotificationController.markRead);

export default router;
