import express from 'express';
import { businessLandingPageController } from '../controllers/business/businessLandingPageController.js';
import { authenticateBusiness } from '../middleware/businessAuth.js';
import { uploadPostImage } from '../middleware/postUploadMiddleware.js';

const router = express.Router();

router.use(authenticateBusiness);

router.get('/templates', businessLandingPageController.getTemplates);
router.get('/dashboard', businessLandingPageController.getDashboard);
router.get('/', businessLandingPageController.list);
router.post('/', businessLandingPageController.create);
router.get('/:id', businessLandingPageController.getById);
router.put('/:id', businessLandingPageController.update);
router.post('/:id/upload-media', uploadPostImage, businessLandingPageController.uploadMedia);
router.post('/:id/publish', businessLandingPageController.publish);
router.post('/:id/pause', businessLandingPageController.pause);
router.post('/:id/close', businessLandingPageController.close);
router.get('/:id/submissions', businessLandingPageController.listSubmissions);

export default router;
