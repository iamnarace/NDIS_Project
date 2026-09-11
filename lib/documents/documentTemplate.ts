import { OrganisationProfile } from '@/lib/organisation';

export interface DocumentDateItem {
  label: string;
  value: string;
}

export interface DocumentRecipient {
  heading: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  additionalInfo?: string | null;
}

export interface DocumentParticipantDetails {
  name: string;
  ndisNumber?: string | null;
  fundingType?: string | null;
  suburb?: string | null;
}

export interface DocumentShellProps {
  pageTitle: string;
  docTypeBadge: string;
  docReference: string;
  statusBadge?: { label: string; tone: 'neutral' | 'success' | 'warning' | 'info' };
  org: OrganisationProfile;
  dates: DocumentDateItem[];
  recipient: DocumentRecipient;
  participant?: DocumentParticipantDetails;
  bodyHtml: string;
  totalsHtml?: string;
  remittanceHtml?: string;
  notesHtml?: string;
  footerNote?: string;
}

export function renderDocumentShell(props: DocumentShellProps): string {
  const {
    pageTitle,
    docTypeBadge,
    docReference,
    statusBadge,
    org,
    dates,
    recipient,
    participant,
    bodyHtml,
    totalsHtml,
    remittanceHtml,
    notesHtml,
    footerNote,
  } = props;

  // Formatting ABN display: Never show dummy numbers
  const abnDisplay = org.isAbnConfigured && org.abn
    ? `ABN: ${org.abn}`
    : 'ABN: [Pending Provider Configuration]';

  const bankDisplayHtml = org.isBankConfigured && org.bankBsb && org.bankAccountNumber
    ? `
      <div class="bank-detail-row">
        <span>Bank:</span>
        <strong>${org.bankName || 'Australian Bank'}</strong>
      </div>
      <div class="bank-detail-row">
        <span>Account Name:</span>
        <strong>${org.legalName}</strong>
      </div>
      <div class="bank-detail-row">
        <span>BSB:</span>
        <strong>${org.bankBsb}</strong>
        <span style="margin: 0 8px;">|</span>
        <span>Account Number:</span>
        <strong>${org.bankAccountNumber}</strong>
      </div>
    `
    : `
      <div class="bank-pending-alert">
        <strong>Direct Electronic Funds Transfer (EFT):</strong><br>
        Bank remittance details are currently being verified with finance.<br>
        Please contact <strong>${org.billingEmail}</strong> for payment instructions.
      </div>
    `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }
    
    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1E293B;
      background: #F8FAFC;
      margin: 0;
      padding: 30px 16px;
      line-height: 1.45;
      font-size: 13px;
      -webkit-font-smoothing: antialiased;
    }

    .document-page {
      max-width: 820px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 36px 40px;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
    }

    /* Action bar for screen */
    .screen-action-bar {
      max-width: 820px;
      margin: 0 auto 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: #0F766E;
      color: #FFFFFF;
      border-radius: 8px;
    }

    .screen-action-bar .brand-text {
      font-size: 12.5px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .btn-print {
      background: #FFFFFF;
      color: #0F766E;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: background 0.15s ease;
    }

    .btn-print:hover {
      background: #F0FDFA;
    }

    /* Document Header */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0F766E;
      padding-bottom: 22px;
      margin-bottom: 24px;
    }

    .doc-brand-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .doc-brand-logo {
      height: 44px;
      width: auto;
      max-width: 220px;
      object-fit: contain;
      display: block;
    }

    .doc-type-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 4px;
    }

    .doc-type-badge {
      display: inline-block;
      background: #CCFBF1;
      color: #0F766E;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 4px 12px;
      border-radius: 4px;
    }

    .doc-status-badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .badge-neutral { background: #F1F5F9; color: #475569; }
    .badge-success { background: #DCFCE7; color: #15803D; }
    .badge-warning { background: #FEF3C7; color: #B45309; }
    .badge-info    { background: #E0F2FE; color: #0369A1; }

    .doc-provider-details {
      text-align: right;
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }

    .doc-provider-details strong {
      color: #0F172A;
      font-size: 13px;
    }

    /* Metadata Grid (Bill To & Participant Info) */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }

    .meta-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 14px 16px;
    }

    .meta-card-title {
      margin: 0 0 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748B;
      font-weight: 700;
    }

    .meta-card-name {
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 4px;
    }

    .meta-card-row {
      margin: 2px 0;
      font-size: 12.5px;
      color: #334155;
    }

    .meta-card-row span.label {
      color: #64748B;
      display: inline-block;
      min-width: 90px;
    }

    .doc-date-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
      background: #F1F5F9;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 24px;
    }

    .doc-date-item {
      display: flex;
      flex-direction: column;
    }

    .doc-date-item .label {
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748B;
      font-weight: 700;
    }

    .doc-date-item .value {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 1px;
    }

    /* Content Tables */
    table.doc-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    table.doc-table th {
      background: #F8FAFC;
      color: #334155;
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      text-align: left;
      padding: 9px 10px;
      border-top: 1px solid #E2E8F0;
      border-bottom: 2px solid #CBD5E1;
    }

    table.doc-table td {
      padding: 10px 10px;
      border-bottom: 1px solid #E2E8F0;
      font-size: 12.5px;
      vertical-align: top;
    }

    table.doc-table tr:nth-child(even) td {
      background: #FAFAFA;
    }

    .item-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      color: #0F766E;
      font-size: 11.5px;
    }

    /* Totals Box */
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }

    .totals-card {
      width: 320px;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 6px;
      padding: 14px 18px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 5px;
      color: #334155;
    }

    .totals-row.grand {
      font-size: 16px;
      font-weight: 800;
      color: #15803D;
      border-top: 1px solid #86EFAC;
      padding-top: 8px;
      margin-top: 8px;
      margin-bottom: 0;
    }

    /* Bank / Remittance Box */
    .bank-card {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 14px 18px;
      margin-bottom: 24px;
      font-size: 12.5px;
    }

    .bank-card-title {
      margin: 0 0 8px;
      color: #0F766E;
      font-size: 12.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .bank-detail-row {
      margin: 3px 0;
      color: #1E293B;
    }

    .bank-detail-row span {
      color: #64748B;
      display: inline-block;
      min-width: 110px;
    }

    .bank-pending-alert {
      color: #92400E;
      background: #FEF3C7;
      border: 1px solid #FDE68A;
      border-radius: 4px;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.45;
    }

    /* Notes Box */
    .notes-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 12px;
      color: #475569;
    }

    .notes-card strong {
      color: #1E293B;
      display: block;
      margin-bottom: 4px;
    }

    /* Document Footer */
    .doc-footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 16px;
      text-align: center;
      font-size: 11px;
      color: #64748B;
      line-height: 1.6;
    }

    .doc-footer-legal {
      font-size: 10.5px;
      color: #94A3B8;
      margin-top: 4px;
    }

    /* Print Overrides */
    @media print {
      body {
        background: #FFFFFF;
        padding: 0;
        margin: 0;
      }

      .no-print, .screen-action-bar {
        display: none !important;
      }

      .document-page {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }

      table.doc-table {
        page-break-inside: auto;
      }

      table.doc-table tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      .totals-wrapper, .bank-card, .notes-card, .doc-footer {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="screen-action-bar no-print">
    <div class="brand-text">
      <strong>Opus Care Operations</strong> &bull; Document Generator
    </div>
    <button class="btn-print" onclick="window.print()">
      Print / Save as PDF
    </button>
  </div>

  <div class="document-page">
    <!-- Header -->
    <header class="doc-header">
      <div class="doc-brand-block">
        <img src="${org.logoDataUri}" alt="${org.tradingName}" class="doc-brand-logo" />
        <div class="doc-type-wrap">
          <span class="doc-type-badge">${docTypeBadge}</span>
          ${statusBadge ? `<span class="doc-status-badge badge-${statusBadge.tone}">${statusBadge.label}</span>` : ''}
        </div>
      </div>
      <div class="doc-provider-details">
        <strong>${org.legalName}</strong><br>
        ${abnDisplay}<br>
        ${org.registeredAddress ? `${org.registeredAddress}<br>` : ''}
        ${org.phone ? `Phone: ${org.phone}<br>` : ''}
        Email: ${org.billingEmail}<br>
        Web: ${org.website}
      </div>
    </header>

    <!-- Dates Bar -->
    <div class="doc-date-bar">
      <div class="doc-date-item">
        <span class="label">Reference #</span>
        <span class="value" style="color: #0F766E;">${docReference}</span>
      </div>
      ${dates.map(d => `
        <div class="doc-date-item">
          <span class="label">${d.label}</span>
          <span class="value">${d.value}</span>
        </div>
      `).join('')}
    </div>

    <!-- Metadata / Parties Grid -->
    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-card-title">${recipient.heading}</div>
        <div class="meta-card-name">${recipient.name}</div>
        ${recipient.email ? `<div class="meta-card-row"><span class="label">Email:</span> ${recipient.email}</div>` : ''}
        ${recipient.phone ? `<div class="meta-card-row"><span class="label">Phone:</span> ${recipient.phone}</div>` : ''}
        ${recipient.address ? `<div class="meta-card-row"><span class="label">Address:</span> ${recipient.address}</div>` : ''}
        ${recipient.additionalInfo ? `<div class="meta-card-row" style="margin-top: 6px; font-size: 11.5px; color: #64748B;">${recipient.additionalInfo}</div>` : ''}
      </div>

      ${participant ? `
        <div class="meta-card">
          <div class="meta-card-title">Participant Details</div>
          <div class="meta-card-name">${participant.name}</div>
          <div class="meta-card-row"><span class="label">NDIS Number:</span> <strong>${participant.ndisNumber || 'Not recorded'}</strong></div>
          <div class="meta-card-row"><span class="label">Funding Type:</span> ${participant.fundingType || 'Standard NDIS'}</div>
          ${participant.suburb ? `<div class="meta-card-row"><span class="label">Region:</span> ${participant.suburb}</div>` : ''}
        </div>
      ` : ''}
    </div>

    <!-- Main Content / Table -->
    ${bodyHtml}

    <!-- Totals -->
    ${totalsHtml || ''}

    <!-- Remittance / Payment Details (Invoices) -->
    ${remittanceHtml ? `
      <div class="bank-card">
        <div class="bank-card-title">Remittance Advice &amp; Payment Options</div>
        ${bankDisplayHtml}
        <div class="bank-detail-row" style="margin-top: 8px; border-top: 1px dashed #CBD5E1; padding-top: 6px;">
          <span>Payment Reference:</span>
          <strong style="color: #0F766E;">${docReference}</strong>
        </div>
        <div style="font-size: 11px; color: #64748B; margin-top: 6px;">
          Please forward all remittance advices to <strong>${org.billingEmail}</strong>.
        </div>
      </div>
    ` : ''}

    <!-- Notes -->
    ${notesHtml ? `
      <div class="notes-card">
        <strong>Notes &amp; Conditions:</strong>
        <div>${notesHtml}</div>
      </div>
    ` : ''}

    <!-- Footer -->
    <footer class="doc-footer">
      <div>
        <strong>${org.tradingName}</strong>${org.registeredAddress ? ` &bull; ${org.registeredAddress}` : ''}
      </div>
      ${footerNote ? `<div class="doc-footer-legal">${footerNote}</div>` : ''}
    </footer>
  </div>
</body>
</html>`;
}
