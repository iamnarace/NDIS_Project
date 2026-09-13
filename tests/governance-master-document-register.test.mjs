import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MASTER_DOCUMENT_REGISTER,
  DOCUMENT_CATEGORIES,
  DOCUMENT_CLASSES,
  getMasterDocumentSummary,
  getDocumentByCode,
  getDocumentsByCategory,
} from '../lib/services/masterDocumentRegister.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function readProjectFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

test('Master Document Register — Completeness & 15 Operational Categories', async (t) => {
  await t.test('contains at least 85 items', () => {
    assert.ok(
      MASTER_DOCUMENT_REGISTER.length >= 85,
      `Expected at least 85 items, got ${MASTER_DOCUMENT_REGISTER.length}`
    );
  });

  await t.test('covers all 15 operational categories with non-empty items', () => {
    assert.strictEqual(DOCUMENT_CATEGORIES.length, 15);
    for (const cat of DOCUMENT_CATEGORIES) {
      const items = getDocumentsByCategory(cat);
      assert.ok(items.length > 0, `Category "${cat}" must have at least 1 document`);
    }
  });

  await t.test('covers all 5 document classes (A, B, C, D, E)', () => {
    assert.strictEqual(DOCUMENT_CLASSES.length, 5);
    const classesFound = new Set(MASTER_DOCUMENT_REGISTER.map((d) => d.documentClass));
    for (const cls of DOCUMENT_CLASSES) {
      assert.ok(classesFound.has(cls), `Document class "${cls}" must be represented`);
    }
  });

  await t.test('all items have required fields populated with valid data', () => {
    const codeSet = new Set();
    for (const doc of MASTER_DOCUMENT_REGISTER) {
      assert.ok(doc.code && doc.code.length > 3, `Document code missing: ${JSON.stringify(doc)}`);
      assert.ok(!codeSet.has(doc.code), `Duplicate document code: ${doc.code}`);
      codeSet.add(doc.code);

      assert.ok(doc.name && doc.name.length > 3, `Document name missing for ${doc.code}`);
      assert.ok(doc.category, `Category missing for ${doc.code}`);
      assert.ok(doc.documentClass, `Class missing for ${doc.code}`);
      assert.ok(doc.audience, `Audience missing for ${doc.code}`);
      assert.ok(doc.mandatoryStatus, `Mandatory status missing for ${doc.code}`);
      assert.ok(doc.trigger, `Trigger missing for ${doc.code}`);
      assert.ok(doc.owner, `Owner missing for ${doc.code}`);
      assert.ok(doc.retentionRecordStatus, `Retention status missing for ${doc.code}`);
      assert.ok(doc.systemLocation, `System location missing for ${doc.code}`);
      assert.ok(doc.status, `Status missing for ${doc.code}`);
    }
  });
});

test('Master Document Register — Statutory Fair Work & ATO Boundary', async (t) => {
  await t.test('Fair Work Information Statement uses official fairwork.gov.au link', () => {
    const fwis = getDocumentByCode('DOC-WRK-03');
    assert.ok(fwis, 'DOC-WRK-03 Fair Work Information Statement must exist');
    assert.ok(fwis.officialUrl?.startsWith('https://www.fairwork.gov.au/'), 'Must link to official Fair Work URL');
    assert.strictEqual(fwis.documentClass, 'D. OFFICIAL EXTERNAL / GOVERNMENT DOCUMENT');
  });

  await t.test('Casual Employment Information Statement uses official fairwork.gov.au link', () => {
    const ceis = getDocumentByCode('DOC-WRK-04');
    assert.ok(ceis, 'DOC-WRK-04 Casual Employment Information Statement must exist');
    assert.ok(ceis.officialUrl?.startsWith('https://www.fairwork.gov.au/'), 'Must link to official Fair Work URL');
  });

  await t.test('Fixed Term Contract Information Statement uses official fairwork.gov.au link', () => {
    const ftcis = getDocumentByCode('DOC-WRK-05');
    assert.ok(ftcis, 'DOC-WRK-05 Fixed Term Contract Information Statement must exist');
    assert.ok(ftcis.officialUrl?.startsWith('https://www.fairwork.gov.au/'), 'Must link to official Fair Work URL');
  });

  await t.test('ATO TFN Declaration uses official ato.gov.au link and preserves strict privacy boundary', () => {
    const tfn = getDocumentByCode('DOC-WRK-06');
    assert.ok(tfn, 'DOC-WRK-06 ATO TFN Declaration must exist');
    assert.ok(tfn.officialUrl?.includes('ato.gov.au'), 'Must link to official ATO URL');
    assert.ok(
      tfn.notes?.toLowerCase().includes('never store') || tfn.notes?.toLowerCase().includes('no tfn stored'),
      'Must note ATO privacy boundary regarding raw TFNs'
    );
  });

  await t.test('ATO Super Standard Choice form uses official ato.gov.au link', () => {
    const superChoice = getDocumentByCode('DOC-WRK-07');
    assert.ok(superChoice, 'DOC-WRK-07 Super Choice form must exist');
    assert.ok(superChoice.officialUrl?.includes('ato.gov.au'), 'Must link to official ATO URL');
  });

  await t.test('CRM code does not store raw Tax File Numbers in worker profiles or documents', () => {
    const workerPanel = readProjectFile('components/admin/WorkerReadinessPanel.tsx');
    assert.ok(
      workerPanel.includes('tfn_declaration_collected'),
      'WorkerReadinessPanel tracks tfn_declaration_collected compliance flag'
    );
    assert.ok(
      !workerPanel.includes('input type="text" placeholder="TFN"'),
      'Raw TFN text field must never be present in CRM form'
    );
  });
});

