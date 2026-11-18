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
  HelpCircle,
  Copy,
  ChevronDown,
  Layers,
  Settings
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

// Preset Question Form Templates for different sports
const PRESET_TEMPLATES = {
  ATHLETICS: [
    { id: 'bib_number', label: 'Bib / Chest Number', type: 'text', required: true, placeholder: 'e.g. 101' },
    { id: 'age_category', label: 'Age Division', type: 'select', required: true, options: ['Under-18', 'Senior Elite (18-29)', 'Masters (30+)'], placeholder: 'Select Division' },
    { id: 'personal_best', label: 'Official 100m Personal Best (seconds)', type: 'text', required: false, placeholder: 'e.g. 10.18s' },
    { id: 'medical_clearance', label: 'Certified Medically Fit to Compete', type: 'checkbox', required: true, placeholder: 'Certified' },
  ],
  FOOTBALL: [
    { id: 'jersey_number', label: 'Jersey Number', type: 'number', required: true, placeholder: 'e.g. 9' },
    { id: 'preferred_position', label: 'Preferred Position', type: 'select', required: true, options: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'], placeholder: 'Select Position' },
    { id: 'team_name', label: 'Club / Academy Name', type: 'text', required: true, placeholder: 'e.g. Athlos FC' },
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

export default function TournamentCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isInstitution } = useAuth();

  const [availableBadges, setAvailableBadges] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('Track & Field');
  const [format, setFormat] = useState('Single Elimination Knockout');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('National Athletic Arena');
  const [startDate, setStartDate] = useState('2026-11-20');
  const [endDate, setEndDate] = useState('2026-11-22');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-11-19');
  const [maxParticipants, setMaxParticipants] = useState(16);

  // Google-Forms Custom Questions Builder
  const [customFields, setCustomFields] = useState(PRESET_TEMPLATES.ATHLETICS);

  // Linked Badges & Certificates
  const [linkedBadgeGoldId, setLinkedBadgeGoldId] = useState('');
  const [linkedBadgeSilverId, setLinkedBadgeSilverId] = useState('');
  const [linkedBadgeBronzeId, setLinkedBadgeBronzeId] = useState('');
  const [linkedCertificateTemplate, setLinkedCertificateTemplate] = useState('CHAMPIONSHIP_GOLD');

  useEffect(() => {
    setLoadingBadges(true);
    getAllBadges()
      .then((res) => {
        const badges = res.data || [];
        setAvailableBadges(badges);
        // Pre-select badges by rank if available
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

  // Preset Template Loader
  const handleApplyPreset = (presetKey) => {
    if (PRESET_TEMPLATES[presetKey]) {
      setCustomFields(JSON.parse(JSON.stringify(PRESET_TEMPLATES[presetKey])));
      showToast(`Loaded ${presetKey.toLowerCase()} form questions template`, 'info');
    }
  };

  // Add a new custom question (Google Forms style)
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

  // Update existing custom question
  const handleUpdateField = (index, key, val) => {
    setCustomFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });
  };

  // Delete custom question
  const handleDeleteField = (index) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Add an option to select dropdown
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

  // Delete an option from select dropdown
  const handleDeleteOption = (fieldIndex, optIndex) => {
    setCustomFields((prev) => {
      const copy = [...prev];
      const opts = copy[fieldIndex].options.filter((_, i) => i !== optIndex);
      copy[fieldIndex] = { ...copy[fieldIndex], options: opts };
      return copy;
    });
  };

  // Submit & Create Tournament
  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!title.trim() || !sport.trim()) {
      showToast('Please provide a tournament title and sport category.', 'error');
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
      showToast('Tournament created and live in Organizer Workspace!', 'success');
      navigate(`/tournaments/${res.data.id}`);
    } catch (err) {
      console.error('Failed to create tournament:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to create tournament', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/tournaments"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-600" />
              <span>Organize a Tournament</span>
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Event details, registration fields, and verified awards.
            </p>
          </div>
        </div>

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

      <form onSubmit={handleCreateTournament} className="space-y-6">

        {/* ── SECTION 1: TOURNAMENT ESSENTIALS ── */}
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center font-bold">
                <Trophy className="w-4 h-4 text-amber-700" />
              </div>
              <h2 className="text-base font-black text-stone-900">
                1. Tournament Details & Schedule
              </h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
              Required
            </span>
          </div>

          <div className="space-y-4">
            <Input
              label="Tournament Title"
              placeholder="e.g. Game City Athletics Championship 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">
                  Sport / Discipline
                </label>
                <select
                  value={sport}
                  onChange={(e) => {
                    setSport(e.target.value);
                    if (e.target.value === 'Football') handleApplyPreset('FOOTBALL');
                    else if (e.target.value === 'Esports') handleApplyPreset('ESPORTS');
                    else if (e.target.value === 'Track & Field') handleApplyPreset('ATHLETICS');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Track & Field">Track & Field / Athletics</option>
                  <option value="Football">Football / Soccer</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Esports">Competitive Esports</option>
                  <option value="Swimming">Swimming</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Cricket">Cricket</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">
                  Tournament Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Single Elimination Knockout">Single Elimination Knockout</option>
                  <option value="Sprint Heats / Time Trials">Sprint Heats / Time Trials</option>
                  <option value="Round Robin League">Round Robin League</option>
                  <option value="Group Stage + Playoffs">Group Stage + Playoffs</option>
                </select>
              </div>
            </div>

            <TextArea
              label="Tournament Description & Competition Guidelines"
              placeholder="Provide event overview, rules, reporting times, equipment requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Venue / Arena / Court"
                placeholder="e.g. National Athletic Stadium, Track 4"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Registration Deadline"
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
              />

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">
                  Maximum Athlete Capacity
                </label>
                <input
                  type="number"
                  min="4"
                  max="256"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: GOOGLE-FORMS STYLE CUSTOM QUESTIONS BUILDER ── */}
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-800 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <h2 className="text-base font-black text-stone-900">
                  2. Custom Registration Form
                </h2>
              </div>
            </div>

            {/* 1-Click Preset Loaders */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('ATHLETICS')}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
              >
                Athletics
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('FOOTBALL')}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800"
              >
                Football
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('ESPORTS')}
                className="px-2 py-1 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800"
              >
                Esports
              </button>
            </div>
          </div>

          {/* Standard Fields Reminder Note */}
          <div className="py-1 px-2 text-xs text-stone-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Athlete Name, Email, and Phone captured by default.</span>
          </div>

          {/* Dynamic Question Cards List */}
          <div className="space-y-3.5">
            {customFields.map((field, idx) => (
              <div
                key={field.id || idx}
                className="p-4 rounded-2xl bg-[#FCFCFA] border border-stone-200 hover:border-amber-400 transition-all space-y-3 relative group"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <span className="w-6 h-6 rounded-lg bg-stone-200/80 text-stone-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                      placeholder="Question / Field Title (e.g. Bib Number)"
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
                      <option value="select">Dropdown Choice</option>
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
                      title="Remove Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-inputs depending on field type */}
                {field.type === 'select' && (
                  <div className="pl-8 space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                      Dropdown Options:
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
                        className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-xs font-bold transition-colors"
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
                      placeholder="Hint / Placeholder for athlete..."
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
            Add Custom Question / Field
          </Button>
        </div>

        {/* ── SECTION 3: LINKING OFFICIAL BADGES & CERTIFICATES ── */}
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center font-bold">
              <Award className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900">
                3. Link Official Badges & Certificates
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* 1st Place Gold */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                <span>🥇 1st Place Gold Medal</span>
              </div>
              <select
                value={linkedBadgeGoldId}
                onChange={(e) => setLinkedBadgeGoldId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-amber-300 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">-- No Badge Linked --</option>
                {availableBadges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Rank #{b.rank})
                  </option>
                ))}
              </select>
            </div>

            {/* 2nd Place Silver */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-stone-800">
                <span>🥈 2nd Place Silver Medal</span>
              </div>
              <select
                value={linkedBadgeSilverId}
                onChange={(e) => setLinkedBadgeSilverId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">-- No Badge Linked --</option>
                {availableBadges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Rank #{b.rank})
                  </option>
                ))}
              </select>
            </div>

            {/* 3rd Place Bronze */}
            <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-800">
                <span>🥉 3rd Place Bronze Medal</span>
              </div>
              <select
                value={linkedBadgeBronzeId}
                onChange={(e) => setLinkedBadgeBronzeId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-amber-200 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">-- No Badge Linked --</option>
                {availableBadges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Rank #{b.rank})
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Certificate Ledger Template
            </label>
            <select
              value={linkedCertificateTemplate}
              onChange={(e) => setLinkedCertificateTemplate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="CHAMPIONSHIP_GOLD">🏆 Championship Gold Luxury Border (Official Podium)</option>
              <option value="EXECUTIVE_MEDAL">🎖️ Executive Athletic Medalist Edition</option>
              <option value="CLASSIC_VERIFIED">📜 Classic Tamper-Proof Credential (QR Sealed)</option>
            </select>
          </div>
        </div>

        {/* ── SUBMIT BUTTON ── */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate('/tournaments')}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            loading={submitting}
            icon={Trophy}
            className="font-black shadow-lg hover:scale-105"
          >
            Launch Tournament & Open Registration →
          </Button>
        </div>

      </form>

      {/* ── LIVE PREVIEW MODAL OF ATHLETE REGISTRATION GOOGLE FORM ── */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Live Preview: Athlete Registration Form"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1">
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
              {title || 'Tournament Name'}
            </h4>
            <p className="text-xs text-stone-600 font-medium">
              This is the exact Google-Form-style registration form presented to athletes.
            </p>
          </div>

          {/* Standard Fields Preview */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">Athlete Full Name *</label>
              <input disabled placeholder="Indrajeet Patil" className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700">Email Address *</label>
              <input disabled placeholder="indrajeet@athlete.org" className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs" />
            </div>
          </div>

          {/* Custom Questions Preview */}
          <div className="pt-2 border-t border-stone-200 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
              Organizer Custom Questions:
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

    </div>
  );
}
