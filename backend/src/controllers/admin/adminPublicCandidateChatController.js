import sequelize from '../../config/database.js';
import { Admin, Applicant, PublicCandidateChatMessage, PublicCandidateChatSession } from '../../models/index.js';
import { publicCandidateChatSseService } from '../../services/publicCandidateChatSseService.js';
import { emitRealtime } from '../../services/realtimeHub.js';
import { applySseHeaders } from '../../utils/sseHeaders.js';
import {
  countUnreadVisitorMessagesBySession,
  getAdminInboxUnreadSummary,
  getLatestMessagePreviewsBySession,
  getLatestUnreadVisitorPreviewsBySession,
} from '../../services/publicChatUnreadService.js';
import {
  computeSessionHasUnread,
  enrichPublicChatMessage,
  markAdminPublicChatSessionRead,
} from '../../services/publicChatReadService.js';

const serializeMessage = (m, session) => enrichPublicChatMessage(m, session);

export const adminPublicCandidateChatController = {
  listSessions: async (req, res, next) => {
    try {
      const page = Math.max(parseInt(req.query.page || '1', 10), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit || '30', 10), 1), 100);
      const offset = (page - 1) * limit;

      const { count, rows } = await PublicCandidateChatSession.findAndCountAll({
        order: sequelize.literal('`PublicCandidateChatSession`.`updated_at` DESC'),
        limit,
        offset,
        include: [
          {
            model: Applicant,
            as: 'applicant',
            attributes: ['id', 'name', 'email', 'phone'],
            required: false
          }
        ]
      });

      const unreadBySession = await countUnreadVisitorMessagesBySession(
        'candidate',
        rows.map((s) => s.id)
      );
      const sessionIds = rows.map((s) => s.id);
      const [latestPreviews, unreadPreviews] = await Promise.all([
        getLatestMessagePreviewsBySession('candidate', sessionIds),
        getLatestUnreadVisitorPreviewsBySession('candidate', sessionIds),
      ]);

      res.json({
        success: true,
        data: {
          sessions: rows.map((s) => {
            const a = s.applicant;
            const unreadCount = unreadBySession[s.id] || 0;
            const latest = latestPreviews[s.id] || {};
            const unreadPreview = unreadPreviews[s.id] || {};
            return {
              id: s.id,
              sessionToken: s.sessionToken,
              visitorLabel: s.visitorLabel,
              applicantId: s.applicantId || null,
              isRegistered: !!s.applicantId,
              applicantName: a?.name || null,
              applicantEmail: a?.email || null,
              applicantPhone: a?.phone || null,
              status: s.status,
              lastMessageAt: s.lastMessageAt,
              lastVisitorMessageAt: s.lastVisitorMessageAt,
              adminLastSeenAt: s.adminLastSeenAt,
              visitorLastSeenAt: s.visitorLastSeenAt,
              hasUnread: unreadCount > 0,
              unreadCount,
              lastMessagePreview: latest.preview || null,
              lastMessageSenderType: latest.senderType || null,
              unreadPreview: unreadPreview.preview || null,
              updatedAt: s.updatedAt || s.updated_at,
              createdAt: s.createdAt || s.created_at
            };
          }),
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

  getMessages: async (req, res, next) => {
    try {
      const sessionId = parseInt(req.params.sessionId, 10);
      if (Number.isNaN(sessionId)) {
        return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' });
      }
      const session = await PublicCandidateChatSession.findByPk(sessionId, {
        include: [
          {
            model: Applicant,
            as: 'applicant',
            attributes: ['id', 'name', 'email', 'phone'],
            required: false
          }
        ]
      });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phiên chat' });
      }
      const messages = await PublicCandidateChatMessage.findAll({
        where: { sessionId },
        order: sequelize.literal('`PublicCandidateChatMessage`.`created_at` ASC'),
        include: [{ model: Admin, as: 'admin', attributes: ['id', 'name'], required: false }]
      });
      const applicant = session.applicant;
      const readAt = await markAdminPublicChatSessionRead(session, PublicCandidateChatMessage);
      if (readAt) {
        emitRealtime(
          'admin-public-candidate-chat-read',
          { sessionId, adminLastSeenAt: readAt },
          'admin-inbox'
        );
      }
      res.json({
        success: true,
        data: {
          session: {
            id: session.id,
            sessionToken: session.sessionToken,
            visitorLabel: session.visitorLabel,
            applicantId: session.applicantId || null,
            isRegistered: !!session.applicantId,
            applicantName: applicant?.name || null,
            applicantEmail: applicant?.email || null,
            applicantPhone: applicant?.phone || null,
            status: session.status,
            lastMessageAt: session.lastMessageAt,
            lastVisitorMessageAt: session.lastVisitorMessageAt,
            adminLastSeenAt: session.adminLastSeenAt,
            visitorLastSeenAt: session.visitorLastSeenAt,
            hasUnread: computeSessionHasUnread(session),
            unreadCount: 0,
          },
          messages: messages.map((m) => serializeMessage(m, session))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  postMessage: async (req, res, next) => {
    try {
      const sessionId = parseInt(req.params.sessionId, 10);
      const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
      if (Number.isNaN(sessionId)) {
        return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' });
      }
      if (!body) {
        return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
      }

      const session = await PublicCandidateChatSession.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phiên chat' });
      }

      const adminId = req.admin.id;
      const msg = await PublicCandidateChatMessage.create({
        sessionId: session.id,
        senderType: 'admin',
        adminId,
        body: body.slice(0, 8000)
      });

      const now = new Date();
      session.lastMessageAt = now;
      session.adminLastSeenAt = now;
      await session.save();

      await msg.reload({
        include: [{ model: Admin, as: 'admin', attributes: ['id', 'name'], required: false }],
      });
      const messagePayload = serializeMessage(msg, session);
      const payload = { type: 'message', message: messagePayload };
      publicCandidateChatSseService.emitToSession(session.id, payload);
      const inboxPayload = {
        type: 'message',
        sessionId: session.id,
        sessionToken: session.sessionToken,
        visitorLabel: session.visitorLabel,
        applicantId: session.applicantId || null,
        isRegistered: !!session.applicantId,
        message: messagePayload,
        hasUnread: false
      };
      publicCandidateChatSseService.emitToAdminInbox(inboxPayload);
      emitRealtime('admin-public-candidate-chat', inboxPayload, 'admin-inbox');

      res.json({ success: true, data: { message: messagePayload } });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/admin/public-candidate-chat/unread-summary */
  unreadSummary: async (req, res, next) => {
    try {
      const summary = await getAdminInboxUnreadSummary('candidate');
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  },

  inboxStream: async (req, res, next) => {
    try {
      applySseHeaders(req, res);
      res.flushHeaders?.();

      publicCandidateChatSseService.subscribeAdminInbox(res);
      res.write('event: connected\n');
      res.write(`data: ${JSON.stringify({ connected: true, adminId: req.admin.id })}\n\n`);

      const keepAliveTimer = setInterval(() => {
        res.write('event: ping\n');
        res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
      }, 25000);

      req.on('close', () => {
        clearInterval(keepAliveTimer);
        publicCandidateChatSseService.unsubscribeAdminInbox(res);
      });
    } catch (error) {
      next(error);
    }
  }
};
