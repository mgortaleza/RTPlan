import React, { useState } from 'react';
import {
  Navigation,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Truck,
  Users,
} from 'lucide-react';
import { login, register } from '../api/authApi';

export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'register_success'

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('DRIVER');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await login(username, password);
      if (data && data.success) {
        onLoginSuccess(data);
      } else {
        setErrorMessage(data?.message || 'Invalid username or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || err.message || 'Invalid username or password.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!regUsername.trim()) {
      setErrorMessage('Please enter a username.');
      return;
    }
    if (!regPassword) {
      setErrorMessage('Please enter a password.');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await register({
        fullName: regFullName.trim(),
        username: regUsername.trim(),
        password: regPassword,
        role: regRole,
      });

      setSuccessInfo({
        username: regUsername.trim(),
        fullName: regFullName.trim(),
        role: regRole,
        message: res.message || 'Your account request is pending administrator approval.',
      });
      setMode('register_success');
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
    setMode('login');
    setErrorMessage(null);
  };

  const switchToRegister = () => {
    setMode('register');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center mx-auto shadow-md shadow-indigo-500/25">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
              NetYX <span className="text-indigo-600">Route Planner</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Multi-Stop Delivery Dispatch
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* REGISTRATION SUCCESS VIEW */}
        {mode === 'register_success' && (
          <div className="space-y-4 text-center py-2 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Account Request Pending</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Thank you, <span className="font-bold text-slate-800">{successInfo?.fullName}</span>! Your account{' '}
                <span className="font-semibold text-indigo-600">(@{successInfo?.username})</span> has been created with requested role{' '}
                <span className="font-bold">{successInfo?.role}</span>.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Requires Administrator Approval</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-700">
                An administrator must approve your account before you can log in. Please inform your dispatch coordinator or admin.
              </p>
            </div>

            <button
              type="button"
              onClick={switchToLogin}
              className="w-full min-h-[44px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/25"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {/* LOGIN VIEW */}
        {mode === 'login' && (
          <>
            <div className="text-center">
              <h2 className="text-sm font-bold text-slate-800">Sign in to your account</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your username and password to proceed
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full min-h-[46px] rounded-2xl font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center space-x-2 transition-all shadow-md ${
                  isLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-indigo-600/25'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to NetYX Route Planner</span>
                  </>
                )}
              </button>
            </form>

            {/* Toggle to Create Account */}
            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Need access to NetYX Route Planner?{' '}
                <button
                  type="button"
                  onClick={switchToRegister}
                  className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center space-x-1"
                >
                  <span>Create Account</span>
                </button>
              </p>
            </div>
          </>
        )}

        {/* REGISTER VIEW */}
        {mode === 'register' && (
          <>
            <div className="text-center">
              <h2 className="text-sm font-bold text-slate-800">Create New Account</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                New accounts require administrator approval
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. jdoe"
                  className="w-full bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Requested Role</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('DRIVER')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      regRole === 'DRIVER'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Driver</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('DISPATCH')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      regRole === 'DISPATCH'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Dispatch</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-3 py-2 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Confirm Password</span>
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full min-h-[46px] rounded-2xl font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center space-x-2 transition-all shadow-md ${
                  isLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-indigo-600/25'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Submit Account Request</span>
                  </>
                )}
              </button>
            </form>

            {/* Toggle back to Sign In */}
            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Already have an approved account?{' '}
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center space-x-1"
                >
                  <span>Sign In</span>
                </button>
              </p>
            </div>
          </>
        )}

        {/* Security badge / Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure Delivery Dispatch Platform</span>
        </div>
      </div>
    </div>
  );
}
