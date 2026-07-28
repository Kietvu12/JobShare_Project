import { loadBackendEnv } from './loadBackendEnv.js';

loadBackendEnv();

const { default: sequelize } = await import('../src/config/database.js');
const { BusinessWsChatSession, BusinessWsChatMessage } = await import('../src/models/index.js');

async function main() {
  const [groups] = await sequelize.query(`
    SELECT business_id, session_type, MIN(id) AS keep_id, COUNT(*) AS cnt
    FROM business_ws_chat_sessions
    WHERE deleted_at IS NULL
    GROUP BY business_id, session_type
    HAVING cnt > 1
  `);

  for (const row of groups) {
    const keepId = Number(row.keep_id);
    const duplicates = await BusinessWsChatSession.findAll({
      where: {
        businessId: row.business_id,
        sessionType: row.session_type,
      },
      order: [['id', 'ASC']],
    });
    const toMerge = duplicates.filter((s) => s.id !== keepId);
    if (!toMerge.length) continue;

    console.log(`[merge] business ${row.business_id} type ${row.session_type}: keep #${keepId}, merge ${toMerge.length} session(s)`);

    for (const dup of toMerge) {
      await BusinessWsChatMessage.update(
        { sessionId: keepId },
        { where: { sessionId: dup.id } },
      );
      await dup.destroy();
    }

    const keepSession = duplicates.find((s) => s.id === keepId);
    if (keepSession) {
      await keepSession.update({
        title: 'WS Team – Tuyển dụng',
        performanceRequestId: null,
      });
    }
  }

  await sequelize.close();
  console.log('[merge] done');
}

main().catch(async (error) => {
  console.error('[merge] failed:', error);
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
