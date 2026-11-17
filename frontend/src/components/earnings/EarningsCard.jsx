import React from 'react';
import { DollarSign, Eye, Calendar, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import { formatCurrency, formatCount } from '../../utils/formatters';

export default function EarningsCard({
  earning,
  className = '',
}) {
  if (!earning) return null;

  const {
    sponsor = {},
    sponsorName = sponsor.name || 'Sponsor Partner',
    totalViews = 0,
    earnedAmount = 0,
    period = 'Current Period',
  } = earning;

  return (
    <Card className={`p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-all ${className}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 text-purple-600 flex items-center justify-center flex-shrink-0">
            {sponsor.logoUrl ? (
              <img
                src={sponsor.logoUrl}
                alt={sponsorName}
                className="w-6 h-6 object-contain rounded-md"
              />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {sponsorName}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{period}</span>
            </div>
          </div>
        </div>

        {/* Status pill */}
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300">
          Monetized
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div>
          <span className="text-[11px] text-gray-400 block">Sponsor Views</span>
          <div className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200 text-sm">
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span>{formatCount(totalViews)}</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] text-gray-400 block">Revenue Earned</span>
          <div className="flex items-center gap-1 font-bold text-green-600 dark:text-green-400 text-sm">
            <span>{formatCurrency(earnedAmount)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
