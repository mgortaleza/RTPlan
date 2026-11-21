import React, { useState } from 'react';
import {
  Navigation,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { login } from '../api/authApi';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('Mark');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
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
      setErrorMessage(err.message || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelectUser = (name) => {
    setUsername(name);
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
              RT<span className="text-indigo-600">Plan</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Multi-Stop Delivery Dispatch
            </p>
          </div>
        </div>

        {/* Form Title & Subtitle */}
        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-800">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select or enter your credentials to begin
          </p>
        </div>

        {/* Quick User Selector Pills */}
        <div className="flex items-center justify-center space-x-2 pt-1">
          <button
            type="button"
            onClick={() => handleQuickSelectUser('Mark')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              username === 'Mark'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            Mark
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelectUser('Ed')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              username === 'Ed'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            Ed
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="e.g. Mark or Ed"
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
                <span>Sign In to RTPlan</span>
              </>
            )}
          </button>
        </form>

        {/* Security badge / Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure Delivery Dispatch Platform</span>
        </div>
      </div>
    </div>
  );
}
