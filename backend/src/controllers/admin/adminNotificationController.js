import { CollaboratorNotification, Job } from '../../models/index.js';
import sequelize from '../../config/database.js';
import { collaboratorNotificationService } from '../../services/collaboratorNotificationService.js';
import { applySseHeaders } from '../../utils/sseHeaders.js';
import {
  hasCollaboratorNotificationAdminColumn,
  isMissingCollaboratorNotificationAdminColumnError,
} from '../../utils/collaboratorNotificationSchema.js';

const ADMIN_NOTIFICATIONS_MIGRATION_HINT =
  'Chạy migration: node backend/scripts/add-collaborator-notification-recipient-columns.js';

const NOTIFICATION_LIST_ORDER = [
  [sequelize.literal('`collaborator_notifications`.`created_at`'), 'DESC'],
];

function logAdminNotificationError(scope, error, extra = {}) {
  const e = error?.parent || error?.original || error;
  console.error(`[AdminNotifications:${scope}]`, {
    message: error?.message || e?.message || String(error),
    sqlMessage: e?.sqlMessage,
    sql: e?.sql,
    code: e?.code || error?.code,
    errno: e?.errno,
    status: error?.status,
    ...extra,
  });
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
    order: NOTIFICATION_LIST_ORDER,
    limit,
    offset,
  };
  const withJob = {
    ...baseQuery,
    include: [JOB_INCLUDE],
  };

  try {
    return await CollaboratorNotification.findAndCountAll(withJob);
  } catch (error) {
    if (isMissingCollaboratorNotificationAdminColumnError(error)) {
      throw error;
    }
    if (isMissingBusinessIdColumn(error)) {
      return await CollaboratorNotification.findAndCountAll({
        ...withJob,
        attributes: LIST_ATTRS_WITHOUT_BUSINESS_ID,
      });
    }
    logAdminNotificationError('getNotifications', error, {
      adminId,
      retry: 'without job include',
    });
    try {
      return await CollaboratorNotification.findAndCountAll(baseQuery);
    } catch (retryError) {
      if (isMissingBusinessIdColumn(retryError)) {
        return await CollaboratorNotification.findAndCountAll({
          ...baseQuery,
          attributes: LIST_ATTRS_WITHOUT_BUSINESS_ID,
        });
      }
      throw retryError;
    }
  }
}

export const adminNotificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const adminId = req.admin.id;
      const page = Math.max(parseInt(req.query.page || '1', 10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);

      const schemaReady = await hasCollaboratorNotificationAdminColumn();
      if (!schemaReady) {
        console.warn('[AdminNotifications:getNotifications] missing admin_id column', { adminId });
        return res.json({
          success: true,
          meta: { schemaReady: false, hint: ADMIN_NOTIFICATIONS_MIGRATION_HINT },
          data: {
            notifications: [],
            pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
          },
        });
      }

      const { count, rows } = await findAdminNotifications(adminId, page, limit);

      console.info('[AdminNotifications:getNotifications] ok', {
        adminId,
        page,
        limit,
        total: count,
        returned: rows.length,
      });

      res.json({
        success: true,
        meta: { schemaReady: true },
        data: {
          notifications: rows.map((row) => (typeof row.toJSON === 'function' ? row.toJSON() : row)),
          pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      if (isMissingCollaboratorNotificationAdminColumnError(error)) {
        logAdminNotificationError('getNotifications', error, {
          adminId: req.admin?.id,
          fallback: 'missing admin_id column',
        });
        return res.json({
          success: true,
          meta: { schemaReady: false, hint: ADMIN_NOTIFICATIONS_MIGRATION_HINT },
          data: {
            notifications: [],
            pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
          }
        });
      }
      logAdminNotificationError('getNotifications', error, { adminId: req.admin?.id });
      next(error);
    }
  },

  getUnreadCount: async (req, res, next) => {
    try {
      const adminId = req.admin.id;
      const schemaReady = await hasCollaboratorNotificationAdminColumn();
      if (!schemaReady) {
        console.warn('[AdminNotifications:getUnreadCount] missing admin_id column', { adminId });
        return res.json({
          success: true,
          meta: { schemaReady: false, hint: ADMIN_NOTIFICATIONS_MIGRATION_HINT },
          data: { count: 0 },
        });
      }

      const count = await CollaboratorNotification.count({
        where: { adminId, isRead: false }
      });
      console.info('[AdminNotifications:getUnreadCount] ok', { adminId, count });
      res.json({ success: true, meta: { schemaReady: true }, data: { count } });
    } catch (error) {
      if (isMissingCollaboratorNotificationAdminColumnError(error)) {
        logAdminNotificationError('getUnreadCount', error, {
          adminId: req.admin?.id,
          fallback: 'missing admin_id column',
        });
        return res.json({
          success: true,
          meta: { schemaReady: false, hint: ADMIN_NOTIFICATIONS_MIGRATION_HINT },
          data: { count: 0 },
        });
      }
      logAdminNotificationError('getUnreadCount', error, { adminId: req.admin?.id });
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
      if (isMissingCollaboratorNotificationAdminColumnError(error)) {
        logAdminNotificationError('markRead', error, { adminId: req.admin?.id, notificationId: req.params?.id });
        return res.status(404).json({
          success: false,
          message: 'Chưa hỗ trợ thông báo admin — chạy migration collaborator_notifications (admin_id)'
        });
      }
      logAdminNotificationError('markRead', error, { adminId: req.admin?.id, notificationId: req.params?.id });
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
      if (isMissingCollaboratorNotificationAdminColumnError(error)) {
        logAdminNotificationError('markAllRead', error, { adminId: req.admin?.id });
        return res.json({ success: true, message: 'OK (schema chưa có admin_id)' });
      }
      logAdminNotificationError('markAllRead', error, { adminId: req.admin?.id });
      next(error);
    }
  },

  stream: async (req, res, next) => {
    try {
      const adminId = req.admin.id;
      console.info('[AdminNotifications:stream] connected', { adminId });

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
      logAdminNotificationError('stream', error, { adminId: req.admin?.id });
      next(error);
    }
  }
};