test('Master Document Register — Financial & Invoicing Compliance', async (t) => {
  await t.test('Service invoice enforces non-GST registered provider wording', () => {
    const invoiceDoc = getDocumentByCode('DOC-FIN-01');
    assert.ok(invoiceDoc, 'DOC-FIN-01 Service Invoice must exist');
    assert.ok(
      invoiceDoc.notes?.includes('INVOICE') && invoiceDoc.notes?.includes('GST has not been charged'),
      'Notes must mandate INVOICE header and GST statement'
    );
  });

  await t.test('Invoice PDF generation route enforces non-GST registered provider wording', () => {
    const invoicePdfRoute = readProjectFile('app/api/billing/invoices/[id]/pdf/route.ts');
    assert.ok(invoicePdfRoute.includes('GST has not been charged – supplier is not registered for GST.'));
  });
});

test('Master Document Register — Clinical Fail-Closed Gate', async (t) => {
  await t.test('Clinical Governance Scope is READY and high-intensity clinical docs are FUTURE / CLINICAL-DISABLED', () => {
    const scopeDoc = getDocumentByCode('DOC-CLN-01');
    assert.ok(scopeDoc, 'DOC-CLN-01 Clinical Scope standard must exist');
    assert.strictEqual(scopeDoc.status, 'READY');

    const futureClinicalDocs = getDocumentsByCategory('15. Clinical & High-Intensity Transition Documents')
      .filter((d) => d.code !== 'DOC-CLN-01');
    assert.ok(futureClinicalDocs.length >= 3, 'Must include future clinical transition documents');
    for (const doc of futureClinicalDocs) {
      assert.strictEqual(
        doc.status,
        'FUTURE / CLINICAL-DISABLED',
        `Clinical doc ${doc.code} must be marked FUTURE / CLINICAL-DISABLED`
      );
      assert.strictEqual(doc.generationAvailable, false, 'Generation must be false for disabled clinical docs');
    }
  });
});

test('Master Document Register — Payroll Boundary & SCHADS Export', async (t) => {
  await t.test('SCHADS payroll export route exists and contains required CSV headers', () => {
    const exportRoute = readProjectFile('app/api/workforce/payroll/export/route.ts');
    assert.ok(exportRoute.includes('OrdinaryHours'), 'Export route must have OrdinaryHours');
    assert.ok(exportRoute.includes('SaturdayHours'), 'Export route must have SaturdayHours');
    assert.ok(exportRoute.includes('SundayHours'), 'Export route must have SundayHours');
    assert.ok(exportRoute.includes('EveningShiftHours'), 'Export route must have EveningShiftHours');
    assert.ok(exportRoute.includes('NightShiftHours'), 'Export route must have NightShiftHours');
    assert.ok(exportRoute.includes('TravelKmAllowance'), 'Export route must have TravelKmAllowance');
    assert.ok(exportRoute.includes('SCHADS_Award_Level'), 'Export route must have SCHADS_Award_Level');
  });

  await t.test('Worker portal payslips API exists and verifies worker authorization', () => {
    const payslipsRoute = readProjectFile('app/api/portal/worker/payslips/route.ts');
    assert.ok(payslipsRoute.includes('category'), 'Payslips route must filter by category payslip');
    assert.ok(payslipsRoute.includes('createSignedUrl'), 'Payslips route must generate secure signed URLs');
  });

  await t.test('Timesheets tab includes payroll export action', () => {
    const timesheetsTab = readProjectFile('components/admin/TimesheetsTab.tsx');
    assert.ok(
      timesheetsTab.includes('Export Payroll Inputs') || timesheetsTab.includes('Export Payroll (SCHADS CSV)'),
      'TimesheetsTab must offer Export Payroll button'
    );
  });
});

