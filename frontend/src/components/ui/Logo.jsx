import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Athlos Brand Logo
 * Features a modern, geometric victory flame, podium crest, and athletic crest wings.
 */
export function AthlosIcon({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
      aria-label="Athlos Mark"
    >
      <defs>
        {/* Championship Gold Gradient */}
        <linearGradient id="athlosGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Ambient Glow */}
        <linearGradient id="athlosFlameGrad" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#FDE047" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>

        {/* Shield Deep Base */}
        <linearGradient id="athlosBaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#292524" />
          <stop offset="100%" stopColor="#0C0A09" />
        </linearGradient>
      </defs>

      {/* Geometric Outer Shield / Podium Hexagon */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="14"
        fill="url(#athlosBaseGrad)"
        stroke="url(#athlosGoldGrad)"
        strokeWidth="1.5"
      />

      {/* Subtle Inner Glow Rim */}
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="12"
        fill="none"
        stroke="#FDE047"
        strokeWidth="0.5"
        strokeOpacity="0.25"
      />

      {/* 3 Ascending Podium Pillars & Victory Wings */}
      {/* Left Wing (Rank 3 - Bronze / Endurance) */}
      <path
        d="M11 31V23L16 19V31H11Z"
        fill="url(#athlosGoldGrad)"
        fillOpacity="0.85"
      />

      {/* Right Wing (Rank 2 - Silver / Precision) */}
      <path
        d="M37 31V21L32 17V31H37Z"
        fill="url(#athlosGoldGrad)"
        fillOpacity="0.9"
      />

      {/* Center Pinnacle / Podium #1 Athlos Torch (Gold / Victory) */}
      <path
        d="M21 31V16L24 13L27 16V31H21Z"
        fill="url(#athlosGoldGrad)"
      />

      {/* Dynamic Olympic / Victory Flame at Summit */}
      <path
        d="M24 8C25.5 10.5 28 12.5 28 14.8C28 17 26.2 18.5 24 18.5C21.8 18.5 20 17 20 14.8C20 13.5 21 11.8 24 8Z"
        fill="url(#athlosFlameGrad)"
      />

      {/* Base Foundation Bar */}
      <rect
        x="9"
        y="32.5"
        width="30"
        height="3"
        rx="1.5"
        fill="url(#athlosGoldGrad)"
      />
    </svg>
  );
}

export default function Logo({
  size = 'md',
  showText = true,
  subtitle = 'Sports & Verified Honors',
  to = '/',
  className = '',
  textClassName = '',
}) {
  const sizeMap = {
    sm: { icon: 28, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 36, text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 44, text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 56, text: 'text-2xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-2.5 group cursor-pointer select-none ${className}`}>
      <div className="relative group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all duration-300 rounded-2xl">
        <AthlosIcon size={currentSize.icon} />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span
              className={`font-black tracking-tight text-stone-900 group-hover:text-amber-600 transition-colors ${currentSize.text} ${textClassName}`}
            >
              Athlos
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          {subtitle && (
            <span
              className={`font-bold uppercase tracking-wider text-amber-600/90 mt-1 ${currentSize.sub}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
