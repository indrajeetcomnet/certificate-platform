import React, { useState, useEffect, useRef, useMemo } from 'react';
import { recordView } from '../../api/viewsApi';
import { recordClick } from '../../api/sponsorsApi';

/**
 * Extracts strictly the concise brand name (no long taglines, sub-lines, or multiple rambling words).
 */
export function extractBrandName(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'Sponsor';
  const trimmed = rawName.trim();
  if (/^nike/i.test(trimmed)) return 'Nike';
  if (/^red\s*bull/i.test(trimmed)) return 'Red Bull';
  if (/^puma/i.test(trimmed)) return 'Puma';
  if (/^adidas/i.test(trimmed)) return 'Adidas';
  if (/^under\s*armour/i.test(trimmed)) return 'Under Armour';
  if (/^gatorade/i.test(trimmed)) return 'Gatorade';
  if (/^monster/i.test(trimmed)) return 'Monster';

  // Split on delimiters like - | : · /
  const base = trimmed.split(/[-–—|:·/]/)[0].trim();
  const words = base.split(/\s+/);
  if (words.length <= 2) return base;
  return words.slice(0, 2).join(' ');
}

export default function SponsorBadge({ sponsor, postId = null, className = '' }) {
  const badgeRef = useRef(null);
  const startTimeRef = useRef(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!sponsor?.id) return;
    startTimeRef.current = Date.now();

    return () => {
      if (startTimeRef.current && sponsor?.id) {
        const duration = Date.now() - startTimeRef.current;
        if (duration >= 2000) {
          recordView({
            sponsorId: sponsor.id,
            postId: postId,
            viewType: 'SPONSOR_BADGE',
            durationMs: duration,
          }).catch(() => {});
        }
      }
    };
  }, [sponsor?.id, postId]);

  if (!sponsor) return null;

  const handleClick = () => {
    if (sponsor?.id) {
      recordClick(sponsor.id).catch(() => {});
    }
  };

  const brandName = useMemo(() => {
    return extractBrandName(sponsor.name || sponsor.brandName);
  }, [sponsor.name, sponsor.brandName]);

  const brandColor = sponsor.brandColor || sponsor.color || '#1c1917';

  // Render official vector brand marks for major athletic sponsors if image is missing or failed
  const renderBrandLogo = () => {
    const isNike = /^nike/i.test(brandName);
    const isRedBull = /^red\s*bull/i.test(brandName);
    const isPuma = /^puma/i.test(brandName);

    if (sponsor.logoUrl && !imageFailed) {
      return (
        <img
          src={sponsor.logoUrl}
          alt={brandName}
          className="w-full h-full object-contain p-0.5"
          onError={() => setImageFailed(true)}
        />
      );
    }

    if (isNike) {
      return (
        <svg viewBox="0 0 24 24" fill={brandColor} className="w-4 h-4">
          <path d="M21.7 5.3c-2.8 2.8-7.1 5.7-11.3 7.1-2.1.7-4.2.7-5.8-.3-1.3-.8-1.9-2.1-1.5-3.3.4-1.2 1.6-2 3.1-2 .8 0 1.7.2 2.6.7 2.4 1.2 4.9 1.8 7.5 1.8 2 0 3.9-.3 5.4-1z"/>
        </svg>
      );
    }

    if (isRedBull) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-blue-900 rounded-full">
          <span className="text-[8px] font-black text-amber-300 tracking-tighter">RB</span>
        </div>
      );
    }

    if (isPuma) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-amber-600 rounded-full">
          <span className="text-[8px] font-black text-white tracking-tighter">P</span>
        </div>
      );
    }

    // Default: Clean monogram with brand background
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-full font-black text-[9px] text-white shadow-2xs"
        style={{ backgroundColor: brandColor }}
      >
        {brandName.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="inline-flex flex-col items-center justify-center select-none group">
      
      {/* ── Compact Sponsor Badge Pill (Bigger Logo + Bigger Brand Name in Brand Color) ── */}
      <a
        ref={badgeRef}
        href={sponsor.websiteUrl || '#'}
        target={sponsor.websiteUrl ? '_blank' : '_self'}
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-white hover:bg-stone-50/95 px-3 py-1 shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all max-w-[160px] sm:max-w-[180px] ${className}`}
        title={`Official Brand Sponsor: ${brandName}`}
      >
        {/* Slightly Bigger, Well-Framed Brand Logo Container */}
        <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full overflow-hidden bg-white border border-stone-200/80 shadow-2xs flex items-center justify-center shrink-0">
          {renderBrandLogo()}
        </div>

        {/* Clean, Slightly Bigger Font for Brand Name Only */}
        <span
          className="truncate text-xs sm:text-sm font-black tracking-tight leading-none"
          style={{ color: brandColor }}
        >
          {brandName}
        </span>
      </a>

      {/* ── Sponsor Sub-Label Below the Badge in Light Grey ── */}
      <span className="text-[10px] text-stone-400 font-semibold tracking-wider uppercase mt-1 leading-none select-none">
        Sponsor
      </span>
    </div>
  );
}
