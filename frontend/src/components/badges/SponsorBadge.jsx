import React, { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
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

  return (
    <a
      ref={badgeRef}
      href={sponsor.websiteUrl || '#'}
      target={sponsor.websiteUrl ? '_blank' : '_self'}
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50/95 text-stone-900 px-3 py-1 text-xs font-bold shadow-xs hover:border-emerald-500 hover:bg-emerald-100 transition-all duration-300 hover:scale-105 select-none ${className}`}
      title={`Official Sponsor: ${sponsor.name} · View generates creator revenue`}
    >
      {/* Live pulsing indicator for monetized view */}
      <span className="flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

      {sponsor.logoUrl ? (
        <img
          src={sponsor.logoUrl}
          alt={sponsor.name}
          className="w-3.5 h-3.5 object-contain rounded-full border border-emerald-200"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
        Sponsor
      </span>

      <span className="truncate max-w-[120px] font-black text-stone-900 tracking-tight">
        {sponsor.name}
      </span>

      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
        +₹
      </span>

      <ExternalLink className="w-2.5 h-2.5 text-stone-400 group-hover:text-stone-700 transition-colors" />
    </a>
  );
}
