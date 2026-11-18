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
  Layers,
  Upload,
  FileSpreadsheet,
  Table,
  Sliders,
  HelpCircle
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
  const [generatingFixtures, setGeneratingFixtures] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [addMatchModalOpen, setAddMatchModalOpen] = useState(false);
  const [viewResponsesModalOpen, setViewResponsesModalOpen] = useState(null);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [finalizeSuccessModalOpen, setFinalizeSuccessModalOpen] = useState(false);
  const [manualResultsModalOpen, setManualResultsModalOpen] = useState(false);

  // Finalize Options
  const [awardCredentials, setAwardCredentials] = useState(true);
  const [awardParticipationCertificates, setAwardParticipationCertificates] = useState(true);

  // New Participant Form
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newSeedNumber, setNewSeedNumber] = useState('');
  const [newCaptainName, setNewCaptainName] = useState('');
  const [newAthleteEmail, setNewAthleteEmail] = useState('');
  const [newAthletePhone, setNewAthletePhone] = useState('');
  const [newSelectedUserId, setNewSelectedUserId] = useState('');
  const [newCustomAnswers, setNewCustomAnswers] = useState({});

  // CSV Import with Column Mapping State
  const [rawCsvText, setRawCsvText] = useState('');
  const [csvParsedRows, setCsvParsedRows] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importingCsv, setImportingCsv] = useState(false);

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
      showToast('At least 2 registered participants/teams are required to generate fixtures.', 'error');
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

  // CSV Parsing & Column Mapping
  const handleParseCsv = (text) => {
    setRawCsvText(text);
    if (!text.trim()) {
      setCsvHeaders([]);
      setCsvParsedRows([]);
      setColumnMapping({});
      return;
    }

    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return;

    // Detect delimiter: comma, tab, or semicolon
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

    const parseLine = (line) => {
      // Basic CSV parser handling quotes
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine);

    setCsvHeaders(headers);
    setCsvParsedRows(rows);

    // Smart default mapping
    const initialMapping = {};
    headers.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (lower.includes('team') && !lower.includes('captain')) {
        initialMapping[idx] = 'teamName';
      } else if (lower.includes('captain')) {
        initialMapping[idx] = 'captainName';
      } else if (lower.includes('seed')) {
        initialMapping[idx] = 'seedNumber';
      } else if (lower.includes('mail')) {
        initialMapping[idx] = 'email';
      } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) {
        initialMapping[idx] = 'phone';
      } else if (lower.includes('name') || lower.includes('athlete') || lower.includes('player')) {
        initialMapping[idx] = 'athleteName';
      } else {
        initialMapping[idx] = 'ignore';
      }
    });

    // Ensure at least one athleteName is assigned if unmapped
    const hasAthleteName = Object.values(initialMapping).includes('athleteName');
    if (!hasAthleteName && headers.length > 0) {
      initialMapping[0] = 'athleteName';
    }

    setColumnMapping(initialMapping);
  };

  // Upload CSV File Reader
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        handleParseCsv(content);
      }
    };
    reader.readAsText(file);
  };

  // Confirm CSV Bulk Import
  const handleConfirmCsvImport = async () => {
    if (csvParsedRows.length === 0) {
      showToast('No rows found in uploaded data', 'error');
      return;
    }

    // Check if athleteName is mapped
    const nameColIdx = Object.keys(columnMapping).find((col) => columnMapping[col] === 'athleteName');
    if (nameColIdx === undefined) {
      showToast('Please map at least one column to "Athlete / Team Name"', 'error');
      return;
    }

    setImportingCsv(true);
    try {
      const payload = csvParsedRows.map((row) => {
        const item = {
          athleteName: '',
          teamName: null,
          seedNumber: null,
          captainName: null,
          email: null,
          phone: null,
          formResponses: '{}',
        };

        const customObj = {};

        row.forEach((val, idx) => {
          const target = columnMapping[idx];
          if (!target || target === 'ignore' || !val) return;

          if (target === 'athleteName') item.athleteName = val;
          else if (target === 'teamName') item.teamName = val;
          else if (target === 'captainName') item.captainName = val;
          else if (target === 'seedNumber') item.seedNumber = Number(val) || null;
          else if (target === 'email') item.email = val;
          else if (target === 'phone') item.phone = val;
          else {
            // Store as custom response
            customObj[csvHeaders[idx] || `field_${idx}`] = val;
          }
        });

        item.formResponses = JSON.stringify(customObj);
        return item;
      }).filter((item) => item.athleteName && item.athleteName.trim() !== '');

      if (payload.length === 0) {
        showToast('No valid rows found to import', 'error');
        setImportingCsv(false);
        return;
      }

      await bulkRegisterParticipants(tournamentId, payload);
      showToast(`Successfully imported ${payload.length} competitors/teams!`, 'success');
      setCsvModalOpen(false);
      setRawCsvText('');
      setCsvParsedRows([]);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to import CSV data', 'error');
    } finally {
      setImportingCsv(false);
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
        teamName: newTeamName.trim() || null,
        seedNumber: newSeedNumber ? Number(newSeedNumber) : null,
        captainName: newCaptainName.trim() || null,
        email: newAthleteEmail.trim() || null,
        phone: newAthletePhone.trim() || null,
        formResponses: JSON.stringify(newCustomAnswers),
      };
      await registerParticipant(tournamentId, payload);
      showToast(`Registered successfully!`, 'success');
      setRegisterModalOpen(false);
      setNewAthleteName('');
      setNewTeamName('');
      setNewSeedNumber('');
      setNewCaptainName('');
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

  // Finalize Tournament (concludes with or without credentials)
  const handleFinalizeTournament = async () => {
    setFinalizing(true);
    try {
      await finalizeTournament(tournamentId, {
        winner1stParticipantId: podium1stId ? Number(podium1stId) : null,
        winner2ndParticipantId: podium2ndId ? Number(podium2ndId) : null,
        winner3rdParticipantId: podium3rdId ? Number(podium3rdId) : null,
        awardCredentials: tournament.credentialsEnabled ? awardCredentials : false,
        awardParticipationCertificates: tournament.credentialsEnabled ? awardParticipationCertificates : false,
      });

      setFinalizeModalOpen(false);
      setFinalizeSuccessModalOpen(true);
      showToast('Tournament concluded successfully!', 'success');
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
      p.teamName?.toLowerCase().includes(term) ||
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

  const isTeam = tournament.competitionType === 'TEAM';

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
                  Conclude Tournament
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
                {isTeam ? `Teams (${tournament.teamSize || 5}v${tournament.teamSize || 5})` : 'Individual Solo'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-xs font-bold text-stone-700">
                {tournament.format}
              </span>
              {!tournament.credentialsEnabled && (
                <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-500 text-xs font-medium">
                  Pure Standings (No Digital Badges)
                </span>
              )}
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
                <span>{participants.length} / {tournament.maxParticipants} Registered {isTeam ? 'Teams' : 'Athletes'}</span>
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
              <span>Share Event</span>
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
                <span className="block text-xs font-bold text-stone-900 truncate">Roster ({participants.length})</span>
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
                <span className="block text-xs font-bold text-stone-900 truncate">Live Scores</span>
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
                <span className="block text-xs font-bold text-stone-900 truncate">Podium & Standings</span>
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
          <span>Fixtures & Live Arena ({matches.length})</span>
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
          <span>{isTeam ? 'Team Roster' : 'Athlete Roster'} ({participants.length})</span>
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
          <span>Registration Questionnaire ({formQuestions.length})</span>
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
          <span>Podium & Awards</span>
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
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  variant="gold"
                  size="sm"
                  icon={Zap}
                  loading={generatingFixtures}
                  onClick={handleGenerateFixtures}
                  className="font-black shadow-xs hover:scale-105 transition-all"
                  title="Generate bracket matches honoring seeds"
                >
                  ⚡ Auto-Generate Brackets
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={Sliders}
                  onClick={() => setManualResultsModalOpen(true)}
                  className="font-bold text-xs"
                  title="Post final match results directly or enter podium winners"
                >
                  Manual Scoreboard
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setAddMatchModalOpen(true)}
                  className="font-bold text-xs"
                >
                  Add Match
                </Button>
              </div>
            )}
          </div>

          {/* Empty State */}
          {matches.length === 0 ? (
            <div className="p-10 sm:p-14 text-center bg-white rounded-3xl border border-dashed border-stone-300 space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                <Zap className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-stone-900">
                  No Fixture Matches Scheduled
                </h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  {participants.length >= 2
                    ? `You have ${participants.length} registered competitors in your roster. Click below to generate your official tournament bracket.`
                    : 'Add or import competitors in the Roster tab to begin bracket generation.'}
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
                    Generate Tournament Bracket ({participants.length} Seeded)
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="dark"
                      size="md"
                      icon={Upload}
                      onClick={() => setCsvModalOpen(true)}
                      className="font-bold shadow-xs"
                    >
                      Import Roster via CSV
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      icon={UserPlus}
                      onClick={() => setRegisterModalOpen(true)}
                      className="font-bold"
                    >
                      Direct Add Competitor
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
                          placeholder="Score"
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
                          placeholder="Score"
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

      {/* ── TAB 2: ATHLETE / TEAM ROSTER & PRODUCTION INGESTION ── */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          
          {/* Metrics & Roster Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${isTeam ? 'teams or captains' : 'athletes'}...`}
                  value={searchRoster}
                  onChange={(e) => setSearchRoster(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-amber-500 w-64"
                />
              </div>
              <span className="text-xs font-bold text-stone-500">
                {participants.length} registered
              </span>
            </div>

            {isInstitution && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  variant="gold"
                  size="sm"
                  icon={Upload}
                  onClick={() => setCsvModalOpen(true)}
                  className="font-black shadow-xs hover:scale-105 transition-all"
                  title="Import spreadsheet/CSV with column mapping"
                >
                  Import Spreadsheet / CSV
                </Button>

                <Button
                  variant="dark"
                  size="sm"
                  icon={UserPlus}
                  onClick={() => setRegisterModalOpen(true)}
                  className="font-bold"
                >
                  Direct Add {isTeam ? 'Team' : 'Competitor'}
                </Button>
              </div>
            )}
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
            {participants.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <Users className="w-12 h-12 text-stone-300 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-black text-stone-900">
                    No {isTeam ? 'Teams' : 'Competitors'} Added Yet
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Share your public registration link, upload an existing CSV spreadsheet with column mapping, or add participants manually.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-1">
                  <Button
                    variant="gold"
                    size="sm"
                    icon={Upload}
                    onClick={() => setCsvModalOpen(true)}
                    className="font-black"
                  >
                    Import CSV / Spreadsheet
                  </Button>
                  <Button
                    variant="dark"
                    size="sm"
                    icon={UserPlus}
                    onClick={() => setRegisterModalOpen(true)}
                    className="font-bold"
                  >
                    Direct Add
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-black uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Seed & Name</th>
                      {isTeam && <th className="px-4 py-3.5">Team Captain</th>}
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
                              {p.seedNumber != null ? (
                                <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-900 text-xs font-black flex items-center justify-center shrink-0">
                                  #{p.seedNumber}
                                </span>
                              ) : (
                                <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-500 text-xs font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                              )}
                              <div>
                                <span className="font-black text-stone-900 block text-xs">
                                  {p.athleteName}
                                </span>
                                {p.teamName && (
                                  <span className="text-[10px] text-stone-500 font-bold block">
                                    Team: {p.teamName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {isTeam && (
                            <td className="px-4 py-3.5 text-stone-700 font-semibold text-xs">
                              {p.captainName || '—'}
                            </td>
                          )}

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
                Custom Registration Questionnaire Builder
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Customize the registration form competitors fill out when registering on the web.
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
                Save Questionnaire
              </Button>
            )}
          </div>

          {/* Quick Two-Links Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-stone-200">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-black uppercase text-stone-400">
                  1. Public Tournament Page
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
                  showToast('Tournament link copied!', 'success');
                }}
              >
                Copy
              </Button>
            </div>

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
                Podium & Final Standings
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {tournament.credentialsEnabled
                  ? 'Confirm podium winners to officially conclude the tournament and mint digital badges & certificates.'
                  : 'Confirm podium winners to conclude the tournament and permanently archive official standings.'}
              </p>
            </div>

            {tournament.status === 'COMPLETED' ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>TOURNAMENT CONCLUDED</span>
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
                  Conclude Tournament
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
                {tournament.credentialsEnabled ? `Awards ${tournament.linkedBadgeSilverName || 'Silver Medal'} & Certificate` : '2nd Place Finalist Honors'}
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
                {tournament.credentialsEnabled ? `Awards ${tournament.linkedBadgeGoldName || 'Gold Medal'} & Official Certificate` : '1st Place Champion Honors'}
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
                {tournament.credentialsEnabled ? `Awards ${tournament.linkedBadgeBronzeName || 'Bronze Medal'} & Certificate` : '3rd Place Honors'}
              </div>
            </div>

          </div>

          {/* Concluded Summary & Hub Navigation */}
          {tournament.status === 'COMPLETED' && (
            <div className="p-6 rounded-3xl bg-stone-900 text-white space-y-4 shadow-md">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-base font-black">Tournament Officially Concluded & Archived</h3>
                  <p className="text-xs text-stone-400">
                    Final rankings are permanently recorded.
                    {tournament.credentialsEnabled && ' Badges and tamper-proof certificates have been anchored into portfolios.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {tournament.credentialsEnabled && (
                  <Link
                    to="/certificates"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-black text-xs hover:bg-amber-400 transition-all shadow-xs"
                  >
                    <Award className="w-4 h-4" />
                    <span>View in Certificate Hub →</span>
                  </Link>
                )}

                <Link
                  to={`/tournaments/${tournament.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Public Tournament Page</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── MODAL: BULK SPREADSHEET / CSV IMPORT WITH VISUAL COLUMN MAPPER ── */}
      <Modal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title="Import Roster via Spreadsheet or CSV"
        size="lg"
      >
        <div className="space-y-5">
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs space-y-1">
            <span className="font-black text-stone-900 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>Production CSV / Excel Ingestion with Visual Column Mapping</span>
            </span>
            <p className="text-stone-600 leading-relaxed">
              Upload a `.csv` file or paste table data from Google Sheets/Excel. You can map each column to its corresponding field before importing.
            </p>
          </div>

          {/* Option 1: File Upload */}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Choose .CSV File</span>
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-xs text-stone-400 font-medium">or paste rows below:</span>
          </div>

          {/* Option 2: Textarea for Pasting CSV / Excel data */}
          <div>
            <textarea
              rows={4}
              value={rawCsvText}
              onChange={(e) => handleParseCsv(e.target.value)}
              placeholder={`Paste data with headers, e.g.:\nAthlete Name, Email, Phone, Seed Number, Team Name\nAlex Vance, alex@example.com, +1 555-0192, 1, Red Hawks\nSarah Chen, sarah@example.com, +1 555-0143, 2, Blue Vipers`}
              className="w-full p-3 rounded-2xl border border-stone-300 font-mono text-xs focus:outline-none focus:border-amber-500 bg-stone-50/50"
            />
          </div>

          {/* Column Mapping Section (Visible once rows parsed) */}
          {csvHeaders.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-stone-800">
                  Detected Columns & Field Mapping:
                </span>
                <span className="text-xs font-bold text-stone-500">
                  {csvParsedRows.length} rows parsed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {csvHeaders.map((header, idx) => (
                  <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <span className="block text-[11px] font-black text-stone-700 truncate" title={header}>
                      Column: "{header}"
                    </span>
                    <select
                      value={columnMapping[idx] || 'ignore'}
                      onChange={(e) => {
                        setColumnMapping({ ...columnMapping, [idx]: e.target.value });
                      }}
                      className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                    >
                      <option value="athleteName">Athlete / Competitor Name *</option>
                      <option value="teamName">Team / Squad Name</option>
                      <option value="seedNumber">Seed Number (#1, #2...)</option>
                      <option value="captainName">Team Captain Name</option>
                      <option value="email">Email Address</option>
                      <option value="phone">Contact Phone</option>
                      <option value="custom">Custom Questionnaire Field</option>
                      <option value="ignore">— Ignore Column —</option>
                    </select>
                  </div>
                ))}
              </div>

              {/* Data Table Preview */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-bold text-stone-500 block uppercase">
                  Data Preview (First 5 Rows):
                </span>
                <div className="max-h-40 overflow-auto rounded-xl border border-stone-200">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider">
                      <tr>
                        {csvHeaders.map((h, i) => (
                          <th key={i} className="px-3 py-2 whitespace-nowrap">
                            {h} ({columnMapping[i] || 'ignore'})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {csvParsedRows.slice(0, 5).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-stone-50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-1.5 truncate max-w-[150px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCsvModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="gold"
              size="sm"
              loading={importingCsv}
              disabled={csvParsedRows.length === 0}
              onClick={handleConfirmCsvImport}
              className="font-black shadow-md"
            >
              Confirm & Import {csvParsedRows.length} Competitors →
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: MANUAL RESULTS / RAPID SCOREBOARD MODE ── */}
      <Modal
        isOpen={manualResultsModalOpen}
        onClose={() => setManualResultsModalOpen(false)}
        title="Manual Results & Rapid Scoreboard"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs space-y-1">
            <span className="font-black text-stone-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>Offline / External Game Results Posting</span>
            </span>
            <p className="text-stone-600 leading-relaxed">
              For tournaments run on physical sheets, external monitors, or game lobbies: post match scores or assign podium winners directly without simulating round by round.
            </p>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {matches.map((m) => (
              <div key={m.id} className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-stone-900">{m.roundName}</span>
                    <span className="text-[10px] text-stone-400">Match #{m.matchNumber}</span>
                  </div>
                  <span className="text-stone-700 font-bold block truncate">
                    {m.participant1Name || 'TBD'} vs {m.participant2Name || 'TBD'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    defaultValue={m.score1 || ''}
                    onBlur={(e) => handleScoreChange(m.id, e.target.value, m.score2, m.winnerParticipantId, m.status)}
                    placeholder="Score 1"
                    className="w-16 px-2 py-1 text-center text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  <span>–</span>
                  <input
                    type="text"
                    defaultValue={m.score2 || ''}
                    onBlur={(e) => handleScoreChange(m.id, m.score1, e.target.value, m.winnerParticipantId, m.status)}
                    placeholder="Score 2"
                    className="w-16 px-2 py-1 text-center text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  
                  {/* Quick Winner selector */}
                  <select
                    value={m.winnerParticipantId || ''}
                    onChange={(e) => {
                      const wid = e.target.value ? Number(e.target.value) : null;
                      handleScoreChange(m.id, m.score1, m.score2, wid, 'COMPLETED');
                    }}
                    className="px-2 py-1 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="">-- Choose Winner --</option>
                    {m.participant1Id && <option value={m.participant1Id}>{m.participant1Name}</option>}
                    {m.participant2Id && <option value={m.participant2Id}>{m.participant2Name}</option>}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <Button
              variant="dark"
              size="sm"
              onClick={() => setManualResultsModalOpen(false)}
            >
              Done / Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: VIEW ATHLETE CUSTOM GOOGLE FORM RESPONSES ── */}
      <Modal
        isOpen={!!viewResponsesModalOpen}
        onClose={() => setViewResponsesModalOpen(null)}
        title={`Registration Details: ${viewResponsesModalOpen?.athleteName}`}
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
                {viewResponsesModalOpen.teamName && (
                  <p className="text-xs font-bold text-amber-800">
                    Team: {viewResponsesModalOpen.teamName}
                  </p>
                )}
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

      {/* ── MODAL: DIRECT ADD PARTICIPANT / TEAM ── */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title={isTeam ? 'Add Team to Roster' : 'Register Competitor'}
        size="md"
      >
        <form onSubmit={handleRegisterParticipant} className="space-y-4">
          <Input
            label={isTeam ? 'Team Name *' : 'Competitor Full Name *'}
            placeholder={isTeam ? 'e.g. Red Hawks' : 'e.g. Alex Vance'}
            value={newAthleteName}
            onChange={(e) => setNewAthleteName(e.target.value)}
            required
          />

          {isTeam && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Team Captain Name"
                placeholder="e.g. Marcus Vance"
                value={newCaptainName}
                onChange={(e) => setNewCaptainName(e.target.value)}
              />
              <Input
                label="Seed Number (Optional)"
                type="number"
                placeholder="e.g. 1"
                value={newSeedNumber}
                onChange={(e) => setNewSeedNumber(e.target.value)}
              />
            </div>
          )}

          {!isTeam && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Affiliated Team/Club (Optional)"
                placeholder="e.g. Metro Track Club"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
              <Input
                label="Seed Number (Optional)"
                type="number"
                placeholder="e.g. 1"
                value={newSeedNumber}
                onChange={(e) => setNewSeedNumber(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              placeholder="contact@example.com"
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
                Questionnaire Answers:
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
              Add to Roster
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: SCHEDULE NEW FIXTURE MATCH ── */}
      <Modal
        isOpen={addMatchModalOpen}
        onClose={() => setAddMatchModalOpen(false)}
        title="Schedule Fixture Match"
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
              <label className="block text-xs font-bold text-stone-700 mb-1">Side 1 ({isTeam ? 'Team 1' : 'Player 1'})</label>
              <select
                value={newMatchP1Id}
                onChange={(e) => setNewMatchP1Id(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
              >
                <option value="">-- Select Competitor --</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>{p.athleteName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Side 2 ({isTeam ? 'Team 2' : 'Player 2'})</label>
              <select
                value={newMatchP2Id}
                onChange={(e) => setNewMatchP2Id(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
              >
                <option value="">-- Select Competitor --</option>
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
              label="Court / Lobby"
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
              Schedule Match
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: FINALIZE TOURNAMENT ── */}
      <Modal
        isOpen={finalizeModalOpen}
        onClose={() => setFinalizeModalOpen(false)}
        title="Conclude Tournament & Confirm Standings"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1 text-xs">
            <p className="font-black text-amber-950 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-700" />
              <span>Official Tournament Conclusion</span>
            </p>
            <p className="text-stone-600">
              Confirm the final podium winners below. This permanently concludes the tournament and updates public records.
            </p>
          </div>

          {/* 1st Place */}
          <div className="space-y-1">
            <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <span>🥇 1st Place Champion</span>
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

          {/* 2nd Place */}
          <div className="space-y-1">
            <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <span>🥈 2nd Place Finalist</span>
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

          {/* 3rd Place */}
          <div className="space-y-1">
            <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <span>🥉 3rd Place Podium</span>
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

          {/* Credential Options Checkboxes (Only if tournament has credentials enabled) */}
          {tournament.credentialsEnabled && (
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
          )}

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
              Confirm & Conclude Tournament →
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: POST-FINALIZE CELEBRATION MODAL ── */}
      <Modal
        isOpen={finalizeSuccessModalOpen}
        onClose={() => setFinalizeSuccessModalOpen(false)}
        title="Tournament Concluded"
        size="md"
      >
        <div className="text-center space-y-5 py-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto text-3xl font-black shadow-md ring-4 ring-amber-100">
            🏆
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-stone-900">
              Tournament Successfully Concluded!
            </h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
              Official standings have been archived.
              {tournament.credentialsEnabled && ' Minted credentials and verified badges have been anchored into recipient portfolios.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-600">🥇 Champion:</span>
              <span className="font-black text-stone-900">
                {participants.find((p) => String(p.id) === String(podium1stId))?.athleteName || 'Winner'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-600">🥈 Runner-Up:</span>
              <span className="font-black text-stone-900">
                {participants.find((p) => String(p.id) === String(podium2ndId))?.athleteName || 'Finalist'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-600">🥉 3rd Place:</span>
              <span className="font-black text-stone-900">
                {participants.find((p) => String(p.id) === String(podium3rdId))?.athleteName || 'Podium'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {tournament.credentialsEnabled && (
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
            )}
            <Button
              variant="dark"
              onClick={() => {
                setFinalizeSuccessModalOpen(false);
                navigate(`/tournaments/${tournament.id}`);
              }}
              className="w-full sm:w-auto font-bold"
            >
              Public Tournament Page
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
