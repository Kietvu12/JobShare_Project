import { Router } from 'express';
import { postOgController } from '../controllers/public/postOgController.js';

const router = Router();

/**
 * HTML OG preview cho crawler mạng xã hội (Facebook, Zalo, LinkedIn…).
 * Nginx proxy các URL /{lang}/blog/:slug và /{lang}/candidate/blog/:slug (bot) tới đây.
 */
router.get('/:lang/candidate/blog/:slug', postOgController.renderCandidateBlog);
router.get('/:lang/blog/:slug', postOgController.renderCollaboratorBlog);

export default router;
