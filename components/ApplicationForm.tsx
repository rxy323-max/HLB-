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

  function handleIDTypeChange(val: string) {
    setIdType(val);
    setRawDigits('');
    setDisplayVal('');
    setShowOldIC(false);
    setOldICNumber('');
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

  // ── Verification state ─────────────────────────────────────
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResults, setVerifyResults] = useState<VerificationResults>(IDLE_RESULTS);

  async function runVerification() {
    if (!rawDigits && !displayVal) return;
    setIsVerifying(true);
    setVerifyResults(IDLE_RESULTS);

    // Fire all 6 calls concurrently; each returns after its mock delay
    const [cifProfile, wtWhitelist, incomeDB, appHistory, preConsent, hpLine] =
      await Promise.all([
        mockCall(800,  { status: 'ok', data: { cif: 'CIF-001' } }),
        mockCall(600,  { status: 'ok', data: { whitelisted: true } }),
        mockCall(1000, { status: 'ok', data: { monthlyIncome: 5000 } }),
        mockCall(700,  { status: 'ok', data: { history: [] } }),
        mockCall(500,  { status: 'ok', data: { consented: true } }),
        mockCall(900,  { status: 'ok', data: { hpLine: 80000 } }),
      ]);

    setVerifyResults({ cifProfile, wtWhitelist, incomeDB, appHistory, preConsent, hpLine });
    setIsVerifying(false);
  }

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

      <div className="max-w-3xl mx-auto p-4 space-y-4">
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
                onClick={runVerification}
                disabled={isVerifying || !rawDigits}
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
              {!isVerifying && verifyResults.cifProfile.status === 'ok' && (
                <span className="text-xs text-green-600 font-medium">Verification complete</span>
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
                    placeholder="e.g. Singapore"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={18}
                    placeholder="Must be ≥ 18"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-orange-500 mt-1">Rule 2: Applicant must be ≥ 18 years old</p>
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
      </div>
    </div>
  );
}
