/**
 * Kiểm tra realtime chat hỗ trợ CTV ↔ Admin.
 *
 * Mặc định: in-process (DB + SSE fan-out) — không cần server HTTP đang chạy.
 * E2E HTTP:   node scripts/test-public-chat-realtime.mjs --e2e
 *
 * Env:
 *   API_URL=http://127.0.0.1:3000   (chỉ --e2e)
 *   PORT=3000                       (fallback API_URL)
 *   ADMIN_EMAIL / ADMIN_PASSWORD    (tuỳ chọn --e2e)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
function arg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const E2E = args.includes('--e2e');
const ADMIN_EMAIL = arg('--email') || process.env.ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = arg('--password') || process.env.ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD;
const TIMEOUT_MS = Number(process.env.REALTIME_TEST_TIMEOUT_MS || 8000);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const API_URL = (arg('--api-url') || process.env.API_URL || `http://127.0.0.1:${process.env.PORT || 3000}`).replace(/\/+$/, '');

function fail(msg) {
  console.error(`\n❌ FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function parseSseChunks(chunks) {
  const text = chunks.join('');
  const events = [];
  for (const block of text.split('\n\n')) {
    if (!block.trim()) continue;
    let eventName = 'message';
    let dataLine = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      if (line.startsWith('data:')) dataLine += line.slice(5).trim();
    }
    if (!dataLine) continue;
    try {
      events.push({ eventName, data: JSON.parse(dataLine) });
    } catch {
      events.push({ eventName, data: dataLine });
    }
  }
  return events;
}

function mockSseResponse() {
  const chunks = [];
  return {
    chunks,
    write(chunk) {
      chunks.push(String(chunk));
    },
  };
}

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function fetchOrFail(url, options, label) {
  try {
    return await fetch(url, options);
  } catch (e) {
    const code = e?.cause?.code || e?.code || '';
    const hint =
      code === 'ECONNREFUSED'
        ? `\n   → Backend chưa chạy tại ${API_URL}. Khởi động server hoặc bỏ --e2e (test in-process mặc định).`
        : '';
    fail(`${label}: fetch failed${code ? ` (${code})` : ''}${hint}\n   URL: ${url}`);
  }
}

async function getAdminJwtFromDb() {
  const { default: sequelize } = await import('../src/config/database.js');
  const { Admin } = await import('../src/models/index.js');
  await sequelize.authenticate();
  const admin = await Admin.findOne({
    where: { status: 1, isActive: true },
    order: [['id', 'ASC']],
    attributes: ['id', 'email'],
  });
  if (!admin) fail('Không tìm thấy admin active trong DB');
  console.log(`ℹ️  JWT dev admin #${admin.id} (${admin.email})`);
  return { adminId: admin.id, token: jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: '1h' }), sequelize };
}

/** In-process: DB + SSE — xác nhận fan-out giống controller. */
async function runInProcessTest() {
  console.log('\n🧪 Test realtime (in-process: DB + SSE)\n');

  const { publicCtvChatSseService } = await import('../src/services/publicCtvChatSseService.js');
  const { PublicCtvChatSession, PublicCtvChatMessage } = await import('../src/models/index.js');
  const { adminId, sequelize } = await getAdminJwtFromDb();
  ok('Kết nối DB OK');

  const sessionToken = uuidv4();
  const session = await PublicCtvChatSession.create({
    sessionToken,
    visitorLabel: 'Realtime Test CTV',
    status: 'open',
  });
  ok(`Tạo phiên CTV #${session.id}`);

  const sessionSse = mockSseResponse();
  const inboxSse = mockSseResponse();
  publicCtvChatSseService.subscribeSession(session.id, sessionSse);
  publicCtvChatSseService.subscribeAdminInbox(inboxSse);

  const visitorText = `ctv-rt-${Date.now()}`;
  const visitorMsg = await PublicCtvChatMessage.create({
    sessionId: session.id,
    senderType: 'visitor',
    adminId: null,
    body: visitorText,
  });
  const visitorPayload = {
    type: 'message',
    message: {
      id: visitorMsg.id,
      sessionId: session.id,
      senderType: 'visitor',
      adminId: null,
      body: visitorText,
      createdAt: visitorMsg.createdAt,
    },
  };
  publicCtvChatSseService.emitToSession(session.id, visitorPayload);
  publicCtvChatSseService.emitToAdminInbox({
    ...visitorPayload,
    sessionId: session.id,
    sessionToken: session.sessionToken,
    visitorLabel: session.visitorLabel,
    hasUnread: true,
  });

  const inboxEvents = parseSseChunks(inboxSse.chunks);
  const inboxHit = inboxEvents.find(
    (ev) => ev.eventName === 'chat' && ev.data?.message?.body === visitorText
  );
  if (!inboxHit) fail('Admin inbox SSE không nhận tin CTV (in-process)');
  ok(`Admin inbox SSE nhận tin CTV (sessionId=${inboxHit.data.sessionId})`);

  sessionSse.chunks.length = 0;
  inboxSse.chunks.length = 0;

  const adminText = `admin-rt-${Date.now()}`;
  const adminMsg = await PublicCtvChatMessage.create({
    sessionId: session.id,
    senderType: 'admin',
    adminId,
    body: adminText,
  });
  const adminPayload = {
    type: 'message',
    message: {
      id: adminMsg.id,
      sessionId: session.id,
      senderType: 'admin',
      adminId,
      body: adminText,
      createdAt: adminMsg.createdAt,
    },
  };
  publicCtvChatSseService.emitToSession(session.id, adminPayload);
  publicCtvChatSseService.emitToAdminInbox({
    ...adminPayload,
    sessionId: session.id,
    sessionToken: session.sessionToken,
    visitorLabel: session.visitorLabel,
    hasUnread: true,
  });

  const sessionEvents = parseSseChunks(sessionSse.chunks);
  const sessionHit = sessionEvents.find(
    (ev) => ev.eventName === 'chat' && ev.data?.message?.body === adminText
  );
  if (!sessionHit) fail('CTV session SSE không nhận tin admin (in-process)');
  ok(`CTV session SSE nhận tin admin (messageId=${sessionHit.data.message?.id})`);

  publicCtvChatSseService.unsubscribeSession(session.id, sessionSse);
  publicCtvChatSseService.unsubscribeAdminInbox(inboxSse);
  await PublicCtvChatMessage.destroy({ where: { sessionId: session.id } });
  await session.destroy();
  await sequelize.close();

  console.log('\n🎉 PASS — Realtime chat (in-process DB + SSE) OK.\n');
}

