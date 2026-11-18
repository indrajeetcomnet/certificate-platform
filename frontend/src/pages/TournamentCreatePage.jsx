import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  Award,
  Shield,
  Sparkles,
  FileText,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  ChevronRight,
  Flame,
  Check,
  Globe,
  Monitor,
  Gamepad2,
  GraduationCap,
  Palette,
  Briefcase
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { createTournament } from '../api/tournamentsApi';
import { getAllBadges } from '../api/badgesApi';
import { getAllCertificates } from '../api/certificatesApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Multi-Domain Category Taxonomy
const CATEGORIES = [
  { id: 'SPORTS', name: 'Sports & Athletics', emoji: '🏃', icon: Trophy, desc: 'Track & field, football, basketball, swimming, racket sports, etc.' },
  { id: 'ESPORTS', name: 'Esports & Gaming', emoji: '🎮', icon: Gamepad2, desc: 'Competitive PC, console & mobile titles, scrims & championships.' },
  { id: 'ACADEMICS', name: 'Academics & Education', emoji: '🎓', icon: GraduationCap, desc: 'Debate cups, science & math olympiads, hackathons, quiz bowls.' },
  { id: 'ARTS', name: 'Arts & Cultural', emoji: '🎭', icon: Palette, desc: 'Music, singing, dance competitions, drama, fine arts & filmmaking.' },
  { id: 'CORPORATE', name: 'Corporate & Other', emoji: '💼', icon: Briefcase, desc: 'Case competitions, pitch fests, company leagues, open challenges.' },
];

const DISCIPLINES_BY_CATEGORY = {
  SPORTS: [
    'Athletics & Track', 'Football (Soccer)', 'Basketball', 'Tennis', 'Badminton',
    'Swimming', 'Cricket', 'Martial Arts (Karate/Judo/Taekwondo)', 'Volleyball',
    'Table Tennis', 'Other / Custom Sport'
  ],
  ESPORTS: [
    'Valorant', 'Counter-Strike 2 (CS2)', 'BGMI / PUBG Mobile', 'Rocket League',
    'League of Legends', 'EA Sports FC / FIFA', 'Dota 2', 'Overwatch 2',
    'Rainbow Six Siege', 'Call of Duty: Warzone', 'Other / Custom Game'
  ],
  ACADEMICS: [
    'Parliamentary Debate Championship', 'Science & Innovation Olympiad',
    'Mathematics Olympiad', 'Software & AI Hackathon', 'Model United Nations (MUN)',
    'National Quiz Bowl', 'Robotics & Mechatronics Challenge', 'Business Case Competition',
    'Other / Custom Academic Event'
  ],
  ARTS: [
    'Solo & Choral Singing / Music', 'Dance Championship (Solo & Squad)',
    'Drama & One-Act Theater', 'Fine Arts & Painting Exhibition',
    'Short Film & Photography Contest', 'Other / Custom Cultural Contest'
  ],
  CORPORATE: [
    'Startup Pitch Fest', 'Corporate Hackathon', 'Company Esports League',
    'Annual Sports Meet', 'Other / Custom Challenge'
  ]
};

const FORMATS = [
  {
    id: 'Single Elimination Knockout',
    name: 'Single Elimination Knockout',
    desc: 'Loser is immediately eliminated; winner advances. Classic knockout bracket.',
    badge: 'Standard Bracket',
  },
  {
    id: 'Double Elimination Bracket',
    name: 'Double Elimination Bracket',
    desc: 'Participants must lose twice to be eliminated. Features Winners and Losers brackets.',
    badge: 'Competitive Standard',
  },
  {
    id: 'Round Robin / League Table',
    name: 'Round Robin / League Table',
    desc: 'Every participant plays every other participant. Best for group stages and leagues.',
    badge: 'Round Robin',
  },
  {
    id: 'Sprint Heats / Time Trials',
    name: 'Sprint Heats / Time Trials',
    desc: 'Qualifying heats based on time or distance, advancing top seeds to the Grand Final.',
    badge: 'Heats & Timed',
  },
  {
    id: 'Open Showcase / Exhibition',
    name: 'Open Showcase / Exhibition',
    desc: 'Open entry format without strict elimination; direct ranking or judged scores.',
    badge: 'Open / Showcase',
  },
];

