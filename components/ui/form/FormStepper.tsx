'use client';
import { Check } from 'lucide-react';
export interface FormStep { num: number; label: string; optional?: boolean; }
export interface FormStepperProps { steps: FormStep[]; currentStep: number; onStepClick?: (stepNum: number) => void; }
export function FormStepper({steps,currentStep,onStepClick}:FormStepperProps) {
 return <ol className="ocStepper" aria-label="Form progress" style={{gridTemplateColumns:`repeat(${steps.length}, minmax(0, 1fr))`}}>
 {steps.map(step=><li key={step.num} aria-current={currentStep===step.num?'step':undefined} data-complete={currentStep>step.num}>
 <span className="ocStepNumber" aria-hidden="true">{currentStep>step.num?<Check size={14}/>:step.num}</span>
 {onStepClick && currentStep>step.num ? <button type="button" onClick={()=>onStepClick(step.num)}>{step.label}</button>:<span>{step.label}</span>}
 </li>)}
 </ol>;
}
export default FormStepper;