async function adminLoginHttp() {
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const res = await fetchOrFail(
      `${API_URL}/api/admin/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      },
      'Admin login HTTP'
    );
    const data = await readJson(res);
    if (res.ok && data.success && data.data?.token) return data.data.token;
    fail(`Admin login HTTP thất bại: ${data.message || res.status}`);
  }
  const { token } = await getAdminJwtFromDb();
  return token;
}

function waitForSseEvent(url, predicate, label) {
  return new Promise((resolve, reject) => {
    const ac = new AbortController();
    const timer = setTimeout(() => {
      ac.abort();
      reject(new Error(`Timeout ${TIMEOUT_MS}ms chờ SSE: ${label}`));
    }, TIMEOUT_MS);

    (async () => {
      try {
        const res = await fetchOrFail(url, { signal: ac.signal }, `SSE ${label}`);
        if (!res.ok) throw new Error(`SSE ${label} HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';
          for (const block of blocks) {
            if (!block.trim()) continue;
            let eventName = 'message';
            let dataLine = '';
            for (const line of block.split('\n')) {
              if (line.startsWith('event:')) eventName = line.slice(6).trim();
              if (line.startsWith('data:')) dataLine += line.slice(5).trim();
            }
            if (!dataLine) continue;
            let data;
            try {
              data = JSON.parse(dataLine);
            } catch {
              continue;
            }
            const ev = { eventName, data };
            if (ev.eventName === 'ping' || ev.eventName === 'connected') continue;
            if (predicate(ev)) {
              clearTimeout(timer);
              ac.abort();
              resolve(ev);
              return;
            }
          }
        }
        reject(new Error(`SSE ${label} đóng trước khi nhận event`));
      } catch (e) {
        if (e.name === 'AbortError') return;
        clearTimeout(timer);
        reject(e);
      }
    })();
  });
}