const SCORING_TYPES = [
  { id: 'POINTS', name: 'Points / Goals based', example: 'e.g. 3 – 1 or 88 – 82' },
  { id: 'SETS', name: 'Sets / Games based', example: 'e.g. Best of 3 / Best of 5' },
  { id: 'TIME', name: 'Time / Distance based', example: 'e.g. 10.42s or 7.85m' },
];

export default function TournamentCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, isInstitution } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdTournament, setCreatedTournament] = useState(null);
  const [postLaunchModalOpen, setPostLaunchModalOpen] = useState(false);

  // Available badges & templates
  const [badges, setBadges] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Form State - Step 1: Category, Discipline, Scope, Title
  const [category, setCategory] = useState('SPORTS');
  const [disciplineSelect, setDisciplineSelect] = useState('Athletics & Track');
  const [customDiscipline, setCustomDiscipline] = useState('');
  const [competitionType, setCompetitionType] = useState('INDIVIDUAL'); // INDIVIDUAL | TEAM
  const [teamSize, setTeamSize] = useState(5);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Form State - Step 2: Format, Scoring, Schedule & Venue
  const [format, setFormat] = useState('Single Elimination Knockout');
  const [scoringType, setScoringType] = useState('POINTS');
  const [isVirtual, setIsVirtual] = useState(false);
  const [venue, setVenue] = useState('National Athletic Stadium, Track 4');
  const [startDate, setStartDate] = useState('2026-11-20');
  const [endDate, setEndDate] = useState('2026-11-22');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-11-19');
  const [maxParticipants, setMaxParticipants] = useState(16);

  // Form State - Step 3: Registration Channels & Form Builder
  const [formFields, setFormFields] = useState([
    { id: 'category_class', label: 'Competition Category / Division', type: 'select', options: ['Open Division', 'Junior Elite', 'Senior Championship'], required: true },
    { id: 'emergency_contact', label: 'Emergency Contact or Guardian Phone', type: 'text', placeholder: '+91 98765 43210', required: false },
  ]);

  // Form State - Step 4: Digital Credentials (Optional)
  const [credentialsEnabled, setCredentialsEnabled] = useState(true);
  const [goldBadgeId, setGoldBadgeId] = useState('');
  const [silverBadgeId, setSilverBadgeId] = useState('');
  const [bronzeBadgeId, setBronzeBadgeId] = useState('');
  const [certTemplate, setCertTemplate] = useState('MODERN_GOLD');

  // Load available badges & templates
  useEffect(() => {
    getAllBadges()
      .then((res) => setBadges(res.data || []))
      .catch(() => setBadges([]));

    getAllCertificates()
      .then((res) => {
        const unique = [...new Set((res.data || []).map((c) => c.title).filter(Boolean))];
        setTemplates(unique);
      })
      .catch(() => setTemplates([]));
  }, []);

  // Update discipline when category changes
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const available = DISCIPLINES_BY_CATEGORY[newCat] || [];
    setDisciplineSelect(available[0] || 'Other');
    setCustomDiscipline('');
    
    // Smart title recommendation
    const catObj = CATEGORIES.find((c) => c.id === newCat);
    if (!title || title.includes('Championship') || title.includes('Tournament')) {
      const year = new Date().getFullYear();
      setTitle(`${catObj?.name.split('&')[0].trim()} Championship ${year}`);
    }
  };

  const getEffectiveDiscipline = () => {
    if (disciplineSelect.includes('Other') && customDiscipline.trim()) {
      return customDiscipline.trim();
    }
    return disciplineSelect;
  };

  // Form builder actions
  const addFormField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      label: 'New Question Title',
      type: 'text',
      placeholder: 'Enter answer...',
      required: false,
    };
    setFormFields([...formFields, newField]);
  };

  const removeFormField = (idx) => {
    setFormFields(formFields.filter((_, i) => i !== idx));
  };

  const updateFormField = (idx, key, value) => {
    const copy = [...formFields];
    copy[idx][key] = value;
    setFormFields(copy);
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!title.trim()) {
      showToast('Please enter an official tournament title', 'error');
      return false;
    }
    if (disciplineSelect.includes('Other') && !customDiscipline.trim()) {
      showToast('Please specify the custom sport / discipline name', 'error');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!venue.trim()) {
      showToast('Please specify an event venue or online lobby URL', 'error');
      return false;
    }
    if (!startDate) {
      showToast('Please choose a start date', 'error');
      return false;
    }
    return true;
  };

  // Final Submit
  const handleLaunchTournament = async () => {
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        sport: getEffectiveDiscipline(),
        category,
        competitionType,
        teamSize: competitionType === 'TEAM' ? Number(teamSize) : 1,
        scoringType,
        credentialsEnabled,
        isVirtual,
        format,
        venue: venue.trim(),
        startDate,
        endDate,
        registrationDeadline,
        maxParticipants: Number(maxParticipants) || 16,
        customFormSchema: JSON.stringify(formFields),
        linkedBadgeGoldId: credentialsEnabled && goldBadgeId ? Number(goldBadgeId) : null,
        linkedBadgeSilverId: credentialsEnabled && silverBadgeId ? Number(silverBadgeId) : null,
        linkedBadgeBronzeId: credentialsEnabled && bronzeBadgeId ? Number(bronzeBadgeId) : null,
        linkedCertificateTemplate: credentialsEnabled ? certTemplate : null,
      };

      const res = await createTournament(payload);
      setCreatedTournament(res.data);
      setPostLaunchModalOpen(true);
      showToast('Tournament created successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create tournament', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans">
      
      {/* ── TOP BREADCRUMB & HEADER ── */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/tournaments"
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-600" />
              <span>Organize a Tournament</span>
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Enterprise step-by-step tournament setup for sports, esports, academic and corporate events.
            </p>
          </div>
        </div>
      </div>

      {/* ── STEP PROGRESS BAR ── */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3 shadow-2xs">
        <div className="grid grid-cols-5 gap-2">
          {[
            { num: 1, title: 'Discipline & Scope' },
            { num: 2, title: 'Schedule & Venue' },
            { num: 3, title: 'Form Builder' },
            { num: 4, title: 'Credentials' },
            { num: 5, title: 'Review & Launch' },
          ].map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div
                key={s.num}
                className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-stone-900 text-white font-black shadow-xs'
                    : isDone
                      ? 'bg-stone-100 text-stone-800 font-bold'
                      : 'text-stone-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    isCurrent
                      ? 'bg-amber-500 text-stone-950'
                      : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                </div>
                <span className="text-[11px] truncate hidden md:inline">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEP 1: CLASSIFICATION & EVENT SCOPE ── */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg font-black text-stone-900">
              Step 1: Event Classification & Competition Scope
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Select the primary category and competition discipline to configure sport-specific rules and formats.
            </p>
          </div>

          {/* 1.1 Category Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider">
              1. Event Domain / Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {CATEGORIES.map((c) => {
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCategoryChange(c.id)}
                    className={`p-3 rounded-2xl text-left border transition-all space-y-1.5 ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-stone-50 hover:bg-white border-stone-200 text-stone-700'
                    }`}
                  >
                    <div className="text-2xl">{c.emoji}</div>
                    <div className="text-xs font-black truncate">{c.name.split('&')[0]}</div>
                    <div className={`text-[10px] line-clamp-2 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {c.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1.2 Discipline Select & Custom Fallback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                2. Sub-Discipline / Sport
              </label>
              <select
                value={disciplineSelect}
                onChange={(e) => setDisciplineSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500"
              >
                {(DISCIPLINES_BY_CATEGORY[category] || []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {disciplineSelect.includes('Other') && (
              <div>
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                  Specify Custom Discipline Name
                </label>
                <input
                  type="text"
                  value={customDiscipline}
                  onChange={(e) => setCustomDiscipline(e.target.value)}
                  placeholder="e.g. Weightlifting, Speedcubing, Archery"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/20 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* 1.3 Competition Mode: Individual vs Team */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider">
              3. Competition Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCompetitionType('INDIVIDUAL')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  competitionType === 'INDIVIDUAL'
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-black shrink-0">
                  👤
                </div>
                <div>
                  <span className="block text-sm font-black text-stone-900">
                    Solo Competitors (Singles / 1v1)
                  </span>
                  <span className="block text-xs text-stone-500 mt-0.5">
                    Individual athletes or participants compete directly.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCompetitionType('TEAM')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  competitionType === 'TEAM'
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black shrink-0">
                  👥
                </div>
                <div>
                  <span className="block text-sm font-black text-stone-900">
                    Teams / Squads
                  </span>
                  <span className="block text-xs text-stone-500 mt-0.5">
                    Rosters of 2 or more players per team (e.g. doubles, 5v5, 11v11).
                  </span>
                </div>
              </button>
            </div>

            {competitionType === 'TEAM' && (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 max-w-xs space-y-1">
                <label className="block text-xs font-bold text-stone-700">
                  Standard Squad Size (Players per Team)
                </label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-stone-300 bg-white"
                />
              </div>
            )}
          </div>

          {/* 1.4 Title & Description */}
          <div className="space-y-4 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                4. Official Tournament Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. National Athletics Championship 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                Overview & Official Rules
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Provide event overview, rules, eligibility criteria, and scoring guidelines..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Step 1 Actions */}
          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <Button
              variant="dark"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              className="font-bold shadow-xs"
            >
              Continue to Schedule & Format →
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: FORMAT, SCORING, SCHEDULE & VENUE ── */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg font-black text-stone-900">
              Step 2: Tournament Format, Scoring & Schedule
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Choose your competitive bracket structure, scoring methodology, and venue arrangements.
            </p>
          </div>

          {/* 2.1 Tournament Format */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider">
              1. Competition Structure / Bracket Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FORMATS.map((f) => {
                const isSelected = format === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-stone-900">{f.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                        {f.badge}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">{f.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2.2 Scoring System */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider">
              2. Match Scoring Methodology
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SCORING_TYPES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setScoringType(st.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    scoringType === st.id
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                  }`}
                >
                  <span className="block text-xs font-black">{st.name}</span>
                  <span className={`block text-[11px] mt-0.5 ${scoringType === st.id ? 'text-stone-300' : 'text-stone-500'}`}>
                    {st.example}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2.3 Venue: Physical vs Virtual */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider">
                3. Venue Location
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsVirtual(false)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    !isVirtual ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  📍 Physical Venue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsVirtual(true);
                    if (!venue || venue.includes('Stadium')) setVenue('Online Lobby / Discord Server');
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    isVirtual ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  🌐 Virtual / Online URL
                </button>
              </div>
            </div>

            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder={isVirtual ? 'e.g. Discord: discord.gg/esports-arena or Custom Lobby URL' : 'e.g. National Athletic Stadium, Track 4'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* 2.4 Schedule & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            <Input
              label="Registration Cutoff"
              type="date"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
            />
            <Input
              label={`Max ${competitionType === 'TEAM' ? 'Teams' : 'Athletes'}`}
              type="number"
              min="2"
              max="256"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              required
            />
          </div>

          {/* Step 2 Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCurrentStep(1)}
            >
              ← Back
            </Button>
            <Button
              variant="dark"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => {
                if (validateStep2()) setCurrentStep(3);
              }}
              className="font-bold shadow-xs"
            >
              Continue to Registration Form Builder →
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: REGISTRATION CHANNELS & FORM BUILDER ── */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg font-black text-stone-900">
              Step 3: Custom Athlete / Team Questionnaire
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Build custom questionnaire fields that competitors will fill out upon web registration.
            </p>
          </div>

          <div className="space-y-3">
            {formFields.map((f, i) => (
              <div
                key={f.id || i}
                className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-amber-400 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => updateFormField(i, 'label', e.target.value)}
                      className="flex-1 font-black text-sm text-stone-900 bg-transparent border-b border-dashed border-stone-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={f.type}
                      onChange={(e) => updateFormField(i, 'type', e.target.value)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                    >
                      <option value="text">Text Input</option>
                      <option value="number">Numeric</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox (Yes/No)</option>
                    </select>

                    <label className="flex items-center gap-1 text-xs font-semibold text-stone-600">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => updateFormField(i, 'required', e.target.checked)}
                      />
                      <span>Required</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeFormField(i)}
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
                    onChange={(e) => updateFormField(i, 'placeholder', e.target.value)}
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
            onClick={addFormField}
            className="w-full py-2.5 border-dashed font-bold"
          >
            + Add Another Custom Questionnaire Question
          </Button>

          {/* Step 3 Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCurrentStep(2)}
            >
              ← Back
            </Button>
            <Button
              variant="dark"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => setCurrentStep(4)}
              className="font-bold shadow-xs"
            >
              Continue to Credentials Setup →
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: DIGITAL CREDENTIALS (OPTIONAL) ── */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg font-black text-stone-900">
              Step 4: Digital Credentials & Badges (Optional)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Decide whether to auto-issue verified cryptographic badges and tamper-proof certificates upon conclusion.
            </p>
          </div>

          {/* Toggle Card */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="block text-sm font-black text-stone-900">
                Award Verified Digital Badges & Certificates
              </span>
              <span className="block text-xs text-stone-500">
                Automatically mint Gold, Silver, and Bronze badges and winner certificates into athlete portfolios.
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={credentialsEnabled}
                onChange={(e) => setCredentialsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {!credentialsEnabled ? (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 space-y-2">
              <span className="text-xs font-black flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-700" />
                <span>Pure Tournament Mode Active</span>
              </span>
              <p className="text-xs text-stone-600 leading-relaxed">
                This tournament will manage match progression, timetable fixtures, live scores, and official standings without requiring digital certificates or badges. Perfect for internal leagues, scholastic trials, or competitions managing physical trophies.
              </p>
            </div>
          ) : (
            /* Badge Selection */
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gold */}
                <div className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50/30 space-y-1.5">
                  <span className="text-xs font-black text-amber-900 block">🥇 1st Place Gold Medal</span>
                  <select
                    value={goldBadgeId}
                    onChange={(e) => setGoldBadgeId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="">-- Choose Gold Badge --</option>
                    {badges.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Silver */}
                <div className="p-3.5 rounded-2xl border border-stone-300 bg-stone-50/50 space-y-1.5">
                  <span className="text-xs font-black text-stone-700 block">🥈 2nd Place Silver Medal</span>
                  <select
                    value={silverBadgeId}
                    onChange={(e) => setSilverBadgeId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="">-- Choose Silver Badge --</option>
                    {badges.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Bronze */}
                <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/20 space-y-1.5">
                  <span className="text-xs font-black text-amber-800 block">🥉 3rd Place Bronze Medal</span>
                  <select
                    value={bronzeBadgeId}
                    onChange={(e) => setBronzeBadgeId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="">-- Choose Bronze Badge --</option>
                    {badges.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Certificate Template */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider">
                  Winner Certificate Template
                </label>
                <select
                  value={certTemplate}
                  onChange={(e) => setCertTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
                >
                  <option value="MODERN_GOLD">Modern Gold Champion Certificate</option>
                  <option value="CLASSIC_NAVY">Classic Athletic Navy Certificate</option>
                  <option value="MINIMAL_DARK">Minimal Dark Arena Certificate</option>
                  {templates.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 4 Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCurrentStep(3)}
            >
              ← Back
            </Button>
            <Button
              variant="dark"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => setCurrentStep(5)}
              className="font-bold shadow-xs"
            >
              Review & Launch Tournament →
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 5: REVIEW & LAUNCH ── */}
      {currentStep === 5 && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-xl font-black text-stone-900">
              Step 5: Review & Official Launch
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Confirm all tournament parameters before publishing to the Arena Hub.
            </p>
          </div>

          {/* Summary Card */}
          <div className="p-6 rounded-3xl bg-stone-50 border border-stone-200 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-900 text-xs font-black uppercase">
                {category} · {getEffectiveDiscipline()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-xs font-bold">
                {competitionType === 'TEAM' ? `Teams (${teamSize}v${teamSize})` : 'Individual Solo'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-xs font-bold">
                {format}
              </span>
            </div>

            <h3 className="text-2xl font-black text-stone-900">
              {title}
            </h3>

            {description && (
              <p className="text-xs text-stone-600 leading-relaxed">
                {description}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-200 text-xs text-stone-600 font-semibold">
              <div>
                <span className="block text-[10px] text-stone-400 uppercase font-black">Dates</span>
                <span>{startDate} to {endDate}</span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-400 uppercase font-black">Venue</span>
                <span className="truncate block">{venue}</span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-400 uppercase font-black">Capacity</span>
                <span>{maxParticipants} {competitionType === 'TEAM' ? 'Teams' : 'Athletes'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-400 uppercase font-black">Digital Credentials</span>
                <span className={credentialsEnabled ? 'text-emerald-700 font-bold' : 'text-stone-500 font-bold'}>
                  {credentialsEnabled ? '✓ Enabled' : '— Disabled (Pure Mode)'}
                </span>
              </div>
            </div>
          </div>

          {/* Step 5 Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCurrentStep(4)}
            >
              ← Back
            </Button>
            <Button
              variant="gold"
              size="lg"
              loading={loading}
              onClick={handleLaunchTournament}
              className="font-black shadow-md hover:scale-105 transition-all"
            >
              Official Launch Tournament 🚀
            </Button>
          </div>
        </div>
      )}

      {/* ── MODAL: POST-LAUNCH SUCCESS ── */}
      <Modal
        isOpen={postLaunchModalOpen}
        onClose={() => {
          setPostLaunchModalOpen(false);
          if (createdTournament?.id) navigate(`/tournaments/${createdTournament.id}`);
        }}
        title="Tournament Published Successfully!"
        size="md"
      >
        <div className="text-center space-y-5 py-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto text-3xl font-black shadow-md ring-4 ring-amber-100">
            🏆
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-stone-900">
              {createdTournament?.title || 'Tournament Published!'}
            </h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto">
              Your competition is now live on the Arena Hub. Share the public registration link with competitors or manage your roster in the organizer workspace.
            </p>
          </div>

          {/* Public Link Box */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-left space-y-1.5">
            <span className="text-[10px] uppercase font-black text-stone-400 block">
              Shareable Public Registration Link
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/tournaments/${createdTournament?.id}/register`}
                className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white rounded-xl border border-stone-300 text-stone-800 select-all"
              />
              <Button
                size="sm"
                variant="secondary"
                icon={Copy}
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/tournaments/${createdTournament?.id}/register`);
                  showToast('Registration link copied!', 'success');
                }}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="gold"
              onClick={() => {
                setPostLaunchModalOpen(false);
                navigate(`/tournaments/${createdTournament.id}`);
              }}
              className="w-full sm:w-auto font-black shadow-md"
            >
              Open Organizer Workspace →
            </Button>
            <Button
              variant="dark"
              onClick={() => {
                setPostLaunchModalOpen(false);
                navigate('/tournaments');
              }}
              className="w-full sm:w-auto font-bold"
            >
              Tournament Hub
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
