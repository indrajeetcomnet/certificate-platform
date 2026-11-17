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
  AlertCircle,
  Coins,
  Award,
  Zap,
  Check
} from 'lucide-react';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, registerUser, loginInstitution, isAuthenticated, isInstitution, currentUser, logout } = useAuth();
  const { showToast } = useToast();

  // If already authenticated and arrived from a protected redirect, navigate to target
  useEffect(() => {
    if (isAuthenticated && location.state?.from) {
      if (isInstitution) {
        navigate('/certificates', { replace: true });
      } else {
        navigate('/feed', { replace: true });
      }
    }
  }, [isAuthenticated, isInstitution, location.state, navigate]);

  // Active view: 'login' | 'register' | 'institution'
  const initialMode = location.state?.mode || 'login';
  const [mode, setMode] = useState(initialMode);

  // Athlete Login Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Institution Login states
  const [instCode, setInstCode] = useState('');
  const [instPassword, setInstPassword] = useState('');
  const [showInstPassword, setShowInstPassword] = useState(false);

  // Registration states
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regBio, setRegBio] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Password Strength calculation
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
  const strengthColor =
    passStrength <= 25
      ? 'bg-rose-500'
      : passStrength <= 50
      ? 'bg-amber-500'
      : passStrength <= 75
      ? 'bg-blue-500'
      : 'bg-emerald-500';
  const strengthLabel =
    passStrength <= 25 ? 'Weak' : passStrength <= 50 ? 'Fair' : passStrength <= 75 ? 'Good' : 'Strong';

  // Handle Athlete / Unified Login
  const handleUserLogin = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError('Please fill in both username/email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser({
        usernameOrEmail: usernameOrEmail.trim(),
        password: password.trim(),
      });
      const user = res.user;
      showToast(`Welcome back, ${user.displayName || user.username}!`, 'success');
      if (user.role === 'INSTITUTION') {
        navigate('/certificates');
      } else {
        navigate('/feed');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Institution Accreditation Gateway Login
  const handleInstitutionLogin = async (e) => {
    e.preventDefault();
    if (!instCode.trim() || !instPassword.trim()) {
      setError('Please provide your Institution Identifier/Code and Password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await loginInstitution({
        institutionCodeOrEmail: instCode.trim(),
        password: instPassword.trim(),
      });
      showToast('Institution session authenticated.', 'success');
      navigate('/certificates');
    } catch (err) {
      setError(err.message || 'Institution authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please complete all required fields.');
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

  // One-Click Quick Demo Login for Test Accounts
  const handleQuickLogin = async (username, demoPassword) => {
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser({
        usernameOrEmail: username,
        password: demoPassword,
      });
      const user = res.user;
      showToast(`Signed in as ${user.displayName || user.username} (${user.role})`, 'success');
      if (user.role === 'INSTITUTION') {
        navigate('/certificates');
      } else {
        navigate('/feed');
      }
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-900 relative overflow-hidden font-sans">
      
      {/* Ambient background lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-gradient-to-bl from-amber-300/15 via-orange-200/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200/20 via-stone-200/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Floating minimal top navbar */}
      <header className="px-6 py-4 max-w-7xl w-full mx-auto flex items-center justify-between z-10">
        <Logo size="md" subtitle="Accredited Sports Arena" />

        <div className="flex items-center gap-4">
          <Link
            to="/certificates/verify"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-amber-300 bg-white/90 text-xs font-bold text-stone-700 hover:text-stone-900 transition-all shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Verify Credential</span>
          </Link>
          <Link
            to="/"
            className="text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
          >
            ← Return to Home
          </Link>
        </div>
      </header>

      {/* Main Auth Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-2 sm:my-4 z-10">
        <div className="w-full max-w-5xl bg-white rounded-3xl border border-stone-200/90 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          
          {/* ── LEFT SHOWCASE COLUMN (LIGHT THEME) ── */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-amber-50/90 via-[#FDFBF7] to-amber-100/60 p-8 sm:p-10 flex-col justify-between border-r border-stone-200/80 relative overflow-hidden">
            
            {/* Subtle athletic pattern overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:22px_22px]" />
            
            {/* Top Brand Pill & Mission */}
            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-amber-300 text-amber-900 text-xs font-black tracking-wide shadow-xs">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Next-Gen Athletic Arena</span>
              </span>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
                  The Verified Hub for Champions & Academies
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                  Earn accredited tamper-proof credentials, showcase official medals, and monetize audience engagement with instant sponsor rewards.
                </p>
              </div>
            </div>

            {/* Interactive Showcase Preview Badges (Light Theme) */}
            <div className="relative z-10 space-y-3.5 my-6">
              
              {/* Badge Showcase 1: Verified Award */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200/80 p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 flex items-center justify-center font-black">
                      <Trophy className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-stone-900">
                        Athletics Gold Medal
                      </h4>
                      <p className="text-[10px] font-semibold text-stone-500">
                        Apex Sports Academy · Verified
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-bold">
                    GC-2026-ATH-01
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 pt-1 border-t border-stone-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tamper-proof Cryptographic Verification</span>
                </div>
              </div>

              {/* Badge Showcase 2: Sponsor Monetization */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 flex items-center justify-center font-black">
                    <Coins className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-stone-900">
                      Sponsor Rewards Engine
                    </h4>
                    <p className="text-[10px] font-semibold text-stone-500">
                      Earn per 1,000 verified post views
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-300">
                    ₹20 / 1K
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Trust Indicators */}
            <div className="relative z-10 pt-4 border-t border-amber-200/60 flex items-center justify-between text-xs font-bold text-stone-600">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>SHA-256 Sealed</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Instant Payouts</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Official Academies</span>
              </span>
            </div>

          </div>

          {/* ── RIGHT FORM COLUMN ── */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6 bg-white">
            
            {/* Active Session Warning / Switcher Banner */}
            {isAuthenticated && currentUser && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={currentUser.avatarUrl}
                    name={currentUser.displayName || currentUser.username}
                    size="md"
                    className="w-10 h-10 ring-2 ring-white shadow-xs"
                  />
                  <div>
                    <p className="text-xs font-black text-stone-900 leading-tight">
                      Active: {currentUser.displayName || currentUser.username}
                    </p>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                      {currentUser.role === 'INSTITUTION' ? '🏛️ Accredited Institution' : '🏃 Registered Athlete'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => navigate(currentUser.role === 'INSTITUTION' ? '/certificates' : '/feed')}
                    className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all shadow-xs"
                  >
                    Continue →
                  </button>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all"
                  >
                    Switch Account
                  </button>
                </div>
              </div>
            )}

            {/* Header: Clean Segmented Mode Switcher */}
            <div className="space-y-4">
              <div className="flex bg-stone-100/90 p-1.5 rounded-2xl text-xs font-bold border border-stone-200">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'login'
                      ? 'bg-stone-900 text-white shadow-md font-black'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-bold'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Athlete Sign In</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => { setMode('institution'); setError(null); }}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'institution'
                      ? 'bg-stone-900 text-white shadow-md font-black'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-bold'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Institution</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-stone-900 text-white shadow-md font-black'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-bold'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  {mode === 'login' && 'Sign In to Athlete Arena'}
                  {mode === 'institution' && 'Institution Accreditation Gateway'}
                  {mode === 'register' && 'Join the Competitive Arena'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
                  {mode === 'login' && 'Access your competition badges, social feed, and sponsor rewards.'}
                  {mode === 'institution' && 'Official management studio for sports academies and tournament credential issuers.'}
                  {mode === 'register' && 'Create your official athlete profile and begin accumulating verified tournament credentials.'}
                </p>
              </div>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── MODE 1: ATHLETE SIGN IN FORM ── */}
            {mode === 'login' && (
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. indrajeet or user@example.com"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-2xs"
                      required
                    />
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-800">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => showToast('Password reset link dispatched to registered email (demo mode).', 'info')}
                      className="text-xs text-amber-700 hover:text-amber-800 hover:underline font-bold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-2xs"
                      required
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-700 font-medium select-none">
                    <input 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-md border-stone-300 text-stone-900 focus:ring-amber-500 focus:ring-offset-0"
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
                  className="w-full font-bold shadow-md"
                >
                  Sign In to Arena →
                </Button>

                {/* One-Click Quick Demo Accounts Bar */}
                <div className="pt-4 border-t border-stone-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                      ⚡ One-Click Quick Demo Access
                    </span>
                    <span className="text-[10px] font-semibold text-stone-400">
                      Instant Local QA
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    {/* Demo 1: Athlete Indrajeet */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin('indrajeet', 'userpass2026')}
                      className="p-3 rounded-2xl border border-stone-200 hover:border-amber-400 bg-stone-50/70 hover:bg-amber-50/50 text-left transition-all group shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full border border-amber-300">
                          🏃 Athlete
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 group-hover:text-amber-800">
                          @indrajeet
                        </span>
                      </div>
                      <div className="text-xs font-black text-stone-900 group-hover:text-amber-950">
                        Indrajeet Sharma
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5 font-medium">
                        Feed, Medals & Badges (USER)
                      </p>
                    </button>

                    {/* Demo 2: Apex Academy */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin('apex_academy', 'apexpass2026')}
                      className="p-3 rounded-2xl border border-stone-200 hover:border-amber-400 bg-stone-50/70 hover:bg-amber-50/50 text-left transition-all group shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black text-stone-900 bg-stone-200 px-2 py-0.5 rounded-full border border-stone-300">
                          🏛️ Institution
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 group-hover:text-amber-800">
                          @apex_academy
                        </span>
                      </div>
                      <div className="text-xs font-black text-stone-900 group-hover:text-amber-950">
                        Apex Sports Academy
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5 font-medium">
                        Certificate Studio & Hub (ISSUER)
                      </p>
                    </button>

                  </div>
                </div>

              </form>
            )}

            {/* ── MODE 2: INSTITUTION ACCREDITATION LOGIN ── */}
            {mode === 'institution' && (
              <form onSubmit={handleInstitutionLogin} className="space-y-4">
                
                {/* Accreditation Info Banner */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-950 text-xs shadow-2xs">
                  <p className="font-extrabold flex items-center gap-1.5 text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Official Institutional Accreditation Required</span>
                  </p>
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                    Access to Certificate Studio, batch credential issuance, and competition badge awards.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Institution Identifier or Code
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g. apex_academy or INST-APEX-2026"
                      value={instCode}
                      onChange={(e) => setInstCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-2xs"
                      required
                    />
                    <Building2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Institutional Passphrase
                  </label>
                  <div className="relative">
                    <input 
                      type={showInstPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={instPassword}
                      onChange={(e) => setInstPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-2xs"
                      required
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowInstPassword(!showInstPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      {showInstPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="dark"
                  size="lg"
                  loading={loading}
                  className="w-full font-bold shadow-md"
                >
                  Authenticate Institution Session →
                </Button>

                {/* Quick One-Click Demo Institution */}
                <div className="pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin('apex_academy', 'apexpass2026')}
                    className="w-full p-3 rounded-2xl border border-stone-200 hover:border-amber-400 bg-stone-50/70 hover:bg-amber-50/50 text-left transition-all group flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[9px] font-black text-stone-900 bg-stone-200 px-2 py-0.5 rounded-full border border-stone-300 mr-2">
                        🏛️ Demo Academy
                      </span>
                      <span className="text-xs font-black text-stone-900 group-hover:text-amber-950">
                        Apex Sports Academy (INSTITUTION)
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                      Sign In →
                    </span>
                  </button>
                </div>

              </form>
            )}

            {/* ── MODE 3: REGISTRATION ── */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Full Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Indrajeet Patil"
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-2xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Username
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. indrajeet"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Email Address
                  </label>
                  <input 
                    type="email"
                    placeholder="user@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Live Password Strength Indicator */}
                  {regPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${strengthColor} transition-all duration-300`} 
                          style={{ width: `${passStrength}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-stone-500">
                        <span>Password strength: <strong className="text-stone-900">{strengthLabel}</strong></span>
                        <span>{passStrength}%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Primary Sport / Discipline (Optional)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Athletics, 100m Sprint, Football, Badminton"
                    value={regBio}
                    onChange={(e) => setRegBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 bg-stone-50/60 text-stone-900 text-sm font-medium focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-2xs"
                  />
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  loading={loading}
                  icon={Sparkles}
                  className="w-full font-bold shadow-md mt-2"
                >
                  Create Athlete Profile →
                </Button>
              </form>
            )}

            {/* Security Guarantee Footer */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-center gap-2 text-[11px] text-stone-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit SSL Encrypted Authentication · Cryptographic Session Protection</span>
            </div>

          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-4 text-center text-xs text-stone-500 font-medium">
        Athlos Arena · Secure Sports Network & Verified Credential Architecture
      </footer>

    </div>
  );
}
