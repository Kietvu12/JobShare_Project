import express from 'express';
import multer from 'multer';
import { businessAuthController } from '../controllers/business/businessAuthController.js';
import { businessCreditController } from '../controllers/business/businessCreditController.js';
import { authenticateBusiness } from '../middleware/businessAuth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * @route   POST /api/business/auth/register
 * @desc    Đăng ký tài khoản doanh nghiệp
 * @access  Public
 */
router.post('/register', upload.single('businessLicenseFile'), businessAuthController.register);

/**
 * @route   GET /api/business/auth/verify-email
 * @desc    Xác thực email doanh nghiệp
 * @access  Public
 */
router.get('/verify-email', businessAuthController.verifyEmail);

/**
 * @route   POST /api/business/auth/resend-verification
 * @desc    Gửi lại email xác thực
 * @access  Public
 */
router.post('/resend-verification', businessAuthController.resendVerification);

/**
 * @route   POST /api/business/auth/login
 * @desc    Đăng nhập doanh nghiệp
 * @access  Public
 */
router.post('/login', businessAuthController.login);

/**
 * @route   POST /api/business/auth/forgot-password
 * @desc    Gửi email đặt lại mật khẩu
 * @access  Public
 */
router.post('/forgot-password', businessAuthController.forgotPassword);

/**
 * @route   POST /api/business/auth/reset-password
 * @desc    Đặt lại mật khẩu bằng token
 * @access  Public
 */
router.post('/reset-password', businessAuthController.resetPassword);

/**
 * @route   GET /api/business/auth/me
 * @desc    Lấy thông tin doanh nghiệp hiện tại
 * @access  Private (Business)
 */
router.get('/me', authenticateBusiness, businessAuthController.getMe);

/**
 * @route   GET /api/business/auth/credit
 * @desc    Số credit hiện tại của doanh nghiệp
 * @access  Private (Business)
 */
router.get('/credit', authenticateBusiness, businessCreditController.getCredit);

/**
 * @route   GET /api/business/auth/credit/history
 * @desc    Lịch sử credit
 * @access  Private (Business)
 */
router.get('/credit/history', authenticateBusiness, businessCreditController.getCreditHistory);

/**
 * @route   POST /api/business/auth/change-password
 * @desc    Đổi mật khẩu khi đã đăng nhập
 * @access  Private (Business)
 */
router.post('/change-password', authenticateBusiness, businessAuthController.changePassword);

/**
 * @route   POST /api/business/auth/logout
 * @desc    Đăng xuất doanh nghiệp
 * @access  Private (Business)
 */
router.post('/logout', authenticateBusiness, businessAuthController.logout);

export default router;
