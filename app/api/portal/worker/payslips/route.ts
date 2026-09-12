import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';

/**
 * GET /api/portal/worker/payslips
 * Retrieves statutory payslips uploaded by Admin/Payroll for the authenticated worker.
 * Allows secure PDF viewing/download via short-lived signed URLs.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Resolve worker staff ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('portal_staff_id')
      .eq('id', user.id)
      .single();

    const workerStaffId = profile?.portal_staff_id;
    if (!workerStaffId) {
      return NextResponse.json({ payslips: [] });
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Storage service unavailable' }, { status: 503 });
    }

    // Query documents table for category = 'payslip' and owner_type = 'staff'
    const { data: docs, error: docErr } = await adminClient
      .from('documents')
      .select('*')
      .eq('owner_type', 'staff')
      .eq('owner_id', workerStaffId)
      .eq('category', 'payslip')
      .order('created_at', { ascending: false });

    if (docErr) {
      return NextResponse.json({ error: userFacingError(docErr.message) }, { status: 500 });
    }

    // Generate signed URLs (1 hour validity)
    const payslips = await Promise.all(
      (docs || []).map(async (doc: any) => {
        const { data: signed } = await adminClient.storage
          .from('crm-documents')
          .createSignedUrl(doc.storage_path, 3600);

        return {
          id: doc.id,
          fileName: doc.file_name,
          uploadedAt: doc.created_at,
          fileSize: doc.file_size,
          notes: doc.notes,
          downloadUrl: signed?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      payslips,
      count: payslips.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: userFacingError(err.message) }, { status: 500 });
  }
}
