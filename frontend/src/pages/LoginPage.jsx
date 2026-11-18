import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  AlertCircle 
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

  // Active view: 'login' | 'institution' | 'register'
  const initialMode = location.state?.mode || (location.pathname === '/register' ? 'register' : 'login');
  const [mode, setMode] = useState(initialMode);

  // Form states
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

  // Handle User Login
  const handleUserLogin = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError('Please fill in both fields.');
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
      showToast(`Welcome back, ${user?.displayName || user?.username || 'User'}!`, 'success');
      if (user.role === 'INSTITUTION') {
        navigate('/certificates');
      } else {
        navigate('/feed');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Institution Login
  const handleInstitutionLogin = async (e) => {
    e.preventDefault();
    if (!instCode.trim() || !instPassword.trim()) {
      setError('Please fill in both fields.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await loginInstitution({
        institutionCodeOrEmail: instCode.trim(),
        password: instPassword.trim(),
      });
      showToast('Institution authenticated.', 'success');
      navigate('/certificates');
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please fill in all required fields.');
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
      showToast('Account created.', 'success');
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] flex flex-col items-center justify-center p-4 selection:bg-amber-500/20 font-sans">
      
      {/* Centered Auth Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200/90 shadow-lg p-6 sm:p-8 space-y-6">
        
        {/* Brand Logo & Mode Toggle */}
        <div className="flex flex-col items-center gap-4">
          <Logo size="md" />

          {/* Segmented Mode Control */}
          <div className="flex w-full bg-stone-100 p-1 rounded-xl text-xs font-bold border border-stone-200">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                mode === 'login'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Athlete
            </button>
            <button
              type="button"
              onClick={() => { setMode('institution'); setError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                mode === 'institution'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Institution
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                mode === 'register'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Active Session Notification */}
        {isAuthenticated && currentUser && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={currentUser?.avatarUrl}
                name={currentUser?.displayName || currentUser?.username || 'User'}
                size="sm"
              />
              <span className="font-bold text-stone-900">
                {currentUser?.displayName || currentUser?.username || 'User'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(currentUser.role === 'INSTITUTION' ? '/certificates' : '/feed')}
                className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-bold hover:bg-stone-800 transition-colors"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="px-2.5 py-1 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 ml-2">
              ✕
            </button>
          </div>
        )}

        {/* ── 1. ATHLETE LOGIN FORM ── */}
        {mode === 'login' && (
          <form onSubmit={handleUserLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Username or email"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => showToast('Password reset link sent.', 'info')}
                  className="text-xs text-amber-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-stone-600 select-none">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-amber-500"
                />
                <span>Remember me</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="dark"
              size="md"
              loading={loading}
              className="w-full font-bold"
            >
              Sign In
            </Button>
          </form>
        )}

        {/* ── 2. INSTITUTION LOGIN FORM ── */}
        {mode === 'institution' && (
          <form onSubmit={handleInstitutionLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Institution Code or Email
              </label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Institution code or email"
                  value={instCode}
                  onChange={(e) => setInstCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
                <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showInstPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={instPassword}
                  onChange={(e) => setInstPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowInstPassword(!showInstPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
                >
                  {showInstPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="dark"
              size="md"
              loading={loading}
              className="w-full font-bold"
            >
              Sign In as Institution
            </Button>
          </form>
        )}

        {/* ── 3. REGISTRATION FORM ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Name
                </label>
                <input 
                  type="text"
                  placeholder="Full name"
                  value={regDisplayName}
                  onChange={(e) => setRegDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Username
                </label>
                <input 
                  type="text"
                  placeholder="Username"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Email
              </label>
              <input 
                type="email"
                placeholder="Email address"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {regPassword && (
                <div className="mt-1.5 w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${strengthColor} transition-all duration-300`} 
                    style={{ width: `${passStrength}%` }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Sport (Optional)
              </label>
              <input 
                type="text"
                placeholder="e.g. Athletics, Football"
                value={regBio}
                onChange={(e) => setRegBio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <Button
              type="submit"
              variant="gold"
              size="md"
              loading={loading}
              className="w-full font-bold mt-2"
            >
              Create Account
            </Button>
          </form>
        )}

      </div>

      {/* Minimal Back to Home Link */}
      <Link 
        to="/" 
        className="mt-6 text-xs text-stone-500 hover:text-stone-800 font-medium transition-colors"
      >
        ← Back to Home
      </Link>

    </div>
  );
}
