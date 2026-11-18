import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Trophy,
  Crown,
  Medal,
  Award,
  DollarSign,
  ShieldCheck,
  Building2,
  ArrowRight,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  CheckCircle2,
  Activity,
  Sparkles
} from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import SponsorBadge from '../components/badges/SponsorBadge';
import { useAuth } from '../context/AuthContext';
import { getFeed } from '../api/postsApi';
import { getAll as getAllSponsors } from '../api/sponsorsApi';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isInstitution } = useAuth();

  // 1. Live 5-second dynamic badge <-> sponsor rotation animation
  const [isSponsorView, setIsSponsorView] = useState(false);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [activeSponsors, setActiveSponsors] = useState([]);
  const [feedLiked, setFeedLiked] = useState(false);

  useEffect(() => {
    // Fetch real post and sponsors from database
    getFeed(0)
      .then((res) => {
        const posts = Array.isArray(res.data?.content)
          ? res.data.content
          : Array.isArray(res.data)
            ? res.data
            : [];
        if (posts.length > 0) setFeaturedPost(posts[0]);
      })
      .catch(() => { });

    getAllSponsors()
      .then((res) => {
        const sponsors = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.content)
            ? res.data.content
            : [];
        setActiveSponsors(sponsors);
      })
      .catch(() => { });

    const timer = setInterval(() => {
      setIsSponsorView((prev) => !prev);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleEnterFeed = () => {
    if (isAuthenticated) {
      navigate('/feed');
    } else {
      navigate('/login', { state: { mode: 'login' } });
    }
  };

  const handleEnterInstitution = () => {
    if (isAuthenticated && isInstitution) {
      navigate('/certificates');
    } else {
      navigate('/login', { state: { mode: 'institution' } });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F5] text-stone-900 selection:bg-amber-500/20 selection:text-amber-900 relative overflow-x-hidden flex flex-col justify-between">

      {/* Ambient Lighting Orbs */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[650px] h-[550px] bg-gradient-to-br from-amber-400/12 via-orange-400/6 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ── TOP FLOATING GLASS HEADER ── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#F8F8F5]/85 border-b border-stone-200/70 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between gap-4">

          {/* Athlos Brand Logo */}
          <Logo size="md" subtitle="Sports & Verified Honors" />

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/hall-of-fame"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-800 transition-all hover:scale-105 shadow-2xs"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Hall of Fame</span>
            </Link>
            <Link
              to="/sponsors"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 text-xs font-bold text-amber-900 transition-all hover:scale-105 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Sponsor Hub</span>
            </Link>
            {!isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login', { state: { mode: 'login' } })}
                  className="font-bold text-stone-700 hover:text-stone-950"
                >
                  Sign In
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Building2}
                  onClick={handleEnterInstitution}
                  className="hidden sm:inline-flex"
                >
                  Institution Gateway
                </Button>
                <Button
                  variant="dark"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => navigate('/login', { state: { mode: 'register' } })}
                >
                  Join Arena
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Building2}
                  onClick={handleEnterInstitution}
                  className="hidden sm:inline-flex"
                >
                  {isInstitution ? 'Institution Dashboard' : 'Institution Gateway'}
                </Button>
                <Button
                  variant="dark"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={handleEnterFeed}
                >
                  Enter Social Arena
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Landing Page Content */}
      <main className="flex-1 space-y-16 py-8 sm:py-12">

        {/* ── 1. HERO SECTION: Clean Alignment & Clear Focus ── */}
        <section className="px-4 max-w-4xl mx-auto text-center space-y-6">

          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-950 text-xs font-black tracking-wide shadow-xs">
            <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Competitive Sports Network · Monetized Sponsor Impressions</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-stone-900 tracking-tight leading-[1.08] max-w-3xl mx-auto">
            Unstoppable Energy. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent">
              Verifiable Glory.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Where athletic triumphs unlock official badges, brand sponsors rotate in real-time every 5 seconds, and views convert into verified creator value.
          </p>

          {/* Hero Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Button
              size="xl"
              variant="dark"
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleEnterFeed}
              className="shadow-xl hover:scale-105"
            >
              Explore Social Feed
            </Button>

            <Button
              size="xl"
              variant="secondary"
              icon={Sparkles}
              onClick={() => navigate('/sponsors')}
              className="shadow-sm hover:scale-105 border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-950 font-bold"
            >
              Sponsor Champions (₹)
            </Button>

            <Button
              size="xl"
              variant="secondary"
              icon={Building2}
              onClick={handleEnterInstitution}
              className="shadow-sm hover:scale-105"
            >
              Institution Gateway
            </Button>
          </div>
        </section>

        {/* ── 2. VISUAL FEED & BADGE ROTATOR SHOWCASE ── */}
        <section id="feed-preview" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* Left: The Real-Time Rotating Feed Component Preview */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>Live Feed & Badge Rotation Engine</span>
                </span>
                <span className="text-xs font-mono font-bold text-stone-400">
                  5-Second Swap
                </span>
              </div>

              {/* Feed Post Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-2xl space-y-4 transition-all duration-300 hover:border-amber-400/60 flex-1 flex flex-col justify-between">

                {/* Header: Left User vs Right Rotating Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-black text-sm shadow-xs uppercase">
                      {String(featuredPost?.user?.displayName || 'Athlos Athletics Official').substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm sm:text-base text-stone-900">
                          {featuredPost?.user?.displayName || 'Athlos Athletics Federation'}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-amber-500 fill-amber-400/20" />
                        <span className="text-xs text-stone-400">
                          @{featuredPost?.user?.username || 'athlos_academy'}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-stone-400">Verified Tournament Announcement</span>
                    </div>
                  </div>

                  {/* The 5-Second Rotator Preview (Game City #1 <-> Sponsor) */}
                  <div className="min-w-[150px] flex justify-end">
                    {!isSponsorView ? (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-stone-950 font-black text-xs border border-amber-300 shadow-[0_2px_14px_rgba(245,158,11,0.35)] animate-in fade-in zoom-in-95 duration-300">
                        <Crown className="w-3.5 h-3.5" />
                        <span>Game City</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-900/90 text-amber-100 font-black text-[10px]">#1</span>
                      </div>
                    ) : (
                      <div className="animate-in fade-in zoom-in-95 duration-300">
                        <SponsorBadge
                          sponsor={
                            activeSponsors?.length > 0 && activeSponsors[0]?.name
                              ? activeSponsors[0]
                              : {
                                  id: 1,
                                  name: 'Nike Pro',
                                  logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&h=150&fit=crop',
                                  brandColor: '#E11D48',
                                }
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-normal">
                  {featuredPost?.content || 'Game City National Athletics Invitational is underway! Compete across verified brackets, claim podium rank badges, and monetize sponsor views in real time.'}
                </p>

                {/* High-Res Sports Image (Verified 200 OK Floodlight Arena) */}
                <div className="relative rounded-2xl overflow-hidden shadow-inner h-52 sm:h-60 border border-stone-200/80 group bg-stone-900">
                  <img
                    src={featuredPost?.imageUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80'}
                    alt="Night Arena Floodlights and Electric Atmosphere"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 text-xs font-bold text-white drop-shadow flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>National Arena Championship 2026</span>
                  </div>
                </div>

                {/* Interaction Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-bold text-stone-500">
                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      onClick={() => setFeedLiked(!feedLiked)}
                      className={`flex items-center gap-1.5 transition-all ${feedLiked ? 'text-rose-600 scale-105' : 'hover:text-rose-600'}`}
                    >
                      <Heart className={`w-4 h-4 ${feedLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                      <span>{feedLiked ? (featuredPost?.likesCount || 0) + 1 : (featuredPost?.likesCount || 0)}</span>
                    </button>

                    <div className="flex items-center gap-1.5 hover:text-stone-900 cursor-pointer">
                      <MessageSquare className="w-4 h-4" />
                      <span>{featuredPost?.commentsCount || 0} comments</span>
                    </div>

                    <div className="flex items-center gap-1.5 hover:text-stone-900 cursor-pointer">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{(featuredPost?.viewsCount || 0).toLocaleString()} views</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Sports Imagery Cards */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-5">

              {/* Visual Card 1: Championship Trophy */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-stone-800 bg-stone-950 flex-1 min-h-[220px] flex flex-col justify-end p-6 group">
                <img
                  src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80"
                  alt="Golden Championship Trophy"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
                <div className="relative z-10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Prestige & Honors
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight leading-snug">
                    Game City #Rank [1 to 3]
                  </h3>
                  <p className="text-xs text-stone-300">
                    Awarded by official institutions for competitive athletic tournaments.
                  </p>
                </div>
              </div>

              {/* Visual Card 2: Mountain Summit */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-stone-800 bg-stone-950 flex-1 min-h-[220px] flex flex-col justify-end p-6 group">
                <img
                  src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
                  alt="Sunrise Mountain Summit"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
                <div className="relative z-10 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Monetized Attention
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight leading-snug">
                    ₹20 Payout per 1K Views
                  </h3>
                  <p className="text-xs text-stone-300">
                    Authentic impressions convert into verified sponsorship revenue.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ── 3. VISUAL METALLIC BADGE TIERS ── */}
        <section id="badge-showcase" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-600 block">
              Competition Honors
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Game City Badge Tiers
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Awarded to podium finishers by sports academies. Each badge rotates with active sponsors.
            </p>
          </div>

          {/* 3 Metallic Rank Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">

            {/* Rank #1: Gold */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 via-white to-white border-2 border-amber-300 shadow-premium hover:shadow-glow-gold transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md">
                    <Crown className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs border border-amber-300">
                    RANK #1 GOLD
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900">Game City Champion</h3>
                  <p className="text-xs text-stone-500 mt-1">1st Place Trophy Award · Athlos Sports Federation</p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-stone-900 flex items-center justify-between text-xs font-bold">
                <span className="text-amber-800 font-extrabold">Rotating Sponsor:</span>
                <span className="font-mono text-emerald-700">Red Bull Racing</span>
              </div>
            </div>

            {/* Rank #2: Silver */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-200/30 via-white to-white border-2 border-slate-300 shadow-premium transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-slate-200 via-stone-100 to-slate-300 text-slate-900 flex items-center justify-center font-black shadow-md">
                    <Medal className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-black text-xs border border-slate-300">
                    RANK #2 SILVER
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900">Game City Runner-Up</h3>
                  <p className="text-xs text-stone-500 mt-1">2nd Place Medal Award · Athlos Sports Federation</p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-stone-900 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 font-extrabold">Rotating Sponsor:</span>
                <span className="font-mono text-emerald-700">Nike Athletic</span>
              </div>
            </div>

            {/* Rank #3: Bronze */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-orange-500/10 via-white to-white border-2 border-amber-600/50 shadow-premium transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-800 via-orange-700 to-amber-900 text-amber-50 flex items-center justify-center font-black shadow-md">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs border border-amber-400">
                    RANK #3 BRONZE
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900">Game City Finalist</h3>
                  <p className="text-xs text-stone-500 mt-1">3rd Place Podium Award · Athlos Sports Federation</p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-orange-50/90 border border-orange-200 text-stone-900 flex items-center justify-between text-xs font-bold">
                <span className="text-amber-800 font-extrabold">Rotating Sponsor:</span>
                <span className="font-mono text-emerald-700">Puma Sports</span>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* ── FOOTER (CLEAN, MINIMALIST & PROFESSIONAL) ── */}
      <footer className="border-t border-stone-200/80 bg-white/70 backdrop-blur-md py-10 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-200/60">

          {/* Athlos Brand Logo & Mission Statement */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Logo size="md" subtitle="Athletic Honors & Arena" />
            <div className="sm:border-l sm:border-stone-200/80 sm:pl-4">
              <p className="text-xs text-stone-500 max-w-sm">
                Competitive athletics arena · Cryptographically verified credentials, podium honors & sponsor rewards
              </p>
            </div>
          </div>

          {/* Public Verification Action Button */}
          <div className="flex items-center gap-3">
            <Link
              to="/certificates/verify"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 transition-all font-bold text-xs shadow-xs hover:shadow group"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Verify Credential</span>
            </Link>
          </div>
        </div>

        {/* Bottom copyright & legal trust links */}
        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Athlos Arena. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/hall-of-fame" className="hover:text-stone-700 font-bold underline underline-offset-2">
              Hall of Fame
            </Link>
            <span>·</span>
            <Link to="/certificates/verify" className="hover:text-stone-700 underline underline-offset-2">
              Public Verification
            </Link>
            <span>·</span>
            <span className="text-stone-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cryptographically Secured</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}