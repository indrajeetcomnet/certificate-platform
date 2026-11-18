/**
 * High-Resolution Certificate Background Presets & Textures
 * Vector-rendered SVG backgrounds for sports championships, official diplomas, and modern athletic honors.
 */

// Helper to encode SVG into clean Data URI
function svgToDataUri(svgString) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    svgString.replace(/\s+/g, ' ').trim()
  )}`;
}

// 1. Classic Guilloché Parchment (Ornate Diploma)
const SVG_GUILLOCHE_PARCHMENT = `
<svg width="1123" height="794" viewBox="0 0 1123 794" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="parchmentBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCF9F2"/>
      <stop offset="50%" stop-color="#F7F1E3"/>
      <stop offset="100%" stop-color="#EFE6D1"/>
    </linearGradient>
    <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#B45309"/>
      <stop offset="35%" stop-color="#D97706"/>
      <stop offset="70%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#92400E"/>
    </linearGradient>
    <pattern id="guillocheMicro" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M0 20 Q10 10 20 20 T40 20 M20 0 Q10 10 20 20 T20 40" fill="none" stroke="#D97706" stroke-width="0.35" stroke-opacity="0.18"/>
    </pattern>
  </defs>

  <!-- Base tone -->
  <rect width="1123" height="794" fill="url(#parchmentBg)"/>
  <rect width="1123" height="794" fill="url(#guillocheMicro)"/>

  <!-- Outer Triple Border -->
  <rect x="24" y="24" width="1075" height="746" rx="6" fill="none" stroke="url(#goldStroke)" stroke-width="4"/>
  <rect x="32" y="32" width="1059" height="730" rx="4" fill="none" stroke="#B45309" stroke-width="1" stroke-dasharray="6,3" stroke-opacity="0.7"/>
  <rect x="42" y="42" width="1039" height="710" rx="3" fill="none" stroke="url(#goldStroke)" stroke-width="1.5"/>

  <!-- Four Ornate Corner Guilloches -->
  <!-- Top Left -->
  <g transform="translate(42, 42)">
    <path d="M0 0 L60 0 C40 10 10 40 0 60 Z" fill="#FDE68A" fill-opacity="0.25"/>
    <path d="M0 0 L50 0 C30 8 8 30 0 50 Z" fill="none" stroke="url(#goldStroke)" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="12" fill="none" stroke="url(#goldStroke)" stroke-width="1"/>
    <circle cx="20" cy="20" r="6" fill="#B45309" fill-opacity="0.2"/>
  </g>
  <!-- Top Right -->
  <g transform="translate(1081, 42) scale(-1, 1)">
    <path d="M0 0 L60 0 C40 10 10 40 0 60 Z" fill="#FDE68A" fill-opacity="0.25"/>
    <path d="M0 0 L50 0 C30 8 8 30 0 50 Z" fill="none" stroke="url(#goldStroke)" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="12" fill="none" stroke="url(#goldStroke)" stroke-width="1"/>
    <circle cx="20" cy="20" r="6" fill="#B45309" fill-opacity="0.2"/>
  </g>
  <!-- Bottom Left -->
  <g transform="translate(42, 752) scale(1, -1)">
    <path d="M0 0 L60 0 C40 10 10 40 0 60 Z" fill="#FDE68A" fill-opacity="0.25"/>
    <path d="M0 0 L50 0 C30 8 8 30 0 50 Z" fill="none" stroke="url(#goldStroke)" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="12" fill="none" stroke="url(#goldStroke)" stroke-width="1"/>
    <circle cx="20" cy="20" r="6" fill="#B45309" fill-opacity="0.2"/>
  </g>
  <!-- Bottom Right -->
  <g transform="translate(1081, 752) scale(-1, -1)">
    <path d="M0 0 L60 0 C40 10 10 40 0 60 Z" fill="#FDE68A" fill-opacity="0.25"/>
    <path d="M0 0 L50 0 C30 8 8 30 0 50 Z" fill="none" stroke="url(#goldStroke)" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="12" fill="none" stroke="url(#goldStroke)" stroke-width="1"/>
    <circle cx="20" cy="20" r="6" fill="#B45309" fill-opacity="0.2"/>
  </g>

  <!-- Center Security Seal Watermark -->
  <g transform="translate(561.5, 397)" opacity="0.06">
    <circle r="160" fill="none" stroke="#B45309" stroke-width="4"/>
    <circle r="140" fill="none" stroke="#B45309" stroke-width="2" stroke-dasharray="6,4"/>
    <circle r="110" fill="none" stroke="#B45309" stroke-width="1.5"/>
    <polygon points="0,-90 26,-26 90,-26 38,16 58,80 0,42 -58,80 -38,16 -90,-26 -26,-26" fill="#B45309"/>
  </g>
