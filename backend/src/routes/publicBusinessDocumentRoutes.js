import express from 'express';
import { businessDocumentDownloadController } from '../controllers/public/businessDocumentDownloadController.js';

const router = express.Router();

router.post('/', businessDocumentDownloadController.requestDownload);

export default router;
