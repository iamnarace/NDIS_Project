'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Lock, 
  ArrowRight, 
  User, 
  Fingerprint, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';

export default function PortalLoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'participant' | 'staff'>('participant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      setIsLoading(false);
      // Route to live dashboard
      if (role === 'participant') {
        router.push('/portal/dashboard');
      } else {
        router.push('/admin');
      }
    }, 600);
  };

  const handlePasskey = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (role === 'participant') {
        router.push('/portal/dashboard');
      } else {
        router.push('/admin');
      }
    }, 400);
  };

  return (
    <div className="portalLoginWrapper">
      <div className="portalLoginBackStrip">
        <Link href="/" className="portalBackLink">
          <ArrowLeft size={16} />
          <span>Back to Main Website</span>
        </Link>
      </div>

      <div className="portalLoginCardContainer">
        {/* Logo */}
        <div className="portalLoginLogoWrap">
          <Link href="/">
            <Image
              src="/brand/Opus_Care_Logo_Transparent.png"
              alt="Opus Care Portal"
              width={200}
              height={55}
              priority
              className="portalLogoImg"
            />
          </Link>
          <span className="portalSubBrandTag">PORTAL ACCESS</span>
        </div>

        {/* Card */}
        <div className="portalAuthCard">
          <h1 className="portalAuthHeading">Welcome</h1>
          <p className="portalAuthSubhead">
            Log in to Opus Care {role === 'participant' ? 'Participant Portal' : 'Staff CRM'}
          </p>

          {/* Role Tabs */}
          <div className="portalRoleToggle">
            <button
              type="button"
              className={`portalTabBtn ${role === 'participant' ? 'active' : ''}`}
              onClick={() => setRole('participant')}
            >
              Participant / Carer
            </button>
            <button
              type="button"
              className={`portalTabBtn ${role === 'staff' ? 'active' : ''}`}
              onClick={() => setRole('staff')}
            >
              Support Worker / Staff
            </button>
          </div>

          {errorMsg && (
            <div className="portalAlertError">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Access Bar */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#166534' }}>
              <Sparkles size={15} style={{ color: '#16A34A' }} />
              <span>Demo / Test Account Access</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#15803D', lineHeight: 1.4 }}>
              Click below to jump straight in with demo participant credentials:
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail('sarah.mitchell@opuscare.com.au');
                setPassword('OpusCare2026!');
                setTimeout(() => router.push('/portal/dashboard'), 200);
              }}
              style={{
                background: '#16A34A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'background 0.15s'
              }}
            >
              <span>1-Click Login (Sarah M. - Demo Participant)</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="portalLoginForm">
            <div className="portalFormGroup">
              <label htmlFor="portalEmail" className="portalInputLabel">
                Email address*
              </label>
              <input
                id="portalEmail"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="portalInputField"
              />
            </div>

            <div className="portalFormGroup">
              <label htmlFor="portalPassword" className="portalInputLabel">
                Password or Passcode
              </label>
              <input
                id="portalPassword"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="portalInputField"
              />
            </div>

            <div className="portalForgotRow">
              <a href="mailto:support@opuscare.com.au?subject=Portal%20Access%20Help" className="portalForgotLink">
                Can&apos;t log in to your account?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="portalSubmitBtn"
            >
              <span>{isLoading ? 'Verifying...' : 'Continue'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* OR Divider */}
          <div className="portalOrDivider">
            <span>OR</span>
          </div>

          {/* Passkey Button */}
          <button
            type="button"
            onClick={handlePasskey}
            disabled={isLoading}
            className="portalPasskeyBtn"
          >
            <Fingerprint size={18} className="passkeyIcon" />
            <span>Continue with a passkey or biometric</span>
          </button>

          <div className="portalCardFooter">
            <p>
              Don&apos;t have an active login?{' '}
              <Link href="/referral" className="portalCardFooterLink">
                Make a referral
              </Link>{' '}
              or email{' '}
              <a href="mailto:support@opuscare.com.au" className="portalCardFooterLink">
                support@opuscare.com.au
              </a>
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="portalSecurityNotice">
          <Shield size={14} />
          <span>Encrypted with 256-bit SSL · Compliant with Australian Privacy Principles</span>
        </div>
      </div>
    </div>
  );
}
