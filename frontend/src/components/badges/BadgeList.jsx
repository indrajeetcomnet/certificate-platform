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
        className="py-8"
      />
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {badges.map((item, index) => {
        // item could be UserBadge (with .badge and .awardedAt) or flat Badge
        const badge = item.badge || item;
        const awardedAt = item.awardedAt;
        const institutionName = item.awardedBy?.name || badge.institutionName || badge.institution?.name;

        return (
          <Card
            key={item.id || index}
            className="flex flex-col justify-between p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <BadgeDisplay badge={badge} />
              </div>

              {badge.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {badge.description}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-500 flex flex-col gap-0.5">
              {institutionName && (
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                  Issued by: {institutionName}
                </span>
              )}
              {awardedAt && (
                <span className="text-gray-400">Awarded: {formatDate(awardedAt)}</span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
