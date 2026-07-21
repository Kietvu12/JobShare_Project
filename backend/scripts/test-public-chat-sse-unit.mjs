/**
 * Unit test SSE fan-out (không cần HTTP / DB).
 */
import { publicCtvChatSseService } from '../src/services/publicCtvChatSseService.js';

function mockSseResponse() {
  const chunks = [];
  return {
    chunks,
    write(chunk) {
      chunks.push(String(chunk));
    },
  };
}

function parseLastChatEvent(chunks) {
  const text = chunks.join('');
  const match = text.match(/event: chat\ndata: (.+?)\n\n/s);
  if (!match) return null;
  return JSON.parse(match[1]);
}

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ ${msg}`);
    failed += 1;
  } else {
    console.log(`✅ ${msg}`);
  }
}

const sessionId = 999001;
const sessionRes = mockSseResponse();
const inboxRes = mockSseResponse();

publicCtvChatSseService.subscribeSession(sessionId, sessionRes);
publicCtvChatSseService.subscribeAdminInbox(inboxRes);

const payload = {
  type: 'message',
  sessionId,
  message: { id: 1, body: 'unit-test', senderType: 'visitor' },
};

publicCtvChatSseService.emitToSession(sessionId, payload);
publicCtvChatSseService.emitToAdminInbox({ ...payload, hasUnread: true });

const sessionEv = parseLastChatEvent(sessionRes.chunks);
const inboxEv = parseLastChatEvent(inboxRes.chunks);

assert(sessionEv?.message?.body === 'unit-test', 'emitToSession delivers chat event');
assert(inboxEv?.sessionId === sessionId, 'emitToAdminInbox delivers chat event');

publicCtvChatSseService.unsubscribeSession(sessionId, sessionRes);
publicCtvChatSseService.unsubscribeAdminInbox(inboxRes);

sessionRes.chunks.length = 0;
publicCtvChatSseService.emitToSession(sessionId, payload);
assert(sessionRes.chunks.length === 0, 'unsubscribeSession stops delivery');

if (failed) {
  console.error(`\n❌ SSE unit test failed (${failed} assertions)\n`);
  process.exit(1);
}

console.log('\n🎉 PASS — publicCtvChatSseService fan-out OK\n');
