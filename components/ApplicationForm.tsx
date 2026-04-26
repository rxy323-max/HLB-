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
  'Toyota-Vios': {
    '2024': [
      { model: '1.5 G CVT', msrp: 89980, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5 E CVT', msrp: 84980, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'C', greenlane: false },
    ],
    '2023': [
      { model: '1.5 G CVT', msrp: 88980, marketValue: 79000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5 E CVT', msrp: 83980, marketValue: 73000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'C', greenlane: false },
    ],
  },
  'Honda-City': {
    '2024': [
      { model: '1.5 V Sensing CVT', msrp: 111900, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
      { model: '1.5 S CVT',         msrp:  99900, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'C', greenlane: false },
    ],
    '2023': [
      { model: '1.5 V Sensing CVT', msrp: 110900, marketValue: 98000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'B', greenlane: false },
    ],
  },
  'BMW-3 Series': {
    '2024': [
      { model: '320i Sport',       msrp: 264380, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true },
      { model: '330e M Sport',     msrp: 318380, engineType: 'Hybrid', bnmPurpose: 'Personal Use', green: true,  gpRating: 'A', greenlane: true },
    ],
    '2023': [
      { model: '320i Sport',       msrp: 258380, marketValue: 225000, engineType: 'Petrol', bnmPurpose: 'Personal Use', green: false, gpRating: 'A', greenlane: true },
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
  B: { status: 'ok', data: { type: 'ETB', cif: 'CIF-88291', name: 'Lim Boon Keong', nric: '761203-10-5981' } },
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

  // Rule 3 – Single Active Check
  const [rule3Enabled, setRule3Enabled] = useState(false);
  const [showRule3Modal, setShowRule3Modal] = useState(false);

  // Submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittedRefNo] = useState(
    () => `PCJ/HP/${new Date().getFullYear()}/W${String(Math.floor(Math.random() * 9999999) + 1).padStart(7, '0')}`
  );

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
    relApp: string; relPrimary: string;
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
      relApp: '', relPrimary: '', status: 'idle', verifyData: null,
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

  const REL_TO_APP     = ['Guarantor', 'Joint Applicant (Non-Guarantor)'];
  const REL_TO_PRIMARY = [
    'Director / Guarantor', 'Guarantor / Director / Shareowner',
    'Guarantor', 'Guarantor / Shareowner',
    'Partner of Partnership', 'Sole Proprietorship',
    'Director', 'Director / Shareowner',
    'Shareowner', 'Ultimate Beneficial Owner',
  ];

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#D0021B] text-white px-6 py-3 flex items-center justify-between shadow">
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
                  ? 'bg-[#D0021B] text-white'
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
                className="accent-[#D0021B] w-3.5 h-3.5"
              />
              <span className="text-xs text-gray-600">Rule 3: Active App Exists</span>
            </label>
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
                    ? 'bg-[#D0021B] text-white'
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
              <span className="bg-[#D0021B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
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
                className="px-4 py-2 text-sm font-medium rounded bg-[#D0021B] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
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

              // Scenario A – NTB
              if (r.status === 'ok' && d?.type === 'NTB') return (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-start gap-2">
                  <span className="text-green-500 text-lg leading-none mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-medium text-green-700">No Existing Record – New-to-Bank Customer</p>
                    <p className="text-xs text-green-600 mt-0.5">No active CIF found. Proceed to create new customer profile.</p>
                  </div>
                </div>
              );

              // Scenario B – ETB Single CIF
              if (r.status === 'ok' && d?.type === 'ETB') return (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">CIF Profile Found</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">CIF Number</p>
                      <p className="text-sm font-mono font-semibold text-gray-800">{d.cif as string}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Full Name</p>
                      <p className="text-sm font-medium text-gray-800">{d.name as string}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">NRIC</p>
                      <p className="text-sm font-mono text-gray-800">{d.nric as string}</p>
                    </div>
                  </div>
                </div>
              );

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

          const commitAmt     = parseFloat(existingCommitments) || 0;
          const currentDSR    = effectiveNetIncome > 0 ? ((commitAmt + loanInstallment) / effectiveNetIncome * 100).toFixed(1) : null;
          const internalDSR   = effectiveNetIncome > 0 ? (commitAmt / effectiveNetIncome * 100).toFixed(1) : null;
          const minDisposable = effectiveNetIncome - commitAmt - loanInstallment;

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
                  <span className="bg-[#D0021B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                  Income Data
                </h2>
                <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-xs">
                  {(['api', 'manual'] as const).map((m) => (
                    <button key={m} onClick={() => setIncomeMode(m)}
                      className={`px-3 py-1 font-medium transition-colors ${incomeMode === m ? 'bg-[#D0021B] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Existing Commitments / Month (RM)</label>
                      <input type="number" value={existingCommitments}
                        onChange={(e) => setExistingCommitments(e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono bg-white focus:outline-none focus:border-blue-400" />
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
                    <p className="text-xs text-red-600">⚠ DSR exceeds 70% — loan may require additional justification.</p>
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
                <span className="bg-[#D0021B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
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
                <span className="bg-[#D0021B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
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
                <span className="bg-[#D0021B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">5</span>
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

        {/* ── 4.8 Other Applicants ───────────────────────────── */}
        {appType === 'Individual' && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="bg-[#D0021B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {guarantors.length > 0 ? '✓' : '+'}
                </span>
                Other Applicants
                {guarantors.length > 0 && (
                  <span className="text-xs font-normal text-gray-400">{guarantors.length} added</span>
                )}
              </h2>
              {guarantors.length < 3 && (
                <button onClick={addGuarantor}
                  className="text-xs px-3 py-1.5 rounded border border-[#D0021B] text-[#D0021B] hover:bg-red-50 font-medium transition-colors">
                  + Add Guarantor
                </button>
              )}
            </div>

            {guarantors.length === 0 && (
              <p className="text-xs text-gray-400">
                No guarantors added. Click "+ Add Guarantor" to include joint applicants.
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
                    <select value={g.relApp}
                      onChange={(e) => updateGuarantor(g.gid, 'relApp', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400">
                      <option value="">-- Select --</option>
                      {REL_TO_APP.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Relationship to Primary <span className="text-red-500">*</span></label>
                    <select value={g.relPrimary}
                      onChange={(e) => updateGuarantor(g.gid, 'relPrimary', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400">
                      <option value="">-- Select --</option>
                      {REL_TO_PRIMARY.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
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
              <span className="bg-[#D0021B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
              Primary Applicant – Corporate
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Corporate ID Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={corpIDType}
                  onChange={(e) => setCorpIDType(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                >
                  <option value="SSM">SSM ID (Default)</option>
                  <option value="BusinessRegistration">Business Registration (ROB)</option>
                  <option value="CertificateOfIncorporation">Certificate of Incorporation (ROC)</option>
                  <option value="RegistrationCertificate">Registration Certificate (LLP)</option>
                  <option value="ForeignBusinessRegistration">Foreign Business Registration</option>
                  <option value="DummyBusiness">Dummy ID – Business Enterprise</option>
                  <option value="DummySociety">Dummy ID – Society / Assoc</option>
                  <option value="GovernmentID">Government &amp; Agencies</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  {corpIDType === 'SSM' ? 'SSM ID' : 'ID Number'}
                  <span className="text-red-500"> *</span>
                  {corpIDType === 'SSM' && (
                    <span className="ml-1 text-gray-300">12 digits</span>
                  )}
                </label>
                <input
                  type="text"
                  value={corpIDNumber}
                  onChange={(e) => setCorpIDNumber(e.target.value)}
                  placeholder={
                    corpIDType === 'SSM' ? '202401012345' : 'ID number'
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400"
                />
                {corpIDType === 'SSM' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Format: YYYY + entity code (01–06) + serial (6 digits)
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Enterprise Type <span className="text-red-500">*</span>
              </label>
              <select
                value={enterpriseType}
                onChange={(e) => setEnterpriseType(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="">-- Select Enterprise Type --</option>
                {ENTERPRISE_TYPES.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.code}. {t.label}
                  </option>
                ))}
                <optgroup label="Inactive for HP">
                  {['I. Dummy – Business Enterprise', 'J. Dummy – Society / Assoc', 'K. Government and Its Agencies'].map((l) => (
                    <option key={l} disabled>{l} (Inactive)</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        )}
        {/* ── 4.7 Channel Information ────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="bg-[#D0021B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
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
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${loanType === t ? 'bg-[#D0021B] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
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
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${productGroup === g ? 'bg-[#D0021B] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
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
                      ? 'bg-[#D0021B] text-white border-[#D0021B]'
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
            <span className="bg-[#D0021B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
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
            <span className="bg-[#D0021B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
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
              <span className="bg-[#D0021B] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">6</span>
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
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">Review all sections before submitting.</p>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-6 py-2.5 bg-[#D0021B] text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors shadow-sm">
            Submit Application →
          </button>
        </div>

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
                className="flex-1 px-4 py-2 text-sm rounded bg-[#D0021B] text-white font-medium hover:bg-red-700 transition-colors"
              >
                View it now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit Success Modal ────────────────────────────────── */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Application Submitted</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pending AIP assessment by Decision Engine</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Application No.</span>
                <span className="font-mono font-semibold text-gray-800">{refNo || submittedRefNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-blue-600 font-medium">Application Input</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Submitted</span>
                <span className="text-gray-700">{new Date().toLocaleDateString('en-MY')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Officer</span>
                <span className="text-gray-700">Ahmad Razif · SO-00421</span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                Back to Form
              </button>
              <button onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 text-sm rounded bg-[#D0021B] text-white font-medium hover:bg-red-700 transition-colors">
                View Application List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
