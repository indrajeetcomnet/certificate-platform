import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Award,
  ShieldCheck,
  Printer,
  Copy,
  Users
} from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getTournamentById, registerParticipant } from '../api/tournamentsApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function TournamentRegistrationPage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmedParticipant, setConfirmedParticipant] = useState(null);

  // Form states
  const [athleteName, setAthleteName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [customAnswers, setCustomAnswers] = useState({});

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    getTournamentById(tournamentId)
      .then((res) => {
        if (isCancelled) return;
        const t = res.data;
        setTournament(t);

        let parsed = [];
        try {
          parsed = JSON.parse(t.customFormSchema || '[]');
        } catch {
          parsed = [];
        }
        setQuestions(parsed);

        // Pre-fill if user logged in
        if (currentUser) {
          setAthleteName(currentUser?.displayName || currentUser?.username || '');
          setEmail(currentUser?.email || '');
        }
      })
      .catch((err) => {
        console.warn('Tournament fetch notice:', err.message);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [tournamentId, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!athleteName.trim() || !email.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    // Check required custom questions
    for (const q of questions) {
      if (q.required && (!customAnswers[q.label] || customAnswers[q.label].toString().trim() === '')) {
        showToast(`Please answer required question: "${q.label}"`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        userId: currentUser?.id || null,
        athleteName: athleteName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        formResponses: JSON.stringify(customAnswers),
      };

      const res = await registerParticipant(tournamentId, payload);
      setConfirmedParticipant(res.data || {
        athleteName: athleteName.trim(),
        email: email.trim(),
        id: Date.now()
      });
      setSubmitted(true);
      showToast('Registration submitted successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBF9]">
        <LoadingSpinner text="Loading tournament registration..." />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FBFBF9]">
        <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-stone-900">Tournament Not Found</h2>
          <p className="text-xs text-stone-500">
            This tournament event might have been removed or the registration link is incorrect.
          </p>
          <Button variant="dark" onClick={() => navigate('/tournaments')}>
            Browse Tournaments
          </Button>
        </div>
      </div>
    );
  }

  const registeredCount = tournament.participants?.length || 0;
  const maxSpots = tournament.maxParticipants || 64;
  const spotsLeft = Math.max(0, maxSpots - registeredCount);
  const fillPercentage = Math.min(100, Math.round((registeredCount / maxSpots) * 100));

  return (
    <div className="min-h-screen bg-[#FBFBF9] py-10 px-4 selection:bg-amber-500/20 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Navigation link back to tournament */}
        <div className="flex items-center justify-between">
          <Link
            to={`/tournaments/${tournament.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tournament Overview</span>
          </Link>
          <span className="text-[11px] font-bold text-stone-500">
            Official Athlete Registration
          </span>
        </div>

        {/* Tournament Header Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-900 text-xs font-black uppercase tracking-wider">
              🏆 {tournament.sport}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-bold">
              {tournament.format}
            </span>
            <span className="text-xs font-bold text-stone-500 ml-auto">
              Organized by <strong className="text-stone-900">{tournament.institutionName}</strong>
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {tournament.title}
            </h1>
            {tournament.description && (
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                {tournament.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-xs text-stone-600 font-semibold">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{tournament.startDate} to {tournament.endDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">{tournament.venue}</span>
            </div>
          </div>

          {/* Spots Progress Bar */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-stone-700">
                <Users className="w-3.5 h-3.5 text-stone-500" />
                <span>Roster Capacity</span>
              </span>
              <span className="text-stone-900">
                {registeredCount} / {maxSpots} Registered ({spotsLeft} spots remaining)
              </span>
            </div>
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── SUCCESS SCREEN: OFFICIAL DIGITAL ATHLETE PASS / BIB ── */}
        {submitted ? (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6 text-center">
              
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Registration Confirmed & Verified
                </span>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight pt-1">
                  You are in the Tournament!
                </h2>
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  Thank you, <strong>{athleteName}</strong>. Your entry has been recorded in the official roster. Below is your digital competitor bib.
                </p>
              </div>

              {/* ── DIGITAL COMPETITOR PASS / BIB CARD ── */}
              <div className="max-w-md mx-auto rounded-3xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white p-6 shadow-xl border-2 border-amber-500/40 relative overflow-hidden text-left space-y-5">
                
                {/* Decorative accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-[10px] font-black tracking-widest uppercase text-amber-400 block">
                        Official Athlete Pass
                      </span>
                      <span className="text-xs font-bold text-white/90 truncate block max-w-[200px]">
                        {tournament.title}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
                    {tournament.sport}
                  </span>
                </div>

                {/* Big Bib Number */}
                <div className="text-center py-2 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest block">
                    Competitor Bib
                  </span>
                  <span className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-wider">
                    #BIB-{tournament.id}-{String(confirmedParticipant?.id || Math.floor(1000 + Math.random() * 9000)).slice(-4)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-bold block">Athlete Name</span>
                    <span className="font-black text-white text-sm truncate block">{athleteName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-bold block">Status</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Roster Seeded</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-bold block">Event Venue</span>
                    <span className="font-semibold text-white/80 truncate block">{tournament.venue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-bold block">Tournament Dates</span>
                    <span className="font-semibold text-white/80 truncate block">{tournament.startDate}</span>
                  </div>
                </div>

                {/* Barcode line representation */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 font-mono">
                  <span>VERIFIED ARENA CREDENTIAL</span>
                  <span>ISSUER: {tournament.institutionName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="dark"
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                  className="w-full sm:w-auto font-black shadow-xs"
                >
                  View Tournament Arena & Fixtures →
                </Button>

                <Button
                  variant="secondary"
                  icon={Printer}
                  onClick={() => window.print()}
                  className="w-full sm:w-auto font-bold"
                >
                  Print / Save Bib
                </Button>
                
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setCustomAnswers({});
                    if (!currentUser) {
                      setAthleteName('');
                      setEmail('');
                      setPhone('');
                    }
                  }}
                  className="text-xs font-bold text-stone-500 hover:text-stone-900 px-3 py-2 transition-colors"
                >
                  Register another athlete
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* ── REGISTRATION FORM ── */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-6 sm:p-8 space-y-5">
            
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-lg font-black text-stone-900">
                Athlete Registration Details
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Please complete your details accurately for tournament matchmaking and credential issuance.
              </p>
            </div>

            {/* Standard Contact Fields */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Athlete Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={athleteName}
                onChange={(e) => setAthleteName(e.target.value)}
                placeholder="e.g. Alex Vance"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium"
                />
              </div>
            </div>

            {/* Custom Google-Forms Questions */}
            {questions.length > 0 && (
              <div className="pt-4 border-t border-stone-100 space-y-4">
                <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-900 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tournament Questionnaire</span>
                </div>

                {questions.map((q, idx) => (
                  <div key={q.id || idx} className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-800">
                      {q.label} {q.required && <span className="text-rose-500">*</span>}
                    </label>

                    {q.type === 'select' ? (
                      <select
                        value={customAnswers[q.label] || ''}
                        onChange={(e) => setCustomAnswers({ ...customAnswers, [q.label]: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:border-amber-500 font-medium"
                        required={q.required}
                      >
                        <option value="">-- Select an option --</option>
                        {(q.options || ['Standard', 'Open Category', 'Competitive']).map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : q.type === 'checkbox' ? (
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-stone-700 select-none pt-1">
                        <input
                          type="checkbox"
                          checked={!!customAnswers[q.label]}
                          onChange={(e) => setCustomAnswers({ ...customAnswers, [q.label]: e.target.checked })}
                          className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-amber-500"
                          required={q.required}
                        />
                        <span>{q.placeholder || 'I confirm and agree'}</span>
                      </label>
                    ) : (
                      <input
                        type={q.type === 'number' ? 'number' : 'text'}
                        value={customAnswers[q.label] || ''}
                        onChange={(e) => setCustomAnswers({ ...customAnswers, [q.label]: e.target.value })}
                        placeholder={q.placeholder || 'Your answer...'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium"
                        required={q.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Awards & Credential Guarantee Notice */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Award className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950 space-y-1">
                <span className="font-black block">Official Credential Guarantee</span>
                <p className="text-stone-600 leading-relaxed">
                  Upon completion of this tournament, official verified digital certificates and athletic badges issued by <strong>{tournament.institutionName}</strong> will be anchored and delivered directly to your verified portfolio.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              variant="dark"
              size="lg"
              loading={submitting}
              className="w-full font-black text-sm shadow-md hover:scale-[1.01] transition-all"
            >
              Confirm Registration & Generate Athlete Pass →
            </Button>
          </form>
        )}

      </div>
    </div>
  );
}
