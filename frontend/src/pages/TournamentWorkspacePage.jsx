import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Award,
  Shield,
  Sparkles,
  Clock,
  Flame,
  Play,
  Check,
  Edit3,
  Copy,
  ExternalLink,
  ChevronRight,
  Crown,
  AlertCircle,
  Save,
  UserPlus,
  Zap,
  RefreshCw,
  Eye,
  CheckSquare,
  Search,
  Filter,
  ShieldCheck,
  Share2,
  Layers
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  getTournamentById,
  updateTournament,
  registerParticipant,
  updateParticipantStatus,
  createMatch,
  updateMatchScore,
  finalizeTournament,
  generateFixtures,
  bulkRegisterParticipants,
  updateTournamentStatus
} from '../api/tournamentsApi';
import { getAllUsers } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Synthetic sample athletes for 1-click demo seeding
const SAMPLE_ATHLETES = [
  { athleteName: 'Indrajeet Patil', email: 'indrajeet@example.com', phone: '+91 98765 43210' },
  { athleteName: 'Marcus Vance', email: 'marcus.v@example.com', phone: '+1 555-0192' },
  { athleteName: 'Sarah Chen', email: 'sarah.c@example.com', phone: '+1 555-0143' },
  { athleteName: 'Elena Rostova', email: 'elena.r@example.com', phone: '+44 20 7946 0912' },
  { athleteName: 'Leo Martinez', email: 'leo.m@example.com', phone: '+34 91 123 4567' },
  { athleteName: 'Aisha Al-Mansoor', email: 'aisha.m@example.com', phone: '+971 4 123 4567' },
  { athleteName: 'David Kim', email: 'david.k@example.com', phone: '+82 2 3456 7890' },
  { athleteName: 'Zoe Dupont', email: 'zoe.d@example.com', phone: '+33 1 42 68 55 00' },
];

