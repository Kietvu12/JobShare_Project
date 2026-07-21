import sequelize from '../config/database.js';

/**
 * Đếm tin visitor chưa đọc (admin chưa seen) theo session id.
 * @param {'ctv'|'candidate'} kind
 * @param {number[]} sessionIds
 */
export async function countUnreadVisitorMessagesBySession(kind, sessionIds) {
  if (!sessionIds?.length) return {};
  const sessionTable =
    kind === 'candidate' ? 'public_candidate_chat_sessions' : 'public_ctv_chat_sessions';
  const messageTable =
    kind === 'candidate' ? 'public_candidate_chat_messages' : 'public_ctv_chat_messages';

  const [rows] = await sequelize.query(
    `
    SELECT s.id AS sessionId, COUNT(m.id) AS unreadCount
    FROM ${sessionTable} s
    INNER JOIN ${messageTable} m ON m.session_id = s.id
      AND m.sender_type = 'visitor'
      AND (s.admin_last_seen_at IS NULL OR m.created_at > s.admin_last_seen_at)
    WHERE s.id IN (:ids)
    GROUP BY s.id
    `,
    { replacements: { ids: sessionIds } }
  );

  return Object.fromEntries(
    (rows || []).map((r) => [Number(r.sessionId), Number(r.unreadCount || 0)])
  );
}

/**
 * Preview tin nhắn mới nhất theo session (dùng hiển thị danh sách inbox).
 * @param {'ctv'|'candidate'} kind
 * @param {number[]} sessionIds
 */
export async function getLatestMessagePreviewsBySession(kind, sessionIds) {
  if (!sessionIds?.length) return {};
  const messageTable =
    kind === 'candidate' ? 'public_candidate_chat_messages' : 'public_ctv_chat_messages';

  const [rows] = await sequelize.query(
    `
    SELECT m.session_id AS sessionId, m.body AS preview, m.sender_type AS senderType, m.created_at AS createdAt
    FROM ${messageTable} m
    INNER JOIN (
      SELECT session_id, MAX(created_at) AS max_created
      FROM ${messageTable}
      WHERE session_id IN (:ids)
      GROUP BY session_id
    ) latest ON latest.session_id = m.session_id AND latest.max_created = m.created_at
    WHERE m.session_id IN (:ids)
    `,
    { replacements: { ids: sessionIds } }
  );

  return Object.fromEntries(
    (rows || []).map((r) => [
      Number(r.sessionId),
      {
        preview: r.preview ? String(r.preview).slice(0, 160) : '',
        senderType: r.senderType,
        createdAt: r.createdAt,
      },
    ])
  );
}

/**
 * Preview tin visitor chưa đọc mới nhất theo session.
 * @param {'ctv'|'candidate'} kind
 * @param {number[]} sessionIds
 */
export async function getLatestUnreadVisitorPreviewsBySession(kind, sessionIds) {
  if (!sessionIds?.length) return {};
  const sessionTable =
    kind === 'candidate' ? 'public_candidate_chat_sessions' : 'public_ctv_chat_sessions';
  const messageTable =
    kind === 'candidate' ? 'public_candidate_chat_messages' : 'public_ctv_chat_messages';

  const [rows] = await sequelize.query(
    `
    SELECT s.id AS sessionId, m.body AS preview, m.created_at AS createdAt
    FROM ${sessionTable} s
    INNER JOIN ${messageTable} m ON m.session_id = s.id
      AND m.sender_type = 'visitor'
      AND (s.admin_last_seen_at IS NULL OR m.created_at > s.admin_last_seen_at)
    INNER JOIN (
      SELECT s2.id AS session_id, MAX(m2.created_at) AS max_created
      FROM ${sessionTable} s2
      INNER JOIN ${messageTable} m2 ON m2.session_id = s2.id
        AND m2.sender_type = 'visitor'
        AND (s2.admin_last_seen_at IS NULL OR m2.created_at > s2.admin_last_seen_at)
      WHERE s2.id IN (:ids)
      GROUP BY s2.id
    ) latest ON latest.session_id = s.id AND latest.max_created = m.created_at
    WHERE s.id IN (:ids)
    `,
    { replacements: { ids: sessionIds } }
  );

  return Object.fromEntries(
    (rows || []).map((r) => [
      Number(r.sessionId),
      {
        preview: r.preview ? String(r.preview).slice(0, 160) : '',
        createdAt: r.createdAt,
      },
    ])
  );
}

/**
 * Tổng hợp tin hỗ trợ chưa đọc cho admin inbox.
 * @param {'ctv'|'candidate'} kind
 */
