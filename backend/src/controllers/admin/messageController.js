import {
  Message,
  MessageRead,
  JobApplication,
  Job,
  Admin,
  Collaborator,
  Applicant,
  Business,
  CVStorage,
  ActionLog
} from '../../models/index.js';
import { Op, col } from 'sequelize';
import sequelize from '../../config/database.js';
import { uploadBufferToS3, buildMessageAttachmentKey, getSignedUrlForFile, makeDownloadDisposition } from '../../services/s3Service.js';
import { dispatchNominationMessageNotifications } from '../../services/nominationMessageNotificationService.js';
import { collaboratorNotificationService } from '../../services/collaboratorNotificationService.js';

// Helper function to map model field names to database column names
const mapOrderField = (fieldName) => {
  const fieldMap = {
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'
  };
  return fieldMap[fieldName] || fieldName;
};

/**
 * Message Management Controller (Admin)
 */
export const messageController = {
  /**
   * Get list of messages
   * GET /api/admin/messages
   */
  getMessages: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        jobApplicationId,
        adminId,
        collaboratorId,
        senderType,
        isReadByAdmin,
        isReadByCollaborator,
        sortBy = 'id',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = {};

      // Search by content
      if (search) {
        where.content = { [Op.like]: `%${search}%` };
      }

      // Filter by job application
      if (jobApplicationId) {
        where.jobApplicationId = parseInt(jobApplicationId);
      }

      // Filter by admin
      if (adminId) {
        where.adminId = parseInt(adminId);
      }

      // Filter by collaborator
      if (collaboratorId) {
        where.collaboratorId = parseInt(collaboratorId);
      }

      // Filter by sender type
      if (senderType !== undefined) {
        where.senderType = parseInt(senderType);
      }

      // Filter by read status
      if (isReadByAdmin !== undefined) {
        where.isReadByAdmin = isReadByAdmin === 'true' || isReadByAdmin === '1' || isReadByAdmin === 1;
      }

      if (isReadByCollaborator !== undefined) {
        where.isReadByCollaborator = isReadByCollaborator === 'true' || isReadByCollaborator === '1' || isReadByCollaborator === 1;
      }

      // Validate sortBy
      const allowedSortFields = ['id', 'senderType', 'createdAt', 'updatedAt'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
      const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      const dbSortField = mapOrderField(sortField);

      // Build order clause
      const orderClause = [[dbSortField, orderDirection]];
      if (sortField !== 'id') {
        orderClause.push(['id', 'DESC']);
      }

      const { count, rows } = await Message.findAndCountAll({
        where,
        include: [
          {
            model: JobApplication,
            as: 'jobApplication',
            required: false,
            attributes: ['id', 'title', 'status'],
            include: [
              {
                model: Job,
                as: 'job',
                required: false,
                attributes: ['id', 'jobCode', 'title']
              }
            ]
          },
          {
            model: Admin,
            as: 'admin',
            required: false,
            attributes: ['id', 'name', 'email']
          },
          {
            model: MessageRead,
            as: 'reads',
            required: false,
            include: [
              { model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] },
              { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name', 'email', 'code'] },
              { model: Applicant, as: 'applicant', required: false, attributes: ['id', 'name', 'email'] }
            ]
          },
          {
            model: Collaborator,
            as: 'collaborator',
            required: false,
            attributes: ['id', 'name', 'email', 'code']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: orderClause
      });

      res.json({
        success: true,
        data: {
          messages: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / parseInt(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get messages by job application
   * GET /api/admin/messages/job-application/:jobApplicationId
   */
  getMessagesByJobApplication: async (req, res, next) => {
    try {
      const { jobApplicationId } = req.params;
      const { limit = 50 } = req.query;

      const jobApplication = await JobApplication.findByPk(jobApplicationId, {
        include: [
          {
            model: Job,
            as: 'job',
            required: false,
            attributes: ['id', 'jobCode', 'title']
          }
        ]
      });
      if (!jobApplication) {
        return res.status(404).json({
          success: false,
          message: 'Đơn ứng tuyển không tồn tại'
        });
      }

      const messages = await Message.findAll({
        where: { jobApplicationId: parseInt(jobApplicationId) },
        include: [
          {
            model: Admin,
            as: 'admin',
            required: false,
            attributes: ['id', 'name', 'email', 'avatar']
          },
          {
            model: Collaborator,
            as: 'collaborator',
            required: false,
            attributes: ['id', 'name', 'email', 'code']
          },
          {
            model: Applicant,
            as: 'applicant',
            required: false,
            attributes: ['id', 'name', 'email']
          },
          {
            model: Business,
            as: 'business',
            required: false,
            attributes: ['id', 'companyName', 'contactName']
          },
          {
            model: MessageRead,
            as: 'reads',
            required: false,
            include: [
              { model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] },
              { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name', 'email', 'code'] },
              { model: Applicant, as: 'applicant', required: false, attributes: ['id', 'name', 'email'] }
            ]
          }
        ],
        order: [[col('Message.created_at'), 'ASC']],
        limit: parseInt(limit)
      });

      const enrichedMessages = await Promise.all(
        messages.map(async (message) => {
          const item = message.toJSON();
          item.reads = item.reads || [];

          const collaboratorReadExists = item.reads.some(
            (r) => r.readerType === 'collaborator' && (r.collaboratorId == null || Number(r.collaboratorId) === Number(item.collaboratorId || jobApplication.collaboratorId || 0))
          );
          if (collaboratorReadExists) {
            item.isReadByCollaborator = true;
          }

          const adminReadNames = item.reads
            .filter((r) => r.readerType === 'admin' && r.admin)
            .map((r) => ({
              id: r.admin.id,
              name: r.admin.name,
              readAt: r.readAt || null
            }));
          item.adminReadNames = adminReadNames;

          if (item.attachmentKey) {
            const disposition = makeDownloadDisposition(item.attachmentName || 'attachment');
            item.attachmentUrl = await getSignedUrlForFile(item.attachmentKey, 'download', disposition);
          } else {
            item.attachmentUrl = null;
          }
          return item;
        })
      );

      res.json({
        success: true,
        data: { messages: enrichedMessages }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get message by ID
   * GET /api/admin/messages/:id
   */
  getMessageById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const message = await Message.findByPk(id, {
        include: [
          {
            model: JobApplication,
            as: 'jobApplication',
            required: false,
            include: [
              {
                model: Job,
                as: 'job',
                required: false
              },
              {
                model: Collaborator,
                as: 'collaborator',
                required: false
              }
            ]
          },
          {
            model: Admin,
            as: 'admin',
            required: false
          },
          {
            model: Collaborator,
            as: 'collaborator',
            required: false
          }
        ]
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin nhắn'
        });
      }

      res.json({
        success: true,
        data: { message }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new message
   * POST /api/admin/messages
   */
  createMessage: async (req, res, next) => {
    try {
      const {
        jobApplicationId,
        collaboratorId,
        content,
        senderType = 1 // Default: Admin
      } = req.body;
      const senderTypeNum = parseInt(senderType, 10);
      const trimmedContent = (content || '').trim();
      const hasAttachment = !!req.file;

      // Validate required fields
      if (!jobApplicationId || (!trimmedContent && !hasAttachment)) {
        return res.status(400).json({
          success: false,
          message: 'ID đơn ứng tuyển và nội dung hoặc tệp đính kèm là bắt buộc'
        });
      }

      // Validate job application exists (Job + CV để thông báo/email đúng mã đơn & tên ứng viên)
      const jobApplication = await JobApplication.findByPk(jobApplicationId, {
        include: [
          { model: Job, as: 'job', required: false, attributes: ['id', 'jobCode', 'title', 'titleEn', 'titleJp', 'businessId'] },
          { model: CVStorage, as: 'cv', required: false, attributes: ['name'] }
        ]
      });
      if (!jobApplication) {
        return res.status(404).json({
          success: false,
          message: 'Đơn ứng tuyển không tồn tại'
        });
      }

      const isApplicantThread = !!jobApplication.applicantId;

      // Validate collaborator if provided
      if (collaboratorId) {
        const collaborator = await Collaborator.findByPk(collaboratorId);
        if (!collaborator) {
          return res.status(404).json({
            success: false,
            message: 'CTV không tồn tại'
          });
        }
      }

      // Validate sender type
      if (![1, 2, 3].includes(senderTypeNum)) {
        return res.status(400).json({
          success: false,
          message: 'Loại người gửi không hợp lệ (1: Admin, 2: Collaborator, 3: System)'
        });
      }

      let attachmentKey = null;
      let attachmentName = null;
      let attachmentMimeType = null;
      let attachmentSize = null;

      if (hasAttachment) {
        attachmentName = req.file.originalname || 'attachment';
        attachmentMimeType = req.file.mimetype || 'application/octet-stream';
        attachmentSize = req.file.size || 0;
        attachmentKey = buildMessageAttachmentKey(jobApplicationId, attachmentName);
        await uploadBufferToS3(req.file.buffer, attachmentKey, attachmentMimeType);
      }

      const message = await Message.create({
        jobApplicationId,
        adminId: req.admin.id,
        collaboratorId: collaboratorId || null,
        applicantId: null,
        senderType: senderTypeNum,
        content: trimmedContent || '[Attachment]',
        attachmentName,
        attachmentKey,
        attachmentMimeType,
        attachmentSize,
        isReadByAdmin: senderTypeNum === 1 ? true : false,
        readByAdminId: senderTypeNum === 1 ? req.admin.id : null,
        readByAdminAt: senderTypeNum === 1 ? new Date() : null,
        isReadByCollaborator: !isApplicantThread && senderTypeNum === 2 ? true : false,
        isReadByApplicant: false
      });

      if (senderTypeNum === 1) {
        await MessageRead.create({
          messageId: message.id,
          readerType: 'admin',
          adminId: req.admin.id,
          collaboratorId: null,
          applicantId: null,
          readAt: new Date()
        });
      }

      // Reload with relations
      await message.reload({
        include: [
          {
            model: JobApplication,
            as: 'jobApplication',
            required: false
          },
          {
            model: Admin,
            as: 'admin',
            required: false
          },
          {
            model: Collaborator,
            as: 'collaborator',
            required: false
          },
          {
            model: Applicant,
            as: 'applicant',
            required: false
          }
        ]
      });
      const messageData = message.toJSON();
      if (messageData.attachmentKey) {
        const disposition = makeDownloadDisposition(messageData.attachmentName || 'attachment');
        messageData.attachmentUrl = await getSignedUrlForFile(messageData.attachmentKey, 'download', disposition);
      } else {
        messageData.attachmentUrl = null;
      }

      // Log action
      await ActionLog.create({
        adminId: req.admin.id,
        object: 'Message',
        action: 'create',
        ip: req.ip || req.connection.remoteAddress,
        after: message.toJSON(),
        description: `Gửi tin nhắn cho đơn ứng tuyển #${jobApplicationId}`
      });

      const recipientCollaboratorId =
        !isApplicantThread && (message.collaboratorId || jobApplication.collaboratorId);
      if (recipientCollaboratorId && message.senderType !== 2) {
        try {
          await dispatchNominationMessageNotifications({
            message,
            jobApplication,
            messagePreview: trimmedContent,
          });
        } catch (notificationError) {
          console.error('[Admin createMessage] Error creating notification:', notificationError);
        }

        const businessId = jobApplication.job?.businessId;
        if (businessId && message.senderType !== 5) {
          try {
            await collaboratorNotificationService.notifyBusinessIncomingMessage({
              businessId,
              jobCode: jobApplication.job?.jobCode || String(jobApplication.id),
              jobId: jobApplication.jobId || null,
              jobApplicationId: jobApplication.id,
              senderLabel: 'WS Admin',
            });
          } catch (notificationError) {
            console.error('[Admin createMessage] Business notification error:', notificationError);
          }
        }
      }

      res.status(201).json({
        success: true,
        message: 'Gửi tin nhắn thành công',
        data: { message: messageData }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark message as read by admin
   * PATCH /api/admin/messages/:id/mark-read-admin
   */
  markReadByAdmin: async (req, res, next) => {
    try {
      const { id } = req.params;

      const message = await Message.findByPk(id, {
        include: [
          {
            model: MessageRead,
            as: 'reads',
            required: false,
            include: [
              { model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] },
              { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name', 'email', 'code'] },
              { model: Applicant, as: 'applicant', required: false, attributes: ['id', 'name', 'email'] }
            ]
          }
        ]
      });
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin nhắn'
        });
      }

      const oldData = message.toJSON();

      message.isReadByAdmin = true;
      message.readByAdminId = req.admin.id;
      message.readByAdminAt = new Date();
      await message.save();

      await MessageRead.findOrCreate({
        where: {
          messageId: message.id,
          readerType: 'admin',
          adminId: req.admin.id,
          collaboratorId: null,
          applicantId: null
        },
        defaults: {
          messageId: message.id,
          readerType: 'admin',
          adminId: req.admin.id,
          collaboratorId: null,
          applicantId: null,
          readAt: new Date()
        }
      });

      if (message.senderType === 1 && message.isReadByCollaborator === true) {
        await MessageRead.findOrCreate({
          where: {
            messageId: message.id,
            readerType: 'collaborator',
            adminId: null,
            collaboratorId: message.collaboratorId,
            applicantId: null
          },
          defaults: {
            messageId: message.id,
            readerType: 'collaborator',
            adminId: null,
            collaboratorId: message.collaboratorId,
            applicantId: null,
            readAt: new Date()
          }
        });
      }

      // Log action
      await ActionLog.create({
        adminId: req.admin.id,
        object: 'Message',
        action: 'mark_read',
        ip: req.ip || req.connection.remoteAddress,
        before: oldData,
        after: message.toJSON(),
        description: `Đánh dấu đã đọc tin nhắn #${id} (Admin)`
      });

      res.json({
        success: true,
        message: 'Đánh dấu đã đọc thành công',
        data: { message }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark message as read by collaborator
   * PATCH /api/admin/messages/:id/mark-read-collaborator
   */
  markReadByCollaborator: async (req, res, next) => {
    try {
      const { id } = req.params;

      const message = await Message.findByPk(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin nhắn'
        });
      }

      const oldData = message.toJSON();

      message.isReadByCollaborator = true;
      await message.save();

      // Log action
      await ActionLog.create({
        adminId: req.admin.id,
        object: 'Message',
        action: 'mark_read',
        ip: req.ip || req.connection.remoteAddress,
        before: oldData,
        after: message.toJSON(),
        description: `Đánh dấu đã đọc tin nhắn #${id} (Collaborator)`
      });

      res.json({
        success: true,
        message: 'Đánh dấu đã đọc thành công',
        data: { message }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark all messages as read by admin for a job application
   * PATCH /api/admin/messages/job-application/:jobApplicationId/mark-all-read-admin
   */
  markAllReadByAdmin: async (req, res, next) => {
    try {
      const { jobApplicationId } = req.params;

      const jobApplication = await JobApplication.findByPk(jobApplicationId);
      if (!jobApplication) {
        return res.status(404).json({
          success: false,
          message: 'Đơn ứng tuyển không tồn tại'
        });
      }

      await Message.update(
        { isReadByAdmin: true },
        {
          where: {
            jobApplicationId: parseInt(jobApplicationId),
            isReadByAdmin: false
          }
        }
      );

      // Log action
      await ActionLog.create({
        adminId: req.admin.id,
        object: 'Message',
        action: 'mark_all_read',
        ip: req.ip || req.connection.remoteAddress,
        description: `Đánh dấu tất cả tin nhắn đã đọc (Admin) cho đơn ứng tuyển #${jobApplicationId}`
      });

      res.json({
        success: true,
        message: 'Đánh dấu tất cả tin nhắn đã đọc thành công'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get unread message count (messages from CTV that admin has not read)
   * GET /api/admin/messages/unread-count
   */
  getUnreadCount: async (req, res, next) => {
    try {
      const count = await Message.count({
        where: {
          senderType: 2, // Collaborator
          isReadByAdmin: false
        },
        paranoid: true
      });
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get unread message count per job application (for admin list - tin từ CTV chưa đọc)
   * GET /api/admin/messages/unread-by-application
   */
  getUnreadByJobApplication: async (req, res, next) => {
    try {
      const rows = await Message.findAll({
        attributes: [
          'jobApplicationId',
          [sequelize.fn('COUNT', sequelize.col('Message.id')), 'count']
        ],
        where: {
          senderType: 2,
          isReadByAdmin: false
        },
        group: ['jobApplicationId'],
        raw: true,
        paranoid: true
      });
      const map = {};
      rows.forEach((r) => {
        const jaId = r.jobApplicationId ?? r.job_application_id;
        if (jaId != null) map[jaId] = parseInt(r.count, 10) || 0;
      });
      res.json({ success: true, data: { unreadByJobApplication: map } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete message (soft delete)
   * DELETE /api/admin/messages/:id
   */
  deleteMessage: async (req, res, next) => {
    try {
      const { id } = req.params;

      const message = await Message.findByPk(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin nhắn'
        });
      }

      const oldData = message.toJSON();

      // Soft delete
      await message.destroy();

      // Log action
      await ActionLog.create({
        adminId: req.admin.id,
        object: 'Message',
        action: 'delete',
        ip: req.ip || req.connection.remoteAddress,
        before: oldData,
        description: `Xóa tin nhắn #${id}`
      });

      res.json({
        success: true,
        message: 'Xóa tin nhắn thành công'
      });
    } catch (error) {
      next(error);
    }
  }
};

