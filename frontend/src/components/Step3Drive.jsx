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
  History,
  MessageSquare,
  Mail,
  Share,
} from 'lucide-react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export default function Step3Drive({
  manifest,
  onResetWorkflow,
  onBackToEdit,
  onBackToUpload,
  onOpenRecentRoutes,
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

  // Format shareable text message for SMS / email / clipboard
  const buildShareableText = () => {
    const lines = [
      `🚚 NetYX Route Planner - Route #${manifestId} - ${routeDate || 'Today'}`,
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

  // 1. Copy All Links to Clipboard
  const handleCopyAllLinks = async () => {
    const text = buildShareableText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 2. Share via SMS / Native Text Messaging
  const handleShareSMS = () => {
    const text = buildShareableText();
    // iOS and Android support sms:?&body=
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    window.location.href = `sms:${separator}body=${encodeURIComponent(text)}`;
  };

  // 3. Share via Email
  const handleShareEmail = () => {
    const text = buildShareableText();
    const subject = `NetYX Route Planner - Route #${manifestId} - ${routeDate || 'Today'}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  };

  // 4. Native OS Share Sheet (AirDrop, Messages, WhatsApp, Notes, etc.)
  const handleNativeShare = async () => {
    const text = buildShareableText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `NetYX Route Planner - Route #${manifestId}`,
          text: text,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyAllLinks();
        }
      }
    } else {
      handleCopyAllLinks();
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="flex flex-col flex-1 pb-36">
      <div className="p-4 space-y-4">
        {/* Route Summary Card */}
        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-200 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700">
                  Manifest #{manifestId}
                </span>
                <h2 className="text-base font-bold text-slate-900 leading-tight">Optimized Delivery Plan</h2>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              {status || 'OPTIMIZED'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
            <div className="bg-white rounded-xl p-2 border border-slate-200/80 shadow-2xs">
              <span className="block text-[10px] font-semibold text-slate-500">Total Stops</span>
              <span className="text-sm font-extrabold text-slate-900">{stops.length}</span>
            </div>
            <div className="bg-white rounded-xl p-2 border border-slate-200/80 shadow-2xs">
              <span className="block text-[10px] font-semibold text-slate-500">Nav Legs</span>
              <span className="text-sm font-extrabold text-indigo-600">{links.length}</span>
            </div>
            <div className="bg-white rounded-xl p-2 border border-slate-200/80 shadow-2xs">
              <span className="block text-[10px] font-semibold text-slate-500">Date</span>
              <span className="text-[11px] font-bold text-slate-800 truncate block">
                {routeDate || 'Today'}
              </span>
            </div>
          </div>

          {driverName && (
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
              <div className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Driver: <strong className="text-slate-900">{driverName}</strong></span>
              </div>

              {onOpenRecentRoutes && (
                <button
                  type="button"
                  onClick={onOpenRecentRoutes}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <History className="w-3 h-3" />
                  <span>Other Routes</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Share Route Action Card (Copy, SMS, Email, Native Share) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Share Route & Links</span>
            </span>
            <span className="text-[10px] text-slate-500">
              Instant dispatch options
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* SMS Option */}
            <button
              type="button"
              onClick={handleShareSMS}
              className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 border border-slate-200 text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all active:scale-[0.98] shadow-2xs"
              title="Open pre-filled SMS message"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Text / SMS</span>
            </button>

            {/* Email Option */}
            <button
              type="button"
              onClick={handleShareEmail}
              className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 border border-slate-200 text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all active:scale-[0.98] shadow-2xs"
              title="Open pre-filled Email message"
            >
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Email</span>
            </button>

            {/* Native Share or Copy */}
            {hasNativeShare ? (
              <button
                type="button"
                onClick={handleNativeShare}
                className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 border border-slate-200 text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all active:scale-[0.98] shadow-2xs"
                title="Open system share sheet"
              >
                <Share className="w-4 h-4 text-blue-600" />
                <span>Share...</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCopyAllLinks}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all active:scale-[0.98] shadow-2xs ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-slate-600" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            )}
          </div>

          {/* Full Copy All Button */}
          <button
            type="button"
            onClick={handleCopyAllLinks}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-2xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied All Map Links to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-600" />
                <span>Copy All Formatted Map Links</span>
              </>
            )}
          </button>
        </div>

        {/* Chunked Google Maps Legs Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Navigation className="w-3.5 h-3.5 text-indigo-600" />
              <span>Navigation Legs (9 Stops Max Each)</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
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
                className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 transition-all ${
                  isOpened
                    ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Leg Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        isOpened
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {chunkNum}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      Leg {chunkNum}: Stops {legStartIdx + 1}–{legEndIdx + 1}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isOpened && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        ✓ In Progress
                      </span>
                    )}
                    <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-semibold">
                      {stopCountInLeg} Stops
                    </span>
                  </div>
                </div>

                {/* Start & End Points */}
                <div className="bg-slate-50/90 rounded-xl p-3 space-y-2 text-xs border border-slate-100">
                  <div className="flex items-start space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                        Start (Stop #{legStartIdx + 1})
                      </span>
                      <p className="text-slate-800 text-xs font-medium truncate">
                        {startStop?.correctedAddress || 'Origin'}
                      </p>
                    </div>
                  </div>

                  <div className="border-l border-dashed border-slate-300 ml-1 h-2" />

                  <div className="flex items-start space-x-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">
                        End (Stop #{legEndIdx + 1})
                      </span>
                      <p className="text-slate-800 text-xs font-medium truncate">
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
                  className={`w-full min-h-[48px] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-[0.98] ${
                    isOpened
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowAllStops((prev) => !prev)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                All Ordered Stops ({stops.length})
              </span>
            </div>
            {showAllStops ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showAllStops && (
            <div className="p-3 pt-0 border-t border-slate-200 divide-y divide-slate-100 space-y-2">
              {stops.map((stop, idx) => (
                <div key={stop.stopId || idx} className="pt-2 first:pt-1 flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {stop.optimizedSequence !== undefined ? stop.optimizedSequence + 1 : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{stop.correctedAddress}</p>
                    {stop.latitude && stop.longitude && (
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        {Number(stop.latitude).toFixed(5)}, {Number(stop.longitude).toFixed(5)}
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.correctedAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Start New Route?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This will clear your current manifest and stops. Are you sure you want to start over?
                </p>
              </div>
            </div>
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 min-h-[42px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetWorkflow();
                }}
                className="flex-1 min-h-[42px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Yes, Start New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-20 max-w-md mx-auto space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBackToEdit}
            className="flex-1 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Address List</span>
          </button>

          {onBackToUpload && (
            <button
              type="button"
              onClick={onBackToUpload}
              className="px-3 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center justify-center space-x-1 transition-colors border border-slate-200"
              title="Add more photos"
            >
              <ImagePlus className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden min-[360px]:inline">Add Photos</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="w-full py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center space-x-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Route (Start Fresh)</span>
        </button>
      </div>
    </div>
  );
}
