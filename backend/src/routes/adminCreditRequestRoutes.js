import express from 'express';
import { adminCreditRequestController } from '../controllers/admin/adminCreditRequestController.js';
import { authenticate, isSuperAdminOrBackoffice } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, isSuperAdminOrBackoffice, adminCreditRequestController.list);
router.get('/:id', authenticate, isSuperAdminOrBackoffice, adminCreditRequestController.getById);
router.put('/:id', authenticate, isSuperAdminOrBackoffice, adminCreditRequestController.update);
router.delete('/:id', authenticate, isSuperAdminOrBackoffice, adminCreditRequestController.cancel);
router.post('/:id/approve', authenticate, isSuperAdminOrBackoffice, adminCreditRequestController.approve);
router.post('/:id/reject', authenticate, isSuperAdminOrBackoffice, adminCreditRequestController.reject);

export default router;
