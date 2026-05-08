'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface Step {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              {/* Step Circle */}
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all sm:h-10 sm:w-10',
                  isCompleted && 'bg-primary-600 text-white',
                  isActive && 'bg-primary-600 text-white ring-4 ring-primary-100',
                  !isCompleted && !isActive && 'bg-gray-100 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  step.number
                )}
              </div>
              {/* Step Label - hidden on mobile */}
              <span
                className={cn(
                  'mt-1.5 hidden text-xs font-medium sm:block',
                  isActive && 'text-primary-600',
                  isCompleted && 'text-primary-600',
                  !isCompleted && !isActive && 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {/* Connector Line */}
            {!isLast && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-8 sm:mx-3 sm:w-16',
                  isCompleted ? 'bg-primary-600' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
