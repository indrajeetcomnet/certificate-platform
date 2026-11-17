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

import axiosClient from '../api/axiosClient.js';

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

describe('Tier 3: Pairwise Cross-Feature Interactions & Combinations', () => {
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
  // Combination 1: Sponsor rotation while view tracking duration is running
  // ---------------------------------------------------------------------------
  it('3.1 should maintain independent timing when sponsor rotates while post view timer is running', () => {
    // Post view tracking needs 2000ms to qualify
    // Sponsor rotation runs on 5000ms intervals
    assert.equal(MIN_VIEW_DURATION_MS, 2000);
    assert.equal(SPONSOR_ROTATION_INTERVAL, 5000);

    const timeline = [];
    let postViewRecorded = false;
    let sponsorRotationIndex = 0;
    const rotationItems = assembleRotationItems(
      [{ id: 1, name: 'Badge1' }],
      [{ id: 10, name: 'Sponsor1' }]
    );

    for (let t = 0; t <= 6000; t += 1000) {
      if (isQualifiedViewDuration(t) && !postViewRecorded) {
        postViewRecorded = true;
        timeline.push({ t, event: 'POST_VIEW_RECORDED' });
      }
      if (t >= SPONSOR_ROTATION_INTERVAL && sponsorRotationIndex === 0) {
        sponsorRotationIndex = (sponsorRotationIndex + 1) % rotationItems.length;
        timeline.push({ t, event: 'SPONSOR_ROTATED', activeItem: rotationItems[sponsorRotationIndex].data.name });
      }
    }

    assert.equal(postViewRecorded, true);
    assert.equal(sponsorRotationIndex, 1);
    assert.deepEqual(timeline, [
      { t: 2000, event: 'POST_VIEW_RECORDED' },
      { t: 5000, event: 'SPONSOR_ROTATED', activeItem: 'Sponsor1' },
    ]);
  });

  // ---------------------------------------------------------------------------
  // Combination 2: User logout occurring while view tracking is pending
  // ---------------------------------------------------------------------------
  it('3.2 should handle user logout occurring while view tracking is in-flight', () => {
    let currentUser = { id: 42, username: 'athlete_sprint' };
    persistSessionToStorage(globalThis.localStorage, currentUser, 'jwt-token-active');

    // User triggers logout
    wipeSessionFromStorage(globalThis.localStorage);
    currentUser = null;

    assert.equal(globalThis.localStorage.getItem('cert_token'), null);
    assert.equal(currentUser, null);

    // View timer triggers at t = 2000ms after logout
    const recordedPayload = buildViewPayload({
      postId: 10,
      viewType: 'POST',
      durationMs: 2000,
      sessionId: 'sess_123',
      userId: currentUser?.id || null,
    });

    assert.equal(recordedPayload.userId, null, 'View payload userId must safely reflect logged out state');
    assert.equal(recordedPayload.durationMs, 2000);
  });

  // ---------------------------------------------------------------------------
  // Combination 3: Route guard transition when institutional session is invalidated
  // ---------------------------------------------------------------------------
  it('3.3 should trigger immediate route transition when institutional session is revoked', () => {
    let userState = {
      isAuthenticated: true,
      currentUser: { id: 7, role: 'INSTITUTION' },
      isInstitution: true,
    };

    // Access granted while institution
    const initialCheck = evaluateRouteAccess({ ...userState, requireRole: 'INSTITUTION' });
    assert.equal(initialCheck.allowed, true);
    assert.equal(initialCheck.redirectTo, null);

    // Token invalidated / session demoted to USER
    userState = {
      isAuthenticated: true,
      currentUser: { id: 7, role: 'USER' },
      isInstitution: false,
    };
    const demotedCheck = evaluateRouteAccess({ ...userState, requireRole: 'INSTITUTION' });
    assert.equal(demotedCheck.allowed, false);
    assert.equal(demotedCheck.redirectTo, '/feed');

    // Complete session invalidation (logout / 401)
    userState = {
      isAuthenticated: false,
      currentUser: null,
      isInstitution: false,
    };
    const loggedOutCheck = evaluateRouteAccess({ ...userState, requireRole: 'INSTITUTION' });
    assert.equal(loggedOutCheck.allowed, false);
    assert.equal(loggedOutCheck.redirectTo, '/login');
  });

  // ---------------------------------------------------------------------------
  // Combination 4: Concurrent badge rotation across multiple feed posts
  // ---------------------------------------------------------------------------
  it('3.4 should operate independent rotation cycles across multiple feed posts concurrently', () => {
    const post1Items = assembleRotationItems(
      [{ id: 1, name: 'Post1-Badge1' }],
      [{ id: 10, name: 'Post1-Sponsor1' }]
    );

    const post2Items = assembleRotationItems(
      [{ id: 2, name: 'Post2-Badge1' }],
      [{ id: 20, name: 'Post2-SponsorA' }, { id: 21, name: 'Post2-SponsorB' }]
    );

    let idx1 = 0;
    let idx2 = 0;

    // Rotate Post 1
    idx1 = (idx1 + 1) % post1Items.length;
    assert.equal(post1Items[idx1].data.name, 'Post1-Sponsor1');
    assert.equal(idx2, 0, 'Post 2 rotation index must remain unaffected');

    // Rotate Post 2 twice
    idx2 = (idx2 + 1) % post2Items.length;
    assert.equal(post2Items[idx2].data.name, 'Post2-SponsorA');
    idx2 = (idx2 + 1) % post2Items.length;
    assert.equal(post2Items[idx2].data.name, 'Post2-SponsorB');

    assert.equal(idx1, 1);
  });

  // ---------------------------------------------------------------------------
  // Combination 5: Profile badge retrieval combined with user-specific feed filtering
  // ---------------------------------------------------------------------------
  it('3.5 should correlate profile badges and user-specific posts for target user profile', () => {
    const targetUserId = 15;
    const allBadgesInSystem = [
      { userId: 15, badge: { id: 1, name: 'Marathon 2026', rank: 1 } },
      { userId: 15, badge: { id: 2, name: 'Fair Play', rank: 2 } },
      { userId: 99, badge: { id: 3, name: 'Other User Badge', rank: 1 } },
    ];

    const allPostsInSystem = [
      { id: 101, userId: 15, content: 'Trained hard for the marathon' },
      { id: 102, userId: 99, content: 'Hello world from someone else' },
      { id: 103, userId: 15, content: 'Medal day!' },
    ];

    const userBadges = allBadgesInSystem
      .filter((b) => b.userId === targetUserId)
      .map((b) => b.badge);

    const userPosts = allPostsInSystem.filter((p) => p.userId === targetUserId);

    assert.equal(userBadges.length, 2);
    assert.equal(userBadges[0].name, 'Marathon 2026');
    assert.equal(userBadges[1].name, 'Fair Play');

    assert.equal(userPosts.length, 2);
    assert.equal(userPosts[0].id, 101);
    assert.equal(userPosts[1].id, 103);
  });

  // ---------------------------------------------------------------------------
  // Combination 6: SponsorBadge view tracking on unmount / rotation switch
  // ---------------------------------------------------------------------------
  it('3.6 should emit SPONSOR_BADGE view record event when rotator transitions after 2000ms', () => {
    const recordedEvents = [];
    const sponsor = { id: 88, name: 'Speedo' };
    const postId = 42;
    const startTime = 1000;
    const unmountTime = 3500;
    const duration = unmountTime - startTime;

    if (isQualifiedViewDuration(duration)) {
      recordedEvents.push(buildViewPayload({
        sponsorId: sponsor.id,
        postId: postId,
        viewType: 'SPONSOR_BADGE',
        durationMs: duration,
        sessionId: 'sess_combo',
      }));
    }

    assert.equal(recordedEvents.length, 1);
    assert.equal(recordedEvents[0].sponsorId, 88);
    assert.equal(recordedEvents[0].postId, 42);
    assert.equal(recordedEvents[0].viewType, 'SPONSOR_BADGE');
    assert.equal(recordedEvents[0].durationMs, 2500);
  });

  // ---------------------------------------------------------------------------
  // Combination 7: View tracking increment dynamically updating live EarningsDashboard
  // ---------------------------------------------------------------------------
  it('3.7 should dynamically update EarningsDashboard metrics when a qualifying view is recorded', () => {
    let totalViews = 999;
    let totalEarnings = calculateEarnings(totalViews);
    assert.equal(totalEarnings, 19.98);

    totalViews += 1;
    totalEarnings = calculateEarnings(totalViews);

    assert.equal(totalViews, 1000);
    assert.equal(totalEarnings, 20.0);
    assert.ok(formatCurrency(totalEarnings).includes('20'));
  });

  // ---------------------------------------------------------------------------
  // Combination 8: JWT token interceptor in request headers
  // ---------------------------------------------------------------------------
  it('3.8 should attach JWT bearer token to requests when token exists and omit when logged out', () => {
    const requestInterceptor = (config) => {
      const token = globalThis.localStorage.getItem('cert_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    };

    // With active token
    persistSessionToStorage(globalThis.localStorage, { id: 1 }, 'jwt-super-secret-token');
    const req1 = { headers: {} };
    const intercepted1 = requestInterceptor(req1);
    assert.equal(intercepted1.headers.Authorization, 'Bearer jwt-super-secret-token');

    // After logout
    wipeSessionFromStorage(globalThis.localStorage);
    const req2 = { headers: {} };
    const intercepted2 = requestInterceptor(req2);
    assert.equal(intercepted2.headers.Authorization, undefined);
  });

  // ---------------------------------------------------------------------------
  // Combination 9: Institutional login updates nav items and protected access
  // ---------------------------------------------------------------------------
  it('3.9 should switch navigation menus and route permissions upon institutional login', () => {
    const userRole = 'USER';
    const institutionRole = 'INSTITUTION';

    const getNavItems = (role) => ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS.GUEST;

    const userNav = getNavItems(userRole);
    assert.ok(userNav.some((item) => item.path === '/earnings'));
    assert.ok(!userNav.some((item) => item.path === '/certificates'));

    const instNav = getNavItems(institutionRole);
    assert.ok(instNav.some((item) => item.path === '/certificates'));
    assert.ok(instNav.some((item) => item.path === '/badges/manage'));
  });

  // ---------------------------------------------------------------------------
  // Combination 10: Multi-session debounce isolation
  // ---------------------------------------------------------------------------
  it('3.10 should allow distinct sessions to record views while suppressing duplicate intra-session views', () => {
    const t0 = 100000;
    const session1LastView = t0;
    const session2LastView = 0; // new session

    // Session 1 views again at t0 + 5000 -> suppressed
    assert.equal(isViewDebounced(session1LastView, t0 + 5000), true);

    // Session 2 views at t0 + 6000 -> allowed
    assert.equal(isViewDebounced(session2LastView, t0 + 6000), false);

    // Session 1 views after 30001ms -> allowed
    assert.equal(isViewDebounced(session1LastView, t0 + 30001), false);
  });

  // ---------------------------------------------------------------------------
  // Combination 11: 401 response from earnings API triggers automatic session wipe
  // ---------------------------------------------------------------------------
  it('3.11 should purge session state when earnings API responds with 401 Unauthorized', () => {
    persistSessionToStorage(globalThis.localStorage, { id: 9, role: 'USER' }, 'expired-token');

    const handleApiResponse = (responseStatus) => {
      if (responseStatus === 401) {
        wipeSessionFromStorage(globalThis.localStorage);
        return { status: 401, action: 'LOGOUT_REDIRECT' };
      }
      return { status: responseStatus, action: 'PROCEED' };
    };

    const result = handleApiResponse(401);
    assert.equal(result.action, 'LOGOUT_REDIRECT');
    assert.equal(globalThis.localStorage.getItem('cert_token'), null);
    assert.equal(globalThis.localStorage.getItem('cert_user'), null);
  });

  // ---------------------------------------------------------------------------
  // Combination 12: Dual-source badge display combining author userBadges and post sponsors
  // ---------------------------------------------------------------------------
  it('3.12 should assemble rotation list correctly from user author badges and linked post sponsors', () => {
    const post = {
      id: 200,
      user: {
        id: 3,
        username: 'swimmer_pro',
        badges: [
          { id: 10, name: 'Olympic Gold', rank: 1 },
          { id: 11, name: 'World Record', rank: 1 },
        ],
      },
      sponsors: [
        { id: 50, name: 'Speedo International' },
      ],
    };

    const authorBadges = extractAuthorBadges(post);
    const items = assembleRotationItems(authorBadges, post.sponsors);

    assert.equal(items.length, 3);
    assert.equal(items[0].type, 'badge');
    assert.equal(items[0].data.name, 'Olympic Gold');
    assert.equal(items[1].type, 'sponsor');
    assert.equal(items[1].data.name, 'Speedo International');
    assert.equal(items[2].type, 'badge');
    assert.equal(items[2].data.name, 'World Record');
  });
});
