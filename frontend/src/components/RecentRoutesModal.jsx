import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Navigation,
  Calendar,
  User,
  ArrowRight,
  Clock,
  Loader2,
  AlertCircle,
  MapPin,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { getRecentManifests, clearRecentManifests, deleteManifest } from '../api/routesApi';

export default function RecentRoutesModal({
  isOpen,
  onClose,
  onSelectManifest,
  currentUser,
}) {
  const [manifests, setManifests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [error, setError] = useState(null);

  const username = currentUser?.username || currentUser?.fullName;

  useEffect(() => {
    if (isOpen) {
      loadRoutes();
    }
  }, [isOpen, username]);

  const loadRoutes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // User-scoped: only retrieve manifests created by or assigned to this user
      const data = await getRecentManifests(username);
      setManifests(data || []);
    } catch (err) {
      console.error('Failed to load recent manifests:', err);
      setError('Could not retrieve recent routes from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await clearRecentManifests(username);
      setManifests([]);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear manifests:', err);
      setError('Failed to clear route history.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteSingle = async (manifestId, e) => {
    e.stopPropagation();
    try {
      await deleteManifest(manifestId);
      setManifests((prev) => prev.filter((m) => m.manifestId !== manifestId));
    } catch (err) {
      console.error('Failed to delete manifest:', err);
      setError('Could not delete route.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Recent Routes
                </h3>
                {username && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {username}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Your saved delivery manifests
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Loading your routes...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={loadRoutes}
                className="text-xs font-bold text-rose-800 underline ml-2 shrink-0"
              >
                Retry
              </button>
            </div>
          ) : manifests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No saved routes for {username || 'you'}</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Routes you create and optimize will automatically appear here for quick recall.
              </p>
            </div>
          ) : (
            manifests.map((m) => {
              const stopCount = m.stops ? m.stops.length : 0;
              const legCount = m.links ? m.links.length : 0;
              const originStop = m.stops && m.stops.length > 0 ? m.stops[0].correctedAddress : 'Origin';
              const lastStop = m.stops && m.stops.length > 1 ? m.stops[m.stops.length - 1].correctedAddress : null;

              return (
                <div
                  key={m.manifestId}
                  className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-2xl p-4 space-y-2.5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs">
                        Manifest #{m.manifestId}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{m.routeDate || 'Today'}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSingle(m.manifestId, e)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete this route"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Route Summary */}
                  <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1.5 border border-slate-100">
                    <div className="flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-slate-700 text-[11px] truncate flex-1">
                        <strong className="text-slate-900">Start:</strong> {originStop}
                      </p>
                    </div>

                    {lastStop && (
                      <div className="flex items-start space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-slate-700 text-[11px] truncate flex-1">
                          <strong className="text-slate-900">End:</strong> {lastStop}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Meta tags and Action */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                      <span><strong>{stopCount}</strong> Stops</span>
                      <span>•</span>
                      <span><strong>{legCount}</strong> {legCount === 1 ? 'Leg' : 'Legs'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectManifest(m)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1 shadow-sm group-hover:scale-102 transition-all"
                    >
                      <span>Load Route</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Clear Confirmation Sub-Card */}
        {showClearConfirm && (
          <div className="p-4 bg-rose-50 border-t border-rose-200 space-y-2">
            <p className="text-xs font-bold text-rose-800">
              Clear all saved routes for {username}?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleClearAll}
                className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm flex items-center justify-center space-x-1"
              >
                {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Yes, Clear All</span>}
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={loadRoutes}
              disabled={isLoading}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 font-medium py-1 px-2 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden min-[360px]:inline">Refresh</span>
            </button>

            {manifests.length > 0 && !showClearConfirm && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center space-x-1 font-semibold py-1 px-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
