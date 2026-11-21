import React from 'react';
import {
  MapPin,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Navigation,
  Building2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RotateCcw,
  User,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Eye,
} from 'lucide-react';

export default function Step2Verify({
  originAddress,
  setOriginAddress,
  stops,
  setStops,
  drivers,
  selectedDriverId,
  setSelectedDriverId,
  routeDate,
  setRouteDate,
  manifest = null,
  onOptimize,
  onBackToUpload,
  onGoToDrive,
  isLoading,
}) {
  const handleAddressChange = (index, value) => {
    setStops((prev) =>
      prev.map((stop, i) => {
        if (i === index) {
          return {
            ...stop,
            correctedAddress: value,
            isManuallyEdited: value !== stop.originalExtractedText,
          };
        }
        return stop;
      })
    );
  };

  const handleDeleteStop = (indexToDelete) => {
    setStops((prev) => prev.filter((_, i) => i !== indexToDelete));
  };

  const handleAddStop = () => {
    setStops((prev) => [
      ...prev,
      {
        originalExtractedText: '',
        correctedAddress: '',
        isManuallyEdited: true,
      },
    ]);
  };

  const handleMoveStop = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    setStops((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const applyPresetOrigin = (preset) => {
    setOriginAddress(preset);
  };

  const totalStopCount = stops.filter((s) => s.correctedAddress?.trim()).length + (originAddress.trim() ? 1 : 0);

  return (
    <div className="flex flex-col flex-1 pb-36">
      <div className="p-4 space-y-4">
        {/* Navigation & Header Summary */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Verify & Edit Addresses</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and correct addresses before route optimization.
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 text-xs font-semibold">
            {totalStopCount} {totalStopCount === 1 ? 'Stop' : 'Stops'}
          </div>
        </div>

        {/* Quick shortcut if manifest already exists */}
        {manifest && onGoToDrive && (
          <div className="bg-indigo-950/40 border border-indigo-700/50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-indigo-200">
                Manifest #{manifest.manifestId} already generated
              </span>
            </div>
            <button
              type="button"
              onClick={onGoToDrive}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1"
            >
              <span>View Route</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Dispatch Settings (Driver & Date) */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <User className="w-3 h-3 text-indigo-400" />
                <span>Driver</span>
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {drivers.map((d) => (
                  <option key={d.driverId} value={d.driverId}>
                    {d.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span>Route Date</span>
              </label>
              <input
                type="date"
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
              </input>
            </div>
          </div>
        </div>

        {/* Starting Origin Address Input */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Starting Origin (Depot / Start Location)</span>
            </label>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              Stop #1
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              placeholder="e.g. 200 Medical Plaza, Los Angeles, CA 90095"
              className="w-full bg-slate-900 border border-emerald-500/40 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/30"
            />
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 self-center mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => applyPresetOrigin('200 Medical Plaza, Los Angeles, CA 90095')}
              className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              UCLA Plaza
            </button>
            <button
              type="button"
              onClick={() => applyPresetOrigin('Current Location')}
              className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              GPS Current
            </button>
          </div>
        </div>

        {/* Extracted Stops List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Delivery Stops ({stops.length})
            </h3>
            <span className="text-[10px] text-slate-400">
              Drag or tap arrows to reorder
            </span>
          </div>

          {stops.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-800/30 border border-slate-800">
              <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No delivery stops added yet.</p>
              <button
                type="button"
                onClick={handleAddStop}
                className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600/30 text-indigo-300 text-xs font-medium hover:bg-indigo-600/50 transition-colors inline-flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add first stop manually</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {stops.map((stop, index) => {
                const isEdited = stop.isManuallyEdited;
                const stopNumber = (originAddress.trim() ? 2 : 1) + index;

                return (
                  <div
                    key={`stop-${index}`}
                    className={`rounded-2xl p-3 border transition-all ${
                      isEdited
                        ? 'bg-slate-800/90 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-600/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center">
                          {stopNumber}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-300">
                          Stop #{stopNumber}
                        </span>
                        {isEdited && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                            Edited
                          </span>
                        )}
                      </div>

                      {/* Stop Controls (Reorder & Delete) */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveStop(index, -1)}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === stops.length - 1}
                          onClick={() => handleMoveStop(index, 1)}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStop(index)}
                          className="p-1 rounded text-rose-400 hover:text-rose-300 ml-1"
                          title="Delete Stop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Address Textarea/Input */}
                    <textarea
                      rows={2}
                      value={stop.correctedAddress}
                      onChange={(e) => handleAddressChange(index, e.target.value)}
                      placeholder="Enter street address, city, state, zip..."
                      className="w-full bg-slate-900/80 border border-slate-700 focus:border-indigo-400 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400/30 resize-none"
                    />

                    {/* Original OCR text reference */}
                    {stop.originalExtractedText && stop.originalExtractedText !== stop.correctedAddress && (
                      <div className="mt-1 flex items-center space-x-1 text-[10px] text-slate-400">
                        <span className="text-slate-500">OCR:</span>
                        <span className="truncate">{stop.originalExtractedText}</span>
                        <button
                          type="button"
                          onClick={() => handleAddressChange(index, stop.originalExtractedText)}
                          className="text-indigo-400 hover:underline shrink-0 ml-1"
                          title="Revert to original OCR text"
                        >
                          Revert
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Stop Button */}
          <button
            type="button"
            onClick={handleAddStop}
            className="w-full min-h-[46px] rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-400 bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 hover:text-indigo-400 font-semibold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Stop Manually</span>
          </button>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 z-20 max-w-md mx-auto space-y-2">
        <button
          type="button"
          disabled={totalStopCount === 0 || isLoading}
          onClick={onOptimize}
          className={`w-full min-h-[50px] rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2 transition-all shadow-lg ${
            totalStopCount === 0 || isLoading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-emerald-600/30'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Optimizing Route via Google Routes...</span>
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5 text-emerald-200" />
              <span>
                {manifest ? 'Re-Optimize Route' : 'Optimize Route'} ({totalStopCount} {totalStopCount === 1 ? 'Stop' : 'Stops'})
              </span>
            </>
          )}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBackToUpload}
            disabled={isLoading}
            className="flex-1 min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Upload</span>
          </button>

          {manifest && onGoToDrive && (
            <button
              type="button"
              onClick={onGoToDrive}
              disabled={isLoading}
              className="flex-1 min-h-[38px] rounded-xl bg-indigo-900/60 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/60 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Active Route</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
