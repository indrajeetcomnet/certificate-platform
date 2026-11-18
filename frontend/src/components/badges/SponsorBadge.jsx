import React, { useEffect, useRef } from 'react';
import { recordView } from '../../api/viewsApi';
import { recordClick } from '../../api/sponsorsApi';

export default function SponsorBadge({ sponsor, postId = null, className = '' }) {
  const badgeRef = useRef(null);
  const startTimeRef = useRef(null);

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

  const brandColor = sponsor.brandColor || sponsor.color || '#1c1917';

  return (
    <div className="inline-flex flex-col items-center justify-center select-none group">
      {/* ── Compact Sponsor Badge Pill (Simple Logo + Brand Name in Brand Color) ── */}
      <a
        ref={badgeRef}
        href={sponsor.websiteUrl || '#'}
        target={sponsor.websiteUrl ? '_blank' : '_self'}
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50/90 px-2.5 py-0.5 text-xs font-bold shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all max-w-[130px] sm:max-w-[150px] ${className}`}
        title={`Official Sponsor: ${sponsor.name}`}
      >
        {sponsor.logoUrl ? (
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            className="w-3.5 h-3.5 object-contain rounded-full shrink-0 border border-stone-100"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}

        <span
          className="truncate text-xs font-black tracking-tight"
          style={{ color: brandColor }}
        >
          {sponsor.name}
        </span>
      </a>

      {/* ── Sponsor Label Below the Badge in Light Grey ── */}
      <span className="text-[10px] text-stone-400 font-medium tracking-wide mt-0.5 leading-none">
        Sponsor
      </span>
    </div>
  );
}