async function runE2eTest() {
  console.log(`\n🧪 Test realtime E2E HTTP — ${API_URL}\n`);

  const probe = await fetchOrFail(
    `${API_URL}/api/public/ctv-chat/sessions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorLabel: 'probe' }),
    },
    'Probe API'
  );
  const probeData = await readJson(probe);
  if (!probe.ok || !probeData.success) {
    fail(`API không phản hồi đúng: ${probeData.message || probe.status}`);
  }
  ok('Backend HTTP reachable');

  const adminToken = await adminLoginHttp();
  ok('Admin token OK');

  const sessionRes = await fetchOrFail(
    `${API_URL}/api/public/ctv-chat/sessions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorLabel: 'Realtime Test CTV' }),
    },
    'Tạo phiên CTV'
  );
  const sessionData = await readJson(sessionRes);
  if (!sessionRes.ok || !sessionData.success) {
    fail(`Tạo phiên CTV thất bại: ${sessionData.message || sessionRes.status}`);
  }
  const { sessionToken, sessionId } = sessionData.data;
  ok(`Phiên CTV #${sessionId}`);

  const visitorText = `ctv-realtime-${Date.now()}`;
  const adminText = `admin-realtime-${Date.now()}`;

  const adminInboxUrl = `${API_URL}/api/admin/public-ctv-chat/inbox-stream?token=${encodeURIComponent(adminToken)}`;
  const sessionStreamUrl = `${API_URL}/api/public/ctv-chat/stream?${new URLSearchParams({ sessionToken }).toString()}`;

  const adminWait = waitForSseEvent(
    adminInboxUrl,
    (ev) => ev.eventName === 'chat' && ev.data?.type === 'message' && ev.data?.message?.body === visitorText,
    'admin inbox nhận tin CTV'
  );

  await new Promise((r) => setTimeout(r, 400));

  const visitorPost = await fetchOrFail(
    `${API_URL}/api/public/ctv-chat/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, body: visitorText }),
    },
    'Gửi tin CTV'
  );
  const visitorData = await readJson(visitorPost);
  if (!visitorPost.ok || !visitorData.success) {
    fail(`Gửi tin CTV thất bại: ${visitorData.message || visitorPost.status}`);
  }
  ok(`CTV gửi: "${visitorText}"`);

  const adminEv = await adminWait;
  ok(`Admin inbox SSE nhận tin CTV (sessionId=${adminEv.data.sessionId})`);

  const visitorWait = waitForSseEvent(
    sessionStreamUrl,
    (ev) => ev.eventName === 'chat' && ev.data?.type === 'message' && ev.data?.message?.body === adminText,
    'CTV session nhận tin admin'
  );

  await new Promise((r) => setTimeout(r, 400));

  const adminPost = await fetchOrFail(
    `${API_URL}/api/admin/public-ctv-chat/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ body: adminText }),
    },
    'Gửi tin admin'
  );
  const adminData = await readJson(adminPost);
  if (!adminPost.ok || !adminData.success) {
    fail(`Gửi tin admin thất bại: ${adminData.message || adminPost.status}`);
  }
  ok(`Admin gửi: "${adminText}"`);

  await visitorWait;
  ok('CTV session SSE nhận tin admin');

  console.log('\n🎉 PASS — Realtime chat E2E HTTP OK.\n');
}

async function main() {
  if (E2E) {
    await runE2eTest();
  } else {
    await runInProcessTest();
  }
}

main().catch((e) => {
  console.error(`\n❌ ${e.message || e}\n`);
  process.exit(1);
});
