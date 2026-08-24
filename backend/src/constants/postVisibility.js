/**
 * Bitmask for posts.visibility_mask (where the published post appears).
 * 1 = CTV agent home / information feed (authenticated)
 * 2 = public collaborator landing (blog + home news block)
 * 4 = public candidate landing (blog + home news block)
 * 8 = business portal Knowledge Hub (/business/knowledge)
 */
export const POST_VISIBILITY_AGENT_HOME = 1;
export const POST_VISIBILITY_PUBLIC_CTV = 2;
export const POST_VISIBILITY_PUBLIC_CANDIDATE = 4;
export const POST_VISIBILITY_BUSINESS_KNOWLEDGE = 8;
export const POST_VISIBILITY_ALL =
  POST_VISIBILITY_AGENT_HOME
  | POST_VISIBILITY_PUBLIC_CTV
  | POST_VISIBILITY_PUBLIC_CANDIDATE
  | POST_VISIBILITY_BUSINESS_KNOWLEDGE;

/**
 * @param {unknown} raw
 * @returns {number} 0–15
 */
export function normalizePostVisibilityMask(raw) {
  const n = parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 0 || n > 15) return POST_VISIBILITY_ALL;
  return n;
}
