import React from 'react';
import { ShieldCheck, UserCheck2, FileCheck } from 'lucide-react';

export function SafetyPriorityNote() {
  return (
    <div className="safetyPriorityNoteWrap">
      <div className="safetyPriorityHeader">
        <div className="safetyBadgeTag">
          <ShieldCheck size={18} className="safetyTagIcon" />
          <span>YOUR SAFETY IS OUR PRIORITY</span>
        </div>
        <p className="safetyHeaderBlurb">
          Strict verification, vetting, and insurance standards on every placement so you have total peace of mind.
        </p>
      </div>

      <div className="safetyPillGrid">
        {/* Item 1: Background Checks */}
        <div className="safetyPillItem">
          <div className="safetyIconWrap">
            <ShieldCheck size={26} className="safetyIconSvg" />
          </div>
          <div className="safetyTextWrap">
            <h4 className="safetyPillTitle">Background Checks</h4>
            <p className="safetyPillDesc">
              All support workers hold verified checks including National Police Check, NDIS Worker Screening Check (NDISWC), and Working with Children Check (WWCC).
            </p>
          </div>
        </div>

        {/* Item 2: Rigorous Vetting */}
        <div className="safetyPillItem">
          <div className="safetyIconWrap">
            <UserCheck2 size={26} className="safetyIconSvg" />
          </div>
          <div className="safetyTextWrap">
            <h4 className="safetyPillTitle">Vetted & Onboarded</h4>
            <p className="safetyPillDesc">
              Every worker must provide two verified professional references and complete our comprehensive induction before meeting participants.
            </p>
          </div>
        </div>

        {/* Item 3: Comprehensive Insurance */}
        <div className="safetyPillItem">
          <div className="safetyIconWrap">
            <FileCheck size={26} className="safetyIconSvg" />
          </div>
          <div className="safetyTextWrap">
            <h4 className="safetyPillTitle">Fully Insured</h4>
            <p className="safetyPillDesc">
              Comprehensive Public Liability and Personal Accident insurance are in place for complete protection and confidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
