import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Trophy, 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Shield, 
  Award, 
  ArrowRight, 
  Search, 
  Filter, 
  CheckCircle2, 
  Flame, 
  Clock, 
  Zap, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Gamepad2,
  GraduationCap,
  Palette,
  Briefcase
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { getAllTournaments } from '../api/tournamentsApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Helper to format clean human dates (e.g. "Nov 20 – 22, 2026")
const formatDateRange = (start, end) => {
  if (!start && !end) return 'Date TBD';
  if (!end || start === end) {
    try {
      const d = new Date(start);
      return isNaN(d) ? start : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return start;
    }
  }
  try {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e)) return `${start} – ${end}`;
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.getDate()}, ${e.getFullYear()}`;
    }
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } catch {
    return `${start} – ${end}`;
  }
};

const getSportEmoji = (sport, category) => {
  if (category === 'ESPORTS') return '🎮';
  if (category === 'ACADEMICS') return '🎓';
  if (category === 'ARTS') return '🎭';
  if (category === 'CORPORATE') return '💼';
  if (!sport) return '🏆';
  const s = sport.toLowerCase();
  if (s.includes('track') || s.includes('athletic') || s.includes('run')) return '🏃';
  if (s.includes('swim')) return '🏊';
  if (s.includes('badminton')) return '🏸';
  if (s.includes('tennis')) return '🎾';
  if (s.includes('chess')) return '♟️';
  if (s.includes('football') || s.includes('soccer')) return '⚽';
  if (s.includes('basketball')) return '🏀';
  if (s.includes('martial') || s.includes('karate') || s.includes('judo')) return '🥋';
  if (s.includes('esport') || s.includes('gaming')) return '🎮';
  return '🏆';
};

export default function TournamentsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const res = await getAllTournaments();
      setTournaments(res.data || []);
    } catch (err) {
      console.warn('Tournaments load notice:', err.message);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const filteredTournaments = tournaments.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && (t.category || 'SPORTS') !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.title || '').toLowerCase().includes(q) ||
      (t.sport || '').toLowerCase().includes(q) ||
      (t.venue || '').toLowerCase().includes(q) ||
      (t.institutionName || '').toLowerCase().includes(q)
    );
  });

  const liveCount = tournaments.filter((t) => t.status === 'LIVE').length;
  const regOpenCount = tournaments.filter((t) => t.status === 'REGISTRATION_OPEN').length;
  const completedCount = tournaments.filter((t) => t.status === 'COMPLETED').length;
  const totalAthletes = tournaments.reduce((acc, t) => acc + (t.participantCount || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE NOW</span>
          </span>
        );
      case 'REGISTRATION_OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Open</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-stone-500" />
            <span>Ended</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      
      {/* ── 1. HEADER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-600" />
            <span>Tournaments & Competitions</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
            Official tournaments across sports, esports, academics and creative championships.
          </p>
        </div>

        {isInstitution && (
          <Button
            variant="gold"
            size="md"
            icon={Plus}
            onClick={() => navigate('/tournaments/create')}
            className="shadow-sm hover:scale-105 font-bold"
          >
            Organize a Tournament
          </Button>
        )}
      </div>

      {/* ── 2. METRICS DASHBOARD SUMMARY ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Total Competitions */}
        <Card className="p-4 bg-white border border-stone-200/90 rounded-2xl shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 flex items-center justify-center font-black">
            <Trophy className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900 leading-none">
              {tournaments.length}
            </div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mt-1">
              Competitions
            </div>
          </div>
        </Card>

        {/* Metric 2: Live / In Progress */}
        <Card className="p-4 bg-white border border-stone-200/90 rounded-2xl shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 flex items-center justify-center font-black">
            <Flame className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900 leading-none">
              {liveCount}
            </div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mt-1">
              Live Arena
            </div>
          </div>
        </Card>

        {/* Metric 3: Registration Open */}
        <Card className="p-4 bg-white border border-stone-200/90 rounded-2xl shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-800 flex items-center justify-center font-black">
            <Clock className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900 leading-none">
              {regOpenCount}
            </div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mt-1">
              Open Registration
            </div>
          </div>
        </Card>

        {/* Metric 4: Registered Athletes */}
        <Card className="p-4 bg-white border border-stone-200/90 rounded-2xl shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-800 flex items-center justify-center font-black">
            <Users className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900 leading-none">
              {totalAthletes}
            </div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mt-1">
              Competitor Roster
            </div>
          </div>
        </Card>

      </div>

      {/* ── 3. CATEGORY PILLS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { key: 'ALL', label: 'All Disciplines', emoji: '🏆' },
          { key: 'SPORTS', label: 'Sports & Athletics', emoji: '🏃' },
          { key: 'ESPORTS', label: 'Esports & Gaming', emoji: '🎮' },
          { key: 'ACADEMICS', label: 'Academics & Debates', emoji: '🎓' },
          { key: 'ARTS', label: 'Arts & Cultural', emoji: '🎭' },
          { key: 'CORPORATE', label: 'Corporate & Other', emoji: '💼' },
        ].map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              categoryFilter === cat.key
                ? 'bg-stone-900 text-white font-black shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* ── 4. FILTER & SEARCH TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs">
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <SearchBar
            placeholder="Search tournament, discipline, venue, or host..."
            value={searchQuery}
            onSearch={(q) => setSearchQuery(q)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold border border-stone-200 overflow-x-auto">
          {[
            { key: 'ALL', label: 'All Status' },
            { key: 'LIVE', label: 'Live' },
            { key: 'REGISTRATION_OPEN', label: 'Registering' },
            { key: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-white text-stone-900 shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* ── 5. TOURNAMENT LIST ── */}
      {loading ? (
        <LoadingSpinner text="Loading tournaments and active fixtures..." className="py-20" />
      ) : filteredTournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No Competitions Found"
          description={
            statusFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'No competitions matched your selected category and status filters.'
              : 'There are currently no active tournaments. Certified institutions can organize and launch a new tournament.'
          }
          action={
            isInstitution ? (
              <Button
                variant="gold"
                size="md"
                icon={Plus}
                onClick={() => navigate('/tournaments/create')}
                className="font-bold shadow-md"
              >
                Organize First Tournament
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTournaments.map((t) => {
            const participantPct = Math.min(
              100,
              Math.round(((t.participantCount || 0) / (t.maxParticipants || 16)) * 100)
            );
            const isTeam = t.competitionType === 'TEAM';

            return (
              <div
                key={t.id}
                onClick={() => navigate(`/tournaments/${t.id}`)}
                className="bg-white border border-stone-200/90 hover:border-amber-400 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                {/* Top Row: Discipline & Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 text-xs font-black">
                      <span>{getSportEmoji(t.sport, t.category)}</span>
                      <span>{t.sport}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-stone-400">
                      · {isTeam ? 'Team Squads' : 'Individual Solo'}
                    </span>
                    {t.format && (
                      <span className="text-[11px] font-semibold text-stone-400">
                        · {t.format}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(t.status)}
                </div>

                {/* Main: Title & Organizer */}
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-stone-900 group-hover:text-amber-800 transition-colors leading-snug line-clamp-1">
                    {t.title}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Hosted by <span className="text-stone-800 font-semibold">{t.institutionName}</span>
                  </p>
                </div>

                {/* Metadata Strip: Date & Venue */}
                <div className="flex items-center gap-3 text-xs text-stone-500 font-medium flex-wrap">
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{formatDateRange(t.startDate, t.endDate)}</span>
                  </span>
                  {t.venue && (
                    <>
                      <span className="text-stone-300">·</span>
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{t.venue}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Bottom Row: Capacity Progress & Linked Awards */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3 text-xs">
                  {/* Clean Capacity Bar */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200/50">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${participantPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-stone-600">
                      {t.participantCount || 0} / {t.maxParticipants || 16} {isTeam ? 'teams' : 'athletes'}
                    </span>
                  </div>

                  {/* Awards / Arrow */}
                  <div className="flex items-center gap-2">
                    {t.credentialsEnabled && t.linkedBadgeGoldName && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 max-w-[140px] truncate">
                        <Award className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">{t.linkedBadgeGoldName}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-black text-stone-700 group-hover:text-amber-800 group-hover:translate-x-0.5 transition-all">
                      <span>Enter</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
