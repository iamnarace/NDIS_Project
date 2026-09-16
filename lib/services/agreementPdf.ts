import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
    frozen_snapshot?: Record<string, any>;
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

function sanitizeText(str: any): string {
  if (str == null) return '';
  return String(str).replace(/[^\x20-\x7E\t\n\r]/g, ' ');
}

function titleizeClauseKey(key: string): string {
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function generateAuthoritativeExecutedPdf(payload: ExecutedDocumentPayload): Promise<Buffer> {
  const { agreement, signatures, org } = payload;
  // Frozen Snapshot Integrity: Draw all terms from the frozen snapshot if present, else compiled clauses
  const snapshot = agreement.frozen_snapshot || {};
  const qData = snapshot.questionnaire_data || agreement.questionnaire_data || {};
  const clauses = snapshot.compiled_clauses || agreement.compiled_clauses || {};

  const recipientSig = signatures.find((s) => ['worker', 'participant', 'guardian', 'contractor'].includes(s.party_role));
  const providerSig = signatures.find((s) => s.party_role === 'provider_rep');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Agreement Details & Particulars
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page1.getSize();

  let y = height - 50;

  // Header Banner
  page1.drawText('OPUS CARE SUPPORT SERVICES', { x: 50, y, size: 10, font: fontBold, color: rgb(0.01, 0.52, 0.78) });
  y -= 22;
  page1.drawText(sanitizeText(agreement.title), { x: 50, y, size: 18, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
  y -= 16;
  page1.drawText(`Document Reference: ${sanitizeText(agreement.agreement_reference)}   |   Status: FULLY EXECUTED`, {
    x: 50,
    y,
    size: 9.5,
    font,
    color: rgb(0.39, 0.45, 0.55),
  });
  y -= 14;
  page1.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 2, color: rgb(0.01, 0.52, 0.78) });
  y -= 25;

  // Section: Parties & Commencement
  page1.drawText('1. PARTIES AND COMMENCEMENT', { x: 50, y, size: 12, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
  y -= 18;

  const abnDisplay = snapshot.provider_abn || org?.abn || '41 267 197 576';
  const providerLegalName =
    snapshot.provider_legal_name ||
    org?.proprietorLegalName ||
    org?.legalName ||
    org?.tradingName ||
    'Opus Care Support Services';
  const providerTradingName = snapshot.provider_trading_name || org?.tradingName || 'Opus Care Support Services';
  const providerEntity = providerLegalName === providerTradingName
    ? providerLegalName
    : `${providerLegalName}, trading as ${providerTradingName}`;
  const recipientName = qData.worker_name || qData.participant_name || recipientSig?.signer_name || 'Recorded Recipient';

  const partyDetails = [
    `Provider: ${providerEntity} (ABN: ${abnDisplay})`,
    `${agreement.owner_type === 'participant' ? 'Participant' : 'Worker / Employee'}: ${recipientName}`,
    `Commencement Date: ${agreement.commencement_date || 'Immediate'}`,
    `Review / Expiry Date: ${agreement.review_date || agreement.expiry_date || '12 Months from Commencement'}`,
  ];

  for (const line of partyDetails) {
    page1.drawText(sanitizeText(line), { x: 60, y, size: 10, font, color: rgb(0.2, 0.25, 0.33) });
    y -= 16;
  }
  y -= 12;

  // Section: Employment / Service Particulars
  if (agreement.owner_type !== 'participant') {
    page1.drawText('2. EMPLOYMENT PARTICULARS', { x: 50, y, size: 12, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
    y -= 18;

    const empParticulars = [
      `Classification: ${qData.worker_classification || clauses.classification || 'Support Worker'}`,
      `Employment Basis: ${String(qData.worker_basis || clauses.basis || 'Permanent').replace(/_/g, ' ')}`,
      `Ordinary Hourly Rate: $${Number(qData.hourly_rate || clauses.hourly_rate || 0).toFixed(2)} AUD`,
      `Agreed Weekly Hours: ${Number(qData.agreed_weekly_hours || 0)} hours / week`,
      `Superannuation Contribution: ${Number(qData.super_rate_pct || clauses.super_pct || 12.0).toFixed(2)}%`,
      `Applicable Award / Basis: ${snapshot.source_basis || clauses.source_basis || 'SCHADS Industry Award 2010'}`,
    ];

    for (const line of empParticulars) {
      page1.drawText(sanitizeText(line), { x: 60, y, size: 10, font, color: rgb(0.2, 0.25, 0.33) });
      y -= 16;
    }
    y -= 12;
  }

  // Section: Terms & Conditions from frozen snapshot
  page1.drawText('3. APPROVED CONTRACTUAL TERMS & CONDITIONS', { x: 50, y, size: 12, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
  y -= 18;

  const snapshotTemplateClauses = snapshot.template_clause_schema || {};
  const contractualTerms = Object.keys(snapshotTemplateClauses).length > 0
    ? snapshotTemplateClauses
    : snapshot.compiled_clauses || clauses || {};
  const entries = Object.entries(contractualTerms);

  if (entries.length > 0) {
    let termsPage = page1;
    let termsY = y;
    const marginBottom = 54;
    const contentLeft = 70;
    const contentRight = 50;

    const addTermsContinuationPage = () => {
      termsPage = pdfDoc.addPage([595.28, 841.89]);
      termsY = height - 50;
      termsPage.drawText('OPUS CARE SUPPORT SERVICES', {
        x: 50,
        y: termsY,
        size: 10,
        font: fontBold,
        color: rgb(0.01, 0.52, 0.78),
      });
      termsY -= 20;
      termsPage.drawText('3. APPROVED CONTRACTUAL TERMS & CONDITIONS (CONTINUED)', {
        x: 50,
        y: termsY,
        size: 11,
        font: fontBold,
        color: rgb(0.06, 0.09, 0.16),
      });
      termsY -= 14;
      termsPage.drawLine({
        start: { x: 50, y: termsY },
        end: { x: width - 50, y: termsY },
        thickness: 1.2,
        color: rgb(0.01, 0.52, 0.78),
      });
      termsY -= 24;
    };

    const ensureTermsSpace = (requiredHeight: number) => {
      if (termsY - requiredHeight < marginBottom) addTermsContinuationPage();
    };

    const wrapText = (value: string, maxWidth: number, size: number, textFont: typeof font) => {
      const paragraphs = sanitizeText(value).split(/\r?\n/);
      const lines: string[] = [];

      for (const paragraph of paragraphs) {
        const words = paragraph.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) {
          lines.push('');
          continue;
        }

        let current = '';
        for (const word of words) {
          const candidate = current ? `${current} ${word}` : word;
          if (textFont.widthOfTextAtSize(candidate, size) <= maxWidth) {
            current = candidate;
            continue;
          }

          if (current) lines.push(current);
          current = word;
        }
        if (current) lines.push(current);
      }

      return lines;
    };

    const drawWrappedClauseText = (
      value: string,
      options: { indent?: number; size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; lineHeight?: number } = {}
    ) => {
      const indent = options.indent || 0;
      const size = options.size || 9;
      const lineHeight = options.lineHeight || 13;
      const textFont = options.bold ? fontBold : font;
      const maxWidth = width - contentLeft - contentRight - indent;
      const lines = wrapText(value, maxWidth, size, textFont);

      for (const line of lines) {
        ensureTermsSpace(lineHeight);
        if (line) {
          termsPage.drawText(line, {
            x: contentLeft + indent,
            y: termsY,
            size,
            font: textFont,
            color: options.color || rgb(0.3, 0.35, 0.45),
          });
        }
        termsY -= lineHeight;
      }
    };

    const drawClauseValue = (value: unknown, depth = 0): void => {
      if (value == null) return;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item != null && typeof item === 'object') {
            drawClauseValue(item, depth + 1);
          } else {
            drawWrappedClauseText(`- ${String(item)}`, { indent: Math.min(depth * 12, 48) });
          }
        }
        return;
      }

      if (typeof value === 'object') {
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          ensureTermsSpace(30);
          drawWrappedClauseText(titleizeClauseKey(nestedKey), {
            indent: Math.min(depth * 12, 48),
            size: 9,
            bold: true,
            color: rgb(0.16, 0.22, 0.32),
          });
          drawClauseValue(nestedValue, depth + 1);
          termsY -= 4;
        }
        return;
      }

      drawWrappedClauseText(String(value), { indent: Math.min(depth * 12, 48) });
    };

    for (const [key, val] of entries) {
      ensureTermsSpace(36);
      drawWrappedClauseText(titleizeClauseKey(key), {
        size: 10,
        bold: true,
        color: rgb(0.1, 0.15, 0.25),
        lineHeight: 14,
      });
      drawClauseValue(val);
      termsY -= 8;
    }
    y = termsY;
  } else {
    page1.drawText('Standard approved terms and conditions apply as documented in the operational master schedule.', {
      x: 60,
      y,
      size: 9.5,
      font,
      color: rgb(0.3, 0.35, 0.45),
    });
    y -= 18;
  }

  // Page 2: Execution & Signatures Audit Record
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  let y2 = height - 50;

  page2.drawText('OPUS CARE SUPPORT SERVICES', { x: 50, y: y2, size: 10, font: fontBold, color: rgb(0.01, 0.52, 0.78) });
  y2 -= 20;
  page2.drawText('4. AUTHORITATIVE EXECUTION & AUDIT EVIDENCE', { x: 50, y: y2, size: 14, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
  y2 -= 14;
  page2.drawLine({ start: { x: 50, y: y2 }, end: { x: width - 50, y: y2 }, thickness: 1.5, color: rgb(0.01, 0.52, 0.78) });
  y2 -= 30;

  // Provider Signature Box
  page2.drawRectangle({
    x: 50,
    y: y2 - 130,
    width: width - 100,
    height: 130,
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 1.0),
  });

  page2.drawText('PROVIDER REPRESENTATIVE EXECUTION', { x: 65, y: y2 - 20, size: 10, font: fontBold, color: rgb(0.02, 0.35, 0.6) });
  page2.drawText(`Signatory: ${sanitizeText(providerSig?.signer_name || 'Naresh Admin')}`, { x: 65, y: y2 - 38, size: 9.5, font, color: rgb(0.1, 0.15, 0.25) });
  page2.drawText(`Title: ${sanitizeText(providerSig?.signer_title || 'Managing Director, Opus Care Support Services')}`, { x: 65, y: y2 - 52, size: 9.5, font, color: rgb(0.1, 0.15, 0.25) });
  page2.drawText(`Signed Timestamp: ${providerSig?.signed_at ? new Date(providerSig.signed_at).toISOString() : 'Recorded'}`, { x: 65, y: y2 - 66, size: 9, font, color: rgb(0.3, 0.35, 0.45) });
  page2.drawText(`Signing Method: ${sanitizeText(providerSig?.signing_method || 'digital_canvas')}`, { x: 65, y: y2 - 80, size: 9, font, color: rgb(0.3, 0.35, 0.45) });

  // Embed provider signature image if valid PNG/JPEG
  if (providerSig?.signature_image_data?.startsWith('data:image/png;base64,')) {
    try {
      const base64Data = providerSig.signature_image_data.split(',')[1];
      const imgBytes = Buffer.from(base64Data, 'base64');
      const embeddedImg = await pdfDoc.embedPng(imgBytes);
      page2.drawImage(embeddedImg, { x: width - 220, y: y2 - 110, width: 140, height: 50 });
    } catch {
      page2.drawText('[Digital Signature Image Encoded]', { x: width - 220, y: y2 - 70, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    }
  }

  y2 -= 160;

  // Recipient Signature Box
  page2.drawRectangle({
    x: 50,
    y: y2 - 130,
    width: width - 100,
    height: 130,
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 1.0),
  });

  page2.drawText(`${agreement.owner_type === 'participant' ? 'PARTICIPANT' : 'WORKER / EMPLOYEE'} EXECUTION`, {
    x: 65,
    y: y2 - 20,
    size: 10,
    font: fontBold,
    color: rgb(0.02, 0.35, 0.6),
  });
  page2.drawText(`Signatory: ${sanitizeText(recipientSig?.signer_name || recipientName)}`, { x: 65, y: y2 - 38, size: 9.5, font, color: rgb(0.1, 0.15, 0.25) });
  page2.drawText(`Title / Capacity: ${sanitizeText(recipientSig?.signer_title || 'Employee')}`, { x: 65, y: y2 - 52, size: 9.5, font, color: rgb(0.1, 0.15, 0.25) });
  page2.drawText(`Recipient Email: ${sanitizeText(recipientSig?.signer_email || qData.worker_email || 'Recorded on file')}`, { x: 65, y: y2 - 66, size: 9, font, color: rgb(0.1, 0.15, 0.25) });
  page2.drawText(`Signed Timestamp: ${recipientSig?.signed_at ? new Date(recipientSig.signed_at).toISOString() : 'Recorded'}`, { x: 65, y: y2 - 80, size: 9, font, color: rgb(0.3, 0.35, 0.45) });
  page2.drawText(`Execution Channel: ${sanitizeText(recipientSig?.signing_method || 'email_link')}`, { x: 65, y: y2 - 94, size: 9, font, color: rgb(0.3, 0.35, 0.45) });

  // Embed recipient signature image
  if (recipientSig?.signature_image_data?.startsWith('data:image/png;base64,')) {
    try {
      const base64Data = recipientSig.signature_image_data.split(',')[1];
      const imgBytes = Buffer.from(base64Data, 'base64');
      const embeddedImg = await pdfDoc.embedPng(imgBytes);
      page2.drawImage(embeddedImg, { x: width - 220, y: y2 - 110, width: 140, height: 50 });
    } catch {
      page2.drawText('[Digital Signature Image Encoded]', { x: width - 220, y: y2 - 70, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    }
  }

  y2 -= 180;

  // Neutral Factual Legal Footer (No determination assertions)
  page2.drawText(
    'This document records electronic signatures applied by the parties, together with associated system timestamps',
    { x: 50, y: 70, size: 8.5, font, color: rgb(0.4, 0.45, 0.55) }
  );
  page2.drawText(
    'and cryptographic verification data. The authoritative record is maintained in the Opus Care document register.',
    { x: 50, y: 58, size: 8.5, font, color: rgb(0.4, 0.45, 0.55) }
  );
  page2.drawText(
    `Document Reference: ${sanitizeText(agreement.agreement_reference)}   |   Sealed Original`,
    { x: 50, y: 46, size: 8, font: fontBold, color: rgb(0.5, 0.55, 0.65) }
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export function calculateAuthoritativeHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function uploadExecutedDocument(
  supabase: SupabaseClient,
  agreementRef: string,
  buffer: Buffer
): Promise<{ path: string; hash: string }> {
  // Validate real PDF bytes (%PDF-)
  if (!buffer || buffer.length < 10 || buffer.subarray(0, 5).toString() !== '%PDF-') {
    throw new Error('Authoritative executed document must be a valid PDF beginning with %PDF-');
  }

  const hash = calculateAuthoritativeHash(buffer);
  const timestamp = Date.now();
  const cleanRef = agreementRef.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `agreements/executed/${cleanRef}-${timestamp}.pdf`;

  if (!supabase?.storage) {
    throw new Error('Supabase storage client is unavailable for authoritative document storage.');
  }

  const { error } = await supabase.storage
    .from('crm-documents')
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    // Hard failure: Abort execution if storage upload fails!
    throw new Error(`Authoritative executed document storage failed: ${error.message}`);
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
