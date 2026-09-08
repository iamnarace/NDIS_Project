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
        <h3>Plan Your Opus Care Routine</h3>
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
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="hoursSlider"
          />
          <div className="sliderTicks">
            <span>2 hrs</span>
            <span>10 hrs</span>
            <span>20 hrs</span>
            <span>35 hrs</span>
          </div>
        </div>

        {/* Preferred Timing */}
        <div className="calculatorBlock">
          <label className="blockLabel">Preferred Shift Timing (NDIS Hourly Rate):</label>
          <div className="timingGrid">
            <button
              type="button"
              className={`timingBtn ${timing === 'weekdayDay' ? 'selected' : ''}`}
              onClick={() => setTiming('weekdayDay')}
            >
              <Clock size={16} />
              <div className="timingText">
                <strong>Weekday Day</strong>
                <small>$67.56/hr</small>
              </div>
            </button>
            <button
              type="button"
              className={`timingBtn ${timing === 'weekdayEve' ? 'selected' : ''}`}
              onClick={() => setTiming('weekdayEve')}
            >
              <Clock size={16} />
              <div className="timingText">
                <strong>Weekday Evening</strong>
                <small>$74.44/hr</small>
              </div>
            </button>
            <button
              type="button"
              className={`timingBtn ${timing === 'saturday' ? 'selected' : ''}`}
              onClick={() => setTiming('saturday')}
            >
              <Calendar size={16} />
              <div className="timingText">
                <strong>Saturday</strong>
                <small>$95.07/hr</small>
              </div>
            </button>
            <button
              type="button"
              className={`timingBtn ${timing === 'sunday' ? 'selected' : ''}`}
              onClick={() => setTiming('sunday')}
            >
              <Calendar size={16} />
              <div className="timingText">
                <strong>Sunday</strong>
                <small>$122.59/hr</small>
              </div>
            </button>
          </div>
        </div>

        {/* Service Type Checkboxes */}
        <div className="calculatorBlock">
          <label className="blockLabel">Focus Areas For This Support:</label>
          <div className="servicePillSelector">
            {services.map((srv) => {
              const active = selectedServices.includes(srv);
              return (
                <button
                  key={srv}
                  type="button"
                  onClick={() => toggleService(srv)}
                  className={`servicePillBtn ${active ? 'selectedPill' : ''}`}
                >
                  <span className="pillDot">{active ? '✓' : '+'}</span>
                  <span>{srv}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Price Estimation Breakdown Box */}
        <div className="estimateResultBox">
          <div className="estimateNumbers">
            <div className="estCol">
              <span className="estLabel">Estimated Weekly NDIS Funding</span>
              <span className="estValue">${weeklyEstimate}</span>
              <span className="estDetail">Based on {hoursPerWeek} hrs @ ${currentRate.toFixed(2)}/hr</span>
            </div>
            <div className="estimateDivider"></div>
            <div className="estCol">
              <span className="estLabel">Estimated Monthly Budget</span>
              <span className="estValue">${monthlyEstimate}</span>
              <span className="estDetail">Approx 4.33 weeks per month</span>
            </div>
          </div>

          <div className="estimatorNotice">
            <p>
              💡 Rates match standard NDIS Pricing Arrangements (1:1 Assistance in Self-Care / Social & Community Access). Actual billing strictly follows the agreed Schedule of Supports in your Opus Care Service Agreement.
            </p>
          </div>

          <div className="estimateActions">
            <Link
              href={`/referral?hours=${hoursPerWeek}&timing=${timing}&services=${encodeURIComponent(selectedServices.join(','))}`}
              className="button primary full"
            >
              <span>Book This Support Schedule</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
