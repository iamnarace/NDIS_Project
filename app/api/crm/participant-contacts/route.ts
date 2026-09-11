import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.', message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get('participantId');

  if (!participantId) {
    return NextResponse.json({ ok: false, error: 'participantId parameter is required.', message: 'participantId parameter is required.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.', message: 'Database service unavailable.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('participant_contacts')
    .select(`
      id,
      participant_id,
      contact_id,
      relationship_label,
      contacts:contacts (
        id,
        full_name,
        role,
        organization_name,
        email,
        phone,
        notes,
        created_at
      )
    `)
    .eq('participant_id', participantId);

  if (error) {
    return NextResponse.json({ ok: false, error: userFacingError(error.message), message: userFacingError(error.message) }, { status: 500 });
  }

  const mapped = (data || []).map((row: any) => {
    const c = Array.isArray(row.contacts) ? row.contacts[0] : row.contacts || {};
    return {
      id: row.id,
      participantId: row.participant_id,
      contactId: row.contact_id,
      relationshipLabel: row.relationship_label || '',
      fullName: c.full_name || 'Unnamed Contact',
      role: c.role || 'Contact',
      organizationName: c.organization_name || '',
      email: c.email || '',
      phone: c.phone || '',
      notes: c.notes || '',
      createdAt: c.created_at || null,
    };
  });

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.', message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { participantId, fullName, role, organizationName, email, phone, notes, relationshipLabel } = body;

    if (!participantId) {
      return NextResponse.json({ ok: false, error: 'Participant ID is required.', message: 'Participant ID is required.' }, { status: 400 });
    }

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ ok: false, error: 'Contact full name is required.', message: 'Contact full name is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database service unavailable.', message: 'Database service unavailable.' }, { status: 503 });
    }

    // 1. Insert into contacts
    const { data: contact, error: contactErr } = await supabase
      .from('contacts')
      .insert({
        full_name: fullName.trim(),
        role: (role && role.trim()) || 'Nominee / Representative',
        organization_name: (organizationName && organizationName.trim()) || null,
        email: (email && email.trim()) || null,
        phone: (phone && phone.trim()) || null,
        notes: (notes && notes.trim()) || null,
      })
      .select()
      .single();

    if (contactErr || !contact) {
      return NextResponse.json({ ok: false, error: contactErr?.message || 'Failed to create contact record.', message: contactErr?.message || 'Failed to create contact record.' }, { status: 500 });
    }

    // 2. Link in participant_contacts
    const { data: link, error: linkErr } = await supabase
      .from('participant_contacts')
      .insert({
        participant_id: participantId,
        contact_id: contact.id,
        relationship_label: (relationshipLabel && relationshipLabel.trim()) || null,
      })
      .select()
      .single();

    if (linkErr || !link) {
      await supabase.from('contacts').delete().eq('id', contact.id);
      return NextResponse.json({ ok: false, error: linkErr?.message || 'Failed to link contact to participant.', message: linkErr?.message || 'Failed to link contact to participant.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      contact: {
        id: link.id,
        participantId: link.participant_id,
        contactId: contact.id,
        relationshipLabel: link.relationship_label || '',
        fullName: contact.full_name,
        role: contact.role,
        organizationName: contact.organization_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        notes: contact.notes || '',
        createdAt: contact.created_at,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: userFacingError(err), message: userFacingError(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.', message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, contactId, fullName, role, organizationName, email, phone, notes, relationshipLabel } = body;

    if (!id && !contactId) {
      return NextResponse.json({ ok: false, error: 'Contact ID is required.', message: 'Contact ID is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database service unavailable.', message: 'Database service unavailable.' }, { status: 503 });
    }

    let actualContactId = contactId;
    if (!actualContactId && id) {
      const { data: link } = await supabase
        .from('participant_contacts')
        .select('contact_id')
        .eq('id', id)
        .single();
      actualContactId = link?.contact_id;
    }

    if (actualContactId) {
      const contactUpdates: Record<string, any> = {};
      if (fullName !== undefined) contactUpdates.full_name = fullName.trim();
      if (role !== undefined) contactUpdates.role = role.trim();
      if (organizationName !== undefined) contactUpdates.organization_name = organizationName.trim() || null;
      if (email !== undefined) contactUpdates.email = email.trim() || null;
      if (phone !== undefined) contactUpdates.phone = phone.trim() || null;
      if (notes !== undefined) contactUpdates.notes = notes.trim() || null;

      if (Object.keys(contactUpdates).length > 0) {
        const { error: cErr } = await supabase
          .from('contacts')
          .update(contactUpdates)
          .eq('id', actualContactId);
        if (cErr) {
          return NextResponse.json({ ok: false, error: cErr.message, message: cErr.message }, { status: 500 });
        }
      }
    }

    if (id && relationshipLabel !== undefined) {
      const { error: lErr } = await supabase
        .from('participant_contacts')
        .update({ relationship_label: relationshipLabel.trim() || null })
        .eq('id', id);
      if (lErr) {
        return NextResponse.json({ ok: false, error: lErr.message, message: lErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: userFacingError(err), message: userFacingError(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.', message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Contact link ID (id) is required.', message: 'Contact link ID (id) is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database service unavailable.', message: 'Database service unavailable.' }, { status: 503 });
    }

    const { data: link } = await supabase
      .from('participant_contacts')
      .select('contact_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('participant_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, message: error.message }, { status: 500 });
    }

    if (link?.contact_id) {
      const { count } = await supabase
        .from('participant_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('contact_id', link.contact_id);

      if (count === 0) {
        await supabase.from('contacts').delete().eq('id', link.contact_id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: userFacingError(err), message: userFacingError(err) }, { status: 500 });
  }
}
