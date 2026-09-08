import React from 'react';
export type SquircleTint = 'teal' | 'indigo' | 'sky' | 'amber' | 'emerald' | 'rose' | 'slate';
export interface CrmSquircleCardProps {
 title: string; subtitle?: string; value?: string | number; meta?: string; icon: React.ReactNode; tint?: SquircleTint;
 badge?: string; actionLabel?: string; onAction?: () => void; onClick?: () => void; footer?: React.ReactNode; className?: string;
}
export default function CrmSquircleCard({title,subtitle,value,meta,icon,tint='teal',badge,actionLabel,onAction,onClick,footer,className=''}: CrmSquircleCardProps) {
 return <section className={`vsCard ocMetric ${className}`}>
 <div className="ocMetricTop"><h3>{title}</h3><div className={`vsSquircle ${tint}`} aria-hidden="true">{icon}</div></div>
 {value !== undefined && <div className="ocMetricValue">{value}</div>}
 {badge && <div><span className="ocBadge">{badge}</span></div>}
 {subtitle && <p>{subtitle}</p>}
 <div className="ocMetricFooter"><span className="ocMetricMeta">{footer || meta}</span>
 {(onAction || onClick) && <button type="button" className="ocTextButton" onClick={onAction || onClick}>{actionLabel || 'View details'} <span aria-hidden="true">→</span></button>}</div>
 </section>;
}
