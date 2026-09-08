'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  Lock,
  ArrowRight,
  Fingerprint,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function PortalLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'participant' | 'staff'>('participant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (searchParams.get('reason') === 'session_expired') {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();

      // Supabase is not configured — gracefully fall back for demo
      if (!supabase) {
        console.warn('Supabase not configured, using demo mode');
        await new Promise((r) => setTimeout(r, 600));
        router.push('/portal/dashboard');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (error) {
        setIsLoading(false);
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Incorrect email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg('Please check your email to confirm your account before logging in.');
        } else {
          setErrorMsg(error.message || 'Login failed. Please try again.');
        }
        return;
      }

      if (!data.user) {
        setIsLoading(false);
        setErrorMsg('Login failed. Please try again.');
        return;
      }

      // Check profile role to route correctly
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'worker') {
        router.push('/portal/worker');
      } else if (profile?.role === 'participant') {
        router.push('/portal/dashboard');
      } else if (
        profile?.role &&
        ['admin', 'manager', 'coordinator', 'staff'].includes(profile.role)
      ) {
        // Staff member — redirect to admin CRM
        router.push('/admin');
      } else {
        // Default: participant dashboard
        router.push('/portal/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      setErrorMsg('An unexpected error occurred. Please try again.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Enter your email address first, then click "Forgot password".');
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/portal/reset-password`,
    });
    setErrorMsg('');
    alert(`Password reset email sent to ${email}. Please check your inbox.`);
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
          <h1 className="portalAuthHeading">Welcome back</h1>
          <p className="portalAuthSubhead">
            Log in to Opus Care {role === 'participant' ? 'Participant Portal' : 'Staff Worker Portal'}
          </p>

          {/* Session expired notice */}
          {sessionExpired && (
            <div className="portalAlertWarning">
              <AlertCircle size={16} />
              <span>Your session expired. Please log in again.</span>
            </div>
          )}

          {/* Role Tabs */}
          <div className="portalRoleToggle">
            <button
              type="button"
              className={`portalTabBtn ${role === 'participant' ? 'active' : ''}`}
              onClick={() => { setRole('participant'); setErrorMsg(''); }}
            >
              Participant / Carer
            </button>
            <button
              type="button"
              className={`portalTabBtn ${role === 'staff' ? 'active' : ''}`}
              onClick={() => { setRole('staff'); setErrorMsg(''); }}
            >
              Support Worker / Staff
            </button>
          </div>

          {errorMsg && (
            <div className="portalAlertError">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="portalLoginForm">
            <div className="portalFormGroup">
              <label htmlFor="portalEmail" className="portalInputLabel">
                Email address *
              </label>
              <input
                id="portalEmail"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="portalInputField"
              />
            </div>

            <div className="portalFormGroup">
              <label htmlFor="portalPassword" className="portalInputLabel">
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="portalPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="portalInputField"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6B7280',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="portalForgotRow">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="portalForgotLink"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="portalSubmitBtn"
            >
              <Lock size={16} />
              <span>{isLoading ? 'Verifying...' : 'Sign in securely'}</span>
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
            disabled={isLoading}
            className="portalPasskeyBtn"
            onClick={() => setErrorMsg('Passkey login coming soon. Please use email & password.')}
          >
            <Fingerprint size={18} className="passkeyIcon" />
            <span>Continue with a passkey or biometric</span>
          </button>

          {/* Admin quick-link for staff */}
          {role === 'staff' && (
            <div style={{
              marginTop: 16,
              padding: '10px 14px',
              background: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              textAlign: 'center',
              fontSize: '0.82rem',
              color: '#64748B',
            }}>
              <span>Opus Care staff admin? </span>
              <Link href="/admin" style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
                Access Admin CRM →
              </Link>
            </div>
          )}

          <div className="portalCardFooter">
            <p>
              Don&apos;t have an active login?{' '}
              <Link href="/referral" className="portalCardFooterLink">
                Make a referral
              </Link>{' '}
              or contact{' '}
              <a href="mailto:support@opuscare.com.au" className="portalCardFooterLink">
                support@opuscare.com.au
              </a>
            </p>
          </div>
        </div>

          <div className="portalSecurityNotice">
          <Shield size={14} />
          <span>Encrypted · 256-bit SSL · Australian Privacy Act compliant</span>
        </div>
      </div>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={
      <div className="portalLoginWrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748B' }}>Loading portal...</p>
      </div>
    }>
      <PortalLoginContent />
    </Suspense>
  );
}
