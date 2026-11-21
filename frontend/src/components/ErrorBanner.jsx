import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 shadow-sm flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1 text-xs leading-relaxed">
        <p className="font-bold text-rose-900 mb-0.5">Notice</p>
        <p className="text-rose-700 whitespace-pre-wrap font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-lg text-rose-500 hover:text-rose-800 hover:bg-rose-100 transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
