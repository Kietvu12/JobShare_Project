import { Op, col } from 'sequelize';
import {
  Message,
  JobApplication,
  Job,
  Admin,
  Collaborator,
  Business,
  MessageRead,
} from '../../models/index.js';
import {
  uploadBufferToS3,
  buildMessageAttachmentKey,
  getSignedUrlForFile,
  makeDownloadDisposition,
} from '../../services/s3Service.js';

const SENDER_TYPE_BUSINESS = 5;

async function assertBusinessCanAccessNomination(businessId, jobApplicationId) {
  const app = await JobApplication.findOne({
    where: { id: jobApplicationId },
    include: [{ model: Job, as: 'job', required: true, attributes: ['id', 'businessId'] }],
  });
  if (!app?.job || Number(app.job.businessId) !== Number(businessId)) {
    const err = new Error('Bạn không có quyền xem tin nhắn của đơn tiến cử này');
    err.statusCode = 403;
    throw err;
  }
  return app;
}

async function enrichMessages(messages) {
  return Promise.all(
    messages.map(async (message) => {
      const item = message.toJSON();
      item.reads = item.reads || [];
      if (item.attachmentKey) {
        const disposition = makeDownloadDisposition(item.attachmentName || 'attachment');
        item.attachmentUrl = await getSignedUrlForFile(item.attachmentKey, 'download', disposition);
      } else {
        item.attachmentUrl = null;
      }
      return item;
    }),
  );
}

export const businessMessageController = {
  getMessagesByJobApplication: async (req, res, next) => {
    try {
      const { jobApplicationId } = req.params;
      const businessId = req.business.id;

      await assertBusinessCanAccessNomination(businessId, jobApplicationId);

      const messages = await Message.findAll({
        where: { jobApplicationId: parseInt(jobApplicationId, 10) },
        include: [
          { model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] },
          { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name', 'email', 'code'] },
          { model: Business, as: 'business', required: false, attributes: ['id', 'companyName', 'contactName'] },
          {
            model: MessageRead,
            as: 'reads',
            required: false,
            include: [
              { model: Admin, as: 'admin', required: false, attributes: ['id', 'name', 'email'] },
              { model: Collaborator, as: 'collaborator', required: false, attributes: ['id', 'name', 'email', 'code'] },
            ],
          },
        ],
        order: [[col('Message.created_at'), 'ASC']],
        paranoid: true,
      });

      const unreadForBusiness = messages.filter(
        (m) => m.senderType !== SENDER_TYPE_BUSINESS && !m.isReadByBusiness,
      );
      if (unreadForBusiness.length) {
        await Message.update(
          { isReadByBusiness: true },
          { where: { id: { [Op.in]: unreadForBusiness.map((m) => m.id) } } },
        );
      }

      const enriched = await enrichMessages(messages);
      res.json({ success: true, data: { messages: enriched } });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  createMessage: async (req, res, next) => {
    try {
      const businessId = req.business.id;
      const jobApplicationId = parseInt(req.body.jobApplicationId, 10);
      const trimmedContent = (req.body.content || '').trim();
      const hasAttachment = !!req.file;

      if (!jobApplicationId || (!trimmedContent && !hasAttachment)) {
        return res.status(400).json({
          success: false,
          message: 'ID đơn tiến cử và nội dung hoặc tệp đính kèm là bắt buộc',
        });
      }

      await assertBusinessCanAccessNomination(businessId, jobApplicationId);

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
        businessId,
        adminId: null,
        collaboratorId: null,
        applicantId: null,
        senderType: SENDER_TYPE_BUSINESS,
        content: trimmedContent || '[Attachment]',
        attachmentName,
        attachmentKey,
        attachmentMimeType,
        attachmentSize,
        isReadByAdmin: false,
        isReadByCollaborator: false,
        isReadByApplicant: false,
        isReadByBusiness: true,
      });

      res.status(201).json({ success: true, data: { message } });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

export default businessMessageController;
