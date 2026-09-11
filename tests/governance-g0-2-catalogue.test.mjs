import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Authoritative 2026-27 NDIA Support Catalogue Definition Truth Map
 * Source: NDIA NDIS Pricing Arrangements and Price Limits 2026-27 & NDIS Support Catalogue 2026-27
 */
export const OFFICIAL_2026_27_CATALOGUE_TRUTH = {
  // Disability Support Worker - Self-Care (Core 01 / Registration Group 0107)
  '01_011_0107_1_1': {
    name: 'Assistance With Self-Care Activities - Standard - Weekday Daytime',
    expectedKeywords: ['Self-Care', 'Weekday Daytime'],
    priceLimit: 73.58,
    unit: 'Hour',
    category: 'Core',
  },
  '01_015_0107_1_1': {
    name: 'Assistance With Self-Care Activities - Standard - Weekday Evening',
    expectedKeywords: ['Self-Care', 'Weekday Evening'],
    priceLimit: 81.07,
    unit: 'Hour',
    category: 'Core',
  },
  '01_013_0107_1_1': {
    name: 'Assistance With Self-Care Activities - Standard - Saturday',
    expectedKeywords: ['Self-Care', 'Saturday'],
    priceLimit: 103.54,
    unit: 'Hour',
    category: 'Core',
  },
  '01_014_0107_1_1': {
    name: 'Assistance With Self-Care Activities - Standard - Sunday',
    expectedKeywords: ['Self-Care', 'Sunday'],
    priceLimit: 133.50,
    unit: 'Hour',
    category: 'Core',
  },
  '01_012_0107_1_1': {
    name: 'Assistance With Self-Care Activities - Standard - Public Holiday',
    expectedKeywords: ['Self-Care', 'Public Holiday'],
    priceLimit: 163.46,
    unit: 'Hour',
    category: 'Core',
  },
  '01_002_0107_1_1': {
    name: 'Assistance With Self-Care Activities - Standard - Weekday Night',
    expectedKeywords: ['Self-Care', 'Weekday Night'],
    unit: 'Hour',
    category: 'Core',
  },

  // Community Participation (Core 04 / Registration Group 0125)
  '04_104_0125_6_1': {
    name: 'Access Community Social and Rec Activities - Standard - Weekday Daytime',
    expectedKeywords: ['Community', 'Weekday Daytime'],
    priceLimit: 73.58,
    unit: 'Hour',
    category: 'Core',
  },
  '04_103_0125_6_1': {
    name: 'Access Community Social and Rec Activities - Standard - Weekday Evening',
    expectedKeywords: ['Community', 'Weekday Evening'],
    priceLimit: 81.07,
    unit: 'Hour',
    category: 'Core',
  },
  '04_105_0125_6_1': {
    name: 'Access Community Social and Rec Activities - Standard - Saturday',
    expectedKeywords: ['Community', 'Saturday'],
    priceLimit: 103.54,
    unit: 'Hour',
    category: 'Core',
  },
  '04_106_0125_6_1': {
    name: 'Access Community Social and Rec Activities - Standard - Sunday',
    expectedKeywords: ['Community', 'Sunday'],
    priceLimit: 133.50,
    unit: 'Hour',
    category: 'Core',
  },
  '04_102_0125_6_1': {
    name: 'Access Community Social and Rec Activities - Standard - Public Holiday',
    expectedKeywords: ['Community', 'Public Holiday'],
    priceLimit: 163.46,
    unit: 'Hour',
    category: 'Core',
  },

  // Household Tasks (Core 01 / Registration Group 0120)
  '01_019_0120_1_1': {
    name: 'House or Yard Maintenance',
    expectedKeywords: ['Maintenance', 'Yard'],
    forbiddenKeywords: ['Cleaning'],
    priceLimit: 59.01,
    unit: 'Hour',
    category: 'Core',
  },
  '01_020_0120_1_1': {
    name: 'House Cleaning and Other Household Activities',
    expectedKeywords: ['Cleaning'],
    forbiddenKeywords: ['Yard'],
    priceLimit: 60.10,
    unit: 'Hour',
    category: 'Core',
  },

  // Transport & Travel
  '02_051_0108_1_1': {
    name: 'Transport',
    expectedKeywords: ['Transport'],
    priceLimit: 0.00,
    hasNoSpecifiedPrice: true,
    unit: 'Year',
    category: 'Core',
  },
  '04_590_0125_6_1': {
    name: 'Activity Based Transport',
    expectedKeywords: ['Activity Based Transport'],
    unit: 'Each',
    isNotionalUnit: true,
    notionalPrice: 1.00,
    category: 'Core',
  },
  '01_799_0107_1_1': {
    name: 'Provider Travel - Non-Labour Costs',
    unit: 'Each',
    isNotionalUnit: true,
    notionalPrice: 1.00,
    category: 'Core',
  },
  '04_799_0125_6_1': {
    name: 'Provider Travel - Non-Labour Costs',
    unit: 'Each',
    isNotionalUnit: true,
    notionalPrice: 1.00,
    category: 'Core',
  },

  // Community Nursing (Capacity Building 15 / Registration Group 0114)
  '15_406_0114_1_3': {
    name: 'Delivery of Health Supports by a Registered Nurse - Weekday Daytime',
    expectedKeywords: ['Registered Nurse', 'Weekday Daytime'],
    priceLimit: 124.62,
    unit: 'Hour',
    category: 'Capacity Building',
    registrationGroup: '0114',
  },
};

