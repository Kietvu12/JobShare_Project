import express from 'express';
import { adminBusinessController } from '../controllers/admin/businessController.js';
import { authenticate, isSuperAdminOrBackoffice } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, isSuperAdminOrBackoffice, adminBusinessController.getBusinesses);
router.post('/', authenticate, isSuperAdminOrBackoffice, adminBusinessController.createBusiness);
router.get('/:id/credit-history', authenticate, isSuperAdminOrBackoffice, adminBusinessController.getCreditHistory);
router.post('/:id/credit', authenticate, isSuperAdminOrBackoffice, adminBusinessController.adjustCredit);
router.get('/:id', authenticate, isSuperAdminOrBackoffice, adminBusinessController.getBusinessById);
router.put('/:id', authenticate, isSuperAdminOrBackoffice, adminBusinessController.updateBusiness);
router.delete('/:id', authenticate, isSuperAdminOrBackoffice, adminBusinessController.deleteBusiness);

export default router;
