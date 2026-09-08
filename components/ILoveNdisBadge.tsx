import React from 'react';

interface ILoveNdisBadgeProps {
  className?: string;
  variant?: 'pill' | 'inline' | 'hero';
}

export function ILoveNdisBadge({ className = '', variant = 'pill' }: ILoveNdisBadgeProps) {
  return (
    <div className={`iLoveNdisContainer ${variant} ${className}`}>
      <div className="iLoveNdisIconWrap">
        <svg viewBox="0 0 100 100" className="iLoveNdisSvg" aria-label="I love NDIS badge">
          {/* Official NDIS Deep Purple Circle */}
          <circle cx="50" cy="50" r="48" fill="#4B207F" />
          
          {/* Bold White 'I' */}
          <text 
            x="32" 
            y="43" 
            fill="#FFFFFF" 
            fontSize="34" 
            fontWeight="900" 
            fontFamily="system-ui, -apple-system, sans-serif" 
            textAnchor="middle"
          >
            I
          </text>
          
          {/* Vibrant Lime Green Heart */}
          <path 
            d="M 64 24 C 59 18, 49 22, 49 31 C 49 40, 64 48, 64 48 C 64 48, 79 40, 79 31 C 79 22, 69 18, 64 24 Z" 
            fill="#78BE20" 
            transform="translate(4, 0) scale(0.72) translate(14, 8)" 
          />
          
          {/* 'ndis' Text */}
          <text 
            x="50" 
            y="76" 
            fill="#FFFFFF" 
            fontSize="28" 
            fontWeight="800" 
            fontFamily="system-ui, -apple-system, sans-serif" 
            textAnchor="middle" 
            letterSpacing="-0.5"
          >
            ndis
          </text>
          
          {/* Lime Green Dot over the 'i' in ndis */}
          <circle cx="54.2" cy="59.5" r="2.8" fill="#78BE20" />
        </svg>
      </div>

      <div className="iLoveNdisTextWrap">
        <div className="iLoveNdisTitleRow">
          <span className="iLoveNdisTitle">NDIS Support Provider</span>
          <span className="iLoveNdisTag">Self & Plan-Managed</span>
        </div>
        <p className="iLoveNdisSubtext">
          Proudly supporting participants across Coffs Coast, Clarence Valley, Richmond Valley & Northern Rivers.
        </p>
      </div>
    </div>
  );
}
