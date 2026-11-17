/**
 * Assemble rotation items for BadgeRotator by interleaving badges and sponsors.
 *
 * @param {Array} [badges=[]]
 * @param {Array|object} [sponsors=[]]
 * @returns {Array<{ type: 'badge'|'sponsor', data: object, id: string }>}
 */
export function assembleRotationItems(badges = [], sponsors = []) {
  const safeBadges = Array.isArray(badges) ? badges.filter(Boolean) : [];
  const safeSponsors = Array.isArray(sponsors)
    ? sponsors.filter(Boolean)
    : (sponsors ? [sponsors] : []);

  const items = [];
  const maxLen = Math.max(safeBadges.length, safeSponsors.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < safeBadges.length) {
      items.push({ type: 'badge', data: safeBadges[i], id: `b-${safeBadges[i].id || i}` });
    }
    if (i < safeSponsors.length) {
      items.push({ type: 'sponsor', data: safeSponsors[i], id: `s-${safeSponsors[i].id || i}` });
    }
  }
  return items;
}

export default {
  assembleRotationItems,
};
