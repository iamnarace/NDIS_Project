import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidUuid, resolveParticipantUuid, resolveStaffUuid } from '@/lib/uuid';
import { userFacingError } from '@/lib/userFacingError';

const allowedDocumentTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ownerType = searchParams.get('ownerType');
  const ownerId = searchParams.get('ownerId');

  if (!ownerId) {
    return NextResponse.json({ message: 'Owner ID is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Documents could not be loaded.' }, { status: 503 });
  let resolvedOwnerId = ownerId;
  if (!isValidUuid(ownerId)) {
    if (ownerType === 'participant') resolvedOwnerId = (await resolveParticipantUuid(supabase, ownerId)) || ownerId;
    else if (ownerType === 'staff' || ownerType === 'contractor') resolvedOwnerId = (await resolveStaffUuid(supabase, ownerId)) || ownerId;
  }
  if (!isValidUuid(resolvedOwnerId)) return NextResponse.json({ message: 'The selected record is invalid. Please refresh and try again.' }, { status: 400 });

  let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
  if (ownerType) query = query.eq('owner_type', ownerType);
  query = query.eq('owner_id', resolvedOwnerId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
  const docsWithUrls = await Promise.all((data || []).map(async (doc: any) => {
    const { data: signedData, error: signedError } = await supabase.storage.from('crm-documents').createSignedUrl(doc.storage_path, 3600);
    if (signedError) console.error('Document signed URL failed:', signedError.message);
    return { ...doc, downloadUrl: signedData?.signedUrl || null };
  }));
  return NextResponse.json(docsWithUrls);
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const ownerType = (formData.get('ownerType') as string) || 'participant';
    const ownerId = (formData.get('ownerId') as string) || '';
    const category = (formData.get('category') as string) || 'other';
    const expiryDate = formData.get('expiryDate') as string | null;
    const notes = formData.get('notes') as string | null;

    if (!file || !ownerId) {
      return NextResponse.json({ message: 'File and Owner ID are required.' }, { status: 400 });
    }
    if (!allowedDocumentTypes.has(file.type)) {
      return NextResponse.json({ message: 'Please choose a PDF, JPG, or PNG file.' }, { status: 400 });
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ message: 'Document could not be uploaded.' }, { status: 503 });
    let resolvedOwnerId = ownerId;
        if (!isValidUuid(ownerId)) {
          if (ownerType === 'participant') {
            resolvedOwnerId = (await resolveParticipantUuid(supabase, ownerId)) || ownerId;
          } else if (ownerType === 'staff' || ownerType === 'contractor') {
            resolvedOwnerId = (await resolveStaffUuid(supabase, ownerId)) || ownerId;
          }
        }

    if (!isValidUuid(resolvedOwnerId)) return NextResponse.json({ message: 'The selected record is invalid. Please refresh and try again.' }, { status: 400 });

    const resolvedStoragePath = `${ownerType}/${resolvedOwnerId}/${Date.now()}_${safeFileName}`;
    const { error: uploadErr } = await supabase.storage
          .from('crm-documents')
          .upload(resolvedStoragePath, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });

    if (uploadErr) return NextResponse.json({ message: userFacingError(uploadErr.message) }, { status: 500 });

    const { data: docRecord, error: docErr } = await supabase
          .from('documents')
          .insert({
            owner_type: ownerType,
            owner_id: resolvedOwnerId,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type || 'application/octet-stream',
            storage_path: resolvedStoragePath,
            category,
            expiry_date: expiryDate ? expiryDate : null,
            notes: notes || null,
            uploaded_by: 'Opus Staff',
          })
          .select()
          .single();

    if (docErr || !docRecord) {
      await supabase.storage.from('crm-documents').remove([resolvedStoragePath]);
      return NextResponse.json({ message: userFacingError(docErr?.message || 'Document metadata insert returned no record.') }, { status: 500 });
    }

    const { error: activityError } = await supabase.from('activities').insert({
            participant_id: ownerType === 'participant' ? resolvedOwnerId : null,
            referral_id: ownerType === 'referral' ? resolvedOwnerId : null,
            activity_type: 'note',
            title: `Document Uploaded: ${file.name}`,
            description: `Document category: ${category.replace('_', ' ').toUpperCase()}${expiryDate ? ` (Expires: ${expiryDate})` : ''}`,
            author_name: 'Opus Staff',
    });
    if (activityError) console.error('Document activity log failed:', activityError.message);

    const { data: signed, error: signedError } = await supabase.storage
            .from('crm-documents')
            .createSignedUrl(resolvedStoragePath, 3600);
    if (signedError) console.error('Document signed URL failed:', signedError.message);

    return NextResponse.json({
            ok: true,
            document: {
              ...docRecord,
              downloadUrl: signed?.signedUrl || null,
            },
    });
  } catch (err: unknown) {
    return NextResponse.json({ message: userFacingError(err) }, { status: 500 });
  }
}
