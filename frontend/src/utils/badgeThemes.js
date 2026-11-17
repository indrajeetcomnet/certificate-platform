import { BADGE_RANKS } from './constants.js';

export const RANK_THEMES = {
  1: { rank: 1, label: 'Rank #1 Gold', name: 'Gold', color: '#FFD700', badgeClass: 'gold' },
  2: { rank: 2, label: 'Rank #2 Silver', name: 'Silver', color: '#C0C0C0', badgeClass: 'silver' },
  3: { rank: 3, label: 'Rank #3 Bronze', name: 'Bronze', color: '#CD7F32', badgeClass: 'bronze' },
};

/**
 * Retrieve metallic theme definition for a given badge rank (defaults to Rank 1 Gold).
 *
 * @param {*} rankInput
 * @returns {object}
 */
export function getBadgeTheme(rankInput) {
  const rank = Number(rankInput) || 1;
  return RANK_THEMES[rank] || RANK_THEMES[1];
}

/**
 * Format badge tooltip string conforming to BadgeDisplay title layout.
 *
 * @param {object|null} badge
 * @returns {string}
 */
export function formatBadgeTooltip(badge) {
  if (!badge) return '';
  const theme = getBadgeTheme(badge.rank);
  const category = badge.category || 'Sports';
  return `${badge.name || 'Game City'} · ${theme.label} (${category})`;
}

/**
 * Extract author badges from feed post payloads (checking post.user.badges then post.userBadges).
 *
 * @param {object|null} post
 * @returns {Array}
 */
export function extractAuthorBadges(post) {
  if (!post) return [];
  return post.user?.badges || post.userBadges || [];
}

export default {
  RANK_THEMES,
  getBadgeTheme,
  formatBadgeTooltip,
  extractAuthorBadges,
};
