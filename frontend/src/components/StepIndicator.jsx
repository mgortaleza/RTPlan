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
    <nav aria-label="Progress" className="px-4 py-3 bg-slate-50 border-b border-slate-200">
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
                  !isClickable ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                }`}
                title={!isClickable ? 'Complete earlier steps first' : `Go to Step ${step.id}: ${step.label}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                      : isClickable
                      ? 'bg-white text-indigo-700 border border-indigo-200 group-hover:border-indigo-400 group-hover:bg-indigo-50/50'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                </div>
                <div className="ml-2.5 hidden min-[360px]:block">
                  <span
                    className={`block text-[11px] font-bold uppercase tracking-wider ${
                      isCurrent
                        ? 'text-indigo-600'
                        : isCompleted
                        ? 'text-emerald-700'
                        : isClickable
                        ? 'text-slate-600 group-hover:text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    Step {step.id}
                  </span>
                  <span
                    className={`block text-xs font-semibold leading-none ${
                      isCurrent
                        ? 'text-slate-900 font-bold'
                        : isClickable
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    stepNumber < currentNumber ? 'bg-emerald-500' : 'bg-slate-200'
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
