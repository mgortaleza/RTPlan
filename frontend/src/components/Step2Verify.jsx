import React, { useState, useEffect } from 'react';
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
  Check,
  BookmarkPlus,
  Bookmark,
  ChevronDown,
} from 'lucide-react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export const DEFAULT_PRESETS = [
  {
    id: 'ucla_mp1',
    label: 'UCLA MP1 Pharmacy',
    address: '200 Medical Plaza Suite 135, Los Angeles, CA 90095',
  },
  {
    id: 'rr_pharmacy',
    label: 'Ronald Reagan Pharmacy',
    address: '757 Westwood Plaza, Los Angeles, CA 90095',
  },
];

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
  presets: propPresets,
  setPresets: propSetPresets,
}) {
  const [originNotice, setOriginNotice] = useState(null);

  // Saved origin presets (persisted in localStorage)
  const [internalPresets, setInternalPresets] = useState(() => {
    return loadFromStorage('origin_presets', DEFAULT_PRESETS);
  });

  const presets = propPresets ?? internalPresets;
  const setPresets = propSetPresets ?? setInternalPresets;
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetLabel, setNewPresetLabel] = useState('');

  useEffect(() => {
    saveToStorage('origin_presets', presets);
  }, [presets]);

  // Keep dropdown selection synchronized when originAddress changes
  useEffect(() => {
    if (originAddress && presets && presets.length > 0) {
      const match = presets.find(
        (p) => p.address?.trim().toLowerCase() === originAddress.trim().toLowerCase()
      );
      setSelectedPresetId(match ? match.id : '');
    } else {
      setSelectedPresetId('');
    }
  }, [originAddress, presets]);

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

  // Assign a scanned address as the origin depot/start location
  const handleSetAsOrigin = (index) => {
    const selectedStop = stops[index];
    if (!selectedStop || !selectedStop.correctedAddress?.trim()) return;

    const newOrigin = selectedStop.correctedAddress.trim();
    setOriginAddress(newOrigin);

    // Remove this address from the delivery stops list since it's now the starting origin
    setStops((prev) => prev.filter((_, i) => i !== index));

    // Show temporary confirmation
    setOriginNotice(`Set "${newOrigin.length > 35 ? newOrigin.slice(0, 35) + '...' : newOrigin}" as Starting Origin.`);
    setTimeout(() => setOriginNotice(null), 4000);
  };

  // Preset Selection from Dropdown
  const handleSelectPreset = (e) => {
    const presetId = e.target.value;
    setSelectedPresetId(presetId);
    if (!presetId) return;

    const found = presets.find((p) => p.id === presetId);
    if (found) {
      setOriginAddress(found.address);
      setOriginNotice(`Applied preset "${found.label}".`);
      setTimeout(() => setOriginNotice(null), 3000);
    }
  };

  // Start saving current starting origin as a preset
  const handleStartSavePreset = () => {
    if (!originAddress.trim()) return;
    const defaultLabel = originAddress.split(',')[0].trim() || 'Depot';
    setNewPresetLabel(defaultLabel);
    setIsSavingPreset(true);
  };

  // Confirm saving new preset
  const handleConfirmSavePreset = (e) => {
    e.preventDefault();
    if (!originAddress.trim()) return;

    const label = newPresetLabel.trim() || originAddress.split(',')[0].trim() || 'Saved Location';
    const newPreset = {
      id: `preset_${Date.now()}`,
      label,
      address: originAddress.trim(),
    };

    setPresets((prev) => [newPreset, ...prev]);
    setSelectedPresetId(newPreset.id);
    setIsSavingPreset(false);
    setNewPresetLabel('');
    setOriginNotice(`Saved "${label}" to origin presets!`);
    setTimeout(() => setOriginNotice(null), 3000);
  };

  // Delete preset from dropdown
  const handleDeletePreset = (idToDelete) => {
    if (!idToDelete) return;
    const toDelete = presets.find((p) => p.id === idToDelete);
    setPresets((prev) => prev.filter((p) => p.id !== idToDelete));
    if (selectedPresetId === idToDelete) {
      setSelectedPresetId('');
    }
    setOriginNotice(`Deleted preset "${toDelete?.label || 'Location'}".`);
    setTimeout(() => setOriginNotice(null), 3000);
  };

  const totalStopCount = stops.filter((s) => s.correctedAddress?.trim()).length + (originAddress.trim() ? 1 : 0);

  return (
    <div className="flex flex-col flex-1 pb-36">
      <div className="p-4 space-y-4">
        {/* Navigation & Header Summary */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Verify & Edit Addresses</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and correct addresses before route optimization.
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            {totalStopCount} {totalStopCount === 1 ? 'Stop' : 'Stops'}
          </div>
        </div>

        {/* Temporary Origin Assignment Confirmation Banner */}
        {originNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{originNotice}</span>
          </div>
        )}

        {/* Quick shortcut if manifest already exists */}
        {manifest && onGoToDrive && (
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-900">
                Manifest #{manifest.manifestId} already generated
              </span>
            </div>
            <button
              type="button"
              onClick={onGoToDrive}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1 shadow-2xs"
            >
              <span>View Route</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Dispatch Settings (Driver & Date) */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <User className="w-3 h-3 text-indigo-600" />
                <span>Driver</span>
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                {drivers.map((d) => (
                  <option key={d.driverId} value={d.driverId}>
                    {d.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-indigo-600" />
                <span>Route Date</span>
              </label>
              <input
                type="date"
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Starting Origin Address Card with Preset Dropdown & Save Button */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Starting Origin (Depot / Start Location)</span>
            </label>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              Stop #1
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              placeholder="e.g. 200 Medical Plaza, Los Angeles, CA 90095"
              className="w-full bg-white border border-emerald-300 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs font-medium"
            />
          </div>

          {/* Preset Dropdown and Add as Preset Action */}
          <div className="pt-1 border-t border-emerald-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 flex items-center space-x-1">
                <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                <span>Origin Presets</span>
              </span>

              {!isSavingPreset && (
                <button
                  type="button"
                  disabled={!originAddress.trim()}
                  onClick={handleStartSavePreset}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Save as Preset</span>
                </button>
              )}
            </div>

            {/* Inline Preset Name Input when saving */}
            {isSavingPreset && (
              <form onSubmit={handleConfirmSavePreset} className="p-2.5 rounded-xl bg-white border border-emerald-300 space-y-2 animate-in fade-in">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">
                  Name for this preset:
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    value={newPresetLabel}
                    onChange={(e) => setNewPresetLabel(e.target.value)}
                    placeholder="e.g. Main Depot or Warehouse"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSavingPreset(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Preset Dropdown with integrated Delete action */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <select
                  value={selectedPresetId}
                  onChange={handleSelectPreset}
                  className="w-full bg-white border border-emerald-300 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 shadow-2xs font-medium appearance-none"
                >
                  <option value="">Select a saved location...</option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} - {p.address}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {selectedPresetId && (
                <button
                  type="button"
                  onClick={() => handleDeletePreset(selectedPresetId)}
                  className="p-2 rounded-xl bg-white border border-rose-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shadow-2xs transition-colors shrink-0"
                  title="Delete selected preset from dropdown"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Extracted Stops List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Delivery Stops ({stops.length})
            </h3>
            <span className="text-[10px] text-slate-500">
              Tap arrows or Set Origin
            </span>
          </div>

          {stops.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200">
              <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">No delivery stops added yet.</p>
              <button
                type="button"
                onClick={handleAddStop}
                className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors inline-flex items-center space-x-1"
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
                        ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                          {stopNumber}
                        </span>
                        <span className="text-[11px] font-bold text-slate-800">
                          Stop #{stopNumber}
                        </span>
                        {isEdited && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
                            Edited
                          </span>
                        )}
                      </div>

                      {/* Stop Controls: Set as Origin, Move, Delete */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleSetAsOrigin(index)}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center space-x-1 transition-colors"
                          title="Assign this scanned address as the starting origin depot"
                        >
                          <Building2 className="w-3 h-3 text-emerald-600" />
                          <span>Set Origin</span>
                        </button>

                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveStop(index, -1)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === stops.length - 1}
                          onClick={() => handleMoveStop(index, 1)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStop(index)}
                          className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 ml-0.5"
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
                      className="w-full bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-medium"
                    />

                    {/* Original OCR text reference */}
                    {stop.originalExtractedText && stop.originalExtractedText !== stop.correctedAddress && (
                      <div className="mt-1 flex items-center space-x-1 text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-400">OCR:</span>
                        <span className="truncate">{stop.originalExtractedText}</span>
                        <button
                          type="button"
                          onClick={() => handleAddressChange(index, stop.originalExtractedText)}
                          className="text-indigo-600 hover:underline font-semibold shrink-0 ml-1"
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
            className="w-full min-h-[46px] rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 text-slate-700 hover:text-indigo-700 font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Add Delivery Stop Manually</span>
          </button>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-20 max-w-md mx-auto space-y-2">
        <button
          type="button"
          disabled={totalStopCount === 0 || isLoading}
          onClick={onOptimize}
          className={`w-full min-h-[50px] rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2 transition-all shadow-md ${
            totalStopCount === 0 || isLoading
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-emerald-600/20'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Optimizing Route via Google Routes...</span>
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5 text-emerald-100" />
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
            className="flex-1 min-h-[38px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center space-x-1 transition-colors border border-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Upload</span>
          </button>

          {manifest && onGoToDrive && (
            <button
              type="button"
              onClick={onGoToDrive}
              disabled={isLoading}
              className="flex-1 min-h-[38px] rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center justify-center space-x-1 transition-colors shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>View Active Route</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
