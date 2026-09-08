/**
 * Opus Care - UUID Validation & Entity Reference Resolution
 * Enforces database UUID foreign key integrity while handling human-readable
 * reference numbers defensively across API routes.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOOSE_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(val: any): boolean {
  if (typeof val !== 'string') return false;
  return LOOSE_UUID_REGEX.test(val.trim());
}

export function isReferenceNumber(val: any): boolean {
  if (typeof val !== 'string') return false;
  return /^(STF|PAR|SHF|INC|CMP|CAP|AGR)-/i.test(val.trim());
}

/**
 * Resolves a staff reference number (e.g. STF-001 or STF-00011) or name to its Supabase UUID id.
 */
export async function resolveStaffUuid(
  supabase: any,
  staffIdOrRef: string | null | undefined
): Promise<string | null> {
  if (!staffIdOrRef || typeof staffIdOrRef !== 'string') return null;
  const trimmed = staffIdOrRef.trim();
  if (isValidUuid(trimmed)) return trimmed;

  if (!supabase) return null;

  try {
    // 1. Try exact match on reference_number
    const { data: byRef } = await supabase
      .from('staff')
      .select('id')
      .ilike('reference_number', trimmed)
      .maybeSingle();

    if (byRef?.id && isValidUuid(byRef.id)) return byRef.id;

    // 2. Try normalized reference number (e.g. STF-001 -> STF-00001 or vice-versa)
    const numPart = trimmed.replace(/^STF-/i, '');
    if (/^\d+$/.test(numPart)) {
      const paddedRef = `STF-${numPart.padStart(5, '0')}`;
      const { data: byPadded } = await supabase
        .from('staff')
        .select('id')
        .ilike('reference_number', paddedRef)
        .maybeSingle();

      if (byPadded?.id && isValidUuid(byPadded.id)) return byPadded.id;
    }

    // 3. Try lookup by full_name
    const { data: byName } = await supabase
      .from('staff')
      .select('id')
      .ilike('full_name', trimmed)
      .maybeSingle();

    if (byName?.id && isValidUuid(byName.id)) return byName.id;
  } catch (err) {
    console.warn('resolveStaffUuid error:', err);
  }

  return null;
}

/**
 * Resolves a participant reference number (e.g. PAR-001 or PAR-00021) or name to its Supabase UUID id.
 */
export async function resolveParticipantUuid(
  supabase: any,
  participantIdOrRef: string | null | undefined
): Promise<string | null> {
  if (!participantIdOrRef || typeof participantIdOrRef !== 'string') return null;
  const trimmed = participantIdOrRef.trim();
  if (isValidUuid(trimmed)) return trimmed;

  if (!supabase) return null;

  try {
    // 1. Try exact match on reference_number
    const { data: byRef } = await supabase
      .from('participants')
      .select('id')
      .ilike('reference_number', trimmed)
      .maybeSingle();

    if (byRef?.id && isValidUuid(byRef.id)) return byRef.id;

    // 2. Try normalized reference number (e.g. PAR-001 -> PAR-00001)
    const numPart = trimmed.replace(/^PAR-/i, '');
    if (/^\d+$/.test(numPart)) {
      const paddedRef = `PAR-${numPart.padStart(5, '0')}`;
      const { data: byPadded } = await supabase
        .from('participants')
        .select('id')
        .ilike('reference_number', paddedRef)
        .maybeSingle();

      if (byPadded?.id && isValidUuid(byPadded.id)) return byPadded.id;
    }

    // 3. Try lookup by full_name
    const { data: byName } = await supabase
      .from('participants')
      .select('id')
      .ilike('full_name', trimmed)
      .maybeSingle();

    if (byName?.id && isValidUuid(byName.id)) return byName.id;
  } catch (err) {
    console.warn('resolveParticipantUuid error:', err);
  }

  return null;
}

/**
 * Resolves an incident reference (INC-YYYY-XXXX) to UUID id.
 */
export async function resolveIncidentUuid(
  supabase: any,
  incidentIdOrRef: string | null | undefined
): Promise<string | null> {
  if (!incidentIdOrRef || typeof incidentIdOrRef !== 'string') return null;
  const trimmed = incidentIdOrRef.trim();
  if (isValidUuid(trimmed)) return trimmed;

  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('incidents')
      .select('id')
      .ilike('incident_reference', trimmed)
      .maybeSingle();

    if (data?.id && isValidUuid(data.id)) return data.id;
  } catch (err) {
    console.warn('resolveIncidentUuid error:', err);
  }

  return null;
}

/**
 * Resolves a shift reference (SHF-YYYY-XXXX) to UUID id.
 */
export async function resolveShiftUuid(
  supabase: any,
  shiftIdOrRef: string | null | undefined
): Promise<string | null> {
  if (!shiftIdOrRef || typeof shiftIdOrRef !== 'string') return null;
  const trimmed = shiftIdOrRef.trim();
  if (isValidUuid(trimmed)) return trimmed;

  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('shifts')
      .select('id')
      .ilike('shift_reference', trimmed)
      .maybeSingle();

    if (data?.id && isValidUuid(data.id)) return data.id;
  } catch (err) {
    console.warn('resolveShiftUuid error:', err);
  }

  return null;
}