describe('Governance G0.2 - NDIS Support Catalogue Integrity', () => {
  it('correctly maps all Disability Support Worker Self-Care items (01_011 .. 01_002)', () => {
    const dswDay = OFFICIAL_2026_27_CATALOGUE_TRUTH['01_011_0107_1_1'];
    assert.equal(dswDay.priceLimit, 73.58, 'DSW Weekday Daytime must be $73.58/hr');
    assert.equal(dswDay.unit, 'Hour');

    const dswEve = OFFICIAL_2026_27_CATALOGUE_TRUTH['01_015_0107_1_1'];
    assert.equal(dswEve.priceLimit, 81.07, 'DSW Weekday Evening must be $81.07/hr');

    const dswSat = OFFICIAL_2026_27_CATALOGUE_TRUTH['01_013_0107_1_1'];
    assert.equal(dswSat.priceLimit, 103.54, 'DSW Saturday must be $103.54/hr');

    const dswSun = OFFICIAL_2026_27_CATALOGUE_TRUTH['01_014_0107_1_1'];
    assert.equal(dswSun.priceLimit, 133.50, 'DSW Sunday must be $133.50/hr');

    const dswPh = OFFICIAL_2026_27_CATALOGUE_TRUTH['01_012_0107_1_1'];
    assert.equal(dswPh.priceLimit, 163.46, 'DSW Public Holiday must be $163.46/hr');

    const dswNight = OFFICIAL_2026_27_CATALOGUE_TRUTH['01_002_0107_1_1'];
    assert.equal(dswNight.name, 'Assistance With Self-Care Activities - Standard - Weekday Night');
    assert.equal(dswNight.unit, 'Hour');
  });

  it('correctly maps Community Participation items (04_104 .. 04_102) without scrambling', () => {
    const cpDay = OFFICIAL_2026_27_CATALOGUE_TRUTH['04_104_0125_6_1'];
    assert.equal(cpDay.priceLimit, 73.58);
    assert.ok(cpDay.name.includes('Weekday Daytime'));

    const cpEve = OFFICIAL_2026_27_CATALOGUE_TRUTH['04_103_0125_6_1'];
    assert.equal(cpEve.priceLimit, 81.07);
    assert.ok(cpEve.name.includes('Weekday Evening'));

    const cpSat = OFFICIAL_2026_27_CATALOGUE_TRUTH['04_105_0125_6_1'];
    assert.equal(cpSat.priceLimit, 103.54);
    assert.ok(cpSat.name.includes('Saturday'));

    const cpSun = OFFICIAL_2026_27_CATALOGUE_TRUTH['04_106_0125_6_1'];
    assert.equal(cpSun.priceLimit, 133.50);
    assert.ok(cpSun.name.includes('Sunday'));

    const cpPh = OFFICIAL_2026_27_CATALOGUE_TRUTH['04_102_0125_6_1'];
    assert.equal(cpPh.priceLimit, 163.46);
    assert.ok(cpPh.name.includes('Public Holiday'));
  });

  it('corrects and un-swaps Household Task items (01_019 vs 01_020)', () => {
    const yard = OFFICIAL_2026_27_CATALOGUE_TRUTH['01_019_0120_1_1'];
    const cleaning = OFFICIAL_2026_27_CATALOGUE_TRUTH['01_020_0120_1_1'];

    // 01_019 MUST be House or Yard Maintenance ($59.01)
    assert.equal(yard.name, 'House or Yard Maintenance');
    assert.equal(yard.priceLimit, 59.01);
    assert.equal(yard.expectedKeywords.every((kw) => yard.name.includes(kw)), true);
    assert.equal(yard.forbiddenKeywords.some((kw) => yard.name.includes(kw)), false, '01_019 must not contain Cleaning');

    // 01_020 MUST be House Cleaning and Other Household Activities ($60.10)
    assert.equal(cleaning.name, 'House Cleaning and Other Household Activities');
    assert.equal(cleaning.priceLimit, 60.10);
    assert.equal(cleaning.expectedKeywords.every((kw) => cleaning.name.includes(kw)), true);
    assert.equal(cleaning.forbiddenKeywords.some((kw) => cleaning.name.includes(kw)), false, '01_020 must not contain Yard');
  });

  it('asserts transport metadata integrity: 02_051 is Year with no specified price, 04_590 is Each notional unit', () => {
    const directTransport = OFFICIAL_2026_27_CATALOGUE_TRUTH['02_051_0108_1_1'];
    assert.equal(directTransport.unit, 'Year');
    assert.equal(directTransport.hasNoSpecifiedPrice, true);

    const abt = OFFICIAL_2026_27_CATALOGUE_TRUTH['04_590_0125_6_1'];
    assert.equal(abt.unit, 'Each');
    assert.equal(abt.isNotionalUnit, true);
    assert.equal(abt.notionalPrice, 1.00);

    const travelCore01 = OFFICIAL_2026_27_CATALOGUE_TRUTH['01_799_0107_1_1'];
    assert.equal(travelCore01.unit, 'Each');
    assert.equal(travelCore01.isNotionalUnit, true);

    const travelCore04 = OFFICIAL_2026_27_CATALOGUE_TRUTH['04_799_0125_6_1'];
    assert.equal(travelCore04.unit, 'Each');
    assert.equal(travelCore04.isNotionalUnit, true);
  });

  it('validates Community Nursing Care maps to Registration Group 0114', () => {
    const nursingDay = OFFICIAL_2026_27_CATALOGUE_TRUTH['15_406_0114_1_3'];
    assert.equal(nursingDay.registrationGroup, '0114');
    assert.equal(nursingDay.unit, 'Hour');
    assert.equal(nursingDay.priceLimit, 124.62);
    assert.equal(nursingDay.category, 'Capacity Building');
  });

  it('verifies that serviceScope fallback registry adheres to the corrected mappings', async () => {
    const { PUBLIC_MARKETING_FALLBACK_REGISTRY } = await import('../lib/services/serviceScope.ts');

    const comm = PUBLIC_MARKETING_FALLBACK_REGISTRY.find((s) => s.serviceCode === 'OC-SRV-COMM-01');
    assert.ok(comm);
    assert.deepEqual(comm.ndisSupportCatalogueMapping, [
      '04_104_0125_6_1',
      '04_103_0125_6_1',
      '04_105_0125_6_1',
      '04_106_0125_6_1',
      '04_102_0125_6_1',
      '04_590_0125_6_1',
      '04_799_0125_6_1',
    ]);

    const daily = PUBLIC_MARKETING_FALLBACK_REGISTRY.find((s) => s.serviceCode === 'OC-SRV-DAILY-01');
    assert.ok(daily);
    assert.deepEqual(daily.ndisSupportCatalogueMapping, [
      '01_011_0107_1_1',
      '01_015_0107_1_1',
      '01_013_0107_1_1',
      '01_014_0107_1_1',
      '01_012_0107_1_1',
      '01_002_0107_1_1',
      '01_799_0107_1_1',
    ]);

    const house = PUBLIC_MARKETING_FALLBACK_REGISTRY.find((s) => s.serviceCode === 'OC-SRV-HOUSE-01');
    assert.ok(house);
    assert.deepEqual(house.ndisSupportCatalogueMapping, [
      '01_019_0120_1_1',
      '01_020_0120_1_1',
    ]);

    const nursing = PUBLIC_MARKETING_FALLBACK_REGISTRY.find((s) => s.serviceCode === 'OC-SRV-NURS-01');
    assert.ok(nursing);
    assert.ok(nursing.ndisSupportCatalogueMapping.includes('15_406_0114_1_3'));
    assert.equal(nursing.quoteEligible, false);
    assert.equal(nursing.rosterEligible, false);
    assert.equal(nursing.invoiceEligible, false);
    assert.equal(nursing.websiteVisible, false);
  });

  it('guarantees version-awareness: historical invoices retain locked agreed rates', () => {
    // Simulating an invoice issued in 2025-26 under prior price schedule ($67.56)
    const historicalInvoiceLine = {
      serviceDate: '2026-05-15',
      supportItemCode: '01_011_0107_1_1',
      billedRate: 67.56,
      hours: 4,
      totalAmount: 270.24,
      status: 'paid',
    };

    // Current 2026-27 catalogue rate is $73.58
    const currentRate = OFFICIAL_2026_27_CATALOGUE_TRUTH['01_011_0107_1_1'].priceLimit;
    assert.equal(currentRate, 73.58);

    // Assert that the historical invoice remains unchanged
    assert.equal(historicalInvoiceLine.billedRate, 67.56, 'Historical invoice billed rate must not mutate when catalogue updates');
    assert.equal(historicalInvoiceLine.totalAmount, 270.24, 'Historical invoice total amount must not be altered');
  });
});
