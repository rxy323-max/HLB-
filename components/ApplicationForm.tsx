'use client';

import { useState } from 'react';

type AppType = 'Individual' | 'Non-Individual';

const ID_TYPES_G1 = [
  { value: 'MyKad', label: 'MyKad (Blue)' },
  { value: 'MyPR', label: 'MyPR (Red)' },
  { value: 'MyKas', label: 'MyKas (Green)' },
  { value: 'MyKadBrown', label: 'MyKad (Brown)' },
  { value: 'Passport', label: 'Passport' },
];

const ID_TYPES_G2 = [
  { value: 'OldID', label: 'Old ID' },
  { value: 'DrivingLicence', label: 'Driving Licence' },
  { value: 'MyPolis', label: 'MyPolis (Police ID)' },
  { value: 'MyTentera', label: 'MyTentera (Military ID)' },
];

// Rule 1: infer birth year from first 2 digits of NRIC
function inferBirthYear(yy: string): { birthYear: number; needsOldIC: boolean } | null {
  if (yy.length < 2) return null;
  const inputYY = parseInt(yy.slice(0, 2), 10);
  const currentYY = new Date().getFullYear() % 100; // 26 for 2026
  const birthYear = inputYY > currentYY ? 1900 + inputYY : 2000 + inputYY;
  return { birthYear, needsOldIC: birthYear < 1978 };
}

