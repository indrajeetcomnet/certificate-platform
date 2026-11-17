import React, { useState } from 'react';
import { DollarSign, Eye, TrendingUp, Users, ArrowUpRight, BarChart3 } from 'lucide-react';
import Card from '../ui/Card';
import ViewsCounter from './ViewsCounter';
import EarningsCard from './EarningsCard';
import { formatCurrency, formatCount } from '../../utils/formatters';
import { computeEarningsFromBreakdown, calculateAverageRate } from '../../utils/earnings.js';

export default function EarningsDashboard({
  summary = null,
  sponsorBreakdown = [],
  history = [],
  className = '',
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');

  // Compute metrics from props
  const { totalEarnings, totalViews } = computeEarningsFromBreakdown(summary, sponsorBreakdown);

  const activeSponsorsCount = summary?.activeSponsors != null
    ? summary.activeSponsors
    : sponsorBreakdown.length;

  // History data from real API
  const chartData = history || [];
  const maxAmount = chartData.length > 0 ? Math.max(...chartData.map((d) => d.amount), 1) : 1;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top summary metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <Card className="p-5 bg-gradient-to-br from-green-500/10 via-white to-white dark:from-green-950/20 dark:via-gray-800 dark:to-gray-800 border-green-200 dark:border-green-900/50">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Earnings</span>
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-green-600 dark:text-green-400">
            {formatCurrency(totalEarnings)}
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Monetized badge impressions</span>
          </div>
        </Card>

        {/* Total Views */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Verified Views</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {totalViews.toLocaleString('en-IN')}
          </div>
          <div className="mt-2">
            <ViewsCounter count={totalViews} />
          </div>
        </Card>

        {/* Active Sponsors */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Sponsors</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
            {activeSponsorsCount}
          </div>
          <p className="text-xs text-gray-400 mt-2">Brand partners rotating with badges</p>
        </Card>

        {/* Effective Rate */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Avg Revenue / 1K Views</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {calculateAverageRate(totalEarnings, totalViews)}
          </div>
          <p className="text-xs text-stone-400 mt-2">Rate: ₹20 per 1,000 qualifying sponsor views</p>
        </Card>
      </div>

      {/* Chart: Earnings Over Time (Pure HTML/CSS Div Bar Chart) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <span>Earnings History</span>
            </h3>
            <p className="text-xs text-stone-400">Monthly breakdown of sponsored badge impressions</p>
          </div>
        </div>

        {/* Bar chart container or empty state */}
        {chartData.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400 space-y-1 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
            <BarChart3 className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="font-semibold text-stone-600">No monthly history recorded yet</p>
            <p className="text-[11px] text-stone-400">Sponsor views convert to earnings in real-time when other users view your posts in the feed.</p>
          </div>
        ) : (
          <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 pt-6 px-2 border-b border-stone-200">
            {chartData.map((bar, idx) => {
              const heightPercent = Math.round((bar.amount / maxAmount) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-semibold text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(bar.amount)}
                  </span>
                  <div
                    className="w-full max-w-[48px] bg-amber-500 hover:bg-amber-600 rounded-t-lg transition-all duration-500 shadow-xs relative"
                    style={{ height: `${Math.max(heightPercent, 8)}%` }}
                  />
                  <span className="text-xs font-medium text-stone-600 mt-1">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Per-Sponsor Breakdown Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Per-Sponsor Revenue Breakdown
          </h3>
          <p className="text-xs text-gray-400">Detailed impression earnings by brand campaign</p>
        </div>

        {sponsorBreakdown.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No sponsor impression records found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/70 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-4">Sponsor Partner</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Impression Views</th>
                  <th className="py-3 px-4 text-right">Earned Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sponsorBreakdown.map((item, idx) => {
                  const sponsorName = item.sponsor?.name || item.sponsorName || `Sponsor #${idx + 1}`;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                        {sponsorName}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{item.period || '2026-11'}</td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {(Number(item.totalViews) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(Number(item.earnedAmount) || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
