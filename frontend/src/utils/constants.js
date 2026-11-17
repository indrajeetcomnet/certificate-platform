export const ROLE_NAV_ITEMS = {
  USER: [
    { label: 'Social Feed', path: '/feed', icon: 'Newspaper' },
    { label: 'Direct Messages', path: '/messages', icon: 'MessageSquare' },
    { label: 'My Badges', path: '/profile', icon: 'Shield' },
    { label: 'Sponsor Hub', path: '/sponsors', icon: 'Sparkles' },
    { label: 'Sponsor Earnings', path: '/earnings', icon: 'DollarSign' },
  ],
  INSTITUTION: [
    { label: 'Organize Tournaments', path: '/tournaments', icon: 'Trophy' },
    { label: 'Certificate Studio', path: '/certificates', icon: 'Award' },
    { label: 'Award Badges', path: '/badges/manage', icon: 'ShieldAlert' },
    { label: 'Direct Messages', path: '/messages', icon: 'MessageSquare' },
    { label: 'Social Feed', path: '/feed', icon: 'Newspaper' },
  ],
  GUEST: [
    { label: 'Home', path: '/', icon: 'Home' },
    { label: 'Social Feed', path: '/feed', icon: 'Newspaper' },
    { label: 'Sponsor Hub', path: '/sponsors', icon: 'Sparkles' },
  ],
};

export const NAV_ITEMS = ROLE_NAV_ITEMS.USER;

export const POST_TYPES = {
  ORIGINAL: 'ORIGINAL',
  FOLLOWUP: 'FOLLOWUP',
};

export const BADGE_RANKS = {
  1: { rank: 1, label: 'Gold', key: 'gold', color: '#FFD700', badgeClass: 'gold' },
  2: { rank: 2, label: 'Silver', key: 'silver', color: '#C0C0C0', badgeClass: 'silver' },
  3: { rank: 3, label: 'Bronze', key: 'bronze', color: '#CD7F32', badgeClass: 'bronze' },
  gold: { rank: 1, label: 'Gold', key: 'gold', color: '#FFD700', badgeClass: 'gold' },
  silver: { rank: 2, label: 'Silver', key: 'silver', color: '#C0C0C0', badgeClass: 'silver' },
  bronze: { rank: 3, label: 'Bronze', key: 'bronze', color: '#CD7F32', badgeClass: 'bronze' },
};

export const SPONSOR_ROTATION_INTERVAL = 5000;

