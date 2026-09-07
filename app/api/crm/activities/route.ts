import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

const activitiesFile = path.join(process.cwd(), 'data', 'activities.json');

function getActivities() {
  try {
    if (!fs.existsSync(activitiesFile)) return [];
    return JSON.parse(fs.readFileSync(activitiesFile, 'utf-8'));
  } catch {
    return [];
  }
}

function saveActivities(data: any) {
  try {
    const dir = path.dirname(activitiesFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(activitiesFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing activities.json:', err);
  }
}

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const referralId = searchParams.get('referralId');
  const participantId = searchParams.get('participantId');

  const supabase = createAdminClient();
  if (supabase) {
    try {
      let query = supabase.from('activities').select('*').order('created_at', { ascending: false });
      if (referralId) query = query.eq('referral_id', referralId);
      if (participantId) query = query.eq('participant_id', participantId);

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json(data);
      }
    } catch (sbErr) {
      console.warn('Supabase activities query fallback to JSON:', sbErr);
    }
  }

  // Fallback to local activities
  const all = getActivities();
  const filtered = all.filter((a: any) => {
    if (referralId && (a.referralId === referralId || a.referral_id === referralId)) return true;
    if (participantId && (a.participantId === participantId || a.participant_id === participantId)) return true;
    return !referralId && !participantId;
  });

  return NextResponse.json(filtered);
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { referralId, participantId, activityType, title, description, authorName } = body;

    if (!title) {
      return NextResponse.json({ message: 'Title is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('activities')
          .insert({
            referral_id: referralId || null,
            participant_id: participantId || null,
            activity_type: activityType || 'note',
            title,
            description: description || '',
            author_name: authorName || 'Opus Admin',
          })
          .select()
          .single();

        if (data && !error) {
          return NextResponse.json({ ok: true, activity: data });
        }
      } catch (sbErr) {
        console.warn('Supabase activity insert fallback to JSON:', sbErr);
      }
    }

    // Local JSON fallback
    const activities = getActivities();
    const newActivity = {
      id: `ACT-${Date.now()}`,
      referralId: referralId || null,
      participantId: participantId || null,
      activity_type: activityType || 'note',
      title,
      description: description || '',
      author_name: authorName || 'Opus Admin',
      created_at: new Date().toISOString(),
    };

    activities.unshift(newActivity);
    saveActivities(activities);

    return NextResponse.json({ ok: true, activity: newActivity });
  } catch (err) {
    console.error('Error saving activity:', err);
    return NextResponse.json({ message: 'Failed to create activity.' }, { status: 500 });
  }
}
