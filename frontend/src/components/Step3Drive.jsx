import React, { useState, useEffect } from 'react';
import {
  Navigation,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  Edit3,
  Calendar,
  User,
  Share2,
  Compass,
  ArrowLeft,
  ImagePlus,
  AlertCircle,
} from 'lucide-react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export default function Step3Drive({
  manifest,
  onResetWorkflow,
  onBackToEdit,
  onBackToUpload,
}) {
  const [copied, setCopied] = useState(false);
  const [showAllStops, setShowAllStops] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Track which legs have been opened in Google Maps
  const [openedLegs, setOpenedLegs] = useState(() => {
    return loadFromStorage('opened_legs', []);
  });

  useEffect(() => {
    saveToStorage('opened_legs', openedLegs);
  }, [openedLegs]);

  if (!manifest) return null;

  const { manifestId, driverName, routeDate, status, stops = [], links = [] } = manifest;

  const handleOpenMaps = (chunkNum) => {
    setOpenedLegs((prev) => {
      if (!prev.includes(chunkNum)) {
        return [...prev, chunkNum];
      }
      return prev;
    });
  };

  // Format shareable text message for SMS / dispatch notes
  const buildShareableText = () => {
    const lines = [
      `🚚 RTPlan Route #${manifestId} - ${routeDate || 'Today'}`,
      `Driver: ${driverName || 'Assigned Driver'} | Total Stops: ${stops.length}`,
      '',
    ];

    links.forEach((link, idx) => {
      const chunkNum = link.sequenceChunk || idx + 1;
      const legStartIdx = (chunkNum - 1) * 9;
      const legEndIdx = Math.min(legStartIdx + 9, stops.length - 1);
      const startAddress = stops[legStartIdx]?.correctedAddress || 'Start';
      const endAddress = stops[legEndIdx]?.correctedAddress || 'Destination';

      lines.push(`📍 Leg ${chunkNum} (Stops ${legStartIdx + 1}–${legEndIdx + 1}):`);
      lines.push(`Start: ${startAddress}`);
      lines.push(`End: ${endAddress}`);
      lines.push(`Maps: ${link.googleMapsUrl}`);
      lines.push('');
    });

    return lines.join('\n');
  };

  const handleCopyAllLinks = async () => {
    try {
      const text = buildShareableText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = buildShareableText();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-36">
      <div className="p-4 space-y-4">
        {/* Route Summary Card */}
        <div className="bg-gradient-to-br from-indigo-950/60 via-slate-800/80 to-slate-900 border border-indigo-700/50 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                  Manifest #{manifestId}
                </span>
                <h2 className="text-base font-bold text-white leading-tight">Optimized Delivery Plan</h2>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              {status || 'OPTIMIZED'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-700/60 text-center">
            <div className="bg-slate-900/60 rounded-xl p-2">
              <span className="block text-[10px] text-slate-400">Total Stops</span>
              <span className="text-sm font-bold text-white">{stops.length}</span>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2">
              <span className="block text-[10px] text-slate-400">Nav Legs</span>
              <span className="text-sm font-bold text-indigo-400">{links.length}</span>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2">
              <span className="block text-[10px] text-slate-400">Date</span>
              <span className="text-[11px] font-bold text-slate-200 truncate block">
                {routeDate || 'Today'}
              </span>
            </div>
          </div>

          {driverName && (
            <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800">
              <div className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Driver: <strong className="text-white">{driverName}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Share & Copy Action Bar */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyAllLinks}
            className={`flex-1 min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Copied All Links!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-indigo-400" />
                <span>Copy All Maps Links</span>
              </>
            )}
          </button>
        </div>

        {/* Chunked Google Maps Legs Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Navigation className="w-3.5 h-3.5 text-indigo-400" />
              <span>Navigation Legs (9 Stops Max Each)</span>
            </h3>
            <span className="text-[10px] text-slate-400">
              {openedLegs.length}/{links.length} Started
            </span>
          </div>

          {links.map((link, idx) => {
            const chunkNum = link.sequenceChunk || idx + 1;
            const legStartIdx = (chunkNum - 1) * 9;
            const legEndIdx = Math.min(legStartIdx + 9, stops.length - 1);
            const startStop = stops[legStartIdx];
            const endStop = stops[legEndIdx];
            const stopCountInLeg = Math.max(1, legEndIdx - legStartIdx + 1);
            const isOpened = openedLegs.includes(chunkNum);

            return (
              <div
                key={link.linkId || idx}
                className={`bg-slate-800/80 border rounded-2xl p-4 shadow-md space-y-3 transition-all ${
                  isOpened
                    ? 'border-emerald-500/50 bg-slate-800/95 ring-1 ring-emerald-500/20'
                    : 'border-slate-700/80'
                }`}
              >
                {/* Leg Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        isOpened
                          ? 'bg-emerald-600/30 text-emerald-400'
                          : 'bg-indigo-600/30 text-indigo-400'
                      }`}
                    >
                      {chunkNum}
                    </span>
                    <span className="text-sm font-bold text-white">
                      Leg {chunkNum}: Stops {legStartIdx + 1}–{legEndIdx + 1}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isOpened && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-semibold">
                        ✓ In Progress
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700/60 font-medium">
                      {stopCountInLeg} Stops
                    </span>
                  </div>
                </div>

                {/* Start & End Points */}
                <div className="bg-slate-900/70 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-start space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-semibold text-emerald-400 block">
                        Start (Stop #{legStartIdx + 1})
                      </span>
                      <p className="text-slate-200 text-xs truncate">
                        {startStop?.correctedAddress || 'Origin'}
                      </p>
                    </div>
                  </div>

                  <div className="border-l border-dashed border-slate-700 ml-1 h-2" />

                  <div className="flex items-start space-x-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-semibold text-rose-400 block">
                        End (Stop #{legEndIdx + 1})
                      </span>
                      <p className="text-slate-200 text-xs truncate">
                        {endStop?.correctedAddress || 'Destination'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prominent Maps Button */}
                <a
                  href={link.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleOpenMaps(chunkNum)}
                  className={`w-full min-h-[48px] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-[0.98] ${
                    isOpened
                      ? 'bg-slate-700 hover:bg-slate-600 text-emerald-300 shadow-slate-900/30 border border-emerald-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  <Navigation className="w-4 h-4 fill-current" />
                  <span>{isOpened ? 'Reopen in Google Maps' : 'Start in Google Maps'}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
                </a>
              </div>
            );
          })}
        </div>

        {/* Collapsible Ordered Stops List */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAllStops((prev) => !prev)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-white">
                All Ordered Stops ({stops.length})
              </span>
            </div>
            {showAllStops ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showAllStops && (
            <div className="p-3 pt-0 border-t border-slate-700/60 divide-y divide-slate-800 space-y-2">
              {stops.map((stop, idx) => (
                <div key={stop.stopId || idx} className="pt-2 first:pt-1 flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {stop.optimizedSequence !== undefined ? stop.optimizedSequence + 1 : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white leading-snug">{stop.correctedAddress}</p>
                    {stop.latitude && stop.longitude && (
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        {Number(stop.latitude).toFixed(5)}, {Number(stop.longitude).toFixed(5)}
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.correctedAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors"
                    title="Open stop in Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Resetting Route */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Start New Route?</h3>
                <p className="text-xs text-slate-300 mt-1">
                  This will clear your current manifest and stops. Are you sure you want to start over?
                </p>
              </div>
            </div>
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 min-h-[42px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetWorkflow();
                }}
                className="flex-1 min-h-[42px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                Yes, Start New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 z-20 max-w-md mx-auto space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBackToEdit}
            className="flex-1 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Address List</span>
          </button>

          {onBackToUpload && (
            <button
              type="button"
              onClick={onBackToUpload}
              className="px-3 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center space-x-1 transition-colors"
              title="Add more photos"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span className="hidden min-[360px]:inline">Add Photos</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="w-full py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors flex items-center justify-center space-x-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Route (Start Fresh)</span>
        </button>
      </div>
    </div>
  );
}
