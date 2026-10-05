import express from 'express';
import { businessContactInquiryController } from '../controllers/public/businessContactInquiryController.js';

const router = express.Router();

router.post('/', businessContactInquiryController.submit);

export default router;
