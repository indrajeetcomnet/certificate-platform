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
  Sparkles
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { getAllTournaments } from '../api/tournamentsApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function TournamentsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, LIVE, REGISTRATION_OPEN, COMPLETED

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-black tracking-wide shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE NOW</span>
          </span>
        );
      case 'REGISTRATION_OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-black tracking-wide shadow-2xs">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>REGISTRATION OPEN</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 border border-stone-300 text-xs font-black tracking-wide shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-stone-600" />
            <span>COMPLETED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* ── 1. HEADER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-600" />
            <span>Tournaments</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
            Active competitions, fixtures & verified honors.
          </p>
        </div>

        {isInstitution && (
          <Button
            variant="gold"
            size="md"
            icon={Plus}
            onClick={() => navigate('/tournaments/create')}
            className="shadow-md hover:scale-105 font-bold"
          >
            Organize a Tournament
          </Button>
        )}
      </div>

      {/* ── 2. METRICS DASHBOARD SUMMARY ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Total Competitions */}
        <Card className="p-4 bg-white border border-stone-200/90 rounded-2xl shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 flex items-center justify-center font-black">
            <Trophy className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900 leading-none">
              {tournaments.length}
            </div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mt-1">
              Tournaments
            </div>
          </div>
        </Card>

        {/* Metric 2: Live / In Progress */}
        <Card className="p-4 bg-white border border-stone-200/90 rounded-2xl shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 flex items-center justify-center font-black">
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
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-800 flex items-center justify-center font-black">
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
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-800 flex items-center justify-center font-black">
            <Users className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900 leading-none">
              {totalAthletes}
            </div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mt-1">
              Athletes Roster
            </div>
          </div>
        </Card>

      </div>

      {/* ── 3. FILTER & SEARCH TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs">
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <SearchBar
            placeholder="Search tournament, sport, venue, or academy..."
            value={searchQuery}
            onSearch={(q) => setSearchQuery(q)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold border border-stone-200 overflow-x-auto">
          {[
            { key: 'ALL', label: 'All Tournaments' },
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

      {/* ── 4. TOURNAMENT LIST ── */}
      {loading ? (
        <LoadingSpinner text="Loading tournaments and active fixtures..." className="py-20" />
      ) : filteredTournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No Tournaments Found"
          description={
            statusFilter !== 'ALL'
              ? `No competitions currently matched with status '${statusFilter}'.`
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTournaments.map((t) => {
            const participantPct = Math.min(
              100,
              Math.round(((t.participantCount || 0) / (t.maxParticipants || 16)) * 100)
            );

            return (
              <div
                key={t.id}
                className="bg-white border border-stone-200/90 hover:border-amber-400 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Top Row: Sport pill & Status badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 text-xs font-black tracking-wide uppercase">
                      🏃 {t.sport}
                    </span>
                    {getStatusBadge(t.status)}
                  </div>

                  {/* Title & Organization */}
                  <h3 className="text-xl font-black text-stone-900 tracking-tight group-hover:text-amber-950 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs font-bold text-amber-800 mt-1">
                    Hosted by {t.institutionName}
                  </p>
                  
                  {t.description && (
                    <p className="text-xs text-stone-600 font-medium mt-2 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Details & Metadata Grid */}
                <div className="space-y-3 pt-3 border-t border-stone-100">
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-stone-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{t.startDate || 'TBD'} to {t.endDate || 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{t.venue || 'Main Athletic Arena'}</span>
                    </div>
                  </div>

                  {/* Participant Capacity Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-stone-400" />
                        <span>Registered Athletes: {t.participantCount || 0} / {t.maxParticipants || 16}</span>
                      </span>
                      <span>{participantPct}% Full</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60">
                      <div
                        className={`h-full transition-all duration-500 ${
                          participantPct >= 90 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-amber-600'
                        }`}
                        style={{ width: `${participantPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Linked Badges & Credentials Ribbon */}
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-stone-700 font-bold truncate">
                      <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">
                        {t.linkedBadgeGoldName ? `Awards ${t.linkedBadgeGoldName}` : 'Accredited Credentials Linked'}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 shrink-0">
                      Verified
                    </span>
                  </div>

                </div>

                {/* Footer Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <Button
                    variant="dark"
                    size="sm"
                    icon={ChevronRight}
                    iconPosition="right"
                    onClick={() => navigate(`/tournaments/${t.id}`)}
                    className="w-full font-bold shadow-xs justify-center"
                  >
                    Open Tournament Hub
                  </Button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
