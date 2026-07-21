import express from 'express';
import { publicLandingPageController } from '../controllers/public/publicLandingPageController.js';

const router = express.Router();

router.get('/:slug', publicLandingPageController.getBySlug);
router.post('/:slug/submit', publicLandingPageController.submitForm);

export default router;