export async function getAdminInboxUnreadSummary(kind) {
  const sessionTable =
    kind === 'candidate' ? 'public_candidate_chat_sessions' : 'public_ctv_chat_sessions';
  const messageTable =
    kind === 'candidate' ? 'public_candidate_chat_messages' : 'public_ctv_chat_messages';

  const [[statsRow]] = await sequelize.query(
    `
    SELECT
      COUNT(DISTINCT s.id) AS unreadSessions,
      COUNT(m.id) AS unreadMessages
    FROM ${sessionTable} s
    INNER JOIN ${messageTable} m ON m.session_id = s.id
      AND m.sender_type = 'visitor'
      AND (s.admin_last_seen_at IS NULL OR m.created_at > s.admin_last_seen_at)
    `
  );

  const [[previewRow]] = await sequelize.query(
    `
    SELECT m.body AS preview, s.visitor_label AS visitorLabel, s.id AS sessionId
    FROM ${sessionTable} s
    INNER JOIN ${messageTable} m ON m.session_id = s.id
      AND m.sender_type = 'visitor'
      AND (s.admin_last_seen_at IS NULL OR m.created_at > s.admin_last_seen_at)
    ORDER BY m.created_at DESC
    LIMIT 1
    `
  );

  let senderRows = [];
  if (kind === 'ctv') {
    [senderRows] = await sequelize.query(
      `
      SELECT
        s.id AS sessionId,
        COALESCE(c.name, s.visitor_label, CONCAT('Khách #', s.id)) AS senderLabel,
        COUNT(m.id) AS unreadCount,
        MAX(m.created_at) AS lastUnreadAt
      FROM ${sessionTable} s
      LEFT JOIN collaborators c ON c.id = s.collaborator_id
      INNER JOIN ${messageTable} m ON m.session_id = s.id
        AND m.sender_type = 'visitor'
        AND (s.admin_last_seen_at IS NULL OR m.created_at > s.admin_last_seen_at)
      GROUP BY s.id, c.name, s.visitor_label
      ORDER BY lastUnreadAt DESC
      `
    );
  } else {
    [senderRows] = await sequelize.query(
      `
      SELECT
        s.id AS sessionId,
        COALESCE(a.name, s.visitor_label, CONCAT('Khách #', s.id)) AS senderLabel,
        COUNT(m.id) AS unreadCount,
        MAX(m.created_at) AS lastUnreadAt
      FROM ${sessionTable} s
      LEFT JOIN applicants a ON a.id = s.applicant_id
      INNER JOIN ${messageTable} m ON m.session_id = s.id
        AND m.sender_type = 'visitor'
        AND (s.admin_last_seen_at IS NULL OR m.created_at > s.admin_last_seen_at)
      GROUP BY s.id, a.name, s.visitor_label
      ORDER BY lastUnreadAt DESC
      `
    );
  }

  const senders = (senderRows || []).map((row) => ({
    sessionId: Number(row.sessionId),
    label: String(row.senderLabel || '').trim() || `Khách #${row.sessionId}`,
    unreadCount: Number(row.unreadCount || 0),
    lastUnreadAt: row.lastUnreadAt,
    kind,
  }));

  return {
    unreadSessions: Number(statsRow?.unreadSessions || 0),
    unreadMessages: Number(statsRow?.unreadMessages || 0),
    preview: previewRow?.preview ? String(previewRow.preview).slice(0, 120) : null,
    visitorLabel: previewRow?.visitorLabel || null,
    sessionId: previewRow?.sessionId != null ? Number(previewRow.sessionId) : null,
    senders,
    totalSenders: senders.length,
  };
}

/**
 * Gộp senders từ CTV + ứng viên, sắp theo tin mới nhất.
 */
export async function getAdminCombinedUnreadSenders() {
  const [ctvSummary, candidateSummary] = await Promise.all([
    getAdminInboxUnreadSummary('ctv'),
    getAdminInboxUnreadSummary('candidate'),
  ]);
  const merged = [...(ctvSummary.senders || []), ...(candidateSummary.senders || [])].sort(
    (a, b) => new Date(b.lastUnreadAt).getTime() - new Date(a.lastUnreadAt).getTime()
  );
  return {
    unreadMessages:
      Number(ctvSummary.unreadMessages || 0) + Number(candidateSummary.unreadMessages || 0),
    unreadSessions:
      Number(ctvSummary.unreadSessions || 0) + Number(candidateSummary.unreadSessions || 0),
    senders: merged,
    totalSenders: merged.length,
    preview: ctvSummary.preview || candidateSummary.preview || null,
    sessionId: merged[0]?.sessionId ?? ctvSummary.sessionId ?? candidateSummary.sessionId ?? null,
    tab: merged[0]?.kind === 'candidate' ? 'candidate' : 'ctv',
  };
}
