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
  onOptimize,
  onBackToUpload,
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
    <div className="flex flex-col flex-1 pb-32">
      <div className="p-4 space-y-4">
        {/* Header Summary */}
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

        {/* Dispatch Settings (Driver & Date) */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center space-x-1">
                <User className="w-3 h-3 text-indigo-400" />
                <span>Driver</span>
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {drivers.map((d) => (
                  <option key={d.driverId} value={d.driverId}>
                    {d.fullName} (ID #{d.driverId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span>Route Date</span>
              </label>
              <input
                type="date"
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Starting Origin Address Card */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-800/70 to-slate-800/70 border border-emerald-800/40 rounded-2xl p-3.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-xs">
              <Building2 className="w-4 h-4" />
              <span>Starting Origin (Depot / Warehouse)</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-medium bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
              Start Pin
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              placeholder="e.g. 200 Medical Plaza, Los Angeles, CA 90095"
              className="w-full bg-slate-900/90 border border-emerald-700/50 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Preset Origin Chips */}
          <div className="flex items-center space-x-2 pt-1 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-400 shrink-0">Quick presets:</span>
            <button
              type="button"
              onClick={() => applyPresetOrigin('200 Medical Plaza, Los Angeles, CA 90095')}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium shrink-0 border border-slate-700 transition-colors"
            >
              UCLA Medical Plaza
            </button>
            <button
              type="button"
              onClick={() => applyPresetOrigin('757 Westwood Plaza, Los Angeles, CA 90095')}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium shrink-0 border border-slate-700 transition-colors"
            >
              Ronald Reagan Pharmacy
            </button>
          </div>
        </div>

        {/* Stops List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Delivery Stops ({stops.length})
            </h3>
            <span className="text-[11px] text-slate-400">TSP order will be calculated</span>
          </div>

          {stops.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center bg-slate-900/40">
              <AlertTriangle className="w-8 h-8 text-amber-400/80 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-300">No delivery stops added</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Click '+ Add Stop' below or go back to upload screenshots</p>
            </div>
          ) : (
            stops.map((stop, idx) => (
              <div
                key={idx}
                className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-2xl p-3 shadow-sm transition-all focus-within:border-indigo-500/80"
              >
                <div className="flex items-start space-x-2.5">
                  {/* Sequence Badge */}
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-indigo-400 border border-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>

                  {/* Input area */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-slate-400">Stop #{idx + 1}</span>
                      {stop.isManuallyEdited && (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.2 rounded">
                          Edited
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={stop.correctedAddress}
                      onChange={(e) => handleAddressChange(idx, e.target.value)}
                      placeholder="Enter full street address, city, state, ZIP"
                      className="w-full bg-slate-900/80 border border-slate-700 focus:border-indigo-500 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed transition-colors"
                    />
                  </div>

                  {/* Reorder and Delete Actions */}
                  <div className="flex flex-col space-y-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStop(idx, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-slate-900/80 flex items-center justify-center transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === stops.length - 1}
                      onClick={() => handleMoveStop(idx, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-slate-900/80 flex items-center justify-center transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStop(idx)}
                      className="w-7 h-7 rounded-lg bg-slate-900/80 text-rose-400 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-colors"
                      title="Delete stop"
                      aria-label="Delete stop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Add Stop Button */}
          <button
            type="button"
            onClick={handleAddStop}
            className="w-full min-h-[46px] rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-400 bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 hover:text-indigo-400 font-semibold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Stop</span>
          </button>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800/80 z-20 max-w-md mx-auto space-y-2">
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
              <span>Optimize Route ({totalStopCount} {totalStopCount === 1 ? 'Stop' : 'Stops'})</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBackToUpload}
          disabled={isLoading}
          className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          Back to Screenshot Upload
        </button>
      </div>
    </div>
  );
}
