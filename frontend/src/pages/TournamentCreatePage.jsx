import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Eye,
  Copy,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  QrCode,
  Share2,
  Check,
  Flame,
  Zap,
  Building2,
  Sliders,
  Clock
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import Modal from '../components/ui/Modal';
import { createTournament } from '../api/tournamentsApi';
import { getAllBadges } from '../api/badgesApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Preset Sport Categories with Icons & Form defaults
const SPORT_CATEGORIES = [
  { id: 'Track & Field', name: 'Track & Field', icon: '🏃', preset: 'ATHLETICS' },
  { id: 'Football', name: 'Football / Soccer', icon: '⚽', preset: 'FOOTBALL' },
  { id: 'Badminton', name: 'Badminton', icon: '🏸', preset: 'ATHLETICS' },
  { id: 'Esports', name: 'Esports Gaming', icon: '🎮', preset: 'ESPORTS' },
  { id: 'Swimming', name: 'Swimming', icon: '🏊', preset: 'ATHLETICS' },
  { id: 'Basketball', name: 'Basketball', icon: '🏀', preset: 'FOOTBALL' },
  { id: 'Tennis', name: 'Tennis', icon: '🎾', preset: 'ATHLETICS' },
  { id: 'Cricket', name: 'Cricket', icon: '🏏', preset: 'FOOTBALL' },
];

