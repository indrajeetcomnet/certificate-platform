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
  ExternalLink
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

      await registerParticipant(tournamentId, payload);
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
        <LoadingSpinner text="Loading registration form..." />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FBFBF9]">
        <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-stone-900">Tournament Not Found</h2>
          <Button variant="dark" onClick={() => navigate('/tournaments')}>
            Browse Tournaments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBF9] py-8 px-4 selection:bg-amber-500/20 font-sans">
      <div className="max-w-xl mx-auto space-y-5">
        
        {/* Navigation link back to tournament */}
        <Link
          to={`/tournaments/${tournament.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View Tournament Overview & Timetable</span>
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
              {tournament.sport}
            </span>
            <span className="text-xs text-stone-500 font-bold">
              Organized by {tournament.institutionName}
            </span>
          </div>

          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            {tournament.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-stone-500 font-semibold pt-1 border-t border-stone-100 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>{tournament.startDate} to {tournament.endDate}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>{tournament.venue}</span>
            </span>
          </div>
        </div>

        {/* Success Screen */}
        {submitted ? (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-stone-900">
                Registration Confirmed!
              </h2>
              <p className="text-xs text-stone-600">
                Thank you, <strong>{athleteName}</strong>. You have been entered into the tournament roster.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <Button
                variant="dark"
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
                className="w-full sm:w-auto font-bold"
              >
                Go to Tournament Hub →
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
                className="text-xs font-bold text-stone-600 hover:text-stone-900 px-3 py-2"
              >
                Submit another response
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-4">
            
            {/* Standard Contact Fields */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Athlete Full Name *
              </label>
              <input
                type="text"
                value={athleteName}
                onChange={(e) => setAthleteName(e.target.value)}
                placeholder="e.g. Indrajeet Patil"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Custom Google Form Fields */}
            {questions.length > 0 && (
              <div className="pt-3 border-t border-stone-100 space-y-3.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Tournament Questions
                </span>

                {questions.map((q, idx) => (
                  <div key={q.id || idx}>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {q.label} {q.required && <span className="text-rose-500">*</span>}
                    </label>

                    {q.type === 'select' ? (
                      <select
                        value={customAnswers[q.label] || ''}
                        onChange={(e) => setCustomAnswers({ ...customAnswers, [q.label]: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:border-amber-500"
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
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700 select-none pt-1">
                        <input
                          type="checkbox"
                          checked={!!customAnswers[q.label]}
                          onChange={(e) => setCustomAnswers({ ...customAnswers, [q.label]: e.target.checked })}
                          className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-amber-500"
                          required={q.required}
                        />
                        <span>Confirm / Yes</span>
                      </label>
                    ) : (
                      <input
                        type={q.type === 'number' ? 'number' : 'text'}
                        value={customAnswers[q.label] || ''}
                        onChange={(e) => setCustomAnswers({ ...customAnswers, [q.label]: e.target.value })}
                        placeholder={q.placeholder || 'Your answer...'}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        required={q.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <Button
              type="submit"
              variant="dark"
              size="lg"
              loading={submitting}
              className="w-full font-bold mt-4"
            >
              Submit Registration
            </Button>
          </form>
        )}

      </div>
    </div>
  );
}