</svg>
`;

// 2. Imperial Gold Champion (Prestige Luxury)
const SVG_IMPERIAL_GOLD = `
<svg width="1123" height="794" viewBox="0 0 1123 794" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFDF5"/>
      <stop offset="50%" stop-color="#FEF9C3"/>
      <stop offset="100%" stop-color="#FDF3B0"/>
    </linearGradient>
    <linearGradient id="richGold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#92400E"/>
      <stop offset="25%" stop-color="#D97706"/>
      <stop offset="50%" stop-color="#FCD34D"/>
      <stop offset="75%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#78350F"/>
    </linearGradient>
  </defs>

  <rect width="1123" height="794" fill="url(#goldBg)"/>

  <!-- Ornate Luxury Border -->
  <rect x="28" y="28" width="1067" height="738" fill="none" stroke="url(#richGold)" stroke-width="5"/>
  <rect x="38" y="38" width="1047" height="718" fill="none" stroke="#D97706" stroke-width="1" stroke-opacity="0.4"/>
  <rect x="46" y="46" width="1031" height="702" fill="none" stroke="url(#richGold)" stroke-width="2"/>

  <!-- Corner Flourish Brackets -->
  <path d="M56 100 L56 56 L100 56" fill="none" stroke="url(#richGold)" stroke-width="3"/>
  <path d="M1067 100 L1067 56 L1023 56" fill="none" stroke="url(#richGold)" stroke-width="3"/>
  <path d="M56 694 L56 738 L100 738" fill="none" stroke="url(#richGold)" stroke-width="3"/>
  <path d="M1067 694 L1067 738 L1023 738" fill="none" stroke="url(#richGold)" stroke-width="3"/>

  <!-- Central Radiating Sunburst Rays -->
  <g transform="translate(561.5, 397)" opacity="0.05">
    <circle r="220" fill="none" stroke="#D97706" stroke-width="2"/>
    <path d="M0 -220 L0 220 M-220 0 L220 0 M-155 -155 L155 155 M-155 155 L155 -155" stroke="#D97706" stroke-width="1.5"/>
    <path d="M-84 -203 L84 203 M-203 -84 L203 84 M-203 84 L203 -84 M-84 203 L84 -203" stroke="#D97706" stroke-width="1"/>
  </g>
</svg>
`;

// 3. Royal Silver Medalist (Athletic Precision)
const SVG_ROYAL_SILVER = `
<svg width="1123" height="794" viewBox="0 0 1123 794" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="silverBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="50%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
    <linearGradient id="silverBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="40%" stop-color="#94A3B8"/>
      <stop offset="70%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
  </defs>

  <rect width="1123" height="794" fill="url(#silverBg)"/>

  <!-- Double Frame -->
  <rect x="25" y="25" width="1073" height="744" rx="4" fill="none" stroke="url(#silverBorder)" stroke-width="4"/>
  <rect x="36" y="36" width="1051" height="722" rx="2" fill="none" stroke="#64748B" stroke-width="1.5"/>
  <rect x="42" y="42" width="1039" height="710" rx="1" fill="none" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="4,4"/>

  <!-- Silver Corner Notch Accents -->
  <polygon points="25,25 65,25 25,65" fill="#64748B" fill-opacity="0.3"/>
  <polygon points="1098,25 1058,25 1098,65" fill="#64748B" fill-opacity="0.3"/>
  <polygon points="25,769 65,769 25,729" fill="#64748B" fill-opacity="0.3"/>
  <polygon points="1098,769 1058,769 1098,729" fill="#64748B" fill-opacity="0.3"/>

  <!-- Center Laurel Watermark -->
  <g transform="translate(561.5, 397)" opacity="0.06">
    <circle r="140" fill="none" stroke="#475569" stroke-width="2"/>
    <circle r="120" fill="none" stroke="#475569" stroke-width="1" stroke-dasharray="3,3"/>
  </g>
