import React from 'react';
import { Navigation, Wifi, WifiOff } from 'lucide-react';

export default function Header({ isOnline, onRefreshHealth }) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
              RT<span className="text-indigo-400">Plan</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Multi-Stop Route Dispatch</p>
          </div>
        </div>

        <button
          onClick={onRefreshHealth}
          title={isOnline ? 'Backend Connected' : 'Backend Disconnected - Click to retry'}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            isOnline
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
              : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
          }`}
        >
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>API Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-rose-400" />
              <span>API Offline</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
