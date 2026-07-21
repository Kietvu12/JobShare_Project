import { CollaboratorNotification, Job } from '../../models/index.js';
import { collaboratorNotificationService } from '../../services/collaboratorNotificationService.js';
import { applySseHeaders } from '../../utils/sseHeaders.js';

function isMissingBusinessNotificationsColumn(err) {
  const e = err?.parent || err?.original || err;
  if (e?.errno === 1054 || e?.code === 'ER_BAD_FIELD_ERROR') return true;
  const m = String(e?.sqlMessage || err?.message || '');
  return /Unknown column ['`]?business_id['`]?/i.test(m);
}

export const businessNotificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const businessId = req.business.id;
      const page = Math.max(parseInt(req.query.page || '1', 10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
      const offset = (page - 1) * limit;

      const { count, rows } = await CollaboratorNotification.findAndCountAll({
        where: { businessId },
        include: [
          {
            model: Job,
            as: 'job',
            required: false,
            attributes: ['id', 'jobCode', 'title', 'slug'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      res.json({
        success: true,
        data: {
          notifications: rows,
          pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      if (isMissingBusinessNotificationsColumn(error)) {
        return res.json({
          success: true,
          data: {
            notifications: [],
            pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
          },
        });
      }
      next(error);
    }
  },

  getUnreadCount: async (req, res, next) => {
    try {
      const businessId = req.business.id;
      const count = await CollaboratorNotification.count({
        where: { businessId, isRead: false },
      });
      res.json({ success: true, data: { count } });
    } catch (error) {
      if (isMissingBusinessNotificationsColumn(error)) {
        return res.json({ success: true, data: { count: 0 } });
      }
      next(error);
    }
  },

  markRead: async (req, res, next) => {
    try {
      const businessId = req.business.id;
      const notificationId = parseInt(req.params.id, 10);

      const notification = await CollaboratorNotification.findOne({
        where: { id: notificationId, businessId },
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo',
        });
      }

      notification.isRead = true;
      await notification.save();

      res.json({
        success: true,
        message: 'Đã đánh dấu đã đọc',
        data: { notification },
      });
    } catch (error) {
      if (isMissingBusinessNotificationsColumn(error)) {
        return res.status(404).json({
          success: false,
          message: 'Chưa hỗ trợ thông báo business — chạy migration business_id',
        });
      }
      next(error);
    }
  },

  markAllRead: async (req, res, next) => {
    try {
      const businessId = req.business.id;
      await CollaboratorNotification.update(
        { isRead: true },
        { where: { businessId, isRead: false } },
      );

      res.json({
        success: true,
        message: 'Đã đánh dấu tất cả thông báo là đã đọc',
      });
    } catch (error) {
      if (isMissingBusinessNotificationsColumn(error)) {
        return res.json({ success: true, message: 'OK (schema chưa có business_id)' });
      }
      next(error);
    }
  },

  stream: async (req, res, next) => {
    try {
      const businessId = req.business.id;

      applySseHeaders(req, res);
      res.flushHeaders?.();

      collaboratorNotificationService.subscribeBusiness(businessId, res);
      res.write('event: connected\n');
      res.write(`data: ${JSON.stringify({ connected: true, businessId })}\n\n`);

      const keepAliveTimer = setInterval(() => {
        res.write('event: ping\n');
        res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
      }, 25000);

      req.on('close', () => {
        clearInterval(keepAliveTimer);
        collaboratorNotificationService.unsubscribeBusiness(businessId, res);
      });
    } catch (error) {
      next(error);
    }
  },
};

export default businessNotificationController;
