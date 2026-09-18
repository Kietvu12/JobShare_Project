import express from 'express';
import { authenticate, isSuperAdminOrBackoffice } from '../middleware/auth.js';
import { scoutReserveController } from '../controllers/admin/scoutReserveController.js';

const router = express.Router();

router.use(authenticate, isSuperAdminOrBackoffice);

router.get('/', scoutReserveController.list);
router.get('/:id', scoutReserveController.detail);
router.post('/:id/relist', scoutReserveController.relist);

export default router;
