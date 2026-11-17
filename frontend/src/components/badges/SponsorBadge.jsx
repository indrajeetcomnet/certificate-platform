import React, { useEffect, useRef } from 'react';
import { ExternalLink, Eye, CheckCircle2 } from 'lucide-react';
import { recordView } from '../../api/viewsApi';

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

  return (
    <a
      ref={badgeRef}
      href={sponsor.websiteUrl || '#'}
      target={sponsor.websiteUrl ? '_blank' : '_self'}
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-50 text-emerald-950 px-3 py-1 text-xs font-bold shadow-xs hover:border-emerald-500/60 hover:bg-emerald-100 transition-all duration-300 hover:scale-105 select-none ${className}`}
      title={`Official Sponsor: ${sponsor.name} (View generates creator revenue)`}
    >
      {/* Live pulsing green eye indicating monetized view */}
      <span className="flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

      {sponsor.logoUrl ? (
        <img
          src={sponsor.logoUrl}
          alt={sponsor.name}
          className="w-3.5 h-3.5 object-contain rounded-full"
        />
      ) : null}

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
        Sponsor
      </span>

      <span className="truncate max-w-[110px] font-black text-white tracking-tight">
        {sponsor.name}
      </span>

      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
        +₹
      </span>

      <ExternalLink className="w-2.5 h-2.5 text-stone-400 hover:text-white transition-colors" />
    </a>
  );
}