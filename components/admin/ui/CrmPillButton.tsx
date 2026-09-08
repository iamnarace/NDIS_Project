import React from 'react';

export interface CrmPillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'secondary' | 'tinted' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export default function CrmPillButton({
  children,
  variant = 'primary',
  size = 'sm',
  icon,
  className = '',
  ...props
}: CrmPillButtonProps) {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  }[size];

  const variantClasses = {
    primary: 'bg-[#0F172A] text-white hover:bg-black shadow-sm active:scale-95',
    outline: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95',
    secondary: 'bg-[#ECEEF2] text-slate-800 hover:bg-slate-200 active:scale-95',
    tinted: 'bg-teal-50 text-teal-700 border border-teal-200/80 hover:bg-teal-100 active:scale-95',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:scale-95',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70',
  }[variant];

  return (
    <button
      className={`rounded-full font-semibold transition inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
