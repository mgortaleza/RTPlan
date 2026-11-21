import React, { useRef, useState } from 'react';
import { UploadCloud, ImagePlus, X, Sparkles, FileText, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

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
  onExtract,
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

  return (
    <div className="flex flex-col flex-1 pb-24">
      <div className="p-4 space-y-4">
        {/* Intro Banner */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Upload Manifest Screenshots</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Take photo screenshots of your delivery manifests or app tickets. Gemini OCR will extract all customer addresses.
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
              ? 'border-indigo-400 bg-indigo-950/30 scale-[0.99]'
              : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'
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

          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>

          <p className="text-sm font-medium text-white">
            Tap to select or take screenshots
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports multiple PNG, JPG, or WEBP photos
          </p>

          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-700/60 text-[11px] text-slate-300 font-medium">
            <ImagePlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Photo Library & Camera</span>
          </div>
        </div>

        {/* Selected Images Section */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Selected Photos ({files.length})
              </h3>
              <button
                type="button"
                onClick={clearAllFiles}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium py-1 px-2 transition-colors"
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
                    className="relative group rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80 aspect-[4/3] flex flex-col justify-end"
                  >
                    <img
                      src={objectUrl}
                      alt={file.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(objectUrl)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-slate-900/80 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-md z-10"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="relative p-2 z-10">
                      <p className="text-[11px] font-medium text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{sizeKb} KB</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Sample Data Option */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => onUseSampleAddresses(SAMPLE_TEST_ADDRESSES)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  Load Test Delivery Stops
                </p>
                <p className="text-[11px] text-slate-400">
                  Preload the 7 Los Angeles stops from the test manifest photos
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800/80 z-20 max-w-md mx-auto">
        <button
          type="button"
          disabled={files.length === 0 || isLoading}
          onClick={onExtract}
          className={`w-full min-h-[50px] rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center space-x-2 transition-all shadow-lg ${
            files.length === 0 || isLoading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-indigo-600/30'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Scanning with Gemini OCR...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-indigo-300" />
              <span>
                {files.length === 0
                  ? 'Select Screenshots to Begin'
                  : `Extract Addresses (${files.length} Photo${files.length > 1 ? 's' : ''})`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
