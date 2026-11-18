import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Trophy,
  DollarSign,
  TrendingUp,
  Eye,
  MousePointer,
  ExternalLink,
  Plus,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Building2,
  HeartHandshake,
  ShieldCheck,
  Zap,
  Globe,
  Tag,
  Search,
  Filter
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getAll as getAllSponsors,
  getMySponsors,
  create as createSponsorApi,
  toggleStatus as toggleStatusApi,
  addDeposit as addDepositApi,
  recordClick
} from '../api/sponsorsApi';

// Quick logo presets for fast sponsor creation
const PRESET_LOGOS = [
  { name: 'Red Bull Racing', url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=150&h=150&fit=crop' },
  { name: 'Nike Athletic', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&h=150&fit=crop' },
  { name: 'Puma Speed', url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=150&h=150&fit=crop' },
  { name: 'Athlos Gear', url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=150&h=150&fit=crop' },
  { name: 'SpeedLab Tech', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&h=150&fit=crop' },
];

export default function SponsorsPage() {
  const { currentUser, isInstitution, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [sponsors, setSponsors] = useState([]);
  const [mySponsors, setMySponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'MY'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal controls
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Create Campaign Form State
  const [brandName, setBrandName] = useState('');
  const [tagline, setTagline] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [budget, setBudget] = useState('2000');
  const [targetCategory, setTargetCategory] = useState('ALL');
  const [sponsorType, setSponsorType] = useState('BRAND');

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState('1000');

  // Load all sponsors & user sponsors
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAllSponsors();
      const allList = Array.isArray(res.data) ? res.data : [];
      setSponsors(allList);

      if (isAuthenticated && currentUser) {
        try {
          const myRes = await getMySponsors();
          setMySponsors(Array.isArray(myRes.data) ? myRes.data : []);
        } catch {
          setMySponsors([]);
        }
      }
    } catch (err) {
      console.warn('Failed to load sponsors:', err.message);
      setSponsors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated, currentUser]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const list = sponsors || [];
    const totalPool = list.reduce((acc, s) => acc + Number(s.budget || 0), 0);
    const totalDistributed = list.reduce((acc, s) => acc + Number(s.spentAmount || 0), 0);
    const totalImpressions = list.reduce((acc, s) => acc + Number(s.totalImpressions || 0), 0);
    const totalClicks = list.reduce((acc, s) => acc + Number(s.totalClicks || 0), 0);
    return { totalPool, totalDistributed, totalImpressions, totalClicks };
  }, [sponsors]);

  // Handle Create Campaign
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (isInstitution) {
      showToast('Institutions create certificates and awards. Sponsorships are reserved for brands, fans, and creators.', 'error');
      return;
    }

    if (!brandName.trim()) {
      showToast('Brand or sponsor name is required', 'error');
      return;
    }

    const numBudget = parseFloat(budget) || 1000;
    if (numBudget < 100) {
      showToast('Minimum sponsorship deposit is ₹100', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: brandName.trim(),
        tagline: tagline.trim() || 'Supporting competitive athletes & tournament champions',
        websiteUrl: websiteUrl.trim() || 'https://example.com/sponsor',
        logoUrl: logoUrl.trim() || PRESET_LOGOS[0].url,
        budget: numBudget,
        cpmRate: 20.00,
        targetCategory,
        sponsorType,
        isActive: true,
      };

      const res = await createSponsorApi(payload);
      showToast(`Campaign for "${brandName}" launched! It is now rotating live on verified badges.`, 'success');
      setIsCreateOpen(false);
      resetCreateForm();
      await loadData();
      if (isAuthenticated) setActiveTab('MY');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to create sponsorship campaign', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setBrandName('');
    setTagline('');
    setWebsiteUrl('');
    setLogoUrl('');
    setBudget('2000');
    setTargetCategory('ALL');
    setSponsorType('BRAND');
  };

  // Toggle Campaign Active/Pause
  const handleToggle = async (sponsorId) => {
    try {
      await toggleStatusApi(sponsorId);
      showToast('Campaign status updated', 'success');
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update campaign status', 'error');
    }
  };

  // Deposit Additional Budget
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSponsor) return;
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 100) {
      showToast('Minimum deposit is ₹100', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addDepositApi(selectedSponsor.id, amount);
      showToast(`Added ₹${amount.toLocaleString()} budget to ${selectedSponsor.name}!`, 'success');
      setIsDepositOpen(false);
      setSelectedSponsor(null);
      setDepositAmount('1000');
      await loadData();
    } catch (err) {
      showToast('Deposit failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const displayedList = useMemo(() => {
    const source = activeTab === 'MY' ? mySponsors : sponsors;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.tagline?.toLowerCase().includes(q) ||
        s.targetCategory?.toLowerCase().includes(q)
    );
  }, [activeTab, sponsors, mySponsors, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">

      {/* ── 1. HERO HEADER WITH METRICS ── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-amber-500/10 via-white to-amber-50/40 border border-amber-200/80 p-6 sm:p-8 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Athlos Commercial & Fan Sponsorship Network</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Sponsor Champions & Tournaments
            </h1>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              Anyone can sponsor — brands, fan clubs, local businesses, or creators. Attach your brand directly to verified athlete badges, rotate in real time across the social feed, and convert impressions into verified creator earnings in Indian Rupees.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <Button
              variant="dark"
              size="lg"
              icon={Plus}
              onClick={() => {
                if (isInstitution) {
                  showToast('Institutions create certificates and awards. Sponsorships are reserved for brands, fans, and creators.', 'info');
                }
                setIsCreateOpen(true);
              }}
              className="shadow-md hover:scale-105 transition-all text-sm font-bold"
            >
              Launch Sponsorship Campaign
            </Button>
          </div>
        </div>

        {/* Real-Time Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-amber-200/60">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Active Sponsorship Pool
            </span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
              ₹{metrics.totalPool.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
              Deposited in escrow
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Distributed Creator Revenue
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
              ₹{metrics.totalDistributed.toLocaleString()}
            </span>
            <span className="text-[10px] text-stone-400 font-bold block mt-0.5">
              Paid to competing athletes
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Delivered Impressions
            </span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
              {metrics.totalImpressions.toLocaleString()}
            </span>
            <span className="text-[10px] text-stone-400 font-bold block mt-0.5">
              Verified 2s+ feed views
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              CPM Payout Rate
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
              ₹20 / 1K views
            </span>
            <span className="text-[10px] text-stone-400 font-bold block mt-0.5">
              100% direct athlete revenue
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. CONTROLS & TAB FILTER ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Segmented Filter */}
        <div className="inline-flex p-1 bg-stone-200/70 rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Active Sponsors ({sponsors.length})
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setActiveTab('MY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'MY'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              My Campaigns ({mySponsors.length})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sponsor brands, tags..."
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/50"
          />
        </div>
      </div>

      {/* ── 3. SPONSORS GRID ── */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Loading active sponsorship campaigns..." />
        </div>
      ) : displayedList.length === 0 ? (
        <EmptyState
          title={activeTab === 'MY' ? "You haven't launched any sponsorships yet" : "No sponsorship campaigns found"}
          message={
            activeTab === 'MY'
              ? "Any fan, brand, or creator can sponsor an athlete or tournament. Launch a campaign with as little as ₹100!"
              : "Try adjusting your search query, or be the first to sponsor this competition season."
          }
          actionLabel="Launch a Campaign"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedList.map((sponsor) => {
            const isOwner = currentUser && (sponsor.createdById === currentUser.id || !sponsor.createdById);
            const budgetNum = Number(sponsor.budget || 0);
            const spentNum = Number(sponsor.spentAmount || 0);
            const progress = budgetNum > 0 ? Math.min(100, (spentNum / budgetNum) * 100) : 0;
            const isLive = sponsor.status === 'ACTIVE' && sponsor.isActive;

            return (
              <div
                key={sponsor.id}
                className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-5 hover:border-amber-300"
              >
                {/* Header: Logo, Name, Status */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center p-1.5 shadow-2xs overflow-hidden">
                        {sponsor.logoUrl ? (
                          <img
                            src={sponsor.logoUrl}
                            alt={sponsor.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = PRESET_LOGOS[0].url;
                            }}
                          />
                        ) : (
                          <Sparkles className="w-6 h-6 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-stone-900 leading-snug">
                          {sponsor.name}
                        </h3>
                        <span className="text-[11px] font-bold text-amber-700 tracking-wide uppercase">
                          {sponsor.targetCategory || 'All Podium Badges'}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>LIVE</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[10px] font-black border border-stone-200">
                          <span>{sponsor.status || 'PAUSED'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tagline */}
                  <p className="text-xs text-stone-600 leading-relaxed font-normal">
                    {sponsor.tagline || 'Supporting verified champions on Athlos.'}
                  </p>
                </div>

                {/* Performance & Budget Bar */}
                <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/70">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-stone-500">Campaign Budget</span>
                    <span className="font-mono text-stone-900">
                      ₹{spentNum.toLocaleString()} / ₹{budgetNum.toLocaleString()}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Impressions & Clicks stats */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200/60 text-[11px]">
                    <div className="flex items-center gap-1 text-stone-600">
                      <Eye className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-bold">{(sponsor.totalImpressions || 0).toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-1 text-stone-600 justify-end">
                      <MousePointer className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-bold">{(sponsor.totalClicks || 0).toLocaleString()} clicks</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                  <a
                    href={sponsor.websiteUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => recordClick(sponsor.id).catch(() => {})}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-amber-600 transition-colors"
                  >
                    <span>Visit Sponsor</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>

                  {/* Owner Controls */}
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(sponsor.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors"
                        title={isLive ? 'Pause Campaign' : 'Resume Campaign'}
                      >
                        {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>

                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => {
                          setSelectedSponsor(sponsor);
                          setIsDepositOpen(true);
                        }}
                      >
                        + Add Funds
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. HOW SPONSORSHIP WORKS SECTION ── */}
      <div className="rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wider text-amber-600">
            Open Creator & Athletic Economy
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            How Verified Sponsorship Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#FBFBF9] border border-stone-200/70 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
              1
            </div>
            <h4 className="font-extrabold text-sm text-stone-900">Anyone Launches a Campaign</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Fans, athletic brands, local gyms, or creators can fund a campaign with as little as ₹100. Institutions remain neutral credential issuers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FBFBF9] border border-stone-200/70 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
              2
            </div>
            <h4 className="font-extrabold text-sm text-stone-900">Live 5-Second Badge Rotation</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Active sponsors rotate seamlessly alongside Game City podium badges on every post in the social arena.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FBFBF9] border border-stone-200/70 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-sm">
              3
            </div>
            <h4 className="font-extrabold text-sm text-stone-900">Automated INR View Payouts</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Views lasting over 2 seconds automatically convert into verified Indian Rupee earnings credited straight to the athlete’s balance.
            </p>
          </div>
        </div>
      </div>

      {/* ── 5. LAUNCH CAMPAIGN MODAL ── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Launch a Sponsorship Campaign"
        size="lg"
      >
        {isInstitution ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-stone-900">
                Institutions Are Credential Issuers
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                As an accredited institution, your role is to host tournaments and issue official certificates and competition badges. Sponsorship campaigns are open to brands, fans, local businesses, and creators.
              </p>
            </div>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <HeartHandshake className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Open to Everyone:</strong> Launch your sponsorship to rotate on athlete badges across the platform. Your budget directly funds athletic achievements.
              </span>
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Brand or Sponsor Name *
              </label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. SpeedLab Athletic Gear or Indrajeet Fan Club"
                required
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Campaign Tagline / Message
              </label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Fueling next-gen sprinters to the national podium"
              />
            </div>

            {/* Target Category & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Target Badge Category
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-200 text-xs font-bold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                >
                  <option value="ALL">All Competitions (Platform-Wide)</option>
                  <option value="ATHLETICS">Athletics & Track Badges</option>
                  <option value="FOOTBALL">Football & Team Sports</option>
                  <option value="GOLD">Gold Champions Only (Rank #1)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Sponsor Type
                </label>
                <select
                  value={sponsorType}
                  onChange={(e) => setSponsorType(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-stone-200 text-xs font-bold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                >
                  <option value="BRAND">Commercial Brand / Business</option>
                  <option value="FAN_CLUB">Athlete Fan Club / Supporter</option>
                  <option value="CREATOR">Creator / Influencer</option>
                  <option value="COMMUNITY">Local Community Club</option>
                </select>
              </div>
            </div>

            {/* Target Website URL */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Website or Social Profile URL
              </label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourbrand.com or https://instagram.com/yourhandle"
              />
            </div>

            {/* Preset Logo Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Brand Logo (Select preset or enter URL)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_LOGOS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setLogoUrl(p.url)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      logoUrl === p.url
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400/30'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Or paste custom image URL..."
              />
            </div>

            {/* Budget Presets & Live Calculation */}
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Sponsorship Deposit (INR ₹) *
              </label>

              <div className="flex flex-wrap gap-2 mb-2">
                {['500', '1000', '2000', '5000', '10000'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBudget(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                      budget === preset
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400/30'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    ₹{Number(preset).toLocaleString()}
                  </button>
                ))}
              </div>

              <Input
                type="number"
                min="100"
                step="50"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Deposit Amount in INR"
                required
              />

              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 font-medium">
                At the standard ₹20 / 1,000 views rate, a <strong>₹{Number(budget || 0).toLocaleString()}</strong> deposit will deliver approximately <strong>{Math.floor(((Number(budget || 0)) / 20) * 1000).toLocaleString()} verified impressions</strong> directly to competing athletes.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="dark" loading={submitting}>
                Activate Sponsorship Campaign
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── 6. ADD DEPOSIT MODAL ── */}
      <Modal
        isOpen={isDepositOpen}
        onClose={() => {
          setIsDepositOpen(false);
          setSelectedSponsor(null);
        }}
        title={`Add Budget to ${selectedSponsor?.name || 'Campaign'}`}
        size="sm"
      >
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <p className="text-xs text-stone-600">
            Current balance: <strong>₹{Number(selectedSponsor?.budget || 0) - Number(selectedSponsor?.spentAmount || 0)}</strong> remaining.
          </p>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Additional Deposit (INR ₹)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['500', '1000', '2500', '5000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDepositAmount(preset)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
                    depositAmount === preset ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-white border-stone-200 text-stone-700'
                  }`}
                >
                  +₹{Number(preset).toLocaleString()}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min="100"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsDepositOpen(false);
                setSelectedSponsor(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="dark" loading={submitting}>
              Confirm Deposit
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
