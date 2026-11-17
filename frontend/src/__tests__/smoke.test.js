import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SPONSOR_ROTATION_INTERVAL,
  BADGE_RANKS,
  ROLE_NAV_ITEMS,
} from '../utils/constants.js';

import {
  formatCurrency,
  formatCount,
  formatDate,
} from '../utils/formatters.js';

import {
  email,
  required,
} from '../utils/validators.js';

import {
  evaluateRouteAccess,
  isInstitutionRole,
} from '../utils/routeGuard.js';

import {
  calculateEarnings,
  sanitizeViews,
  calculateAverageRate,
  computeEarningsFromBreakdown,
  INR_RATE_PER_THOUSAND,
} from '../utils/earnings.js';

import {
  isQualifiedViewDuration,
  isViewDebounced,
  buildViewPayload,
  MIN_VIEW_DURATION_MS,
  VIEW_DEBOUNCE_WINDOW_MS,
} from '../utils/viewUtils.js';

import {
  getBadgeTheme,
  formatBadgeTooltip,
  extractAuthorBadges,
} from '../utils/badgeThemes.js';

import {
  assembleRotationItems,
} from '../utils/rotatorUtils.js';

import {
  deriveAuthState,
  isValidToken,
  persistSessionToStorage,
  wipeSessionFromStorage,
} from '../utils/authUtils.js';

import * as authApi from '../api/authApi.js';
import * as viewsApi from '../api/viewsApi.js';
import * as postsApi from '../api/postsApi.js';
import * as badgesApi from '../api/badgesApi.js';
import * as certificatesApi from '../api/certificatesApi.js';
import * as sponsorsApi from '../api/sponsorsApi.js';

describe('Frontend Smoke Test Suite', () => {
  it('should verify constants and system thresholds exports', () => {
    assert.equal(SPONSOR_ROTATION_INTERVAL, 5000);
    assert.equal(BADGE_RANKS[1].label, 'Gold');
    assert.equal(BADGE_RANKS[2].label, 'Silver');
    assert.equal(BADGE_RANKS[3].label, 'Bronze');
    assert.ok(ROLE_NAV_ITEMS.USER.length >= 3);
    assert.ok(ROLE_NAV_ITEMS.INSTITUTION.length >= 3);
  });

  it('should verify formatters and validators exports', () => {
    assert.ok(formatCurrency(20).includes('20'));
    assert.equal(formatCount(1500), '1.5K');
    assert.equal(email('athlete@example.com'), null);
    assert.ok(email('invalid-email') !== null);
    assert.equal(required(''), 'This field is required');
  });

  it('should verify routeGuard and role enforcement utilities', () => {
    assert.equal(isInstitutionRole('INSTITUTION'), true);
    assert.equal(isInstitutionRole('USER'), false);

    const unauth = evaluateRouteAccess({ isAuthenticated: false, currentUser: null, isInstitution: false });
    assert.deepEqual(unauth, { allowed: false, redirectTo: '/login' });

    const authUser = evaluateRouteAccess({
      isAuthenticated: true,
      currentUser: { id: 1, role: 'USER' },
      isInstitution: false,
      requireRole: 'INSTITUTION',
    });
    assert.deepEqual(authUser, { allowed: false, redirectTo: '/feed' });

    const authInst = evaluateRouteAccess({
      isAuthenticated: true,
      currentUser: { id: 2, role: 'INSTITUTION' },
      isInstitution: true,
      requireRole: 'INSTITUTION',
    });
    assert.deepEqual(authInst, { allowed: true, redirectTo: null });
  });

  it('should verify earnings calculation utilities', () => {
    assert.equal(INR_RATE_PER_THOUSAND, 20.0);
    assert.equal(sanitizeViews(-10), 0);
    assert.equal(sanitizeViews(2500), 2500);
    assert.equal(calculateEarnings(1000), 20.0);
    assert.equal(calculateEarnings(500), 10.0);
    assert.ok(calculateAverageRate(20, 1000).includes('20'));
    assert.deepEqual(computeEarningsFromBreakdown(null, [{ earnedAmount: 10, totalViews: 500 }]), {
      totalEarnings: 10,
      totalViews: 500,
    });
  });

  it('should verify view tracking qualification and debounce utilities', () => {
    assert.equal(MIN_VIEW_DURATION_MS, 2000);
    assert.equal(VIEW_DEBOUNCE_WINDOW_MS, 30000);
    assert.equal(isQualifiedViewDuration(1999), false);
    assert.equal(isQualifiedViewDuration(2000), true);
    assert.equal(isViewDebounced(1000, 15000), true);
    assert.equal(isViewDebounced(1000, 32000), false);

    const payload = buildViewPayload({ postId: 10, durationMs: 2500, sessionId: 's-123' });
    assert.equal(payload.postId, 10);
    assert.equal(payload.viewType, 'POST');
    assert.equal(payload.durationMs, 2500);
  });

  it('should verify badge themes and rotator utilities', () => {
    const theme = getBadgeTheme(1);
    assert.equal(theme.label, 'Rank #1 Gold');
    assert.equal(formatBadgeTooltip({ name: 'Championship', rank: 1, category: 'Athletics' }), 'Championship · Rank #1 Gold (Athletics)');

    const badges = [{ id: 1, name: 'Badge 1' }];
    const sponsors = [{ id: 10, name: 'Sponsor 1' }];
    const rotation = assembleRotationItems(badges, sponsors);
    assert.equal(rotation.length, 2);
    assert.equal(rotation[0].type, 'badge');
    assert.equal(rotation[1].type, 'sponsor');
  });

  it('should verify auth session management utilities', () => {
    const user = { id: 10, role: 'USER' };
    const authState = deriveAuthState(user);
    assert.equal(authState.isAuthenticated, true);
    assert.equal(authState.isUser, true);
    assert.equal(authState.isInstitution, false);

    assert.equal(isValidToken(''), false);
    assert.equal(isValidToken('jwt-token-xyz'), true);

    const mockStorage = {
      data: {},
      setItem(k, v) { this.data[k] = v; },
      getItem(k) { return this.data[k] || null; },
      removeItem(k) { delete this.data[k]; },
    };
    persistSessionToStorage(mockStorage, user, 'token-123');
    assert.equal(mockStorage.getItem('cert_token'), 'token-123');
    wipeSessionFromStorage(mockStorage);
    assert.equal(mockStorage.getItem('cert_token'), null);
  });

  it('should verify API client contracts export required methods', () => {
    assert.equal(typeof authApi.login, 'function');
    assert.equal(typeof authApi.register, 'function');
    assert.equal(typeof authApi.institutionLogin, 'function');
    assert.equal(typeof authApi.logout, 'function');

    assert.equal(typeof viewsApi.recordView, 'function');
    assert.equal(typeof viewsApi.getEarnings, 'function');

    assert.equal(typeof postsApi.getFeed, 'function');
    assert.equal(typeof postsApi.createPost, 'function');
    assert.equal(typeof postsApi.likePost, 'function');
    assert.equal(typeof postsApi.unlikePost, 'function');

    assert.equal(typeof badgesApi.getAll, 'function');
    assert.equal(typeof badgesApi.create, 'function');
    assert.equal(typeof badgesApi.assignToUser, 'function');

    assert.equal(typeof certificatesApi.create, 'function');
    assert.equal(typeof certificatesApi.bulkCreate, 'function');
    assert.equal(typeof certificatesApi.verify, 'function');

    assert.equal(typeof sponsorsApi.getAll, 'function');
    assert.equal(typeof sponsorsApi.create, 'function');
    assert.equal(typeof sponsorsApi.linkBadge, 'function');
  });
});
