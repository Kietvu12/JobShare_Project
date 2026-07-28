import { CollaboratorNotification, Job } from '../../models/index.js';
import { collaboratorNotificationService } from '../../services/collaboratorNotificationService.js';
import { applySseHeaders } from '../../utils/sseHeaders.js';
import {
  hasCollaboratorNotificationBusinessColumn,
  hasCollaboratorNotificationTimestampColumns,
  isMissingCollaboratorNotificationTimestampColumnError,
} from '../../utils/collaboratorNotificationSchema.js';

const LIST_ATTRS_WITHOUT_TIMESTAMPS = [
  'id', 'collaboratorId', 'adminId', 'businessId', 'title', 'content', 'jobId', 'url', 'isRead',
];

const LIST_ATTRS_WITHOUT_BUSINESS_ID_OR_TIMESTAMPS = [
  'id', 'collaboratorId', 'adminId', 'title', 'content', 'jobId', 'url', 'isRead',
];

function isMissingBusinessIdColumn(err) {
  const e = err?.parent || err?.original || err;
  const m = String(e?.sqlMessage || err?.message || '');
  return (e?.errno === 1054 || e?.code === 'ER_BAD_FIELD_ERROR')
    && /Unknown column ['`]?business_id['`]?/i.test(m);
}

async function findCollaboratorNotifications(collaboratorId, page, limit) {
  const offset = (page - 1) * limit;
  const hasTimestamps = await hasCollaboratorNotificationTimestampColumns();
  const hasBusinessId = await hasCollaboratorNotificationBusinessColumn();
  const order = hasTimestamps ? [['created_at', 'DESC']] : [['id', 'DESC']];
  let attributes;
  if (!hasTimestamps && !hasBusinessId) attributes = LIST_ATTRS_WITHOUT_BUSINESS_ID_OR_TIMESTAMPS;
  else if (!hasTimestamps) attributes = LIST_ATTRS_WITHOUT_TIMESTAMPS;

  const query = {
    where: { collaboratorId },
    include: [
      {
        model: Job,
        as: 'job',
        required: false,
        attributes: ['id', 'jobCode', 'title', 'slug'],
      },
    ],
    order,
    limit,
    offset,
    ...(attributes ? { attributes } : {}),
  };

  try {
    return await CollaboratorNotification.findAndCountAll(query);
  } catch (error) {
    if (isMissingCollaboratorNotificationTimestampColumnError(error) || isMissingBusinessIdColumn(error)) {
      return await CollaboratorNotification.findAndCountAll({
        ...query,
        order: isMissingCollaboratorNotificationTimestampColumnError(error) ? [['id', 'DESC']] : order,
        attributes: isMissingBusinessIdColumn(error)
          ? LIST_ATTRS_WITHOUT_BUSINESS_ID_OR_TIMESTAMPS
          : LIST_ATTRS_WITHOUT_TIMESTAMPS,
      });
    }
    throw error;
  }
}

export const notificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const collaboratorId = req.collaborator.id;
      const page = Math.max(parseInt(req.query.page || '1', 10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);

      const { count, rows } = await findCollaboratorNotifications(collaboratorId, page, limit);

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
      const collaboratorId = req.collaborator.id;
      const count = await CollaboratorNotification.count({
        where: { collaboratorId, isRead: false }
      });
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  },

  markRead: async (req, res, next) => {
    try {
      const collaboratorId = req.collaborator.id;
      const notificationId = parseInt(req.params.id, 10);

      const notification = await CollaboratorNotification.findOne({
        where: { id: notificationId, collaboratorId }
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
      next(error);
    }
  },

  markAllRead: async (req, res, next) => {
    try {
      const collaboratorId = req.collaborator.id;
      await CollaboratorNotification.update(
        { isRead: true },
        { where: { collaboratorId, isRead: false } }
      );

      res.json({
        success: true,
        message: 'Đã đánh dấu tất cả thông báo là đã đọc'
      });
    } catch (error) {
      next(error);
    }
  },

  stream: async (req, res, next) => {
    try {
      const collaboratorId = req.collaborator.id;

      applySseHeaders(req, res);
      res.flushHeaders?.();

      collaboratorNotificationService.subscribe(collaboratorId, res);
      res.write('event: connected\n');
      res.write(`data: ${JSON.stringify({ connected: true, collaboratorId })}\n\n`);

      const keepAliveTimer = setInterval(() => {
        res.write('event: ping\n');
        res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
      }, 25000);

      req.on('close', () => {
        clearInterval(keepAliveTimer);
        collaboratorNotificationService.unsubscribe(collaboratorId, res);
      });
    } catch (error) {
      next(error);
    }
  }
};