// Format 12-digit raw digits to YYMMDD-PB-#### on blur
function formatMyKad(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 12);
  if (d.length <= 6) return d;
  if (d.length <= 8) return `${d.slice(0, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
}

const MYKAD_FAMILY = ['MyKad', 'MyPR', 'MyKas', 'MyKadBrown'];

// ── Vehicle mock library (4.11) ───────────────────────────────
const VEHICLE_MAKES = ['Perodua', 'Proton', 'Toyota', 'Honda', 'BMW'];

const VEHICLE_FAMILIES: Record<string, string[]> = {
  Perodua: ['Myvi', 'Axia', 'Bezza', 'Alza'],
  Proton:  ['Saga', 'X50', 'X70', 'S70'],
  Toyota:  ['Vios', 'Corolla Cross', 'Camry', 'Hilux'],
  Honda:   ['City', 'Civic', 'HR-V', 'Accord'],
  BMW:     ['3 Series', '5 Series', 'X3'],
};

type VehicleModel = {
  model: string; msrp: number; marketValue?: number;
  engineType: string; bnmPurpose: string;
  green: boolean; gpRating: string; greenlane: boolean;
};

const VEHICLE_MODELS: Record<string, Record<string, VehicleModel[]>> = {
  'Perodua-Myvi': {
    '2025': [
      { model: '1.5 AV CVT', msrp: 61990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
      { model: '1.3 H CVT',  msrp: 55990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'B', greenlane: false },
    ],
    '2024': [
      { model: '1.5 AV CVT', msrp: 59990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
      { model: '1.3 H CVT',  msrp: 53990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'B', greenlane: false },
    ],
    '2023': [
      { model: '1.5 AV CVT', msrp: 58990, marketValue: 51000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
      { model: '1.3 H CVT',  msrp: 52990, marketValue: 44000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'B', greenlane: false },
      { model: '1.3 G CVT',  msrp: 49990, marketValue: 41000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'C', greenlane: false },
    ],
    '2022': [
      { model: '1.5 AV CVT', msrp: 55990, marketValue: 46000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: false },
    ],
  },
  'Perodua-Axia': {
    '2025': [
      { model: 'E (M)',       msrp: 40990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'B', greenlane: false },
      { model: 'G (A)',       msrp: 46990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'B', greenlane: false },
    ],
    '2024': [
      { model: 'E (M)',       msrp: 39990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'B', greenlane: false },
      { model: 'G (A)',       msrp: 45990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'B', greenlane: false },
    ],
    '2023': [
      { model: 'E (M)',       msrp: 38990, marketValue: 33000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true, gpRating: 'B', greenlane: false },
    ],
  },
  'Perodua-Bezza': {
    '2025': [
      { model: '1.0 G (A)',   msrp: 46990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'B', greenlane: false },
      { model: '1.3 AV (A)',  msrp: 59990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
    ],
    '2024': [
      { model: '1.0 G (A)',   msrp: 45490, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'B', greenlane: false },
      { model: '1.3 AV (A)',  msrp: 58490, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
    ],
    '2023': [
      { model: '1.3 AV (A)',  msrp: 57990, marketValue: 49000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true, gpRating: 'A', greenlane: false },
    ],
  },
  'Perodua-Alza': {
    '2025': [
      { model: '1.5 AV H (A)', msrp: 75990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
      { model: '1.5 X (A)',    msrp: 68990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'B', greenlane: false },
    ],
    '2024': [
      { model: '1.5 AV H (A)', msrp: 74990, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
      { model: '1.5 X (A)',    msrp: 67490, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true,  gpRating: 'B', greenlane: false },
    ],
    '2023': [
      { model: '1.5 AV H (A)', msrp: 73990, marketValue: 63000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: true, gpRating: 'A', greenlane: false },
    ],
  },
  'Proton-Saga': {
    '2025': [
      { model: '1.3 Standard MT', msrp: 44800, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'C', greenlane: false },
      { model: '1.3 Premium AT',  msrp: 50800, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
    '2024': [
      { model: '1.3 Standard MT', msrp: 43800, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'C', greenlane: false },
      { model: '1.3 Premium AT',  msrp: 49800, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
    '2023': [
      { model: '1.3 Premium AT',  msrp: 48300, marketValue: 40000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
  },
  'Proton-X50': {
    '2025': [
      { model: '1.5T Standard CVT', msrp: 79200, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5T Premium CVT',  msrp: 89200, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
    ],
    '2024': [
      { model: '1.5T Standard CVT', msrp: 77700, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5T Premium CVT',  msrp: 87700, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
    ],
    '2023': [
      { model: '1.5T Standard CVT', msrp: 79200, marketValue: 67000, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
  },
  'Proton-X70': {
    '2025': [
      { model: '1.8T Standard 2WD', msrp: 112800, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.8T Premium AWD',  msrp: 142800, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
    ],
    '2024': [
      { model: '1.8T Standard 2WD', msrp: 109800, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
    '2023': [
      { model: '1.8T Standard 2WD', msrp: 108800, marketValue: 92000, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
  },
  'Proton-S70': {
    '2025': [
      { model: '1.5T Executive CVT', msrp: 74800, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5T Premium CVT',   msrp: 84800, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
    ],
    '2024': [
      { model: '1.5T Executive CVT', msrp: 73800, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
  },
  'Toyota-Vios': {
    '2025': [
      { model: '1.5 G CVT', msrp: 91980, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5 E CVT', msrp: 86980, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'C', greenlane: false },
    ],
    '2024': [
      { model: '1.5 G CVT', msrp: 89980, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5 E CVT', msrp: 84980, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'C', greenlane: false },
    ],
    '2023': [
      { model: '1.5 G CVT', msrp: 88980, marketValue: 79000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5 E CVT', msrp: 83980, marketValue: 73000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'C', greenlane: false },
    ],
  },
  'Toyota-Corolla Cross': {
    '2025': [
      { model: '1.8V CVT',   msrp: 143880, engineType: 'Hybrid', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
      { model: '1.8G CVT',   msrp: 129880, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
    '2024': [
      { model: '1.8V CVT',   msrp: 140880, engineType: 'Hybrid', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
      { model: '1.8G CVT',   msrp: 127880, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
    '2023': [
      { model: '1.8V CVT',   msrp: 137880, marketValue: 120000, engineType: 'Hybrid', bnmPurpose: 'Personal Use', green: true, gpRating: 'A', greenlane: false },
    ],
  },
  'Toyota-Camry': {
    '2025': [
      { model: '2.5V Hybrid', msrp: 239880, engineType: 'Hybrid', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
    ],
    '2024': [
      { model: '2.5V Hybrid', msrp: 236880, engineType: 'Hybrid', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
    ],
    '2023': [
      { model: '2.5V Hybrid', msrp: 231880, marketValue: 200000, engineType: 'Hybrid', bnmPurpose: 'Personal Use', green: true, gpRating: 'A', greenlane: false },
    ],
  },
  'Honda-City': {
    '2025': [
      { model: '1.5 V Sensing CVT', msrp: 115900, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5 S CVT',         msrp: 101900, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'C', greenlane: false },
    ],
    '2024': [
      { model: '1.5 V Sensing CVT', msrp: 111900, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5 S CVT',         msrp:  99900, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'C', greenlane: false },
    ],
    '2023': [
      { model: '1.5 V Sensing CVT', msrp: 110900, marketValue: 98000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
  },
  'Honda-Civic': {
    '2025': [
      { model: '1.5TC Premium CVT', msrp: 168900, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
      { model: '1.5TC Standard CVT',msrp: 155900, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
    '2024': [
      { model: '1.5TC Premium CVT', msrp: 165900, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
    ],
    '2023': [
      { model: '1.5TC Premium CVT', msrp: 162900, marketValue: 145000, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: false },
    ],
  },
  'Honda-HR-V': {
    '2025': [
      { model: '1.5TC V CVT',  msrp: 126800, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5TC RS CVT', msrp: 141800, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: false },
    ],
    '2024': [
      { model: '1.5TC V CVT',  msrp: 123800, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
    '2023': [
      { model: '1.5TC V CVT',  msrp: 121800, marketValue: 105000, engineType: 'Petrol Turbo', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
  },
  'BMW-3 Series': {
    '2025': [
      { model: '320i Sport',       msrp: 270380, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
      { model: '330e M Sport',     msrp: 325380, engineType: 'Hybrid', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
    ],
    '2024': [
      { model: '320i Sport',       msrp: 264380, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
      { model: '330e M Sport',     msrp: 318380, engineType: 'Hybrid', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
    ],
    '2023': [
      { model: '320i Sport',       msrp: 258380, marketValue: 225000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
    ],
  },
  'BMW-5 Series': {
    '2025': [
      { model: '520i M Sport',     msrp: 388380, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
      { model: '530e M Sport',     msrp: 428380, engineType: 'Hybrid', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true  },
    ],
    '2024': [
      { model: '520i M Sport',     msrp: 378380, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
    ],
    '2023': [
      { model: '520i M Sport',     msrp: 368380, marketValue: 320000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: false },
    ],
  },
  'BMW-X3': {
    '2025': [
      { model: 'xDrive30i M Sport',msrp: 418380, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
    ],
    '2024': [
      { model: 'xDrive30i M Sport',msrp: 408380, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true  },
    ],
    '2023': [
      { model: 'xDrive30i M Sport',msrp: 395380, marketValue: 350000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: false },
    ],
  },
};

// ── Loan Program mock data (4.12) ─────────────────────────────
type ProductCode = {
  code: string; label: string;
  rateType: 'Fixed' | 'Variable';
  calcMode: 'Sum of Digit' | 'Reducing Balance';
  hpPlus: boolean;
  base?: string; // only for variable rate
};

const PRODUCT_CODES: ProductCode[] = [
  { code: 'F110', label: 'F110 – HP Direct, Used Vehicle',          rateType: 'Fixed',    calcMode: 'Sum of Digit',      hpPlus: false },
  { code: 'F120', label: 'F120 – HP Direct, New Vehicle (HP+Plus)', rateType: 'Fixed',    calcMode: 'Sum of Digit',      hpPlus: true  },
  { code: 'I110', label: 'I110 – IHP Direct, Used (Islamic)',       rateType: 'Fixed',    calcMode: 'Reducing Balance',  hpPlus: false },
  { code: 'V210', label: 'V210 – HP Variable Rate, New Vehicle',    rateType: 'Variable', calcMode: 'Reducing Balance',  hpPlus: false, base: 'BLR 6.85%' },
];

const PACKAGE_CODES: Record<string, { code: string; label: string }[]> = {
  F110: [
    { code: 'PKG-111', label: 'PKG-111 – Standard Monthly' },
    { code: 'PKG-112', label: 'PKG-112 – Flexi Monthly' },
  ],
  F120: [{ code: 'PKG-121', label: 'PKG-121 – New Car Standard' }],
  I110: [{ code: 'PKG-I11', label: 'PKG-I11 – Islamic Standard' }],
  V210: [{ code: 'PKG-V21', label: 'PKG-V21 – Variable Monthly' }],
};

const CAMPAIGNS = [
  { code: 'CAMP-2025A', label: 'Year-End Promo 2025',       minEIR: 2.80, maxEIR: 3.50, fixed: false },
  { code: 'CAMP-GREEN', label: 'Green Vehicle Incentive',   minEIR: 2.50, maxEIR: 3.00, fixed: false },
  { code: 'CAMP-D01',   label: 'Dealer Incentive Q2 2025',  minEIR: 3.00, maxEIR: 4.00, fixed: false },
];

const HP_PLUS_FEES = [
  { name: 'Maintenance Fee', frequency: 'Monthly',  amount: 30 },
  { name: 'Processing Fee',  frequency: 'One-time', amount: 200 },
  { name: 'Setup Fee',       frequency: 'One-time', amount: 100 },
];

// ── Entity Type field rules ───────────────────────────────────
type EntityCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'L';
const ENTITY_FIELD_RULES: Record<EntityCode, {
  showBoardCategory: boolean;
  showBNMPass: boolean;
  showOffshore: boolean;
  ownerRequired: boolean;
  placeOfRegRequired: boolean;
}> = {
  A: { showBoardCategory: false, showBNMPass: false, showOffshore: false, ownerRequired: false, placeOfRegRequired: false },
  B: { showBoardCategory: true,  showBNMPass: false, showOffshore: false, ownerRequired: false, placeOfRegRequired: false },
  C: { showBoardCategory: false, showBNMPass: false, showOffshore: true,  ownerRequired: false, placeOfRegRequired: false },
  D: { showBoardCategory: false, showBNMPass: false, showOffshore: false, ownerRequired: true,  placeOfRegRequired: true  },
  E: { showBoardCategory: false, showBNMPass: true,  showOffshore: false, ownerRequired: true,  placeOfRegRequired: false },
  F: { showBoardCategory: false, showBNMPass: true,  showOffshore: false, ownerRequired: true,  placeOfRegRequired: false },
  G: { showBoardCategory: false, showBNMPass: true,  showOffshore: true,  ownerRequired: false, placeOfRegRequired: false },
  H: { showBoardCategory: false, showBNMPass: true,  showOffshore: false, ownerRequired: true,  placeOfRegRequired: false },
  L: { showBoardCategory: false, showBNMPass: false, showOffshore: false, ownerRequired: false, placeOfRegRequired: false },
};

type GuarantorRequirement = 'PG' | 'CG' | 'PG_or_CG' | 'none';
type EntityGuarantorRule = {
  guarantorType: GuarantorRequirement;
  mandatory: boolean;
  waivable: boolean;         // true = waivable by credit discretion
  allPartnersMustSign: boolean;
  guarantorDesc: string;
  signingEntity: string;
  signatories: string;
  defaultRoleCode: string;   // default role code when adding guarantor from this entity
  notes?: string;
};
const ENTITY_GUARANTOR_RULES: Record<EntityCode, EntityGuarantorRule> = {
  A: {
    guarantorType: 'PG', mandatory: true, waivable: false, allPartnersMustSign: false,
    guarantorDesc: '1–2 名董事个人担保 (Personal Guarantee)',
    signingEntity: '公司 (Company)',
    signatories: '董事会决议 (BR) 授权董事',
    defaultRoleCode: 'DG',
  },
  B: {
    guarantorType: 'PG', mandatory: false, waivable: true, allPartnersMustSign: false,
    guarantorDesc: '上市公司通常豁免 PG；小型 Bhd 仍需董事个人担保',
    signingEntity: '公司 (Company)',
    signatories: '董事会决议 (BR) 授权高管',
    defaultRoleCode: 'DG',
    notes: '豁免须信贷评估明确确认，写入备注。',
  },
  C: {
    guarantorType: 'CG', mandatory: true, waivable: false, allPartnersMustSign: false,
    guarantorDesc: '必须由海外母公司提供企业担保 (Corporate Guarantee)',
    signingEntity: '分行（代表母公司）',
    signatories: '本地授权代表',
    defaultRoleCode: 'CG',
    notes: '非独立法人；海外母公司承担无限责任兜底。',
  },
  D: {
    guarantorType: 'none', mandatory: false, waivable: false, allPartnersMustSign: false,
    guarantorDesc: '无需担保人 — 老板个人已承担无限责任',
    signingEntity: '老板个人',
    signatories: '老板本人',
    defaultRoleCode: 'SP',
    notes: '签约主体为自然人，无须 BR 董事会决议。',
  },
  E: {
    guarantorType: 'none', mandatory: false, waivable: false, allPartnersMustSign: true,
    guarantorDesc: '无需额外担保人 — 全体合伙人连带无限责任',
    signingEntity: '合伙企业',
    signatories: '⚠ 全体合伙人必须共同签署',
    defaultRoleCode: 'PP',
    notes: '任何单一合伙人签字不足以构成有效授权，缺一不可。',
  },
  F: {
    guarantorType: 'PG', mandatory: true, waivable: false, allPartnersMustSign: false,
    guarantorDesc: '强制要求核心合伙人个人担保 (PG)',
    signingEntity: 'PLT 企业',
    signatories: '合规官 (Compliance Officer) 或授权合伙人',
    defaultRoleCode: 'GU',
    notes: '须确认合规官身份有效；合规官是 PLT 法定必要职位。',
  },
  G: {
    guarantorType: 'PG_or_CG', mandatory: true, waivable: false, allPartnersMustSign: false,
    guarantorDesc: '海外合伙人 PG 或海外母体 CG（二选一）',
    signingEntity: '外国 PLT 本地分支',
    signatories: '授权本地代表',
    defaultRoleCode: 'CG',
    notes: '需提供跨国担保文件，须经总行法律审查。',
  },
  H: {
    guarantorType: 'PG', mandatory: true, waivable: false, allPartnersMustSign: false,
    guarantorDesc: '核心专业合伙人个人担保 (PG) — 须为持有效执照专业人士',
    signingEntity: '专业 PLT 实体',
    signatories: '授权执业合伙人',
    defaultRoleCode: 'GU',
    notes: '⛔ 执业证过期 → 一票否决，拒绝进件。',
  },
  L: {
    guarantorType: 'none', mandatory: false, waivable: false, allPartnersMustSign: false,
    guarantorDesc: '无需担保人 — 同独资企业，老板个人无限责任',
    signingEntity: '老板个人',
    signatories: '老板本人',
    defaultRoleCode: 'SP',
    notes: '东马 Trading License 管辖，非 SSM；人工核查执照有效期。',
  },
};

// Auto-mapping: Enterprise Type → Basic Group code
const ENTITY_TO_BASIC_GROUP: Partial<Record<EntityCode, string>> = {
  A: '24.0', B: '24.0', C: '24.0', // Companies
  D: '21.0', L: '21.0',            // Sole Proprietors
  E: '22.0',                        // Partnerships
  F: '26.0', G: '26.0', H: '26.0', // LLP
};

// Auto-mapping: Enterprise Type → Constitution code
const ENTITY_TO_CONSTITUTION: Partial<Record<EntityCode, string>> = {
  A: 'R', // Sdn Bhd / Private Ltd
  B: 'U', // Bhd / Public Ltd Co
  C: 'O', // Others (Branch)
  D: 'S', // Sole Proprietor
  E: 'P', // Partnership
  F: 'O', // Others (PLT)
  G: 'O', H: 'O',
  L: 'S',
};

const BASIC_GROUP_OPTIONS = [
  { value: '11.0', label: '11.0 – Individual' },
  { value: '21.0', label: '21.0 – Sole Proprietors' },
  { value: '22.0', label: '22.0 – Partnerships' },
  { value: '23.0', label: '23.0 – Professional Bodies' },
  { value: '24.0', label: '24.0 – Companies' },
  { value: '26.0', label: '26.0 – Limited Liability Partnership' },
  { value: '31.0', label: '31.0 – Federal/Central Government' },
  { value: '32.0', label: '32.0 – State Government' },
  { value: '33.0', label: '33.0 – Local Government' },
  { value: '34.0', label: '34.0 – Statutory Bodies' },
  { value: '35.0', label: '35.0 – Monetary Authority' },
  { value: '41.0', label: '41.0 – Trade Union' },
  { value: '42.0', label: '42.0 – Co-Operatives' },
  { value: '43.0', label: '43.0 – Societies/Associations' },
  { value: '91.0', label: '91.0 – Others' },
];

const CONSTITUTION_OPTIONS = [
  { value: 'S', label: 'S – Sole Proprietor' },
  { value: 'R', label: 'R – Sdn Bhd / Private Ltd' },
  { value: 'U', label: 'U – Bhd / Public Ltd Co' },
  { value: 'P', label: 'P – Partnership' },
  { value: 'O', label: 'O – Others' },
  { value: 'A', label: 'A – Assoc / School / Society' },
  { value: 'B', label: 'B – Statutory Body' },
  { value: 'C', label: 'C – Cooperative' },
  { value: 'G', label: 'G – Government Body' },
  { value: 'I', label: 'I – Individual' },
];

const MALAYSIA_STATES = [
  'Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang',
  'Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor',
  'Terengganu',
  'W.P. Kuala Lumpur','W.P. Labuan','W.P. Putrajaya',
];

const TURNOVER_RANGES = [
  'Less than RM300k',
  'RM300k to less than RM1M',
  'RM1M to less than RM3M',
  'RM3M to less than RM5M',
  'RM5M to less than RM10M',
  'RM10M to less than RM20M',
  'RM20M to less than RM50M',
  'RM50M and above',
];

const EMPLOYEE_RANGES = [
  '1 to 4',
  '5 to 29',
  '30 to 74',
  '75 to 149',
  '150 to 199',
  '200 to 499',
  '500 and above',
];

const PLACE_OF_REG_OPTIONS = [
  { value: '1', label: '1 – Business Registration for Professional' },
  { value: '2', label: '2 – Foreign Business' },
  { value: '3', label: '3 – Registered Outside KL' },
  { value: '4', label: '4 – Registered in KL / Labuan' },
  { value: '5', label: '5 – Registered in Sabah / Sarawak' },
];

const KL_LABUAN_STATES = [
  { value: '14', label: '14 – W.P. Kuala Lumpur' },
  { value: '15', label: '15 – W.P. Labuan' },
];

const SOURCE_OF_REPAYMENT_OPTIONS = [
  'Business Income','Rental Income','Investment Returns','Contract Revenue','Export Proceeds','Other',
];

const PRIMARY_INCOME_DOC_OPTIONS = [
  'Audited Accounts','Management Accounts','Bank Statement (6 months)','Tax Return (Form B/BE)','Contract/Invoice','Other',
];

const DESIGNATION_OPTIONS = [
  'Director','Managing Director','CEO','Executive Director','Non-Executive Director',
  'Company Secretary','Compliance Officer','Partner','Sole Proprietor','Trustee','Shareholder','Other',
];

// ── Relationship / Role code system ──────────────────────────
type RelToApp = 'Guarantor' | 'Owner' | 'Non-Guarantor';
const ROLE_CODES_BY_REL: Record<RelToApp, { value: string; label: string }[]> = {
  Guarantor: [
    { value: 'DG', label: 'DG – Director / Guarantor' },
    { value: 'GD', label: 'GD – Gtr / Dir / Shareholder' },
    { value: 'GU', label: 'GU – Guarantor' },
    { value: 'GS', label: 'GS – Guarantor / Shareholder' },
    { value: 'PP', label: 'PP – Partner of Partnership' },
    { value: 'CG', label: 'CG – Corporate Guarantor' },
  ],
  Owner: [
    { value: 'PP', label: 'PP – Partner of Partnership' },
    { value: 'SP', label: 'SP – Sole Proprietorship' },
  ],
  'Non-Guarantor': [
    { value: 'DR', label: 'DR – Director' },
    { value: 'DD', label: 'DD – Director / Shareholder' },
    { value: 'CH', label: 'CH – Shareholder' },
  ],
};

// ── MSIC Nature of Business cascade ──────────────────────────
const MSIC_GROUPS = [
  { code: 'A', name: 'Agriculture, Forestry and Fishing' },
  { code: 'B', name: 'Mining and Quarrying' },
  { code: 'C', name: 'Manufacturing' },
  { code: 'F', name: 'Construction' },
  { code: 'G', name: 'Wholesale and Retail Trade' },
  { code: 'H', name: 'Transportation and Storage' },
  { code: 'I', name: 'Accommodation and Food Service Activities' },
  { code: 'J', name: 'Information and Communication' },
  { code: 'K', name: 'Financial and Insurance Activities' },
  { code: 'L', name: 'Real Estate Activities' },
  { code: 'M', name: 'Professional, Scientific and Technical Activities' },
  { code: 'N', name: 'Administrative and Support Service Activities' },
  { code: 'P', name: 'Education' },
  { code: 'Q', name: 'Human Health and Social Work Activities' },
  { code: 'R', name: 'Arts, Entertainment and Recreation' },
  { code: 'S', name: 'Other Service Activities' },
];

const MSIC_BY_GROUP: Record<string, { msic: string; name: string }[]> = {
  A: [
    { msic: '01120', name: 'Growing of vegetables' },
    { msic: '01130', name: 'Growing of fruit and nut trees' },
    { msic: '01292', name: 'Growing of oil palm' },
    { msic: '01410', name: 'Raising of cattle and buffaloes' },
    { msic: '01490', name: 'Raising of other animals (poultry/swine)' },
    { msic: '03110', name: 'Marine fishing' },
    { msic: '03120', name: 'Freshwater fishing' },
    { msic: '02100', name: 'Silviculture and other forestry activities' },
  ],
  B: [
    { msic: '06100', name: 'Extraction of crude petroleum' },
    { msic: '06200', name: 'Extraction of natural gas' },
    { msic: '08100', name: 'Quarrying of stone, sand and clay' },
    { msic: '08990', name: 'Other mining and quarrying n.e.c.' },
  ],
  C: [
    { msic: '10110', name: 'Processing and preserving of meat' },
    { msic: '10200', name: 'Processing and preserving of fish' },
    { msic: '10710', name: 'Manufacture of bakery products' },
    { msic: '10800', name: 'Manufacture of other food products' },
    { msic: '13100', name: 'Spinning, weaving and finishing of textiles' },
    { msic: '14100', name: 'Manufacture of wearing apparel' },
    { msic: '20110', name: 'Manufacture of basic chemicals' },
    { msic: '22110', name: 'Manufacture of rubber tyres and tubes' },
    { msic: '24100', name: 'Manufacture of basic iron and steel' },
    { msic: '25110', name: 'Manufacture of metal structures' },
    { msic: '26200', name: 'Manufacture of computers and peripherals' },
    { msic: '27100', name: 'Manufacture of electric motors / generators' },
    { msic: '29100', name: 'Manufacture of motor vehicles' },
    { msic: '29300', name: 'Manufacture of parts for motor vehicles' },
    { msic: '31000', name: 'Manufacture of furniture' },
  ],
  F: [
    { msic: '41001', name: 'Construction of residential buildings' },
    { msic: '41002', name: 'Construction of commercial buildings' },
    { msic: '42101', name: 'Construction of roads and highways' },
    { msic: '42201', name: 'Construction of utility projects (water/sewerage)' },
    { msic: '43210', name: 'Electrical installation' },
    { msic: '43220', name: 'Plumbing, heat and air-conditioning installation' },
    { msic: '43300', name: 'Building completion and finishing' },
  ],
  G: [
    { msic: '45100', name: 'Sale of motor vehicles' },
    { msic: '45200', name: 'Maintenance and repair of motor vehicles' },
    { msic: '45300', name: 'Sale of motor vehicle parts and accessories' },
    { msic: '46100', name: 'Wholesale on a fee or contract basis' },
    { msic: '46310', name: 'Wholesale of food' },
    { msic: '47110', name: 'Retail in non-specialised stores (supermarket)' },
    { msic: '47300', name: 'Retail sale of automotive fuel' },
    { msic: '47410', name: 'Retail of computers and peripherals' },
    { msic: '47810', name: 'Retail sale via stalls – food' },
    { msic: '47910', name: 'Retail sale via internet' },
  ],
  H: [
    { msic: '49320', name: 'Taxi operation' },
    { msic: '49410', name: 'Freight transport by road' },
    { msic: '50100', name: 'Sea and coastal passenger water transport' },
    { msic: '51100', name: 'Passenger air transport' },
    { msic: '51200', name: 'Freight air transport' },
    { msic: '52100', name: 'Warehousing and storage' },
  ],
  I: [
    { msic: '55100', name: 'Hotels and resorts' },
    { msic: '55201', name: 'Chalets' },
    { msic: '56101', name: 'Restaurants' },
    { msic: '56102', name: 'Fast food outlets' },
    { msic: '56103', name: 'Cafes and coffeeshops' },
    { msic: '56210', name: 'Event catering activities' },
  ],
  J: [
    { msic: '58200', name: 'Software publishing' },
    { msic: '61100', name: 'Wired telecommunications activities' },
    { msic: '61200', name: 'Wireless telecommunications activities' },
    { msic: '62010', name: 'Computer programming activities' },
    { msic: '62020', name: 'Computer consultancy activities' },
    { msic: '63110', name: 'Data processing, hosting and related activities' },
    { msic: '63120', name: 'Web portals' },
  ],
  K: [
    { msic: '64190', name: 'Other monetary intermediation (commercial banks)' },
    { msic: '64910', name: 'Financial leasing' },
    { msic: '64990', name: 'Other financial service activities n.e.c.' },
    { msic: '65110', name: 'Life insurance' },
    { msic: '65120', name: 'Non-life insurance' },
    { msic: '66190', name: 'Other activities auxiliary to financial services' },
  ],
  L: [
    { msic: '68101', name: 'Buying and selling own real estate' },
    { msic: '68102', name: 'Real estate development – residential' },
    { msic: '68103', name: 'Real estate development – non-residential' },
    { msic: '68201', name: 'Renting and operating of own real estate' },
    { msic: '68310', name: 'Real estate agencies' },
    { msic: '68320', name: 'Management of real estate on a fee/contract basis' },
  ],
  M: [
    { msic: '69100', name: 'Legal activities' },
    { msic: '69200', name: 'Accounting, bookkeeping and auditing' },
    { msic: '70200', name: 'Management consultancy activities' },
    { msic: '71110', name: 'Architectural activities' },
    { msic: '71120', name: 'Engineering activities' },
    { msic: '73100', name: 'Advertising agencies' },
    { msic: '74100', name: 'Specialized design activities' },
    { msic: '74901', name: 'Quantity surveying activities' },
  ],
  N: [
    { msic: '77100', name: 'Renting and leasing of motor vehicles' },
    { msic: '78100', name: 'Activities of employment placement agencies' },
    { msic: '80100', name: 'Private security activities' },
    { msic: '81210', name: 'General cleaning of buildings' },
    { msic: '82200', name: 'Activities of call centres' },
    { msic: '82910', name: 'Activities of collection agencies and credit bureaus' },
  ],
  P: [
    { msic: '85200', name: 'Primary education' },
    { msic: '85310', name: 'General secondary education' },
    { msic: '85421', name: 'University education' },
    { msic: '85422', name: 'Polytechnic education' },
    { msic: '85490', name: 'Other education (private tutoring, driving schools)' },
  ],
  Q: [
    { msic: '86100', name: 'Hospital activities (private hospitals)' },
    { msic: '86210', name: 'General medical practice activities' },
    { msic: '86220', name: 'Specialist medical practice activities' },
    { msic: '86901', name: 'Dental practice activities' },
    { msic: '86902', name: 'Pharmacy activities' },
  ],
  R: [
    { msic: '90000', name: 'Creative, arts and entertainment activities' },
    { msic: '93110', name: 'Operation of sports facilities' },
    { msic: '93120', name: 'Activities of sports clubs' },
    { msic: '93200', name: 'Amusement and recreation activities' },
  ],
  S: [
    { msic: '95110', name: 'Repair of computers and peripherals' },
    { msic: '95290', name: 'Repair of personal and household goods n.e.c.' },
    { msic: '96010', name: 'Washing and dry-cleaning of textile products' },
    { msic: '96020', name: 'Hairdressing and other beauty treatment' },
    { msic: '96040', name: 'Physical well-being activities (gym/fitness)' },
    { msic: '96090', name: 'Other personal service activities n.e.c.' },
  ],
};

// ── Nature of Business Code (21-item independent legacy enum) ─
const BIZ_NATURE_CODES = [
  { code: '1.0',  name: 'Trading' },
  { code: '2.0',  name: 'Wholesale' },
  { code: '3.0',  name: 'Manufacturing' },
  { code: '4.0',  name: 'Construction' },
  { code: '5.0',  name: 'Plantation' },
  { code: '6.0',  name: 'Husbandry' },
  { code: '7.0',  name: 'Insurance' },
  { code: '8.0',  name: 'Banking' },
  { code: '9.0',  name: 'Warehousing' },
  { code: '10.0', name: 'Transportation' },
  { code: '11.0', name: 'Agriculture' },
  { code: '12.0', name: 'Fisheries' },
  { code: '13.0', name: 'Restaurant / Hotel Operator' },
  { code: '14.0', name: 'Hawkers / Petty Traders' },
  { code: '15.0', name: 'Mining / Quarrying' },
  { code: '16.0', name: 'Franchise' },
  { code: '17.0', name: 'IT & Telecommunication' },
  { code: '18.0', name: 'Business Services' },
  { code: '19.0', name: 'Clinics' },
  { code: '20.0', name: 'Professional Firms (Accounting)' },
  { code: '21.0', name: 'Professional Firms (Engineering)' },
];

// ── Bumiputra Status ──────────────────────────────────────────
const BUMIPUTRA_OPTIONS = [
  { value: 'BUM', label: 'BUM – Bumiputra' },
  { value: 'NBU', label: 'NBU – Non-Bumiputra' },
  { value: 'NRC', label: 'NRC – Non-Resident Controlled' },
  { value: 'OTH', label: 'OTH – Others / External' },
];

// ── Asset Size auto-tier from Annual Sales Turnover ───────────
function calcAssetSize(turnover: number): { code: string; label: string } | null {
  if (!turnover || turnover <= 0) return null;
  if (turnover < 300_000)    return { code: 'A', label: 'A – Less than RM300k' };
  if (turnover < 3_000_000)  return { code: 'B', label: 'B – RM300k to < RM3.0M' };
  if (turnover < 15_000_000) return { code: 'C', label: 'C – RM3.0M to < RM15.0M' };
  if (turnover < 20_000_000) return { code: 'D', label: 'D – RM15.0M to < RM20.0M' };
  if (turnover < 50_000_000) return { code: 'E', label: 'E – RM20.0M to < RM50.0M' };
  return                            { code: 'F', label: 'F – More than RM50.0M' };
}

function smeSizeFromAsset(assetCode: string): 'Micro' | 'Small' | 'Medium' | 'Large' {
  if (assetCode === 'A') return 'Micro';
  if (assetCode === 'B') return 'Small';
  if (assetCode === 'C') return 'Medium';
  return 'Large';
}

// ── Customer Sector auto-calc (Bumiputra Status × SME size) ───
function calcCustomerSector(bumi: string, assetCode: string): string | null {
  if (!bumi || !assetCode) return null;
  const size = smeSizeFromAsset(assetCode);
  const MAP: Record<string, Record<string, string>> = {
    BUM: { Micro: '41 – Bumi SME Micro', Small: '42 – Bumi SME Small', Medium: '43 – Bumi SME Medium', Large: '61 – Bumiputra DBE' },
    NBU: { Micro: '44 – Non-Bumi SME Micro', Small: '46 – Non-Bumi SME Small', Medium: '47 – Non-Bumi SME Medium', Large: '62 – Non-Bumiputra DBE' },
    NRC: { Micro: '48 – Non-Resident SME Micro', Small: '49 – Non-Resident SME Small', Medium: '51 – Non-Resident SME Medium', Large: '63 – Non-Resident DBE' },
    OTH: { Micro: '76 – Individual', Small: '76 – Individual', Medium: '76 – Individual', Large: '76 – Individual' },
  };
  return MAP[bumi]?.[size] ?? null;
}

// ── Malaysian banks list ──────────────────────────────────────
const MY_BANKS = [
  'Hong Leong Bank', 'Maybank', 'CIMB Bank', 'Public Bank', 'RHB Bank',
  'AmBank', 'Bank Islam', 'Bank Rakyat', 'Affin Bank', 'Alliance Bank',
  'HSBC Bank Malaysia', 'Standard Chartered Malaysia', 'OCBC Bank Malaysia',
  'UOB Malaysia', 'BSN (Bank Simpanan Nasional)', 'MBSB Bank',
  'Agrobank', 'Bank Muamalat', 'Other Financial Institution',
];

const FACILITY_TYPES_IND = [
  'Housing Loan / Mortgage',
  'Hire Purchase (Motor Vehicle)',
  'Personal Loan',
  'Credit Card',
  'Overdraft',
  'Education Loan (PTPTN/Other)',
  'Business Term Loan',
  'Other',
];

const FACILITY_TYPES_CORP = [
  'Term Loan',
  'Revolving Credit',
  'Overdraft (OD)',
  'Trade Finance / LC / BG',
  'Hire Purchase (Vehicle/Machinery)',
  'Invoice Financing',
  'Working Capital Loan',
  'Project Financing',
  'Leasing',
  'Other',
];

// ── E&S / Green Principle mapping (BNM VBI Framework) ────────
//
// GP 1 – Climate Change Mitigation   : business actively reduces GHG emissions
// GP 2 – Climate Change Adaptation   : business builds climate resilience
// GP 3 – No Significant Harm         : neutral environmental impact
// GP 4 – Remedial Efforts / Transition: high-impact industry, transition plan required
//
type GPCode = 'GP1' | 'GP2' | 'GP3' | 'GP4';

const MSIC_TO_GP: Record<string, { gp: GPCode; label: string; rationale: string }> = {
  A: { gp: 'GP3', label: 'GP 3 – No Significant Harm',          rationale: 'Sustainable agriculture — standard environmental controls apply.' },
  B: { gp: 'GP4', label: 'GP 4 – Remedial / Transition',        rationale: 'Mining & quarrying — extractive industry with high environmental impact. Transition plan required.' },
  C: { gp: 'GP4', label: 'GP 4 – Remedial / Transition',        rationale: 'Manufacturing — assess emissions, effluent, and waste management plan.' },
  F: { gp: 'GP3', label: 'GP 3 – No Significant Harm',          rationale: 'Construction — standard environmental impact controls apply.' },
  G: { gp: 'GP3', label: 'GP 3 – No Significant Harm',          rationale: 'Wholesale & retail trade — no material environmental harm.' },
  H: { gp: 'GP3', label: 'GP 3 – No Significant Harm',          rationale: 'Transportation — assess fleet composition; EV/hybrid fleets may qualify for GP 1.' },
  I: { gp: 'GP3', label: 'GP 3 – No Significant Harm',          rationale: 'Accommodation & F&B — no material environmental harm.' },
  J: { gp: 'GP1', label: 'GP 1 – Climate Change Mitigation',    rationale: 'ICT — digital solutions, smart systems, and remote connectivity support decarbonisation.' },
  K: { gp: 'GP1', label: 'GP 1 – Climate Change Mitigation',    rationale: 'Financial & insurance — green finance, ESG investment, and climate risk management.' },
  L: { gp: 'GP2', label: 'GP 2 – Climate Change Adaptation',    rationale: 'Real estate — green buildings, energy-efficient design, climate-resilient infrastructure.' },
  M: { gp: 'GP1', label: 'GP 1 – Climate Change Mitigation',    rationale: 'Professional services — advisory enabling green transition and sustainability reporting.' },
  N: { gp: 'GP3', label: 'GP 3 – No Significant Harm',          rationale: 'Admin & support services — no material environmental harm.' },
  P: { gp: 'GP1', label: 'GP 1 – Climate Change Mitigation',    rationale: 'Education — human capital development for sustainable economy.' },
  Q: { gp: 'GP2', label: 'GP 2 – Climate Change Adaptation',    rationale: 'Human health & social work — climate-resilient health systems.' },
  R: { gp: 'GP3', label: 'GP 3 – No Significant Harm',          rationale: 'Arts, entertainment & recreation — no material environmental harm.' },
  S: { gp: 'GP3', label: 'GP 3 – No Significant Harm',          rationale: 'Other services — no material environmental harm.' },
};

const GP_RISK_PROFILE: Record<GPCode, {
  esScore: 'Low' | 'Medium' | 'High';
  scoreBadge: string;
  action: string;
  requiresAssessment: boolean;
}> = {
  GP1: {
    esScore: 'Low',    scoreBadge: 'bg-green-100 text-green-700 border-green-200',
    action: 'No additional E&S assessment required. Green finance eligibility may apply.',
    requiresAssessment: false,
  },
  GP2: {
    esScore: 'Medium', scoreBadge: 'bg-amber-100 text-amber-700 border-amber-200',
    action: 'Standard E&S checklist required before disbursement. Climate risk disclosure recommended.',
    requiresAssessment: true,
  },
  GP3: {
    esScore: 'Low',    scoreBadge: 'bg-green-100 text-green-700 border-green-200',
    action: 'No additional E&S assessment required.',
    requiresAssessment: false,
  },
  GP4: {
    esScore: 'High',   scoreBadge: 'bg-red-100 text-red-700 border-red-200',
    action: 'Full E&S assessment required. Compliance review mandatory before credit approval. Transition plan must be submitted.',
    requiresAssessment: true,
  },
};

// ── Mock API layer ────────────────────────────────────────────
type ApiStatus = 'idle' | 'loading' | 'ok' | 'error' | 'timeout';

interface ApiResult {
  status: ApiStatus;
  data?: unknown;
  error?: string;
}

interface VerificationResults {
  cifProfile: ApiResult;
  wtWhitelist: ApiResult;
  incomeDB: ApiResult;
  appHistory: ApiResult;
  preConsent: ApiResult;
  hpLine: ApiResult;
}

const IDLE_RESULTS: VerificationResults = {
  cifProfile:  { status: 'idle' },
  wtWhitelist: { status: 'idle' },
  incomeDB:    { status: 'idle' },
  appHistory:  { status: 'idle' },
  preConsent:  { status: 'idle' },
  hpLine:      { status: 'idle' },
};

// Each mock call accepts a delay (ms) and optional forced outcome
function mockCall(delayMs: number, result: ApiResult): Promise<ApiResult> {
  return new Promise((resolve) => setTimeout(() => resolve(result), delayMs));
}

type DemoScenario = 'A' | 'B' | 'C' | 'D';

const SCENARIO_LABELS: Record<DemoScenario, string> = {
  A: 'Scenario A – NTB (No CIF)',
  B: 'Scenario B – ETB Single CIF',
  C: 'Scenario C – ETB Multiple CIF',
  D: 'Scenario D – Timeout',
};

// Scenario-specific override for cifProfile; other 5 APIs stay "ok"
const SCENARIO_CIF: Record<DemoScenario, ApiResult> = {
  A: { status: 'ok', data: { type: 'NTB', cif: null } },
  B: { status: 'ok', data: {
    type: 'ETB', cif: 'CIF-88291', name: 'Lim Boon Keong', nric: '761203-10-5981',
    dob: '1976-12-03', gender: 'Male', nationality: 'Malaysian',
    segment: 'Retail', mobile: '0122938812', email: 'lbk@gmail.com',
    address: '12, Jalan Ss 2/64, Ss 2, 47300 Petaling Jaya, Selangor',
  }},
  C: { status: 'ok', data: { type: 'ETB_MULTIPLE', cifs: [
    { cif: 'CIF-88291', name: 'Lim Boon Keong', branch: 'PJ Branch' },
    { cif: 'CIF-99034', name: 'Lim Boon Keong', branch: 'KL HQ' },
  ]}},
  D: { status: 'timeout', error: 'HOST did not respond within 5 s' },
};

export default function ApplicationForm() {
  const [appType, setAppType] = useState<AppType>('Individual');

  // Individual ID state
  const [idType, setIdType] = useState('MyKad');
  const [rawDigits, setRawDigits] = useState('');   // pure digits, source of truth
  const [displayVal, setDisplayVal] = useState(''); // what the input shows
  const [isFocused, setIsFocused] = useState(false);

  // Rule 1 – Old IC
  const [showOldIC, setShowOldIC] = useState(false);
  const [oldICNumber, setOldICNumber] = useState('');

  const isMyKadFamily = MYKAD_FAMILY.includes(idType);
  const isPassport = idType === 'Passport';

  // Passport extra fields
  const [passportCountry, setPassportCountry] = useState('');
  const [passportAge, setPassportAge] = useState('');
  const ageNum = passportAge === '' ? null : Number(passportAge);
  const ageInvalid = ageNum !== null && ageNum < 18;
  const ageValid   = ageNum !== null && ageNum >= 18;

  function handleIDTypeChange(val: string) {
    setIdType(val);
    setRawDigits('');
    setDisplayVal('');
    setShowOldIC(false);
    setOldICNumber('');
    setPassportCountry('');
    setPassportAge('');
  }

  function handleIDInput(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value;

    if (isMyKadFamily) {
      // Strip non-digits while typing; keep raw
      val = val.replace(/\D/g, '').slice(0, 12);
      setRawDigits(val);
      setDisplayVal(val); // show plain digits while focused

      // Rule 1: trigger after 2 digits for MyKad family only
      const info = inferBirthYear(val);
      setShowOldIC(info?.needsOldIC ?? false);
    } else {
      setRawDigits(val);
      setDisplayVal(val);
    }
  }

  function handleFocus() {
    setIsFocused(true);
    if (isMyKadFamily) setDisplayVal(rawDigits); // show raw while editing
  }

  function handleBlur() {
    setIsFocused(false);
    if (isMyKadFamily) setDisplayVal(formatMyKad(rawDigits)); // format on blur
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  }

  // ── Verification + Demo Controls state ───────────────────────
  const [demoScenario, setDemoScenario] = useState<DemoScenario>('B');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResults, setVerifyResults] = useState<VerificationResults>(IDLE_RESULTS);
  const [manualCIF, setManualCIF] = useState('');
  const [selectedCIF, setSelectedCIF] = useState<string | null>(null);
  const [openMenuRef, setOpenMenuRef] = useState<string | null>(null);

  // ── Primary Applicant contact details (editable, pre-filled from CIF for ETB) ──
  const [applicantName,    setApplicantName]    = useState('');
  const [applicantDOB,     setApplicantDOB]     = useState('');
  const [applicantGender,  setApplicantGender]  = useState('');
  const [applicantMobile,  setApplicantMobile]  = useState('');
  const [applicantEmail,   setApplicantEmail]   = useState('');
  const [applicantAddress, setApplicantAddress] = useState('');
  const [applicantEmailTouched, setApplicantEmailTouched] = useState(false);

  // Rule 3 – Single Active Check
  const [rule3Enabled, setRule3Enabled] = useState(false);
  const [showRule3Modal, setShowRule3Modal] = useState(false);

  // Submit / AIP modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittedRefNo] = useState(
    () => `PCJ/HP/${new Date().getFullYear()}/W${String(Math.floor(Math.random() * 9999999) + 1).padStart(7, '0')}`
  );
  type AIPOutcome = 'approved' | 'referred' | 'declined';
  const [aipDemoOutcome, setAipDemoOutcome] = useState<AIPOutcome | 'auto'>('auto');
  const [showAIPModal, setShowAIPModal]     = useState(false);
  const [aipLoading,   setAIPLoading]       = useState(false);
  const [aipResult,    setAIPResult]        = useState<AIPOutcome | null>(null);

  function triggerSubmit(effectiveEIR: number, approvedAmt: number, tenureM: number) {
    setAIPLoading(true);
    setShowSubmitModal(true);
    const outcome: AIPOutcome =
      aipDemoOutcome !== 'auto'
        ? aipDemoOutcome
        : effectiveEIR <= 3.5 && approvedAmt <= 150000
          ? 'approved'
          : effectiveEIR <= 5.0 || approvedAmt <= 200000
            ? 'referred'
            : 'declined';
    setTimeout(() => {
      setAIPLoading(false);
      setAIPResult(outcome);
    }, 2200);
    void tenureM; // used in modal display
  }

  async function runVerification(scenario: DemoScenario = demoScenario) {
    // Rule 3: block if an active application already exists
    if (rule3Enabled) {
      setShowRule3Modal(true);
      return;
    }
    setIsVerifying(true);
    setVerifyResults(IDLE_RESULTS);
    setSelectedCIF(null);
    setManualCIF('');

    const [cifProfile, wtWhitelist, incomeDB, appHistory, preConsent, hpLine] =
      await Promise.all([
        mockCall(scenario === 'D' ? 5100 : 800, SCENARIO_CIF[scenario]),
        mockCall(600,  { status: 'ok', data: { whitelisted: true, monthlyIncome: 7200, employer: 'XYZ Corp Bhd', employmentType: 'Fixed' } }),
        mockCall(1000, { status: 'ok', data: { monthlyIncome: 8500, employer: 'ABC Manufacturing Sdn Bhd', employmentType: 'Fixed', verified: true } }),
        mockCall(700,  { status: 'ok', data: { history: [
          { ref: 'HP-2024-003821', product: 'HP',  status: 'Approved', date: '2024-11-02', amount: 75000 },
          { ref: 'HP-2023-001204', product: 'IHP', status: 'Settled',  date: '2023-06-15', amount: 42000 },
          { ref: 'HP-2022-000891', product: 'HP',  status: 'Rejected', date: '2022-03-28', amount: 68000 },
        ]}}),
        mockCall(500,  { status: 'ok', data: { consented: true, consentDate: '2025-01-15', channel: 'e-Consent Portal' } }),
        mockCall(900,  { status: 'ok', data: { hpLine: 80000, validUntil: '2026-12-31', source: 'BCB' } }),
      ]);

    setVerifyResults({ cifProfile, wtWhitelist, incomeDB, appHistory, preConsent, hpLine });

    // Pre-fill applicant contact fields from ETB CIF data
    if (cifProfile.status === 'ok') {
      const d = cifProfile.data as Record<string, string> | undefined;
      if (d?.type === 'ETB') {
        if (d.name)    setApplicantName(d.name);
        if (d.dob)     setApplicantDOB(d.dob);
        if (d.gender)  setApplicantGender(d.gender);
        if (d.mobile)  setApplicantMobile(d.mobile);
        if (d.email)   setApplicantEmail(d.email);
        if (d.address) setApplicantAddress(d.address);
      }
    }

    setIsVerifying(false);
  }

  function handleDemoScenario(s: DemoScenario) {
    setDemoScenario(s);
    setVerifyResults(IDLE_RESULTS);
  }

  // ── Channel Information state (4.7) ──────────────────────
  const [loanType, setLoanType] = useState<'Conventional' | 'Islamic'>('Conventional');
  const [productGroup, setProductGroup] = useState<'HP' | 'IHP'>('HP');
  const [vehicleType, setVehicleType] = useState('');
  const [specialTags, setSpecialTags] = useState<string[]>([]);
  const [salesOfficer, setSalesOfficer] = useState('Ahmad Razif · SO-00421');
  const [closingBranch, setClosingBranch] = useState('Petaling Jaya Branch');
  const [branchManager, setBranchManager] = useState('Noraini Bt Hassan');
  const [deliveryChannel, setDeliveryChannel] = useState('');
  const [source, setSource] = useState('099');
  const [referralOfficer, setReferralOfficer] = useState('');
  const [refNo, setRefNo] = useState('');

  const PRODUCT_TYPE_MAP: Record<string, Record<string, string>> = {
    Conventional: { HP: 'Hire Purchase', IHP: 'Industrial Hire Purchase (IHP)' },
    Islamic:      { HP: 'AITAB (Islamic Hire Purchase)', IHP: 'Industrial Hire Purchase-i (IHP-i)' },
  };
  const productType = PRODUCT_TYPE_MAP[loanType][productGroup];

  function toggleSpecialTag(tag: string) {
    setSpecialTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function generateRefNo() {
    const productCode = productGroup; // 'HP' or 'IHP'
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 9999999) + 1).padStart(7, '0');
    setRefNo(`PCJ/${productCode}/${year}/W${seq}`);
  }

  // ── Other Applicants / Guarantors (4.8) ─────────────────
  type GuarantorVerifyData = {
    fullName: string; gender: string; dob: string;
    employer: string; monthlyIncome: number;
    ccrisTotal: number; propertyEquity: number;
  };
  type Guarantor = {
    gid: string; idType: string; rawId: string;
    name: string; phone: string; email: string;
    emailTouched: boolean;
    relToApp: RelToApp | '';
    roleCode: string;
    status: 'idle' | 'verifying' | 'verified' | 'not_found';
    verifyData: GuarantorVerifyData | null;
  };
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);

  const MOCK_GUARANTOR_DATA: GuarantorVerifyData[] = [
    { fullName: 'Lee Chong Wei', gender: 'Male', dob: '1982-10-21',
      employer: 'Technip Energies Sdn Bhd', monthlyIncome: 9500,
      ccrisTotal: 2200, propertyEquity: 380000 },
    { fullName: 'Siti Norzahra Bt Ramli', gender: 'Female', dob: '1990-03-15',
      employer: 'Universiti Malaya', monthlyIncome: 6800,
      ccrisTotal: 850, propertyEquity: 0 },
    { fullName: 'Krishnamurthy A/L Pillai', gender: 'Male', dob: '1975-11-30',
      employer: 'Self-Employed', monthlyIncome: 12000,
      ccrisTotal: 5400, propertyEquity: 750000 },
  ];

  function addGuarantor() {
    setGuarantors((prev) => [...prev, {
      gid: `g-${Date.now()}`, idType: 'MyKad', rawId: '',
      name: '', phone: '', email: '', emailTouched: false,
      relToApp: '', roleCode: '', status: 'idle', verifyData: null,
    }]);
  }
  function removeGuarantor(gid: string) {
    setGuarantors((prev) => prev.filter((g) => g.gid !== gid));
  }
  function updateGuarantor(gid: string, field: keyof Guarantor, val: string | boolean) {
    setGuarantors((prev) => prev.map((g) => g.gid === gid ? { ...g, [field]: val } : g));
  }
  async function verifyGuarantor(gid: string) {
    setGuarantors((prev) => prev.map((g) => g.gid === gid ? { ...g, status: 'verifying', verifyData: null } : g));
    await new Promise((r) => setTimeout(r, 1200));
    setGuarantors((prev) => prev.map((g, idx) => {
      if (g.gid !== gid) return g;
      const data = MOCK_GUARANTOR_DATA[idx % MOCK_GUARANTOR_DATA.length];
      return { ...g, status: 'verified', verifyData: data };
    }));
  }

  const REL_TO_APP_OPTIONS: RelToApp[] = ['Guarantor', 'Owner', 'Non-Guarantor'];

  // ── Income state (4.9) ───────────────────────────────────
  const [incomeMode, setIncomeMode] = useState<'api' | 'manual'>('api');

  type EmployerIncome = {
    eid: string; name: string;
    empType: 'Fixed' | 'Variable' | 'Self-Employed';
    gross: string; net: string; commission: string;
  };
  const [employers, setEmployers] = useState<EmployerIncome[]>([]);

  type BankStmt = { bid: string; bankName: string; avgNetCredit: string };
  const [bankStmts, setBankStmts] = useState<BankStmt[]>([]);

  const [epfMonthly, setEpfMonthly]             = useState('');
  const [existingCommitments, setExistingCommitments] = useState('');

  const totalGross   = employers.reduce((s, e) => s + (parseFloat(e.gross)      || 0), 0);
  const totalNet     = employers.reduce((s, e) => s + (parseFloat(e.net)        || 0), 0);
  const totalComm    = employers.filter((e) => e.empType === 'Variable')
                                .reduce((s, e) => s + (parseFloat(e.commission) || 0), 0);
  const totalNetIncome = totalNet + totalComm + (parseFloat(epfMonthly) || 0);

  function addEmployer() {
    setEmployers((p) => [...p, { eid: `e-${Date.now()}`, name: '', empType: 'Fixed', gross: '', net: '', commission: '' }]);
  }
  function updateEmployer(eid: string, field: keyof EmployerIncome, val: string) {
    setEmployers((p) => p.map((e) => e.eid === eid ? { ...e, [field]: val } : e));
  }
  function removeEmployer(eid: string) { setEmployers((p) => p.filter((e) => e.eid !== eid)); }

  function addBankStmt() {
    setBankStmts((p) => [...p, { bid: `b-${Date.now()}`, bankName: '', avgNetCredit: '' }]);
  }
  function updateBankStmt(bid: string, field: keyof BankStmt, val: string) {
    setBankStmts((p) => p.map((b) => b.bid === bid ? { ...b, [field]: val } : b));
  }
  function removeBankStmt(bid: string) { setBankStmts((p) => p.filter((b) => b.bid !== bid)); }

  // ── Loan Program state (4.12) ────────────────────────────
  const [loanProductCode, setLoanProductCode] = useState('');
  const [loanPackageCode, setLoanPackageCode] = useState('');
  const [campaignCode, setCampaignCode]       = useState('');

  const selectedProduct  = PRODUCT_CODES.find((p) => p.code === loanProductCode) ?? null;
  const availablePackages = loanProductCode ? (PACKAGE_CODES[loanProductCode] ?? []) : [];
  const selectedCampaign  = CAMPAIGNS.find((c) => c.code === campaignCode) ?? null;

  // EIR / rate back-calculation
  const [loanAmount, setLoanAmount]   = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [eirValue, setEirValue]       = useState('');

  const eirNum      = parseFloat(eirValue) || 0;
  const isVariable  = selectedProduct?.rateType === 'Variable';
  const isIslamic   = loanType === 'Islamic';
  const baseRateNum = parseFloat(selectedProduct?.base?.match(/[\d.]+/)?.[0] ?? '0');

  // Back-calculated rate: Spread for variable; nominal for fixed (÷1.84 approximation)
  const backCalcRate = eirNum > 0
    ? isVariable
      ? Math.max(0, eirNum - baseRateNum).toFixed(2)
      : (eirNum / 1.84).toFixed(2)
    : '';
  const backCalcLabel = isVariable ? 'Spread'
    : isIslamic ? 'Profit Rate' : 'Interest Rate';

  // Campaign / absolute EIR validation
  const ABS_MIN = 2.0; const ABS_MAX = 8.0;
  const eirBelowMin   = eirNum > 0 && eirNum < ABS_MIN;
  const eirAboveMax   = eirNum > ABS_MAX;
  const eirOutOfRange = selectedCampaign && eirNum > 0
    && (eirNum < selectedCampaign.minEIR || eirNum > selectedCampaign.maxEIR);
  const eirHardBlock  = eirBelowMin || eirAboveMax;

  // Installment for DSR (mirrors repayment table logic)
  const loanInstallment = (() => {
    const P = parseFloat(loanAmount); const N = parseInt(tenureMonths);
    if (!P || !N || !eirNum || eirHardBlock || !backCalcRate || !selectedProduct) return 0;
    if (selectedProduct.calcMode === 'Sum of Digit') {
      const totalInt = P * (parseFloat(backCalcRate) / 100) * (N / 12);
      return (P + totalInt) / N;
    }
    const r = eirNum / 100 / 12;
    return P * r / (1 - Math.pow(1 + r, -N));
  })();

  function handleProductCodeChange(code: string) {
    setLoanProductCode(code);
    setLoanPackageCode('');
    setCampaignCode('');
  }

  // ── Asset Information state (4.10) ──────────────────────
  const [assets, setAssets] = useState({
    savingBal: '', currentAccBal: '', fdGia: '',
    unitTrust: '', cds: '', otherNetworth: '',
    omvProperty: '', epf1: '', epf2: '',
  });
  type AssetKey = keyof typeof assets;

  const totalEPF = (parseFloat(assets.epf1) || 0) + (parseFloat(assets.epf2) || 0);
  const totalAssets =
    (parseFloat(assets.savingBal)    || 0) + (parseFloat(assets.currentAccBal) || 0) +
    (parseFloat(assets.fdGia)        || 0) + (parseFloat(assets.unitTrust)     || 0) +
    (parseFloat(assets.cds)          || 0) + (parseFloat(assets.otherNetworth) || 0) +
    (parseFloat(assets.omvProperty)  || 0) + totalEPF;
  const fmtRM = (n: number) =>
    n === 0 ? '0.00' : n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Vehicle state (4.11) ──────────────────────────────────
  const [vehMake, setVehMake]     = useState('');
  const [vehFamily, setVehFamily] = useState('');
  const [vehYear, setVehYear]     = useState('');
  const [vehModel, setVehModel]   = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  const availableFamilies = vehMake ? (VEHICLE_FAMILIES[vehMake] ?? []) : [];
  const availableYears    = vehMake && vehFamily
    ? Object.keys(VEHICLE_MODELS[`${vehMake}-${vehFamily}`] ?? {}).sort((a, b) => Number(b) - Number(a))
    : [];
  const availableModels: VehicleModel[] = vehMake && vehFamily && vehYear
    ? (VEHICLE_MODELS[`${vehMake}-${vehFamily}`]?.[vehYear] ?? [])
    : [];
  const selectedModelData = availableModels.find((m) => m.model === vehModel) ?? null;
  const isUsedVehicle = vehicleType === 'used';

  function handleVehMake(v: string)   { setVehMake(v); setVehFamily(''); setVehYear(''); setVehModel(''); }
  function handleVehFamily(v: string) { setVehFamily(v); setVehYear(''); setVehModel(''); }
  function handleVehYear(v: string)   { setVehYear(v); setVehModel(''); }

  // ── Corporate state ────────────────────────────────────────
  const [corpIDType, setCorpIDType] = useState('SSM');
  const [corpIDNumber, setCorpIDNumber] = useState('');
  const [enterpriseType, setEnterpriseType] = useState('');

  type CorpStatus = 'idle' | 'verifying' | 'found' | 'not_found';
  type CorpDirector = {
    did: string; name: string; nric: string; role: string; sharesPct: number;
    cifStatus: 'idle' | 'verifying' | 'verified';
    cifData: { cif: string; mobile: string; email: string } | null;
    designation?: string;
  };
  type CorpVerifyData = {
    companyName: string; regStatus: 'Active' | 'Inactive' | 'Struck Off';
    incorporationDate: string; registeredAddress: string;
    paidUpCapital: number; businessNature: string;
    directors: { name: string; nric: string; role: string; sharesPct: number }[];
  };
  const MOCK_SSM_DATA: CorpVerifyData = {
    companyName: 'ABC Manufacturing Sdn Bhd',
    regStatus: 'Active',
    incorporationDate: '2008-03-15',
    registeredAddress: 'Lot 12, Jalan Industri 3, Taman IKS Jaya, 68000 Ampang, Selangor',
    paidUpCapital: 500000,
    businessNature: 'Manufacturing of automotive parts and accessories',
    directors: [
      { name: 'Ahmad Bin Razif',      nric: '760512-10-4321', role: 'Managing Director',      sharesPct: 60 },
      { name: 'Lee Wei Chong',        nric: '780224-14-5678', role: 'Executive Director',      sharesPct: 30 },
      { name: 'Siti Aminah Bt Yusof', nric: '820910-10-3456', role: 'Non-Executive Director',  sharesPct: 10 },
    ],
  };

  const [corpStatus,    setCorpStatus]    = useState<CorpStatus>('idle');
  const [corpVerifyData,setCorpVerifyData]= useState<CorpVerifyData | null>(null);
  const [corpDirectors, setCorpDirectors] = useState<CorpDirector[]>([]);
  const [corpPhone,     setCorpPhone]     = useState('');
  const [corpEmail,     setCorpEmail]     = useState('');
  const [corpEmailTouched, setCorpEmailTouched] = useState(false);
  const [corpCorrespondenceAddr, setCorpCorrespondenceAddr] = useState('');

  async function runCorpVerification() {
    if (!corpIDNumber) return;
    setCorpStatus('verifying');
    setCorpVerifyData(null);
    setCorpDirectors([]);
    await new Promise((r) => setTimeout(r, 1500));
    setCorpStatus('found');
    setCorpVerifyData(MOCK_SSM_DATA);
    setCorpDirectors(MOCK_SSM_DATA.directors.map((d, i) => ({
      did: `d-${i}`, ...d, cifStatus: 'idle', cifData: null,
    })));
    // Pre-fill shareholders from SSM directors who hold shares
    setShareholders(MOCK_SSM_DATA.directors
      .filter((d) => d.sharesPct > 0)
      .map((d, i) => ({
        uid: `u-ssm-${i}`, name: d.name, idType: 'NRIC' as const, idNo: d.nric,
        nationality: 'Malaysian', pct: String(d.sharesPct),
        isCompany: false, beneficialOwner: '', isPEP: false, pepDeclaration: '' as const,
      }))
    );
    // Pre-fill correspondence address and profile fields from SSM data
    setCorpCorrespondenceAddr(MOCK_SSM_DATA.registeredAddress);
    setCorpEstDate(MOCK_SSM_DATA.incorporationDate);
    setPaidUpCapital(String(MOCK_SSM_DATA.paidUpCapital));
  }

  const MOCK_DIRECTOR_CIF = [
    { cif: 'CIF-44201', mobile: '0122938812', email: 'ahmad.razif@abcmfg.com.my' },
    { cif: 'CIF-67534', mobile: '0173826612', email: 'lee.wc@abcmfg.com.my'      },
    { cif: 'CIF-91028', mobile: '0198837662', email: 'siti.a@abcmfg.com.my'      },
  ];
  async function verifyCorpDirector(did: string) {
    setCorpDirectors((prev) => prev.map((d) => d.did === did ? { ...d, cifStatus: 'verifying' } : d));
    await new Promise((r) => setTimeout(r, 1000));
    setCorpDirectors((prev) => prev.map((d, i) => d.did === did
      ? { ...d, cifStatus: 'verified', cifData: MOCK_DIRECTOR_CIF[i % MOCK_DIRECTOR_CIF.length] }
      : d
    ));
  }

  const ENTERPRISE_TYPES = [
    { code: 'A', label: 'Sdn Bhd – Private Limited Company' },
    { code: 'B', label: 'Bhd – Public Limited Company' },
    { code: 'C', label: 'Branch – Branch of Foreign Company' },
    { code: 'D', label: 'Sole Proprietorship' },
    { code: 'E', label: 'Partnership – General Partnership' },
    { code: 'F', label: 'PLT – Local Limited Liability Partnership' },
    { code: 'G', label: 'Foreign LLP' },
    { code: 'H', label: 'Professional LLP' },
    { code: 'L', label: 'East Malaysia Special Enterprise' },
  ];

  // ── Corporate Business Classification state ──────────────
  const [bizNobGroup,       setBizNobGroup]       = useState('');
  const [bizNobSub,         setBizNobSub]         = useState('');
  const [bizNobCode,        setBizNobCode]        = useState('');
  const [bizDescription,    setBizDescription]    = useState('');
  const [bumiStatus,        setBumiStatus]        = useState('NBU');
  const [segmentCategory,   setSegmentCategory]   = useState('');
  const [boardCategory,     setBoardCategory]     = useState('');
  const [smiStatus,         setSmiStatus]         = useState('');
  const [offshoreStatus,    setOffshoreStatus]    = useState('');
  const [residentialStatus, setResidentialStatus] = useState('Resident');
  const [crossBorderCountries, setCrossBorderCountries] = useState<string[]>([]);
  const [placeOfReg,        setPlaceOfReg]        = useState('');

  // ── Company Profile enrichment ───────────────────────────
  const [basicGroup,        setBasicGroup]        = useState('');
  const [constitution,      setConstitution]      = useState('');
  const [countryOfIncorp,   setCountryOfIncorp]   = useState('Malaysia');
  const [bnmAssignedID,     setBnmAssignedID]     = useState('');
  const [corpEstDate,       setCorpEstDate]       = useState('');

  // Auto-map Basic Group + Constitution when Enterprise Type changes
  const derivedBasicGroup  = enterpriseType ? (ENTITY_TO_BASIC_GROUP[enterpriseType  as EntityCode] ?? '') : '';
  const derivedConstitution= enterpriseType ? (ENTITY_TO_CONSTITUTION[enterpriseType as EntityCode] ?? '') : '';
  const effectiveBasicGroup  = basicGroup   || derivedBasicGroup;
  const effectiveConstitution= constitution || derivedConstitution;

  // ── Scope & Tax state ─────────────────────────────────────
  const [countryOfOperation,  setCountryOfOperation]  = useState('Malaysia');
  const [stateOfOperation,    setStateOfOperation]    = useState('');
  const [placeOfRegCode,      setPlaceOfRegCode]      = useState('');
  const [regStateCode,        setRegStateCode]        = useState('');
  const [corpTIN,             setCorpTIN]             = useState('');
  const [corpSST,             setCorpSST]             = useState('');
  const [labuanEntity,        setLabuanEntity]        = useState('No');
  const [fenResident,         setFenResident]         = useState('Resident');

  // ── Employee & Operational enrichment ─────────────────────
  const [employeeActual,      setEmployeeActual]      = useState('');
  const [employeeRange,       setEmployeeRange]       = useState('');
  const [turnoverRangeVal,    setTurnoverRangeVal]    = useState('');
  const [authorizedCapital,   setAuthorizedCapital]   = useState('');
  const [paidUpCapital,       setPaidUpCapital]       = useState('');
  const [sourceOfRepayment,   setSourceOfRepayment]   = useState('Business Income');
  const [primaryIncomeDoc,    setPrimaryIncomeDoc]    = useState('');

  // ── Compliance Checks state ───────────────────────────────
  const [complexStructure,    setComplexStructure]    = useState('');
  const [hasNomineeShares,    setHasNomineeShares]    = useState('');

  // ── Customer Confirmation state ───────────────────────────
  const [isFaceToFace,        setIsFaceToFace]        = useState('');
  const [dateOfContact,       setDateOfContact]       = useState('');
  const [timeOfContact,       setTimeOfContact]       = useState('');
  const [modeOfContact,       setModeOfContact]       = useState('');
  const [contactedBy,         setContactedBy]         = useState('');
  const [customerConfirmedHP, setCustomerConfirmedHP] = useState('');
  const [customerAgreedEmail, setCustomerAgreedEmail] = useState('');
  const [pdsConfirmed,        setPdsConfirmed]        = useState(false);
  const [marketingConsent,    setMarketingConsent]    = useState('');

  const nobSubOptions  = bizNobGroup ? (MSIC_BY_GROUP[bizNobGroup] ?? []) : [];
  const msicCode       = nobSubOptions.find((s) => s.msic === bizNobSub)?.msic ?? '';
  const entityRules    = ENTITY_FIELD_RULES[enterpriseType as EntityCode] ?? null;
  const guarantorRules = ENTITY_GUARANTOR_RULES[enterpriseType as EntityCode] ?? null;

  // E&S / Green Principle — derived from MSIC group selection
  const corpGPData  = bizNobGroup ? (MSIC_TO_GP[bizNobGroup]              ?? null) : null;
  const esRiskData  = corpGPData  ? (GP_RISK_PROFILE[corpGPData.gp]        ?? null) : null;

  // ── Corporate Business Financials state ─────────────────
  const [bizFinYearCurrent,  setBizFinYearCurrent]  = useState(String(new Date().getFullYear()));
  const [bizFinYearPrev,     setBizFinYearPrev]     = useState(String(new Date().getFullYear() - 1));
  const [bizTurnoverCurr,    setBizTurnoverCurr]    = useState('');
  const [bizTurnoverPrev,    setBizTurnoverPrev]    = useState('');
  const [bizNetProfitCurr,   setBizNetProfitCurr]   = useState('');
  const [bizNetProfitPrev,   setBizNetProfitPrev]   = useState('');
  const [bizYearsOp,         setBizYearsOp]         = useState('');
  const [bizExistingCredit,  setBizExistingCredit]  = useState('');
  const [bizInstallment,     setBizInstallment]     = useState('');

  // keep old single-value aliases for DSR calc backward compat
  const bizTurnover   = bizTurnoverCurr;
  const bizNetProfit  = bizNetProfitCurr;

  const assetSizeTier  = calcAssetSize(parseFloat(bizTurnoverCurr) || 0);
  const customerSector = calcCustomerSector(bumiStatus, assetSizeTier?.code ?? '');

  // ── UBO / Shareholder Structure state ───────────────────────
  type UBOShareholder = {
    uid: string;
    name: string;
    idType: 'NRIC' | 'Passport' | 'Company Reg';
    idNo: string;
    nationality: string;
    pct: string;           // % ownership (string for input)
    isCompany: boolean;
    beneficialOwner: string; // if isCompany: natural-person UBO name
    isPEP: boolean;
    pepDeclaration: 'Yes' | 'No' | '';
  };
  const [shareholders, setShareholders] = useState<UBOShareholder[]>([]);
  const totalSharePct  = shareholders.reduce((s, x) => s + (parseFloat(x.pct) || 0), 0);
  const uboList        = shareholders.filter((s) => (parseFloat(s.pct) || 0) >= 25);
  const hasPEPFlag     = shareholders.some((s) => s.isPEP);

  function addShareholder() {
    setShareholders((p) => [...p, {
      uid: `u-${Date.now()}`, name: '', idType: 'NRIC', idNo: '',
      nationality: 'Malaysian', pct: '', isCompany: false,
      beneficialOwner: '', isPEP: false, pepDeclaration: '',
    }]);
  }
  function updateShareholder<K extends keyof UBOShareholder>(uid: string, field: K, val: UBOShareholder[K]) {
    setShareholders((p) => p.map((s) => s.uid === uid ? { ...s, [field]: val } : s));
  }
  function removeShareholder(uid: string) {
    setShareholders((p) => p.filter((s) => s.uid !== uid));
  }

  // ── Facility Schedule (Individual) ──────────────────────────
  type Facility = {
    fid: string;
    bank: string;
    facilityType: string;
    limit: string;
    outstanding: string;
    monthly: string;
    status: 'Active' | 'Settled' | 'Written Off';
    purpose: string;
  };
  const [indFacilities, setIndFacilities] = useState<Facility[]>([]);
  const indFacilityTotal = indFacilities
    .filter((f) => f.status === 'Active')
    .reduce((s, f) => s + (parseFloat(f.monthly) || 0), 0);

  function addIndFacility() {
    setIndFacilities((p) => [...p, {
      fid: `if-${Date.now()}`, bank: '', facilityType: '',
      limit: '', outstanding: '', monthly: '', status: 'Active', purpose: '',
    }]);
  }
  function updateIndFacility<K extends keyof Facility>(fid: string, field: K, val: Facility[K]) {
    setIndFacilities((p) => p.map((f) => f.fid === fid ? { ...f, [field]: val } : f));
  }
  function removeIndFacility(fid: string) {
    setIndFacilities((p) => p.filter((f) => f.fid !== fid));
  }

  // ── Facility Schedule (Corporate) ───────────────────────────
  const [corpFacilities, setCorpFacilities] = useState<Facility[]>([]);
  const corpFacilityTotal = corpFacilities
    .filter((f) => f.status === 'Active')
    .reduce((s, f) => s + (parseFloat(f.monthly) || 0), 0);

  function addCorpFacility() {
    setCorpFacilities((p) => [...p, {
      fid: `cf-${Date.now()}`, bank: '', facilityType: '',
      limit: '', outstanding: '', monthly: '', status: 'Active', purpose: '',
    }]);
  }
  function updateCorpFacility<K extends keyof Facility>(fid: string, field: K, val: Facility[K]) {
    setCorpFacilities((p) => p.map((f) => f.fid === fid ? { ...f, [field]: val } : f));
  }
  function removeCorpFacility(fid: string) {
    setCorpFacilities((p) => p.filter((f) => f.fid !== fid));
  }

  // ── 3rd financial year ───────────────────────────────────────
  const [bizFinYear2Ago,    setBizFinYear2Ago]    = useState(String(new Date().getFullYear() - 2));
  const [bizTurnover2Ago,   setBizTurnover2Ago]   = useState('');
  const [bizNetProfit2Ago,  setBizNetProfit2Ago]  = useState('');

  const bizDSR = (() => {
    const income  = parseFloat(bizNetProfitCurr) / 12 || 0;
    // Use facility total if available, else fall back to manual field
    const commits = corpFacilityTotal > 0
      ? corpFacilityTotal + (parseFloat(bizInstallment) || 0)
      : (parseFloat(bizExistingCredit) || 0) + (parseFloat(bizInstallment) || 0);
    return income > 0 ? ((commits / income) * 100).toFixed(1) : null;
  })();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-hlb text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl tracking-wide">HLB</span>
          <span className="text-sm opacity-75 border-l border-white/30 pl-3">CrediOS</span>
        </div>
        <span className="text-sm opacity-90">Sales Officer · Ahmad Razif</span>
      </header>

      <div className="max-w-5xl mx-auto p-4 flex gap-4 items-start">
        {/* ── Demo Controls sidebar ──────────────────────────── */}
        <aside className="w-52 shrink-0 bg-white rounded-lg shadow-sm p-3 sticky top-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Demo Controls
          </p>
          {(Object.keys(SCENARIO_LABELS) as DemoScenario[]).map((s) => (
            <button
              key={s}
              onClick={() => handleDemoScenario(s)}
              className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors ${
                demoScenario === s
                  ? 'bg-hlb text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {SCENARIO_LABELS[s]}
            </button>
          ))}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rules</p>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rule3Enabled}
                onChange={(e) => { setRule3Enabled(e.target.checked); setVerifyResults(IDLE_RESULTS); }}
                className="accent-hlb w-3.5 h-3.5"
              />
              <span className="text-xs text-gray-600">Rule 3: Active App Exists</span>
            </label>
          </div>
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AIP Outcome</p>
            {(['auto', 'approved', 'referred', 'declined'] as const).map((o) => (
              <button
                key={o}
                onClick={() => setAipDemoOutcome(o)}
                className={`w-full text-left px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  aipDemoOutcome === o
                    ? o === 'approved' ? 'bg-green-600 text-white'
                      : o === 'referred' ? 'bg-amber-500 text-white'
                      : o === 'declined' ? 'bg-red-600 text-white'
                      : 'bg-hlb text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {o === 'auto' ? 'Auto (by EIR/Amount)' : o.charAt(0).toUpperCase() + o.slice(1)}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 leading-tight">
              Select a scenario then click <strong>Search / Verify</strong> on the form.
            </p>
          </div>
        </aside>

        {/* ── Main form column ───────────────────────────────── */}
        <div className="flex-1 space-y-4">
        {/* Page title */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h1 className="text-base font-semibold text-gray-800">New Application</h1>
          <p className="text-xs text-gray-400 mt-0.5">HP / IHP · Sales Officer Start New Application</p>
        </div>

        {/* Application Type toggle */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="text-xs font-medium text-gray-500 block mb-2">
            Application Type <span className="text-red-500">*</span>
          </label>
          <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
            {(['Individual', 'Non-Individual'] as AppType[]).map((t) => (
              <button
                key={t}
                onClick={() => setAppType(t)}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  appType === t
                    ? 'bg-hlb text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Individual Section ─────────────────────────────── */}
        {appType === 'Individual' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
              Primary Applicant
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* ID Type */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  ID Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={idType}
                  onChange={(e) => handleIDTypeChange(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                >
                  <optgroup label="Group 1 – Standard">
                    {ID_TYPES_G1.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Group 2 – Others (cannot be ID1)">
                    {ID_TYPES_G2.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  ID Number <span className="text-red-500">*</span>
                  {isMyKadFamily && (
                    <span className="ml-1 text-gray-300">YYMMDD-PB-####</span>
                  )}
                </label>
                <input
                  type="text"
                  inputMode={isMyKadFamily ? 'numeric' : 'text'}
                  value={displayVal}
                  onChange={handleIDInput}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isMyKadFamily ? '900101141234' : isPassport ? 'Passport number' : 'ID number'
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400"
                />
                {/* Show formatted value hint after blur */}
                {isMyKadFamily && !isFocused && displayVal && (
                  <p className="text-xs text-gray-400 mt-1">Formatted: {displayVal}</p>
                )}
              </div>
            </div>

            {/* Verify button + loading indicator */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => runVerification()}
                disabled={isVerifying || !rawDigits || ageInvalid}
                className="px-4 py-2 text-sm font-medium rounded bg-hlb text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
              >
                {isVerifying ? 'Verifying…' : 'Search / Verify'}
              </button>
              {isVerifying && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Querying 6 systems…
                </span>
              )}
              {!isVerifying && verifyResults.cifProfile.status !== 'idle' && verifyResults.cifProfile.status !== 'timeout' && (
                <span className="text-xs text-green-600 font-medium">Query complete</span>
              )}
            </div>

            {/* Passport extra fields */}
            {isPassport && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Issuing Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={passportCountry}
                    onChange={(e) => setPassportCountry(e.target.value)}
                    placeholder="e.g. Singapore"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={passportAge}
                    onChange={(e) => setPassportAge(e.target.value)}
                    placeholder="Must be ≥ 18"
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none ${
                      ageInvalid ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : ageValid  ? 'border-green-400 focus:border-green-500'
                      : 'border-gray-300 focus:border-blue-400'
                    }`}
                  />
                  {ageInvalid && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      Rule 2: Applicant must be ≥ 18 years old
                    </p>
                  )}
                  {ageValid && (
                    <p className="text-xs text-green-600 mt-1">Age verified ✓</p>
                  )}
                  {passportAge === '' && (
                    <p className="text-xs text-gray-400 mt-1">Rule 2: must be ≥ 18</p>
                  )}
                </div>
              </div>
            )}

            {/* Rule 1 – Old IC field */}
            {showOldIC && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                <p className="text-xs text-amber-700 font-medium">
                  ⚠️ Please provide Old IC No. for comprehensive data check.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Old ID Type</label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                      <option>MyKad (Old IC)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">
                      Old IC Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={oldICNumber}
                      onChange={(e) => setOldICNumber(e.target.value)}
                      placeholder="Old IC number"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── CIF Verification Result ──────────────────────── */}
            {(() => {
              const r = verifyResults.cifProfile;
              if (r.status === 'idle') return null;
              const d = r.data as Record<string, unknown> | undefined;

              // Scenario A – NTB: prompt for manual entry of contact details
              if (r.status === 'ok' && d?.type === 'NTB') return (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-start gap-2">
                    <span className="text-green-500 text-lg leading-none mt-0.5">✓</span>
                    <div>
                      <p className="text-sm font-medium text-green-700">No Existing Record – New-to-Bank Customer</p>
                      <p className="text-xs text-green-600 mt-0.5">No active CIF found. Please enter applicant details below.</p>
                    </div>
                  </div>
                  {/* NTB: manual applicant details */}
                  <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Applicant Details (NTB)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 block mb-1">Full Name (as per ID) <span className="text-red-500">*</span></label>
                        <input value={applicantName} onChange={(e) => setApplicantName(e.target.value)}
                          placeholder="e.g. Ahmad Bin Razif"
                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Date of Birth</label>
                        <input type="date" value={applicantDOB} onChange={(e) => setApplicantDOB(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Gender</label>
                        <select value={applicantGender} onChange={(e) => setApplicantGender(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                          <option value="">-- Select --</option>
                          <option>Male</option><option>Female</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              );

              // Scenario B – ETB Single CIF: show full profile + editable contact fields
              if (r.status === 'ok' && d?.type === 'ETB') {
                const etb = d as Record<string, string>;
                return (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">CIF Profile Found</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">{etb.segment ?? 'Retail'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs">
                        {([
                          ['CIF Number',   etb.cif,         'font-mono font-semibold'],
                          ['Full Name',    etb.name,        'font-medium'],
                          ['NRIC',         etb.nric,        'font-mono'],
                          ['Date of Birth', etb.dob,        ''],
                          ['Gender',       etb.gender,      ''],
                          ['Nationality',  etb.nationality, ''],
                        ] as [string, string, string][]).map(([label, val, cls]) => (
                          <div key={label}>
                            <p className="text-gray-400 mb-0.5">{label}</p>
                            <p className={`text-gray-800 ${cls}`}>{val ?? '–'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // Scenario C – ETB Multiple CIFs
              if (r.status === 'ok' && d?.type === 'ETB_MULTIPLE') {
                const cifs = d.cifs as Array<{ cif: string; name: string; branch: string }>;
                return (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 space-y-2">
                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                      Multiple CIF Records Found – Please Select
                    </p>
                    <p className="text-xs text-yellow-600">
                      {cifs.length} records matched this ID. Select the correct CIF to proceed.
                    </p>
                    <div className="space-y-1.5">
                      {cifs.map((c) => (
                        <button
                          key={c.cif}
                          onClick={() => setSelectedCIF(c.cif)}
                          className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
                            selectedCIF === c.cif
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex gap-6">
                              <span className="font-mono font-semibold text-gray-800">{c.cif}</span>
                              <span className="text-gray-700">{c.name}</span>
                              <span className="text-gray-400">{c.branch}</span>
                            </div>
                            {selectedCIF === c.cif && (
                              <span className="text-blue-600 font-bold text-base leading-none">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedCIF && (
                      <p className="text-xs text-blue-600 font-medium pt-1">
                        Selected: {selectedCIF}
                      </p>
                    )}
                  </div>
                );
              }

              // Scenario D – Timeout
              if (r.status === 'timeout') return (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 text-base leading-none mt-0.5">⚠</span>
                    <div>
                      <p className="text-sm font-medium text-red-700">HOST Timeout – CIF Lookup Failed</p>
                      <p className="text-xs text-red-500 mt-0.5">{r.error}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">
                      Enter CIF Number Manually <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualCIF}
                      onChange={(e) => setManualCIF(e.target.value)}
                      placeholder="e.g. CIF-88291"
                      className="w-full border border-red-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-red-400"
                    />
                  </div>
                </div>
              );

              return null;
            })()}

            {/* ── 6-Check Verification Summary Strip ──────────────── */}
            {verifyResults.cifProfile.status !== 'idle' && !isVerifying && (() => {
              type CheckDef = { label: string; status: 'ok' | 'warn' | 'error' | 'na'; detail: string };
              const r = verifyResults;
              const cifType = r.cifProfile.status === 'ok'
                ? (r.cifProfile.data as Record<string,string>)?.type
                : null;
              const checks: CheckDef[] = [
                {
                  label: 'CIF Lookup',
                  status: r.cifProfile.status === 'ok' ? 'ok' : r.cifProfile.status === 'timeout' ? 'error' : 'warn',
                  detail: r.cifProfile.status === 'ok'
                    ? cifType === 'ETB' ? 'ETB — CIF found'
                    : cifType === 'ETB_MULTIPLE' ? 'Multiple CIFs — select one'
                    : 'NTB — new customer'
                    : 'HOST timeout',
                },
                {
                  label: 'WT Whitelist',
                  status: r.wtWhitelist.status === 'ok' ? 'ok' : 'warn',
                  detail: r.wtWhitelist.status === 'ok'
                    ? `Whitelisted · RM ${((r.wtWhitelist.data as {monthlyIncome?:number})?.monthlyIncome ?? 0).toLocaleString()}/mo`
                    : 'Not whitelisted',
                },
                {
                  label: 'Income DB',
                  status: r.incomeDB.status === 'ok' ? 'ok' : 'warn',
                  detail: r.incomeDB.status === 'ok'
                    ? `Verified · RM ${((r.incomeDB.data as {monthlyIncome?:number})?.monthlyIncome ?? 0).toLocaleString()}/mo`
                    : 'No record',
                },
                {
                  label: 'App History',
                  status: r.appHistory.status === 'ok' ? 'ok' : 'warn',
                  detail: r.appHistory.status === 'ok'
                    ? `${((r.appHistory.data as {history?:unknown[]})?.history?.length ?? 0)} previous application(s)`
                    : 'No history',
                },
                {
                  label: 'e-Consent',
                  status: r.preConsent.status === 'ok'
                    ? ((r.preConsent.data as {consented?:boolean})?.consented ? 'ok' : 'warn')
                    : 'warn',
                  detail: r.preConsent.status === 'ok'
                    ? ((r.preConsent.data as {consented?:boolean})?.consented ? 'Signed' : 'Not signed')
                    : 'Unknown',
                },
                {
                  label: 'HP Line',
                  status: r.hpLine.status === 'ok' ? 'ok' : 'warn',
                  detail: r.hpLine.status === 'ok'
                    ? `RM ${((r.hpLine.data as {hpLine?:number})?.hpLine ?? 0).toLocaleString()} (${(r.hpLine.data as {source?:string})?.source ?? ''})`
                    : 'No line found',
                },
              ];
              const ICON: Record<string, string> = { ok: '✓', warn: '⚠', error: '✗', na: '–' };
              const COLOR: Record<string, string> = {
                ok:    'bg-green-50  border-green-200  text-green-700',
                warn:  'bg-amber-50  border-amber-200  text-amber-700',
                error: 'bg-red-50    border-red-200    text-red-600',
                na:    'bg-gray-50   border-gray-200   text-gray-400',
              };
              const ICON_COLOR: Record<string, string> = {
                ok: 'text-green-500', warn: 'text-amber-500', error: 'text-red-500', na: 'text-gray-300',
              };
              return (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Verification Summary</p>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-y divide-gray-100">
                    {checks.map((c) => (
                      <div key={c.label} className={`px-3 py-2 flex items-start gap-2 ${COLOR[c.status]}`}>
                        <span className={`text-sm font-bold leading-none mt-0.5 shrink-0 ${ICON_COLOR[c.status]}`}>{ICON[c.status]}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold">{c.label}</p>
                          <p className="text-xs opacity-80 mt-0.5 leading-tight truncate">{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── Contact Details — shown after any CIF result (ETB auto-filled, NTB manual) ── */}
            {verifyResults.cifProfile.status !== 'idle' && !isVerifying && (
              <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-white">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {verifyResults.cifProfile.status === 'ok' &&
                   (verifyResults.cifProfile.data as Record<string,string>)?.type === 'NTB' ? null : (
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Full Name</label>
                      <input value={applicantName} onChange={(e) => setApplicantName(e.target.value)}
                        className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs bg-gray-50 focus:outline-none focus:border-blue-400" />
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Mobile No. <span className="text-red-500">*</span></label>
                    <input type="tel" value={applicantMobile} onChange={(e) => setApplicantMobile(e.target.value)}
                      placeholder="e.g. 0122938812"
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      onBlur={() => setApplicantEmailTouched(true)}
                      placeholder="e.g. name@email.com"
                      className={`w-full border rounded px-3 py-1.5 text-xs focus:outline-none ${
                        applicantEmailTouched && applicantEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)
                          ? 'border-red-400 focus:border-red-400'
                          : 'border-gray-300 focus:border-blue-400'
                      }`} />
                    {applicantEmailTouched && applicantEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail) && (
                      <p className="text-xs text-red-500 mt-0.5">Invalid email format</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">Mailing / Correspondence Address</label>
                    <input value={applicantAddress} onChange={(e) => setApplicantAddress(e.target.value)}
                      placeholder="Street, postcode, city, state"
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Income Data Panel (4.9) ──────────────────────────── */}
        {appType === 'Individual' && verifyResults.cifProfile.status !== 'idle' && !isVerifying && (() => {
          type IncomeData = { monthlyIncome?: number; employer?: string; employmentType?: string };
          const dbData = verifyResults.incomeDB.status    === 'ok' ? verifyResults.incomeDB.data    as IncomeData : null;
          const wtData = verifyResults.wtWhitelist.status === 'ok' ? verifyResults.wtWhitelist.data as IncomeData : null;
          const apiIncome = dbData?.monthlyIncome ? dbData : wtData?.monthlyIncome ? wtData : null;
          const apiSource = dbData?.monthlyIncome
            ? { label: 'HLB Income DB', priority: 1, color: 'text-green-700 bg-green-50 border-green-200' }
            : wtData?.monthlyIncome
            ? { label: 'WT Whitelist',  priority: 2, color: 'text-blue-700  bg-blue-50  border-blue-200'  }
            : null;
          const fmtR = (n: number) => `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

          // Effective income base used for DSR — API mode uses the API figure, manual mode uses entered totals
          const effectiveNetIncome = incomeMode === 'api'
            ? (apiIncome?.monthlyIncome ?? 0)
            : totalNetIncome;

          // Joint contributions from verified guarantors
          const verifiedGuarantors = guarantors.filter((g) => g.status === 'verified' && g.verifyData);
          const gJointIncome   = verifiedGuarantors.reduce((s, g) => s + (g.verifyData?.monthlyIncome ?? 0), 0);
          const gJointCCRIS    = verifiedGuarantors.reduce((s, g) => s + (g.verifyData?.ccrisTotal   ?? 0), 0);
          const jointIncome    = effectiveNetIncome + gJointIncome;
          // Prefer facility schedule total; fall back to manual field
          const commitAmt      = indFacilityTotal > 0 ? indFacilityTotal : (parseFloat(existingCommitments) || 0);
          const jointCommit    = commitAmt + gJointCCRIS;

          const currentDSR    = effectiveNetIncome > 0 ? ((commitAmt + loanInstallment) / effectiveNetIncome * 100).toFixed(1) : null;
          const internalDSR   = effectiveNetIncome > 0 ? (commitAmt / effectiveNetIncome * 100).toFixed(1) : null;
          const minDisposable = effectiveNetIncome - commitAmt - loanInstallment;
          const jointDSR      = jointIncome > 0 ? ((jointCommit + loanInstallment) / jointIncome * 100).toFixed(1) : null;

          // Pre-fill manual fields from API data
          function prefillFromApi() {
            if (!apiIncome) return;
            setEmployers([{
              eid: crypto.randomUUID(),
              name: apiIncome.employer ?? '',
              empType: (apiIncome.employmentType as 'Fixed' | 'Variable' | 'Self-Employed') ?? 'Fixed',
              gross: String(apiIncome.monthlyIncome ?? ''),
              net:   String(apiIncome.monthlyIncome ?? ''),
              commission: '',
            }]);
            setIncomeMode('manual');
          }

          return (
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              {/* Header + mode toggle */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                  Income Data
                </h2>
                <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-xs">
                  {(['api', 'manual'] as const).map((m) => (
                    <button key={m} onClick={() => setIncomeMode(m)}
                      className={`px-3 py-1 font-medium transition-colors ${incomeMode === m ? 'bg-hlb text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {m === 'api' ? 'Use API Data' : 'Enter Manually'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── API mode ── */}
              {incomeMode === 'api' && (
                apiIncome && apiSource ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${apiSource.color}`}>
                        <span>Priority {apiSource.priority}</span><span className="opacity-40">·</span><span>{apiSource.label}</span>
                      </div>
                      <button onClick={prefillFromApi}
                        className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
                        Pre-fill → Manual
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Monthly Gross</p>
                        <p className="text-base font-semibold text-gray-800">RM {apiIncome.monthlyIncome!.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Employer</p>
                        <p className="text-sm text-gray-800">{apiIncome.employer ?? '–'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Employment Type</p>
                        <p className="text-sm text-gray-800">{apiIncome.employmentType ?? '–'}</p>
                      </div>
                    </div>
                    {dbData?.monthlyIncome && wtData?.monthlyIncome && dbData.monthlyIncome !== wtData.monthlyIncome && (
                      <p className="text-xs text-amber-600">⚠ Income DB differs from WT Whitelist. Income DB takes priority.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No income data from API. Switch to manual entry.</p>
                )
              )}

              {/* ── Manual mode ── */}
              {incomeMode === 'manual' && (
                <div className="space-y-4">

                  {/* Employer Income */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Employer Income</p>
                      <div className="flex items-center gap-2">
                        {apiIncome && employers.length === 0 && (
                          <button onClick={prefillFromApi}
                            className="text-xs px-2.5 py-1 rounded border border-blue-300 text-blue-600 hover:bg-blue-50">
                            Pre-fill from API
                          </button>
                        )}
                        <button onClick={addEmployer}
                          className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
                          + Add Employer
                        </button>
                      </div>
                    </div>
                    {employers.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No employer added yet.</p>
                    )}
                    {employers.map((e, idx) => (
                      <div key={e.eid} className="border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-gray-600">Employer {idx + 1}</p>
                          <button onClick={() => removeEmployer(e.eid)} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <label className="text-xs text-gray-500 block mb-1">Employer Name</label>
                            <input value={e.name} onChange={(ev) => updateEmployer(e.eid, 'name', ev.target.value)}
                              placeholder="e.g. ABC Sdn Bhd"
                              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Employment Type</label>
                            <select value={e.empType} onChange={(ev) => updateEmployer(e.eid, 'empType', ev.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                              {(['Fixed', 'Variable', 'Self-Employed'] as const).map((t) => <option key={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Monthly Gross (RM)</label>
                            <input type="number" value={e.gross} onChange={(ev) => updateEmployer(e.eid, 'gross', ev.target.value)}
                              placeholder="0.00"
                              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Monthly Net (RM)</label>
                            <input type="number" value={e.net} onChange={(ev) => updateEmployer(e.eid, 'net', ev.target.value)}
                              placeholder="0.00"
                              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                          </div>
                          {e.empType === 'Variable' && (
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Avg Monthly Commission (RM)</label>
                              <input type="number" value={e.commission} onChange={(ev) => updateEmployer(e.eid, 'commission', ev.target.value)}
                                placeholder="0.00"
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bank Statements */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bank Statements</p>
                      <button onClick={addBankStmt}
                        className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
                        + Add Account
                      </button>
                    </div>
                    {bankStmts.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No bank account added yet.</p>
                    )}
                    {bankStmts.map((b) => (
                      <div key={b.bid} className="grid grid-cols-3 gap-2 border border-gray-200 rounded-lg p-3 items-end">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Bank</label>
                          <select value={b.bankName} onChange={(ev) => updateBankStmt(b.bid, 'bankName', ev.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                            <option value="">-- Select --</option>
                            {['Maybank', 'CIMB', 'Public Bank', 'HLB', 'RHB', 'AmBank', 'Others'].map((bk) => <option key={bk}>{bk}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">3-Month Avg Net Credit (RM)</label>
                          <input type="number" value={b.avgNetCredit} onChange={(ev) => updateBankStmt(b.bid, 'avgNetCredit', ev.target.value)}
                            placeholder="0.00"
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                        </div>
                        <button onClick={() => removeBankStmt(b.bid)} className="text-xs text-gray-400 hover:text-red-500 pb-1.5">Remove</button>
                      </div>
                    ))}
                  </div>

                  {/* EPF */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">EPF</p>
                    <div className="w-56">
                      <label className="text-xs text-gray-500 block mb-1">Monthly EPF Contribution (RM)</label>
                      <input type="number" value={epfMonthly} onChange={(e) => setEpfMonthly(e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>

                  {/* Income Summary */}
                  {totalNetIncome > 0 && (
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Income Summary</p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
                        {([
                          ['Monthly Gross Income',  fmtR(totalGross)],
                          ['Monthly Net Income',    fmtR(totalNet)],
                          ['Variable / Commission', fmtR(totalComm)],
                          ['EPF (monthly)',         fmtR(parseFloat(epfMonthly) || 0)],
                          ['Total Net Verifiable',  fmtR(totalNetIncome)],
                        ] as [string, string][]).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-gray-50 pb-1">
                            <span className="text-gray-400">{k}</span>
                            <span className="font-mono font-semibold text-gray-800">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Existing Credit Facilities (Individual) ── */}
              <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Existing Credit Facilities</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Declare all active facilities from ALL banks. Monthly installments feed into DSR calculation.
                      <br/>CCRIS will be checked during credit assessment — entries should match.
                    </p>
                  </div>
                  <button onClick={addIndFacility}
                    className="text-xs px-2.5 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                    + Add Facility
                  </button>
                </div>

                {indFacilities.length > 0 && (
                  <>
                    {/* Column headers */}
                    <div className="grid grid-cols-12 gap-1.5 text-xs text-gray-400 font-medium px-1">
                      <div className="col-span-2">Bank</div>
                      <div className="col-span-2">Facility Type</div>
                      <div className="col-span-2">Limit (RM)</div>
                      <div className="col-span-2">Outstanding (RM)</div>
                      <div className="col-span-1">Mthly (RM)</div>
                      <div className="col-span-1">Status</div>
                      <div className="col-span-1">Purpose</div>
                      <div className="col-span-1"></div>
                    </div>
                    {indFacilities.map((f) => {
                      const outNum  = parseFloat(f.outstanding) || 0;
                      const limNum  = parseFloat(f.limit) || 0;
                      const overLimit = outNum > limNum && limNum > 0;
                      return (
                        <div key={f.fid} className={`grid grid-cols-12 gap-1.5 items-start border rounded p-2 ${overLimit ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                          <div className="col-span-2">
                            <select value={f.bank} onChange={(e) => updateIndFacility(f.fid, 'bank', e.target.value)}
                              className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white">
                              <option value="">-- Bank --</option>
                              {MY_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <select value={f.facilityType} onChange={(e) => updateIndFacility(f.fid, 'facilityType', e.target.value)}
                              className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white">
                              <option value="">-- Type --</option>
                              {FACILITY_TYPES_IND.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <input type="number" value={f.limit} onChange={(e) => updateIndFacility(f.fid, 'limit', e.target.value)}
                              placeholder="0" className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-400 bg-white" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" value={f.outstanding} onChange={(e) => updateIndFacility(f.fid, 'outstanding', e.target.value)}
                              placeholder="0"
                              className={`w-full border rounded px-2 py-1 text-xs font-mono focus:outline-none bg-white ${overLimit ? 'border-red-400 text-red-700' : 'border-gray-300 focus:border-blue-400'}`} />
                            {overLimit && <p className="text-xs text-red-500 mt-0.5">Exceeds limit</p>}
                          </div>
                          <div className="col-span-1">
                            <input type="number" value={f.monthly} onChange={(e) => updateIndFacility(f.fid, 'monthly', e.target.value)}
                              placeholder="0"
                              disabled={f.status !== 'Active'}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-400 bg-white disabled:opacity-40" />
                          </div>
                          <div className="col-span-1">
                            <select value={f.status} onChange={(e) => updateIndFacility(f.fid, 'status', e.target.value as Facility['status'])}
                              className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white">
                              <option value="Active">Active</option>
                              <option value="Settled">Settled</option>
                              <option value="Written Off">Written Off</option>
                            </select>
                          </div>
                          <div className="col-span-1">
                            <input value={f.purpose} onChange={(e) => updateIndFacility(f.fid, 'purpose', e.target.value)}
                              placeholder="e.g. property addr / veh reg"
                              className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white" />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button onClick={() => removeIndFacility(f.fid)}
                              className="text-xs text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50">✕</button>
                          </div>
                        </div>
                      );
                    })}
                    {/* Total row */}
                    <div className="grid grid-cols-12 gap-1.5 text-xs px-1 pt-1 border-t border-gray-200">
                      <div className="col-span-4 font-semibold text-gray-600">Total (Active facilities)</div>
                      <div className="col-span-2 font-mono font-semibold text-gray-700">
                        RM {indFacilities.filter(f=>f.status==='Active').reduce((s,f)=>s+(parseFloat(f.limit)||0),0).toLocaleString('en-MY')}
                      </div>
                      <div className="col-span-2 font-mono font-semibold text-gray-700">
                        RM {indFacilities.filter(f=>f.status==='Active').reduce((s,f)=>s+(parseFloat(f.outstanding)||0),0).toLocaleString('en-MY')}
                      </div>
                      <div className="col-span-1 font-mono font-semibold text-blue-700">
                        RM {indFacilityTotal.toLocaleString('en-MY')}
                      </div>
                      <div className="col-span-3 text-blue-600 font-medium">
                        ← used in DSR
                      </div>
                    </div>
                  </>
                )}

                {indFacilities.length === 0 && (
                  <div className="text-center py-4 border border-dashed border-gray-200 rounded">
                    <p className="text-xs text-gray-400">No facilities declared.</p>
                    <p className="text-xs text-gray-400">If none, the manual "Existing Commitments" field below will be used.</p>
                  </div>
                )}
              </div>

              {/* ── DSR / Exposure Summary — shown for both modes once income is known ── */}
              {effectiveNetIncome > 0 && (
                <div className="border border-blue-100 rounded-lg p-3 bg-blue-50 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">DSR / Exposure Summary</p>
                  {incomeMode === 'api' && (
                    <p className="text-xs text-gray-500">
                      Income base: <span className="font-semibold text-gray-700">{fmtR(effectiveNetIncome)}</span>
                      <span className="text-gray-400"> / month ({apiSource?.label})</span>
                    </p>
                  )}
                  {indFacilityTotal > 0 ? (
                    <p className="text-xs text-blue-600">
                      Facility Schedule total: <span className="font-semibold">RM {indFacilityTotal.toLocaleString('en-MY')}</span>/month (replacing manual field)
                    </p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">
                        Existing Commitments / Month (RM)
                        {indFacilityTotal > 0 && <span className="text-gray-400 ml-1">(overridden by facility schedule)</span>}
                      </label>
                      <input type="number" value={indFacilityTotal > 0 ? String(indFacilityTotal) : existingCommitments}
                        onChange={(e) => { if (indFacilityTotal === 0) setExistingCommitments(e.target.value); }}
                        readOnly={indFacilityTotal > 0}
                        placeholder="0.00"
                        className={`w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono bg-white focus:outline-none focus:border-blue-400 ${indFacilityTotal > 0 ? 'opacity-60 cursor-not-allowed' : ''}`} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">This Loan Installment (RM)</label>
                      <div className="px-3 py-1.5 rounded border border-gray-200 text-xs font-mono bg-white text-gray-700">
                        {loanInstallment > 0 ? fmtR(loanInstallment) : '— (fill Loan Program first)'}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {([
                      ['Current DSR',           currentDSR  ? `${currentDSR}%`  : '–', currentDSR  && parseFloat(currentDSR)  > 70 ? 'text-red-600' : 'text-gray-800'],
                      ['Internal DSR',          internalDSR ? `${internalDSR}%` : '–', 'text-gray-800'],
                      ['Min Disposable Income', effectiveNetIncome > 0 ? fmtR(minDisposable) : '–', minDisposable < 0 ? 'text-red-600' : 'text-green-700'],
                    ] as [string, string, string][]).map(([label, val, cls]) => (
                      <div key={label} className="bg-white rounded p-2 border border-blue-100">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className={`text-sm font-bold ${cls}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                  {currentDSR && parseFloat(currentDSR) > 70 && (
                    <p className="text-xs text-red-600">⚠ Primary DSR exceeds 70% — loan may require additional justification.</p>
                  )}

                  {/* Joint DSR — shown only when ≥1 guarantor is verified */}
                  {verifiedGuarantors.length > 0 && (
                    <div className="border-t border-blue-200 pt-3 space-y-2">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        Joint DSR ({verifiedGuarantors.length} guarantor{verifiedGuarantors.length > 1 ? 's' : ''} included)
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        {([
                          ['Primary Net Income',          fmtR(effectiveNetIncome)],
                          ['Guarantor(s) Net Income',     fmtR(gJointIncome)],
                          ['Guarantor(s) CCRIS Commits',  fmtR(gJointCCRIS)],
                          ['Joint Total Net Income',      fmtR(jointIncome)],
                        ] as [string, string][]).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-blue-100 pb-1">
                            <span className="text-gray-400">{k}</span>
                            <span className="font-mono font-semibold text-gray-800">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="bg-white rounded p-2 border border-blue-100 flex-1">
                          <p className="text-xs text-gray-400 mb-0.5">Joint DSR</p>
                          <p className={`text-sm font-bold ${jointDSR && parseFloat(jointDSR) > 70 ? 'text-red-600' : 'text-green-700'}`}>
                            {jointDSR ? `${jointDSR}%` : '–'}
                          </p>
                        </div>
                        <div className="bg-white rounded p-2 border border-blue-100 flex-1">
                          <p className="text-xs text-gray-400 mb-0.5">Joint Disposable Income</p>
                          <p className={`text-sm font-bold font-mono ${jointIncome - jointCommit - loanInstallment < 0 ? 'text-red-600' : 'text-green-700'}`}>
                            {fmtR(jointIncome - jointCommit - loanInstallment)}
                          </p>
                        </div>
                      </div>
                      {jointDSR && parseFloat(jointDSR) <= 70 && currentDSR && parseFloat(currentDSR) > 70 && (
                        <p className="text-xs text-green-600">Joint DSR within 70% — guarantor inclusion improves viability.</p>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-400">Global DSR: Pending CCRIS Retrieval (post-submission)</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── App History Panel (4.5.7) ──────────────────────── */}
        {appType === 'Individual' && verifyResults.appHistory.status === 'ok' && !isVerifying && (() => {
          type HistoryEntry = { ref: string; product: string; status: string; date: string; amount: number };
          const entries = (verifyResults.appHistory.data as { history: HistoryEntry[] }).history;

          const STATUS_STYLE: Record<string, string> = {
            Approved: 'bg-green-100 text-green-700',
            Settled:  'bg-gray-100  text-gray-600',
            Rejected: 'bg-red-100   text-red-600',
          };

          return (
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                Application History
                <span className="ml-auto text-xs font-normal text-gray-400">{entries.length} records</span>
              </h2>

              {entries.length === 0 ? (
                <p className="text-xs text-gray-400">No previous applications found.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {entries.map((e) => (
                    <div key={e.ref} className="flex items-center gap-3 py-2.5 text-sm">
                      {/* Ref + Product */}
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs font-medium text-gray-800">{e.ref}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{e.date}</p>
                      </div>

                      {/* Product badge */}
                      <span className="text-xs font-semibold text-gray-500 w-8">{e.product}</span>

                      {/* Amount */}
                      <span className="text-xs text-gray-600 w-24 text-right">
                        RM {e.amount.toLocaleString()}
                      </span>

                      {/* Status badge */}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-20 text-center ${STATUS_STYLE[e.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {e.status}
                      </span>

                      {/* "..." copy menu */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuRef(openMenuRef === e.ref ? null : e.ref)}
                          className="text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100 text-base leading-none"
                        >
                          ···
                        </button>
                        {openMenuRef === e.ref && (
                          <div className="absolute right-0 top-6 z-10 bg-white border border-gray-200 rounded shadow-md w-48 py-1 text-xs">
                            {[
                              'Copy All',
                              'Copy Customer',
                              'Copy as Fleet Purchase',
                            ].map((action) => (
                              <button
                                key={action}
                                onClick={() => { setOpenMenuRef(null); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── HP Line Panel (4.5 – BCB Source) ─────────────────── */}
        {appType === 'Individual' && verifyResults.hpLine.status === 'ok' && !isVerifying && (() => {
          type HPData = { hpLine: number; validUntil: string; source: string };
          const d = verifyResults.hpLine.data as HPData;
          return (
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
                HP Financing Line
                <span className="ml-auto text-xs font-normal text-gray-400">Source: {d.source}</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Approved HP Line</p>
                  <p className="text-xl font-bold text-gray-800">RM {d.hpLine.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Valid Until</p>
                  <p className="text-sm text-gray-700">{d.validUntil}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Pre-Consent Panel (4.5 – e-Consent) ───────────────── */}
        {appType === 'Individual' && verifyResults.preConsent.status === 'ok' && !isVerifying && (() => {
          type ConsentData = { consented: boolean; consentDate: string; channel: string };
          const d = verifyResults.preConsent.data as ConsentData;
          return (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">5</span>
                Pre-Consent (e-Consent)
              </h2>
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  d.consented ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {d.consented ? '✓ Signed' : '⚠ Not Signed'}
                </span>
                {d.consented && (
                  <>
                    <div>
                      <p className="text-xs text-gray-400">Consent Date</p>
                      <p className="text-xs font-medium text-gray-700">{d.consentDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Channel</p>
                      <p className="text-xs font-medium text-gray-700">{d.channel}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── 4.8 Other Applicants / Guarantors ─────────────────── */}
        {(appType === 'Individual' || (appType === 'Non-Individual' && corpStatus === 'found')) && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {guarantors.length > 0 ? '✓' : '+'}
                </span>
                {appType === 'Non-Individual' ? 'Guarantors / Signing Parties' : 'Other Applicants'}
                {guarantors.length > 0 && (
                  <span className="text-xs font-normal text-gray-400">{guarantors.length} added</span>
                )}
                {appType === 'Non-Individual' && guarantorRules && (
                  <span className={`ml-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    guarantorRules.guarantorType === 'none'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {guarantorRules.guarantorType === 'none' ? '无需担保' : guarantorRules.mandatory ? '强制' : '可选'}
                    {' · '}{guarantorRules.guarantorType === 'none' ? '' : guarantorRules.guarantorType === 'PG_or_CG' ? 'PG/CG' : guarantorRules.guarantorType}
                  </span>
                )}
              </h2>
              {guarantors.length < (appType === 'Non-Individual' ? 10 : 3) && (
                <button onClick={addGuarantor}
                  className="text-xs px-3 py-1.5 rounded border border-hlb text-hlb hover:bg-red-50 font-medium transition-colors">
                  + Add Guarantor
                </button>
              )}
            </div>

            {guarantors.length === 0 && (
              <p className="text-xs text-gray-400">
                {appType === 'Non-Individual'
                  ? guarantorRules?.guarantorType === 'none'
                    ? `无需担保人 (${guarantorRules.signingEntity})。签字人：${guarantorRules.signatories}。`
                    : `请添加必要担保人 (${guarantorRules?.guarantorDesc ?? ''})。`
                  : 'No guarantors added. Click "+ Add Guarantor" to include joint applicants.'}
              </p>
            )}

            {guarantors.map((g, idx) => (
              <div key={g.gid} className="border border-gray-200 rounded-lg p-3 space-y-3">
                {/* Guarantor header */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">
                    Guarantor {idx + 1}
                    {g.status === 'verified' && (
                      <span className="ml-2 text-green-600">✓ Verified</span>
                    )}
                    {g.status === 'verifying' && (
                      <span className="ml-2 text-gray-400 animate-pulse">Verifying…</span>
                    )}
                  </p>
                  <button onClick={() => removeGuarantor(g.gid)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors px-1">
                    Remove
                  </button>
                </div>

                {/* ID fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">ID Type <span className="text-red-500">*</span></label>
                    <select value={g.idType}
                      onChange={(e) => updateGuarantor(g.gid, 'idType', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400">
                      <optgroup label="Group 1 – Standard">
                        {ID_TYPES_G1.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </optgroup>
                      <optgroup label="Group 2 – Others">
                        {ID_TYPES_G2.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">ID Number <span className="text-red-500">*</span></label>
                    <input type="text" value={g.rawId}
                      onChange={(e) => { updateGuarantor(g.gid, 'rawId', e.target.value); updateGuarantor(g.gid, 'status', 'idle'); }}
                      placeholder="ID number"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400" />
                  </div>
                </div>

                {/* Contact fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Mobile No.</label>
                    <input type="tel" value={g.phone}
                      onChange={(e) => updateGuarantor(g.gid, 'phone', e.target.value)}
                      placeholder="e.g. 0123456789"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" value={g.email}
                      onChange={(e) => updateGuarantor(g.gid, 'email', e.target.value)}
                      onBlur={() => updateGuarantor(g.gid, 'emailTouched', true)}
                      placeholder="e.g. name@example.com"
                      className={`w-full border rounded px-3 py-2 text-xs focus:outline-none ${
                        g.emailTouched && g.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email)
                          ? 'border-red-400 focus:border-red-400'
                          : 'border-gray-300 focus:border-blue-400'
                      }`} />
                    {g.emailTouched && g.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email) && (
                      <p className="text-xs text-red-500 mt-0.5">Invalid email format</p>
                    )}
                  </div>
                </div>

                {/* Relationship fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Relationship to Application <span className="text-red-500">*</span></label>
                    <select value={g.relToApp}
                      onChange={(e) => {
                        updateGuarantor(g.gid, 'relToApp', e.target.value);
                        updateGuarantor(g.gid, 'roleCode', '');
                      }}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400">
                      <option value="">-- Select --</option>
                      {REL_TO_APP_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Role Code <span className="text-red-500">*</span></label>
                    <select value={g.roleCode}
                      onChange={(e) => updateGuarantor(g.gid, 'roleCode', e.target.value)}
                      disabled={!g.relToApp}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400 disabled:opacity-50">
                      <option value="">-- Select Role --</option>
                      {g.relToApp && ROLE_CODES_BY_REL[g.relToApp as RelToApp]?.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {g.roleCode === 'CG' && (
                      <p className="text-xs text-amber-600 mt-0.5">Corporate Guarantor — Non-Individual entity only</p>
                    )}
                  </div>
                </div>

                {/* Verify button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => verifyGuarantor(g.gid)}
                    disabled={!g.rawId || g.status === 'verifying' || g.status === 'verified'}
                    className="text-xs px-3 py-1.5 rounded bg-gray-700 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors">
                    {g.status === 'verifying' ? 'Verifying…' : g.status === 'verified' ? 'Verified ✓' : 'Search / Verify'}
                  </button>
                  {g.status === 'verified' && (
                    <button onClick={() => setGuarantors((prev) => prev.map((x) => x.gid === g.gid ? { ...x, status: 'idle', verifyData: null } : x))}
                      className="text-xs text-gray-400 hover:text-gray-600 underline">
                      Re-verify
                    </button>
                  )}
                </div>

                {/* Verification result panel */}
                {g.status === 'verified' && g.verifyData && (() => {
                  const d = g.verifyData;
                  const fmtR = (n: number) => `RM ${n.toLocaleString('en-MY')}`;
                  return (
                    <div className="border border-green-200 rounded-lg bg-green-50 p-3 space-y-3">
                      {/* CIF result */}
                      <div>
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">CIF Found</p>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          {([
                            ['Full Name',    d.fullName],
                            ['Gender',       d.gender],
                            ['Date of Birth', d.dob],
                            ['Employer',     d.employer],
                            ['Monthly Income', fmtR(d.monthlyIncome)],
                          ] as [string, string][]).map(([label, val]) => (
                            <div key={label}>
                              <p className="text-gray-400 mb-0.5">{label}</p>
                              <p className="font-medium text-gray-800">{val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CCRIS / Experian summary */}
                      <div className="border-t border-green-200 pt-3">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">CCRIS / Experian</p>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-gray-400 mb-0.5">Monthly CCRIS Commitments</p>
                            <p className={`font-semibold font-mono ${d.ccrisTotal > 5000 ? 'text-amber-600' : 'text-gray-800'}`}>
                              {fmtR(d.ccrisTotal)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-0.5">Unencumbered Property Equity</p>
                            <p className="font-semibold font-mono text-gray-800">{fmtR(d.propertyEquity)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-0.5">Net Income after CCRIS</p>
                            <p className={`font-semibold font-mono ${d.monthlyIncome - d.ccrisTotal < 1000 ? 'text-red-600' : 'text-green-700'}`}>
                              {fmtR(d.monthlyIncome - d.ccrisTotal)}
                            </p>
                          </div>
                        </div>
                        {d.ccrisTotal > d.monthlyIncome * 0.6 && (
                          <p className="text-xs text-amber-600 mt-2">⚠ CCRIS commitments exceed 60% of monthly income — review required.</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}

        {/* ── Corporate Section ──────────────────────────────── */}
        {appType === 'Non-Individual' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
              Primary Applicant – Corporate
            </h2>

            {/* ── ID entry row ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Corporate ID Type <span className="text-red-500">*</span></label>
                <select value={corpIDType}
                  onChange={(e) => { setCorpIDType(e.target.value); setCorpStatus('idle'); setCorpVerifyData(null); }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                  <option value="SSM">SSM ID (Default)</option>
                  <option value="ROB">Business Registration (ROB)</option>
                  <option value="ROC">Certificate of Incorporation (ROC)</option>
                  <option value="LLP">Registration Certificate (LLP)</option>
                  <option value="Foreign">Foreign Business Registration</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  {corpIDType === 'SSM' ? 'SSM ID' : 'ID Number'} <span className="text-red-500">*</span>
                  {corpIDType === 'SSM' && <span className="ml-1 text-gray-300 font-normal">12 digits</span>}
                </label>
                <div className="flex gap-2">
                  <input type="text" value={corpIDNumber}
                    onChange={(e) => { setCorpIDNumber(e.target.value); setCorpStatus('idle'); setCorpVerifyData(null); }}
                    placeholder={corpIDType === 'SSM' ? '202408012345' : 'ID number'}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
                  <button
                    onClick={runCorpVerification}
                    disabled={!corpIDNumber || corpStatus === 'verifying'}
                    className="px-3 py-2 text-xs font-medium rounded bg-gray-800 text-white disabled:opacity-40 hover:bg-gray-700 transition-colors whitespace-nowrap">
                    {corpStatus === 'verifying' ? 'Searching…' : 'Search / Verify'}
                  </button>
                </div>
                {corpIDType === 'SSM' && <p className="text-xs text-gray-400 mt-1">Format: YYYY + entity code (01–06) + serial (6 digits)</p>}
              </div>
            </div>

            {/* Enterprise Type + Residential Status row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Enterprise Type <span className="text-red-500">*</span></label>
                <select value={enterpriseType} onChange={(e) => { setEnterpriseType(e.target.value); setBoardCategory(''); }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                  <option value="">-- Select Enterprise Type --</option>
                  {ENTERPRISE_TYPES.map((t) => <option key={t.code} value={t.code}>{t.code}. {t.label}</option>)}
                  <optgroup label="Inactive for HP">
                    {['I. Dummy – Business Enterprise', 'J. Dummy – Society / Assoc', 'K. Government and Its Agencies'].map((l) => (
                      <option key={l} disabled>{l} (Inactive)</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Residential Status</label>
                <select value={residentialStatus} onChange={(e) => setResidentialStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                  <option value="Resident">Resident</option>
                  <option value="Non-Resident">Non-Resident</option>
                </select>
              </div>
            </div>

            {/* Entity-type-conditional fields */}
            {enterpriseType && entityRules && (
              <div className="grid grid-cols-2 gap-4">
                {entityRules.showBoardCategory && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Board Category <span className="text-red-500">*</span></label>
                    <select value={boardCategory} onChange={(e) => setBoardCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400">
                      <option value="">-- Select --</option>
                      <option value="L01">L01 – Main Board Local</option>
                      <option value="F03">F03 – Main Board Foreign</option>
                      <option value="L02">L02 – Second Board Local</option>
                    </select>
                  </div>
                )}
                {entityRules.placeOfRegRequired && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Place of Registration <span className="text-red-500">*</span></label>
                    <input value={placeOfReg} onChange={(e) => setPlaceOfReg(e.target.value)}
                      placeholder="e.g. Kuala Lumpur"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">SMI Status <span className="text-red-500">*</span></label>
                  <div className="flex gap-4 mt-1">
                    {['Yes', 'No'].map((v) => (
                      <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="radio" name="smiStatus" value={v} checked={smiStatus === v}
                          onChange={() => setSmiStatus(v)} className="accent-hlb" />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
                {entityRules.showOffshore && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Offshore Status</label>
                    <div className="flex gap-4 mt-1">
                      {['Yes', 'No'].map((v) => (
                        <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="radio" name="offshoreStatus" value={v} checked={offshoreStatus === v}
                            onChange={() => setOffshoreStatus(v)} className="accent-hlb" />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cross-Border Countries (Non-Resident only) */}
            {residentialStatus === 'Non-Resident' && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Cross-Border Countries <span className="text-gray-400 font-normal">(max 4)</span></label>
                <div className="flex flex-wrap gap-2">
                  {['Singapore', 'China', 'USA', 'UK', 'Hong Kong', 'Japan', 'Australia', 'Indonesia', 'Thailand', 'India'].map((c) => {
                    const selected = crossBorderCountries.includes(c);
                    return (
                      <button key={c} type="button"
                        onClick={() => setCrossBorderCountries((prev) =>
                          selected ? prev.filter((x) => x !== c)
                          : prev.length < 4 ? [...prev, c] : prev
                        )}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          selected
                            ? 'bg-hlb text-white border-hlb'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                        } ${!selected && crossBorderCountries.length >= 4 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        {c}
                      </button>
                    );
                  })}
                </div>
                {crossBorderCountries.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{crossBorderCountries.length}/4 selected</p>
                )}
              </div>
            )}

            {/* Nature of Business cascade */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nature of Business (MSIC)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Business Group <span className="text-red-500">*</span></label>
                  <select value={bizNobGroup} onChange={(e) => { setBizNobGroup(e.target.value); setBizNobSub(''); }}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                    <option value="">-- Select Group --</option>
                    {MSIC_GROUPS.map((g) => <option key={g.code} value={g.code}>{g.code} – {g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Nature of Business <span className="text-red-500">*</span></label>
                  <select value={bizNobSub} onChange={(e) => setBizNobSub(e.target.value)}
                    disabled={!bizNobGroup}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400 disabled:opacity-50">
                    <option value="">-- Select first --</option>
                    {nobSubOptions.map((s) => <option key={s.msic} value={s.msic}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">MSIC Code</label>
                  <input value={msicCode} readOnly
                    className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs font-mono bg-gray-50 text-gray-600" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Nature of Business Code <span className="text-red-500">*</span></label>
                  <select value={bizNobCode} onChange={(e) => setBizNobCode(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                    <option value="">-- Select Code --</option>
                    {BIZ_NATURE_CODES.map((c) => <option key={c.code} value={c.code}>{c.code} – {c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Business Description</label>
                  <input value={bizDescription} onChange={(e) => setBizDescription(e.target.value)}
                    placeholder="Brief description of principal business activities"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                </div>
              </div>
            </div>

            {/* Bumiputra + Compliance Classification */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Compliance Classification</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Bumiputra Status <span className="text-red-500">*</span></label>
                  <select value={bumiStatus} onChange={(e) => setBumiStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                    {BUMIPUTRA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Segment Category</label>
                  <select value={segmentCategory} onChange={(e) => setSegmentCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                    <option value="">-- None --</option>
                    <option value="GLC">GLC – Government Link Corporation</option>
                    <option value="LFI">LFI – Large Firms</option>
                    <option value="MNC">MNC – Multinational Corporation</option>
                    <option value="SOE">SOE – State Owned Enterprise</option>
                    <option value="MKD">MKD – Sykt Menteri Kewangan</option>
                  </select>
                </div>
              </div>

              {/* E&S / Green Principle — auto-mapped from Nature of Business Group */}
              <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">E&S Assessment &amp; Green Principle</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      BNM Value-based Intermediation (VBI) framework. Auto-mapped from Nature of Business Group.
                      Select a Business Group above to see the mapping.
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">System-mapped · Read-only</span>
                </div>

                {corpGPData && esRiskData ? (
                  <div className="space-y-3">
                    {/* GP Code + Label */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Green Principle (GP)</p>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                          corpGPData.gp === 'GP1' ? 'bg-green-50 text-green-700 border-green-200'
                          : corpGPData.gp === 'GP2' ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : corpGPData.gp === 'GP3' ? 'bg-gray-100 text-gray-600 border-gray-300'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <span className="font-mono">{corpGPData.gp}</span>
                          <span>·</span>
                          <span>{corpGPData.label.replace(/^GP \d – /, '')}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">E&S Risk Score</p>
                        <span className={`inline-flex items-center px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${esRiskData.scoreBadge}`}>
                          {esRiskData.esScore} Risk
                        </span>
                      </div>
                    </div>

                    {/* GP definitions reference */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {([
                        ['GP 1', 'Climate Change Mitigation',  'Business reduces GHG / enables decarbonisation',   corpGPData.gp === 'GP1'],
                        ['GP 2', 'Climate Change Adaptation',  'Business builds resilience to climate impacts',     corpGPData.gp === 'GP2'],
                        ['GP 3', 'No Significant Harm',        'Neutral environmental impact — no major E&S risk', corpGPData.gp === 'GP3'],
                        ['GP 4', 'Remedial / Transition',      'High-impact industry — transition plan required',   corpGPData.gp === 'GP4'],
                      ] as [string, string, string, boolean][]).map(([code, name, desc, active]) => (
                        <div key={code} className={`rounded px-2 py-1.5 border ${active ? 'border-hlb/30 bg-hlb/5' : 'border-gray-100 bg-white opacity-50'}`}>
                          <span className="font-mono font-semibold text-gray-700">{code}</span>
                          <span className="font-medium text-gray-700 ml-1">{name}</span>
                          <p className="text-gray-400 mt-0.5 text-xs">{desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* Rationale */}
                    <div className="text-xs text-gray-600 bg-white rounded border border-gray-200 px-3 py-2">
                      <span className="font-medium">Rationale: </span>{corpGPData.rationale}
                    </div>

                    {/* Required action */}
                    <div className={`text-xs rounded border px-3 py-2 ${
                      esRiskData.esScore === 'High'   ? 'bg-red-50 border-red-200 text-red-700'
                      : esRiskData.esScore === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-green-50 border-green-200 text-green-700'
                    }`}>
                      <span className="font-medium">Required action: </span>{esRiskData.action}
                    </div>

                    {/* High risk — additional flag */}
                    {esRiskData.requiresAssessment && (
                      <div className="flex items-start gap-2">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="checkbox" className="accent-hlb mt-0.5" />
                          <span className="text-gray-600">
                            E&S assessment checklist completed and attached
                            {esRiskData.esScore === 'High' && <span className="text-red-500 ml-1">*</span>}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded">
                    Select a <strong>Nature of Business Group</strong> above to auto-generate the GP mapping and E&S risk score.
                  </div>
                )}
              </div>
            </div>

            {/* ── Verification result ── */}
            {corpStatus === 'verifying' && (
              <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse py-2">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                Querying SSM / CIF…
              </div>
            )}

            {corpStatus === 'found' && corpVerifyData && (() => {
              const d = corpVerifyData;
              const fmtRM = (n: number) => `RM ${n.toLocaleString('en-MY')}`;
              return (
                <div className="space-y-4">
                  {/* Company profile card */}
                  <div className="border border-blue-200 rounded-lg bg-blue-50 p-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">SSM / Company Profile</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        d.regStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>{d.regStatus}</span>
                    </div>

                    {/* Row 1: read-only from SSM */}
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs">
                      <div className="col-span-2">
                        <p className="text-gray-400 mb-0.5">Company Name</p>
                        <p className="font-semibold text-gray-800">{d.companyName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Reg. Status</p>
                        <p className="font-medium text-gray-800">{d.regStatus}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Paid-up Capital</p>
                        <p className="font-medium text-gray-800">{fmtRM(d.paidUpCapital)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Business Nature</p>
                        <p className="font-medium text-gray-800">{d.businessNature}</p>
                      </div>
                      <div className="col-span-3">
                        <p className="text-gray-400 mb-0.5">Registered Address</p>
                        <p className="font-medium text-gray-800">{d.registeredAddress}</p>
                      </div>
                    </div>

                    {/* Row 2: editable enrichment fields */}
                    <div className="border-t border-blue-200 pt-3 grid grid-cols-3 gap-3">
                      {/* Establishment Date */}
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Establishment Date <span className="text-red-500">*</span></label>
                        <input type="date" value={corpEstDate} onChange={(e) => setCorpEstDate(e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400" />
                      </div>
                      {/* Years in Operation (auto-calc) */}
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Years in Operation</label>
                        <input readOnly value={
                          corpEstDate
                            ? String(new Date().getFullYear() - new Date(corpEstDate).getFullYear())
                            : '–'
                        }
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs bg-gray-50 text-gray-700" />
                      </div>
                      {/* BNM Assigned ID */}
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">BNM Assigned ID</label>
                        <input value={bnmAssignedID} onChange={(e) => setBnmAssignedID(e.target.value)}
                          placeholder="e.g. BNM-0012345"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white font-mono focus:outline-none focus:border-blue-400" />
                      </div>
                      {/* Country of Incorporation */}
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Country of Incorporation <span className="text-red-500">*</span></label>
                        <input value={countryOfIncorp} onChange={(e) => setCountryOfIncorp(e.target.value)}
                          placeholder="Malaysia"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400" />
                      </div>
                      {/* Basic Group (auto-mapped, overridable) */}
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          Basic Group <span className="text-red-500">*</span>
                          {derivedBasicGroup && !basicGroup && <span className="ml-1 text-blue-500">(auto)</span>}
                        </label>
                        <select value={effectiveBasicGroup}
                          onChange={(e) => setBasicGroup(e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400">
                          <option value="">-- Select --</option>
                          {BASIC_GROUP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      {/* Constitution (auto-mapped, overridable) */}
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          Constitution <span className="text-red-500">*</span>
                          {derivedConstitution && !constitution && <span className="ml-1 text-blue-500">(auto)</span>}
                        </label>
                        <select value={effectiveConstitution}
                          onChange={(e) => setConstitution(e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400">
                          <option value="">-- Select --</option>
                          {CONSTITUTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Directors / Shareholders */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Directors / Shareholders ({d.directors.length})
                    </p>
                    {corpDirectors.map((dir) => (
                      <div key={dir.did} className="border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs">
                            <span className="font-medium text-gray-800">{dir.name}</span>
                            <span className="text-gray-400 ml-2">·</span>
                            <span className="text-gray-500 ml-2">{dir.role}</span>
                            <span className="text-gray-400 ml-2">·</span>
                            <span className="text-gray-500 ml-2">{dir.sharesPct}% shares</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {dir.cifStatus === 'verified' && (
                              <span className="text-xs text-green-600 font-medium">CIF ✓</span>
                            )}
                            <button
                              onClick={() => verifyCorpDirector(dir.did)}
                              disabled={dir.cifStatus === 'verifying' || dir.cifStatus === 'verified'}
                              className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                              {dir.cifStatus === 'verifying' ? 'Searching…'
                               : dir.cifStatus === 'verified' ? 'Verified'
                               : 'Search CIF'}
                            </button>
                            {dir.cifStatus === 'verified' && (() => {
                              const alreadyAdded = guarantors.some((g) => g.rawId === dir.nric);
                              return alreadyAdded
                                ? <span className="text-xs text-blue-600 font-medium">Guarantor ✓</span>
                                : (
                                  <button onClick={() => {
                                    setGuarantors((prev) => [...prev, {
                                      gid: `g-${dir.did}`, idType: 'MyKad', rawId: dir.nric,
                                      name: dir.name, phone: dir.cifData?.mobile ?? '', email: dir.cifData?.email ?? '',
                                      emailTouched: false, relToApp: 'Guarantor', roleCode: 'DG',
                                      status: 'verified',
                                      verifyData: { fullName: dir.name, gender: '', dob: '', employer: corpVerifyData?.companyName ?? '', monthlyIncome: 0, ccrisTotal: 0, propertyEquity: 0 },
                                    }]);
                                  }}
                                    className="text-xs px-2.5 py-1 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors">
                                    + Guarantor
                                  </button>
                                );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-xs font-mono text-gray-500">{dir.nric}</p>
                          {/* Designation */}
                          <select
                            value={dir.designation ?? ''}
                            onChange={(e) => setCorpDirectors((prev) => prev.map((d) => d.did === dir.did ? { ...d, designation: e.target.value } : d))}
                            className="border border-gray-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-blue-400 bg-white">
                            <option value="">Designation…</option>
                            {DESIGNATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        {dir.cifStatus === 'verified' && dir.cifData && (
                          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100 text-xs">
                            {([
                              ['CIF No.',  dir.cifData.cif,    'font-mono font-semibold'],
                              ['Mobile',   dir.cifData.mobile, ''],
                              ['Email',    dir.cifData.email,  ''],
                            ] as [string, string, string][]).map(([k, v, cls]) => (
                              <div key={k}>
                                <p className="text-gray-400 mb-0.5">{k}</p>
                                <p className={`text-gray-700 ${cls}`}>{v}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* UBO / Shareholder Structure */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Shareholding Structure &amp; UBO Declaration
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          BNM AML/CFT requirement — identify all individuals with ≥25% direct/indirect ownership.
                          Pre-filled from SSM; add or edit as needed.
                        </p>
                      </div>
                      <button onClick={addShareholder}
                        className="text-xs px-2.5 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                        + Add Shareholder
                      </button>
                    </div>

                    {/* Shareholding total warning */}
                    {totalSharePct > 100 && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                        ⚠ Total shareholding {totalSharePct.toFixed(1)}% exceeds 100% — please review entries.
                      </div>
                    )}

                    {/* Column headers */}
                    {shareholders.length > 0 && (
                      <div className="grid grid-cols-12 gap-1.5 text-xs text-gray-400 font-medium px-1">
                        <div className="col-span-3">Name</div>
                        <div className="col-span-2">ID Type / No.</div>
                        <div className="col-span-2">Nationality</div>
                        <div className="col-span-1 text-center">% Share</div>
                        <div className="col-span-2 text-center">Type / PEP</div>
                        <div className="col-span-2"></div>
                      </div>
                    )}

                    {shareholders.map((sh) => {
                      const pctNum = parseFloat(sh.pct) || 0;
                      const isUBO  = pctNum >= 25;
                      return (
                        <div key={sh.uid} className={`border rounded-lg p-3 space-y-2 ${isUBO ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                          {isUBO && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                UBO — ≥25% Ownership
                              </span>
                              <span className="text-xs text-amber-600">Declaration required below</span>
                            </div>
                          )}
                          <div className="grid grid-cols-12 gap-1.5 items-start">
                            {/* Name */}
                            <div className="col-span-3">
                              <input value={sh.name}
                                onChange={(e) => updateShareholder(sh.uid, 'name', e.target.value)}
                                placeholder="Full legal name"
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                            </div>
                            {/* ID type + number */}
                            <div className="col-span-2 space-y-1">
                              <select value={sh.idType}
                                onChange={(e) => updateShareholder(sh.uid, 'idType', e.target.value as UBOShareholder['idType'])}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400">
                                <option value="NRIC">NRIC</option>
                                <option value="Passport">Passport</option>
                                <option value="Company Reg">Co. Reg</option>
                              </select>
                              <input value={sh.idNo}
                                onChange={(e) => updateShareholder(sh.uid, 'idNo', e.target.value)}
                                placeholder={sh.idType === 'NRIC' ? '######-##-####' : 'ID number'}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                            </div>
                            {/* Nationality */}
                            <div className="col-span-2">
                              <select value={sh.nationality}
                                onChange={(e) => updateShareholder(sh.uid, 'nationality', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                                <option>Malaysian</option>
                                <option>Singapore</option>
                                <option>Chinese</option>
                                <option>British</option>
                                <option>American</option>
                                <option>Indonesian</option>
                                <option>Other</option>
                              </select>
                            </div>
                            {/* % Share */}
                            <div className="col-span-1">
                              <div className="relative">
                                <input type="number" min="0" max="100" value={sh.pct}
                                  onChange={(e) => updateShareholder(sh.uid, 'pct', e.target.value)}
                                  placeholder="0"
                                  className={`w-full border rounded px-2 pr-5 py-1.5 text-xs font-mono focus:outline-none ${isUBO ? 'border-amber-300 focus:border-amber-400' : 'border-gray-300 focus:border-blue-400'}`} />
                                <span className="absolute right-2 top-2 text-xs text-gray-400">%</span>
                              </div>
                            </div>
                            {/* Type toggle + PEP */}
                            <div className="col-span-2 space-y-1.5">
                              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input type="checkbox" checked={sh.isCompany}
                                  onChange={(e) => updateShareholder(sh.uid, 'isCompany', e.target.checked)}
                                  className="accent-hlb" />
                                <span className="text-gray-600">Corporate shareholder</span>
                              </label>
                              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input type="checkbox" checked={sh.isPEP}
                                  onChange={(e) => updateShareholder(sh.uid, 'isPEP', e.target.checked)}
                                  className="accent-amber-500" />
                                <span className={sh.isPEP ? 'text-amber-700 font-medium' : 'text-gray-600'}>PEP flagged</span>
                              </label>
                            </div>
                            {/* Remove */}
                            <div className="col-span-2 flex justify-end pt-1">
                              <button onClick={() => removeShareholder(sh.uid)}
                                className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                Remove
                              </button>
                            </div>
                          </div>

                          {/* Corporate shareholder → needs beneficial owner */}
                          {sh.isCompany && (
                            <div className="pt-2 border-t border-gray-100">
                              <label className="text-xs text-amber-700 block mb-1">
                                ⚠ Corporate shareholder — enter name of natural-person UBO (≥25% of this entity):
                              </label>
                              <input value={sh.beneficialOwner}
                                onChange={(e) => updateShareholder(sh.uid, 'beneficialOwner', e.target.value)}
                                placeholder="Full name of beneficial owner"
                                className="w-full border border-amber-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-amber-400" />
                            </div>
                          )}

                          {/* PEP declaration */}
                          {sh.isPEP && (
                            <div className="pt-2 border-t border-amber-200 bg-amber-50/50 rounded px-2 py-2">
                              <p className="text-xs text-amber-800 font-medium mb-1.5">
                                PEP Declaration Required — is this individual a current or former government official / politically exposed person?
                              </p>
                              <div className="flex gap-4">
                                {(['Yes', 'No'] as const).map((v) => (
                                  <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input type="radio" name={`pep-${sh.uid}`} value={v}
                                      checked={sh.pepDeclaration === v}
                                      onChange={() => updateShareholder(sh.uid, 'pepDeclaration', v)}
                                      className="accent-amber-600" />
                                    <span className={v === 'Yes' ? 'text-amber-700 font-medium' : 'text-gray-600'}>{v}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* UBO Summary */}
                    {uboList.length > 0 && (
                      <div className="border border-blue-200 rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-2">UBO Summary ({uboList.length} identified)</p>
                        {uboList.map((u) => (
                          <div key={u.uid} className="flex items-center justify-between py-1 border-b border-blue-100 last:border-b-0 text-xs">
                            <div>
                              <span className="font-medium text-gray-800">{u.name || '(unnamed)'}</span>
                              <span className="text-gray-500 ml-2">· {u.idNo || 'ID not entered'}</span>
                              <span className="text-gray-400 ml-2">· {u.nationality}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-amber-700">{u.pct}%</span>
                              {u.isPEP && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">PEP</span>}
                              {u.pepDeclaration === '' && u.isPEP && <span className="text-xs text-red-500">Declaration pending</span>}
                            </div>
                          </div>
                        ))}
                        {hasPEPFlag && (
                          <p className="text-xs text-amber-700 mt-2">⚠ PEP identified — case requires Compliance approval before submission.</p>
                        )}
                      </div>
                    )}

                    {shareholders.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">
                        Shareholders auto-populated from SSM after verification. Click "+ Add Shareholder" to add manually.
                      </p>
                    )}
                  </div>

                  {/* Company Contact Details */}
                  <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Contact Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Company Phone <span className="text-red-500">*</span></label>
                        <input type="tel" value={corpPhone} onChange={(e) => setCorpPhone(e.target.value)}
                          placeholder="e.g. 0342801234"
                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Company Email <span className="text-red-500">*</span></label>
                        <input type="email" value={corpEmail}
                          onChange={(e) => setCorpEmail(e.target.value)}
                          onBlur={() => setCorpEmailTouched(true)}
                          placeholder="e.g. info@company.com.my"
                          className={`w-full border rounded px-3 py-1.5 text-xs focus:outline-none ${
                            corpEmailTouched && corpEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(corpEmail)
                              ? 'border-red-400 focus:border-red-400'
                              : 'border-gray-300 focus:border-blue-400'
                          }`} />
                        {corpEmailTouched && corpEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(corpEmail) && (
                          <p className="text-xs text-red-500 mt-0.5">Invalid email format</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 block mb-1">Correspondence Address</label>
                        <input value={corpCorrespondenceAddr} onChange={(e) => setCorpCorrespondenceAddr(e.target.value)}
                          placeholder="Mailing address (if different from registered)"
                          className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                      </div>
                    </div>
                  </div>

                  {/* ── Guarantor & Signatory Requirements ── */}
                  {guarantorRules && (() => {
                    const gr = guarantorRules;
                    const BAND: Record<string, string> = {
                      PG:        'border-blue-200  bg-blue-50',
                      CG:        'border-purple-200 bg-purple-50',
                      PG_or_CG:  'border-indigo-200 bg-indigo-50',
                      none:      'border-green-200  bg-green-50',
                    };
                    const BADGE: Record<string, string> = {
                      PG:        'bg-blue-100   text-blue-700   border-blue-200',
                      CG:        'bg-purple-100 text-purple-700 border-purple-200',
                      PG_or_CG:  'bg-indigo-100 text-indigo-700 border-indigo-200',
                      none:      'bg-green-100  text-green-700  border-green-200',
                    };
                    const BADGE_LABEL: Record<string, string> = {
                      PG:       'PG – 个人担保',
                      CG:       'CG – 企业担保',
                      PG_or_CG: 'PG 或 CG',
                      none:     '无需担保',
                    };
                    const corpGuarantors = guarantors.filter((g) => g.status === 'verified' || g.status === 'idle');
                    const needsGuarantor = gr.mandatory && corpGuarantors.length === 0;
                    return (
                      <div className={`border rounded-lg p-3 space-y-3 ${BAND[gr.guarantorType]}`}>
                        {/* Header row */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-gray-700">担保 &amp; 签约要求</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${BADGE[gr.guarantorType]}`}>
                              {BADGE_LABEL[gr.guarantorType]}
                            </span>
                            {gr.mandatory && (
                              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                强制
                              </span>
                            )}
                            {gr.waivable && (
                              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                可豁免（需信贷批准）
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            Entity {enterpriseType} · {ENTERPRISE_TYPES.find(t=>t.code===enterpriseType)?.label.split('–')[0].trim() ?? ''}
                          </p>
                        </div>

                        {/* Guarantor description */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-400 mb-0.5">担保人要求</p>
                            <p className="text-gray-800 font-medium">{gr.guarantorDesc}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-0.5">签约主体</p>
                            <p className="text-gray-800 font-medium">{gr.signingEntity}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-400 mb-0.5">签字人要求</p>
                            <p className={`font-medium ${gr.allPartnersMustSign ? 'text-amber-700' : 'text-gray-800'}`}>
                              {gr.signatories}
                            </p>
                          </div>
                          {gr.notes && (
                            <div className="col-span-2 text-gray-500 italic">{gr.notes}</div>
                          )}
                        </div>

                        {/* Partnership all-must-sign alert */}
                        {gr.allPartnersMustSign && (
                          <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded px-3 py-2">
                            <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
                            <p className="text-xs text-amber-800 font-medium">
                              合伙企业（E类）：全体合伙人必须共同到场签署——缺少任何一名合伙人签字即构成无效授权，贷款协议不受法律保护。请在进件前确认所有合伙人名单。
                            </p>
                          </div>
                        )}

                        {/* Mandatory PG/CG missing warning */}
                        {needsGuarantor && (
                          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded px-3 py-2">
                            <span className="text-red-500 text-base leading-none mt-0.5">⊘</span>
                            <div>
                              <p className="text-xs text-red-700 font-semibold">尚未添加担保人</p>
                              <p className="text-xs text-red-600 mt-0.5">
                                {gr.guarantorType === 'CG'
                                  ? '请在下方"其他申请人"中添加企业担保人 (Corporate Guarantor，Role Code: CG)。'
                                  : gr.guarantorType === 'PG_or_CG'
                                    ? '请添加海外合伙人 PG 或海外母体 CG（任选其一）。'
                                    : '请在下方"其他申请人"中添加个人担保人并完成 CIF 搜索。'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Guarantors added count */}
                        {corpGuarantors.length > 0 && (
                          <div className="text-xs text-green-700 font-medium">
                            ✓ 已添加 {corpGuarantors.length} 名担保人
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>
        )}
        {/* ── Corporate Business Financials ───────────────────── */}
        {appType === 'Non-Individual' && corpStatus === 'found' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
              Business Financials
            </h2>

            {/* Financial Year row (4 cols: label + 3 years) */}
            <div>
              <p className="text-xs text-gray-400 mb-2">
                Enter 3 years of audited/management accounts. Banks assess trend — growing revenue + stable profit = stronger case.
              </p>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-xs font-medium text-gray-500 flex items-end pb-1">Financial Item</div>
                {[
                  { label: 'Current Year', year: bizFinYearCurrent, setYear: setBizFinYearCurrent, opts: [2026,2025,2024,2023] },
                  { label: 'Previous Year', year: bizFinYearPrev,   setYear: setBizFinYearPrev,   opts: [2025,2024,2023,2022] },
                  { label: '2 Years Ago',  year: bizFinYear2Ago,    setYear: setBizFinYear2Ago,   opts: [2024,2023,2022,2021] },
                ].map(({ label, year, setYear, opts }) => (
                  <div key={label}>
                    <label className="text-xs text-gray-500 block mb-1">{label}</label>
                    <select value={year} onChange={(e) => setYear(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                      {opts.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 3-column financial figure table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-4 gap-0 bg-gray-50 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-500 px-3 py-2">Item</div>
                {[bizFinYearCurrent, bizFinYearPrev, bizFinYear2Ago].map((y) => (
                  <div key={y} className="text-xs font-medium text-gray-500 px-3 py-2 text-right border-l border-gray-200">{y} (RM)</div>
                ))}
              </div>

              {/* Annual Sales Turnover */}
              {([
                {
                  label: 'Annual Sales Turnover',
                  required: true,
                  hint: 'Total revenue from all business activities before any deductions.',
                  vals: [bizTurnoverCurr, bizTurnoverPrev, bizTurnover2Ago],
                  sets: [setBizTurnoverCurr, setBizTurnoverPrev, setBizTurnover2Ago],
                },
                {
                  label: 'Annual Net Profit / (Loss)',
                  required: true,
                  hint: 'Profit after all expenses, depreciation, and tax. Negative = loss (highlighted in amber).',
                  vals: [bizNetProfitCurr, bizNetProfitPrev, bizNetProfit2Ago],
                  sets: [setBizNetProfitCurr, setBizNetProfitPrev, setBizNetProfit2Ago],
                },
              ] as { label: string; required: boolean; hint: string; vals: string[]; sets: ((v: string) => void)[] }[]).map((row) => (
                <div key={row.label} className="grid grid-cols-4 gap-0 border-b border-gray-100 last:border-b-0">
                  <div className="px-3 py-2">
                    <div className="text-xs text-gray-700 font-medium">
                      {row.label} {row.required && <span className="text-red-500">*</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{row.hint}</div>
                  </div>
                  {row.vals.map((v, i) => {
                    const isLoss = v && parseFloat(v) < 0;
                    return (
                      <div key={i} className={`border-l border-gray-200 px-2 py-2 ${isLoss ? 'bg-amber-50' : ''}`}>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-xs text-gray-400">RM</span>
                          <input type="number" value={v}
                            onChange={(e) => row.sets[i](e.target.value)}
                            placeholder="0"
                            className={`w-full border rounded pl-8 pr-2 py-1 text-xs font-mono focus:outline-none ${isLoss ? 'border-amber-300 text-amber-700 focus:border-amber-400' : 'border-gray-300 focus:border-blue-400'}`} />
                        </div>
                        {isLoss && <p className="text-xs text-amber-600 mt-0.5">Loss</p>}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Net Profit Margin row (auto-calc) */}
              {(bizNetProfitCurr || bizNetProfitPrev || bizNetProfit2Ago) && (
                <div className="grid grid-cols-4 gap-0 bg-gray-50 border-t border-gray-200">
                  <div className="px-3 py-2 text-xs text-gray-500 font-medium">Net Profit Margin</div>
                  {[
                    [bizNetProfitCurr, bizTurnoverCurr],
                    [bizNetProfitPrev, bizTurnoverPrev],
                    [bizNetProfit2Ago, bizTurnover2Ago],
                  ].map(([p, t], i) => {
                    const margin = p && t && parseFloat(t) > 0
                      ? ((parseFloat(p) / parseFloat(t)) * 100).toFixed(1)
                      : null;
                    return (
                      <div key={i} className="border-l border-gray-200 px-3 py-2 text-xs font-mono font-semibold text-right">
                        {margin ? (
                          <span className={parseFloat(margin) < 0 ? 'text-red-600' : parseFloat(margin) < 5 ? 'text-amber-600' : 'text-green-700'}>
                            {margin}%
                          </span>
                        ) : '–'}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Asset Size + Customer Sector auto-calc */}
            {bizTurnoverCurr && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Asset Size <span className="text-gray-400 font-normal">(auto-calculated from current year turnover)</span>
                  </label>
                  <input value={assetSizeTier?.label ?? '–'} readOnly
                    className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs bg-gray-50 text-gray-700" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Customer Sector <span className="text-gray-400 font-normal">(Bumiputra Status × SME size)</span>
                  </label>
                  <input value={customerSector ?? '–'} readOnly
                    className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs bg-gray-50 text-gray-700" />
                </div>
              </div>
            )}

            {/* Corporate Facility Schedule */}
            <div className="border border-gray-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Existing Banking Facilities</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Declare all active facilities from ALL banks. Monthly commitments feed into Business DSR.
                    Verified against CCRIS during credit assessment.
                  </p>
                </div>
                <button onClick={addCorpFacility}
                  className="text-xs px-2.5 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                  + Add Facility
                </button>
              </div>

              {corpFacilities.length > 0 && (
                <>
                  <div className="grid grid-cols-12 gap-1.5 text-xs text-gray-400 font-medium px-1">
                    <div className="col-span-2">Bank</div>
                    <div className="col-span-2">Facility Type</div>
                    <div className="col-span-2">Limit (RM)</div>
                    <div className="col-span-2">Outstanding (RM)</div>
                    <div className="col-span-1">Mthly (RM)</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Purpose</div>
                    <div className="col-span-1"></div>
                  </div>
                  {corpFacilities.map((f) => {
                    const overLimit = (parseFloat(f.outstanding)||0) > (parseFloat(f.limit)||0) && parseFloat(f.limit) > 0;
                    return (
                      <div key={f.fid} className={`grid grid-cols-12 gap-1.5 items-start border rounded p-2 ${overLimit ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="col-span-2">
                          <select value={f.bank} onChange={(e) => updateCorpFacility(f.fid, 'bank', e.target.value)}
                            className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white">
                            <option value="">-- Bank --</option>
                            {MY_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <select value={f.facilityType} onChange={(e) => updateCorpFacility(f.fid, 'facilityType', e.target.value)}
                            className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white">
                            <option value="">-- Type --</option>
                            {FACILITY_TYPES_CORP.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input type="number" value={f.limit} onChange={(e) => updateCorpFacility(f.fid, 'limit', e.target.value)}
                            placeholder="0" className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-400 bg-white" />
                        </div>
                        <div className="col-span-2">
                          <input type="number" value={f.outstanding} onChange={(e) => updateCorpFacility(f.fid, 'outstanding', e.target.value)}
                            placeholder="0"
                            className={`w-full border rounded px-2 py-1 text-xs font-mono focus:outline-none bg-white ${overLimit ? 'border-red-400' : 'border-gray-300 focus:border-blue-400'}`} />
                          {overLimit && <p className="text-xs text-red-500 mt-0.5">Exceeds limit</p>}
                        </div>
                        <div className="col-span-1">
                          <input type="number" value={f.monthly} onChange={(e) => updateCorpFacility(f.fid, 'monthly', e.target.value)}
                            placeholder="0" disabled={f.status !== 'Active'}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-400 bg-white disabled:opacity-40" />
                        </div>
                        <div className="col-span-1">
                          <select value={f.status} onChange={(e) => updateCorpFacility(f.fid, 'status', e.target.value as Facility['status'])}
                            className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white">
                            <option value="Active">Active</option>
                            <option value="Settled">Settled</option>
                            <option value="Written Off">W/Off</option>
                          </select>
                        </div>
                        <div className="col-span-1">
                          <input value={f.purpose} onChange={(e) => updateCorpFacility(f.fid, 'purpose', e.target.value)}
                            placeholder="purpose"
                            className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white" />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button onClick={() => removeCorpFacility(f.fid)}
                            className="text-xs text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50">✕</button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Total row */}
                  <div className="grid grid-cols-12 gap-1.5 text-xs px-1 pt-1 border-t border-gray-200 font-semibold">
                    <div className="col-span-4 text-gray-600">Total (Active)</div>
                    <div className="col-span-2 font-mono text-gray-700">
                      RM {corpFacilities.filter(f=>f.status==='Active').reduce((s,f)=>s+(parseFloat(f.limit)||0),0).toLocaleString('en-MY')}
                    </div>
                    <div className="col-span-2 font-mono text-gray-700">
                      RM {corpFacilities.filter(f=>f.status==='Active').reduce((s,f)=>s+(parseFloat(f.outstanding)||0),0).toLocaleString('en-MY')}
                    </div>
                    <div className="col-span-1 font-mono text-blue-700">
                      RM {corpFacilityTotal.toLocaleString('en-MY')}
                    </div>
                    <div className="col-span-3 text-blue-600">← used in Business DSR</div>
                  </div>
                </>
              )}
              {corpFacilities.length === 0 && (
                <div className="text-center py-3 border border-dashed border-gray-200 rounded">
                  <p className="text-xs text-gray-400">No facilities declared. Use manual fields below if facility schedule not applicable.</p>
                </div>
              )}
            </div>

            {/* Business DSR */}
            {bizNetProfit && bizTurnover && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Debt Service Ratio (Business)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">
                      Existing Commitments / Month (RM)
                      {corpFacilityTotal > 0 && <span className="text-gray-400 ml-1">(overridden by facility schedule)</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-gray-400">RM</span>
                      <input type="number"
                        value={corpFacilityTotal > 0 ? String(corpFacilityTotal) : bizExistingCredit}
                        onChange={(e) => { if (corpFacilityTotal === 0) setBizExistingCredit(e.target.value); }}
                        readOnly={corpFacilityTotal > 0}
                        placeholder="0"
                        className={`w-full border border-gray-300 rounded pl-9 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400 ${corpFacilityTotal > 0 ? 'opacity-60 cursor-not-allowed' : ''}`} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">This Loan Installment / Month (RM)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-gray-400">RM</span>
                      <input type="number" value={bizInstallment} onChange={(e) => setBizInstallment(e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded pl-9 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ['Monthly Net Profit',   `RM ${(parseFloat(bizNetProfit) / 12).toLocaleString('en-MY', { maximumFractionDigits: 0 })}`],
                    ['Monthly Turnover',     `RM ${(parseFloat(bizTurnover)  / 12).toLocaleString('en-MY', { maximumFractionDigits: 0 })}`],
                    ['Business DSR',         bizDSR ? `${bizDSR}%` : '–'],
                  ] as [string, string][]).map(([label, val]) => (
                    <div key={label} className={`rounded-lg p-3 border text-xs ${
                      label === 'Business DSR' && bizDSR && parseFloat(bizDSR) > 70
                        ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
                    }`}>
                      <p className="text-gray-400 mb-1">{label}</p>
                      <p className={`font-semibold ${label === 'Business DSR' && bizDSR && parseFloat(bizDSR) > 70 ? 'text-red-600' : 'text-gray-800'}`}>{val}</p>
                    </div>
                  ))}
                </div>
                {bizDSR && parseFloat(bizDSR) > 70 && (
                  <p className="text-xs text-red-600">⚠ Business DSR exceeds 70% — requires credit assessment justification.</p>
                )}
              </div>
            )}

            {/* ── Employee & Capital enrichment ── */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Workforce & Capital</p>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Employees (Actual) <span className="text-red-500">*</span></label>
                  <input type="number" min="0" value={employeeActual} onChange={(e) => setEmployeeActual(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Full-time Range <span className="text-red-500">*</span></label>
                  <select value={employeeRange} onChange={(e) => setEmployeeRange(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                    <option value="">-- Select --</option>
                    {EMPLOYEE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Turnover Range <span className="text-red-500">*</span></label>
                  <select value={turnoverRangeVal} onChange={(e) => setTurnoverRangeVal(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                    <option value="">-- Select --</option>
                    {TURNOVER_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Authorized Capital (RM)</label>
                  <input type="number" min="0" value={authorizedCapital} onChange={(e) => setAuthorizedCapital(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Paid-Up Capital (RM)</label>
                  <input type="number" min="0" value={paidUpCapital} onChange={(e) => setPaidUpCapital(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Primary Income Doc <span className="text-red-500">*</span></label>
                  <select value={primaryIncomeDoc} onChange={(e) => setPrimaryIncomeDoc(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                    <option value="">-- Select --</option>
                    {PRIMARY_INCOME_DOC_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Source of Repayment</label>
                  <select value={sourceOfRepayment} onChange={(e) => setSourceOfRepayment(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                    {SOURCE_OF_REPAYMENT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Scope & Tax ─────────────────────────────────────── */}
        {appType === 'Non-Individual' && corpStatus === 'found' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
              Scope &amp; Tax
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {/* Country of Operation */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Country of Operation <span className="text-red-500">*</span></label>
                <input value={countryOfOperation} onChange={(e) => setCountryOfOperation(e.target.value)}
                  placeholder="Malaysia"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
              </div>
              {/* State of Operation */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">State of Operation <span className="text-red-500">*</span></label>
                <select value={stateOfOperation} onChange={(e) => setStateOfOperation(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                  <option value="">-- Select State --</option>
                  {MALAYSIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* Place of Registration */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Place of Registration</label>
                <select value={placeOfRegCode} onChange={(e) => { setPlaceOfRegCode(e.target.value); setRegStateCode(''); }}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                  <option value="">-- Select --</option>
                  {PLACE_OF_REG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {/* Registered State Code — only for option 4 */}
              {placeOfRegCode === '4' && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Registered State Code <span className="text-red-500">*</span></label>
                  <select value={regStateCode} onChange={(e) => setRegStateCode(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                    <option value="">-- Select --</option>
                    {KL_LABUAN_STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              )}
              {/* TIN */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Tax Identification No. (TIN) <span className="text-red-500">*</span>
                </label>
                <input value={corpTIN} onChange={(e) => setCorpTIN(e.target.value)}
                  placeholder="e.g. C12345678901"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
              </div>
              {/* SST */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Sales &amp; Service Tax No. (SST)</label>
                <input value={corpSST} onChange={(e) => setCorpSST(e.target.value)}
                  placeholder="e.g. W10-1234-12345678"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
              </div>
              {/* FEN Resident Status */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">FEN Resident Status <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  {['Resident', 'Non-Resident'].map((v) => (
                    <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="radio" name="fenResident" value={v} checked={fenResident === v}
                        onChange={() => setFenResident(v)} className="accent-hlb" />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              {/* Labuan Entity */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Labuan Entity <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  {['Yes', 'No'].map((v) => (
                    <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="radio" name="labuanEntity" value={v} checked={labuanEntity === v}
                        onChange={() => setLabuanEntity(v)} className="accent-hlb" />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {labuanEntity === 'Yes' && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                <span className="text-blue-500 text-sm leading-none mt-0.5">ℹ</span>
                <p className="text-xs text-blue-700">Labuan entity — subject to Labuan Business Activity Tax Act 1990. Ensure Labuan FSA licensing status is verified.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Compliance Checks ───────────────────────────────── */}
        {appType === 'Non-Individual' && corpStatus === 'found' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
              Compliance Checks
            </h2>
            <p className="text-xs text-gray-400">AML/CFT due diligence — all questions mandatory before submission.</p>

            {([
              {
                id: 'complexStructure', val: complexStructure, set: setComplexStructure,
                q: 'Does the customer have a complex ownership structure such that the UBO could not be identified?',
                warning: complexStructure === 'Yes'
                  ? 'UBO not identified — escalate to Compliance for Enhanced Due Diligence (EDD) before proceeding.'
                  : '',
              },
              {
                id: 'nomineeShares', val: hasNomineeShares, set: setHasNomineeShares,
                q: 'Does the customer have nominee shareholders or issue bearer shares?',
                warning: hasNomineeShares === 'Yes'
                  ? 'Nominee shareholders / bearer shares detected — additional Beneficial Ownership Declaration form required.'
                  : '',
              },
            ] as { id: string; val: string; set: (v: string) => void; q: string; warning: string }[]).map(({ id, val, set, q, warning }) => (
              <div key={id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-gray-700">{q} <span className="text-red-500">*</span></p>
                <div className="flex gap-6">
                  {['Yes', 'No'].map((v) => (
                    <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="radio" name={id} value={v} checked={val === v}
                        onChange={() => set(v)}
                        className={v === 'Yes' ? 'accent-amber-500' : 'accent-green-600'} />
                      <span className={val === v && v === 'Yes' ? 'text-amber-700 font-semibold' : 'text-gray-700'}>{v}</span>
                    </label>
                  ))}
                  {!val && <span className="text-xs text-gray-400 italic">Please select</span>}
                </div>
                {warning && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                    <span className="text-amber-500 text-sm leading-none mt-0.5">⚠</span>
                    <p className="text-xs text-amber-700">{warning}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Customer Confirmation ───────────────────────────── */}
        {appType === 'Non-Individual' && corpStatus === 'found' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">5</span>
              Customer Confirmation &amp; Consent
            </h2>

            {/* Contact log */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Record</p>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Face-to-Face Onboarding? <span className="text-red-500">*</span></label>
                  <div className="flex gap-4 mt-2">
                    {['Yes', 'No'].map((v) => (
                      <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="radio" name="faceToFace" value={v} checked={isFaceToFace === v}
                          onChange={() => setIsFaceToFace(v)} className="accent-hlb" />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Date of Contact <span className="text-red-500">*</span></label>
                  <input type="date" value={dateOfContact} onChange={(e) => setDateOfContact(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Time (24h) <span className="text-red-500">*</span></label>
                  <input type="time" value={timeOfContact} onChange={(e) => setTimeOfContact(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Mode of Contact <span className="text-red-500">*</span></label>
                  <select value={modeOfContact} onChange={(e) => setModeOfContact(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                    <option value="">-- Select --</option>
                    {['Office Phone','Mobile Phone','Branch Visit','Video Call','Email','Others'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Contacted By (Staff ID / Name) <span className="text-red-500">*</span></label>
                  <input value={contactedBy} onChange={(e) => setContactedBy(e.target.value)}
                    placeholder="e.g. 38047 · Ahmad Razif"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                </div>
              </div>
            </div>

            {/* Customer confirmations */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer Declarations</p>
              <div className="space-y-2">
                {([
                  {
                    id: 'confirmedHP', val: customerConfirmedHP, set: setCustomerConfirmedHP,
                    label: 'Customer confirmed intention to proceed with HP application',
                  },
                  {
                    id: 'agreedEmail', val: customerAgreedEmail, set: setCustomerAgreedEmail,
                    label: 'Customer agreed to receive Agreement & Appendix via email',
                  },
                  {
                    id: 'marketing', val: marketingConsent, set: setMarketingConsent,
                    label: 'Customer consented to HLB/HLISB marketing communications',
                  },
                ] as { id: string; val: string; set: (v: string) => void; label: string }[]).map(({ id, val, set, label }) => (
                  <div key={id} className="flex items-center justify-between border border-gray-100 rounded px-3 py-2">
                    <p className="text-xs text-gray-700 flex-1 pr-4">{label} <span className="text-red-500">*</span></p>
                    <div className="flex gap-4 shrink-0">
                      {['Yes', 'No'].map((v) => (
                        <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="radio" name={id} value={v} checked={val === v}
                            onChange={() => set(v)} className="accent-hlb" />
                          <span className={val === v ? (v === 'Yes' ? 'text-green-700 font-medium' : 'text-red-600 font-medium') : 'text-gray-600'}>{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {/* PDS checkbox */}
                <div className="border border-gray-100 rounded px-3 py-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={pdsConfirmed} onChange={(e) => setPdsConfirmed(e.target.checked)}
                      className="accent-hlb mt-0.5 w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs text-gray-700">
                      Product Disclosure Sheet (PDS) has been provided to and acknowledged by the customer. <span className="text-red-500">*</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 4.7 Channel Information ────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
            Channel Information
          </h2>

          {/* Row 1: Loan Type + Product Group */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Loan / Financing Type <span className="text-red-500">*</span>
              </label>
              <div className="inline-flex rounded-md border border-gray-300 overflow-hidden w-full">
                {(['Conventional', 'Islamic'] as const).map((t) => (
                  <button key={t} onClick={() => setLoanType(t)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${loanType === t ? 'bg-hlb text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Product Group <span className="text-red-500">*</span>
              </label>
              <div className="inline-flex rounded-md border border-gray-300 overflow-hidden w-full">
                {(['HP', 'IHP'] as const).map((g) => (
                  <button key={g} onClick={() => setProductGroup(g)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${productGroup === g ? 'bg-hlb text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Type (auto-populated) */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Product Type</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 font-medium">
              {productType}
            </div>
          </div>

          {/* Row 2: Vehicle Type + Source */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="">-- Select --</option>
                {['New', 'Used', 'Recond', 'Others'].map((v) => (
                  <option key={v} value={v.toLowerCase()}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Source <span className="text-red-500">*</span>
              </label>
              <select value={source} onChange={(e) => setSource(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="099">099 (Default)</option>
                <option value="180">180 (Dealer API)</option>
                <option value="BRNHP">BRNHP (Branch Refer)</option>
              </select>
            </div>
          </div>

          {/* Special Tags */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Special Tag</label>
            <div className="flex flex-wrap gap-2">
              {['HP Line', 'Fleet Purchase'].map((tag) => (
                <button key={tag} onClick={() => toggleSpecialTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    specialTags.includes(tag)
                      ? 'bg-hlb text-white border-hlb'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}>
                  {specialTags.includes(tag) ? '✓ ' : ''}{tag}
                </button>
              ))}
              <span className="px-3 py-1 rounded-full text-xs text-gray-400 border border-dashed border-gray-300 cursor-not-allowed">
                Dealer API (auto)
              </span>
            </div>
          </div>

          {/* Officer / Branch row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Attending Officer</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 font-mono">
                Ahmad Razif · SO-00421
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Cannot be modified</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Sales Officer + ID <span className="text-red-500">*</span>
              </label>
              <input value={salesOfficer} onChange={(e) => setSalesOfficer(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Closing Branch <span className="text-red-500">*</span>
              </label>
              <input value={closingBranch} onChange={(e) => setClosingBranch(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Branch Manager <span className="text-red-500">*</span>
              </label>
              <input value={branchManager} onChange={(e) => setBranchManager(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Delivery Channel <span className="text-red-500">*</span>
              </label>
              <select value={deliveryChannel} onChange={(e) => setDeliveryChannel(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="">-- Select --</option>
                {['Branch Walk-in', 'Dealer Referral', 'Direct Sales', 'Online'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Referral Officer</label>
              <input value={referralOfficer} onChange={(e) => setReferralOfficer(e.target.value)}
                placeholder="Employee ID (optional)"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          {/* Syariah Compliance – conditional for Non-Individual + Islamic */}
          {appType === 'Non-Individual' && loanType === 'Islamic' && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <label className="text-xs text-gray-700 font-medium block mb-1">
                Syariah Compliance Approval Obtained <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Required for non-individual Islamic financing. Attach approval email.</p>
              <input type="file" accept=".pdf,.eml,.msg"
                className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:bg-white" />
            </div>
          )}

          {/* Generate Ref No */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button onClick={generateRefNo}
              className="px-4 py-2 text-sm font-medium rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors">
              Generate Ref No
            </button>
            {refNo && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-gray-800 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded">
                  {refNo}
                </span>
                <span className="text-xs text-green-600">EF No. generated</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 4.11 Vehicle Information ───────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
            Vehicle Information
            {vehicleType && (
              <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                {vehicleType}
              </span>
            )}
          </h2>

          {/* Cascading selects: Make → Family → Year → Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Make <span className="text-red-500">*</span></label>
              <select value={vehMake} onChange={(e) => handleVehMake(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="">-- Select Make --</option>
                {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Family <span className="text-red-500">*</span></label>
              <select value={vehFamily} onChange={(e) => handleVehFamily(e.target.value)}
                disabled={!vehMake}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400">
                <option value="">-- Select Family --</option>
                {availableFamilies.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                {isUsedVehicle ? 'Manufacture Year' : 'Manufacture Year'}
                <span className="text-red-500"> *</span>
              </label>
              {isUsedVehicle ? (
                <select value={vehYear} onChange={(e) => handleVehYear(e.target.value)}
                  disabled={!vehFamily}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400">
                  <option value="">-- Select Year --</option>
                  {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              ) : (
                <input type="number" min={2000} max={new Date().getFullYear() + 1}
                  value={vehYear} onChange={(e) => handleVehYear(e.target.value)}
                  disabled={!vehFamily}
                  placeholder="e.g. 2024"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400" />
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Model <span className="text-red-500">*</span></label>
              <select value={vehModel} onChange={(e) => setVehModel(e.target.value)}
                disabled={!vehYear || availableModels.length === 0}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400">
                <option value="">-- Select Model --</option>
                {availableModels.map((m) => (
                  <option key={m.model} value={m.model}>{m.model}</option>
                ))}
                {vehYear && availableModels.length === 0 && (
                  <option disabled>No data for this year</option>
                )}
              </select>
            </div>
          </div>

          {/* Price fields */}
          {selectedModelData && (
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">MSRP (List Price)</p>
                <p className="text-sm font-semibold text-gray-800">
                  RM {selectedModelData.msrp.toLocaleString()}
                </p>
              </div>
              {isUsedVehicle && selectedModelData.marketValue && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Market Value</p>
                  <p className="text-sm font-semibold text-blue-700">
                    RM {selectedModelData.marketValue.toLocaleString()}
                  </p>
                </div>
              )}
              <div className={isUsedVehicle ? '' : 'col-span-2'}>
                <label className="text-xs text-gray-500 block mb-1">
                  Purchase Price <span className="text-red-500">*</span>
                </label>
                <input type="number" value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="Transaction price"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            </div>
          )}

          {/* Matrix fields – auto-populated after model selection */}
          {selectedModelData && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Vehicle Matrix (Auto-populated)
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                {[
                  ['Engine Type',      selectedModelData.engineType],
                  ['BNM Loan Purpose', selectedModelData.bnmPurpose],
                  ['Green Vehicle',    selectedModelData.green ? 'Yes (Green)' : 'No'],
                  ['GP Rating',        selectedModelData.gpRating],
                  ['Greenlane',        selectedModelData.greenlane ? 'Yes' : 'No'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-400">{label}</span>
                    <span className={`font-medium ${
                      value === 'Yes (Green)' || value === 'Yes' ? 'text-green-600' : 'text-gray-700'
                    }`}>{value}</span>
                  </div>
                ))}
              </div>

              {/* E&S note for individual — derived from vehicle green status */}
              <div className={`mt-3 text-xs rounded border px-3 py-2 ${
                selectedModelData.green
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : selectedModelData.gpRating === 'C'
                    ? 'bg-gray-50 border-gray-200 text-gray-500'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                <p className="font-medium mb-0.5">E&S / Green Principle (Vehicle)</p>
                {selectedModelData.green
                  ? <p>GP 1 – Climate Change Mitigation: This is a green/hybrid vehicle that supports BNM VBI green financing objectives. May qualify for Green Vehicle Incentive campaign rate.</p>
                  : selectedModelData.gpRating === 'B'
                    ? <p>GP 3 – No Significant Harm: Standard conventional vehicle. No additional E&S assessment required.</p>
                    : <p>GP 3 – No Significant Harm: Standard vehicle. No E&S restrictions apply.</p>
                }
                <p className="mt-1 text-gray-400">GP Rating {selectedModelData.gpRating} · {selectedModelData.engineType}</p>
              </div>
            </div>
          )}

          {/* Dealer/vehicle type mismatch hint */}
          {vehicleType && selectedModelData && isUsedVehicle && !selectedModelData.marketValue && (
            <p className="text-xs text-amber-600">
              ⚠ No market value found in the vehicle library for this model/year combination.
            </p>
          )}
        </div>

        {/* ── 4.12 Loan Program ──────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
            Loan Program
          </h2>

          {/* Product Code */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Product Code <span className="text-red-500">*</span>
            </label>
            <select value={loanProductCode} onChange={(e) => handleProductCodeChange(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
              <option value="">-- Select Product Code --</option>
              {PRODUCT_CODES.map((p) => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Product attributes row */}
          {selectedProduct && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
              {[
                ['Rate Type',        selectedProduct.rateType],
                ['Calc. Mode',       selectedProduct.calcMode],
                ['Payment Freq.',    'Monthly'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-400 mb-0.5">{k}</p>
                  <p className="font-medium text-gray-700">{v}</p>
                </div>
              ))}
              {selectedProduct.rateType === 'Variable' && (
                <div className="col-span-3 pt-2 border-t border-gray-200">
                  <p className="text-gray-400 mb-0.5">Base Rate</p>
                  <p className="font-medium text-gray-700">{selectedProduct.base}</p>
                </div>
              )}
            </div>
          )}

          {/* HP+ Plus fee table */}
          {selectedProduct?.hpPlus && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
              <p className="text-xs font-semibold text-blue-700">HP+ Plus Fees</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-blue-100">
                    <th className="text-left pb-1 font-normal">Fee</th>
                    <th className="text-left pb-1 font-normal">Frequency</th>
                    <th className="text-right pb-1 font-normal">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {HP_PLUS_FEES.map((f) => (
                    <tr key={f.name} className="border-b border-blue-100 last:border-0">
                      <td className="py-1 text-gray-700">{f.name}</td>
                      <td className="py-1 text-gray-500">{f.frequency}</td>
                      <td className="py-1 text-right font-medium text-gray-800">RM {f.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Package Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Package Code <span className="text-red-500">*</span>
              </label>
              <select value={loanPackageCode} onChange={(e) => setLoanPackageCode(e.target.value)}
                disabled={availablePackages.length === 0}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400">
                <option value="">-- Select Package --</option>
                {availablePackages.map((p) => (
                  <option key={p.code} value={p.code}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Campaign Code */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Campaign Code</label>
              <select value={campaignCode} onChange={(e) => setCampaignCode(e.target.value)}
                disabled={!loanProductCode}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400">
                <option value="">-- None --</option>
                {CAMPAIGNS.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Campaign details */}
          {selectedCampaign && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-xs space-y-1">
              <p className="font-semibold text-yellow-700">{selectedCampaign.label}</p>
              <p className="text-yellow-600">
                EIR Range: <span className="font-mono font-semibold">
                  {selectedCampaign.minEIR.toFixed(2)}% – {selectedCampaign.maxEIR.toFixed(2)}%
                </span>
              </p>
            </div>
          )}

          {/* ── EIR + Rate back-calculation ─────────────────── */}
          {selectedProduct && loanPackageCode && (
            <div className="space-y-4 pt-3 border-t border-gray-100">
              {/* Loan Amount + Tenure */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Loan Amount (RM) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Tenure (months) <span className="text-red-500">*</span>
                  </label>
                  <select value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">-- Select --</option>
                    {[12,24,36,48,60,72,84,96,108].map((m) => (
                      <option key={m} value={m}>{m} months ({m/12} yr{m > 12 ? 's' : ''})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* EIR input + back-calculated rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    EIR (%) <span className="text-red-500">*</span>
                    {selectedCampaign && (
                      <span className="ml-1 text-gray-400 font-normal">
                        range {selectedCampaign.minEIR.toFixed(2)}–{selectedCampaign.maxEIR.toFixed(2)}%
                      </span>
                    )}
                  </label>
                  <input
                    type="number" step="0.01" value={eirValue}
                    onChange={(e) => setEirValue(e.target.value)}
                    placeholder="e.g. 3.20"
                    className={`w-full border rounded px-3 py-2 text-sm font-mono focus:outline-none ${
                      eirHardBlock    ? 'border-red-500 bg-red-50'
                      : eirOutOfRange ? 'border-amber-400 bg-amber-50'
                      : eirNum > 0   ? 'border-green-400'
                      : 'border-gray-300 focus:border-blue-400'
                    }`}
                  />
                  {/* Validation messages */}
                  {eirHardBlock && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      EIR must be between {ABS_MIN}% – {ABS_MAX}%. Cannot submit.
                    </p>
                  )}
                  {!eirHardBlock && eirOutOfRange && (
                    <p className="text-xs text-amber-600 mt-1">
                      Outside campaign range. Requires price approver review.
                    </p>
                  )}
                  {!eirHardBlock && !eirOutOfRange && eirNum > 0 && (
                    <p className="text-xs text-green-600 mt-1">EIR within acceptable range ✓</p>
                  )}
                </div>

                {/* Back-calculated field */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    {backCalcLabel} (%) — auto-calculated
                  </label>
                  <div className={`px-3 py-2 rounded border text-sm font-mono ${
                    backCalcRate ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-gray-50 border-gray-100 text-gray-300'
                  }`}>
                    {backCalcRate ? `${backCalcRate}%` : '—'}
                  </div>
                  {isVariable && backCalcRate && (
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedProduct.base} + Spread {backCalcRate}%
                    </p>
                  )}
                  {!isVariable && backCalcRate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Approx. ({isIslamic ? 'Profit' : 'Interest'} Rate = EIR ÷ 1.84)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Repayment Calculation ──────────────────────── */}
          {(() => {
            const P = parseFloat(loanAmount);
            const N = parseInt(tenureMonths);
            if (!P || !N || !eirNum || eirHardBlock || !backCalcRate || !selectedProduct) return null;

            const nominalRate = parseFloat(backCalcRate);
            const calcMethodStr = selectedProduct.calcMode;
            type Row = { period: number; installment: number; interest: number; principal: number; balance: number };
            let installment = 0, totalInterest = 0;
            const schedule: Row[] = [];

            if (calcMethodStr === 'Sum of Digit') {
              totalInterest = P * (nominalRate / 100) * (N / 12);
              installment   = (P + totalInterest) / N;
              const SOD = N * (N + 1) / 2;
              let bal = P;
              for (let i = 1; i <= N; i++) {
                const int  = ((N - i + 1) / SOD) * totalInterest;
                const prin = installment - int;
                bal -= prin;
                schedule.push({ period: i, installment, interest: int, principal: prin, balance: Math.max(0, bal) });
              }
            } else {
              const r = eirNum / 100 / 12;
              installment = P * r / (1 - Math.pow(1 + r, -N));
              let bal = P;
              for (let i = 1; i <= N; i++) {
                const int  = bal * r;
                const prin = i < N ? installment - int : bal;
                totalInterest += int;
                bal -= prin;
                schedule.push({ period: i, installment: i < N ? installment : int + prin, interest: int, principal: prin, balance: Math.max(0, bal) });
              }
            }

            const fmt = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const displayRows: (Row | null)[] = N <= 5
              ? schedule
              : [...schedule.slice(0, 3), null, schedule[N - 1]];

            return (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                {/* Summary cards */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Repayment Summary
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ['Monthly Installment',     `RM ${fmt(installment)}`],
                    ['Total Interest / Charges', `RM ${fmt(totalInterest)}`],
                    ['Total Repayment',          `RM ${fmt(P + totalInterest)}`],
                  ] as [string, string][]).map(([label, val]) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Margin of Finance (LTV) */}
                {(() => {
                  const pp = parseFloat(purchasePrice);
                  if (!pp || pp <= 0) return null;
                  const ltv     = (P / pp) * 100;
                  const deposit = pp - P;
                  const ltvOk   = ltv <= 90;
                  return (
                    <div className={`flex items-center gap-6 px-4 py-2.5 rounded-lg border text-xs ${
                      ltvOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-300'
                    }`}>
                      <div>
                        <span className="text-gray-400">Purchase Price </span>
                        <span className="font-mono font-semibold text-gray-800">RM {fmt(pp)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Loan Amount </span>
                        <span className="font-mono font-semibold text-gray-800">RM {fmt(P)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Deposit </span>
                        <span className="font-mono font-semibold text-gray-800">RM {fmt(deposit)}</span>
                      </div>
                      <div className="ml-auto">
                        <span className="text-gray-400">Margin of Finance </span>
                        <span className={`font-bold font-mono text-base ${ltvOk ? 'text-green-700' : 'text-red-600'}`}>
                          {ltv.toFixed(1)}%
                        </span>
                        {!ltvOk && <span className="ml-1 text-red-500 font-medium">⚠ Exceeds 90%</span>}
                      </div>
                    </div>
                  );
                })()}

                {/* Amortization table */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Repayment Schedule <span className="font-normal normal-case text-gray-400">({calcMethodStr})</span>
                </p>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-400">
                      <tr>
                        {['Period', 'Installment (RM)', 'Interest (RM)', 'Principal (RM)', 'Balance (RM)'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map((row, idx) =>
                        row === null ? (
                          <tr key="ellipsis" className="border-t border-gray-100">
                            <td colSpan={5} className="text-center text-gray-300 py-1.5 tracking-widest">···</td>
                          </tr>
                        ) : (
                          <tr key={row.period}
                            className={`border-t border-gray-100 ${row.period === N ? 'bg-blue-50 font-medium' : ''}`}>
                            <td className="px-3 py-1.5 text-gray-500">{row.period}</td>
                            <td className="px-3 py-1.5 font-mono">{fmt(row.installment)}</td>
                            <td className="px-3 py-1.5 font-mono text-red-500">{fmt(row.interest)}</td>
                            <td className="px-3 py-1.5 font-mono text-green-600">{fmt(row.principal)}</td>
                            <td className="px-3 py-1.5 font-mono text-gray-600">{fmt(row.balance)}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400">
                  Last row (period {N}) highlighted in blue. Full schedule available post-submission.
                </p>
              </div>
            );
          })()}
        </div>

        {/* ── 4.10 Asset Information ─────────────────────────── */}
        {appType === 'Individual' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="bg-hlb text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">6</span>
              Asset Information
            </h2>

            {/* Current Assets */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Current Assets &amp; Investments
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['savingBal',     'Saving Account Balance'],
                  ['currentAccBal', 'Current Account Credit End Balance'],
                  ['fdGia',         'FD / GIA Receipts Value'],
                  ['unitTrust',     'Unit Trust / Investment Value'],
                  ['cds',           'CDS Statement Value'],
                  ['otherNetworth', 'Other Valid Networth Value'],
                ] as [AssetKey, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 block mb-1">{label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-gray-400">RM</span>
                      <input type="number" min={0} step="0.01"
                        value={assets[key]}
                        onChange={(e) => setAssets((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded pl-9 pr-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Properties & EPF */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Properties &amp; EPF
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['omvProperty', 'OMV of Unencumbered Properties'],
                  ['epf1',        'EPF Account I'],
                  ['epf2',        'EPF Account II / Account Emas'],
                ] as [AssetKey, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 block mb-1">{label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-gray-400">RM</span>
                      <input type="number" min={0} step="0.01"
                        value={assets[key]}
                        onChange={(e) => setAssets((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded pl-9 pr-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Total EPF (auto)</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-700">
                    RM {fmtRM(totalEPF)}
                  </div>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
              totalAssets >= 1_000_000 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <span className="text-sm font-semibold text-gray-700">Total Sum of Add-On Assets</span>
              <span className={`text-base font-bold font-mono ${
                totalAssets >= 1_000_000 ? 'text-amber-700' : 'text-gray-800'
              }`}>RM {fmtRM(totalAssets)}</span>
            </div>
            {totalAssets >= 1_000_000 && (
              <p className="text-xs text-amber-600">
                ⚠ Total ≥ RM 1,000,000 — additional supporting documents (core system screenshots) required.
              </p>
            )}
          </div>
        )}

        {/* ── Submit ─────────────────────────────────────────── */}
        {(() => {
          const missingFields: string[] = [];
          if (appType === 'Individual') {
            if (!rawDigits)         missingFields.push('Applicant ID Number');
            if (!verifyResults.cifProfile || verifyResults.cifProfile.status === 'idle')
                                    missingFields.push('CIF Verification');
          } else {
            if (!corpIDNumber)      missingFields.push('Corporate ID Number');
            if (!enterpriseType)    missingFields.push('Enterprise Type');
            if (corpStatus !== 'found') missingFields.push('SSM / Company Verification');
            if (!bizTurnover || !bizNetProfit) missingFields.push('Business Financials (Turnover / Net Profit)');
            // Guarantor validation by entity type
            const gr = guarantorRules;
            if (gr?.mandatory && guarantors.length === 0) {
              const grLabel =
                gr.guarantorType === 'PG'       ? `担保人 (${gr.guarantorDesc.slice(0,20)}…)`
                : gr.guarantorType === 'CG'     ? '企业担保人 (Corporate Guarantee)'
                : gr.guarantorType === 'PG_or_CG' ? '担保人 PG 或 CG（必须选一）'
                : '';
              if (grLabel) missingFields.push(grLabel);
            }
            if (gr?.allPartnersMustSign && guarantors.length === 0) {
              missingFields.push('Partnership：需要列出所有合伙人（共同签署人）');
            }
            // Scope & Tax
            if (!corpTIN)               missingFields.push('Tax Identification No. (TIN)');
            if (!stateOfOperation)      missingFields.push('State of Operation');
            // Compliance
            if (!complexStructure)      missingFields.push('Compliance: Complex structure question');
            if (!hasNomineeShares)      missingFields.push('Compliance: Nominee shareholders question');
            // Customer Confirmation
            if (!isFaceToFace)          missingFields.push('Face-to-face onboarding declaration');
            if (!dateOfContact)         missingFields.push('Date of Contact');
            if (!modeOfContact)         missingFields.push('Mode of Contact');
            if (!contactedBy)           missingFields.push('Contacted By (Staff ID)');
            if (customerConfirmedHP !== 'Yes') missingFields.push('Customer Confirmed HP Application (must be Yes)');
            if (!pdsConfirmed)          missingFields.push('Product Disclosure Sheet (PDS) confirmed');
          }
          if (!loanType)            missingFields.push('Loan / Financing Type');
          if (!productGroup)        missingFields.push('Product Group');
          if (!vehicleType)         missingFields.push('Vehicle Type');
          if (!vehMake || !vehModel) missingFields.push('Vehicle (Make / Model)');
          if (!purchasePrice)       missingFields.push('Purchase Price');
          if (!loanProductCode)     missingFields.push('Loan Product Code');
          if (!loanAmount)          missingFields.push('Loan Amount');
          if (!tenureMonths)        missingFields.push('Loan Tenure');
          if (!eirValue || eirHardBlock) missingFields.push('Valid EIR');
          if (!refNo)               missingFields.push('Reference Number (Generate Ref No)');
          const canSubmit = missingFields.length === 0 && !rule3Enabled;

          return (
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-2">
              {rule3Enabled && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <span className="text-red-500 text-base leading-none mt-0.5">⊘</span>
                  <div>
                    <p className="text-xs font-semibold text-red-700">Rule 3 – Duplicate Application Blocked</p>
                    <p className="text-xs text-red-500 mt-0.5">
                      An active application (HP-2025-004512) is already in progress for this customer. Submission is blocked until the existing case is closed or withdrawn.
                    </p>
                  </div>
                </div>
              )}
              {!rule3Enabled && !canSubmit && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                  <p className="text-xs font-semibold text-amber-700">Please complete the following before submitting:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {missingFields.map((f) => (
                      <li key={f} className="text-xs text-amber-600">{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {rule3Enabled
                    ? 'Submission blocked — resolve Rule 3 to proceed.'
                    : canSubmit
                      ? 'All required fields complete. Ready to submit.'
                      : `${missingFields.length} item(s) still required.`}
                </p>
                <button
                  onClick={() => {
                    if (canSubmit) {
                      setAIPResult(null);
                      triggerSubmit(parseFloat(eirValue) || 0, parseFloat(loanAmount) || 0, parseInt(tenureMonths) || 0);
                    }
                  }}
                  disabled={!canSubmit}
                  className={`px-6 py-2.5 text-sm font-semibold rounded transition-colors shadow-sm ${
                    canSubmit
                      ? 'bg-hlb text-white hover:bg-red-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}>
                  Submit Application →
                </button>
              </div>
            </div>
          );
        })()}

        </div>{/* end flex-1 form column */}
      </div>{/* end flex row */}

      {/* ── Rule 3 Modal ───────────────────────────────────────── */}
      {showRule3Modal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRule3Modal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">⚠️</span>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Active Application Found</h3>
                <p className="text-xs text-gray-500 mt-1">
                  An active application already exists for this ID and cannot be submitted again.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Ref ID</span>
                <span className="font-mono font-semibold text-gray-800">HP-2025-004512</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-amber-600 font-medium">In Progress – Credit Assessment</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Submitted</span>
                <span className="text-gray-700">2025-03-18</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowRule3Modal(false)}
                className="flex-1 px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRule3Modal(false)}
                className="flex-1 px-4 py-2 text-sm rounded bg-hlb text-white font-medium hover:bg-red-700 transition-colors"
              >
                View it now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AIP / Submit Modal ─────────────────────────────────── */}
      {showSubmitModal && (() => {
        const appNo = refNo || submittedRefNo;
        const today = new Date().toLocaleDateString('en-MY');

        /* ── Loading state ── */
        if (aipLoading) return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-5">
              <div className="w-10 h-10 border-4 border-hlb border-t-transparent rounded-full animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-gray-800">Submitting to Decision Engine…</p>
                <p className="text-xs text-gray-400">Running credit rules and AIP scoring</p>
              </div>
              <div className="w-full space-y-1.5 text-xs text-gray-400">
                {[
                  'CCRIS bureau check',
                  'DSR validation',
                  'Blacklist screening',
                  'AIP scoring model',
                ].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full border-2 ${i < 2 ? 'bg-green-500 border-green-500' : 'border-gray-300 animate-pulse'}`} />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

        /* ── Result state ── */
        const OUTCOME_CONFIG = {
          approved: {
            icon: '✅',
            badgeClass: 'bg-green-100 text-green-700 border-green-200',
            headerClass: 'border-green-200 bg-green-50',
            label: 'Conditionally Approved',
            statusText: 'AIP – Approved (Conditional)',
            statusClass: 'text-green-700 font-semibold',
            desc: 'The application has passed initial credit scoring. Proceed to document collection and full credit assessment.',
            conditions: [
              'Valid road tax & insurance to be submitted before disbursement',
              'Customer to sign Hire Purchase Agreement (HPA) at branch',
              'Income documents (3-month payslip + EA form) required',
            ],
            nextLabel: 'Proceed to Doc Collection',
          },
          referred: {
            icon: '⚠️',
            badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
            headerClass: 'border-amber-200 bg-amber-50',
            label: 'Referred to Credit',
            statusText: 'AIP – Referred',
            statusClass: 'text-amber-700 font-semibold',
            desc: 'Application requires manual review by a Credit Analyst. Decision may take 1–2 business days.',
            conditions: [
              'DSR between 60%–70% — credit analyst discretion required',
              'Customer has an existing HP facility nearing maturity',
              'Employer not on WT whitelist — manual income verification needed',
            ],
            nextLabel: 'Escalate to Credit Analyst',
          },
          declined: {
            icon: '❌',
            badgeClass: 'bg-red-100 text-red-700 border-red-200',
            headerClass: 'border-red-200 bg-red-50',
            label: 'Declined',
            statusText: 'AIP – Declined',
            statusClass: 'text-red-600 font-semibold',
            desc: 'The application did not meet the minimum credit criteria. Please inform the customer of the decision.',
            conditions: [
              'DSR exceeds 70% threshold after including proposed installment',
              'Adverse CCRIS history: 3+ months overdue in last 12 months',
              'Blacklist match — refer to Compliance before re-application',
            ],
            nextLabel: 'Notify Customer',
          },
        };

        const cfg = aipResult ? OUTCOME_CONFIG[aipResult] : null;
        if (!cfg) return null;

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg space-y-0 overflow-hidden">

              {/* Header band */}
              <div className={`px-6 py-4 border-b flex items-center gap-3 ${cfg.headerClass}`}>
                <span className="text-2xl leading-none">{cfg.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">AIP Decision Result</p>
                  <p className={`text-xs mt-0.5 ${cfg.statusClass}`}>{cfg.label}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cfg.badgeClass}`}>
                  {cfg.statusText}
                </span>
              </div>

              <div className="p-6 space-y-4">
                {/* Application summary row */}
                <div className="grid grid-cols-4 gap-3 text-xs bg-gray-50 rounded-lg px-4 py-3">
                  {([
                    ['App No.', appNo, 'font-mono font-semibold text-gray-800'],
                    ['Amount',  `RM ${parseFloat(loanAmount || '0').toLocaleString()}`, 'font-semibold text-gray-800'],
                    ['Rate',    `${eirValue || '–'}% EIR`, 'text-gray-700'],
                    ['Tenure',  tenureMonths ? `${tenureMonths} mths` : '–', 'text-gray-700'],
                  ] as [string, string, string][]).map(([k, v, cls]) => (
                    <div key={k}>
                      <p className="text-gray-400 mb-0.5">{k}</p>
                      <p className={cls}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed">{cfg.desc}</p>

                {/* Conditions / reasons */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {aipResult === 'approved' ? 'Conditions' : aipResult === 'referred' ? 'Referral Reasons' : 'Decline Reasons'}
                  </p>
                  <ul className="space-y-1">
                    {cfg.conditions.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="mt-0.5 shrink-0 text-gray-400">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Meta row */}
                <div className="grid grid-cols-3 gap-3 text-xs border-t border-gray-100 pt-3">
                  {([
                    ['Submitted', today],
                    ['Officer',   'Ahmad Razif · SO-00421'],
                    ['Branch',    closingBranch || 'Petaling Jaya Branch'],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-gray-400 mb-0.5">{k}</p>
                      <p className="text-gray-700">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer buttons */}
              <div className="px-6 pb-6 flex gap-2">
                <button
                  onClick={() => { setShowSubmitModal(false); setAIPResult(null); }}
                  className="flex-1 px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                  Back to Form
                </button>
                <button
                  onClick={() => { setShowSubmitModal(false); setAIPResult(null); }}
                  className={`flex-1 px-4 py-2 text-sm rounded font-medium transition-colors text-white ${
                    aipResult === 'approved' ? 'bg-green-600 hover:bg-green-700'
                    : aipResult === 'referred' ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-red-600 hover:bg-red-700'
                  }`}>
                  {cfg.nextLabel}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
