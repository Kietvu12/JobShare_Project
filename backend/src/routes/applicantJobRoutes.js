import express from 'express';
import { jobController } from '../controllers/collaborator/jobController.js';

const router = express.Router();

/**
 * @route   GET /api/applicant/jobs
 * @desc    Get list of published jobs for applicant
 * @access  Public
 */
router.get('/', jobController.getJobs);

/**
 * @route   GET /api/applicant/jobs/:id
 * @desc    Get job detail for applicant
 * @access  Public
 */
router.get('/:id', jobController.getJobById);

/**
 * @route   GET /api/applicant/jobs/:id/view-url
 * @desc    Get file view/download URL for applicant
 * @access  Public
 */
router.get('/:id/view-url', jobController.getJobFileUrl);

/**
 * @route   GET /api/applicant/jobs/:id/download
 * @desc    Tải file JD / required CV form
 * @access  Public
 */
router.get('/:id/download', jobController.downloadJobFile);

export default router;
