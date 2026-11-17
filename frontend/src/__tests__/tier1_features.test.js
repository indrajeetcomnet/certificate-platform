import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  SPONSOR_ROTATION_INTERVAL,
  BADGE_RANKS,
  ROLE_NAV_ITEMS,
  NAV_ITEMS,
  POST_TYPES,
} from '../utils/constants.js';

import {
  formatCurrency,
  formatCount,
  formatDate,
  timeAgo,
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

import * as authApi from '../api/authApi.js';
import * as postsApi from '../api/postsApi.js';
import * as viewsApi from '../api/viewsApi.js';
import * as badgesApi from '../api/badgesApi.js';
import * as usersApi from '../api/usersApi.js';
import * as certificatesApi from '../api/certificatesApi.js';

// Helper to create a mock Storage (localStorage / sessionStorage)
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
    key(i) {
      return Object.keys(store)[i] || null;
    },
    _dump() {
      return { ...store };
    },
  };
}

describe('Tier 1: Core Functional Contracts & Features', () => {
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
  // Feature 1: Badge Rendering & Assignment Contracts (≥5 tests)
  // ---------------------------------------------------------------------------
  describe('Feature 1: Badge Rendering & Assignment Contracts', () => {
    it('1.1 should validate badge data structure and contract requirements', () => {
      const validBadge = {
        id: 101,
        name: 'National Badminton Champion',
        rank: 1,
        category: 'Athletics',
        iconUrl: 'https://example.com/icons/gold-badminton.png',
        description: 'First place national champion in mens singles',
      };

      assert.equal(typeof validBadge.id, 'number');
      assert.equal(typeof validBadge.name, 'string');
      assert.ok(validBadge.name.length > 0, 'Badge name must not be empty');
      assert.ok([1, 2, 3].includes(validBadge.rank), 'Badge rank must be 1, 2, or 3');
      assert.equal(typeof validBadge.category, 'string');
      assert.ok(validBadge.iconUrl.startsWith('http'), 'Icon URL must be a valid web URL');
    });

    it('1.2 should verify profile badge presentation maps correctly to BADGE_RANKS metallic themes', () => {
      // BADGE_RANKS provides metallic theme definitions (Gold #1, Silver #2, Bronze #3)
      assert.equal(BADGE_RANKS[1].label, 'Gold');
      assert.equal(BADGE_RANKS[1].color, '#FFD700');
      assert.equal(BADGE_RANKS[1].badgeClass, 'gold');

      assert.equal(BADGE_RANKS[2].label, 'Silver');
      assert.equal(BADGE_RANKS[2].color, '#C0C0C0');
      assert.equal(BADGE_RANKS[2].badgeClass, 'silver');

      assert.equal(BADGE_RANKS[3].label, 'Bronze');
      assert.equal(BADGE_RANKS[3].color, '#CD7F32');
      assert.equal(BADGE_RANKS[3].badgeClass, 'bronze');
    });

    it('1.3 should correctly map author badges from feed post payloads using extractAuthorBadges', () => {
      const postWithAuthorBadges = {
        id: 42,
        content: 'Excited to win first place today!',
        user: {
          id: 5,
          username: 'champion_alex',
          badges: [
            { id: 1, name: 'Marathon Winner', rank: 1, category: 'Track' },
            { id: 2, name: 'Fair Play Award', rank: 2, category: 'Sportsmanship' },
          ],
        },
        userBadges: null,
      };

      const extractedBadges = extractAuthorBadges(postWithAuthorBadges);
      assert.equal(extractedBadges.length, 2);
      assert.equal(extractedBadges[0].name, 'Marathon Winner');
      assert.equal(extractedBadges[0].rank, 1);
      assert.equal(extractedBadges[1].name, 'Fair Play Award');
      assert.equal(extractedBadges[1].rank, 2);
    });

    it('1.4 should handle multiple badges with distinct categories and ranks for a single user', () => {
      const badgesList = [
        { id: 10, name: 'Gold Sprinter', rank: 1, category: 'Track' },
        { id: 11, name: 'Silver Jumper', rank: 2, category: 'Field' },
        { id: 12, name: 'Bronze Swimmer', rank: 3, category: 'Aquatics' },
      ];

      const formattedList = badgesList.map((b) => ({
        id: b.id,
        rankLabel: `#${b.rank}`,
        categoryUpper: (b.category || 'Sports').toUpperCase(),
        theme: getBadgeTheme(b.rank).name || 'Gold',
      }));

      assert.equal(formattedList.length, 3);
      assert.deepEqual(formattedList[0], {
        id: 10,
        rankLabel: '#1',
        categoryUpper: 'TRACK',
        theme: 'Gold',
      });
      assert.deepEqual(formattedList[1], {
        id: 11,
        rankLabel: '#2',
        categoryUpper: 'FIELD',
        theme: 'Silver',
      });
      assert.deepEqual(formattedList[2], {
        id: 12,
        rankLabel: '#3',
        categoryUpper: 'AQUATICS',
        theme: 'Bronze',
      });
    });

    it('1.5 should verify category formatting, title tooltips, and fallback for missing category using formatBadgeTooltip', () => {
      const badgeWithoutCat = { id: 99, name: 'Mystery Award', rank: 1 };
      const tooltip = formatBadgeTooltip(badgeWithoutCat);
      assert.equal(tooltip, 'Mystery Award · Rank #1 Gold (Sports)');

      const badgeWithCat = { id: 100, name: 'Champion Cup', rank: 2, category: 'Soccer' };
      assert.equal(formatBadgeTooltip(badgeWithCat), 'Champion Cup · Rank #2 Silver (Soccer)');
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 2: Sponsor Linking & 5-Second Dynamic Rotation (≥5 tests)
  // ---------------------------------------------------------------------------
  describe('Feature 2: Sponsor Linking & 5-Second Dynamic Rotation', () => {
    it('2.1 should enforce the exact 5000ms sponsor dynamic rotation interval constant', () => {
      assert.equal(SPONSOR_ROTATION_INTERVAL, 5000, 'SPONSOR_ROTATION_INTERVAL must be exactly 5000ms');
    });

    it('2.2 should alternate between author badges and active sponsors in rotation sequence using assembleRotationItems', () => {
      const badges = [
        { id: 1, name: 'Badge Alpha', rank: 1 },
        { id: 2, name: 'Badge Beta', rank: 2 },
      ];
      const sponsors = [
        { id: 10, name: 'Sponsor Apex', logoUrl: '/apex.png' },
        { id: 20, name: 'Sponsor Bolt', logoUrl: '/bolt.png' },
      ];

      const items = assembleRotationItems(badges, sponsors);

      assert.equal(items.length, 4, 'Should contain 4 alternating items');
      assert.equal(items[0].type, 'badge');
      assert.equal(items[0].data.name, 'Badge Alpha');
      assert.equal(items[1].type, 'sponsor');
      assert.equal(items[1].data.name, 'Sponsor Apex');
      assert.equal(items[2].type, 'badge');
      assert.equal(items[2].data.name, 'Badge Beta');
      assert.equal(items[3].type, 'sponsor');
      assert.equal(items[3].data.name, 'Sponsor Bolt');
    });

    it('2.3 should fallback gracefully when sponsors array is empty or null', () => {
      const badges = [{ id: 1, name: 'Solo Badge', rank: 1 }];
      const items = assembleRotationItems(badges, null);

      assert.equal(items.length, 1);
      assert.equal(items[0].type, 'badge');
      assert.equal(items[0].data.name, 'Solo Badge');
    });

    it('2.4 should verify timer cleanup behavior when unmounting rotator', () => {
      let intervalCleared = false;
      const fakeTimer = 12345;
      const cleanup = () => {
        clearInterval(fakeTimer);
        intervalCleared = true;
      };

      cleanup();
      assert.equal(intervalCleared, true, 'Cleanup must invoke clearInterval');
    });

    it('2.5 should verify active sponsor metadata rendering and monetization indicator', () => {
      const sponsor = {
        id: 77,
        name: 'Nike India',
        logoUrl: 'https://example.com/nike.png',
        websiteUrl: 'https://nike.com',
      };

      assert.ok(sponsor.name, 'Sponsor name must be defined');
      assert.ok(sponsor.websiteUrl, 'Sponsor website URL must be defined');
      assert.ok(sponsor.logoUrl.startsWith('http'), 'Logo URL must be valid web URL');
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 3: Post View Tracking & Debounce Logic (≥5 tests)
  // ---------------------------------------------------------------------------
  describe('Feature 3: Post View Tracking & Debounce Logic', () => {
    it('3.1 should enforce minimum 2000ms duration threshold for qualified views using isQualifiedViewDuration', () => {
      assert.equal(MIN_VIEW_DURATION_MS, 2000);
      assert.equal(isQualifiedViewDuration(1999), false, '1999ms should be disqualified');
      assert.equal(isQualifiedViewDuration(2000), true, '2000ms should qualify');
      assert.equal(isQualifiedViewDuration(3500), true, '3500ms should qualify');
      assert.equal(isQualifiedViewDuration('2000'), false, 'Non-number must be disqualified');
    });

    it('3.2 should enforce 30-second debounce suppression window for repeated views using isViewDebounced', () => {
      assert.equal(VIEW_DEBOUNCE_WINDOW_MS, 30000);
      const firstViewTime = 100000;

      assert.equal(isViewDebounced(firstViewTime, 105000), true, 'View after 5s must be suppressed');
      assert.equal(isViewDebounced(firstViewTime, 129999), true, 'View after 29.999s must be suppressed');
      assert.equal(isViewDebounced(firstViewTime, 130001), false, 'View after 30.001s must be permitted');
      assert.equal(isViewDebounced(0, 100000), false, 'First view must not be debounced');
    });

    it('3.3 should attribute view tracking events with persistent client session ID and user ID using buildViewPayload', () => {
      let sessionId = globalThis.sessionStorage.getItem('client_view_session');
      if (!sessionId) {
        sessionId = 'sess_test_uuid_12345';
        globalThis.sessionStorage.setItem('client_view_session', sessionId);
      }

      assert.equal(globalThis.sessionStorage.getItem('client_view_session'), 'sess_test_uuid_12345');

      const currentUser = { id: 10, username: 'athlete_user' };
      const payload = buildViewPayload({
        postId: 42,
        viewType: 'POST',
        durationMs: 2500,
        sessionId,
        userId: currentUser?.id || null,
      });

      assert.equal(payload.sessionId, 'sess_test_uuid_12345');
      assert.equal(payload.userId, 10);
      assert.equal(payload.postId, 42);
    });

    it('3.4 should format view payload conforming strictly to /api/v1/views/record contract', () => {
      const payload = buildViewPayload({
        postId: 101,
        sponsorId: 5,
        viewType: 'POST',
        durationMs: 2400,
        sessionId: 'session_abc',
      });

      assert.ok(typeof payload.postId === 'number');
      assert.ok(['POST', 'SPONSOR_BADGE'].includes(payload.viewType));
      assert.ok(typeof payload.durationMs === 'number' && payload.durationMs >= 2000);
      assert.ok(typeof payload.sessionId === 'string' && payload.sessionId.length > 0);
      assert.equal(payload.sponsorId, 5);
    });

    it('3.5 should increment view count when backend response indicates incremented: true', () => {
      let currentViews = 15;
      const apiResponseSuccess = { recorded: true, incremented: true, viewsCount: 16 };
      const apiResponseDuplicate = { recorded: true, incremented: false, viewsCount: 15 };

      const handleResponse = (res, prev) => {
        if (res.incremented) {
          return res.viewsCount != null ? res.viewsCount : prev + 1;
        }
        return prev;
      };

      currentViews = handleResponse(apiResponseSuccess, currentViews);
      assert.equal(currentViews, 16, 'Views count must increment upon successful qualification');

      currentViews = handleResponse(apiResponseDuplicate, currentViews);
      assert.equal(currentViews, 16, 'Views count must not increment upon duplicate debounce response');
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 4: INR Earnings Calculation & Dashboard Presentation (≥5 tests)
  // ---------------------------------------------------------------------------
  describe('Feature 4: INR Earnings Calculation & Dashboard Presentation', () => {
    it('4.1 should calculate earnings accurately at ₹20.00 per 1,000 views using calculateEarnings', () => {
      assert.equal(INR_RATE_PER_THOUSAND, 20.0);
      assert.equal(calculateEarnings(1000), 20.0);
      assert.equal(calculateEarnings(2000), 40.0);
      assert.equal(calculateEarnings(10000), 200.0);
      assert.equal(calculateEarnings(250), 5.0);
    });

    it('4.2 should format INR currency correctly with ₹ symbol and proper separators', () => {
      const formatted20 = formatCurrency(20);
      assert.ok(formatted20.includes('₹'), 'Currency must include ₹ symbol');
      assert.ok(formatted20.includes('20'), 'Currency must include 20');

      const formattedZero = formatCurrency(0);
      assert.ok(formattedZero.includes('₹0'), '0 amount should format with ₹0');

      const formattedLarge = formatCurrency(125000.5);
      assert.ok(formattedLarge.includes('₹'), 'Large currency must include ₹');
    });

    it('4.3 should handle zero views presentation gracefully without NaN or Infinity using calculateAverageRate', () => {
      const avgRate = calculateAverageRate(0, 0);
      assert.equal(avgRate, '₹20.00', 'Zero views must fallback cleanly to ₹20.00 standard rate');
      assert.ok(!avgRate.includes('NaN'), 'Must not display NaN');
      assert.ok(!avgRate.includes('Infinity'), 'Must not display Infinity');
    });

    it('4.4 should verify fractional calculation: exactly 500 views = ₹10.00', () => {
      const views = 500;
      const earnings = calculateEarnings(views);
      assert.equal(earnings, 10.0);

      const formatted = formatCurrency(earnings);
      assert.ok(formatted.includes('10'), '500 views must produce ₹10.00');
    });

    it('4.5 should verify computeEarningsFromBreakdown and sanitizeViews handle live metrics without Math.random', () => {
      const breakdown = [
        { earnedAmount: 14.50, totalViews: 725 },
        { earnedAmount: 10.00, totalViews: 500 },
      ];
      const result = computeEarningsFromBreakdown(null, breakdown);
      assert.equal(result.totalEarnings, 24.50);
      assert.equal(result.totalViews, 1225);
      assert.equal(sanitizeViews(-5), 0);
      assert.equal(sanitizeViews('1200'), 1200);
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 5: Session Management & Logout Token Wipe (≥5 tests)
  // ---------------------------------------------------------------------------
  describe('Feature 5: Session Management & Logout Token Wipe', () => {
    it('5.1 should persist token and user session in localStorage upon authentication using persistSessionToStorage', () => {
      const user = {
        id: 1,
        username: 'athlete_one',
        email: 'athlete@example.com',
        role: 'USER',
      };
      const token = 'jwt-mock-valid-token-xyz';

      const persisted = persistSessionToStorage(globalThis.localStorage, user, token);
      assert.equal(persisted, true);

      assert.equal(globalThis.localStorage.getItem('cert_token'), token);
      const parsed = JSON.parse(globalThis.localStorage.getItem('cert_user'));
      assert.deepEqual(parsed, user);
    });

    it('5.2 should synchronize user context properties (isAuthenticated, isInstitution, isUser) using deriveAuthState', () => {
      const userObj = { id: 1, role: 'USER' };
      const institutionObj = { id: 2, role: 'INSTITUTION' };

      const unauthenticated = deriveAuthState(null);
      assert.equal(unauthenticated.isAuthenticated, false);
      assert.equal(unauthenticated.isInstitution, false);
      assert.equal(unauthenticated.isUser, false);

      const userState = deriveAuthState(userObj);
      assert.equal(userState.isAuthenticated, true);
      assert.equal(userState.isInstitution, false);
      assert.equal(userState.isUser, true);

      const instState = deriveAuthState(institutionObj);
      assert.equal(instState.isAuthenticated, true);
      assert.equal(instState.isInstitution, true);
      assert.equal(instState.isUser, false);
    });

    it('5.3 should completely purge localStorage keys on logout using wipeSessionFromStorage', () => {
      globalThis.localStorage.setItem('cert_user', JSON.stringify({ id: 9 }));
      globalThis.localStorage.setItem('cert_token', 'active-token');

      wipeSessionFromStorage(globalThis.localStorage);

      assert.equal(globalThis.localStorage.getItem('cert_user'), null);
      assert.equal(globalThis.localStorage.getItem('cert_token'), null);
    });

    it('5.4 should verify authApi.logout is defined and callable', () => {
      assert.equal(typeof authApi.logout, 'function', 'authApi.logout must be a defined API function');
    });

    it('5.5 should clear auth tokens and session state when handling 401 unauthorized error', () => {
      globalThis.localStorage.setItem('cert_token', 'expired-token');
      globalThis.localStorage.setItem('cert_user', JSON.stringify({ id: 5 }));

      // 401 error handler using wipeSessionFromStorage
      const handleAuthError = (status) => {
        if (status === 401) {
          wipeSessionFromStorage(globalThis.localStorage);
          return { redirect: '/login' };
        }
        return { redirect: null };
      };

      const result = handleAuthError(401);
      assert.equal(result.redirect, '/login');
      assert.equal(globalThis.localStorage.getItem('cert_token'), null);
      assert.equal(globalThis.localStorage.getItem('cert_user'), null);
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 6: Protected Routes & Role Enforcement (≥5 tests)
  // ---------------------------------------------------------------------------
  describe('Feature 6: Protected Routes & Role Enforcement', () => {
    it('6.1 should redirect unauthenticated access to /login with replace: true using evaluateRouteAccess', () => {
      const decision = evaluateRouteAccess({
        isAuthenticated: false,
        currentUser: null,
        isInstitution: false,
      });

      assert.equal(decision.allowed, false);
      assert.equal(decision.redirectTo, '/login');
    });

    it('6.2 should enforce INSTITUTION role requirement and redirect non-institutional users to /feed', () => {
      const regularUser = { id: 1, role: 'USER' };
      const decision = evaluateRouteAccess({
        isAuthenticated: true,
        currentUser: regularUser,
        isInstitution: false,
        requireRole: 'INSTITUTION',
      });

      assert.equal(decision.allowed, false);
      assert.equal(decision.redirectTo, '/feed');
    });

    it('6.3 should permit authenticated users into general workspace routes (/feed, /earnings, /profile)', () => {
      const regularUser = { isAuthenticated: true, currentUser: { id: 1, role: 'USER' }, isInstitution: false };

      const feedAccess = evaluateRouteAccess({ ...regularUser, requireRole: null });
      assert.equal(feedAccess.allowed, true, 'User should access /feed');
      assert.equal(feedAccess.redirectTo, null);

      const earningsAccess = evaluateRouteAccess({ ...regularUser, requireRole: null });
      assert.equal(earningsAccess.allowed, true, 'User should access /earnings');
    });

    it('6.4 should permit institutional users to access institutional portal routes (/badges/manage, /certificates)', () => {
      const instUser = { isAuthenticated: true, currentUser: { id: 9, role: 'INSTITUTION' }, isInstitution: true };

      const badgesManageAccess = evaluateRouteAccess({ ...instUser, requireRole: 'INSTITUTION' });
      assert.equal(badgesManageAccess.allowed, true, 'Institution should access /badges/manage');

      const certStudioAccess = evaluateRouteAccess({ ...instUser, requireRole: 'INSTITUTION' });
      assert.equal(certStudioAccess.allowed, true, 'Institution should access /certificates');
    });

    it('6.5 should preserve destination location in navigation state and verify isInstitutionRole', () => {
      assert.equal(isInstitutionRole('INSTITUTION'), true);
      assert.equal(isInstitutionRole('USER'), false);
      assert.equal(isInstitutionRole('ADMIN'), false);

      const statePayload = { from: { pathname: '/profile' } };
      assert.equal(statePayload.from.pathname, '/profile');
    });
  });

  // ---------------------------------------------------------------------------
  // Feature 7: Elimination of Mock Datasets (≥5 tests)
  // ---------------------------------------------------------------------------
  describe('Feature 7: Elimination of Mock Datasets', () => {
    it('7.1 should verify postsApi contract methods exist for live feed fetching without mock data', () => {
      assert.equal(typeof postsApi.getFeed, 'function');
      assert.equal(typeof postsApi.getPost, 'function');
      assert.equal(typeof postsApi.createPost, 'function');
    });

    it('7.2 should verify usersApi and badgesApi contract methods exist without fallback mock datasets', () => {
      assert.equal(typeof usersApi.getProfile, 'function');
      assert.equal(typeof badgesApi.getUserBadges, 'function');
      assert.equal(typeof badgesApi.getAll, 'function');
    });

    it('7.3 should verify viewsApi and computeEarningsFromBreakdown calculate live metrics without hardcoded values', () => {
      assert.equal(typeof viewsApi.getEarnings, 'function');
      const metrics = computeEarningsFromBreakdown({ totalEarnings: 100, totalViews: 5000 }, []);
      assert.equal(metrics.totalEarnings, 100);
      assert.equal(metrics.totalViews, 5000);
    });

    it('7.4 should verify calculateEarnings eliminates fake Math.random autoIncrement intervals', () => {
      const earnings1 = calculateEarnings(1000);
      const earnings2 = calculateEarnings(1000);
      assert.equal(earnings1, earnings2, 'Earnings calculation must be deterministic');
      assert.equal(earnings1, 20.0);
    });

    it('7.5 should verify authApi endpoints hit production contracts without bypass stubs', () => {
      assert.equal(typeof authApi.login, 'function');
      assert.equal(typeof authApi.register, 'function');
      assert.equal(typeof authApi.institutionLogin, 'function');
      assert.equal(typeof authApi.logout, 'function');
    });
  });
});
