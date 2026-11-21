import React, { useState } from 'react';
import {
  Navigation,
  Wifi,
  WifiOff,
  History,
  LogOut,
  User as UserIcon,
  AlertCircle,
  Shield,
} from 'lucide-react';

export default function Header({
  isOnline,
  onRefreshHealth,
  onOpenRecentRoutes,
  currentUser,
  onLogout,
  onOpenAdmin,
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          {/* NetYX Route Planner Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                NetYX <span className="text-indigo-600 font-extrabold">Route Planner</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-medium">
                Multi-Stop Delivery Dispatch
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {isAdmin && onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors shadow-2xs"
                title="Open Admin Console"
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden min-[380px]:inline">Admin</span>
              </button>
            )}

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
                    onClick={() => setShowLogoutConfirm(true)}
                    className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sign Out?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to sign out of NetYX Route Planner?
                </p>
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 min-h-[42px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 min-h-[42px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
