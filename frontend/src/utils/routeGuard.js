/**
 * Route guard evaluation and role enforcement utilities.
 */

/**
 * Evaluate whether a user has access to a target route based on authentication and role requirements.
 *
 * @param {object} params
 * @param {boolean} params.isAuthenticated - Whether user is currently authenticated
 * @param {object|null} params.currentUser - Authenticated user entity or null
 * @param {boolean} params.isInstitution - Whether user holds INSTITUTION role
 * @param {string|null} [params.requireRole=null] - Target route required role
 * @returns {{ allowed: boolean, redirectTo: string|null }}
 */
export function evaluateRouteAccess({ isAuthenticated, currentUser, isInstitution, requireRole = null }) {
  if (!isAuthenticated || !currentUser) {
    return { allowed: false, redirectTo: '/login' };
  }
  if (requireRole === 'INSTITUTION' && !isInstitution) {
    return { allowed: false, redirectTo: '/feed' };
  }
  return { allowed: true, redirectTo: null };
}

/**
 * Check if given role string is the institutional role.
 *
 * @param {string} role
 * @returns {boolean}
 */
export function isInstitutionRole(role) {
  return role === 'INSTITUTION';
}

export default {
  evaluateRouteAccess,
  isInstitutionRole,
};
