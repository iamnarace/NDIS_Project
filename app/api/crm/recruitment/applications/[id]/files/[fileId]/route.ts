import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { id, fileId } = await params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
  }

  const { data: file, error } = await supabase
    .from('job_application_files')
    .select('*')
    .eq('id', fileId)
    .eq('application_id', id)
    .single();

  if (error || !file) {
    return NextResponse.json({ ok: false, error: 'File record not found.' }, { status: 404 });
  }

  const { data: signData, error: signErr } = await supabase.storage
    .from('crm-documents')
    .createSignedUrl(file.storage_path, 900); // 15 minutes

  if (signErr || !signData?.signedUrl) {
    return NextResponse.json({ ok: false, error: 'Failed to generate secure download link.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    download_url: signData.signedUrl,
    file_name: file.file_name,
    mime_type: file.mime_type,
    file_size: file.file_size
  });
}
