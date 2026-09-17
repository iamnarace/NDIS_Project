'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, LockKeyhole, RefreshCw, ShieldCheck, UserPlus, X } from 'lucide-react';

type AdminProfile = {
  id: string;
  display_name: string;
  email: string | null;
  role: 'owner' | 'admin';
  active: boolean;
  last_login_at: string | null;
  created_at: string;
  locked_at: string | null;
};

type CurrentProfile = {
  id: string;
  displayName: string;
  email: string | null;
  role: 'owner' | 'admin';
  legacy: boolean;
} | null;

export default function AdminAccessManager({ currentProfile }: { currentProfile: CurrentProfile }) {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState({ displayName: '', email: '', role: 'admin', accessKey: '' });
  const [resetKey, setResetKey] = useState('');

  const loadProfiles = useCallback(async () => {
    if (currentProfile?.role !== 'owner') return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/access');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to load administrator profiles.');
      setProfiles(data.profiles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load administrator profiles.');
    } finally {
      setLoading(false);
    }
  }, [currentProfile?.role]);

  useEffect(() => { void loadProfiles(); }, [loadProfiles]);

  async function createProfile(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    const res = await fetch('/api/admin/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message || 'Unable to create administrator profile.');
    setNotice(`${data.profile.display_name} can now sign in with the assigned access key.`);
    setForm({ displayName: '', email: '', role: 'admin', accessKey: '' });
    setShowCreate(false);
    setShowKey(false);
    await loadProfiles();
  }

  async function runAction(id: string, action: string, accessKey?: string) {
    setError('');
    setNotice('');
    const res = await fetch('/api/admin/access', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, accessKey }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message || 'Unable to update administrator access.');
    setNotice(action === 'reset_key' ? 'Access key reset. Existing sessions have been signed out.' : 'Administrator access updated.');
    setResetTarget(null);
    setResetKey('');
    await loadProfiles();
  }

  if (!currentProfile) return null;

  return (
    <section className="vsCard" style={{ marginBottom: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ShieldCheck size={20} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>CRM administrator access</h3>
          </div>
          <p style={{ margin: '5px 0 0', color: 'var(--oc-muted)', fontSize: '0.82rem' }}>
            Signed in as {currentProfile.displayName} · {currentProfile.role === 'owner' ? 'Owner' : 'Administrator'}
          </p>
        </div>
        {currentProfile.role === 'owner' && (
          <button type="button" className="vsBtnPrimary" onClick={() => setShowCreate(true)} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            <UserPlus size={16} /> Add administrator
          </button>
        )}
      </div>

      {error && <div style={{ marginTop: 14, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: 6 }}>{error}</div>}
      {notice && <div style={{ marginTop: 14, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: 6 }}>{notice}</div>}

      {currentProfile.role === 'owner' && (
        <div style={{ marginTop: 18, overflowX: 'auto', borderTop: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead><tr style={{ textAlign: 'left', color: '#64748b', fontSize: '0.75rem' }}>
              <th style={{ padding: '12px 8px' }}>PROFILE</th><th>ROLE</th><th>STATUS</th><th>LAST LOGIN</th><th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr></thead>
            <tbody>
              {profiles.map(profile => (
                <tr key={profile.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '13px 8px' }}><strong>{profile.display_name}</strong><div style={{ color: '#64748b', fontSize: '0.78rem' }}>{profile.email || 'No email recorded'}</div></td>
                  <td style={{ textTransform: 'capitalize' }}>{profile.role}</td>
                  <td><span style={{ color: profile.active ? '#166534' : '#991b1b', fontWeight: 700, fontSize: '0.8rem' }}>{profile.active ? 'Active' : 'Locked'}</span></td>
                  <td style={{ color: '#475569', fontSize: '0.82rem' }}>{profile.last_login_at ? new Date(profile.last_login_at).toLocaleString('en-AU') : 'Never'}</td>
                  <td><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button type="button" className="vsBtnOutline" onClick={() => setResetTarget(profile)}><KeyRound size={14} /> Reset key</button>
                    <button type="button" className="vsBtnOutline" onClick={() => void runAction(profile.id, 'revoke_sessions')}><RefreshCw size={14} /> Sign out</button>
                    <button type="button" className="vsBtnOutline" disabled={profile.id === currentProfile.id} onClick={() => void runAction(profile.id, profile.active ? 'lock' : 'unlock')}>
                      <LockKeyhole size={14} /> {profile.active ? 'Lock' : 'Unlock'}
                    </button>
                  </div></td>
                </tr>
              ))}
              {!loading && profiles.length === 0 && <tr><td colSpan={5} style={{ padding: 20, color: '#64748b' }}>No individual profiles yet. Add the first owner profile for yourself.</td></tr>}
            </tbody>
          </table>
          {loading && <div style={{ padding: 16, color: '#64748b' }}>Loading administrator profiles...</div>}
        </div>
      )}

      {showCreate && (
        <div style={{ marginTop: 18, borderTop: '1px solid #e2e8f0', paddingTop: 18 }}>
          <form onSubmit={createProfile} style={{ display: 'grid', gap: 12, maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Create administrator profile</strong><button type="button" aria-label="Close" onClick={() => setShowCreate(false)} style={{ border: 0, background: 'transparent' }}><X size={18} /></button></div>
            <label>Name<input required className="formInput" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} /></label>
            <label>Work email (optional)<input type="email" className="formInput" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
            <label>Access level<select className="formInput" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="admin">Administrator</option><option value="owner">Owner</option></select></label>
            <label>Assign access key<div style={{ display: 'flex', gap: 8 }}><input required minLength={10} maxLength={128} type={showKey ? 'text' : 'password'} className="formInput" autoComplete="new-password" value={form.accessKey} onChange={e => setForm({ ...form, accessKey: e.target.value })} /><button type="button" className="vsBtnOutline" aria-label={showKey ? 'Hide key' : 'Show key'} onClick={() => setShowKey(!showKey)}>{showKey ? <EyeOff size={16} /> : <Eye size={16} />}</button></div><small style={{ color: '#64748b' }}>At least 10 characters. A memorable phrase is allowed.</small></label>
            <button type="submit" className="vsBtnPrimary">Create access</button>
          </form>
        </div>
      )}

      {resetTarget && (
        <div style={{ marginTop: 18, borderTop: '1px solid #e2e8f0', paddingTop: 18, maxWidth: 680 }}>
          <strong>Reset access key for {resetTarget.display_name}</strong>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}><input minLength={10} maxLength={128} type="password" className="formInput" autoComplete="new-password" placeholder="Assign a new access key" value={resetKey} onChange={e => setResetKey(e.target.value)} /><button type="button" className="vsBtnPrimary" onClick={() => void runAction(resetTarget.id, 'reset_key', resetKey)}>Reset key</button><button type="button" className="vsBtnOutline" onClick={() => { setResetTarget(null); setResetKey(''); }}>Cancel</button></div>
        </div>
      )}
    </section>
  );
}
