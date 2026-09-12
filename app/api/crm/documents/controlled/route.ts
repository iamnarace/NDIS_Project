import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { getControlledDocuments, getControlledDocument, recordDocumentAcknowledgement } from '@/lib/services/governanceDocuments';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const version = searchParams.get('version');
  const audience = searchParams.get('audience') || undefined;
  const status = searchParams.get('status') || 'current';

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database service unavailable' }, { status: 503 });

  try {
    if (code) {
      const doc = await getControlledDocument(code, version || undefined, supabase);
      if (!doc) return NextResponse.json({ message: 'Document not found' }, { status: 404 });
      return NextResponse.json(doc);
    }

    const docs = await getControlledDocuments({ status, audience }, supabase);
    return NextResponse.json(docs);
  } catch (err: any) {
    return NextResponse.json({ message: userFacingError(err.message) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database service unavailable' }, { status: 503 });

  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === 'acknowledge') {
      const ack = await recordDocumentAcknowledgement(payload, supabase);
      return NextResponse.json({ ok: true, acknowledgement: ack });
    }

    // Publishing or updating controlled document
    const {
      document_code,
      title,
      category,
      version = '1.0',
      effective_date,
      review_date,
      status = 'current',
      owner_approver = 'Operations & Governance Lead',
      acknowledgement_required = false,
      is_public = false,
      target_audience = 'participant',
      change_summary = 'Governed publication update',
      source_template_url,
      content_markdown,
    } = payload;

    if (!document_code || !title || !review_date) {
      return NextResponse.json({ message: 'document_code, title, and review_date are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('controlled_documents')
      .upsert(
        {
          document_code,
          title,
          category: category || 'Governance',
          version,
          effective_date: effective_date || new Date().toISOString().split('T')[0],
          review_date,
          status,
          owner_approver,
          acknowledgement_required: Boolean(acknowledgement_required),
          is_public: Boolean(is_public),
          target_audience,
          change_summary,
          source_template_url: source_template_url || null,
          content_markdown: content_markdown || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'document_code,version' }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true, document: data });
  } catch (err: any) {
    return NextResponse.json({ message: userFacingError(err.message) }, { status: 500 });
  }
}
