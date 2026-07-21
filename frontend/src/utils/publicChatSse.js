/**
 * EventSource with auto-reconnect for public support chat (SSE).
 */

export function parsePublicChatSseEvent(ev) {
  try {
    const data = JSON.parse(ev.data);
    if (data?.type === 'message' && data.message) return data;
  } catch {
    // ignore malformed payloads
  }
  return null;
}

export function createReconnectingEventSource(
  url,
  { onEvent, eventName = 'chat', minDelayMs = 1000, maxDelayMs = 30000 } = {}
) {
  if (!url) return { close: () => {} };

  let es = null;
  let closed = false;
  let retryCount = 0;
  let retryTimer = null;

  const scheduleReconnect = () => {
    if (closed) return;
    const delay = Math.min(minDelayMs * 2 ** retryCount, maxDelayMs);
    retryCount += 1;
    retryTimer = window.setTimeout(connect, delay);
  };

  const connect = () => {
    if (closed) return;
    if (es) {
      es.close();
      es = null;
    }

    es = new EventSource(url);

    es.addEventListener(eventName, (ev) => {
      retryCount = 0;
      try {
        onEvent?.(ev);
      } catch (err) {
        console.error(err);
      }
    });

    es.onerror = () => {
      if (es) {
        es.close();
        es = null;
      }
      scheduleReconnect();
    };
  };

  connect();

  return {
    close() {
      closed = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (es) {
        es.close();
        es = null;
      }
    },
  };
}
