import express from 'express';
import { businessJobBuilderThreadController } from '../controllers/business/businessJobBuilderThreadController.js';
import { authenticateBusiness } from '../middleware/businessAuth.js';

const router = express.Router();

router.use(authenticateBusiness);

router.get('/', businessJobBuilderThreadController.list);
router.post('/import-legacy', businessJobBuilderThreadController.importLegacy);
router.post('/upsert', businessJobBuilderThreadController.upsert);
router.get('/:id', businessJobBuilderThreadController.getById);
router.post('/', businessJobBuilderThreadController.create);
router.put('/:id', businessJobBuilderThreadController.update);
router.delete('/:id', businessJobBuilderThreadController.remove);

export default router;
