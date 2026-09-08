'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface FormStep {
  num: number;
  label: string;
  optional?: boolean;
}

export interface FormStepperProps {
  steps: FormStep[];
  currentStep: number;
  onStepClick?: (stepNum: number) => void;
}

export function FormStepper({ steps, currentStep, onStepClick }: FormStepperProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 24px',
        background: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        overflowX: 'auto',
      }}
    >
      {steps.map((step, idx) => {
        const isCurrent = currentStep === step.num;
        const isCompleted = currentStep > step.num;
        const clickable = onStepClick && isCompleted;

        return (
          <React.Fragment key={step.num}>
            <div
              onClick={() => clickable && onStepClick(step.num)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: clickable ? 'pointer' : 'default',
                opacity: currentStep < step.num ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: isCompleted ? '#10B981' : isCurrent ? '#0284C7' : '#E2E8F0',
                  color: isCompleted || isCurrent ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                {isCompleted ? <Check size={14} strokeWidth={2.5} /> : step.num}
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: isCurrent ? 600 : 500,
                  color: isCurrent ? '#0F172A' : '#64748B',
                }}
              >
                {step.label}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                style={{
                  width: 28,
                  height: 1.5,
                  background: currentStep > step.num ? '#10B981' : '#E2E8F0',
                  margin: '0 12px',
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default FormStepper;