export default function TournamentWorkspacePage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'participants' | 'form' | 'podium'
  const [roundFilter, setRoundFilter] = useState('ALL');
  const [searchRoster, setSearchRoster] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  // Action Loading states
  const [seedingAthletes, setSeedingAthletes] = useState(false);
  const [generatingFixtures, setGeneratingFixtures] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [addMatchModalOpen, setAddMatchModalOpen] = useState(false);
  const [viewResponsesModalOpen, setViewResponsesModalOpen] = useState(null);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [finalizeSuccessModalOpen, setFinalizeSuccessModalOpen] = useState(false);

  // Finalize Options
  const [awardCredentials, setAwardCredentials] = useState(true);
  const [awardParticipationCertificates, setAwardParticipationCertificates] = useState(true);

  // New Participant Form
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newAthleteEmail, setNewAthleteEmail] = useState('');
  const [newAthletePhone, setNewAthletePhone] = useState('');
  const [newSelectedUserId, setNewSelectedUserId] = useState('');
  const [newCustomAnswers, setNewCustomAnswers] = useState({});

  // New Match Form
  const [newMatchRound, setNewMatchRound] = useState('Semi-Finals');
  const [newMatchNumber, setNewMatchNumber] = useState(1);
  const [newMatchP1Id, setNewMatchP1Id] = useState('');
  const [newMatchP2Id, setNewMatchP2Id] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('11:00 AM');
  const [newMatchDate, setNewMatchDate] = useState('2026-11-20');
  const [newMatchVenue, setNewMatchVenue] = useState('Track 4');

  // Podium Selection
  const [podium1stId, setPodium1stId] = useState('');
  const [podium2ndId, setPodium2ndId] = useState('');
  const [podium3rdId, setPodium3rdId] = useState('');

  // Editable Form Schema
  const [formQuestions, setFormQuestions] = useState([]);
  const [savingForm, setSavingForm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, uRes] = await Promise.all([
        getTournamentById(tournamentId),
        getAllUsers().catch(() => ({ data: [] })),
      ]);
      const tData = tRes.data;
      setTournament(tData);

      let parsedQuestions = [];
      try {
        parsedQuestions = JSON.parse(tData.customFormSchema || '[]');
      } catch {
        parsedQuestions = [];
      }
      setFormQuestions(parsedQuestions);
      setAllUsers(uRes.data || []);

      // Auto-suggest podium from Grand Final or top participants if not yet set
      const matches = tData.matches || [];
      const grandFinal = matches.find((m) => m.roundName?.toLowerCase().includes('grand final') || m.roundName?.toLowerCase().includes('final'));
      
      if (grandFinal && grandFinal.winnerParticipantId) {
        setPodium1stId(String(grandFinal.winnerParticipantId));
        // Runner up is the other participant
        const runnerUpId = grandFinal.winnerParticipantId === grandFinal.participant1Id
          ? grandFinal.participant2Id
          : grandFinal.participant1Id;
        if (runnerUpId) setPodium2ndId(String(runnerUpId));
      } else if (tData.participants && tData.participants.length >= 2) {
        if (!podium1stId) setPodium1stId(String(tData.participants[0]?.id || ''));
        if (!podium2ndId) setPodium2ndId(String(tData.participants[1]?.id || ''));
        if (!podium3rdId && tData.participants[2]) setPodium3rdId(String(tData.participants[2]?.id || ''));
      }
    } catch (err) {
      console.error('Failed to load tournament:', err);
      showToast('Tournament could not be loaded', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  // Handle Quick Score Update for a Match
  const handleScoreChange = async (matchId, score1, score2, winnerId, status) => {
    try {
      await updateMatchScore(tournamentId, matchId, {
        score1,
        score2,
        winnerParticipantId: winnerId,
        status: status || 'COMPLETED',
      });
      showToast('Match score updated!', 'success');
      
      // Auto-set 1st place podium if this was the Grand Final
      const updatedMatch = (tournament?.matches || []).find((m) => m.id === matchId);
      if (updatedMatch && (updatedMatch.roundName?.toLowerCase().includes('grand final') || updatedMatch.roundName?.toLowerCase().includes('final')) && winnerId) {
        setPodium1stId(String(winnerId));
        const runnerUp = winnerId === updatedMatch.participant1Id ? updatedMatch.participant2Id : updatedMatch.participant1Id;
        if (runnerUp) setPodium2ndId(String(runnerUp));
      }

      loadData();
    } catch (err) {
      showToast('Failed to update score', 'error');
    }
  };

  // ⚡ 1-Click Auto-Generate Fixtures & Brackets
  const handleGenerateFixtures = async () => {
    const participantsCount = tournament?.participants?.length || 0;
    if (participantsCount < 2) {
      showToast('At least 2 registered athletes are required to generate brackets. Use "Quick Seed Athletes" below!', 'error');
      return;
    }

    setGeneratingFixtures(true);
    try {
      await generateFixtures(tournamentId);
      showToast('Tournament bracket and fixtures generated successfully!', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate fixtures', 'error');
    } finally {
      setGeneratingFixtures(false);
    }
  };

  // ⚡ 1-Click Quick Seed Sample Athletes
  const handleQuickSeedAthletes = async () => {
    setSeedingAthletes(true);
    try {
      await bulkRegisterParticipants(tournamentId, SAMPLE_ATHLETES);
      showToast('8 sample athletes registered into the tournament roster!', 'success');
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to seed sample athletes', 'error');
    } finally {
      setSeedingAthletes(false);
    }
  };

  // Save updated Google Form Schema
  const handleSaveFormSchema = async () => {
    setSavingForm(true);
    try {
      await updateTournament(tournamentId, {
        title: tournament.title,
        sport: tournament.sport,
        format: tournament.format,
        customFormSchema: JSON.stringify(formQuestions),
      });
      showToast('Registration form schema saved successfully!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to update form questions', 'error');
    } finally {
      setSavingForm(false);
    }
  };

  // Add question to schema
  const handleAddQuestionToSchema = () => {
    const newField = {
      id: `custom_${Date.now()}`,
      label: 'New Question Title',
      type: 'text',
      required: false,
      placeholder: 'Enter answer...',
    };
    setFormQuestions((prev) => [...prev, newField]);
  };

  // Register single participant manually
  const handleRegisterParticipant = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        userId: newSelectedUserId ? Number(newSelectedUserId) : null,
        athleteName: newAthleteName.trim(),
        email: newAthleteEmail.trim(),
        phone: newAthletePhone.trim(),
        formResponses: JSON.stringify(newCustomAnswers),
      };
      await registerParticipant(tournamentId, payload);
      showToast(`Athlete ${newAthleteName} registered successfully!`, 'success');
      setRegisterModalOpen(false);
      setNewAthleteName('');
      setNewAthleteEmail('');
      setNewAthletePhone('');
      setNewCustomAnswers({});
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    }
  };

  // Create manual Fixture Match
  const handleCreateMatch = async (e) => {
    e.preventDefault();
    try {
      const p1 = tournament.participants.find((p) => String(p.id) === String(newMatchP1Id));
      const p2 = tournament.participants.find((p) => String(p.id) === String(newMatchP2Id));

      await createMatch(tournamentId, {
        roundName: newMatchRound,
        matchNumber: Number(newMatchNumber) || 1,
        participant1: p1 ? { id: p1.id } : null,
        participant2: p2 ? { id: p2.id } : null,
        scheduledDate: newMatchDate,
        scheduledTime: newMatchTime,
        courtVenue: newMatchVenue,
        status: 'UPCOMING',
      });

      showToast('Fixture match scheduled!', 'success');
      setAddMatchModalOpen(false);
      loadData();
    } catch (err) {
      showToast('Failed to schedule match', 'error');
    }
  };

  // Finalize Tournament and Issue Credentials
  const handleFinalizeTournament = async () => {
    setFinalizing(true);
    try {
      await finalizeTournament(tournamentId, {
        winner1stParticipantId: podium1stId ? Number(podium1stId) : null,
        winner2ndParticipantId: podium2ndId ? Number(podium2ndId) : null,
        winner3rdParticipantId: podium3rdId ? Number(podium3rdId) : null,
        awardCredentials,
        awardParticipationCertificates,
      });

      setFinalizeModalOpen(false);
      setFinalizeSuccessModalOpen(true);
      showToast('Tournament finalized & verified credentials issued!', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to finalize tournament', 'error');
    } finally {
      setFinalizing(false);
    }
  };

  // Status Changer
  const handleUpdateStatus = async (newStatus) => {
    try {
      await updateTournamentStatus(tournamentId, newStatus);
      showToast(`Tournament status updated to ${newStatus}`, 'success');
      loadData();
    } catch (err) {
      // Fallback to updateTournament
      try {
        await updateTournament(tournamentId, {
          title: tournament.title,
          sport: tournament.sport,
          format: tournament.format,
          status: newStatus,
        });
        showToast(`Tournament status updated to ${newStatus}`, 'success');
        loadData();
      } catch (err2) {
        showToast('Failed to update status', 'error');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner text="Opening tournament organizer workspace..." className="py-24" />;
  }

  if (!tournament) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4 bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-black text-stone-900">Tournament Not Found</h3>
        <Button variant="dark" onClick={() => navigate('/tournaments')}>
          Return to Tournament Hub
        </Button>
      </div>
    );
  }

  const matches = tournament.matches || [];
  const participants = tournament.participants || [];

  // Round names for filtering
  const roundNames = ['ALL', ...new Set(matches.map((m) => m.roundName).filter(Boolean))];
  const filteredMatches = roundFilter === 'ALL'
    ? matches
    : matches.filter((m) => m.roundName === roundFilter);

  // Search filtered roster
  const filteredParticipants = participants.filter((p) => {
    if (!searchRoster.trim()) return true;
    const term = searchRoster.toLowerCase();
    return (
      p.athleteName?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term)
    );
  });

  // Calculate Lifecycle Stepper Current Step
  let currentWorkflowStep = 1;
  if (tournament.status === 'COMPLETED') {
    currentWorkflowStep = 4;
  } else if (tournament.status === 'LIVE') {
    currentWorkflowStep = 3;
  } else if (matches.length > 0) {
    currentWorkflowStep = 2;
  } else {
    currentWorkflowStep = 1;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">

      {/* ── TOP HERO HEADER & TOURNAMENT METRICS ── */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">

        {/* Breadcrumb & Global Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <Link
              to="/tournaments"
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
              <Link to="/tournaments" className="hover:text-stone-900">Tournaments</Link>
              <span>/</span>
              <span className="text-stone-900 font-black">{tournament.title}</span>
            </div>
          </div>

          {/* Quick Lifecycle Action CTA */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
              tournament.status === 'LIVE'
                ? 'bg-emerald-500/15 text-emerald-900 border-emerald-400/40'
                : tournament.status === 'COMPLETED'
                  ? 'bg-amber-500/15 text-amber-900 border-amber-400/40'
                  : 'bg-stone-100 text-stone-800 border-stone-300'
            }`}>
              {tournament.status === 'LIVE' ? '🔥 LIVE ARENA' : tournament.status === 'COMPLETED' ? '🏆 COMPLETED' : '📝 REGISTRATION OPEN'}
            </span>

            {isInstitution && tournament.status !== 'COMPLETED' && (
              <>
                {tournament.status === 'REGISTRATION_OPEN' && (
                  <Button
                    variant="dark"
                    size="sm"
                    icon={Play}
                    onClick={() => handleUpdateStatus('LIVE')}
                    className="font-bold shadow-xs"
                  >
                    Start Tournament (Go Live)
                  </Button>
                )}
                {tournament.status === 'LIVE' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdateStatus('REGISTRATION_OPEN')}
                    className="font-bold text-xs"
                  >
                    Reopen Registration
                  </Button>
                )}
                <Button
                  variant="gold"
                  size="sm"
                  icon={Trophy}
                  onClick={() => {
                    setActiveTab('podium');
                    setFinalizeModalOpen(true);
                  }}
                  className="font-black shadow-xs hover:scale-105 transition-all"
                >
                  Conclude & Award Credentials
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Title, Discipline Chips & Venue Details */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-900 text-xs font-black uppercase tracking-wider">
                🏆 {tournament.sport}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-xs font-bold text-stone-700">
                {tournament.format}
              </span>
              <span className="text-xs font-bold text-stone-500">
                Organized by <strong className="text-stone-900">{tournament.institutionName}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {tournament.title}
            </h1>

            <div className="flex items-center gap-4 text-xs font-semibold text-stone-600 flex-wrap pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>{tournament.startDate} to {tournament.endDate}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{tournament.venue}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 font-bold text-stone-800">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>{participants.length} / {tournament.maxParticipants} Registered</span>
              </span>
            </div>
          </div>

          {/* Quick Share Links */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/tournaments/${tournament.id}`);
                showToast('Tournament link copied to clipboard!', 'success');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 shadow-2xs transition-all"
              title="Copy Public Tournament Link"
            >
              <Copy className="w-3.5 h-3.5 text-stone-400" />
              <span>Share Tournament</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/tournaments/${tournament.id}/register`);
                showToast('Registration form link copied to clipboard!', 'success');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-black text-amber-900 shadow-2xs transition-all"
              title="Copy Direct Athlete Registration Link"
            >
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>Copy Registration URL</span>
            </button>

            <Link
              to={`/tournaments/${tournament.id}/register`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
              title="Preview Registration Page in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── ORGANIZER LIFECYCLE PROGRESS STEPPER ── */}
        <div className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-stone-50 rounded-2xl border border-stone-200/80">
            
            {/* Step 1: Registration */}
            <button
              type="button"
              onClick={() => setActiveTab('participants')}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                currentWorkflowStep === 1
                  ? 'bg-white shadow-xs border border-amber-400/50 ring-2 ring-amber-400/20'
                  : currentWorkflowStep > 1
                    ? 'bg-white/70 text-stone-800'
                    : 'text-stone-400'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                currentWorkflowStep > 1
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentWorkflowStep === 1
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-200 text-stone-600'
              }`}>
                {currentWorkflowStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-black uppercase text-stone-400">Step 1</span>
                <span className="block text-xs font-bold text-stone-900 truncate">Athlete Roster ({participants.length})</span>
              </div>
            </button>

            {/* Step 2: Bracket Generation */}
            <button
              type="button"
              onClick={() => setActiveTab('matches')}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                currentWorkflowStep === 2
                  ? 'bg-white shadow-xs border border-amber-400/50 ring-2 ring-amber-400/20'
                  : currentWorkflowStep > 2
                    ? 'bg-white/70 text-stone-800'
                    : 'text-stone-400'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                currentWorkflowStep > 2
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentWorkflowStep === 2
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-200 text-stone-600'
              }`}>
                {currentWorkflowStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-black uppercase text-stone-400">Step 2</span>
                <span className="block text-xs font-bold text-stone-900 truncate">Fixtures ({matches.length})</span>
              </div>
            </button>

            {/* Step 3: Live Arena */}
            <button
              type="button"
              onClick={() => setActiveTab('matches')}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                currentWorkflowStep === 3
                  ? 'bg-white shadow-xs border border-emerald-400 ring-2 ring-emerald-400/20'
                  : currentWorkflowStep > 3
                    ? 'bg-white/70 text-stone-800'
                    : 'text-stone-400'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                currentWorkflowStep > 3
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentWorkflowStep === 3
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-stone-200 text-stone-600'
              }`}>
                {currentWorkflowStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-black uppercase text-stone-400">Step 3</span>
                <span className="block text-xs font-bold text-stone-900 truncate">Live Arena & Scores</span>
              </div>
            </button>

            {/* Step 4: Podium & Credentials */}
            <button
              type="button"
              onClick={() => setActiveTab('podium')}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                currentWorkflowStep === 4
                  ? 'bg-white shadow-xs border border-amber-400 ring-2 ring-amber-400/20'
                  : 'text-stone-400'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                currentWorkflowStep === 4
                  ? 'bg-amber-500 text-stone-950 font-black'
                  : 'bg-stone-200 text-stone-600'
              }`}>
                {currentWorkflowStep === 4 ? '🏆' : '4'}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-black uppercase text-stone-400">Step 4</span>
                <span className="block text-xs font-bold text-stone-900 truncate">Podium & Awards</span>
              </div>
            </button>

          </div>
        </div>

      </div>

      {/* ── WORKSPACE TABS NAVIGATION ── */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-stone-200/90 shadow-2xs gap-1 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'matches'
              ? 'bg-stone-900 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Timetable & Live Scores ({matches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('participants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'participants'
              ? 'bg-stone-900 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Athlete Roster ({participants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'form'
              ? 'bg-stone-900 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Registration Form Builder ({formQuestions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('podium')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'podium'
              ? 'bg-stone-900 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>Podium & Credentials</span>
        </button>
      </div>

      {/* ── TAB 1: TIMETABLE, FIXTURES & LIVE ARENA ── */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          
          {/* Action Bar & Round Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {roundNames.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoundFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    roundFilter === r
                      ? 'bg-stone-900 text-white font-black'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {r === 'ALL' ? 'All Matches' : r}
                </button>
              ))}
            </div>

            {isInstitution && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="gold"
                  size="sm"
                  icon={Zap}
                  loading={generatingFixtures}
                  onClick={handleGenerateFixtures}
                  className="font-black shadow-xs hover:scale-105 transition-all"
                  title="Automatically generate tournament brackets from registered athletes"
                >
                  ⚡ 1-Click Generate Brackets
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setAddMatchModalOpen(true)}
                  className="font-bold"
                >
                  Add Fixture
                </Button>
              </div>
            )}
          </div>

          {/* Empty State: Prompt Bracket Generation or Seeding */}
          {matches.length === 0 ? (
            <div className="p-10 sm:p-14 text-center bg-white rounded-3xl border border-dashed border-stone-300 space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                <Zap className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-stone-900">
                  No Fixture Matches Generated Yet
                </h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  Generate instant knockout brackets or sprint heats based on your registered athletes roster with a single click.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {participants.length >= 2 ? (
                  <Button
                    variant="gold"
                    size="md"
                    icon={Zap}
                    loading={generatingFixtures}
                    onClick={handleGenerateFixtures}
                    className="font-black shadow-md hover:scale-105 transition-all"
                  >
                    Generate Brackets from {participants.length} Registered Athletes
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="gold"
                      size="md"
                      icon={Zap}
                      loading={seedingAthletes}
                      onClick={async () => {
                        await handleQuickSeedAthletes();
                        await handleGenerateFixtures();
                      }}
                      className="font-black shadow-md hover:scale-105 transition-all"
                    >
                      ⚡ Quick Seed 8 Athletes & Auto-Build Bracket
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      icon={UserPlus}
                      onClick={() => setRegisterModalOpen(true)}
                      className="font-bold"
                    >
                      Manually Register Athlete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Fixture Matches Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map((m) => {
                const isCompleted = m.status === 'COMPLETED';
                const isLive = m.status === 'LIVE';

                return (
                  <div
                    key={m.id}
                    className={`bg-white rounded-3xl p-5 border transition-all space-y-4 shadow-xs ${
                      isLive
                        ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                        : isCompleted
                          ? 'border-stone-200'
                          : 'border-stone-200/90'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-stone-900">{m.roundName}</span>
                        <span className="text-[10px] font-bold text-stone-400">Match #{m.matchNumber}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isLive
                              ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                              : isCompleted
                                ? 'bg-stone-100 text-stone-700'
                                : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {m.status}
                        </span>

                        {isInstitution && !isCompleted && !isLive && (
                          <button
                            type="button"
                            onClick={() => handleScoreChange(m.id, m.score1, m.score2, m.winnerParticipantId, 'LIVE')}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-colors"
                            title="Mark match as currently LIVE"
                          >
                            Go Live
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Competitor 1 vs Competitor 2 Grid */}
                    <div className="grid grid-cols-5 items-center gap-3">

                      {/* Competitor 1 */}
                      <div className="col-span-2 space-y-2 text-center sm:text-left">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={m.participant1Avatar}
                            name={m.participant1Name || 'TBD'}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-stone-900 block truncate">
                              {m.participant1Name || 'TBD (Seed)'}
                            </span>
                          </div>
                        </div>

                        {/* Score 1 Input */}
                        <input
                          type="text"
                          defaultValue={m.score1 || ''}
                          onBlur={(e) => {
                            if (e.target.value !== m.score1) {
                              handleScoreChange(m.id, e.target.value, m.score2, m.winnerParticipantId, m.status);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                          }}
                          placeholder="Score / Time"
                          className="w-full text-center sm:text-left px-3 py-1.5 text-xs font-bold rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                        />

                        {isInstitution && m.participant1Id && (
                          <button
                            type="button"
                            onClick={() => handleScoreChange(m.id, m.score1, m.score2, m.participant1Id, 'COMPLETED')}
                            className={`w-full py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                              m.winnerParticipantId === m.participant1Id
                                ? 'bg-amber-500 text-stone-950 shadow-xs'
                                : 'bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900'
                            }`}
                          >
                            <Crown className="w-3 h-3" />
                            <span>{m.winnerParticipantId === m.participant1Id ? 'Winner ✓' : 'Declare Win'}</span>
                          </button>
                        )}
                      </div>

                      {/* VS Divider */}
                      <div className="col-span-1 text-center space-y-1">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">
                          VS
                        </span>
                      </div>

                      {/* Competitor 2 */}
                      <div className="col-span-2 space-y-2 text-center sm:text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="min-w-0 flex-1 text-right">
                            <span className="text-xs font-black text-stone-900 block truncate">
                              {m.participant2Name || 'TBD (Seed)'}
                            </span>
                          </div>
                          <Avatar
                            src={m.participant2Avatar}
                            name={m.participant2Name || 'TBD'}
                            size="sm"
                          />
                        </div>

                        {/* Score 2 Input */}
                        <input
                          type="text"
                          defaultValue={m.score2 || ''}
                          onBlur={(e) => {
                            if (e.target.value !== m.score2) {
                              handleScoreChange(m.id, m.score1, e.target.value, m.winnerParticipantId, m.status);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                          }}
                          placeholder="Score / Time"
                          className="w-full text-center sm:text-right px-3 py-1.5 text-xs font-bold rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none transition-all"
                        />

                        {isInstitution && m.participant2Id && (
                          <button
                            type="button"
                            onClick={() => handleScoreChange(m.id, m.score1, m.score2, m.participant2Id, 'COMPLETED')}
                            className={`w-full py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                              m.winnerParticipantId === m.participant2Id
                                ? 'bg-amber-500 text-stone-950 shadow-xs'
                                : 'bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900'
                            }`}
                          >
                            <Crown className="w-3 h-3" />
                            <span>{m.winnerParticipantId === m.participant2Id ? 'Winner ✓' : 'Declare Win'}</span>
                          </button>
                        )}
                      </div>

                    </div>

                    {/* Timetable footer */}
                    <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{m.scheduledTime || 'TBD'} · {m.scheduledDate || tournament.startDate}</span>
                      </span>
                      <span className="truncate max-w-[150px]">
                        📍 {m.courtVenue || tournament.venue}
                      </span>
                    </div>

                    {/* Winner Announcement pill */}
                    {m.winnerName && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span>Match Winner: <strong>{m.winnerName}</strong></span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ATHLETES ROSTER & QUESTIONNAIRE RESPONSES ── */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          
          {/* Metrics & Roster Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search athletes by name or email..."
                  value={searchRoster}
                  onChange={(e) => setSearchRoster(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-amber-500 w-60"
                />
              </div>
              <span className="text-xs font-bold text-stone-500">
                {participants.length} registered
              </span>
            </div>

            {isInstitution && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="gold"
                  size="sm"
                  icon={Zap}
                  loading={seedingAthletes}
                  onClick={handleQuickSeedAthletes}
                  className="font-black shadow-xs hover:scale-105 transition-all"
                  title="Bulk register 8 sample athletes to test tournament flow"
                >
                  ⚡ Seed 8 Sample Athletes
                </Button>

                <Button
                  variant="dark"
                  size="sm"
                  icon={UserPlus}
                  onClick={() => setRegisterModalOpen(true)}
                  className="font-bold"
                >
                  Register Athlete
                </Button>
              </div>
            )}
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
            {participants.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-stone-300 mx-auto" />
                <h4 className="text-base font-bold text-stone-900">No Athletes Registered Yet</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Share the public registration link with athletes, or use 1-click sample seeding to test brackets.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button
                    variant="gold"
                    size="sm"
                    icon={Zap}
                    loading={seedingAthletes}
                    onClick={handleQuickSeedAthletes}
                    className="font-black"
                  >
                    ⚡ Seed 8 Sample Athletes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-black uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Athlete</th>
                      <th className="px-4 py-3.5">Bib / ID</th>
                      <th className="px-4 py-3.5">Contact Details</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Questionnaire Answers</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                    {filteredParticipants.map((p, idx) => {
                      let answers = {};
                      try {
                        answers = JSON.parse(p.formResponses || '{}');
                      } catch {
                        answers = {};
                      }

                      return (
                        <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={p.avatarUrl}
                                name={p.athleteName}
                                size="sm"
                              />
                              <div>
                                <span className="font-black text-stone-900 block">
                                  {p.athleteName}
                                </span>
                                {p.userId ? (
                                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                                    <span>Verified Arena Member</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-stone-400">
                                    Guest Athlete
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 font-mono text-stone-500 font-bold text-[11px]">
                            #ATH-{p.id}
                          </td>

                          <td className="px-4 py-3.5 text-stone-600">
                            <div>{p.email || '—'}</div>
                            <div className="text-[10px] text-stone-400">{p.phone || ''}</div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                              {p.status || 'CONFIRMED'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                              {Object.entries(answers).slice(0, 2).map(([k, v]) => (
                                <span key={k} className="px-2 py-0.5 rounded-md bg-stone-100 text-[10px] font-bold text-stone-700 truncate">
                                  {k}: {String(v)}
                                </span>
                              ))}
                              {Object.keys(answers).length > 2 && (
                                <span className="text-[10px] text-stone-400 font-bold">
                                  +{Object.keys(answers).length - 2} more
                                </span>
                              )}
                              {Object.keys(answers).length === 0 && (
                                <span className="text-[10px] text-stone-400 italic">None</span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-right space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setViewResponsesModalOpen(p)}
                              className="font-bold border-stone-200"
                            >
                              Responses
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: CUSTOM REGISTRATION FORM BUILDER ── */}
      {activeTab === 'form' && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-lg font-black text-stone-900">
                Custom Athlete Registration Form Builder
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Customize the registration questionnaire athletes will fill out when entering this tournament.
              </p>
            </div>

            {isInstitution && (
              <Button
                variant="dark"
                size="sm"
                loading={savingForm}
                icon={Save}
                onClick={handleSaveFormSchema}
                className="font-bold shadow-xs"
              >
                Save Form Questions
              </Button>
            )}
          </div>

          {/* Quick Two-Links Bar: Share Tournament & Registration Form Filling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            {/* Link 1: Tournament Share */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-stone-200">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-black uppercase text-stone-400">
                  1. Tournament Overview URL
                </span>
                <span className="block text-xs font-mono font-bold text-stone-800 truncate">
                  {window.location.origin}/tournaments/{tournament.id}
                </span>
              </div>
              <Button
                size="xs"
                variant="secondary"
                icon={Copy}
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/tournaments/${tournament.id}`);
                  showToast('Tournament overview link copied!', 'success');
                }}
              >
                Copy
              </Button>
            </div>

            {/* Link 2: Registration Form Filling */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-black uppercase text-amber-800">
                  2. Direct Athlete Registration URL
                </span>
                <span className="block text-xs font-mono font-bold text-stone-800 truncate">
                  {window.location.origin}/tournaments/{tournament.id}/register
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="xs"
                  variant="secondary"
                  icon={Copy}
                  onClick={() => {
                    navigator.clipboard?.writeText(`${window.location.origin}/tournaments/${tournament.id}/register`);
                    showToast('Registration form link copied!', 'success');
                  }}
                >
                  Copy
                </Button>
                <Link
                  to={`/tournaments/${tournament.id}/register`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {formQuestions.map((f, i) => (
              <div
                key={f.id || i}
                className="p-4 rounded-2xl bg-[#FCFCFA] border border-stone-200 hover:border-amber-400 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => {
                        const copy = [...formQuestions];
                        copy[i].label = e.target.value;
                        setFormQuestions(copy);
                      }}
                      className="flex-1 font-black text-sm text-stone-900 bg-transparent border-b border-dashed border-stone-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={f.type}
                      onChange={(e) => {
                        const copy = [...formQuestions];
                        copy[i].type = e.target.value;
                        setFormQuestions(copy);
                      }}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox (Yes/No)</option>
                    </select>

                    <label className="flex items-center gap-1 text-xs font-semibold text-stone-600">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => {
                          const copy = [...formQuestions];
                          copy[i].required = e.target.checked;
                          setFormQuestions(copy);
                        }}
                      />
                      <span>Required</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setFormQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 rounded-lg text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {f.type !== 'select' && f.type !== 'checkbox' && (
                  <input
                    type="text"
                    value={f.placeholder || ''}
                    onChange={(e) => {
                      const copy = [...formQuestions];
                      copy[i].placeholder = e.target.value;
                      setFormQuestions(copy);
                    }}
                    placeholder="Placeholder / Hint..."
                    className="w-full text-xs text-stone-500 bg-transparent border-b border-stone-100 pl-8 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={handleAddQuestionToSchema}
            className="w-full py-2.5 border-dashed font-bold"
          >
            + Add Another Custom Questionnaire Field
          </Button>
        </div>
      )}

      {/* ── TAB 4: PODIUM & AWARD CEREMONY ── */}
      {activeTab === 'podium' && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-stone-900">
                Podium & Credential Award Ceremony
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Conclude the tournament to officially issue tamper-proof certificates and verified badges.
              </p>
            </div>

            {tournament.status === 'COMPLETED' ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>ALL CREDENTIALS ISSUED</span>
              </span>
            ) : (
              isInstitution && (
                <Button
                  variant="gold"
                  size="md"
                  icon={Award}
                  onClick={() => setFinalizeModalOpen(true)}
                  className="font-black shadow-md hover:scale-105 transition-all"
                >
                  Conclude Tournament & Award All
                </Button>
              )
            )}
          </div>

          {/* 3D Olympic Podium Display */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-4">

            {/* 2nd Place Silver */}
            <div className="p-5 rounded-3xl bg-stone-50 border border-stone-200 text-center space-y-3 order-2 sm:order-1">
              <div className="w-14 h-14 rounded-2xl bg-stone-200 text-stone-700 flex items-center justify-center mx-auto text-xl font-black shadow-xs">
                🥈
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
                2nd Place
              </span>
              <h4 className="text-base font-black text-stone-900">
                {tournament.winner2ndName || (participants.find((p) => String(p.id) === String(podium2ndId))?.athleteName) || 'TBD - Finalist'}
              </h4>
              <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-600">
                Awards {tournament.linkedBadgeSilverName || 'Silver Medal'} & Certificate
              </div>
            </div>

            {/* 1st Place Gold Champion (Elevated) */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-100/90 to-amber-50 border-2 border-amber-400 text-center space-y-3 order-1 sm:order-2 shadow-md relative">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto text-2xl font-black shadow-sm ring-4 ring-white">
                🥇
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                Tournament Champion
              </span>
              <h4 className="text-lg font-black text-stone-950">
                {tournament.winner1stName || (participants.find((p) => String(p.id) === String(podium1stId))?.athleteName) || 'TBD - Champion'}
              </h4>
              <div className="p-3 rounded-xl bg-white border border-amber-300 text-xs font-black text-amber-900">
                Awards {tournament.linkedBadgeGoldName || 'Gold Medal'} & Official Winner Certificate
              </div>
            </div>

            {/* 3rd Place Bronze */}
            <div className="p-5 rounded-3xl bg-amber-50/40 border border-amber-200/60 text-center space-y-3 order-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center mx-auto text-xl font-black shadow-xs">
                🥉
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800/70 block">
                3rd Place
              </span>
              <h4 className="text-base font-black text-stone-900">
                {tournament.winner3rdName || (participants.find((p) => String(p.id) === String(podium3rdId))?.athleteName) || 'TBD - 3rd Place'}
              </h4>
              <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs font-bold text-stone-600">
                Awards {tournament.linkedBadgeBronzeName || 'Bronze Medal'} & Certificate
              </div>
            </div>

          </div>

          {/* Concluded Summary & Hub Navigation */}
          {tournament.status === 'COMPLETED' && (
            <div className="p-6 rounded-3xl bg-stone-900 text-white space-y-4 shadow-md">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-base font-black">Tournament Credentials Successfully Issued</h3>
                  <p className="text-xs text-stone-400">
                    Badges and tamper-proof certificates have been anchored and deposited into recipients' portfolios.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/certificates"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-black text-xs hover:bg-amber-400 transition-all shadow-xs"
                >
                  <Award className="w-4 h-4" />
                  <span>View in Certificate Hub →</span>
                </Link>

                <Link
                  to={`/tournaments/${tournament.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Public Tournament Page</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── MODAL: VIEW ATHLETE CUSTOM GOOGLE FORM RESPONSES ── */}
      <Modal
        isOpen={!!viewResponsesModalOpen}
        onClose={() => setViewResponsesModalOpen(null)}
        title={`Registration Form Responses: ${viewResponsesModalOpen?.athleteName}`}
        size="md"
      >
        {viewResponsesModalOpen && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <Avatar
                src={viewResponsesModalOpen.avatarUrl}
                name={viewResponsesModalOpen.athleteName}
                size="md"
              />
              <div>
                <h4 className="text-sm font-black text-stone-900">
                  {viewResponsesModalOpen.athleteName}
                </h4>
                <p className="text-xs text-stone-500">
                  {viewResponsesModalOpen.email} · {viewResponsesModalOpen.phone || 'No phone'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                Submitted Questionnaire Answers:
              </span>

              {(() => {
                let parsed = {};
                try {
                  parsed = JSON.parse(viewResponsesModalOpen.formResponses || '{}');
                } catch {
                  parsed = {};
                }

                if (Object.keys(parsed).length === 0) {
                  return <p className="text-xs text-stone-500 italic">No custom fields answered.</p>;
                }

                return (
                  <div className="space-y-2">
                    {Object.entries(parsed).map(([key, val]) => (
                      <div key={key} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-600 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-black text-stone-900">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <Button
                variant="dark"
                size="sm"
                onClick={() => setViewResponsesModalOpen(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: REGISTER PLAYER / ATHLETE (MANUAL ENTRY) ── */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register Player / Athlete"
        size="md"
      >
        <form onSubmit={handleRegisterParticipant} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Link Existing Arena Athlete (Optional)
            </label>
            <select
              value={newSelectedUserId}
              onChange={(e) => {
                const uid = e.target.value;
                setNewSelectedUserId(uid);
                const found = (allUsers || []).find((u) => u && String(u.id) === String(uid));
                if (found) {
                  setNewAthleteName(found.displayName || found.username || '');
                  setNewAthleteEmail(found.email || '');
                }
              }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
            >
              <option value="">-- Manual Athlete Entry (Not Linked) --</option>
              {(allUsers || []).filter(Boolean).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName || u.username || 'User'} (@{u.username || 'user'})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Athlete Full Name"
            placeholder="e.g. Alex Vance"
            value={newAthleteName}
            onChange={(e) => setNewAthleteName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              placeholder="athlete@example.com"
              value={newAthleteEmail}
              onChange={(e) => setNewAthleteEmail(e.target.value)}
            />
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={newAthletePhone}
              onChange={(e) => setNewAthletePhone(e.target.value)}
            />
          </div>

          {formQuestions.length > 0 && (
            <div className="pt-2 border-t border-stone-200 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                Tournament Questionnaire Answers:
              </span>
              {formQuestions.map((q) => (
                <div key={q.id} className="space-y-1">
                  <label className="text-xs font-bold text-stone-800">
                    {q.label} {q.required && <span className="text-rose-500">*</span>}
                  </label>
                  {q.type === 'select' ? (
                    <select
                      value={newCustomAnswers[q.id] || ''}
                      onChange={(e) => setNewCustomAnswers({ ...newCustomAnswers, [q.id]: e.target.value })}
                      required={q.required}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-medium"
                    >
                      <option value="">-- Choose Option --</option>
                      {(q.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : q.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-xs text-stone-700">
                      <input
                        type="checkbox"
                        checked={newCustomAnswers[q.id] === 'true'}
                        onChange={(e) => setNewCustomAnswers({ ...newCustomAnswers, [q.id]: e.target.checked ? 'true' : 'false' })}
                        required={q.required}
                      />
                      <span>{q.placeholder || q.label}</span>
                    </label>
                  ) : (
                    <input
                      type={q.type || 'text'}
                      value={newCustomAnswers[q.id] || ''}
                      onChange={(e) => setNewCustomAnswers({ ...newCustomAnswers, [q.id]: e.target.value })}
                      placeholder={q.placeholder}
                      required={q.required}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-medium"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRegisterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="dark"
              size="sm"
              className="font-bold"
            >
              Confirm Registration
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: SCHEDULE NEW FIXTURE MATCH ── */}
      <Modal
        isOpen={addMatchModalOpen}
        onClose={() => setAddMatchModalOpen(false)}
        title="Schedule New Fixture Match"
        size="md"
      >
        <form onSubmit={handleCreateMatch} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Round Name</label>
              <select
                value={newMatchRound}
                onChange={(e) => setNewMatchRound(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
              >
                <option value="Round 1">Round 1 / Heats</option>
                <option value="Quarter-Finals">Quarter-Finals</option>
                <option value="Semi-Finals">Semi-Finals</option>
                <option value="Grand Final">Grand Final / Championship</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Match #</label>
              <input
                type="number"
                value={newMatchNumber}
                onChange={(e) => setNewMatchNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Competitor 1</label>
              <select
                value={newMatchP1Id}
                onChange={(e) => setNewMatchP1Id(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
              >
                <option value="">-- Select Athlete 1 --</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>{p.athleteName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Competitor 2</label>
              <select
                value={newMatchP2Id}
                onChange={(e) => setNewMatchP2Id(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
              >
                <option value="">-- Select Athlete 2 --</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>{p.athleteName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Date"
              type="date"
              value={newMatchDate}
              onChange={(e) => setNewMatchDate(e.target.value)}
            />
            <Input
              label="Time"
              value={newMatchTime}
              onChange={(e) => setNewMatchTime(e.target.value)}
            />
            <Input
              label="Court / Track"
              value={newMatchVenue}
              onChange={(e) => setNewMatchVenue(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAddMatchModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="dark"
              size="sm"
              className="font-bold"
            >
              Schedule Fixture
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: FINALIZE TOURNAMENT & 1-CLICK ISSUE CREDENTIALS ── */}
      <Modal
        isOpen={finalizeModalOpen}
        onClose={() => setFinalizeModalOpen(false)}
        title="Conclude Tournament & Award Verified Credentials"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1 text-xs">
            <p className="font-black text-amber-950 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-700" />
              <span>Automated Credential Issuance</span>
            </p>
            <p className="text-stone-600">
              Confirm podium winners below to automatically mint and anchor official digital certificates and achievement badges.
            </p>
          </div>

          {/* 1st Place Champion */}
          <div className="space-y-1">
            <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <span>🥇 1st Place Gold Medalist</span>
            </label>
            <select
              value={podium1stId}
              onChange={(e) => setPodium1stId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-amber-400 bg-amber-50/50"
            >
              <option value="">-- Choose 1st Place Winner --</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.athleteName}</option>
              ))}
            </select>
          </div>

          {/* 2nd Place Silver */}
          <div className="space-y-1">
            <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <span>🥈 2nd Place Silver Medalist</span>
            </label>
            <select
              value={podium2ndId}
              onChange={(e) => setPodium2ndId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-stone-50/50"
            >
              <option value="">-- Choose 2nd Place Finalist --</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.athleteName}</option>
              ))}
            </select>
          </div>

          {/* 3rd Place Bronze */}
          <div className="space-y-1">
            <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <span>🥉 3rd Place Bronze Medalist</span>
            </label>
            <select
              value={podium3rdId}
              onChange={(e) => setPodium3rdId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-amber-200 bg-amber-50/20"
            >
              <option value="">-- Choose 3rd Place Finisher --</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.athleteName}</option>
              ))}
            </select>
          </div>

          {/* Credential Options Checkboxes */}
          <div className="pt-2 border-t border-stone-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
              <input
                type="checkbox"
                checked={awardCredentials}
                onChange={(e) => setAwardCredentials(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span>Award Gold, Silver & Bronze Badges and Winner Certificates</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
              <input
                type="checkbox"
                checked={awardParticipationCertificates}
                onChange={(e) => setAwardParticipationCertificates(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span>Award Official Participation Certificates to all other competitors</span>
            </label>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFinalizeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="gold"
              size="sm"
              loading={finalizing}
              onClick={handleFinalizeTournament}
              className="font-black shadow-md"
            >
              Confirm & Issue All Credentials →
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: POST-FINALIZE CELEBRATION MODAL ── */}
      <Modal
        isOpen={finalizeSuccessModalOpen}
        onClose={() => setFinalizeSuccessModalOpen(false)}
        title="Tournament Concluded & Credentials Issued"
        size="md"
      >
        <div className="text-center space-y-5 py-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto text-3xl font-black shadow-md ring-4 ring-amber-100">
            🏆
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-stone-900">
              Credentials Anchored & Delivered!
            </h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
              Official digital certificates and achievement badges have been generated and deposited into the recipient athletes' verified portfolios.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-600">🥇 Gold Champion:</span>
              <span className="font-black text-stone-900">
                {participants.find((p) => String(p.id) === String(podium1stId))?.athleteName || 'Winner'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-600">🥈 Silver Finalist:</span>
              <span className="font-black text-stone-900">
                {participants.find((p) => String(p.id) === String(podium2ndId))?.athleteName || 'Finalist'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-600">🥉 Bronze Podium:</span>
              <span className="font-black text-stone-900">
                {participants.find((p) => String(p.id) === String(podium3rdId))?.athleteName || 'Podium'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="gold"
              onClick={() => {
                setFinalizeSuccessModalOpen(false);
                navigate('/certificates');
              }}
              className="w-full sm:w-auto font-black shadow-md"
            >
              View in Certificate Hub →
            </Button>
            <Button
              variant="dark"
              onClick={() => {
                setFinalizeSuccessModalOpen(false);
                navigate(`/tournaments/${tournament.id}`);
              }}
              className="w-full sm:w-auto font-bold"
            >
              View Public Tournament
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
