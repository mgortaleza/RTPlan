import React from 'react';
import { Navigation, Wifi, WifiOff, History } from 'lucide-react';

export default function Header({
  isOnline,
  onRefreshHealth,
  onOpenRecentRoutes,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
              RT<span className="text-indigo-600">Plan</span>
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Multi-Stop Delivery Dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenRecentRoutes && (
            <button
              type="button"
              onClick={onOpenRecentRoutes}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs"
              title="View and recall recent routes"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden min-[380px]:inline">Recent</span>
            </button>
          )}

          <button
            onClick={onRefreshHealth}
            title={isOnline ? 'Backend Connected' : 'Backend Disconnected - Click to retry'}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden min-[420px]:inline">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                <span>Offline</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
