import React from 'react';
import { Trophy, Medal, Award, Crown, Sparkles } from 'lucide-react';
import { formatBadgeTooltip } from '../../utils/badgeThemes.js';

export default function BadgeDisplay({ badge, size = 'md', className = '' }) {
  if (!badge) return null;

  const rank = Number(badge.rank) || 1;

  // Premium Metallic Rank Themes (Gold #1, Silver #2, Bronze #3, or dynamic Honor rank)
  const rankThemes = {
    1: {
      container: 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-stone-950 border-amber-300 shadow-[0_2px_14px_rgba(245,158,11,0.35)]',
      pill: 'bg-amber-900/90 text-amber-100 border border-amber-400/50',
      icon: Crown,
      label: 'Rank #1 Gold',
    },
    2: {
      container: 'bg-gradient-to-r from-slate-200 via-stone-100 to-slate-300 text-slate-900 border-slate-300 shadow-[0_2px_10px_rgba(148,163,184,0.25)]',
      pill: 'bg-slate-700 text-white border border-slate-400/50',
      icon: Medal,
      label: 'Rank #2 Silver',
    },
    3: {
      container: 'bg-gradient-to-r from-amber-800 via-orange-700 to-amber-900 text-amber-50 border-amber-600 shadow-[0_2px_10px_rgba(180,83,9,0.3)]',
      pill: 'bg-amber-950/90 text-amber-100 border border-amber-400/50',
      icon: Award,
      label: 'Rank #3 Bronze',
    },
  };

  const defaultHonorTheme = {
    container: 'bg-gradient-to-r from-sky-100 via-indigo-50 to-blue-100 text-blue-950 border-blue-300 shadow-[0_2px_10px_rgba(59,130,246,0.2)]',
    pill: 'bg-blue-900 text-blue-100 border border-blue-400/50',
    icon: Sparkles,
    label: `Rank #${rank} Honor`,
  };

  const theme = rankThemes[rank] || defaultHonorTheme;
  const Icon = theme.icon;
  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-bold tracking-tight transition-all duration-300 hover:scale-105 select-none ${theme.container} ${
        isSmall ? 'text-[11px] py-0.5 px-2.5' : 'text-xs'
      } ${className}`}
      title={formatBadgeTooltip(badge)}
    >
      {/* Icon with glowing pulse */}
      <Icon className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} flex-shrink-0 drop-shadow-xs`} />

      {/* Badge Name */}
      <span className="font-extrabold tracking-tight truncate max-w-[130px]">
        {badge.name || badge.title || 'Verified Honor'}
      </span>

      {/* Rank Shield Pill */}
      <span className={`px-1.5 py-0.5 rounded-md font-black text-[10px] tracking-wider uppercase shadow-xs ${theme.pill}`}>
        #{rank}
      </span>

      {/* Category Tag */}
      {!isSmall && badge.category && (
        <span className="text-[10px] font-semibold opacity-80 border-l border-current/25 pl-1.5 uppercase tracking-wider hidden sm:inline">
          {badge.category}
        </span>
      )}
    </div>
  );
}
