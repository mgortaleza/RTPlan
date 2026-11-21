import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  ImagePlus,
  X,
  Sparkles,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ListOrdered,
  Navigation,
  Trash2,
  History,
} from 'lucide-react';

// Sample LA Addresses directly from C:\DEV\RTPlanner\TestImages for quick testing
const SAMPLE_TEST_ADDRESSES = [
  "200 Medical Plaza, Los Angeles, CA 90095",
  "10320 ALMAYO AVE APT 2, LOS ANGELES, CA 90064",
  "3207 CORINTH AVE, LOS ANGELES, CA 90066",
  "11131 ROSE AVE APT 21, LOS ANGELES, CA 90034",
  "2749 South Sepulveda Blvd, Los Angeles, CA 90064",
  "2567 VETERAN AVE, RANCHO PARK, CA 90064",
  "1932 PELHAM AVE, LOS ANGELES, CA 90025",
];

export default function Step1Upload({
  files,
  setFiles,
  stops = [],
  manifest = null,
  onExtract,
  onGoToVerify,
  onGoToDrive,
  onClearStops,
  onOpenRecentRoutes,
  isLoading,
  onUseSampleAddresses,
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const clearAllFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasExistingStops = stops && stops.length > 0;

  return (
    <div className="flex flex-col flex-1 pb-28">
      <div className="p-4 space-y-4">
        {/* Existing Route / Stops Status Card if already scanned */}
        {hasExistingStops && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {stops.length} Stop{stops.length > 1 ? 's' : ''} Already Loaded
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    Your scanned addresses are saved. No need to rescan!
                  </p>
                </div>
              </div>

              {onClearStops && (
                <button
                  type="button"
                  onClick={onClearStops}
                  className="text-xs text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Clear existing stops"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={onGoToVerify}
                className="flex-1 min-h-[42px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Continue to Verify & Edit ({stops.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {manifest && (
                <button
                  type="button"
                  onClick={onGoToDrive}
                  className="min-h-[42px] px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5 text-white" />
                  <span>View Route</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Intro Banner */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {hasExistingStops ? 'Add More Screenshots (Optional)' : 'Upload Manifest Screenshots'}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {hasExistingStops
                  ? 'Take photo screenshots to append additional delivery addresses to your current list, or proceed directly to verify.'
                  : 'Take photo screenshots of your delivery manifests or app tickets. Gemini OCR will extract all customer addresses.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tap/Drop Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>

          <p className="text-sm font-bold text-slate-900">
            Tap to select or take screenshots
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports multiple PNG, JPG, or WEBP photos
          </p>

          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-600 font-semibold shadow-2xs">
            <ImagePlus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Photo Library & Camera</span>
          </div>
        </div>

        {/* Selected Images Section */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Selected Photos ({files.length})
              </h3>
              <button
                type="button"
                onClick={clearAllFiles}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold py-1 px-2 transition-colors"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {files.map((file, idx) => {
                const objectUrl = URL.createObjectURL(file);
                const sizeKb = Math.round(file.size / 1024);

                return (
                  <div
                    key={`${file.name}-${idx}`}
                    className="relative group rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[4/3] flex flex-col justify-end shadow-xs"
                  >
                    <img
                      src={objectUrl}
                      alt={file.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(objectUrl)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 hover:bg-rose-600 hover:text-white text-slate-700 flex items-center justify-center transition-colors shadow-sm z-10"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="relative p-2 z-10">
                      <p className="text-[11px] font-semibold text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-200">{sizeKb} KB</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Options (Recent Routes & Sample Data) */}
        <div className="pt-2 border-t border-slate-200 space-y-2">
          {onOpenRecentRoutes && (
            <button
              type="button"
              onClick={onOpenRecentRoutes}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200 text-left transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Recall a Recent Route
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Open a previously saved delivery manifest
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>
          )}

          {!hasExistingStops && (
            <button
              type="button"
              onClick={() => onUseSampleAddresses(SAMPLE_TEST_ADDRESSES)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Load Test Delivery Stops
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Preload the 7 Los Angeles stops from test manifest photos
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-20 max-w-md mx-auto space-y-2">
        {files.length > 0 ? (
          <button
            type="button"
            disabled={isLoading}
            onClick={onExtract}
            className={`w-full min-h-[50px] rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2 transition-all shadow-md ${
              isLoading
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-indigo-600/20'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Scanning with Gemini OCR...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-indigo-200" />
                <span>
                  {hasExistingStops
                    ? `Extract & Append (${files.length} Photo${files.length > 1 ? 's' : ''})`
                    : `Extract Addresses (${files.length} Photo${files.length > 1 ? 's' : ''})`}
                </span>
              </>
            )}
          </button>
        ) : hasExistingStops ? (
          <button
            type="button"
            onClick={onGoToVerify}
            className="w-full min-h-[50px] rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2 transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-emerald-600/20"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Proceed to Verify ({stops.length} Stops)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full min-h-[50px] rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2 bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
          >
            <Sparkles className="w-5 h-5 text-slate-400" />
            <span>Select Screenshots to Begin</span>
          </button>
        )}
      </div>
    </div>
  );
}
