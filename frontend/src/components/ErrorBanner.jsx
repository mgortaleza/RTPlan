import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="mx-4 mt-3 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 shadow-lg shadow-rose-950/40 flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1 text-xs leading-relaxed">
        <p className="font-semibold text-rose-100 mb-0.5">Operation Notice</p>
        <p className="text-rose-200/90 whitespace-pre-wrap">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/60 transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
