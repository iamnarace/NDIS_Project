export interface VacancyPublicationValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateVacancyForPublication(data: any): VacancyPublicationValidationResult {
  const errors: string[] = [];

  const title = String(data.title || '').trim();
  if (!title) {
    errors.push('Job title is required and cannot be blank.');
  }

  const shortSummary = String(data.short_summary || '').trim();
  if (!shortSummary) {
    errors.push('Short summary is required and cannot be blank.');
  }

  const aboutRole = String(data.about_role || '').trim();
  if (!aboutRole) {
    errors.push('About the role description is required and cannot be blank.');
  }

  const serviceAreaIds = Array.isArray(data.service_area_ids) ? data.service_area_ids : [];
  if (serviceAreaIds.length === 0) {
    errors.push('At least one service area must be selected for the vacancy.');
  }

  const engagementRelationship = data.engagement_relationship || data.engagement_type;
  if (!['employee', 'contractor'].includes(engagementRelationship)) {
    errors.push('Valid engagement relationship (employee or contractor) is required.');
  }

  const employmentBasis = Array.isArray(data.employment_basis) ? data.employment_basis : [];
  if (engagementRelationship === 'employee' && employmentBasis.length === 0) {
    errors.push('At least one employment basis (casual, part-time, full-time, or fixed-term) is required for an employee role.');
  } else if (engagementRelationship === 'contractor' && employmentBasis.length > 0) {
    errors.push('Employment basis must be empty for contractor opportunities.');
  }

  const responsibilities = Array.isArray(data.responsibilities) ? data.responsibilities : [];
  if (responsibilities.filter((r: any) => typeof r === 'string' && r.trim().length > 0).length === 0) {
    errors.push('At least one key responsibility is required.');
  }

  const essentialCriteria = Array.isArray(data.essential_criteria) ? data.essential_criteria : [];
  if (essentialCriteria.filter((c: any) => typeof c === 'string' && c.trim().length > 0).length === 0) {
    errors.push('At least one essential criterion is required.');
  }

  if (data.pay_display_mode === 'custom_text') {
    const customText = String(data.pay_public_text || '').trim();
    if (!customText) {
      errors.push('Public pay text is required when pay display mode is set to custom.');
    }
  }

  if (data.opens_at && data.closes_at) {
    const opens = new Date(data.opens_at).getTime();
    const closes = new Date(data.closes_at).getTime();
    if (isNaN(opens) || isNaN(closes) || closes <= opens) {
      errors.push('Closing date and time must be after opening date and time.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isVacancyCurrentlyOpen(vacancy: {
  status: string;
  opens_at?: string | null;
  closes_at?: string | null;
}): boolean {
  if (vacancy.status !== 'published') return false;

  const now = Date.now();
  if (vacancy.opens_at) {
    const opens = new Date(vacancy.opens_at).getTime();
    if (!isNaN(opens) && opens > now) return false;
  }

  if (vacancy.closes_at) {
    const closes = new Date(vacancy.closes_at).getTime();
    if (!isNaN(closes) && closes < now) return false;
  }

  return true;
}
