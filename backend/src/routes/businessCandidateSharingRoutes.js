import express from 'express';
import { businessCandidateSharingController } from '../controllers/business/businessCandidateSharingController.js';
import { authenticateBusiness } from '../middleware/businessAuth.js';

const router = express.Router();
router.use(authenticateBusiness);

router.get('/dashboard', businessCandidateSharingController.getDashboard);
router.get('/listings', businessCandidateSharingController.listListings);
router.post('/listings', businessCandidateSharingController.createListing);
router.put('/listings/:id', businessCandidateSharingController.updateListing);
router.post('/listings/:id/submit', businessCandidateSharingController.submitListing);
router.post('/listings/:id/pause', businessCandidateSharingController.pauseListing);
router.post('/listings/:id/close', businessCandidateSharingController.closeListing);
router.get('/nominations', businessCandidateSharingController.listNominations);
router.get('/settlements', businessCandidateSharingController.listSettlements);
/** Metadata cho UI cài phí giới thiệu khi đưa job lên sàn */
router.get('/commission-types/all', businessCandidateSharingController.getCommissionTypes);
router.get('/commission-values/by-type/:typeId', businessCandidateSharingController.getCommissionValuesByType);

export default router;
