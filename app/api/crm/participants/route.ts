import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'data', 'participants.json');

function getData() {
  try {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((p: any) => ({
          id: p.id,
          referenceNumber: p.reference_number || p.id,
          name: p.full_name,
          ndisNumber: p.ndis_number || 'Pending NDIS #',
          fundingType: p.funding_type,
          planManager: p.plan_manager_name || 'Self-Managed',
          suburb: p.suburb,
          allocatedHours: Number(p.allocated_weekly_hours) || 0,
          primaryService: 'Daily Living & Community Participation',
          status: p.status,
          workerAssigned: 'To be assigned',
          contactPerson: `${p.full_name} (${p.phone || 'No phone'})`,
          createdAt: p.created_at,
        }));
        return NextResponse.json(mapped);
      }
    } catch (sbErr) {
      console.warn('Supabase participants query fallback to JSON:', sbErr);
    }
  }

  return NextResponse.json(getData());
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const supabase = createAdminClient();
    if (supabase) {
      try {
        const { count } = await supabase.from('participants').select('*', { count: 'exact', head: true });
        const refNum = body.referenceNumber || `PAR-${String((count ?? 0) + 1).padStart(5, '0')}`;

        const { data, error } = await supabase
          .from('participants')
          .insert({
            reference_number: refNum,
            full_name: body.name,
            ndis_number: body.ndisNumber || null,
            date_of_birth: body.dateOfBirth || null,
            suburb: body.suburb || 'Yamba NSW',
            street_address: body.streetAddress || null,
            funding_type: body.fundingType || 'Plan-Managed',
            plan_manager_name: body.planManager || null,
            plan_manager_email: body.planManagerEmail || null,
            allocated_weekly_hours: Number(body.allocatedHours) || 0,
            phone: body.phone || null,
            email: body.email || null,
            status: 'active',
          })
          .select()
          .single();

        if (data && !error) {
          return NextResponse.json({ ok: true, participant: data });
        }
      } catch (sbErr) {
        console.warn('Supabase participant insert fallback to JSON:', sbErr);
      }
    }

    const data = getData();
    const newId = `PAR-${String(data.length + 1).padStart(3, '0')}`;
    const newPart = { id: newId, ...body, status: 'active', createdAt: new Date().toISOString() };
    data.push(newPart);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ ok: true, participant: newPart });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to create participant' }, { status: 500 });
  }
}
