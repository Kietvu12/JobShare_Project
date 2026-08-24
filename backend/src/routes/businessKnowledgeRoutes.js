import express from 'express';
import { authenticateBusiness } from '../middleware/businessAuth.js';
import { postController } from '../controllers/collaborator/postController.js';
import { businessKnowledgeController } from '../controllers/business/businessKnowledgeController.js';

const router = express.Router();

router.use(authenticateBusiness);

/** GET /api/business/knowledge/categories */
router.get('/categories', businessKnowledgeController.listCategories);

/** GET /api/business/knowledge/posts */
router.get('/posts', postController.getPosts);

/** GET /api/business/knowledge/posts/:id */
router.get('/posts/:id', postController.getPostById);

export default router;
