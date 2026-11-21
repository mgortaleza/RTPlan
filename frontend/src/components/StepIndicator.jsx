import React from 'react';
import { Camera, Check, ListOrdered, Navigation } from 'lucide-react';

const STEPS = [
  { id: 1, key: 'upload', label: 'Upload', icon: Camera },
  { id: 2, key: 'verify', label: 'Verify', icon: ListOrdered },
  { id: 3, key: 'drive', label: 'Drive', icon: Navigation },
];

export default function StepIndicator({
  currentStep,
  onStepClick,
  maxAllowedStep = 1,
  canGoToVerify = false,
  canGoToDrive = false,
}) {
  return (
    <nav aria-label="Progress" className="px-4 py-3 bg-slate-900 border-b border-slate-800/80">
      <ol className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = currentStep === step.key;
          const stepNumber = step.id;
          const currentNumber = currentStep === 'upload' ? 1 : currentStep === 'verify' ? 2 : 3;
          const isCompleted = stepNumber < currentNumber;
          
          const isClickable =
            step.id === 1
              ? true
              : step.id === 2
              ? (canGoToVerify || maxAllowedStep >= 2)
              : (canGoToDrive || maxAllowedStep >= 3);

          return (
            <li key={step.key} className="flex-1 flex items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.key)}
                className={`w-full flex items-center text-left py-1 group transition-all ${
                  !isClickable ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:opacity-90'
                }`}
                title={!isClickable ? 'Complete earlier steps first' : `Go to Step ${step.id}: ${step.label}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20'
                      : isClickable
                      ? 'bg-slate-800 text-indigo-300 border border-indigo-700/60'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                </div>
                <div className="ml-2.5 hidden min-[360px]:block">
                  <span
                    className={`block text-[11px] font-semibold uppercase tracking-wider ${
                      isCurrent
                        ? 'text-indigo-400'
                        : isCompleted
                        ? 'text-slate-300'
                        : isClickable
                        ? 'text-slate-400 group-hover:text-slate-200'
                        : 'text-slate-600'
                    }`}
                  >
                    Step {step.id}
                  </span>
                  <span
                    className={`block text-xs font-medium leading-none ${
                      isCurrent ? 'text-white' : isClickable ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    stepNumber < currentNumber ? 'bg-emerald-500/80' : 'bg-slate-800'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
