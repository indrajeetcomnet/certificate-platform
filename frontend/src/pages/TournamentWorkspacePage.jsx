import React, { useState, useEffect } from 'react';
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
  UserPlus
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
  finalizeTournament
} from '../api/tournamentsApi';
import { getAllUsers } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function TournamentWorkspacePage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'participants' | 'form' | 'podium'
  const [allUsers, setAllUsers] = useState([]);

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [addMatchModalOpen, setAddMatchModalOpen] = useState(false);
  const [viewResponsesModalOpen, setViewResponsesModalOpen] = useState(null); // participant object
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);

  // New Participant form
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newAthleteEmail, setNewAthleteEmail] = useState('');
  const [newAthletePhone, setNewAthletePhone] = useState('');
  const [newSelectedUserId, setNewSelectedUserId] = useState('');
  const [newCustomAnswers, setNewCustomAnswers] = useState({});

  // New Match form
  const [newMatchRound, setNewMatchRound] = useState('Semi-Finals');
  const [newMatchNumber, setNewMatchNumber] = useState(1);
  const [newMatchP1Id, setNewMatchP1Id] = useState('');
  const [newMatchP2Id, setNewMatchP2Id] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('11:00 AM');
  const [newMatchDate, setNewMatchDate] = useState('2026-11-20');
  const [newMatchVenue, setNewMatchVenue] = useState('Track 4');

  // Podium selection
  const [podium1stId, setPodium1stId] = useState('');
  const [podium2ndId, setPodium2ndId] = useState('');
  const [podium3rdId, setPodium3rdId] = useState('');

  // Editable form schema in Tab
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

      // If matches have completed, auto-suggest podium
      if (tData.participants && tData.participants.length >= 2) {
        setPodium1stId(tData.participants[0]?.id || '');
        setPodium2ndId(tData.participants[1]?.id || '');
        if (tData.participants[2]) setPodium3rdId(tData.participants[2]?.id || '');
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
      loadData();
    } catch (err) {
      showToast('Failed to update score', 'error');
    }
  };

  // Add a new question to the Google Form schema
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

  // Save updated Google Form Schema to backend
  const handleSaveFormSchema = async () => {
    setSavingForm(true);
    try {
      await updateTournament(tournamentId, {
        title: tournament.title,
        sport: tournament.sport,
        format: tournament.format,
        customFormSchema: JSON.stringify(formQuestions),
      });
      showToast('Registration form schema updated successfully!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to update form questions', 'error');
    } finally {
      setSavingForm(false);
    }
  };

  // Register a new participant
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

  // Create Fixture Match
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

      showToast('Timetable fixture match scheduled!', 'success');
      setAddMatchModalOpen(false);
      loadData();
    } catch (err) {
      showToast('Failed to schedule match', 'error');
    }
  };

  // Finalize Tournament and Issue Credentials
  const handleFinalizeTournament = async () => {
    try {
      await finalizeTournament(tournamentId, {
        winner1stParticipantId: podium1stId ? Number(podium1stId) : null,
        winner2ndParticipantId: podium2ndId ? Number(podium2ndId) : null,
        winner3rdParticipantId: podium3rdId ? Number(podium3rdId) : null,
        awardCredentials: true,
      });

      showToast('Tournament finalized! Verified badges & certificates awarded to winners!', 'success');
      setFinalizeModalOpen(false);
      loadData();
    } catch (err) {
      showToast('Failed to finalize tournament', 'error');
    }
  };

  // Quick Status Changer
  const handleUpdateStatus = async (newStatus) => {
    try {
      await updateTournament(tournamentId, {
        title: tournament.title,
        sport: tournament.sport,
        format: tournament.format,
        status: newStatus,
      });
      showToast(`Tournament status updated to ${newStatus}`, 'success');
      loadData();
    } catch (err) {
      showToast('Failed to update status', 'error');
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">

      {/* ── TOP HERO HEADER ── */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">

        {/* Breadcrumb & Quick Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <Link
              to="/tournaments"
              className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
              <span>Tournaments</span>
              <span>/</span>
              <span className="text-stone-900 font-black">{tournament.title}</span>
            </div>
          </div>

          {/* Status Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-900 border border-amber-400/40">
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
                  >
                    Start Matches (Go Live)
                  </Button>
                )}
                <Button
                  variant="gold"
                  size="sm"
                  icon={Trophy}
                  onClick={() => setFinalizeModalOpen(true)}
                  className="font-bold shadow-xs"
                >
                  Finalize & Award Medals
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Title & Metadata Showcase */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-[10px] font-black uppercase tracking-wider text-stone-700">
                🏃 {tournament.sport}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-[10px] font-bold text-stone-600">
                {tournament.format}
              </span>
              <span className="text-xs font-bold text-amber-800">
                Organized by {tournament.institutionName}
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
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-stone-400" />
                <span>{participants.length} / {tournament.maxParticipants} Registered</span>
              </span>
            </div>
          </div>

          {/* Quick Actions (Share Registration Link, Register Athlete) */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={Copy}
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast('Athlete registration link copied to clipboard!', 'success');
              }}
              className="border-stone-300 font-bold"
            >
              Share Link
            </Button>

            {isInstitution && tournament.status !== 'COMPLETED' && (
              <Button
                variant="dark"
                size="sm"
                icon={UserPlus}
                onClick={() => setRegisterModalOpen(true)}
                className="font-bold shadow-xs"
              >
                Register Player
              </Button>
            )}
          </div>
        </div>

      </div>

      {/* ── WORKSPACE TABS NAVIGATION ── */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-stone-200/90 shadow-2xs gap-1 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${activeTab === 'matches'
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${activeTab === 'participants'
              ? 'bg-stone-900 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Athlete Roster ({participants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${activeTab === 'form'
              ? 'bg-stone-900 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
        >
          <FileText className="w-4 h-4" />
          <span>Custom Registration Form ({formQuestions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('podium')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${activeTab === 'podium'
              ? 'bg-stone-900 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>Podium & Awards</span>
        </button>
      </div>

      {/* ── TAB 1: TIMETABLE, FIXTURES & LIVE SCORES ── */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-stone-900">
                Match Fixtures & Live Timetable
              </h2>
            </div>

            {isInstitution && (
              <Button
                variant="dark"
                size="sm"
                icon={Plus}
                onClick={() => setAddMatchModalOpen(true)}
                className="font-bold"
              >
                Schedule New Fixture
              </Button>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-stone-200 space-y-3">
              <Clock className="w-10 h-10 text-stone-400 mx-auto" />
              <h4 className="text-base font-bold text-stone-900">No Fixtures Scheduled Yet</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Schedule your opening round heats, semi-finals, or league matches to begin tracking tournament progress.
              </p>
              <Button
                variant="dark"
                size="sm"
                icon={Plus}
                onClick={() => setAddMatchModalOpen(true)}
              >
                Schedule First Match
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => {
                const isCompleted = m.status === 'COMPLETED';
                const isLive = m.status === 'LIVE';

                return (
                  <div
                    key={m.id}
                    className={`bg-white rounded-3xl p-5 border transition-all space-y-4 shadow-xs ${isLive
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
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isLive
                            ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                            : isCompleted
                              ? 'bg-stone-100 text-stone-700'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    {/* Participant 1 vs Participant 2 Grid */}
                    <div className="grid grid-cols-5 items-center gap-3">

                      {/* Competitor 1 */}
                      <div className="col-span-2 space-y-1.5 text-center sm:text-left">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={m.participant1Avatar}
                            name={m.participant1Name}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-stone-900 block truncate">
                              {m.participant1Name}
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
                          placeholder="Score / Time"
                          className="w-full text-center sm:text-left px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      {/* VS Divider & Winner Crown */}
                      <div className="col-span-1 text-center space-y-1">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">
                          VS
                        </span>
                        {isInstitution && (
                          <div className="flex justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleScoreChange(m.id, m.score1, m.score2, m.participant1Id, 'COMPLETED')}
                              className={`p-1 rounded-lg text-xs transition-colors ${m.winnerParticipantId && m.winnerParticipantId === m.participant1Id
                                  ? 'text-amber-500 bg-amber-50 font-black'
                                  : 'text-stone-300 hover:text-amber-500'
                                }`}
                              title="Award Winner to Player 1"
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScoreChange(m.id, m.score1, m.score2, m.participant2Id, 'COMPLETED')}
                              className={`p-1 rounded-lg text-xs transition-colors ${m.winnerParticipantId && m.winnerParticipantId === m.participant2Id
                                  ? 'text-amber-500 bg-amber-50 font-black'
                                  : 'text-stone-300 hover:text-amber-500'
                                }`}
                              title="Award Winner to Player 2"
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Competitor 2 */}
                      <div className="col-span-2 space-y-1.5 text-center sm:text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="min-w-0 flex-1 text-right">
                            <span className="text-xs font-black text-stone-900 block truncate">
                              {m.participant2Name}
                            </span>
                          </div>
                          <Avatar
                            src={m.participant2Avatar}
                            name={m.participant2Name}
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
                          placeholder="Score / Time"
                          className="w-full text-center sm:text-right px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                    </div>

                    {/* Timetable footer */}
                    <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{m.scheduledTime} · {m.scheduledDate}</span>
                      </span>
                      <span className="truncate max-w-[150px]">
                        📍 {m.courtVenue || 'Court / Track'}
                      </span>
                    </div>

                    {/* Winner Announcement pill */}
                    {m.winnerName && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span>Winner: <strong>{m.winnerName}</strong></span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ATHLETES ROSTER & GOOGLE FORM RESPONSES ── */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-stone-900">
                Registered Athletes Roster
              </h2>
            </div>

            {isInstitution && (
              <Button
                variant="dark"
                size="sm"
                icon={UserPlus}
                onClick={() => setRegisterModalOpen(true)}
                className="font-bold"
              >
                Register Player / Athlete
              </Button>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-black uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Athlete</th>
                    <th className="px-4 py-3.5">Contact</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Custom Form Answers</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                  {participants.map((p) => {
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
                              {p.userId && (
                                <span className="text-[10px] text-amber-700 font-bold">
                                  Verified Arena Member
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-stone-600">
                          <div>{p.email || '—'}</div>
                          <div className="text-[10px] text-stone-400">{p.phone || ''}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                            {p.status}
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
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setViewResponsesModalOpen(p)}
                            className="font-bold border-stone-200"
                          >
                            View Form Responses
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: CUSTOM REGISTRATION FORM (GOOGLE FORMS BUILDER) ── */}
      {activeTab === 'form' && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-lg font-black text-stone-900">
                Custom Registration Form
              </h2>
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
            + Add Another Custom Field
          </Button>
        </div>
      )}

      {/* ── TAB 4: PODIUM & AWARD CEREMONY ── */}
      {activeTab === 'podium' && (
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-lg font-black text-stone-900">
                Podium & Award Ceremony
              </h2>
            </div>

            {tournament.status === 'COMPLETED' ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black">
                ✓ ALL CREDENTIALS AWARDED
              </span>
            ) : (
              isInstitution && (
                <Button
                  variant="gold"
                  size="md"
                  icon={Award}
                  onClick={() => setFinalizeModalOpen(true)}
                  className="font-black shadow-md hover:scale-105"
                >
                  Conclude Tournament & Award All
                </Button>
              )
            )}
          </div>

          {/* Podium Visual Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">

            {/* 2nd Place Silver */}
            <div className="p-5 rounded-3xl bg-stone-50 border border-stone-200 text-center space-y-3 order-2 sm:order-1">
              <div className="w-14 h-14 rounded-2xl bg-stone-200 text-stone-700 flex items-center justify-center mx-auto text-xl font-black shadow-xs">
                🥈
              </div>
              <h4 className="text-sm font-black text-stone-900">
                2nd Place (Silver Medal)
              </h4>
              <p className="text-xs font-bold text-stone-600">
                {tournament.winner2ndName || 'TBD - Finalist'}
              </p>
              <div className="p-2 rounded-xl bg-white border border-stone-200 text-[10px] font-bold text-stone-500">
                Awards {tournament.linkedBadgeSilverName || 'Silver Medal'} & Certificate
              </div>
            </div>

            {/* 1st Place Gold Champion (Elevated) */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-100/90 to-amber-50 border-2 border-amber-400 text-center space-y-3 order-1 sm:order-2 shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto text-2xl font-black shadow-sm ring-4 ring-white">
                🥇
              </div>
              <h4 className="text-base font-black text-stone-900">
                1st Place Champion (Gold Medal)
              </h4>
              <p className="text-sm font-black text-amber-950">
                {tournament.winner1stName || 'TBD - Champion'}
              </p>
              <div className="p-2.5 rounded-xl bg-white border border-amber-300 text-xs font-black text-amber-900">
                Awards {tournament.linkedBadgeGoldName || 'Gold Medal'} & Official Winner Certificate
              </div>
            </div>

            {/* 3rd Place Bronze */}
            <div className="p-5 rounded-3xl bg-amber-50/40 border border-amber-200/60 text-center space-y-3 order-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center mx-auto text-xl font-black shadow-xs">
                🥉
              </div>
              <h4 className="text-sm font-black text-stone-900">
                3rd Place (Bronze Medal)
              </h4>
              <p className="text-xs font-bold text-stone-600">
                {tournament.winner3rdName || 'TBD - Podium'}
              </p>
              <div className="p-2 rounded-xl bg-white border border-amber-200 text-[10px] font-bold text-stone-500">
                Awards {tournament.linkedBadgeBronzeName || 'Bronze Medal'} & Certificate
              </div>
            </div>

          </div>
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

      {/* ── MODAL: REGISTER PLAYER / ATHLETE (ORGANIZER MANUAL ENTRY) ── */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register Player / Athlete"
        size="md"
      >
        <form onSubmit={handleRegisterParticipant} className="space-y-4">

          {/* Quick pick from arena accounts */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Link Existing Arena Athlete (Optional)
            </label>
            <select
              value={newSelectedUserId}
              onChange={(e) => {
                const uid = e.target.value;
                setNewSelectedUserId(uid);
                const found = allUsers.find((u) => String(u.id) === String(uid));
                if (found) {
                  setNewAthleteName(found.displayName || found.username);
                  setNewAthleteEmail(found.email || '');
                }
              }}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
            >
              <option value="">-- Manual Athlete Entry (Not Linked) --</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName || u.username} (@{u.username})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Athlete Full Name"
            placeholder="e.g. Indrajeet Sharma"
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

          {/* Custom Google-Form questions to answer for this athlete */}
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
                <option value="Grand Final">Grand Final / Gold Medal Match</option>
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
        title="Finalize Tournament & Award Verified Credentials"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1 text-xs">
            <p className="font-black text-amber-950 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-700" />
              <span>Automated Credential Issuance</span>
            </p>
            <p className="text-stone-600">
              Select podium winners to issue verified certificates and badges.
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
              onClick={handleFinalizeTournament}
              className="font-black shadow-md"
            >
              Confirm & Issue All Credentials →
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
