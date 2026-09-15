type ReferenceClient = {
  from: (table: string) => {
    select: (columns: string) => PromiseLike<{
      data: Array<{ reference_number: string | null }> | null;
      error: { message: string } | null;
    }>;
  };
};

export async function nextReferenceNumber(
  client: ReferenceClient,
  table: string,
  prefix: string,
  width = 5,
): Promise<string> {
  const { data, error } = await client.from(table).select('reference_number');
  if (error) throw new Error(error.message);

  const matcher = new RegExp(`^${prefix}-(\\d+)$`);
  const highest = (data || []).reduce((max, row) => {
    const match = row.reference_number?.match(matcher);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `${prefix}-${String(highest + 1).padStart(width, '0')}`;
}

export function getSydneyYear(): string {
  try {
    return new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', year: 'numeric' }).format(new Date());
  } catch {
    return String(new Date().getFullYear());
  }
}

export async function nextYearlyReferenceNumber(
  client: ReferenceClient,
  table: string,
  prefix: string,
  width = 5,
): Promise<string> {
  const currentYear = getSydneyYear();
  const fullPrefix = `${prefix}-${currentYear}`;
  const { data, error } = await client.from(table).select('reference_number');
  if (error) throw new Error(error.message);

  const matcher = new RegExp(`^${fullPrefix}-(\\d+)$`);
  const highest = (data || []).reduce((max, row) => {
    const match = row.reference_number?.match(matcher);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `${fullPrefix}-${String(highest + 1).padStart(width, '0')}`;
}

/**
 * Strict fail-closed atomic recruitment reference generator.
 * Calls PostgreSQL sequence function `next_recruitment_reference`.
 * Fails closed without race-prone table-scan fallback.
 */
export async function getAtomicRecruitmentReference(
  supabase: any,
  prefix: 'APP' | 'JOB'
): Promise<string> {
  const { data, error } = await supabase.rpc('next_recruitment_reference', { p_prefix: prefix });
  if (error || typeof data !== 'string' || !data.startsWith(`${prefix}-`)) {
    throw new Error(`Failed to generate atomic recruitment reference for ${prefix}: ${error?.message || 'Invalid sequence response'}`);
  }
  return data;
}
