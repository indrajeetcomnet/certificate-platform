import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, registerUser, loginInstitution, isAuthenticated, isInstitution } = useAuth();
  const { showToast } = useToast();

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      if (isInstitution) {
        navigate('/certificates', { replace: true });
      } else {
        navigate('/feed', { replace: true });
      }
    }
  }, [isAuthenticated, isInstitution, navigate]);

  // Active view: 'login' | 'register' | 'institution'
  const initialMode = location.state?.mode || 'login';
  const [mode, setMode] = useState(initialMode);

  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration states
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBio, setRegBio] = useState('');

  // Institution login states
  const [instCode, setInstCode] = useState('');
  const [instPassword, setInstPassword] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Password Strength Meter calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pass)) score += 25;
    return score;
  };

  const passStrength = getPasswordStrength(regPassword);
  const strengthColor = passStrength <= 25 ? 'bg-rose-500' : passStrength <= 50 ? 'bg-amber-500' : passStrength <= 75 ? 'bg-blue-500' : 'bg-emerald-500';
  const strengthLabel = passStrength <= 25 ? 'Weak' : passStrength <= 50 ? 'Fair' : passStrength <= 75 ? 'Good' : 'Strong';

  // Handle Standard User Login
  const handleUserLogin = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await loginUser({
        usernameOrEmail: usernameOrEmail.trim(),
        password: password.trim(),
      });
      showToast('Welcome back! Signed in successfully.', 'success');
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please complete all required fields');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await registerUser({
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword.trim(),
        displayName: regDisplayName.trim() || regUsername.trim(),
        bio: regBio.trim(),
        role: 'USER',
      });
      showToast('Account created! Welcome to the arena.', 'success');
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Institution Accreditation Gateway Login
  const handleInstitutionLogin = async (e) => {
    e.preventDefault();
    if (!instCode.trim() || !instPassword.trim()) {
      setError('Please provide your Institution Identifier and Password');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await loginInstitution({
        institutionCodeOrEmail: instCode.trim(),
        password: instPassword.trim(),
      });
      showToast('Institution session verified.', 'success');
      navigate('/certificates');
    } catch (err) {
      setError(err.message || 'Institution authentication failed.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#F8F8F5] flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-900 relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-gradient-to-bl from-amber-400/10 via-orange-400/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Floating minimal top navbar */}
      <header className="px-6 py-4 max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-all">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-base font-black tracking-tight text-stone-900">
            CertPlatform
          </span>
        </Link>

        <Link
          to="/"
          className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
        >
          ← Return to Home
        </Link>
      </header>

      {/* Main Auth Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-4xl bg-white rounded-3xl border border-stone-200/90 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
          
          {/* Left Visual Column: Energetic Sports Aesthetics (Hidden on mobile) */}
          <div className="hidden md:flex md:col-span-5 relative bg-stone-950 p-8 flex-col justify-between overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80" 
              alt="Night Arena Floodlights and Electric Atmosphere" 
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-stone-950/20" />

            {/* Top Badge */}
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Next-Gen Athletic Arena</span>
              </span>
            </div>

            {/* Bottom Quote & Stat */}
            <div className="relative z-10 space-y-4">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Game City #Rank [1 to 3]</span>
                </div>
                <p className="text-xs text-stone-200 leading-snug">
                  Earn competitive podium honors and monetize dynamic sponsor impressions every 5 seconds.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-stone-400">
                <span>⚡ ₹20 / 1K Views</span>
                <span>·</span>
                <span>🔒 Tamper-Proof</span>
              </div>
            </div>
          </div>

          {/* Right Column: Secure Form */}
          <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            
            {/* Mode Switcher Tabs */}
            <div className="space-y-4">
              <div className="flex bg-stone-100 p-1 rounded-2xl text-xs font-bold border border-stone-200">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    mode === 'login'
                      ? 'bg-white text-stone-900 shadow-sm font-extrabold'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    mode === 'register'
                      ? 'bg-white text-stone-900 shadow-sm font-extrabold'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('institution'); setError(null); }}
                  className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                    mode === 'institution'
                      ? 'bg-stone-900 text-amber-400 shadow-sm font-extrabold'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Institution</span>
                </button>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  {mode === 'login' && 'Sign in to Your Athlete Profile'}
                  {mode === 'register' && 'Join the Competitive Arena'}
                  {mode === 'institution' && 'Institution Accreditation Access'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  {mode === 'login' && 'Enter your credentials to access your feed, badges, and monetization.'}
                  {mode === 'register' && 'Create your competitive social profile and start earning verified badges.'}
                  {mode === 'institution' && 'Reserved solely for sports federations, academies, and tournament issuers.'}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* ── MODE 1: STANDARD ATHLETE LOGIN ── */}
            {mode === 'login' && (
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. indrajeet or user@example.com"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                      required
                    />
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => showToast('Password reset link dispatched to registered email (demo mode).', 'info')}
                      className="text-xs text-amber-600 hover:underline font-semibold"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                      required
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-600 font-medium select-none">
                    <input 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                    />
                    <span>Remember my session for 30 days</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="dark"
                  size="lg"
                  loading={loading}
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full shadow-lg"
                >
                  Sign In to Arena
                </Button>

              </form>
            )}

            {/* ── MODE 2: REGISTRATION ── */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Indrajeet Patil"
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Username
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. indrajeet"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input 
                    type="email"
                    placeholder="user@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input 
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                    required
                  />
                  {/* Live Password Strength Indicator */}
                  {regPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${strengthColor} transition-all duration-300`} 
                          style={{ width: `${passStrength}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-stone-500">
                        Strength: <strong className="text-stone-800">{strengthLabel}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Primary Sport / Discipline (Optional)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Athletics, Football, Esports"
                    value={regBio}
                    onChange={(e) => setRegBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                  />
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  loading={loading}
                  icon={Sparkles}
                  className="w-full shadow-lg"
                >
                  Create Athlete Profile
                </Button>
              </form>
            )}

            {/* ── MODE 3: INSTITUTION ACCREDITATION LOGIN ── */}
            {mode === 'institution' && (
              <form onSubmit={handleInstitutionLogin} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Official Institutional Accreditation Required</span>
                  </p>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Authorized access to generate certificates and award competition badges.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Institution Identifier / Code
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. INST-APEX-2026"
                      value={instCode}
                      onChange={(e) => setInstCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-500 uppercase"
                      required
                    />
                    <Building2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Institutional Security Passphrase
                  </label>
                  <div className="relative">
                    <input 
                      type="password"
                      placeholder="••••••••"
                      value={instPassword}
                      onChange={(e) => setInstPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                      required
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="dark"
                  size="lg"
                  loading={loading}
                  className="w-full shadow-lg"
                >
                  Authenticate Institution Session →
                </Button>

              </form>
            )}

            {/* Security Guarantee Footer */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-center gap-2 text-[11px] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit SSL Encrypted Authentication · Session Persisted Securely</span>
            </div>

          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-4 text-center text-xs text-stone-400">
        CertPlatform · Secure Social Media & Credential Architecture
      </footer>

    </div>
  );
}
