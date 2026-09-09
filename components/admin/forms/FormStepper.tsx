'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  num: number;
  label: string;
}

export interface FormStepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepNum: number) => void;
}

export default function FormStepper({
  steps,
  currentStep,
  onStepClick,
}: FormStepperProps) {
  return (
    <div className="stepper-bar" role="tablist">
      {steps.map((s) => {
        const isActive = s.num === currentStep;
        const isCompleted = s.num < currentStep;

        return (
          <button
            key={s.num}
            type="button"
            className={`step-pill ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            onClick={() => onStepClick && onStepClick(s.num)}
            disabled={!onStepClick || s.num > currentStep}
          >
            <span className="step-num">
              {isCompleted ? <Check size={11} strokeWidth={3} /> : s.num}
            </span>
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
