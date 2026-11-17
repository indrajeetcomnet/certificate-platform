/**
 * Post and sponsor view tracking qualification, debouncing, and payload construction utilities.
 */

export const MIN_VIEW_DURATION_MS = 2000;
export const VIEW_DEBOUNCE_WINDOW_MS = 30000;

/**
 * Check whether a view duration meets the qualification threshold (2000ms).
 *
 * @param {*} durationMs
 * @returns {boolean}
 */
export function isQualifiedViewDuration(durationMs) {
  return typeof durationMs === 'number' && durationMs >= MIN_VIEW_DURATION_MS;
}

/**
 * Check whether a view should be debounced based on last recorded view timestamp.
 *
 * @param {number|string} lastViewTime
 * @param {number|string} currentTime
 * @param {number} [windowMs=VIEW_DEBOUNCE_WINDOW_MS]
 * @returns {boolean}
 */
export function isViewDebounced(lastViewTime, currentTime, windowMs = VIEW_DEBOUNCE_WINDOW_MS) {
  const last = Number(lastViewTime) || 0;
  const current = Number(currentTime) || 0;
  if (last === 0) return false;
  return (current - last) < windowMs;
}

/**
 * Construct payload conforming to /api/v1/views/record specification.
 *
 * @param {object} params
 * @param {number|string} params.postId
 * @param {number|string|null} [params.sponsorId=null]
 * @param {string} [params.viewType='POST']
 * @param {number|string} params.durationMs
 * @param {string} params.sessionId
 * @param {number|string|null} [params.userId=null]
 * @returns {object}
 */
export function buildViewPayload({ postId, sponsorId = null, viewType = 'POST', durationMs, sessionId, userId = null }) {
  return {
    postId: Number(postId),
    ...(sponsorId != null && { sponsorId: Number(sponsorId) }),
    viewType,
    durationMs: Number(durationMs),
    sessionId: String(sessionId),
    userId: userId != null ? Number(userId) : null,
  };
}

export default {
  MIN_VIEW_DURATION_MS,
  VIEW_DEBOUNCE_WINDOW_MS,
  isQualifiedViewDuration,
  isViewDebounced,
  buildViewPayload,
};
