/**
 * Authentication and session storage management utilities.
 */

/**
 * Derive high-level authentication flags from the current user object.
 *
 * @param {object|null} user
 * @returns {{ isAuthenticated: boolean, isInstitution: boolean, isUser: boolean }}
 */
export function deriveAuthState(user) {
  return {
    isAuthenticated: user !== null && user !== undefined,
    isInstitution: user?.role === 'INSTITUTION',
    isUser: user?.role === 'USER',
  };
}

/**
 * Validate that a token string is non-empty and non-blank.
 *
 * @param {*} token
 * @returns {boolean}
 */
export function isValidToken(token) {
  return typeof token === 'string' && token.trim().length > 0;
}

/**
 * Persist user profile and token into specified Web Storage.
 *
 * @param {Storage} storage
 * @param {object} userObj
 * @param {string} [tokenStr]
 * @returns {boolean}
 */
export function persistSessionToStorage(storage, userObj, tokenStr) {
  if (!storage) return false;
  try {
    storage.setItem('cert_user', JSON.stringify(userObj));
    if (tokenStr) {
      storage.setItem('cert_token', tokenStr);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Wipe session and auth tokens from specified Web Storage.
 *
 * @param {Storage} storage
 */
export function wipeSessionFromStorage(storage) {
  if (!storage) return;
  try {
    storage.removeItem('cert_user');
    storage.removeItem('cert_token');
  } catch {
    // ignore
  }
}

export default {
  deriveAuthState,
  isValidToken,
  persistSessionToStorage,
  wipeSessionFromStorage,
};
