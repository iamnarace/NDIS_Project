'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck2, FileCheck, ShieldAlert } from 'lucide-react';

export function SafetyPriorityNote({ isInsured }: { isInsured?: boolean }) {
  const [fullyInsured, setFullyInsured] = useState<boolean>(isInsured ?? false);

  useEffect(() => {
    if (isInsured !== undefined) return;
    let isMounted = true;
    fetch('/api/governance/organisation')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && typeof data.isFullyInsured === 'boolean') {
          setFullyInsured(data.isFullyInsured);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isInsured]);

  return (
    <div className="safetyPriorityNoteWrap">
      <div className="safetyPriorityHeader">
        <div className="safetyBadgeTag">
          <ShieldCheck size={18} className="safetyTagIcon" />
          <span>YOUR SAFETY IS OUR PRIORITY</span>
        </div>
        <p className="safetyHeaderBlurb">
          Strict verification, vetting, and safety standards on every placement so you have total peace of mind.
        </p>
      </div>

      <div className="safetyPillGrid">
        {/* Item 1: Background Checks (Truthful, 18+ compliant, conditional WWCC) */}
        <div className="safetyPillItem">
          <div className="safetyIconWrap">
            <ShieldCheck size={26} className="safetyIconSvg" />
          </div>
          <div className="safetyTextWrap">
            <h4 className="safetyPillTitle">Background Checks</h4>
            <p className="safetyPillDesc">
              All support workers hold verified background checks including National Police Check and NDIS Worker Screening Clearance (NDISWC), plus Working with Children Checks (WWCC) wherever child-related support applies.
            </p>
          </div>
        </div>

        {/* Item 2: Rigorous Vetting */}
        <div className="safetyPillItem">
          <div className="safetyIconWrap">
            <UserCheck2 size={26} className="safetyIconSvg" />
          </div>
          <div className="safetyTextWrap">
            <h4 className="safetyPillTitle">Vetted &amp; Onboarded</h4>
            <p className="safetyPillDesc">
              Every worker must provide verified professional references and complete our comprehensive induction before meeting participants.
            </p>
          </div>
        </div>

        {/* Item 3: Automatic Insurance Trust Presentation */}
        <div className="safetyPillItem">
          <div className="safetyIconWrap">
            <FileCheck size={26} className="safetyIconSvg" />
          </div>
          <div className="safetyTextWrap">
            {fullyInsured ? (
              <>
                <h4 className="safetyPillTitle">Fully Insured</h4>
                <p className="safetyPillDesc">
                  Comprehensive Public Liability and Professional Indemnity insurance are in place for complete protection and confidence.
                </p>
              </>
            ) : (
              <>
                <h4 className="safetyPillTitle">Governed Safeguards</h4>
                <p className="safetyPillDesc">
                  Strict incident management, continuous risk oversight, and person-centred quality safeguards across every support session.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