// Preset Question Form Templates for different disciplines
const PRESET_TEMPLATES = {
  ATHLETICS: [
    { id: 'bib_number', label: 'Bib / Chest Number', type: 'text', required: true, placeholder: 'e.g. 101' },
    { id: 'age_category', label: 'Age Division', type: 'select', required: true, options: ['Under-18', 'Senior Elite (18-29)', 'Masters (30+)'], placeholder: 'Select Division' },
    { id: 'personal_best', label: 'Official Personal Best / Seeding Time', type: 'text', required: false, placeholder: 'e.g. 10.18s' },
    { id: 'medical_clearance', label: 'Certified Medically Fit to Compete', type: 'checkbox', required: true, placeholder: 'Certified' },
  ],
  FOOTBALL: [
    { id: 'jersey_number', label: 'Jersey Number', type: 'number', required: true, placeholder: 'e.g. 9' },
    { id: 'preferred_position', label: 'Preferred Position', type: 'select', required: true, options: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'], placeholder: 'Select Position' },
    { id: 'team_name', label: 'Club / Academy Affiliation', type: 'text', required: true, placeholder: 'e.g. Athlos FC' },
    { id: 'captain_status', label: 'Team Captain / Vice Captain', type: 'checkbox', required: false, placeholder: 'Yes, Captain' },
  ],
  ESPORTS: [
    { id: 'gamer_tag', label: 'In-Game Nickname / Gamertag', type: 'text', required: true, placeholder: 'e.g. ShadowStriker' },
    { id: 'discord_handle', label: 'Discord Tag / Contact', type: 'text', required: true, placeholder: 'e.g. player#1234' },
    { id: 'competitive_rank', label: 'Current Competitive Rank / Tier', type: 'select', required: true, options: ['Diamond', 'Master', 'Grandmaster', 'Challenger / Pro'], placeholder: 'Select Rank' },
  ],
  GENERAL: [
    { id: 'participant_id', label: 'Athlete Identification #', type: 'text', required: true, placeholder: 'e.g. ATH-9821' },
    { id: 'tshirt_size', label: 'Official Jersey / T-Shirt Size', type: 'select', required: false, options: ['S', 'M', 'L', 'XL', 'XXL'], placeholder: 'Select Size' },
    { id: 'emergency_contact', label: 'Emergency Contact Person & Phone', type: 'text', required: true, placeholder: 'Name & Phone #' },
  ],
};

const FORMAT_OPTIONS = [
  { id: 'Single Elimination Knockout', label: 'Single Elimination', desc: 'Fast-paced bracket where winners advance and losers drop out.' },
  { id: 'Sprint Heats / Time Trials', label: 'Heats & Time Trials', desc: 'Athletes run timed qualifying heats; top times contest the Grand Final.' },
  { id: 'Round Robin League', label: 'Round Robin', desc: 'Every competitor plays every other competitor in a points table.' },
  { id: 'Group Stage + Playoffs', label: 'Groups + Playoffs', desc: 'Top qualifiers from each group advance to elimination finals.' },
];

export default function TournamentCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isInstitution, currentUser } = useAuth();

  // 5-Step Guided Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [availableBadges, setAvailableBadges] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Success Launchpad Modal
  const [createdTournament, setCreatedTournament] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  // Step 1: Basic Info & Sport
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('Track & Field');
  const [format, setFormat] = useState('Single Elimination Knockout');
  const [description, setDescription] = useState('');

  // Step 2: Schedule & Capacity
  const [venue, setVenue] = useState('National Athletic Arena');
  const [startDate, setStartDate] = useState('2026-11-20');
  const [endDate, setEndDate] = useState('2026-11-22');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-11-19');
  const [maxParticipants, setMaxParticipants] = useState(16);

  // Step 3: Registration Form Builder
  const [customFields, setCustomFields] = useState(PRESET_TEMPLATES.ATHLETICS);

  // Step 4: Badges & Certificates
  const [linkedBadgeGoldId, setLinkedBadgeGoldId] = useState('');
  const [linkedBadgeSilverId, setLinkedBadgeSilverId] = useState('');
  const [linkedBadgeBronzeId, setLinkedBadgeBronzeId] = useState('');
  const [linkedCertificateTemplate, setLinkedCertificateTemplate] = useState('CHAMPIONSHIP_GOLD');
  const [awardParticipationCerts, setAwardParticipationCerts] = useState(true);

  useEffect(() => {
    setLoadingBadges(true);
    getAllBadges()
      .then((res) => {
        const badges = res.data || [];
        setAvailableBadges(badges);
        const gold = badges.find((b) => b.rank === 1);
        const silver = badges.find((b) => b.rank === 2);
        const bronze = badges.find((b) => b.rank === 3);
        if (gold) setLinkedBadgeGoldId(gold.id);
        if (silver) setLinkedBadgeSilverId(silver.id);
        if (bronze) setLinkedBadgeBronzeId(bronze.id);
      })
      .catch(() => setAvailableBadges([]))
      .finally(() => setLoadingBadges(false));
  }, []);

  // Quick preset loader
  const handleApplyPreset = (presetKey) => {
    if (PRESET_TEMPLATES[presetKey]) {
      setCustomFields(JSON.parse(JSON.stringify(PRESET_TEMPLATES[presetKey])));
      showToast(`Loaded ${presetKey.toLowerCase()} questions template`, 'info');
    }
  };

  // Add custom question
  const handleAddField = () => {
    const newId = `custom_field_${Date.now()}`;
    const newField = {
      id: newId,
      label: 'New Question',
      type: 'text',
      required: false,
      placeholder: 'Enter answer...',
      options: ['Option 1', 'Option 2'],
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const handleUpdateField = (index, key, val) => {
    setCustomFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });
  };

  const handleDeleteField = (index) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddOption = (fieldIndex) => {
    setCustomFields((prev) => {
      const copy = [...prev];
      const opts = copy[fieldIndex].options || [];
      copy[fieldIndex] = {
        ...copy[fieldIndex],
        options: [...opts, `Option ${opts.length + 1}`],
      };
      return copy;
    });
  };

  const handleDeleteOption = (fieldIndex, optIndex) => {
    setCustomFields((prev) => {
      const copy = [...prev];
      const opts = copy[fieldIndex].options.filter((_, i) => i !== optIndex);
      copy[fieldIndex] = { ...copy[fieldIndex], options: opts };
      return copy;
    });
  };

  // Step Validation before advancing
  const canProceedStep = () => {
    if (currentStep === 1) {
      return title.trim().length > 0 && sport.trim().length > 0;
    }
    if (currentStep === 2) {
      return venue.trim().length > 0 && startDate && endDate;
    }
    return true;
  };

  // Final Submit
  const handleCreateTournament = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title.trim() || !sport.trim()) {
      showToast('Please provide a tournament title and sport category.', 'error');
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        sport: sport.trim(),
        format: format.trim(),
        venue: venue.trim(),
        startDate,
        endDate,
        registrationDeadline,
        maxParticipants: Number(maxParticipants) || 16,
        customFormSchema: JSON.stringify(customFields),
        linkedBadgeGoldId: linkedBadgeGoldId ? Number(linkedBadgeGoldId) : null,
        linkedBadgeSilverId: linkedBadgeSilverId ? Number(linkedBadgeSilverId) : null,
        linkedBadgeBronzeId: linkedBadgeBronzeId ? Number(linkedBadgeBronzeId) : null,
        linkedCertificateTemplate,
      };

      const res = await createTournament(payload);
      setCreatedTournament(res.data);
      setSuccessModalOpen(true);
      showToast('Tournament successfully published on the official registry!', 'success');
    } catch (err) {
      console.error('Failed to create tournament:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to create tournament', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stepsMeta = [
    { num: 1, label: 'Discipline & Event', subtitle: 'Title, sport & format' },
    { num: 2, label: 'Schedule & Venue', subtitle: 'Dates & capacity' },
    { num: 3, label: 'Registration Form', subtitle: 'Google Forms builder' },
    { num: 4, label: 'Medals & Awards', subtitle: 'Badges & certificates' },
    { num: 5, label: 'Review & Launch', subtitle: 'Final verification' },
  ];

  if (!isInstitution) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <Card className="p-8 sm:p-10 border border-stone-200/90 shadow-2xl text-center space-y-6 bg-white">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center mx-auto shadow-xs">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-stone-900">
              Institution Accreditation Required
            </h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              Tournament organization, credential issuance, and official fixture hosting are reserved for verified academies and federations.
            </p>
          </div>
          <Button
            variant="dark"
            size="lg"
            className="w-full"
            onClick={() => navigate('/login', { state: { mode: 'institution' } })}
          >
            Sign In to Institution Gateway
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">

      {/* ── TOP HEADER ── */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/tournaments"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="Return to Tournaments"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 border border-amber-500/20">
                Organizer Wizard
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs font-bold text-stone-500">End-to-End Workflow</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-600" />
              <span>Create Official Tournament</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Eye}
            onClick={() => setPreviewModalOpen(true)}
            className="font-bold border-stone-300"
          >
            Preview Athlete Form
          </Button>
        </div>
      </div>

      {/* ── STEPPER PROGRESS BAR ── */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-5 gap-2">
          {stepsMeta.map((s) => {
            const isCompleted = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < currentStep || canProceedStep()) {
                    setCurrentStep(s.num);
                  }
                }}
                className={`text-left p-2 rounded-xl transition-all border ${
                  isCurrent
                    ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-amber-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                  </span>
                  <span
                    className={`text-xs font-black truncate ${
                      isCurrent ? 'text-amber-950' : isCompleted ? 'text-emerald-950' : 'text-stone-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 hidden sm:block truncate pl-6">
                  {s.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STEP CONTENT AREA ── */}
      <div className="space-y-6">

        {/* ── STEP 1: EVENT DETAILS & SPORT DISCIPLINE ── */}
        {currentStep === 1 && (
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <span>Step 1: Event Details & Sport Discipline</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Name your competition, select the official discipline, and define the bracket format.
              </p>
            </div>

            <div className="space-y-5">
              <Input
                label="Tournament Title *"
                placeholder="e.g. Athlos National Track & Field Championship 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {/* Sport Category Selection Grid */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-stone-800">
                  Select Sport Discipline *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SPORT_CATEGORIES.map((s) => {
                    const isSelected = sport === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSport(s.id);
                          handleApplyPreset(s.preset);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 group ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 text-amber-950 font-black shadow-xs ring-2 ring-amber-500/20'
                            : 'border-stone-200 hover:border-amber-300 bg-stone-50/50 hover:bg-stone-50 text-stone-700 font-bold'
                        }`}
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">
                          {s.icon}
                        </span>
                        <span className="text-xs truncate">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tournament Format Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-stone-800">
                  Tournament Format *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FORMAT_OPTIONS.map((f) => {
                    const isSelected = format === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormat(f.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all space-y-1 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20'
                            : 'border-stone-200 hover:border-stone-300 bg-stone-50/30 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black ${isSelected ? 'text-amber-950' : 'text-stone-900'}`}>
                            {f.label}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-amber-600" />
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          {f.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <TextArea
                label="Tournament Description & Competition Rules"
                placeholder="Detail the eligibility guidelines, reporting schedule, scoring rules, and gear guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: SCHEDULE & CAPACITY ── */}
        {currentStep === 2 && (
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-black text-stone-900">
                Step 2: Dates, Schedule & Athlete Capacity
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Set venue location, competition dates, registration deadline, and max player slots.
              </p>
            </div>

            <div className="space-y-5">
              <Input
                label="Venue / Stadium / Arena Location *"
                placeholder="e.g. National Athletic Stadium - Arena Track 4"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Tournament Start Date *"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  label="Tournament End Date *"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Athlete Registration Deadline"
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-stone-800">
                    Maximum Participant Capacity
                  </label>
                  <div className="flex items-center gap-2">
                    {[8, 16, 32, 64].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setMaxParticipants(size)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          maxParticipants === size
                            ? 'border-amber-500 bg-amber-50 text-amber-950 font-black shadow-xs'
                            : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {size} Slots
                      </button>
                    ))}
                    <input
                      type="number"
                      min="2"
                      max="512"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      className="w-20 px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: REGISTRATION FORM BUILDER ── */}
        {currentStep === 3 && (
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-stone-900">
                  Step 3: Custom Registration Form (Google Forms Style)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Customize the exact fields and questions athletes must answer when registering.
                </p>
              </div>

              {/* 1-Click Preset Loaders */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ATHLETICS')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                >
                  🏃 Athletics
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FOOTBALL')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800"
                >
                  ⚽ Football
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ESPORTS')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800"
                >
                  🎮 Esports
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('GENERAL')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800"
                >
                  📋 General
                </button>
              </div>
            </div>

            {/* Standard Defaults Note */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Standard fields (Athlete Full Name, Email Address, and Phone Number) are automatically captured on every registration.</span>
            </div>

            {/* Questions List */}
            <div className="space-y-3.5">
              {customFields.map((field, idx) => (
                <div
                  key={field.id || idx}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-amber-400 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                      <span className="w-6 h-6 rounded-lg bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                        placeholder="Question title (e.g. Bib Number, Jersey Size...)"
                        className="flex-1 font-bold text-stone-900 text-sm bg-transparent border-b border-dashed border-stone-300 focus:border-amber-500 focus:outline-none px-1 py-0.5"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <select
                        value={field.type}
                        onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-stone-300 bg-white text-stone-800 focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="text">Short Text</option>
                        <option value="number">Number</option>
                        <option value="select">Dropdown Choices</option>
                        <option value="checkbox">Checkbox (Yes/No)</option>
                      </select>

                      <label className="flex items-center gap-1 text-xs font-semibold text-stone-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleUpdateField(idx, 'required', e.target.checked)}
                          className="rounded border-stone-300 text-stone-900 focus:ring-amber-500"
                        />
                        <span>Required</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleDeleteField(idx)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="pl-8 space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                        Options:
                      </span>
                      <div className="flex flex-wrap gap-2 items-center">
                        {(field.options || []).map((opt, optIdx) => (
                          <span
                            key={optIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-800"
                          >
                            <span>{opt}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(idx, optIdx)}
                              className="text-stone-400 hover:text-rose-600 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddOption(idx)}
                          className="px-2 py-1 rounded-lg bg-stone-200 hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-xs font-bold transition-colors"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}

                  {field.type !== 'select' && field.type !== 'checkbox' && (
                    <div className="pl-8">
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => handleUpdateField(idx, 'placeholder', e.target.value)}
                        placeholder="Hint placeholder for athlete..."
                        className="w-full text-xs text-stone-500 bg-transparent border-b border-stone-200 focus:border-stone-400 focus:outline-none px-1 py-0.5"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={handleAddField}
              className="w-full py-2.5 font-bold border-dashed border-stone-300 hover:border-amber-500"
            >
              Add Custom Question
            </Button>
          </div>
        )}

        {/* ── STEP 4: MEDALS & CERTIFICATES ── */}
        {currentStep === 4 && (
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-black text-stone-900">
                Step 4: Link Official Medals & Certificate Templates
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Connect verified athlete badges and cryptographic certificate templates to be conferred upon tournament conclusion.
              </p>
            </div>

            <div className="space-y-6">
              {/* Podium Medals linking */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-stone-800">
                  Podium Badges (Conferred to Athlete Social Profiles)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 1st Place Gold */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                      <span>🥇 1st Place Gold Medal</span>
                    </div>
                    <select
                      value={linkedBadgeGoldId}
                      onChange={(e) => setLinkedBadgeGoldId(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs font-bold rounded-xl border border-amber-300 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="">-- Auto-Generate Gold Medal --</option>
                      {availableBadges.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} (Rank #{b.rank})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2nd Place Silver */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-stone-800">
                      <span>🥈 2nd Place Silver Medal</span>
                    </div>
                    <select
                      value={linkedBadgeSilverId}
                      onChange={(e) => setLinkedBadgeSilverId(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="">-- Auto-Generate Silver Medal --</option>
                      {availableBadges.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} (Rank #{b.rank})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3rd Place Bronze */}
                  <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-800">
                      <span>🥉 3rd Place Bronze Medal</span>
                    </div>
                    <select
                      value={linkedBadgeBronzeId}
                      onChange={(e) => setLinkedBadgeBronzeId(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs font-bold rounded-xl border border-amber-200 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="">-- Auto-Generate Bronze Medal --</option>
                      {availableBadges.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} (Rank #{b.rank})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Certificate Template Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-stone-800">
                    Official Certificate Style
                  </label>
                  <Link
                    to="/certificates/create"
                    target="_blank"
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                  >
                    <span>Design custom in Creator Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'CHAMPIONSHIP_GOLD', name: 'Imperial Gold Luxury', desc: 'Filigree gold border, gold medal seal & watermark' },
                    { id: 'EXECUTIVE_MEDAL', name: 'Royal Silver Medalist', desc: 'Precision silver double frame with official laurel wreath' },
                    { id: 'CLASSIC_VERIFIED', name: 'Emerald Crest Diploma', desc: 'Formal academic green border with verification QR seal' },
                  ].map((tmpl) => {
                    const isSelected = linkedCertificateTemplate === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setLinkedCertificateTemplate(tmpl.id)}
                        className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-stone-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-stone-900">{tmpl.name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </div>
                        <p className="text-[11px] text-stone-500 leading-relaxed">{tmpl.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Participation Certificate Toggle */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    Auto-Issue Official Participation Credentials
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Every athlete who competes will receive an authentic verified certificate recorded on the public registry.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={awardParticipationCerts}
                  onChange={(e) => setAwardParticipationCerts(e.target.checked)}
                  className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: REVIEW & PUBLISH ── */}
        {currentStep === 5 && (
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Step 5: Review & Publish Official Tournament</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Verify all tournament details before opening public registrations on the platform.
              </p>
            </div>

            {/* Comprehensive Review Card */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    {sport}
                  </span>
                  <h3 className="text-xl font-black text-stone-900 mt-1">
                    {title || 'Untitled Tournament'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Format: <span className="font-bold text-stone-700">{format}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-stone-500 block">Maximum Capacity</span>
                  <span className="text-lg font-black text-stone-900">{maxParticipants} Athletes</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-stone-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" /> Competition Dates
                  </span>
                  <p className="font-black text-stone-800">{startDate} to {endDate}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-stone-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" /> Official Venue
                  </span>
                  <p className="font-black text-stone-800">{venue}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-stone-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" /> Registration Deadline
                  </span>
                  <p className="font-black text-stone-800">{registrationDeadline || 'Open until event'}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-stone-500 block mb-1">
                    Custom Registration Questions ({customFields.length}):
                  </span>
                  <ul className="list-disc list-inside text-stone-700 space-y-0.5">
                    {customFields.slice(0, 4).map((f, i) => (
                      <li key={i} className="truncate">
                        {f.label} {f.required && <span className="text-rose-500 font-bold">*</span>}
                      </li>
                    ))}
                    {customFields.length > 4 && (
                      <li className="text-stone-400 italic">+{customFields.length - 4} more questions</li>
                    )}
                  </ul>
                </div>

                <div>
                  <span className="font-bold text-stone-500 block mb-1">Awards & Credentials:</span>
                  <p className="text-stone-700">🥇 Gold, 🥈 Silver, 🥉 Bronze Badges linked</p>
                  <p className="text-stone-700">📜 Official Certificate: <span className="font-bold">{linkedCertificateTemplate}</span></p>
                  {awardParticipationCerts && (
                    <p className="text-emerald-700 font-bold mt-1">✓ Participation certificates to all athletes</p>
                  )}
                </div>
              </div>
            </div>

            {description && (
              <div className="p-4 rounded-xl bg-white border border-stone-200 text-xs text-stone-600">
                <span className="font-bold text-stone-800 block mb-1">Guidelines:</span>
                <p className="line-clamp-3 leading-relaxed">{description}</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── BOTTOM NAVIGATION CONTROLS ── */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={ArrowLeft}
            onClick={() => setCurrentStep((prev) => prev - 1)}
          >
            Previous Step
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate('/tournaments')}
          >
            Cancel
          </Button>
        )}

        {currentStep < totalSteps ? (
          <Button
            type="button"
            variant="dark"
            size="md"
            disabled={!canProceedStep()}
            onClick={() => setCurrentStep((prev) => prev + 1)}
            className="flex items-center gap-1.5 font-bold"
          >
            <span>Next: {stepsMeta[currentStep].label}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="gold"
            size="lg"
            loading={submitting}
            icon={Trophy}
            onClick={handleCreateTournament}
            className="font-black shadow-lg hover:scale-105"
          >
            🚀 Launch Tournament & Open Registration
          </Button>
        )}
      </div>

      {/* ── PREVIEW ATHLETE GOOGLE FORM MODAL ── */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Live Preview: Athlete Registration Form"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1">
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
              {title || 'Tournament Name Preview'}
            </h4>
            <p className="text-xs text-stone-600 font-medium">
              This is the exact Google-Form-style registration page presented to athletes.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">Athlete Full Name *</label>
              <input disabled placeholder="Indrajeet Patil" className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">Email Address *</label>
              <input disabled placeholder="athlete@example.com" className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs" />
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
              Custom Questions:
            </span>
            {customFields.map((f, i) => (
              <div key={i} className="space-y-1">
                <label className="text-xs font-bold text-stone-800">
                  {f.label} {f.required && <span className="text-rose-500">*</span>}
                </label>
                {f.type === 'select' ? (
                  <select disabled className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs">
                    {(f.options || []).map((opt, oi) => (
                      <option key={oi}>{opt}</option>
                    ))}
                  </select>
                ) : f.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-xs text-stone-700 font-medium">
                    <input type="checkbox" disabled checked />
                    <span>{f.placeholder || f.label}</span>
                  </label>
                ) : (
                  <input disabled placeholder={f.placeholder} className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs" />
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end">
            <Button
              type="button"
              variant="dark"
              size="sm"
              onClick={() => setPreviewModalOpen(false)}
            >
              Done Previewing
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── TOURNAMENT LAUNCHPAD SUCCESS MODAL ── */}
      {createdTournament && (
        <Modal
          isOpen={successModalOpen}
          onClose={() => navigate(`/tournaments/${createdTournament.id}`)}
          title="🏆 Tournament Successfully Launched!"
          size="lg"
        >
          <div className="space-y-5 text-center p-2">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-stone-900">
                {createdTournament.title}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Your tournament is registered on the Athlos platform. Registrations are open, and your Organizer Command Center is ready.
              </p>
            </div>

            {/* Shareable Link Box */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-left">
              <label className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                Public Athlete Registration Link:
              </label>
              <div className="flex items-center gap-2 bg-white rounded-xl border border-amber-300 p-1.5 shadow-2xs">
                <input
                  readOnly
                  value={`${window.location.origin}/tournaments/${createdTournament.id}/register`}
                  className="flex-1 px-2 text-xs font-mono font-bold text-stone-800 bg-transparent focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="gold"
                  icon={Copy}
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/tournaments/${createdTournament.id}/register`);
                    showToast('Registration link copied to clipboard!', 'success');
                  }}
                  className="font-bold text-xs"
                >
                  Copy Link
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="dark"
                size="lg"
                icon={Trophy}
                onClick={() => navigate(`/tournaments/${createdTournament.id}`)}
                className="w-full font-black shadow-md"
              >
                Open Organizer Workspace →
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={ExternalLink}
                onClick={() => window.open(`/tournaments/${createdTournament.id}/register`, '_blank')}
                className="w-full font-bold"
              >
                Preview Registration Page
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