</svg>
`;

// 4. Emerald Distinction (Honors & Academies)
const SVG_EMERALD_DISTINCTION = `
<svg width="1123" height="794" viewBox="0 0 1123 794" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="emeraldBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0FDF4"/>
      <stop offset="50%" stop-color="#DCFCE7"/>
      <stop offset="100%" stop-color="#D1FAE5"/>
    </linearGradient>
    <linearGradient id="emeraldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064E3B"/>
      <stop offset="50%" stop-color="#047857"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>

  <rect width="1123" height="794" fill="url(#emeraldBg)"/>

  <rect x="26" y="26" width="1071" height="742" rx="4" fill="none" stroke="url(#emeraldBorder)" stroke-width="4.5"/>
  <rect x="38" y="38" width="1047" height="718" rx="2" fill="none" stroke="#059669" stroke-width="1" stroke-dasharray="8,4" stroke-opacity="0.6"/>
  <rect x="46" y="46" width="1031" height="702" fill="none" stroke="url(#emeraldBorder)" stroke-width="1.5"/>

  <!-- Corner Crest Nodes -->
  <circle cx="46" cy="46" r="8" fill="#047857"/>
  <circle cx="1077" cy="46" r="8" fill="#047857"/>
  <circle cx="46" cy="748" r="8" fill="#047857"/>
  <circle cx="1077" cy="748" r="8" fill="#047857"/>

  <!-- Subtle Center Academic Shield -->
  <g transform="translate(561.5, 397)" opacity="0.07">
    <path d="M0 -120 L80 -70 L80 30 C80 90 0 130 0 130 C0 130 -80 90 -80 30 L-80 -70 Z" fill="none" stroke="#047857" stroke-width="4"/>
  </g>
</svg>
`;

// 5. Dark Onyx & Gold (Executive / Championship Gala)
const SVG_DARK_ONYX_GOLD = `
<svg width="1123" height="794" viewBox="0 0 1123 794" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="onyxBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181B"/>
      <stop offset="50%" stop-color="#09090B"/>
      <stop offset="100%" stop-color="#18181B"/>
    </linearGradient>
    <linearGradient id="onyxGold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#D97706"/>
      <stop offset="50%" stop-color="#FDE68A"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
  </defs>

  <rect width="1123" height="794" fill="url(#onyxBg)"/>

  <!-- Gold Luxury Frame on Dark Canvas -->
  <rect x="26" y="26" width="1071" height="742" fill="none" stroke="url(#onyxGold)" stroke-width="3"/>
  <rect x="36" y="36" width="1051" height="722" fill="none" stroke="#FDE68A" stroke-width="0.8" stroke-opacity="0.3"/>
  <rect x="46" y="46" width="1031" height="702" fill="none" stroke="url(#onyxGold)" stroke-width="1.5"/>

  <!-- Ornate Corner Geometric Pins -->
  <path d="M46 80 L46 46 L80 46" fill="none" stroke="url(#onyxGold)" stroke-width="3"/>
  <path d="M1077 80 L1077 46 L1043 46" fill="none" stroke="url(#onyxGold)" stroke-width="3"/>
  <path d="M46 714 L46 748 L80 748" fill="none" stroke="url(#onyxGold)" stroke-width="3"/>
  <path d="M1077 714 L1077 748 L1043 748" fill="none" stroke="url(#onyxGold)" stroke-width="3"/>

  <!-- Subtle Center Medal Watermark -->
  <circle cx="561.5" cy="397" r="160" fill="none" stroke="#FDE68A" stroke-width="1.5" stroke-opacity="0.08"/>
  <circle cx="561.5" cy="397" r="130" fill="none" stroke="#FDE68A" stroke-width="1" stroke-dasharray="6,6" stroke-opacity="0.08"/>
