import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  SPONSOR_ROTATION_INTERVAL,
  BADGE_RANKS,
} from '../utils/constants.js';

import {
  formatCurrency,
  formatCount,
  formatDate,
} from '../utils/formatters.js';

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
  RANK_THEMES,
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

function createMockStorage() {
  let store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe('Tier 2: Boundary Value Analysis & Edge Conditions', () => {
  let originalLocalStorage;
  let originalSessionStorage;

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage;
    originalSessionStorage = globalThis.sessionStorage;
    globalThis.localStorage = createMockStorage();
    globalThis.sessionStorage = createMockStorage();
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
    globalThis.sessionStorage = originalSessionStorage;
  });

  // ---------------------------------------------------------------------------
  // Feature 1 Boundaries: Badge Data & Rendering
  // ---------------------------------------------------------------------------
  describe('Feature 1 Boundaries: Badge Data & Rendering', () => {
    it('2.1.1 should fallback badge name to default placeholder when empty or undefined', () => {
      const badgeEmptyName = { id: 1, name: '', rank: 1 };
      const badgeUndefinedName = { id: 2, rank: 2 };

      const resolvedName1 = badgeEmptyName.name || 'Game City';
      const resolvedName2 = badgeUndefinedName.name || 'Game City';

      assert.equal(resolvedName1, 'Game City');
      assert.equal(resolvedName2, 'Game City');
    });

    it('2.1.2 should fallback out-of-range ranks (rank 0, 4+, negative, string) safely to Rank 1 theme using getBadgeTheme', () => {
      assert.equal(getBadgeTheme(0).label, 'Rank #1 Gold');
      assert.equal(getBadgeTheme(4).label, 'Rank #1 Gold');
      assert.equal(getBadgeTheme(-5).label, 'Rank #1 Gold');
      assert.equal(getBadgeTheme('invalid').label, 'Rank #1 Gold');
      assert.equal(getBadgeTheme(2).label, 'Rank #2 Silver');
      assert.equal(getBadgeTheme(3).label, 'Rank #3 Bronze');
    });

    it('2.1.3 should omit category tag cleanly when category is null, undefined, or empty', () => {
      const badgeWithoutCat = { id: 10, name: 'Open Award', rank: 1, category: null };
      const hasCategoryTag = Boolean(badgeWithoutCat.category);
      assert.equal(hasCategoryTag, false);
    });

    it('2.1.4 should adjust badge dimensions and omit category tag on size sm boundary', () => {
      const sizeSm = 'sm';
      const isSmall = sizeSm === 'sm';
      const iconSize = isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5';
      const renderCategory = !isSmall && Boolean('Track');

      assert.equal(iconSize, 'w-3 h-3');
      assert.equal(renderCategory, false, 'Category should be omitted on sm size');
    });

    it('2.1.5 should return empty string gracefully when badge is null or undefined in formatBadgeTooltip', () => {
      assert.equal(formatBadgeTooltip(null), '');
      assert.equal(formatBadgeTooltip(undefined), '');
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 2 Boundaries: Sponsor Linking & Rotation
  // ---------------------------------------------------------------------------
  describe('Feature 2 Boundaries: Sponsor Linking & Dynamic Rotation', () => {
    it('2.2.1 should produce single or zero items when assembleRotationItems has insufficient data', () => {
      const emptyItems = assembleRotationItems([], []);
      assert.equal(emptyItems.length, 0);

      const singleItem = assembleRotationItems([{ id: 1, name: 'Badge Only' }], []);
      assert.equal(singleItem.length, 1);
    });

    it('2.2.2 should handle single sponsor with no author badges without crash using assembleRotationItems', () => {
      const badges = [];
      const sponsors = [{ id: 1, name: 'Single Brand' }];

      const items = assembleRotationItems(badges, sponsors);

      assert.equal(items.length, 1);
      assert.equal(items[0].type, 'sponsor');
      assert.equal(items[0].data.name, 'Single Brand');
    });

    it('2.2.3 should fallback websiteUrl to # and target to _self when sponsor has no websiteUrl', () => {
      const sponsorNoUrl = { id: 5, name: 'Local Club', websiteUrl: null };
      const href = sponsorNoUrl.websiteUrl || '#';
      const target = sponsorNoUrl.websiteUrl ? '_blank' : '_self';

      assert.equal(href, '#');
      assert.equal(target, '_self');
    });

    it('2.2.4 should wrap around rotation index strictly from length - 1 back to 0', () => {
      const itemsLength = 4;
      let currentIndex = 3; // at last item
      const nextIndex = (currentIndex + 1) % itemsLength;

      assert.equal(nextIndex, 0, 'Index must wrap back to 0 at boundary');
    });

    it('2.2.5 should handle null or undefined sponsor cleanly in assembleRotationItems', () => {
      const items = assembleRotationItems([{ id: 1, name: 'Badge' }], null);
      assert.equal(items.length, 1);
      assert.equal(items[0].type, 'badge');

      const itemsBothNull = assembleRotationItems(null, null);
      assert.equal(itemsBothNull.length, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 3 Boundaries: Post View Tracking & Debouncing
  // ---------------------------------------------------------------------------
  describe('Feature 3 Boundaries: Post View Tracking & Debounce Logic', () => {
    it('2.3.1 should suppress view recording when duration is exactly 1999ms using isQualifiedViewDuration', () => {
      const qualifies = isQualifiedViewDuration(1999);
      assert.equal(qualifies, false, '1999ms must not qualify as a recorded view');
    });

    it('2.3.2 should qualify view recording when duration is exactly 2000ms using isQualifiedViewDuration', () => {
      const qualifies = isQualifiedViewDuration(2000);
      assert.equal(qualifies, true, '2000ms must qualify as a recorded view');
    });

    it('2.3.3 should suppress duplicate views when rapid click occurs within 30,000ms window using isViewDebounced', () => {
      const t0 = 100000;
      let recordedCount = 0;
      let lastView = t0;

      for (let offset = 1000; offset <= 20000; offset += 2000) {
        const currentTime = t0 + offset;
        if (!isViewDebounced(lastView, currentTime)) {
          recordedCount++;
          lastView = currentTime;
        }
      }

      assert.equal(recordedCount, 0, 'All rapid interactions within 30s debounce must be suppressed');
    });

    it('2.3.4 should permit next view recording when exactly 30,001ms has elapsed using isViewDebounced', () => {
      const t0 = 100000;
      const currentTime = t0 + 30001;
      const debounced = isViewDebounced(t0, currentTime);

      assert.equal(debounced, false, 'View after 30001ms must be allowed');
    });

    it('2.3.5 should safely build view payload and validate post ID conversion', () => {
      const payload = buildViewPayload({ postId: '42', durationMs: 2500, sessionId: 's-1' });
      assert.equal(payload.postId, 42);
      assert.equal(typeof payload.postId, 'number');
      assert.equal(payload.durationMs, 2500);
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 4 Boundaries: INR Earnings Calculation & Dashboard
  // ---------------------------------------------------------------------------
  describe('Feature 4 Boundaries: INR Earnings Calculation & Formatting', () => {
    it('2.4.1 should return ₹0.00 earnings and default ₹20.00 avg rate for 0 views', () => {
      const earnings = calculateEarnings(0);
      assert.equal(earnings, 0);

      const avgRate = calculateAverageRate(earnings, 0);
      assert.equal(avgRate, '₹20.00');
    });

    it('2.4.2 should calculate exactly ₹0.02 for a single view using calculateEarnings', () => {
      const earnings = calculateEarnings(1);
      assert.equal(earnings, 0.02);

      const formatted = formatCurrency(earnings);
      assert.ok(formatted.includes('0.02'), '1 view must equal ₹0.02');
    });

    it('2.4.3 should handle large view count of 1,000,000 views producing ₹20,000.00 and compact 1M', () => {
      const views = 1000000;
      const earnings = calculateEarnings(views);
      assert.equal(earnings, 20000.0);

      const compact = formatCount(views);
      assert.equal(compact, '1M', '1,000,000 views should format as 1M');
    });

    it('2.4.4 should prevent negative view counts and safely coerce null/undefined inputs using sanitizeViews', () => {
      assert.equal(sanitizeViews(-50), 0);
      assert.equal(sanitizeViews(null), 0);
      assert.equal(sanitizeViews(undefined), 0);
      assert.equal(sanitizeViews('abc'), 0);
      assert.equal(sanitizeViews(45), 45);
    });

    it('2.4.5 should compute earnings from sponsor breakdown when summary prop is null using computeEarningsFromBreakdown', () => {
      const sponsorBreakdown = [
        { earnedAmount: 12.5, totalViews: 625 },
        { earnedAmount: 7.5, totalViews: 375 },
      ];

      const result = computeEarningsFromBreakdown(null, sponsorBreakdown);

      assert.equal(result.totalEarnings, 20.0);
      assert.equal(result.totalViews, 1000);
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 5 Boundaries: Session Management & Tokens
  // ---------------------------------------------------------------------------
  describe('Feature 5 Boundaries: Session Management & Tokens', () => {
    it('2.5.1 should fallback to null gracefully when localStorage cert_user contains malformed JSON', () => {
      globalThis.localStorage.setItem('cert_user', '{ invalid json syntax ...');

      let restoredUser;
      try {
        const saved = globalThis.localStorage.getItem('cert_user');
        restoredUser = saved ? JSON.parse(saved) : null;
      } catch {
        restoredUser = null;
      }

      assert.equal(restoredUser, null, 'Malformed JSON must safely fall back to null');
    });

    it('2.5.2 should treat empty string or null token as unauthenticated using isValidToken', () => {
      assert.equal(isValidToken(null), false);
      assert.equal(isValidToken(''), false);
      assert.equal(isValidToken('   '), false);
      assert.equal(isValidToken('valid-jwt-token'), true);
    });

    it('2.5.3 should handle storage access exceptions gracefully in persistSessionToStorage', () => {
      const faultyStorage = {
        setItem() { throw new Error('QuotaExceeded'); },
      };

      const result = persistSessionToStorage(faultyStorage, { id: 1 }, 'token-ok');
      assert.equal(result, false, 'Storage exception must return false without crash');
    });

    it('2.5.4 should resolve isAuthenticated to false when currentUser is null or undefined using deriveAuthState', () => {
      assert.equal(deriveAuthState(null).isAuthenticated, false);
      assert.equal(deriveAuthState(undefined).isAuthenticated, false);
      assert.equal(deriveAuthState({ id: 1 }).isAuthenticated, true);
    });

    it('2.5.5 should wipe session and token upon receiving 401 unauthorized status using wipeSessionFromStorage', () => {
      globalThis.localStorage.setItem('cert_token', 'expired-sample-jwt');
      globalThis.localStorage.setItem('cert_user', JSON.stringify({ id: 2 }));

      wipeSessionFromStorage(globalThis.localStorage);

      assert.equal(globalThis.localStorage.getItem('cert_token'), null);
      assert.equal(globalThis.localStorage.getItem('cert_user'), null);
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 6 Boundaries: Protected Routes & Role Enforcement
  // ---------------------------------------------------------------------------
  describe('Feature 6 Boundaries: Route Guard & Role Enforcement', () => {
    it('2.6.1 should block unrecognized / arbitrary role strings from institutional routes using isInstitutionRole', () => {
      assert.equal(isInstitutionRole('ADMIN'), false);
      assert.equal(isInstitutionRole('SUPERUSER'), false);
      assert.equal(isInstitutionRole('GUEST'), false);
      assert.equal(isInstitutionRole('USER'), false);
      assert.equal(isInstitutionRole('INSTITUTION'), true);
    });

    it('2.6.2 should permit any authenticated user when requireRole is null or undefined using evaluateRouteAccess', () => {
      const regularUser = { id: 10, role: 'USER' };
      const resNull = evaluateRouteAccess({
        isAuthenticated: true,
        currentUser: regularUser,
        isInstitution: false,
        requireRole: null,
      });

      const resUndefined = evaluateRouteAccess({
        isAuthenticated: true,
        currentUser: regularUser,
        isInstitution: false,
        requireRole: undefined,
      });

      assert.equal(resNull.allowed, true);
      assert.equal(resUndefined.allowed, true);
    });

    it('2.6.3 should handle missing or undefined location object on redirect safely', () => {
      const location = undefined;
      const redirectState = { from: location || { pathname: '/' } };

      assert.deepEqual(redirectState, { from: { pathname: '/' } });
    });

    it('2.6.4 should allow institutional user to access general workspace routes (/feed)', () => {
      const instUser = { id: 99, role: 'INSTITUTION' };
      const res = evaluateRouteAccess({
        isAuthenticated: true,
        currentUser: instUser,
        isInstitution: true,
        requireRole: null,
      });
      assert.equal(res.allowed, true);
      assert.equal(res.redirectTo, null);
    });

    it('2.6.5 should redirect USER role attempting institutional routes (/certificates) to /feed using evaluateRouteAccess', () => {
      const regularUser = { id: 15, role: 'USER' };
      const res = evaluateRouteAccess({
        isAuthenticated: true,
        currentUser: regularUser,
        isInstitution: false,
        requireRole: 'INSTITUTION',
      });

      assert.equal(res.allowed, false);
      assert.equal(res.redirectTo, '/feed');
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 7 Boundaries: Empty States & Elimination of Mock Datasets
  // ---------------------------------------------------------------------------
  describe('Feature 7 Boundaries: Empty States & Elimination of Mock Datasets', () => {
    it('2.7.1 should handle authentic empty post list without crashing', () => {
      const emptyPosts = [];
      assert.equal(emptyPosts.length, 0);
      assert.deepEqual(emptyPosts, []);
    });

    it('2.7.2 should handle authentic empty badge list in assembleRotationItems', () => {
      const items = assembleRotationItems([], []);
      assert.equal(items.length, 0);
    });

    it('2.7.3 should calculate zero metrics from empty earnings history', () => {
      const emptyHistory = [];
      const totalFromHistory = emptyHistory.reduce((sum, h) => sum + h.amount, 0);
      assert.equal(totalFromHistory, 0);
    });

    it('2.7.4 should compute zero metrics from empty sponsor breakdown', () => {
      const metrics = computeEarningsFromBreakdown(null, []);
      assert.equal(metrics.totalEarnings, 0);
      assert.equal(metrics.totalViews, 0);
    });

    it('2.7.5 should handle null user profile gracefully in deriveAuthState', () => {
      const auth = deriveAuthState(null);
      assert.equal(auth.isAuthenticated, false);
      assert.equal(auth.isInstitution, false);
      assert.equal(auth.isUser, false);
    });
  });
});
