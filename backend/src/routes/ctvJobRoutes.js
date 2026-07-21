import express from 'express';
import { jobController } from '../controllers/collaborator/jobController.js';
import { authenticateCTV, optionalAuthenticateCTV } from '../middleware/ctvAuth.js';

const router = express.Router();

/**
 * @route   GET /api/ctv/jobs
 * @desc    Get list of jobs (with filters)
 * @access  Public (optional CTV Bearer để lưu lịch sử tìm kiếm)
 */
router.get('/', optionalAuthenticateCTV, jobController.getJobs);

/**
 * @route   GET /api/ctv/jobs/by-campaign/:campaignId
 * @desc    Get jobs by campaign ID
 * @access  Public
 */
router.get('/by-campaign/:campaignId', jobController.getJobsByCampaign);

/**
 * @route   GET /api/ctv/jobs/by-job-pickup/:jobPickupId
 * @desc    Get jobs by job pickup ID
 * @access  Public
 */
router.get('/by-job-pickup/:jobPickupId', jobController.getJobsByJobPickup);

/**
 * @route   GET /api/ctv/jobs/slug/:slug
 * @desc    Get job by slug (share URL)
 * @access  Public
 */
router.get('/slug/:slug', (req, res, next) => {
  req.params.id = req.params.slug;
  return jobController.getJobById(req, res, next);
});

/**
 * @route   GET /api/ctv/jobs/:id/view-url
 * @desc    Lấy URL xem/tải file JD hoặc required CV form
 * @access  Private (CTV)
 */
router.get('/:id/view-url', authenticateCTV, jobController.getJobFileUrl);

/**
 * @route   GET /api/ctv/jobs/:id/download
 * @desc    Tải file JD / required CV form (tên file Unicode đầy đủ)
 * @access  Private (CTV)
 */
router.get('/:id/download', authenticateCTV, jobController.downloadJobFile);

/**
 * @route   GET /api/ctv/jobs/:id
 * @desc    Get job by ID (chỉ job đã published)
 * @access  Public
 */
router.get('/:id', jobController.getJobById);

export default router;