</svg>
`;

// 6. Modern Athletic Minimalist (Clean Contemporary)
const SVG_MODERN_MINIMAL = `
<svg width="1123" height="794" viewBox="0 0 1123 794" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cleanBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F8FAFC"/>
    </linearGradient>
  </defs>

  <rect width="1123" height="794" fill="url(#cleanBg)"/>

  <!-- Modern Dual Offset Border -->
  <rect x="22" y="22" width="1079" height="750" fill="none" stroke="#0F172A" stroke-width="3"/>
  <rect x="30" y="30" width="1063" height="734" fill="none" stroke="#2563EB" stroke-width="1.5"/>

  <!-- Athletic Geometric Corner Notches -->
  <polygon points="22,22 55,22 22,55" fill="#2563EB"/>
  <polygon points="1101,22 1068,22 1101,55" fill="#0F172A"/>
  <polygon points="22,772 55,772 22,739" fill="#0F172A"/>
  <polygon points="1101,772 1068,772 1101,739" fill="#2563EB"/>

  <!-- Micro Grid Pattern -->
  <g opacity="0.04" stroke="#0F172A" stroke-width="0.5">
    <line x1="561.5" y1="40" x2="561.5" y2="754"/>
    <line x1="40" y1="397" x2="1083" y2="397"/>
    <circle cx="561.5" cy="397" r="180" fill="none"/>
  </g>
</svg>
`;

// Presets export with metadata and instant previews
export const CERTIFICATE_BACKGROUND_PRESETS = [
  {
    id: 'guilloche-parchment',
    name: 'Vintage Guilloché Parchment',
    category: 'Academic & Formal',
    description: 'Authentic engraved diploma border with antique parchment texture & security rosette',
    dataUrl: svgToDataUri(SVG_GUILLOCHE_PARCHMENT),
    thumbnailColor: '#F7F1E3',
    accentColor: '#B45309',
    defaultOpacity: 1.0,
    defaultFit: 'cover',
  },
  {
    id: 'imperial-gold',
    name: 'Imperial Gold Champion',
    category: 'Luxury & Medals',
    description: 'Radiant gold diploma frame with ornate corner flourishes and sunburst watermark',
    dataUrl: svgToDataUri(SVG_IMPERIAL_GOLD),
    thumbnailColor: '#FEF9C3',
    accentColor: '#D97706',
    defaultOpacity: 1.0,
    defaultFit: 'cover',
  },
  {
    id: 'royal-silver',
    name: 'Royal Silver Medalist',
    category: 'Athletic Distinction',
    description: 'Precision metallic silver double-beveled border with corner notches and laurel watermark',
    dataUrl: svgToDataUri(SVG_ROYAL_SILVER),
    thumbnailColor: '#F1F5F9',
    accentColor: '#475569',
    defaultOpacity: 1.0,
    defaultFit: 'cover',
  },
  {
    id: 'emerald-distinction',
    name: 'Emerald Distinction',
    category: 'Academy Honors',
    description: 'Deep emerald-green scrollwork frame with corner crests and shield watermark',
    dataUrl: svgToDataUri(SVG_EMERALD_DISTINCTION),
    thumbnailColor: '#DCFCE7',
    accentColor: '#047857',
    defaultOpacity: 1.0,
    defaultFit: 'cover',
  },
  {
    id: 'dark-onyx-gold',
    name: 'Dark Onyx & Gold Gala',
    category: 'Luxury & Medals',
    description: 'Dramatic dark charcoal certificate with glowing gold corners and executive finish',
    dataUrl: svgToDataUri(SVG_DARK_ONYX_GOLD),
    thumbnailColor: '#18181B',
    accentColor: '#FDE68A',
    defaultOpacity: 1.0,
    defaultFit: 'cover',
  },
  {
    id: 'modern-minimal',
    name: 'Modern Athletic Federation',
    category: 'Athletic Distinction',
    description: 'Contemporary high-contrast dual-line athletic certificate with corner facets',
    dataUrl: svgToDataUri(SVG_MODERN_MINIMAL),
    thumbnailColor: '#FFFFFF',
    accentColor: '#2563EB',
    defaultOpacity: 1.0,
    defaultFit: 'cover',
  },
];

export default CERTIFICATE_BACKGROUND_PRESETS;