test('Master Document Register — Summary KPIs & API Endpoint', async (t) => {
  await t.test('getMasterDocumentSummary returns accurate counts', () => {
    const summary = getMasterDocumentSummary();
    assert.ok(summary.totalDocuments >= 85, 'Total documents >= 85');
    assert.ok(summary.operationalCount > 0, 'Operational count > 0');
    assert.ok(summary.templateCount > 0, 'Template count > 0');
    assert.strictEqual(summary.byCategory['15. Clinical & High-Intensity Transition Documents'], 10);
  });

  await t.test('Document Register API route is implemented and requires admin auth', () => {
    const route = readProjectFile('app/api/governance/document-register/route.ts');
    assert.ok(route.includes('getMasterDocumentSummary'), 'API route calls getMasterDocumentSummary');
    assert.ok(route.includes('MASTER_DOCUMENT_REGISTER'), 'API route references MASTER_DOCUMENT_REGISTER');
    assert.ok(route.includes('isAuthenticatedAdmin'), 'API route checks admin authentication');
    assert.ok(route.includes('401'), 'API route rejects unauthenticated requests with 401');
  });

  await t.test('Admin page imports and renders MasterDocumentRegisterPanel', () => {
    const adminPage = readProjectFile('app/admin/page.tsx');
    assert.ok(adminPage.includes('MasterDocumentRegisterPanel'), 'Admin page imports MasterDocumentRegisterPanel');
    assert.ok(adminPage.includes('<MasterDocumentRegisterPanel />'), 'Admin page renders MasterDocumentRegisterPanel');
  });

  await t.test('Evidence-backed status audit: incomplete items are marked PARTIAL and not falsely READY', () => {
    const partialCodes = ['DOC-WRK-02', 'DOC-FIN-03', 'DOC-REG-03', 'DOC-AUD-02', 'DOC-AUD-04'];
    for (const code of partialCodes) {
      const doc = MASTER_DOCUMENT_REGISTER.find((d) => d.code === code);
      assert.ok(doc, `Doc ${code} must exist in register`);
      assert.strictEqual(doc.status, 'PARTIAL', `Doc ${code} must be marked PARTIAL as verified`);
      assert.ok(doc.notes && doc.notes.length > 10, `Doc ${code} must explain status in notes`);
    }
  });

  await t.test('Payroll export route enforces Australia/Sydney timezone and effective-dated vehicle allowances', () => {
    const exportRoute = readProjectFile('app/api/workforce/payroll/export/route.ts');
    assert.ok(exportRoute.includes('Australia/Sydney'), 'Export must use Australia/Sydney IANA timezone');
    assert.ok(exportRoute.includes('getEffectiveVehicleRate'), 'Export must compute effective-dated vehicle rate');
    assert.ok(exportRoute.includes('VehicleRatePerKm'), 'Export must output VehicleRatePerKm');
    assert.ok(exportRoute.includes('VehicleReimbursementAmount'), 'Export must output VehicleReimbursementAmount');
    assert.ok(exportRoute.includes('Approved Payroll Input Export'), 'Export must be labelled Approved Payroll Input Export');
  });

  await t.test('Superannuation default rate is set to 12.00% across system', () => {
    const agreementModal = readProjectFile('components/admin/AgreementGeneratorModal.tsx');
    assert.ok(agreementModal.includes('12.00'), 'AgreementGeneratorModal default super rate must be 12.00%');
    assert.ok(!agreementModal.includes('11.50'), 'AgreementGeneratorModal must not contain legacy 11.50%');
  });
});
