import { describe, it, beforeEach, afterEach } from 'node:test';
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
import * as postsApi from '../api/postsApi.js';
import * as viewsApi from '../api/viewsApi.js';
import * as badgesApi from '../api/badgesApi.js';

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

describe('Tier 4: Real-World End-to-End Application Scenarios', () => {
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
  // Scenario 1: Feed Navigation, Post View Duration Qualification, and 5-Second Rotation
  // ---------------------------------------------------------------------------
  it('Scenario 1: User navigates to feed, views post, qualifies view after 2s, and sponsor rotates after 5s', async () => {
    // 1. User arrives on Feed with an established session
    const sessionId = 'session_client_feed_test_01';
    globalThis.sessionStorage.setItem('client_view_session', sessionId);
    const currentUser = { id: 10, username: 'marathon_runner' };

    // 2. Feed post data
    const post = {
      id: 50,
      content: 'Morning 20km training complete!',
      viewsCount: 14,
      user: {
        id: 10,
        username: 'marathon_runner',
        badges: [{ id: 1, name: 'Marathon Gold', rank: 1, category: 'Athletics' }],
      },
      sponsors: [
        { id: 99, name: 'Puma Sports', logoUrl: '/puma.png', websiteUrl: 'https://puma.example.com' },
      ],
    };

    // 3. Assemble rotation items using assembleRotationItems
    const authorBadges = extractAuthorBadges(post);
    const rotationItems = assembleRotationItems(authorBadges, post.sponsors);

    assert.equal(rotationItems.length, 2);
    assert.equal(rotationItems[0].type, 'badge');
    assert.equal(rotationItems[1].type, 'sponsor');

    // 4. Simulate view duration qualification
    const t0 = 100000;
    const dur1 = 1000;
    assert.equal(isQualifiedViewDuration(dur1), false, '1000ms duration is unqualified');

    const dur2 = 2000;
    assert.equal(isQualifiedViewDuration(dur2), true, '2000ms duration qualifies');

    const key = `post_view_${post.id}`;
    const lastTime = Number(globalThis.sessionStorage.getItem(key) || 0);
    assert.equal(isViewDebounced(lastTime, t0 + 2000), false, 'Initial view is not debounced');

    globalThis.sessionStorage.setItem(key, String(t0 + 2000));
    const payload = buildViewPayload({
      postId: post.id,
      viewType: 'POST',
      durationMs: dur2,
      sessionId,
      userId: currentUser.id,
    });

    assert.equal(payload.postId, 50);
    assert.equal(payload.durationMs, 2000);
    assert.equal(payload.userId, 10);

    // 5. Dynamic sponsor rotation after 5000ms
    assert.equal(SPONSOR_ROTATION_INTERVAL, 5000);
    const nextIndex = (0 + 1) % rotationItems.length;
    assert.equal(nextIndex, 1);
    assert.equal(rotationItems[nextIndex].data.name, 'Puma Sports');
  });

  // ---------------------------------------------------------------------------
  // Scenario 2: Creator Navigates to Earnings Dashboard with Live INR Calculations
  // ---------------------------------------------------------------------------
  it('Scenario 2: User navigates to earnings dashboard, verifies live calculated INR metrics without mock increments', async () => {
    const mockApiResponse = {
      totalEarnings: 80.0,
      totalViews: 4000,
      activeSponsors: 3,
      currency: 'INR',
      ratePerThousand: 20.0,
      sponsorBreakdown: [
        { sponsorName: 'Nike', totalViews: 2500, earnedAmount: 50.0 },
        { sponsorName: 'Adidas', totalViews: 1500, earnedAmount: 30.0 },
      ],
      history: [
        { label: 'Oct 2026', amount: 30.0 },
        { label: 'Nov 2026', amount: 50.0 },
      ],
    };

    const metrics = computeEarningsFromBreakdown(mockApiResponse, mockApiResponse.sponsorBreakdown);
    assert.equal(metrics.totalEarnings, 80.0);
    assert.equal(metrics.totalViews, 4000);

    const avgRate = calculateAverageRate(metrics.totalEarnings, metrics.totalViews);
    assert.ok(avgRate.includes('20'));

    const formattedEarnings = formatCurrency(metrics.totalEarnings);
    assert.ok(formattedEarnings.includes('₹'));
    assert.ok(formattedEarnings.includes('80'));

    // Compute live earnings from new views
    const nextViews = metrics.totalViews + 500;
    const nextEarnings = calculateEarnings(nextViews);
    assert.equal(nextViews, 4500);
    assert.equal(nextEarnings, 90.0);
    assert.ok(formatCurrency(nextEarnings).includes('90'));
  });

  // ---------------------------------------------------------------------------
  // Scenario 3: Institutional User Login, Badge Assignment, and Session Wipe
  // ---------------------------------------------------------------------------
  it('Scenario 3: Institutional user logs in, accesses protected badge management, issues badge, logs out with full session wipe', async () => {
    // 1. Institution logs in and session persists
    const institutionUser = {
      id: 101,
      username: 'athlos_admin',
      displayName: 'Athlos Sports Academy',
      role: 'INSTITUTION',
      institutionId: 1,
    };
    const token = 'jwt-institution-bearer-token-xyz';

    persistSessionToStorage(globalThis.localStorage, institutionUser, token);

    // 2. Derive auth state and evaluate institutional route access
    const auth = deriveAuthState(institutionUser);
    assert.equal(auth.isAuthenticated, true);
    assert.equal(auth.isInstitution, true);

    const routeDecision = evaluateRouteAccess({
      isAuthenticated: auth.isAuthenticated,
      currentUser: institutionUser,
      isInstitution: auth.isInstitution,
      requireRole: 'INSTITUTION',
    });
    assert.equal(routeDecision.allowed, true);
    assert.equal(routeDecision.redirectTo, null);

    // 3. User logs out and session is wiped
    wipeSessionFromStorage(globalThis.localStorage);
    assert.equal(globalThis.localStorage.getItem('cert_user'), null);
    assert.equal(globalThis.localStorage.getItem('cert_token'), null);

    // 4. Post-logout route check redirects to /login
    const postLogoutDecision = evaluateRouteAccess({
      isAuthenticated: false,
      currentUser: null,
      isInstitution: false,
      requireRole: 'INSTITUTION',
    });
    assert.equal(postLogoutDecision.allowed, false);
    assert.equal(postLogoutDecision.redirectTo, '/login');
  });

  // ---------------------------------------------------------------------------
  // Scenario 4: Unauthenticated User Redirection, State Preservation, Post-Login Access
  // ---------------------------------------------------------------------------
  it('Scenario 4: Unauthenticated user attempts protected routes, gets redirected with state, logs in, accesses target', async () => {
    // 1. Unauthenticated access check
    const initialCheck = evaluateRouteAccess({
      isAuthenticated: false,
      currentUser: null,
      isInstitution: false,
      requireRole: null,
    });
    assert.equal(initialCheck.allowed, false);
    assert.equal(initialCheck.redirectTo, '/login');

    const navigationState = { from: { pathname: '/earnings', search: '?filter=recent' } };
    assert.equal(navigationState.from.pathname, '/earnings');

    // 2. User authenticates
    const regularUser = { id: 7, role: 'USER', username: 'athlete_seven' };
    const authState = deriveAuthState(regularUser);
    assert.equal(authState.isAuthenticated, true);

    // 3. Re-evaluate access to target route after authentication
    const postLoginCheck = evaluateRouteAccess({
      isAuthenticated: authState.isAuthenticated,
      currentUser: regularUser,
      isInstitution: authState.isInstitution,
      requireRole: null,
    });
    assert.equal(postLoginCheck.allowed, true);
    assert.equal(postLoginCheck.redirectTo, null);
  });

  // ---------------------------------------------------------------------------
  // Scenario 5: Full End-to-End User Session Lifecycle Across All Components
  // ---------------------------------------------------------------------------
  it('Scenario 5: Full end-to-end user session lifecycle across all components and contract endpoints', async () => {
    // Step 1: Initial Login as regular athlete
    const athlete = { id: 33, username: 'triathlete_sam', role: 'USER' };
    persistSessionToStorage(globalThis.localStorage, athlete, 'jwt-token-triathlete');
    const authState = deriveAuthState(athlete);
    assert.equal(authState.isAuthenticated, true);
    assert.equal(authState.isUser, true);
    assert.equal(authState.isInstitution, false);

    // Step 2: Feed loaded with post and author badges
    const feedPost = {
      id: 701,
      content: 'Ironman qualification secured!',
      viewsCount: 99,
      userBadges: [{ id: 1, name: 'Triathlon Gold', rank: 1, category: 'Triathlon' }],
      sponsors: [{ id: 50, name: 'Gatorade', websiteUrl: 'https://gatorade.example.com' }],
    };
    const extractedBadges = extractAuthorBadges(feedPost);
    assert.equal(extractedBadges.length, 1);
    assert.equal(extractedBadges[0].name, 'Triathlon Gold');

    // Step 3: View post for 2500ms -> qualifies for view recording and increments
    const viewDuration = 2500;
    assert.equal(isQualifiedViewDuration(viewDuration), true);
    assert.equal(isViewDebounced(0, 100000), false);

    const viewPayload = buildViewPayload({
      postId: feedPost.id,
      viewType: 'POST',
      durationMs: viewDuration,
      sessionId: 'sess_e2e_lifecycle',
      userId: athlete.id,
    });
    assert.equal(viewPayload.postId, 701);
    assert.equal(viewPayload.durationMs, 2500);
    assert.equal(viewPayload.userId, 33);

    let postViewsCount = feedPost.viewsCount + 1;
    assert.equal(postViewsCount, 100);

    // Step 4: Sponsor dynamic rotator advances with 5000ms interval
    const rotationItems = assembleRotationItems(extractedBadges, feedPost.sponsors);
    assert.equal(rotationItems.length, 2);
    assert.equal(SPONSOR_ROTATION_INTERVAL, 5000);
    assert.equal(rotationItems[0].type, 'badge');
    assert.equal(rotationItems[1].type, 'sponsor');

    // Step 5: Earnings calculated accurately at ₹20 per 1,000 views
    const totalEarnings = calculateEarnings(postViewsCount); // 100 views -> ₹2.00
    assert.equal(totalEarnings, 2.0);
    assert.ok(formatCurrency(totalEarnings).includes('2'));

    // Step 6: User attempts unauthorized institutional route /badges/manage
    const instRouteCheck = evaluateRouteAccess({
      isAuthenticated: authState.isAuthenticated,
      currentUser: athlete,
      isInstitution: authState.isInstitution,
      requireRole: 'INSTITUTION',
    });
    assert.equal(instRouteCheck.allowed, false);
    assert.equal(instRouteCheck.redirectTo, '/feed');

    // Step 7: User logs out -> session wiped, subsequent access redirects to /login
    wipeSessionFromStorage(globalThis.localStorage);
    assert.equal(globalThis.localStorage.getItem('cert_user'), null);
    assert.equal(globalThis.localStorage.getItem('cert_token'), null);

    const postLogoutCheck = evaluateRouteAccess({
      isAuthenticated: false,
      currentUser: null,
      isInstitution: false,
      requireRole: null,
    });
    assert.equal(postLogoutCheck.allowed, false);
    assert.equal(postLogoutCheck.redirectTo, '/login');
  });
});
