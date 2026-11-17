import React from 'react';
import { Award, ShieldAlert } from 'lucide-react';
import Card from '../ui/Card';
import BadgeDisplay from './BadgeDisplay';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatDate } from '../../utils/formatters';

export default function BadgeList({
  badges = [],
  loading = false,
  emptyMessage = 'No badges earned yet.',
  className = '',
}) {
  if (loading) {
    return <LoadingSpinner text="Loading badges..." />;
  }

  if (!badges || badges.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No Badges Yet"
        description={emptyMessage}
        className="py-12"
      />
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5 ${className}`}>
      {badges.map((item, index) => {
        // item could be UserBadge (with .badge and .awardedAt) or flat Badge
        const badge = item.badge || item;
        const awardedAt = item.awardedAt;
        const institutionName = item.awardedBy?.name || badge.institutionName || badge.institution?.name;

        return (
          <div
            key={item.id || index}
            className="flex flex-col justify-between p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs hover:shadow-md hover:border-amber-400/80 transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <BadgeDisplay badge={badge} />
              </div>

              {badge.description && (
                <p className="text-xs font-medium text-stone-700 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200/80 text-xs text-stone-600 flex flex-col gap-1">
              {institutionName && (
                <span className="font-bold text-stone-900 truncate">
                  Issuer: {institutionName}
                </span>
              )}
              {awardedAt && (
                <span className="text-[11px] font-semibold text-stone-500">
                  Awarded on {formatDate(awardedAt)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
