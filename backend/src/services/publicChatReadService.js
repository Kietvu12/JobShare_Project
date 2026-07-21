import sequelize from '../config/database.js';

/**
 * Admin mở hội thoại → đánh dấu đã đọc mọi tin visitor hiện có.
 * @param {import('sequelize').Model} session
 * @param {import('sequelize').Model} MessageModel
 */
export async function markAdminPublicChatSessionRead(session, MessageModel) {
  if (!session?.id) return null;

  const tableName = MessageModel.getTableName();
  const [[latestRow]] = await sequelize.query(
    `
    SELECT created_at
    FROM \`${tableName}\`
    WHERE session_id = :sessionId AND sender_type = 'visitor'
    ORDER BY created_at DESC
    LIMIT 1
    `,
    { replacements: { sessionId: session.id } }
  );

  const readAt = latestRow?.created_at ? new Date(latestRow.created_at) : new Date();

  session.adminLastSeenAt = readAt;
  if (latestRow?.created_at) {
    session.lastVisitorMessageAt = readAt;
  }
  await session.save();
  return readAt;
}

/**
 * CTV/ứng viên mở hộp chat → đánh dấu đã đọc tin admin hiện có.
 * @param {import('sequelize').Model} session
 * @param {import('sequelize').Model} MessageModel
 */
export async function markVisitorPublicChatSessionRead(session, MessageModel) {
  if (!session?.id) return null;

  const tableName = MessageModel.getTableName();
  const [[latestRow]] = await sequelize.query(
    `
    SELECT created_at
    FROM \`${tableName}\`
    WHERE session_id = :sessionId AND sender_type = 'admin'
    ORDER BY created_at DESC
    LIMIT 1
    `,
    { replacements: { sessionId: session.id } }
  );

  const readAt = latestRow?.created_at ? new Date(latestRow.created_at) : new Date();
  session.visitorLastSeenAt = readAt;
  await session.save();
  return readAt;
}

export function computeSessionHasUnread(session) {
  if (!session?.lastVisitorMessageAt) return false;
  if (!session?.adminLastSeenAt) return true;
  return (
    new Date(session.lastVisitorMessageAt).getTime() >
    new Date(session.adminLastSeenAt).getTime()
  );
}

export function enrichPublicChatMessage(message, session) {
  const createdRaw = message.createdAt || message.created_at;
  const createdTs = createdRaw ? new Date(createdRaw).getTime() : 0;
  const adminSeenTs = session?.adminLastSeenAt ? new Date(session.adminLastSeenAt).getTime() : 0;
  const visitorSeenTs = session?.visitorLastSeenAt ? new Date(session.visitorLastSeenAt).getTime() : 0;
  const senderType = message.senderType;

  return {
    id: message.id,
    sessionId: message.sessionId,
    senderType,
    adminId: message.adminId,
    body: message.body,
    createdAt: createdRaw,
    admin: message.admin ? { id: message.admin.id, name: message.admin.name } : null,
    isReadByAdmin:
      senderType === 'visitor' && adminSeenTs > 0 && createdTs > 0 && createdTs <= adminSeenTs,
    isReadByVisitor:
      senderType === 'admin' && visitorSeenTs > 0 && createdTs > 0 && createdTs <= visitorSeenTs,
  };
}

/**
 * Đếm tin admin CTV/visitor chưa đọc (dựa visitorLastSeenAt trên server).
 */
export async function countUnreadAdminMessagesForVisitor(session, MessageModel) {
  if (!session?.id) return 0;
  const tableName = MessageModel.getTableName();
  const visitorSeenAt = session.visitorLastSeenAt || null;
  const [[row]] = await sequelize.query(
    `
    SELECT COUNT(m.id) AS unreadCount
    FROM \`${tableName}\` m
    WHERE m.session_id = :sessionId
      AND m.sender_type = 'admin'
      AND (:visitorSeenAt IS NULL OR m.created_at > :visitorSeenAt)
    `,
    { replacements: { sessionId: session.id, visitorSeenAt } }
  );
  return Number(row?.unreadCount || 0);
}

export async function getLatestUnreadAdminPreviewForVisitor(session, MessageModel) {
  if (!session?.id) return null;
  const tableName = MessageModel.getTableName();
  const visitorSeenAt = session.visitorLastSeenAt || null;
  const [[row]] = await sequelize.query(
    `
    SELECT m.body AS preview
    FROM \`${tableName}\` m
    WHERE m.session_id = :sessionId
      AND m.sender_type = 'admin'
      AND (:visitorSeenAt IS NULL OR m.created_at > :visitorSeenAt)
    ORDER BY m.created_at DESC
    LIMIT 1
    `,
    { replacements: { sessionId: session.id, visitorSeenAt } }
  );
  return row?.preview ? String(row.preview).slice(0, 120) : null;
}
