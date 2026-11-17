import { formatCurrency } from './formatters.js';

export const INR_RATE_PER_THOUSAND = 20.0;

/**
 * Sanitize view count input to non-negative integer/number.
 *
 * @param {*} count
 * @returns {number}
 */
export function sanitizeViews(count) {
  return Math.max(0, Number(count) || 0);
}

/**
 * Calculate INR earnings from view count at ₹20 per 1,000 views.
 *
 * @param {number|string} views
 * @returns {number}
 */
export function calculateEarnings(views) {
  const safeViews = sanitizeViews(views);
  return (safeViews / 1000) * INR_RATE_PER_THOUSAND;
}

/**
 * Compute average revenue rate per 1,000 views.
 *
 * @param {number} totalEarnings
 * @param {number} totalViews
 * @returns {string} Formatted currency string
 */
export function calculateAverageRate(totalEarnings, totalViews) {
  const safeViews = sanitizeViews(totalViews);
  if (safeViews === 0) return '₹20.00';
  const safeEarnings = Number(totalEarnings) || 0;
  return formatCurrency((safeEarnings / safeViews) * 1000);
}

/**
 * Compute total earnings and total views from summary or sponsor breakdown array.
 *
 * @param {object|null} summary
 * @param {Array} sponsorBreakdown
 * @returns {{ totalEarnings: number, totalViews: number }}
 */
export function computeEarningsFromBreakdown(summary, sponsorBreakdown = []) {
  const totalEarnings = summary?.totalEarnings != null
    ? Number(summary.totalEarnings)
    : sponsorBreakdown.reduce((sum, item) => sum + (Number(item.earnedAmount) || 0), 0);

  const totalViews = summary?.totalViews != null
    ? Number(summary.totalViews)
    : sponsorBreakdown.reduce((sum, item) => sum + (Number(item.totalViews) || 0), 0);

  return { totalEarnings, totalViews };
}

export default {
  INR_RATE_PER_THOUSAND,
  sanitizeViews,
  calculateEarnings,
  calculateAverageRate,
  computeEarningsFromBreakdown,
};
