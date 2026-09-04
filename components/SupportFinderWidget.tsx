'use client';

import { useState } from 'react';
import { Calculator, CheckCircle2, Clock, DollarSign, ArrowRight, Sparkles, Calendar, HeartHandshake } from 'lucide-react';
import Link from 'next/link';

// Standard 2024-2025/2026 NDIS Price Guide reference rates for standard weekday/weekend supports
const RATES = {
  weekdayDay: 67.56,
  weekdayEve: 74.44,
  saturday: 95.07,
  sunday: 122.59,
};

export function SupportFinderWidget() {
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(6);
  const [timing, setTiming] = useState<'weekdayDay' | 'weekdayEve' | 'saturday' | 'sunday'>('weekdayDay');
  const [selectedServices, setSelectedServices] = useState<string[]>(['Community Participation', 'Daily Living Support']);

  const services = [
    'Daily Living & Routines',
    'Community Participation',
    'Transport & Appointments',
    'Life Skills & Independence',
    'Companionship & Social Outings',
    'Household Assistance',
  ];

  const toggleService = (s: string) => {
    setSelectedServices(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const currentRate = RATES[timing];
  const weeklyEstimate = (hoursPerWeek * currentRate).toFixed(2);
  const monthlyEstimate = (hoursPerWeek * currentRate * 4.33).toFixed(2);

  return (
    <div className="supportFinderCard">
      <div className="supportFinderHeader">
        <div className="badgeRow">
          <span className="finderBadge"><Calculator size={15} /> Interactive Support Estimator</span>
          <span className="rateTag">NDIS Price Limit Aligned</span>
        </div>
        <h3>Plan Your Support Routine</h3>
        <p>Explore how regular 1-on-1 support fits into your NDIS Core or Capacity Building budget.</p>
      </div>

      <div className="supportFinderBody">
        {/* Hours Slider */}
        <div className="calculatorBlock">
          <div className="sliderHeader">
            <label>Weekly Support Hours:</label>
            <span className="hoursDisplay">{hoursPerWeek} hrs / week</span>
          </div>
          <input
            type="range"
            min="2"
            max="35"
            step="1"
            value={hoursPerWeek}
            onChange={e => setHoursPerWeek(Number(e.target.value))}
            className="crispRangeSlider"
          />
          <div className="sliderScale">
            <span>2 hrs (Light)</span>
            <span>10 hrs (Moderate)</span>
            <span>20+ hrs (Comprehensive)</span>
          </div>
        </div>

        {/* Schedule Timing Selector */}
        <div className="calculatorBlock">
          <label className="blockLabel">Preferred Support Timing:</label>
          <div className="timingGrid">
            <button
              type="button"
              className={`timingBtn ${timing === 'weekdayDay' ? 'activeTiming' : ''}`}
              onClick={() => setTiming('weekdayDay')}
            >
              <strong>Weekday Daytime</strong>
              <small>6:00 AM – 8:00 PM</small>
            </button>

            <button
              type="button"
              className={`timingBtn ${timing === 'weekdayEve' ? 'activeTiming' : ''}`}
              onClick={() => setTiming('weekdayEve')}
            >
              <strong>Weekday Evening</strong>
              <small>8:00 PM – Midnight</small>
            </button>

            <button
              type="button"
              className={`timingBtn ${timing === 'saturday' ? 'activeTiming' : ''}`}
              onClick={() => setTiming('saturday')}
            >
              <strong>Saturday</strong>
              <small>All day / Weekend</small>
            </button>

            <button
              type="button"
              className={`timingBtn ${timing === 'sunday' ? 'activeTiming' : ''}`}
              onClick={() => setTiming('sunday')}
            >
              <strong>Sunday</strong>
              <small>All day / Weekend</small>
            </button>
          </div>
        </div>

        {/* Selected Services Tags */}
        <div className="calculatorBlock">
          <label className="blockLabel">Focus Areas For This Support:</label>
          <div className="servicePillSelector">
            {services.map(s => (
              <button
                type="button"
                key={s}
                className={`servicePillBtn ${selectedServices.includes(s) ? 'selectedPill' : ''}`}
                onClick={() => toggleService(s)}
              >
                {selectedServices.includes(s) && <CheckCircle2 size={14} />}
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget Estimate Summary Box */}
        <div className="estimateResultBox">
          <div className="estimateNumbers">
            <div className="estimateCol">
              <span className="estimateLabel">Estimated Weekly Cost</span>
              <strong className="estimateVal">${weeklyEstimate}</strong>
              <small className="estimateSub">NDIS Item Ref: 01_011_0107_1_1</small>
            </div>
            <div className="estimateDivider" />
            <div className="estimateCol">
              <span className="estimateLabel">Monthly Plan Allocation</span>
              <strong className="estimateVal secondaryVal">${monthlyEstimate}</strong>
              <small className="estimateSub">Approx 4.33 weeks/month</small>
            </div>
          </div>

          <div className="estimateFooter">
            <div className="transparencyNote">
              <Sparkles size={16} color="#0D9488" />
              <span>Opus Care bills strictly according to agreed service agreements with zero hidden administrative or platform joining fees.</span>
            </div>
            <Link className="button full" href="/referral">
              Discuss This Support Plan <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
