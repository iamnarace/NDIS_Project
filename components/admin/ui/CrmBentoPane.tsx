import React from 'react';
export interface CrmBentoPaneProps {
 title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
 tintHeader?: 'lavender' | 'teal' | 'sky' | 'amber' | 'coral' | 'slate' | 'none'; noPadding?: boolean; className?: string;
}
export default function CrmBentoPane({title,subtitle,action,children,noPadding=false,className=''}: CrmBentoPaneProps) {
 return <section className={`vsCard ${className}`} style={{padding:0,overflow:'hidden'}}>
 {(title || subtitle || action) && <header className="ocPanelHeading"><div>{title && <h3>{title}</h3>}{subtitle && <p>{subtitle}</p>}</div>{action}</header>}
 <div className={noPadding ? undefined : 'ocPanelBody'}>{children}</div>
 </section>;
}
