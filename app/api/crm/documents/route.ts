import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

const localDocsFile = path.join(process.cwd(), 'data', 'documents.json');

function getLocalDocs() {
  try {
    if (!fs.existsSync(localDocsFile)) return [];
    return JSON.parse(fs.readFileSync(localDocsFile, 'utf-8'));
  } catch {
    return [];
  }
}

function saveLocalDocs(data: any) {
  try {
    const dir = path.dirname(localDocsFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(localDocsFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local documents metadata:', err);
  }
}

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
  if (supabase) {
    try {
      let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (ownerType) query = query.eq('owner_type', ownerType);
      query = query.eq('owner_id', ownerId);

      const { data, error } = await query;
      if (!error && data) {
        // Generate signed URLs for private file access (valid for 1 hour)
        const docsWithUrls = await Promise.all(
          data.map(async (doc: any) => {
            try {
              const { data: signedData } = await supabase.storage
                .from('crm-documents')
                .createSignedUrl(doc.storage_path, 3600);
              return {
                ...doc,
                downloadUrl: signedData?.signedUrl || null,
              };
            } catch {
              return { ...doc, downloadUrl: null };
            }
          })
        );
        return NextResponse.json(docsWithUrls);
      }
    } catch (sbErr) {
      console.warn('Supabase documents query fallback to JSON:', sbErr);
    }
  }

  // Fallback to local documents
  const all = getLocalDocs();
  const filtered = all.filter((d: any) => d.ownerId === ownerId || d.owner_id === ownerId);
  return NextResponse.json(filtered);
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

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${ownerType}/${ownerId}/${Date.now()}_${safeFileName}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = createAdminClient();
    if (supabase) {
      try {
        // 1. Upload to Supabase Storage bucket: crm-documents
        const { error: uploadErr } = await supabase.storage
          .from('crm-documents')
          .upload(storagePath, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });

        if (uploadErr) {
          console.error('Supabase storage upload error:', uploadErr);
        }

        // 2. Insert metadata into public.documents
        const { data: docRecord, error: docErr } = await supabase
          .from('documents')
          .insert({
            owner_type: ownerType,
            owner_id: ownerId,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type || 'application/octet-stream',
            storage_path: storagePath,
            category,
            expiry_date: expiryDate ? expiryDate : null,
            notes: notes || null,
            uploaded_by: 'Opus Staff',
          })
          .select()
          .single();

        if (docRecord && !docErr) {
          // 3. Log an activity entry
          await supabase.from('activities').insert({
            participant_id: ownerType === 'participant' ? ownerId : null,
            referral_id: ownerType === 'referral' ? ownerId : null,
            activity_type: 'note',
            title: `Document Uploaded: ${file.name}`,
            description: `Document category: ${category.replace('_', ' ').toUpperCase()}${expiryDate ? ` (Expires: ${expiryDate})` : ''}`,
            author_name: 'Opus Staff',
          });

          const { data: signed } = await supabase.storage
            .from('crm-documents')
            .createSignedUrl(storagePath, 3600);

          return NextResponse.json({
            ok: true,
            document: {
              ...docRecord,
              downloadUrl: signed?.signedUrl || null,
            },
          });
        }
      } catch (sbErr) {
        console.warn('Supabase documents upload fallback to local:', sbErr);
      }
    }

    // Local JSON fallback
    const all = getLocalDocs();
    const newDoc = {
      id: `DOC-${Date.now()}`,
      owner_type: ownerType,
      owner_id: ownerId,
      ownerType,
      ownerId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      storage_path: storagePath,
      category,
      expiry_date: expiryDate,
      notes,
      uploaded_by: 'Opus Staff',
      created_at: new Date().toISOString(),
      downloadUrl: '#',
    };

    all.unshift(newDoc);
    saveLocalDocs(all);

    return NextResponse.json({ ok: true, document: newDoc });
  } catch (err) {
    console.error('Document upload error:', err);
    return NextResponse.json({ message: 'Failed to upload document.' }, { status: 500 });
  }
}
