import React from 'react';
import { AlertTriangle, RefreshCw, Navigation, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary captured runtime error:', error, errorInfo);
  }

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch (e) {
      console.warn('Storage wipe error:', e);
    }
    // Hard reload bypassing browser cache
    window.location.href = window.location.pathname + '?nocache=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 shadow-2xl text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center mx-auto shadow-md shadow-indigo-500/25">
              <Navigation className="w-6 h-6 text-white" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                NetYX Route Planner
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                A browser cache or initialization mismatch prevented the page from rendering properly.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-left text-xs text-rose-800 break-words">
                <div className="font-bold text-rose-900 mb-0.5 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Error Details:</span>
                </div>
                <div className="text-[11px] font-mono text-rose-700">{this.state.error.message}</div>
              </div>
            )}

            <button
              type="button"
              onClick={this.handleClearCacheAndReload}
              className="w-full min-h-[46px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/25 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear Cache & Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
