import React, { useState, useEffect } from 'react';
import { DollarSign, RefreshCw } from 'lucide-react';
import EarningsDashboard from '../components/earnings/EarningsDashboard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { getEarnings } from '../api/viewsApi';
import { useAuth } from '../context/AuthContext';

export default function EarningsPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState({
    summary: {
      totalEarnings: 0,
      totalViews: 0,
      activeSponsors: 0,
    },
    breakdown: [],
    history: [],
  });

  const loadEarnings = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getEarnings(userId);
      const data = res.data || {};
      setEarningsData({
        summary: {
          totalEarnings: Number(data.totalEarnings) || 0,
          totalViews: Number(data.totalViews) || 0,
          activeSponsors: data.sponsorBreakdown?.length || 0,
        },
        breakdown: data.sponsorBreakdown || [],
        history: data.history || [],
      });
    } catch (err) {
      console.warn('Real-time earnings fetch notice:', err.message);
      setEarningsData({
        summary: {
          totalEarnings: 0,
          totalViews: 0,
          activeSponsors: 0,
        },
        breakdown: [],
        history: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, [userId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span>Monetization & Sponsor Earnings</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track real-time impressions, sponsor rotation views, and INR revenue credited to your account
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={loadEarnings}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner text="Calculating earnings metrics..." className="py-20" />
      ) : (
        <EarningsDashboard
          summary={earningsData.summary}
          sponsorBreakdown={earningsData.breakdown}
          history={earningsData.history}
        />
      )}
    </div>
  );
}
