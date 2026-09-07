import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'data', 'staff.json');

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
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((s: any) => ({
          id: s.id,
          referenceNumber: s.reference_number || s.id,
          name: s.full_name,
          role: s.role,
          phone: s.phone,
          email: s.email,
          suburbs: Array.isArray(s.suburbs) ? s.suburbs : ['Yamba', 'Maclean'],
          ndisScreening: s.ndis_screening || 'Verified',
          ndisScreeningExpiry: s.ndis_screening_expiry,
          wwcc: s.wwcc_number || 'Pending',
          wwccExpiry: s.wwcc_expiry,
          policeCheckDate: s.police_check_date,
          firstAid: s.first_aid_expiry ? `Valid to ${s.first_aid_expiry}` : 'Current',
          firstAidExpiry: s.first_aid_expiry,
          cprExpiry: s.cpr_expiry,
          hourlyRate: Number(s.hourly_rate) || 38.50,
          status: s.status,
          createdAt: s.created_at,
        }));
        return NextResponse.json(mapped);
      }
    } catch (sbErr) {
      console.warn('Supabase staff query fallback to JSON:', sbErr);
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
        const { data, error } = await supabase
          .from('staff')
          .insert({
            full_name: body.name,
            role: body.role || 'Support Worker',
            phone: body.phone,
            email: body.email,
            suburbs: body.suburbs || ['Yamba', 'Maclean'],
            ndis_screening: body.ndisScreening || 'Verified',
            ndis_screening_expiry: body.ndisScreeningExpiry || null,
            wwcc_number: body.wwcc || null,
            wwcc_expiry: body.wwccExpiry || null,
            police_check_date: body.policeCheckDate || null,
            first_aid_expiry: body.firstAidExpiry || null,
            cpr_expiry: body.cprExpiry || null,
            hourly_rate: Number(body.hourlyRate) || 38.50,
            status: 'active',
          })
          .select()
          .single();

        if (data && !error) {
          return NextResponse.json({ ok: true, staff: data });
        }
      } catch (sbErr) {
        console.warn('Supabase staff insert fallback to JSON:', sbErr);
      }
    }

    const data = getData();
    const newId = `STF-${String(data.length + 1).padStart(3, '0')}`;
    const newStaff = { id: newId, ...body, status: 'active', createdAt: new Date().toISOString() };
    data.push(newStaff);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ ok: true, staff: newStaff });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to create staff' }, { status: 500 });
  }
}
