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

export function computeSessionHasUnread(session) {
  if (!session?.lastVisitorMessageAt) return false;
  if (!session?.adminLastSeenAt) return true;
  return (
    new Date(session.lastVisitorMessageAt).getTime() >
    new Date(session.adminLastSeenAt).getTime()
  );
}
