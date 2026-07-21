import express from 'express';
import { businessBillingController } from '../controllers/business/businessBillingController.js';
import { authenticateBusiness } from '../middleware/businessAuth.js';

const router = express.Router();

router.use(authenticateBusiness);

router.get('/dashboard', businessBillingController.getDashboard);
router.get('/transactions', businessBillingController.getTransactions);
router.get('/requests', businessBillingController.getRequests);
router.get('/invoices', businessBillingController.getInvoices);
router.get('/credit-requests', businessBillingController.getCreditRequests);
router.post('/credit-requests', businessBillingController.createCreditRequest);
router.get('/credit-requests/:id', businessBillingController.getCreditRequestById);
router.put('/credit-requests/:id', businessBillingController.updateCreditRequest);
router.delete('/credit-requests/:id', businessBillingController.cancelCreditRequest);

export default router;
