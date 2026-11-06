import express from 'express';
import { businessPaymentController } from '../controllers/admin/businessPaymentController.js';
import { authenticate, isSuperAdminOrBackoffice } from '../middleware/auth.js';

const router = express.Router();

router.get(
  '/referral-invoices',
  authenticate,
  isSuperAdminOrBackoffice,
  businessPaymentController.listReferralInvoices,
);

router.patch(
  '/referral-invoices/:id/confirm-paid',
  authenticate,
  isSuperAdminOrBackoffice,
  businessPaymentController.confirmReferralInvoicePaid,
);

export default router;
