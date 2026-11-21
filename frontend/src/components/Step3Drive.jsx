import React, { useState } from 'react';
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
} from 'lucide-react';

export default function Step3Drive({
  manifest,
  onResetWorkflow,
  onBackToEdit,
}) {
  const [copied, setCopied] = useState(false);
  const [showAllStops, setShowAllStops] = useState(false);

  if (!manifest) return null;

  const { manifestId, driverName, routeDate, status, stops = [], links = [] } = manifest;

  // Format shareable text message for SMS / dispatch notes
  const buildShareableText = () => {
    const lines = [
      `🚚 RTPlan Route #${manifestId} - ${routeDate || 'Today'}`,
      `Driver: ${driverName || 'Assigned Driver'} | Total Stops: ${stops.length}`,
      '',
    ];

    links.forEach((link, idx) => {
      // Find start and end stop names for this leg
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
    <div className="flex flex-col flex-1 pb-32">
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
              <span className="block text-sm font-bold text-white mt-0.5">{stops.length}</span>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2">
              <span className="block text-[10px] text-slate-400">Navigation Legs</span>
              <span className="block text-sm font-bold text-indigo-300 mt-0.5">{links.length}</span>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2">
              <span className="block text-[10px] text-slate-400">Driver</span>
              <span className="block text-xs font-bold text-slate-200 truncate mt-0.5">
                {driverName || 'Driver 1'}
              </span>
            </div>
          </div>
        </div>

        {/* Share & Copy Action Bar */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopyAllLinks}
            className={`flex-1 min-h-[44px] rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 border transition-all ${
              copied
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 shadow-md shadow-emerald-950/40'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white active:scale-[0.99]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied All Links to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Copy All Links (SMS / Dispatch)</span>
              </>
            )}
          </button>
        </div>

        {/* Navigation Legs List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Google Maps Navigation Legs ({links.length})
            </h3>
            <span className="text-[11px] text-slate-400">Max 9 destinations per leg</span>
          </div>

          {links.map((link, idx) => {
            const chunkNum = link.sequenceChunk || idx + 1;
            const legStartIdx = (chunkNum - 1) * 9;
            const legEndIdx = Math.min(legStartIdx + 9, stops.length - 1);
            const startStop = stops[legStartIdx];
            const endStop = stops[legEndIdx];
            const stopCountInLeg = Math.max(1, legEndIdx - legStartIdx + 1);

            return (
              <div
                key={link.linkId || idx}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-md space-y-3"
              >
                {/* Leg Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 text-xs font-bold flex items-center justify-center">
                      {chunkNum}
                    </span>
                    <span className="text-sm font-bold text-white">
                      Leg {chunkNum}: Stops {legStartIdx + 1}–{legEndIdx + 1}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700/60 font-medium">
                    {stopCountInLeg} Stops
                  </span>
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
                  className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  <span>Start in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200 ml-1 opacity-70" />
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

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800/80 z-20 max-w-md mx-auto space-y-2">
        <button
          type="button"
          onClick={onResetWorkflow}
          className="w-full min-h-[50px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm tracking-wide flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/30"
        >
          <RefreshCw className="w-4 h-4" />
          <span>New Route (Upload Manifest)</span>
        </button>

        <button
          type="button"
          onClick={onBackToEdit}
          className="w-full py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center space-x-1"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Address List</span>
        </button>
      </div>
    </div>
  );
}
