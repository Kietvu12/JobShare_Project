import apiService from '../services/api';

const LS_TOKEN = 'ctv_landing_public_chat_token';

/** ensure + retry khi localStorage còn token phiên guest gắn tài khoản khác (403) */
export async function ensurePublicCtvSessionResilient({ sessionToken, visitorLabel }) {
  const body = {
    sessionToken: sessionToken || undefined,
    visitorLabel: visitorLabel || undefined,
  };
  try {
    return await apiService.ensurePublicCtvChatSession(body);
  } catch (e) {
    const msg = `${e?.data?.message || ''} ${e?.message || ''}`;
    const stale =
      sessionToken &&
      (e?.status === 403 || /gắn tài khoản|tài khoản khác|another account/i.test(msg));
    if (stale) {
      try {
        localStorage.removeItem(LS_TOKEN);
      } catch {
        /* ignore */
      }
      return apiService.ensurePublicCtvChatSession({
        visitorLabel: visitorLabel || undefined,
      });
    }
    throw e;
  }
}
