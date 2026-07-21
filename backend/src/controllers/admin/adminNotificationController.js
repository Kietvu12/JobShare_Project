import { CollaboratorNotification, Job } from '../../models/index.js';
import { collaboratorNotificationService } from '../../services/collaboratorNotificationService.js';
import { applySseHeaders } from '../../utils/sseHeaders.js';

/** DB chưa chạy migration thêm cột admin_id → Sequelize/MySQL lỗi 1054 */
function isMissingAdminNotificationsAdminColumn(err) {
  const e = err?.parent || err?.original || err;
  if (e?.errno === 1054 || e?.code === 'ER_BAD_FIELD_ERROR') return true;
  const m = String(e?.sqlMessage || err?.message || '');
  return /Unknown column ['`]?admin_id['`]?/i.test(m) || /Unknown column ['`]?collaborator_notifications\.admin_id/i.test(m);
}

/** Model có businessId nhưng DB chưa migration → COUNT(*) vẫn chạy, SELECT danh sách lỗi */
function isMissingBusinessIdColumn(err) {
  const e = err?.parent || err?.original || err;
  const m = String(e?.sqlMessage || err?.message || '');
  return (e?.errno === 1054 || e?.code === 'ER_BAD_FIELD_ERROR')
    && /Unknown column ['`]?business_id['`]?/i.test(m);
}

const JOB_INCLUDE = {
  model: Job,
  as: 'job',
  required: false,
  attributes: ['id', 'jobCode', 'title', 'slug'],
};

const LIST_ATTRS_WITHOUT_BUSINESS_ID = [
  'id', 'collaboratorId', 'adminId', 'title', 'content', 'jobId', 'url', 'isRead', 'createdAt', 'updatedAt',
];

async function findAdminNotifications(adminId, page, limit) {
  const offset = (page - 1) * limit;
  const baseQuery = {
    where: { adminId },
    include: [JOB_INCLUDE],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  };

  try {
    return await CollaboratorNotification.findAndCountAll(baseQuery);
  } catch (error) {
    if (isMissingAdminNotificationsAdminColumn(error)) {
      return { count: 0, rows: [] };
    }
    if (isMissingBusinessIdColumn(error)) {
      return await CollaboratorNotification.findAndCountAll({
        ...baseQuery,
        attributes: LIST_ATTRS_WITHOUT_BUSINESS_ID,
      });
    }
    throw error;
  }
}

export const adminNotificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const adminId = req.admin.id;
      const page = Math.max(parseInt(req.query.page || '1', 10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);

      const { count, rows } = await findAdminNotifications(adminId, page, limit);

      res.json({
        success: true,
        data: {
          notifications: rows,
          pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  getUnreadCount: async (req, res, next) => {
    try {
      const adminId = req.admin.id;
      const count = await CollaboratorNotification.count({
        where: { adminId, isRead: false }
      });
      res.json({ success: true, data: { count } });
    } catch (error) {
      if (isMissingAdminNotificationsAdminColumn(error)) {
        return res.json({ success: true, data: { count: 0 } });
      }
      next(error);
    }
  },

  markRead: async (req, res, next) => {
    try {
      const adminId = req.admin.id;
      const notificationId = parseInt(req.params.id, 10);

      const notification = await CollaboratorNotification.findOne({
        where: { id: notificationId, adminId }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo'
        });
      }

      notification.isRead = true;
      await notification.save();

      res.json({
        success: true,
        message: 'Đã đánh dấu đã đọc',
        data: { notification }
      });
    } catch (error) {
      if (isMissingAdminNotificationsAdminColumn(error)) {
        return res.status(404).json({
          success: false,
          message: 'Chưa hỗ trợ thông báo admin — chạy migration collaborator_notifications (admin_id)'
        });
      }
      next(error);
    }
  },

  markAllRead: async (req, res, next) => {
    try {
      const adminId = req.admin.id;
      await CollaboratorNotification.update(
        { isRead: true },
        { where: { adminId, isRead: false } }
      );

      res.json({
        success: true,
        message: 'Đã đánh dấu tất cả thông báo là đã đọc'
      });
    } catch (error) {
      if (isMissingAdminNotificationsAdminColumn(error)) {
        return res.json({ success: true, message: 'OK (schema chưa có admin_id)' });
      }
      next(error);
    }
  },

  stream: async (req, res, next) => {
    try {
      const adminId = req.admin.id;

      applySseHeaders(req, res);
      res.flushHeaders?.();

      collaboratorNotificationService.subscribeAdmin(adminId, res);
      res.write('event: connected\n');
      res.write(`data: ${JSON.stringify({ connected: true, adminId })}\n\n`);

      const keepAliveTimer = setInterval(() => {
        res.write('event: ping\n');
        res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
      }, 25000);

      req.on('close', () => {
        clearInterval(keepAliveTimer);
        collaboratorNotificationService.unsubscribeAdmin(adminId, res);
      });
    } catch (error) {
      next(error);
    }
  }
};
