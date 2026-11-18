import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Award,
  Shield,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Search,
  ExternalLink,
  Calendar,
  User,
  Users,
  GraduationCap,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getAllBadges, getAllAwardedBadges } from '../api/badgesApi';
import { getAllUsers } from '../api/usersApi';
import { getAllTournaments } from '../api/tournamentsApi';
import { formatDate } from '../utils/formatters';

export default function HallOfFamePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'gold', 'silver', 'bronze', 'mentors', 'tournaments'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [badges, setBadges] = useState([]);
  const [awardedBadges, setAwardedBadges] = useState([]);
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAllBadges().catch(() => ({ data: [] })),
      getAllAwardedBadges().catch(() => ({ data: [] })),
      getAllUsers().catch(() => ({ data: [] })),
      getAllTournaments().catch(() => ({ data: [] })),
    ])
      .then(([badgesRes, awardedRes, usersRes, tourRes]) => {
        setBadges(badgesRes.data || []);
        setAwardedBadges(awardedRes.data || []);
        setUsers(usersRes.data || []);
        setTournaments(tourRes.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter applauded mentors (users who have been credited by at least 1 student)
  const masterMentors = (users || []).filter((u) => u && ((u.applaudedByCount || 0) > 0 || (u.applaudedBy && u.applaudedBy.length > 0)));

  // Filter podium champions (athletes with awarded badges)
  const filteredAwarded = awardedBadges.filter((item) => {
    const badge = item.badge || {};
    const rank = badge.rank;
    const q = searchQuery.toLowerCase().trim();

    // Tab filter
    if (activeTab === 'gold' && rank !== 1) return false;
    if (activeTab === 'silver' && rank !== 2) return false;
    if (activeTab === 'bronze' && rank !== 3) return false;

    // Search query filter
    if (q) {
      const matchName = (item.userDisplayName || item.username || '').toLowerCase().includes(q);
      const matchBadge = (badge.name || '').toLowerCase().includes(q);
      const matchCategory = (badge.category || '').toLowerCase().includes(q);
      const matchInst = (item.awardedByInstitutionName || '').toLowerCase().includes(q);
      if (!matchName && !matchBadge && !matchCategory && !matchInst) return false;
    }

    return true;
  });

  // Top overall podium athletes for hero spotlight
  const goldChampion = awardedBadges.find((a) => a.badge?.rank === 1);
  const silverChampion = awardedBadges.find((a) => a.badge?.rank === 2);
  const bronzeChampion = awardedBadges.find((a) => a.badge?.rank === 3);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* ── 1. HALL OF FAME HERO HEADER ── */}
      <div className="bg-white border border-stone-200/90 rounded-3xl overflow-hidden shadow-xs relative">
        <div className="h-44 sm:h-52 bg-gradient-to-r from-amber-100/90 via-amber-50 to-stone-100 border-b border-stone-200/90 p-6 flex flex-col justify-end relative overflow-hidden">
          {/* Subtle athletic pattern overlay */}
          <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:20px_20px]" />
          
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 text-amber-900 border border-amber-300 text-xs font-black shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Athlos Grand Pantheon</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Hall of Fame
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 font-medium max-w-2xl leading-relaxed">
              Celebrating verified champions, national record holders, and master mentors in the Game City Arena. Every medal and accreditation is cryptographically verified and permanently recorded.
            </p>
          </div>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="p-4 sm:p-6 bg-white border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Honors', icon: Sparkles },
              { id: 'gold', label: '🥇 Gold Podium', icon: Trophy },
              { id: 'silver', label: '🥈 Silver Medalists', icon: Award },
              { id: 'bronze', label: '🥉 Bronze Medalists', icon: Shield },
              { id: 'mentors', label: '👏 Master Mentors', icon: GraduationCap },
              { id: 'tournaments', label: '🏆 Tournaments', icon: Flame },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search athlete, badge, sport..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Summoning the Hall of Fame records..." className="py-24" />
      ) : (
        <>
          {/* ── 2. PODIUM SPOTLIGHT SHOWCASE (GOLD, SILVER, BRONZE) ── */}
          {(activeTab === 'all' || activeTab === 'gold' || activeTab === 'silver' || activeTab === 'bronze') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                    <span>Podium Honors Showcase</span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      Tier 1 Champions
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500 font-medium">
                    The highest athletic honors awarded by certified academies and sports federations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                
                {/* 🥈 Silver Podium Card */}
                {silverChampion ? (
                  <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-stone-400 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-stone-200/50 to-transparent rounded-bl-full pointer-events-none" />
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-300 text-xs font-black flex items-center gap-1.5 shadow-2xs">
                          🥈 Rank 2 • Silver
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-stone-500" />
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <Avatar
                          src={silverChampion.userAvatarUrl}
                          name={silverChampion.userDisplayName || silverChampion.username}
                          size="lg"
                          className="ring-2 ring-stone-300 shadow-xs"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/profile/${silverChampion.userId}`}
                            className="text-sm font-black text-stone-900 hover:text-amber-700 transition-colors truncate block"
                          >
                            {silverChampion.userDisplayName || silverChampion.username}
                          </Link>
                          <p className="text-xs font-semibold text-stone-500">
                            @{silverChampion.username}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 mb-4">
                        <div className="text-xs font-black text-stone-900">
                          {silverChampion.badge?.name || 'Silver Medalist Badge'}
                        </div>
                        <div className="text-[11px] font-bold text-stone-500 mt-0.5">
                          {silverChampion.badge?.category || 'Championship Series'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                      <span>Awarded by {silverChampion.awardedByInstitutionName || 'Athlos Academy'}</span>
                      <Link to={`/profile/${silverChampion.userId}`} className="text-stone-900 font-bold hover:underline flex items-center gap-0.5">
                        Profile <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ) : null}

                {/* 🥇 Gold Grand Champion Card (Elevated & Prominent) */}
                {goldChampion ? (
                  <div className="bg-gradient-to-b from-amber-50/80 via-white to-white border-2 border-amber-400/90 rounded-3xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all md:-translate-y-2">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/60 to-transparent rounded-bl-full pointer-events-none" />
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black flex items-center gap-1.5 shadow-xs">
                          🥇 Rank 1 • Gold Champion
                        </span>
                        <Sparkles className="w-4 h-4 text-amber-600" />
                      </div>

                      <div className="flex items-center gap-3.5 mb-4">
                        <Avatar
                          src={goldChampion.userAvatarUrl}
                          name={goldChampion.userDisplayName || goldChampion.username}
                          size="xl"
                          className="ring-4 ring-amber-300 shadow-md"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/profile/${goldChampion.userId}`}
                            className="text-base font-black text-stone-900 hover:text-amber-800 transition-colors truncate block"
                          >
                            {goldChampion.userDisplayName || goldChampion.username}
                          </Link>
                          <p className="text-xs font-bold text-amber-800">
                            @{goldChampion.username}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Grand Champion
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-300/80 mb-4">
                        <div className="text-sm font-black text-stone-900">
                          {goldChampion.badge?.name || 'Gold Medal Championship Badge'}
                        </div>
                        <div className="text-xs font-bold text-amber-800 mt-0.5">
                          {goldChampion.badge?.category || 'Athletics & Track'}
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1 font-medium leading-relaxed">
                          {goldChampion.badge?.description || 'Premier gold honors awarded to top podium competitor.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-stone-600 font-medium">
                      <span>Awarded by <strong className="text-stone-900">{goldChampion.awardedByInstitutionName || 'Athlos Academy'}</strong></span>
                      <Link to={`/profile/${goldChampion.userId}`} className="text-amber-900 font-extrabold hover:underline flex items-center gap-0.5">
                        View Profile <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : null}

                {/* 🥉 Bronze Podium Card */}
                {bronzeChampion ? (
                  <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-amber-700/40 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-700/10 to-transparent rounded-bl-full pointer-events-none" />
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-1 rounded-full bg-amber-900/10 text-amber-900 border border-amber-900/20 text-xs font-black flex items-center gap-1.5 shadow-2xs">
                          🥉 Rank 3 • Bronze
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-amber-800" />
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <Avatar
                          src={bronzeChampion.userAvatarUrl}
                          name={bronzeChampion.userDisplayName || bronzeChampion.username}
                          size="lg"
                          className="ring-2 ring-amber-700/30 shadow-xs"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/profile/${bronzeChampion.userId}`}
                            className="text-sm font-black text-stone-900 hover:text-amber-700 transition-colors truncate block"
                          >
                            {bronzeChampion.userDisplayName || bronzeChampion.username}
                          </Link>
                          <p className="text-xs font-semibold text-stone-500">
                            @{bronzeChampion.username}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 mb-4">
                        <div className="text-xs font-black text-stone-900">
                          {bronzeChampion.badge?.name || 'Bronze Medalist Badge'}
                        </div>
                        <div className="text-[11px] font-bold text-stone-500 mt-0.5">
                          {bronzeChampion.badge?.category || 'Championship Series'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                      <span>Awarded by {bronzeChampion.awardedByInstitutionName || 'Athlos Academy'}</span>
                      <Link to={`/profile/${bronzeChampion.userId}`} className="text-stone-900 font-bold hover:underline flex items-center gap-0.5">
                        Profile <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : null}

              </div>
            </div>
          )}

          {/* ── 3. OFFICIAL AWARDED BADGES LEDGER ── */}
          {(activeTab === 'all' || activeTab === 'gold' || activeTab === 'silver' || activeTab === 'bronze') && (
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-800 border border-amber-300 flex items-center justify-center font-black">
                    <Award className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900 tracking-tight">
                      Official Competition Badges Ledger ({filteredAwarded.length})
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">
                      Cryptographically verified medals issued directly to competitor profiles.
                    </p>
                  </div>
                </div>
              </div>

              {filteredAwarded.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500 italic">
                  No verified badge awards matching your active filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredAwarded.map((item) => {
                    const rank = item.badge?.rank || 1;
                    const rankBadgeColor =
                      rank === 1
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : rank === 2
                        ? 'bg-stone-200 text-stone-800 border-stone-300'
                        : 'bg-amber-900/10 text-amber-900 border-amber-900/20';

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-stone-50 hover:bg-amber-50/40 border border-stone-200/90 hover:border-amber-300 transition-all flex flex-col justify-between shadow-2xs group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${rankBadgeColor}`}>
                              {rank === 1 ? '🥇 Gold' : rank === 2 ? '🥈 Silver' : '🥉 Bronze'} • Rank {rank}
                            </span>
                            <span className="text-[10px] font-bold text-stone-400">
                              {formatDate(item.awardedAt)}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-stone-900 group-hover:text-amber-900 transition-colors">
                              {item.badge?.name}
                            </h4>
                            <p className="text-[11px] font-semibold text-stone-500">
                              {item.badge?.category || 'Arena Championship'}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-stone-200/60 flex items-center gap-2.5">
                            <Avatar
                              src={item.userAvatarUrl}
                              name={item.userDisplayName || item.username}
                              size="sm"
                              className="ring-1 ring-white"
                            />
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/profile/${item.userId}`}
                                className="text-xs font-bold text-stone-900 hover:text-amber-700 truncate block"
                              >
                                {item.userDisplayName || item.username}
                              </Link>
                              <p className="text-[10px] font-medium text-stone-500 truncate">
                                @{item.username}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2.5 mt-3 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500">
                          <span className="truncate">By {item.awardedByInstitutionName || 'Athlos Sports'}</span>
                          <Link
                            to={`/profile/${item.userId}`}
                            className="font-bold text-amber-800 hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            Inspect <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 4. MASTER COACHES & DISTINGUISHED MENTORS ── */}
          {(activeTab === 'all' || activeTab === 'mentors') && (
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-800 border border-amber-300 flex items-center justify-center font-black">
                    <GraduationCap className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
                      Master Coaches & Mentors ({masterMentors.length})
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Applauded Mentors
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">
                      Educators, tacticians, and performance coaches officially credited by their athletes.
                    </p>
                  </div>
                </div>
              </div>

              {masterMentors.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500 italic">
                  No coaches have received student credits yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {masterMentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      className="p-4 rounded-2xl bg-stone-50 hover:bg-amber-50/50 border border-stone-200/90 hover:border-amber-300 transition-all flex flex-col justify-between shadow-2xs group"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar
                            src={mentor?.avatarUrl}
                            name={mentor?.displayName || mentor?.username || 'Mentor'}
                            size="md"
                            className="ring-2 ring-white shadow-xs"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/profile/${mentor?.id}`}
                              className="text-xs font-black text-stone-900 group-hover:text-amber-800 transition-colors truncate block"
                            >
                              {mentor?.displayName || mentor?.username || 'Mentor'}
                            </Link>
                            <p className="text-[11px] font-semibold text-stone-500">
                              @{mentor?.username}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                            👏 Applauded by {mentor.applaudedByCount || mentor.applaudedBy?.length || 0} Athlete{mentor.applaudedByCount === 1 ? '' : 's'}
                          </span>
                          {mentor.bio && (
                            <p className="text-[11px] text-stone-600 font-medium line-clamp-2 leading-relaxed">
                              {mentor.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500 font-medium">Accredited Mentor</span>
                        <Link
                          to={`/profile/${mentor.id}`}
                          className="font-bold text-stone-900 hover:text-amber-800 flex items-center gap-0.5"
                        >
                          View Profile <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 5. FLAGSHIP TOURNAMENTS & CHAMPIONSHIPS ── */}
          {(activeTab === 'all' || activeTab === 'tournaments') && (
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-800 border border-amber-300 flex items-center justify-center font-black">
                    <Trophy className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900 tracking-tight">
                      Flagship Championships & Tournaments ({tournaments.length})
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">
                      Arena competitions awarding official badges and tamper-proof certificates.
                    </p>
                  </div>
                </div>
              </div>

              {tournaments.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500 italic">
                  No championship tournaments recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournaments.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 rounded-2xl bg-stone-50 hover:bg-amber-50/40 border border-stone-200/90 hover:border-amber-300 transition-all flex flex-col justify-between shadow-2xs group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
                            {t.status || 'Active Championship'}
                          </span>
                          <span className="text-xs font-bold text-stone-500">
                            {t.sportCategory || 'Track & Field'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-stone-900 group-hover:text-amber-900 transition-colors">
                            {t.title}
                          </h4>
                          <p className="text-xs text-stone-600 font-medium line-clamp-2 mt-1 leading-relaxed">
                            {t.description}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-stone-200/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-stone-600 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>{t.startDate ? formatDate(t.startDate) : 'Championship Arena'}</span>
                          </div>
                          <span className="font-bold text-stone-900">
                            {t.venueCity || 'Game City'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 mt-4 border-t border-stone-200/60 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-stone-500">
                          Organized by {t.institutionName || 'Athlos Sports Academy'}
                        </span>
                        <Link
                          to={`/tournaments/${t.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          <span>Workspace</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </>
      )}

    </div>
  );
}
