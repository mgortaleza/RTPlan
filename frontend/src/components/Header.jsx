import React from 'react';
import { Navigation, Wifi, WifiOff, History, LogOut, User as UserIcon } from 'lucide-react';

export default function Header({
  isOnline,
  onRefreshHealth,
  onOpenRecentRoutes,
  currentUser,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Brand */}
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

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {onOpenRecentRoutes && (
            <button
              type="button"
              onClick={onOpenRecentRoutes}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs"
              title="View and recall recent routes"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden min-[380px]:inline">Recent</span>
            </button>
          )}

          {currentUser && (
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full pl-2 pr-1 py-0.5 space-x-1">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                <UserIcon className="w-3 h-3 text-indigo-600" />
                <span>{currentUser.username || currentUser.fullName}</span>
              </span>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <button
            onClick={onRefreshHealth}
            title={isOnline ? 'Backend Connected' : 'Backend Disconnected - Click to retry'}
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {isOnline ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <WifiOff className="w-3 h-3 text-rose-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
