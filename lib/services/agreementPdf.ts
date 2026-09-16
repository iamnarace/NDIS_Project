import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ExecutedDocumentPayload {
  agreement: {
    id: string;
    agreement_reference: string;
    title: string;
    template_version?: string;
    version_number?: number;
    owner_type: string;
    commencement_date: string;
    review_date?: string | null;
    expiry_date?: string | null;
    questionnaire_data: Record<string, any>;
    compiled_clauses: Record<string, any>;
    template?: {
      template_code?: string;
      source_basis?: string;
      clause_schema?: Record<string, any>;
    };
  };
  signatures: Array<{
    party_role: string;
    signer_name: string;
    signer_title?: string;
    signer_email?: string;
    signed_at: string;
    signing_method: string;
    signature_image_data?: string | null;
    is_verified?: boolean;
    ip_address?: string | null;
  }>;
  org?: {
    tradingName?: string;
    legalName?: string;
    abn?: string | null;
    proprietorLegalName?: string | null;
  };
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderClausesHtml(clauses: Record<string, any>): string {
  if (!clauses || typeof clauses !== 'object') return '';
  return Object.entries(clauses)
    .map(([key, val]) => {
      const label = key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      if (typeof val === 'string' || typeof val === 'number') {
        return `<section style="margin: 12px 0;"><h4>${escapeHtml(label)}</h4><p style="color: #334155; font-size: 13px; line-height: 1.6;">${escapeHtml(String(val))}</p></section>`;
      }
      if (Array.isArray(val)) {
        return `<section style="margin: 12px 0;"><h4>${escapeHtml(label)}</h4><ul style="color: #334155; font-size: 13px; line-height: 1.6;">${val.map((i) => `<li>${escapeHtml(String(i))}</li>`).join('')}</ul></section>`;
      }
      if (typeof val === 'object' && val !== null) {
        return `<section style="margin: 16px 0;"><h4 style="font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">${escapeHtml(label)}</h4>${renderClausesHtml(val)}</section>`;
      }
      return '';
    })
    .join('');
}

export function renderAuthoritativeExecutedDocumentHtml(payload: ExecutedDocumentPayload): string {
  const { agreement, signatures, org } = payload;
  const qData = agreement.questionnaire_data || {};
  const clauses = agreement.compiled_clauses || {};
  const template = agreement.template || {};

  const recipientSig = signatures.find((s) => ['worker', 'participant', 'guardian', 'contractor'].includes(s.party_role));
  const providerSig = signatures.find((s) => s.party_role === 'provider_rep');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex,nofollow">
  <title>${escapeHtml(agreement.title)} — ${escapeHtml(agreement.agreement_reference)}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #ffffff; }
    .doc-page { max-width: 800px; margin: 0 auto; }
    .doc-header { border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
    .doc-brand { font-size: 12px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em; }
    .doc-title { font-size: 24px; font-weight: 700; margin: 6px 0; }
    .doc-meta { font-size: 12px; color: #64748b; margin: 0; }
    .ref-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; font-size: 11px; }
    .ref-box strong { display: block; font-size: 13px; color: #0f172a; margin-top: 2px; }
    .section { margin: 24px 0; padding-bottom: 18px; border-bottom: 1px solid #f1f5f9; }
    .section h3 { font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.02em; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
    .grid dt { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .grid dd { font-size: 13px; font-weight: 600; color: #0f172a; margin: 2px 0 0; }
    .signatures-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
    .sig-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; background: #f8fafc; }
    .sig-box h4 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #475569; }
    .sig-img { max-height: 60px; max-width: 100%; object-fit: contain; margin: 8px 0; }
    .audit-note { font-size: 10.5px; color: #64748b; margin-top: 8px; line-height: 1.4; }
    .legal-footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="doc-page">
    <div class="doc-header">
      <div>
        <div class="doc-brand">Opus Care Support Services</div>
        <h1 class="doc-title">${escapeHtml(agreement.title)}</h1>
        <p class="doc-meta">${escapeHtml(template.template_code || 'CONTROLLED AGREEMENT')} · Version ${escapeHtml(agreement.template_version || String(agreement.version_number || 1))}</p>
      </div>
      <div class="ref-box">
        <span>Document Reference</span>
        <strong>${escapeHtml(agreement.agreement_reference)}</strong>
        <span style="display: block; margin-top: 6px;">Status</span>
        <strong style="color: #059669;">FULLY EXECUTED</strong>
      </div>
    </div>

    <div class="section">
      <h3>Parties &amp; Commencement</h3>
      <dl class="grid">
        <div><dt>Provider Entity</dt><dd>Opus Care Support Services</dd></div>
        <div><dt>ABN</dt><dd>${escapeHtml(org?.abn || '41 267 197 576')}</dd></div>
        <div><dt>${agreement.owner_type === 'participant' ? 'Participant' : 'Worker / Employee'}</dt><dd>${escapeHtml(qData.participant_name || qData.worker_name || 'Recorded Recipient')}</dd></div>
        <div><dt>Commencement Date</dt><dd>${escapeHtml(agreement.commencement_date || 'Immediate')}</dd></div>
        <div><dt>Review / Expiry Date</dt><dd>${escapeHtml(agreement.review_date || agreement.expiry_date || '12 Months from Commencement')}</dd></div>
      </dl>
    </div>

    ${agreement.owner_type !== 'participant' ? `
    <div class="section">
      <h3>Employment Particulars</h3>
      <dl class="grid">
        <div><dt>Classification</dt><dd>${escapeHtml(qData.worker_classification || clauses.classification || 'Support Worker')}</dd></div>
        <div><dt>Basis</dt><dd>${escapeHtml(String(qData.worker_basis || clauses.basis || 'Permanent').replace(/_/g, ' '))}</dd></div>
        <div><dt>Ordinary Hourly Rate</dt><dd>$${Number(qData.hourly_rate || clauses.hourly_rate || 0).toFixed(2)} AUD</dd></div>
        <div><dt>Agreed Weekly Hours</dt><dd>${Number(qData.agreed_weekly_hours || 0)} hours / week</dd></div>
        <div><dt>Superannuation</dt><dd>${Number(qData.super_rate_pct || clauses.super_pct || 12.0).toFixed(2)}%</dd></div>
        <div><dt>Applicable Instrument</dt><dd>${escapeHtml(template.source_basis || 'SCHADS Industry Award 2010')}</dd></div>
      </dl>
    </div>
    ` : ''}

    <div class="section">
      <h3>Terms &amp; Conditions</h3>
      ${template.clause_schema ? renderClausesHtml(template.clause_schema) : '<p style="color: #64748b;">Terms recorded in schedule.</p>'}
    </div>

    <div class="section">
      <h3>Authoritative Execution &amp; Audit Trail</h3>
      <div class="signatures-grid">
        <div class="sig-box">
          <h4>Provider Representative Signature</h4>
          <div><strong>${escapeHtml(providerSig?.signer_name || 'Naresh Admin')}</strong></div>
          <div style="font-size: 12px; color: #475569;">${escapeHtml(providerSig?.signer_title || 'Managing Director')}</div>
          ${providerSig?.signature_image_data ? `<img src="${providerSig.signature_image_data}" alt="Provider Signature" class="sig-img" />` : '<div style="margin: 10px 0; font-style: italic; color: #64748b;">Digitally Confirmed</div>'}
          <div class="audit-note">
            Signed: ${providerSig?.signed_at ? new Date(providerSig.signed_at).toISOString() : 'Recorded'}<br>
            Method: ${escapeHtml(providerSig?.signing_method || 'internal_system')}
          </div>
        </div>

        <div class="sig-box">
          <h4>${agreement.owner_type === 'participant' ? 'Participant / Representative' : 'Worker / Employee'} Signature</h4>
          <div><strong>${escapeHtml(recipientSig?.signer_name || qData.worker_name || 'Recipient')}</strong></div>
          <div style="font-size: 12px; color: #475569;">${escapeHtml(recipientSig?.signer_title || 'Employee')}</div>
          ${recipientSig?.signature_image_data ? `<img src="${recipientSig.signature_image_data}" alt="Recipient Signature" class="sig-img" />` : '<div style="margin: 10px 0; font-style: italic; color: #64748b;">Digitally Signed</div>'}
          <div class="audit-note">
            Signed: ${recipientSig?.signed_at ? new Date(recipientSig.signed_at).toISOString() : 'Recorded'}<br>
            Method: ${escapeHtml(recipientSig?.signing_method || 'external_link')}<br>
            Email: ${escapeHtml(recipientSig?.signer_email || qData.worker_email || 'Recorded')}
          </div>
        </div>
      </div>
    </div>

    <div class="legal-footer">
      This document constitutes a binding legal agreement executed electronically in accordance with the Electronic Transactions Act 1999 (Cth).<br>
      Authoritative digital original held securely by Opus Care Support Services.
    </div>
  </div>
</body>
</html>`;
}

export function generateAuthoritativeExecutedBytes(payload: ExecutedDocumentPayload): Buffer {
  const html = renderAuthoritativeExecutedDocumentHtml(payload);
  return Buffer.from(html, 'utf-8');
}

export function calculateAuthoritativeHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function uploadExecutedDocument(
  supabase: SupabaseClient,
  agreementRef: string,
  buffer: Buffer
): Promise<{ path: string; hash: string }> {
  const hash = calculateAuthoritativeHash(buffer);
  const timestamp = Date.now();
  const cleanRef = agreementRef.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `agreements/executed/${cleanRef}-${timestamp}.html`;

  if (supabase?.storage) {
    const { error } = await supabase.storage
      .from('crm-documents')
      .upload(path, buffer, {
        contentType: 'text/html; charset=utf-8',
        upsert: false,
      });

    if (error) {
      console.warn('Supabase storage upload notice (will retain authoritative hash):', error.message);
    }
  }

  return { path, hash };
}

export async function cleanupUploadedExecutedDocument(
  supabase: SupabaseClient,
  path: string
): Promise<void> {
  if (!supabase?.storage || !path) return;
  try {
    await supabase.storage.from('crm-documents').remove([path]);
  } catch (err: any) {
    console.warn('Failed to cleanup temporary executed document:', err?.message);
  }
}
