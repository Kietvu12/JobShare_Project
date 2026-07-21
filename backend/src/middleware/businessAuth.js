import { verifyToken } from '../utils/jwt.js';
import { Business } from '../models/index.js';

/**
 * Business Authentication Middleware
 */
export const authenticateBusiness = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);

      if (decoded.role !== 'BUSINESS') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Business role required.'
        });
      }

      const business = await Business.findByPk(decoded.id);

      if (!business) {
        return res.status(401).json({
          success: false,
          message: 'Business account not found',
          code: 'BUSINESS_NOT_FOUND'
        });
      }

      if (!business.emailVerifiedAt) {
        return res.status(403).json({
          success: false,
          message: 'Email chưa được xác thực'
        });
      }

      if (business.status === 2) {
        return res.status(403).json({
          success: false,
          message: 'Hồ sơ doanh nghiệp đã bị từ chối'
        });
      }

      if (business.status === 3) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản doanh nghiệp đã bị tạm khóa'
        });
      }

      if (!business.approvedAt || business.status !== 1) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản doanh nghiệp đang chờ duyệt'
        });
      }

      req.business = business;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid or expired token',
        code: error.code || 'TOKEN_INVALID'
      });
    }
  } catch (error) {
    next(error);
  }
};
