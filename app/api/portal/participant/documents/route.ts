import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { getControlledDocuments } from '@/lib/services/governanceDocuments';

export async function GET(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database service unavailable' }, { status: 503 });

  try {
    // Return only published, participant-safe, non-draft resources
    const docs = await getControlledDocuments(
      {
        status: 'current',
        audience: 'participant',
      },
      supabase
    );

    // Strict sanitization: strip any internal admin fields or internal notes
    const sanitized = docs.map((doc) => ({
      document_code: doc.document_code,
      title: doc.title,
      category: doc.category,
      version: doc.version,
      effective_date: doc.effective_date,
      review_date: doc.review_date,
      acknowledgement_required: doc.acknowledgement_required,
      source_template_url: doc.source_template_url,
      change_summary: doc.change_summary,
    }));

    return NextResponse.json(sanitized);
  } catch (err: any) {
    return NextResponse.json({ message: userFacingError(err.message) }, { status: 500 });
  }
}
