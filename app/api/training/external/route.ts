import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/training/external
 * Returns curated free external courses from NDIS Commission, NSW ADC, La Trobe, etc.
 * Supports ?category=... filter
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "We couldn't load training data. Please try again." },
      { status: 503 }
    );
  }

  let query = supabase
    .from('external_courses')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('External training load failed', error);
    return NextResponse.json(
      { message: "We couldn't load training data. Please try again." },
      { status: 500 }
    );
  }
  return NextResponse.json(data ?? []);
}
