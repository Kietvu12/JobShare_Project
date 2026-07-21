import { io } from 'socket.io-client';
import { getApiOrigin } from './api.js';

let socket = null;
let socketOrigin = null;

export function getRealtimeClient() {
  const origin = getApiOrigin() || (typeof window !== 'undefined' ? window.location.origin : '');
  if (socket && socketOrigin !== origin) {
    try {
      socket.disconnect();
    } catch {
      /* ignore */
    }
    socket = null;
    socketOrigin = null;
  }
  if (socket) return socket;
  socketOrigin = origin;
  socket = io(origin, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    autoConnect: true,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
  return socket;
}

export function resetRealtimeClient() {
  if (socket) {
    try {
      socket.disconnect();
    } catch {
      /* ignore */
    }
  }
  socket = null;
  socketOrigin = null;
}
