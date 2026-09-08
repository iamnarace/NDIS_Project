import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ items: [] });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = supabase
      .from('ndis_support_items')
      .select('*')
      .eq('active', true)
      .order('category', { ascending: true })
      .order('support_item_code', { ascending: true });

    if (category && category !== 'all') query = query.eq('category', category);
    if (search) {
      query = query.or(`support_item_name.ilike.%${search}%,support_item_code.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: data || [] });
  } catch (err: any) {
    console.error('GET /api/billing/support-items error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const body = await request.json();
    const {
      support_item_code,
      support_item_name,
      category,
      registration_group,
      unit = 'Hour',
      reference_rate,
      notes,
    } = body;

    if (!support_item_code || !support_item_name || !category || reference_rate === undefined) {
      return NextResponse.json({ error: 'Code, name, category, and reference rate are required.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ndis_support_items')
      .upsert({
        support_item_code,
        support_item_name,
        category,
        registration_group: registration_group || null,
        unit,
        reference_rate: Number(reference_rate),
        notes: notes || null,
        active: true,
      }, { onConflict: 'support_item_code' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/billing/support-items error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
