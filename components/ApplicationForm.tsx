'use client';
import { useState, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type AppType = 'Individual' | 'Non-Individual';
type EntityCode = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'L';
type StepStatus = 'idle'|'active'|'complete'|'error';
type UBOMode = 'auto'|'manual'|'exempt';
type GuarantorRequirement = 'PG'|'CG'|'PG_or_CG'|'none';

interface NavItem {
  id: string; label: string; sub?: NavItem[];
}
interface StepState { [key: string]: StepStatus }
interface Director {
  id: string; name: string; icNo: string; nationality: string;
  sharePercent: number; isCorporate: boolean; roles: string[];
  isUBO: boolean; isSignatory: boolean; isGuarantor: boolean;
  designation?: string;
}
interface UBO {
  id: string; name: string; icNo: string; nationality: string;
  sharePercent: number; source: string; exemptReason?: string;
}
interface Guarantor {
  id: string; name: string; icNo: string; nationality: string;
  relationship: string; cifStatus: string; income: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ENTITY_TYPES = [
  { value:'A', label:'A – Sdn Bhd (Private Limited)' },
  { value:'B', label:'B – Berhad (Public Limited)' },
  { value:'C', label:'C – Branch of Foreign Company' },
  { value:'D', label:'D – Sole Proprietorship' },
  { value:'E', label:'E – Partnership' },
  { value:'F', label:'F – Local PLT (LLP)' },
  { value:'G', label:'G – Foreign LLP' },
  { value:'H', label:'H – Professional LLP' },
  { value:'L', label:'L – East Malaysia Special Enterprise' },
];

const ENTITY_TO_CONSTITUTION: Record<EntityCode,string> = {
  A:'R', B:'U', C:'O', D:'S', E:'P', F:'O', G:'O', H:'O', L:'S',
};
const ENTITY_TO_BASIC_GROUP: Record<EntityCode,string> = {
  A:'24.0', B:'24.0', C:'24.0', D:'21.0', E:'22.0',
  F:'26.0', G:'26.0', H:'26.0', L:'21.0',
};
const ENTITY_GUARANTOR: Record<EntityCode,{ type:GuarantorRequirement; mandatory:boolean; desc:string; signatories:string }> = {
  A:{ type:'PG', mandatory:true,  desc:'1–2 director(s) Personal Guarantee', signatories:'BR-authorised Director(s)' },
  B:{ type:'PG', mandatory:false, desc:'Usually waived for listed Bhd; required for smaller Bhd', signatories:'BR-authorised Senior Officer' },
  C:{ type:'CG', mandatory:true,  desc:'Overseas parent Corporate Guarantee required', signatories:'Local authorised representative' },
  D:{ type:'none', mandatory:false, desc:'No guarantor — Owner bears unlimited liability', signatories:'Owner (natural person)' },
  E:{ type:'none', mandatory:false, desc:'No extra guarantor — all Partners joint & several liability', signatories:'All Partners must co-sign' },
  F:{ type:'PG', mandatory:true,  desc:'Core Partners Personal Guarantee', signatories:'Compliance Officer or authorised Partner' },
  G:{ type:'PG_or_CG', mandatory:true, desc:'Overseas Partner PG or Parent CG (either)', signatories:'Local authorised representative' },
  H:{ type:'PG', mandatory:true,  desc:'Core Professional Partners PG (valid practising cert required)', signatories:'Authorised practising Partner' },
  L:{ type:'none', mandatory:false, desc:'No guarantor — Licensee bears unlimited liability', signatories:'Licensee (natural person)' },
};
const UBO_RULES: Record<EntityCode,{ mode:UBOMode; desc:string }> = {
  A:{ mode:'manual', desc:'Penetrate to natural person >25% shareholding or actual control' },
  B:{ mode:'exempt', desc:'Listed – Top 5 simplified / exemption applicable' },
  C:{ mode:'manual', desc:'Cross-border penetration to overseas parent natural person' },
  D:{ mode:'auto',   desc:'Owner auto-tagged as UBO (unlimited liability)' },
  E:{ mode:'auto',   desc:'All Partners auto-tagged as UBO' },
  F:{ mode:'manual', desc:'Penetrate to Partner >25% profit distribution right' },
  G:{ mode:'manual', desc:'Cross-border penetration to overseas parent' },
  H:{ mode:'manual', desc:'Practising Partner >25%' },
  L:{ mode:'auto',   desc:'Licensee auto-tagged as UBO' },
};

const CONSTITUTION_OPTIONS = [
  { value:'R', label:'R – Sdn Bhd / Private Ltd' },
  { value:'U', label:'U – Bhd / Public Ltd Co' },
  { value:'S', label:'S – Sole Proprietor' },
  { value:'P', label:'P – Partnership' },
  { value:'O', label:'O – Others' },
  { value:'A', label:'A – Assoc / School / Society' },
  { value:'B', label:'B – Statutory Body' },
  { value:'C', label:'C – Cooperative' },
  { value:'G', label:'G – Government Body' },
  { value:'I', label:'I – Individual' },
];
const BASIC_GROUP_OPTIONS = [
  { value:'11.0', label:'11.0 – Individual' },
  { value:'21.0', label:'21.0 – Sole Proprietors' },
  { value:'22.0', label:'22.0 – Partnerships' },
  { value:'24.0', label:'24.0 – Companies' },
  { value:'26.0', label:'26.0 – Limited Liability Partnership' },
  { value:'31.0', label:'31.0 – Federal Government' },
  { value:'34.0', label:'34.0 – Statutory Bodies' },
  { value:'43.0', label:'43.0 – Societies / Associations' },
  { value:'91.0', label:'91.0 – Others' },
];
const MY_STATES = [
  'Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang',
  'Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor',
  'Terengganu','W.P. Kuala Lumpur','W.P. Labuan','W.P. Putrajaya',
];
const TURNOVER_RANGES = [
  'Less than RM300k','RM300k – RM1M','RM1M – RM3M','RM3M – RM5M',
  'RM5M – RM10M','RM10M – RM20M','RM20M – RM50M','RM50M and above',
];
const EMPLOYEE_RANGES = ['1–4','5–29','30–74','75–149','150–199','200–499','500 and above'];
const MSIC_GROUPS = [
  { value:'A', label:'A – Agriculture, Forestry & Fishing' },
  { value:'B', label:'B – Mining & Quarrying' },
  { value:'C', label:'C – Manufacturing' },
  { value:'D', label:'D – Electricity, Gas, Steam' },
  { value:'F', label:'F – Construction' },
  { value:'G', label:'G – Wholesale & Retail Trade' },
  { value:'H', label:'H – Transportation & Storage' },
  { value:'I', label:'I – Accommodation & Food Service' },
  { value:'J', label:'J – Information & Communication' },
  { value:'K', label:'K – Financial & Insurance Activities' },
  { value:'L', label:'L – Real Estate Activities' },
  { value:'M', label:'M – Professional, Scientific & Technical' },
  { value:'N', label:'N – Administrative & Support Service' },
];
const VEHICLE_MAKES = ['Perodua','Proton','Toyota','Honda','BMW','Mercedes-Benz','Mazda','Hyundai','Kia'];
const MOCK_VEHICLE_MODELS: Record<string,{model:string; msrp:number}[]> = {
  Perodua:[{ model:'Myvi 1.5 AV CVT',msrp:61990 },{ model:'Axia E (M)',msrp:40990 },{ model:'Bezza 1.3 AV',msrp:59990 }],
  Proton: [{ model:'Saga 1.3 MT',msrp:42800 },{ model:'X50 1.5T Premium',msrp:103800 },{ model:'X70 1.8T Premium X',msrp:124800 }],
  Toyota: [{ model:'Vios 1.5E AT',msrp:89600 },{ model:'Corolla Cross 1.8V',msrp:143900 },{ model:'Camry 2.5V',msrp:251000 }],
  Honda:  [{ model:'City 1.5V CVT',msrp:91800 },{ model:'Civic 1.5TC-P',msrp:169900 },{ model:'HR-V 1.5TC-P',msrp:140900 }],
  BMW:    [{ model:'320i Sport',msrp:229880 },{ model:'520i M Sport',msrp:328800 },{ model:'X3 xDrive20i',msrp:342800 }],
  'Mercedes-Benz':[{ model:'C200 Avantgarde',msrp:328888 },{ model:'E350 AMG',msrp:458888 }],
  Mazda:  [{ model:'Mazda 3 2.0 High',msrp:137020 },{ model:'CX-5 2.5 Turbo AWD',msrp:194195 }],
  Hyundai:[{ model:'Tucson 1.6T Executive',msrp:157888 },{ model:'Sonata 2.5 Premium',msrp:183888 }],
  Kia:    [{ model:'Carnival 2.2D MPV',msrp:199888 },{ model:'EV6 GT-Line AWD',msrp:289888 }],
};

// Mock SSM/Experian data
const MOCK_SSM: Record<string,{ name:string; address:string; estDate:string; paidUpCapital:number; directors:Director[] }> = {
  '202301234567': {
    name:'GLOBAL TECH SDN BHD', address:'Level 12, Menara HLB, 94 Jalan Bangsar, 59100 KL',
    estDate:'2018-03-15', paidUpCapital:500000,
    directors:[
      { id:'d1', name:'TAN WEI LIANG', icNo:'800101-14-5678', nationality:'Malaysia', sharePercent:40, isCorporate:false, roles:['Director','Shareholder'], isUBO:false, isSignatory:false, isGuarantor:false },
      { id:'d2', name:'LIM SIEW PING', icNo:'830505-08-2345', nationality:'Malaysia', sharePercent:35, isCorporate:false, roles:['Director','Shareholder'], isUBO:false, isSignatory:false, isGuarantor:false },
      { id:'d3', name:'ALPHA VENTURES SDN BHD', icNo:'199901023456', nationality:'Malaysia', sharePercent:25, isCorporate:true, roles:['Corporate Shareholder'], isUBO:false, isSignatory:false, isGuarantor:false },
    ],
  },
  '202201098765': {
    name:'MAJU ENTERPRISE', address:'No 45, Jalan Masjid India, 50100 KL',
    estDate:'2015-07-20', paidUpCapital:100000,
    directors:[
      { id:'d1', name:'AHMAD BIN HASSAN', icNo:'750612-10-1234', nationality:'Malaysia', sharePercent:100, isCorporate:false, roles:['Owner'], isUBO:true, isSignatory:true, isGuarantor:false },
    ],
  },
};

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function StatusIcon({ s }: { s: StepStatus }) {
  if (s === 'complete') return <span className="ml-auto w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"><svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></span>;
  if (s === 'error')    return <span className="ml-auto w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">✕</span>;
  return null;
}

function SectionPanel({ id, icon, title, children, badge }: { id:string; icon:string; title:string; children:React.ReactNode; badge?:React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div id={id} className="bg-white border border-gray-200 rounded mb-4">
      <button onClick={()=>setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50">
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${open?'rotate-0':'-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
        <span className="text-sm">{icon}</span>
        <span className="font-semibold text-sm text-gray-800">{title}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}

function SubSection({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-semibold text-sm text-gray-700">{title}</span>
        <span className="text-gray-300">—</span>
      </div>
      {children}
    </div>
  );
}

function Field2({ label, required, source, children }: { label:string; required?:boolean; source?:DataSource; children:React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1 flex items-center">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {source && <SourceTag src={source}/>}
      </label>
      {children}
    </div>
  );
}

function Grid({ cols=2, children }: { cols?:number; children:React.ReactNode }) {
  return <div className={`grid grid-cols-${cols} gap-4`}>{children}</div>;
}

function Input({ value, onChange, onBlur, placeholder, readOnly, className }: { value:string; onChange?:(v:string)=>void; onBlur?:()=>void; placeholder?:string; readOnly?:boolean; className?:string }) {
  return <input value={value} onChange={e=>onChange?.(e.target.value)} onBlur={onBlur} placeholder={placeholder||''} readOnly={readOnly} className={`w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${readOnly?'bg-gray-50 text-gray-600':''} ${className||''}`}/>;
}

function Select({ value, onChange, options, placeholder }: { value:string; onChange:(v:string)=>void; options:{value:string;label:string}[]; placeholder?:string }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function RadioGroup({ value, onChange, options }: { value:string; onChange:(v:string)=>void; options:string[] }) {
  return (
    <div className="flex gap-2">
      {options.map(o=>(
        <button key={o} onClick={()=>onChange(o)} className={`px-4 py-1.5 rounded text-sm border ${value===o?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{o}</button>
      ))}
    </div>
  );
}

function Badge({ label, color='gray' }: { label:string; color?:'gray'|'green'|'blue'|'red'|'amber'|'purple' }) {
  const cls: Record<string,string> = {
    gray:'bg-gray-100 text-gray-600', green:'bg-green-100 text-green-700',
    blue:'bg-blue-100 text-blue-700', red:'bg-red-100 text-red-700',
    amber:'bg-amber-100 text-amber-700', purple:'bg-purple-100 text-purple-700',
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls[color]}`}>{label}</span>;
}

type DataSource = 'SSM'|'Experian'|'OCR'|'Manual'|'System';
const SOURCE_TAG_STYLES: Record<DataSource, string> = {
  SSM:      'bg-green-100 text-green-700 border-green-200',
  Experian: 'bg-blue-100 text-blue-700 border-blue-200',
  OCR:      'bg-purple-100 text-purple-700 border-purple-200',
  Manual:   'bg-gray-100 text-gray-500 border-gray-200',
  System:   'bg-amber-100 text-amber-700 border-amber-200',
};
function SourceTag({ src }: { src: DataSource }) {
  return (
    <span className={`ml-1.5 inline-block px-1.5 py-px rounded border text-[10px] font-semibold leading-tight ${SOURCE_TAG_STYLES[src]}`}>
      {src}
    </span>
  );
}

function ApiRow({ label, status }: { label:string; status:'idle'|'loading'|'ok'|'error' }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 w-40">{label}</span>
      {status==='loading' && <span className="text-xs text-blue-500 animate-pulse">Checking...</span>}
      {status==='ok'      && <Badge label="✓ Found" color="green"/>}
      {status==='error'   && <Badge label="✗ Not Found" color="red"/>}
      {status==='idle'    && <span className="text-xs text-gray-300">—</span>}
    </div>
  );
}

// ─── Navigation config ────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { id:'processSummary', label:'Process Summary' },
  { id:'identity',       label:'Identity Verification' },
  { id:'appDetails',     label:'Application Details' },
  {
    id:'applicant', label:'Applicant Information',
    sub:[
      { id:'companyBasic',    label:'Company Basic Information' },
      { id:'companyProfile',  label:'Company Profile' },
      { id:'classification',  label:'Customer Classification' },
      { id:'addressReg',      label:'Address Information' },
      { id:'addressBiz',      label:'Address Information' },
      { id:'email',           label:'Email information' },
      { id:'contact',         label:'Contact Person' },
      { id:'confirmation',    label:'Confirmation' },
      { id:'management',      label:'Management & Shareholder' },
      { id:'ubo',             label:'UBO Identification' },
      { id:'applicantIncome', label:'Applicant Income' },
    ],
  },
  { id:'guarantor',      label:'Guarantor Information' },
  { id:'incomeSummary',  label:'Income Summary' },
  { id:'asset',          label:'Asset Information', sub:[
    { id:'investments', label:'Investments & Savings' },
    { id:'properties',  label:'Properties & EPF' },
  ]},
  { id:'collateral',     label:'Collateral & Seller', sub:[
    { id:'purchase',  label:'Purchase Detail' },
    { id:'vehicle',   label:'Vehicle Detail' },
    { id:'dealer',    label:'Dealer Info' },
    { id:'insurance', label:'Insurance' },
  ]},
  { id:'facility',       label:'Facility/Financing', sub:[
    { id:'repayment', label:'Repayment Schedule' },
  ]},
];
const RISK_ITEMS: NavItem[] = [
  { id:'aml',      label:'AML' },
  { id:'credit',   label:'Credit Summary' },
  { id:'uw',       label:'UW Result' },
  { id:'customer', label:'Customer' },
  { id:'tvcheck',  label:'TV-Check' },
  { id:'exposure', label:'Exposure Summary' },
];

// ─── Main component ────────────────────────────────────────────────────────────
export default function ApplicationForm() {
  // ── App meta
  const [appType, setAppType] = useState<AppType>('Non-Individual');
  const [activeSection, setActiveSection] = useState('identity');
  const [stepStatus, setStepStatus] = useState<StepState>({
    processSummary:'idle', identity:'active', appDetails:'idle',
    companyBasic:'idle', companyProfile:'idle', classification:'idle',
    addressReg:'idle', addressBiz:'idle', email:'idle', contact:'idle',
    confirmation:'idle', management:'idle', ubo:'idle', applicantIncome:'idle',
    guarantor:'idle', incomeSummary:'idle', asset:'idle', collateral:'idle', facility:'idle',
  });

  function markComplete(id: string) {
    setStepStatus(s => ({ ...s, [id]: 'complete' }));
  }
  function markError(id: string) {
    setStepStatus(s => ({ ...s, [id]: 'error' }));
  }
  function goTo(id: string) {
    setActiveSection(id);
    setStepStatus(s => ({ ...s, [id]: 'active' }));
    document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  // ── Identity / Company Lock
  const [idType1, setIdType1] = useState('SSM ID');
  const [idNo1,   setIdNo1]   = useState('');
  const [idType2, setIdType2] = useState('');
  const [idNo2,   setIdNo2]   = useState('');
  const [searchBy, setSearchBy] = useState<'ID Number'|'CIF No.'>('ID Number');
  const [lookupStatus, setLookupStatus] = useState<'idle'|'loading'|'found'|'notfound'>('idle');
  const [cifStatus,    setCifStatus]    = useState<'idle'|'loading'|'ok'|'error'>('idle');
  const [hpLineStatus, setHpLineStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');
  const [corpLocked, setCorpLocked] = useState(false);

  // ── Application Details
  const [productGroup,    setProductGroup]    = useState('HP');
  const [loanType,        setLoanType]        = useState('Conventional');
  const [attendingOfficer,setAttendingOfficer]= useState('saladm1');
  const [salesOfficer,    setSalesOfficer]    = useState('SalesOfficer1 (sal001)');
  const [deliveryChannel, setDeliveryChannel] = useState('H23 - ALC MIRI');
  const [closingBranch,   setClosingBranch]   = useState('Miri Branch');
  const [salesManager,    setSalesManager]    = useState('saladm1');
  const [loanProposal,    setLoanProposal]    = useState('');
  const [source,          setSource]          = useState('NIL');
  const [campaignCode,    setCampaignCode]    = useState('');
  const [preferLang,      setPreferLang]      = useState('English');

  // ── Company Basic Info (from SSM)
  const [enterpriseType,  setEnterpriseType]  = useState<EntityCode|''>('');
  const [companyName,     setCompanyName]     = useState('');
  const [companyRegNo,    setCompanyRegNo]    = useState('');
  const [corpEstDate,     setCorpEstDate]     = useState('');
  const [etbStatus,       setEtbStatus]       = useState<'ETB'|'NTB'|''>('');
  const [cifNo,           setCifNo]           = useState('');

  // ── Company Profile
  const [constitution,      setConstitution]      = useState('');
  const [basicGroup,        setBasicGroup]        = useState('');
  const [msicGroup,         setMsicGroup]         = useState('');
  const [msicCode,          setMsicCode]          = useState('');
  const [bumiStatus,        setBumiStatus]        = useState('');
  const [paidUpCapital,     setPaidUpCapital]     = useState('');
  const [authorizedCapital, setAuthorizedCapital] = useState('');
  const [turnoverActual,    setTurnoverActual]    = useState('');
  const [turnoverRange,     setTurnoverRange]     = useState('');
  const [employeeActual,    setEmployeeActual]    = useState('');
  const [employeeRange,     setEmployeeRange]     = useState('');
  const [sourceOfRepayment, setSourceOfRepayment] = useState('');
  const [primaryIncomeDoc,  setPrimaryIncomeDoc]  = useState('');

  // ── Scope & Tax
  const [corpTIN,           setCorpTIN]         = useState('');
  const [tinValid,          setTinValid]         = useState<boolean|null>(null);
  const [corpSST,           setCorpSST]          = useState('');
  const [countryOfOp,       setCountryOfOp]      = useState('Malaysia');
  const [stateOfOp,         setStateOfOp]        = useState('');
  const [fenResident,       setFenResident]       = useState('');
  const [labuanEntity,      setLabuanEntity]      = useState('');

  // ── Customer Classification
  const [customerSector,  setCustomerSector]  = useState('');
  const [nrccFlag,        setNrccFlag]        = useState('');
  const [smiFlag,         setSmiFlag]         = useState('');
  const [gpRatings,       setGpRatings]       = useState('');

  // ── Address
  const [regAddr1,   setRegAddr1]   = useState('');
  const [regCity,    setRegCity]    = useState('');
  const [regState,   setRegState]   = useState('');
  const [regPostal,  setRegPostal]  = useState('');
  const [sameAddr,   setSameAddr]   = useState(false);
  const [bizAddr1,   setBizAddr1]   = useState('');
  const [bizCity,    setBizCity]    = useState('');
  const [bizState,   setBizState]   = useState('');
  const [bizPostal,  setBizPostal]  = useState('');

  // ── Email / Contact
  const [corpEmail,    setCorpEmail]    = useState('');
  const [contactName,  setContactName]  = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // ── Confirmation / AML
  const [complexStructure,   setComplexStructure]   = useState('');
  const [nomineeShares,      setNomineeShares]      = useState('');
  const [isFaceToFace,       setIsFaceToFace]       = useState('');
  const [dateOfContact,      setDateOfContact]      = useState('');
  const [modeOfContact,      setModeOfContact]      = useState('');
  const [contactedBy,        setContactedBy]        = useState('');
  const [customerConfirmHP,  setCustomerConfirmHP]  = useState('');
  const [pdsConfirmed,       setPdsConfirmed]       = useState(false);
  const [marketingConsent,   setMarketingConsent]   = useState(false);

  // ── Management & Shareholder / UBO
  const [directors,          setDirectors]          = useState<Director[]>([]);
  const [ubos,               setUbos]               = useState<UBO[]>([]);
  const [expertianFetched,   setExpertianFetched]   = useState(false);
  const [experianLoading,    setExperianLoading]    = useState(false);
  const [showDrillDown,      setShowDrillDown]      = useState(false);
  const [drillTarget,        setDrillTarget]        = useState<Director|null>(null);
  const [drilledDirectors,   setDrilledDirectors]   = useState<Set<string>>(new Set());

  // ── Guarantor
  const [guarantors,   setGuarantors]   = useState<Guarantor[]>([]);
  const [showAddGuar,  setShowAddGuar]  = useState(false);
  const [newGuar, setNewGuar] = useState<Partial<Guarantor>>({});

  // ── Business Income (Applicant Income)
  const [bizTurnover3Y, setBizTurnover3Y] = useState(['','','']);
  const [bizProfit3Y,   setBizProfit3Y]   = useState(['','','']);
  const [bizNetIncome,  setBizNetIncome]  = useState('');

  // ── Collateral
  const [vehicleMake,  setVehicleMake]  = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear,  setVehicleYear]  = useState('');
  const [vehicleVIN,   setVehicleVIN]   = useState('');
  const [vehicleMSRP,  setVehicleMSRP]  = useState('');
  const [isNewVehicle, setIsNewVehicle] = useState('New');
  const [dealerCode,   setDealerCode]   = useState('');
  const [dealerName,   setDealerName]   = useState('');

  // ── Facility
  const [loanAmount,    setLoanAmount]    = useState('');
  const [tenureMonths,  setTenureMonths]  = useState('');
  const [eirValue,      setEirValue]      = useState('');
  const [downPayment,   setDownPayment]   = useState('');
  const [islamicMode,   setIslamicMode]   = useState(false);

  // ─ Derived
  const et = enterpriseType as EntityCode;
  const gr = et ? ENTITY_GUARANTOR[et] : null;
  const uboRule = et ? UBO_RULES[et] : null;
  const derivedConstitution = et ? ENTITY_TO_CONSTITUTION[et] : '';
  const derivedBasicGroup   = et ? ENTITY_TO_BASIC_GROUP[et] : '';
  const effConstitution = constitution || derivedConstitution;
  const effBasicGroup   = basicGroup   || derivedBasicGroup;

  // Signatory, drill-down, guarantor checks
  const hasSignatory = directors.some(d => d.isSignatory);
  const drillRequiredEntities: EntityCode[] = ['A','C','F','G','H'];
  const needsDrillDown = et && drillRequiredEntities.includes(et);
  const corpDirs = directors.filter(d => d.isCorporate);
  const drillComplete = !needsDrillDown || corpDirs.length === 0 || corpDirs.every(d => drilledDirectors.has(d.id));
  const mandatoryGuarSatisfied = !gr?.mandatory || guarantors.length > 0;

  // Four readiness flags
  const riskReady        = corpLocked && !!enterpriseType && !!corpTIN && !!loanAmount && !!vehicleMake;
  const cedReady         = directors.length > 0 && ubos.length > 0 && !!sourceOfRepayment && drillComplete;
  const bnmReady         = !!effConstitution && !!effBasicGroup && !!corpTIN && ubos.length > 0;
  const disbursementReady = hasSignatory && !!vehicleMake && !!loanAmount && mandatoryGuarSatisfied;

  // UBO auto-bind: D/E/L → auto; A/C/F/G/H → manual drill-down; B → exempt
  useEffect(() => {
    if (!enterpriseType) return;
    const rule = UBO_RULES[enterpriseType as EntityCode];
    if (!directors.length && rule?.mode !== 'exempt') return;

    if (rule?.mode === 'auto') {
      const isPartnership = enterpriseType === 'E';
      // D/E/L: mark all natural persons as UBO; for E also force Signatory + Guarantor
      setDirectors(ds => ds.map(d => ({
        ...d,
        isUBO:       !d.isCorporate,
        isSignatory: isPartnership ? !d.isCorporate : d.isSignatory,
        isGuarantor: isPartnership ? !d.isCorporate : d.isGuarantor,
      })));
      setUbos(prev => {
        const naturalPersons = directors.filter(d => !d.isCorporate);
        const autoIds = new Set(naturalPersons.map(d => d.id));
        const manualUbos = prev.filter(u => !autoIds.has(u.id));
        return [
          ...manualUbos,
          ...naturalPersons.map(d => ({
            id: d.id, name: d.name, icNo: d.icNo, nationality: d.nationality,
            sharePercent: d.sharePercent, source: 'Auto (Entity Type)',
          })),
        ];
      });
      // E (Partnership): auto-add all natural-person partners as guarantors
      if (isPartnership) {
        setGuarantors(prev => {
          const existingIds = new Set(prev.map(g => g.id));
          const newGuars = directors
            .filter(d => !d.isCorporate && !existingIds.has(d.id))
            .map(d => ({
              id: d.id, name: d.name, icNo: d.icNo, nationality: d.nationality,
              relationship: 'Partner of Partnership', cifStatus: 'ok', income: 0,
            }));
          return [...prev, ...newGuars];
        });
      }
    } else if (rule?.mode === 'exempt') {
      // B (Listed Berhad): apply UBO exemption automatically
      setUbos([{
        id: 'exempt', name: 'EXEMPTED (Listed Company)', icNo: '—', nationality: '—',
        sharePercent: 0, source: 'Exemption', exemptReason: 'Listed Berhad – Top 5 simplified exemption',
      }]);
    }
    // A/C/F/G/H (manual): clear auto-bound UBOs so officer must drill-down or add manually
    else if (rule?.mode === 'manual') {
      setUbos(prev => prev.filter(u => u.source === 'Manual' || u.source.startsWith('Drill-down')));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterpriseType]);

  // Monthly instalment
  const principal = parseFloat(loanAmount)||0;
  const months    = parseInt(tenureMonths)||1;
  const eir       = parseFloat(eirValue)||0;
  const monthlyRate = eir/100/12;
  const instalment  = monthlyRate>0 ? principal*monthlyRate/(1-Math.pow(1+monthlyRate,-months)) : principal/months;

  // Guarantor income total
  const gIncome = guarantors.reduce((s,g)=>s+g.income,0);
  const corpIncome = parseFloat(bizNetIncome)||0;
  const totalIncome = corpIncome + gIncome;
  const monthlyDebt = instalment;
  const dsr = totalIncome>0 ? (monthlyDebt/totalIncome)*100 : 0;

  // TIN validation
  function validateTIN(tin: string): boolean {
    return /^[A-Z]{1,2}[0-9]{7,12}$/.test(tin.replace(/-/g,''));
  }

  // SSM lookup
  function doSSMLookup() {
    if (!idNo1.trim()) return;
    setLookupStatus('loading');
    setCifStatus('loading');
    setHpLineStatus('loading');
    const key = idNo1.replace(/[-\s]/g,'');
    setTimeout(()=>{
      const data = MOCK_SSM[key];
      if (data) {
        setCompanyName(data.name);
        setCorpEstDate(data.estDate);
        setPaidUpCapital(String(data.paidUpCapital));
        setDirectors(data.directors);
        setRegAddr1(data.address);
        setLookupStatus('found');
        setEtbStatus(key==='202301234567'?'ETB':'NTB');
        setCifNo(key==='202301234567'?'CIF-00123456':'');
        // auto-suggest entity type from BR number format
        if (!enterpriseType && key.startsWith('2023')) setEnterpriseType('A');
        else if (!enterpriseType && key.startsWith('2022')) setEnterpriseType('D');
        setExpertianFetched(true);
      } else {
        setLookupStatus('notfound');
      }
      setCifStatus(key==='202301234567'?'ok':'error');
      setTimeout(()=>setHpLineStatus('error'), 400);
    }, 1800);
  }

  function fetchExperian() {
    setExperianLoading(true);
    setTimeout(()=>{
      const key = idNo1.replace(/[-\s]/g,'');
      const data = MOCK_SSM[key];
      if (data) setDirectors(data.directors);
      setExperianLoading(false);
      setExpertianFetched(true);
    }, 1500);
  }

  function toggleUBO(id: string) {
    setDirectors(ds=>ds.map(d=>d.id===id?{...d,isUBO:!d.isUBO}:d));
    const d = directors.find(x=>x.id===id);
    if (d && !d.isUBO) {
      setUbos(prev=>[...prev.filter(u=>u.id!==id),{ id, name:d.name, icNo:d.icNo, nationality:d.nationality, sharePercent:d.sharePercent, source:'Experian' }]);
    } else {
      setUbos(prev=>prev.filter(u=>u.id!==id));
    }
  }
  function toggleSignatory(id: string) {
    setDirectors(ds=>ds.map(d=>d.id===id?{...d,isSignatory:!d.isSignatory}:d));
  }
  function toggleGuarantorFromDir(id: string) {
    const d = directors.find(x=>x.id===id);
    if (!d) return;
    setDirectors(ds=>ds.map(x=>x.id===id?{...x,isGuarantor:!x.isGuarantor}:x));
    if (d && !d.isGuarantor) {
      setGuarantors(prev=>[...prev,{ id, name:d.name, icNo:d.icNo, nationality:d.nationality, relationship:'Director / Guarantor', cifStatus:'ok', income:0 }]);
    } else {
      setGuarantors(prev=>prev.filter(g=>g.id!==id));
    }
  }

  function appStatus() {
    const total = Object.values(stepStatus).length;
    const done  = Object.values(stepStatus).filter(v=>v==='complete').length;
    const errs  = Object.values(stepStatus).filter(v=>v==='error').length;
    if (errs>0) return { label:'PENDING APPLICATION', color:'bg-gray-200 text-gray-700' };
    if (done>= total-3) return { label:'READY TO SUBMIT', color:'bg-blue-100 text-blue-700' };
    return { label:'PENDING APPLICATION', color:'bg-gray-200 text-gray-700' };
  }
  const { label:statusLabel, color:statusColor } = appStatus();
  const appNo = 'NI-20260507-00001';
  const now = new Date().toLocaleDateString('en-GB');

  // ─ Navigation sidebar
  function NavSidebar() {
    function renderItem(item: NavItem, depth=0) {
      const s = stepStatus[item.id] || 'idle';
      const isActive = activeSection === item.id || (item.sub?.some(x=>x.id===activeSection));
      return (
        <div key={item.id}>
          <button
            onClick={()=>goTo(item.id)}
            className={`w-full flex items-center gap-1.5 py-1.5 text-left transition-colors ${depth===0?'px-3':'px-6'} ${isActive?'text-blue-600 font-medium border-l-2 border-blue-600 bg-blue-50':'text-gray-600 border-l-2 border-transparent hover:bg-gray-50'}`}
          >
            <span className={`truncate ${depth===0?'text-sm':'text-xs'}`}>{item.label}</span>
            <StatusIcon s={s}/>
          </button>
          {item.sub && item.sub.map(sub=>renderItem(sub, depth+1))}
        </div>
      );
    }
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-3 border-b border-gray-200 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">☰ Navigation</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map(item=>renderItem(item))}
          <div className="px-3 pt-2 pb-1 mt-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Risk Relate</span>
          </div>
          {RISK_ITEMS.map(item=>(
            <button key={item.id} onClick={()=>goTo(item.id)}
              className="w-full flex items-center gap-1.5 px-6 py-1.5 text-left text-xs text-gray-400 hover:bg-gray-50 border-l-2 border-transparent">
              {item.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─ Right Panel
  function RightPanel() {
    return (
      <div className="h-full flex flex-col gap-0">
        {/* Quick Actions */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-1 mb-2"><span className="text-xs font-semibold text-gray-500">⚡ Quick Actions</span></div>
          <button className="w-full bg-blue-600 text-white text-sm py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700">
            📄 Documents
          </button>
        </div>
        {/* Memo */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">📋 Memo</span>
            <div className="flex gap-2 text-xs text-blue-600">
              <button>+ Add</button>
              <button>👁 View (0)</button>
            </div>
          </div>
          <p className="text-xs text-gray-400 italic">No memo yet</p>
        </div>
        {/* Application Summary */}
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">📄 Application Summary</span>
            <button className="text-gray-400 hover:text-gray-600 text-sm">↻</button>
          </div>
          {[
            ['App ref No.', appNo],
            ['CP No.', cifNo||'—'],
            ['Application Tags', '—'],
            ['Primary Applicant', companyName||'—'],
            ['Primary ID', idNo1||'—'],
            ['No. of Guarantors', String(guarantors.length)],
            ['Sales Officer', salesOfficer],
            ['Application Status', statusLabel],
            ['Collateral Info', vehicleMake&&vehicleModel?`${vehicleMake} ${vehicleModel} (${vehicleYear})`.trim():'—'],
            ['Loan Tenure', tenureMonths?`${tenureMonths} Months`:'—'],
            ['Loan Amount', loanAmount?`RM ${parseFloat(loanAmount).toLocaleString()}`:'—'],
            ['Consent', '—'],
            ['Acceptance', '—'],
            ['e-Hakmilik', '—'],
          ].map(([k,v])=>(
            <div key={k} className="flex justify-between items-start py-1 border-b border-gray-100">
              <span className="text-xs text-gray-500 flex-shrink-0 w-28">{k}</span>
              <span className="text-xs text-gray-800 text-right ml-2 break-all">{v==='PENDING APPLICATION'?<Badge label={v} color="gray"/>:v}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Section: Process Summary ─────────────────────────────────────────────
  function ProcessSummarySection() {
    const completedCount = Object.values(stepStatus).filter(v=>v==='complete').length;
    return (
      <SectionPanel id="processSummary" icon="📋" title="Process Summary">
        <div className="mt-3">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-base font-bold text-gray-800">{appNo}</span>
            <Badge label={statusLabel} color="gray"/>
          </div>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div><span className="text-gray-400 block text-xs">Applicant</span><span className="font-medium">{companyName||'—'}</span></div>
            <div><span className="text-gray-400 block text-xs">Loan Amount</span><span className="font-medium">{loanAmount?`RM ${parseFloat(loanAmount).toLocaleString()}`:'—'}</span></div>
            <div><span className="text-gray-400 block text-xs">Status Log</span><span className="text-xs text-gray-500">Draft created {now}</span></div>
            <div><span className="text-gray-400 block text-xs">Guarantor(s)</span><span className="font-medium">{guarantors.length||'—'}</span></div>
            <div><span className="text-gray-400 block text-xs">EIR</span><span className="font-medium">{eirValue?`${eirValue}%`:'—'}</span></div>
            <div><span className="text-gray-400 block text-xs">Completion</span><span className="font-medium">{completedCount} / {Object.keys(stepStatus).length} steps</span></div>
            <div><span className="text-gray-400 block text-xs">Vehicle</span><span className="font-medium">{vehicleMake&&vehicleModel?`${vehicleMake} ${vehicleModel}`:'—'}</span></div>
            <div><span className="text-gray-400 block text-xs">Approved Tenure</span><span className="font-medium">{tenureMonths?`${tenureMonths} Months`:'—'}</span></div>
          </div>
          {/* Non-Individual: no E-Consent notice */}
          {appType==='Non-Individual' && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex items-start gap-2">
              <span>⚠</span>
              <span><strong>Non-Individual:</strong> E-Consent / E-Acceptance does NOT apply. All agreements must be executed via manual offline paper signing by the authorised Signatory.</span>
            </div>
          )}
          {/* Readiness indicators */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              { label:'Risk Ready',         ok: riskReady,         tip: 'Company locked + Entity Type + TIN + Loan Amount + Vehicle' },
              { label:'CED Ready',          ok: cedReady,          tip: 'Directors + UBO confirmed + Source of Repayment + Drill-down complete' },
              { label:'BNM Ready',          ok: bnmReady,          tip: 'Constitution + Basic Group + TIN + UBO confirmed' },
              { label:'Disbursement Ready', ok: disbursementReady, tip: 'Signatory + Vehicle + Loan Amount + Mandatory Guarantor satisfied' },
            ].map(r=>(
              <div key={r.label} title={r.tip} className={`rounded p-2 text-xs border ${r.ok?'border-green-200 bg-green-50 text-green-700':'border-gray-200 bg-gray-50 text-gray-500'}`}>
                <span className="mr-1">{r.ok?'✓':'○'}</span>{r.label}
              </div>
            ))}
          </div>
        </div>
      </SectionPanel>
    );
  }

  // ─── Section: Identity Verification ──────────────────────────────────────
  function IdentitySection() {
    const corpIdTypes = [
      { value:'SSM ID',  label:'SSM ID (Certificate of Incorporation)' },
      { value:'BR No',   label:'Business Registration No.' },
      { value:'Foreign BR', label:'Foreign Business Registration' },
      { value:'RC',      label:'Registration Certificate (PLT)' },
      { value:'Trading', label:'Trading License (East MY)' },
    ];
    return (
      <SectionPanel id="identity" icon="🛡" title="Identity Verification">
        <div className="mt-4 grid grid-cols-2 gap-6">
          <Field2 label="Customer Type" required>
            <div className="flex gap-0 rounded border border-gray-300 overflow-hidden w-fit">
              {(['Non-Individual','Individual'] as AppType[]).map(t=>(
                <button key={t} onClick={()=>setAppType(t)} className={`px-4 py-1.5 text-sm ${appType===t?'bg-blue-600 text-white':'bg-white text-gray-600 hover:bg-gray-50'}`}>{t}</button>
              ))}
            </div>
          </Field2>
          <Field2 label="Search By">
            <div className="flex gap-0 rounded border border-gray-300 overflow-hidden w-fit">
              {(['ID Number','CIF No.'] as const).map(t=>(
                <button key={t} onClick={()=>setSearchBy(t)} className={`px-4 py-1.5 text-sm ${searchBy===t?'bg-blue-600 text-white':'bg-white text-gray-600 hover:bg-gray-50'}`}>{t}</button>
              ))}
            </div>
          </Field2>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field2 label="ID Type 1" required>
            {appType==='Non-Individual'
              ? <Select value={idType1} onChange={setIdType1} options={corpIdTypes}/>
              : <Select value={idType1} onChange={setIdType1} options={[{value:'MyKad',label:'MyKad (Blue)'},{value:'Passport',label:'Passport'},{value:'MyPR',label:'MyPR (Red)'}]}/>
            }
          </Field2>
          <Field2 label={appType==='Non-Individual'?'Registration Number *':'ID Number *'} required>
            <div className="flex gap-2">
              <Input value={idNo1} onChange={setIdNo1} placeholder={appType==='Non-Individual'?'e.g. 202301234567':'e.g. 980101-14-1234'} readOnly={corpLocked}/>
              {!corpLocked && (
                <button onClick={doSSMLookup} disabled={!idNo1||lookupStatus==='loading'} className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
                  {lookupStatus==='loading'?'...':(appType==='Non-Individual'?'Check':'Search')}
                </button>
              )}
            </div>
          </Field2>
          {(appType==='Non-Individual'||idType2) && (
            <>
              <Field2 label="ID Type 2">
                <Select value={idType2} onChange={setIdType2} options={[{value:'',label:'— Select —'},{value:'OldBR',label:'Old BR No.'},{value:'FormerIC',label:'Former IC No.'}]}/>
              </Field2>
              <Field2 label="ID Number 2">
                <Input value={idNo2} onChange={setIdNo2} placeholder="Old registration number" readOnly={corpLocked}/>
              </Field2>
            </>
          )}
        </div>

        {/* Lookup results */}
        {lookupStatus!=='idle' && (
          <div className="mt-4 border border-gray-200 rounded p-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">System Check Results</p>
            <ApiRow label="CIF / HOST"    status={cifStatus}/>
            <ApiRow label="Experian / SSM" status={lookupStatus==='loading'?'loading':lookupStatus==='found'?'ok':'error'}/>
            <ApiRow label="HP Line Check" status={hpLineStatus}/>
          </div>
        )}

        {/* Company card after found */}
        {lookupStatus==='found' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm text-blue-800">{companyName}</p>
                <p className="text-xs text-gray-500 mt-0.5">ID: {idNo1}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {etbStatus && <Badge label={etbStatus} color={etbStatus==='ETB'?'green':'blue'}/>}
                  {enterpriseType && <Badge label={`Type ${enterpriseType} – ${ENTITY_TYPES.find(e=>e.value===enterpriseType)?.label.split('–')[1]?.trim()||''}`} color="purple"/>}
                  {effConstitution && <Badge label={`Constitution: ${effConstitution}`} color="gray"/>}
                </div>
              </div>
              {!corpLocked && (
                <button onClick={()=>{ setCorpLocked(true); markComplete('identity'); markComplete('companyBasic'); goTo('appDetails'); }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 ml-4 flex-shrink-0">
                  ✓ Confirm & Lock
                </button>
              )}
              {corpLocked && <Badge label="🔒 Locked" color="green"/>}
            </div>
          </div>
        )}
        {lookupStatus==='notfound' && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-700">
            ⚠ No record found. You may continue with manual entry or check the registration number.
          </div>
        )}
      </SectionPanel>
    );
  }

  // ─── Section: Application Details ────────────────────────────────────────
  function AppDetailsSection() {
    return (
      <SectionPanel id="appDetails" icon="📁" title="Application Details">
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field2 label="Product Group" required>
            <Select value={productGroup} onChange={setProductGroup} options={[{value:'HP',label:'HP'},{value:'HP+Plus',label:'HP+Plus'},{value:'Lease',label:'Lease (Ijarah)'}]}/>
          </Field2>
          <Field2 label="Lending / Financing Type" required>
            <Select value={loanType} onChange={setLoanType} options={[{value:'Conventional',label:'Conventional'},{value:'Islamic',label:'Islamic (IHP)'}]}/>
          </Field2>
          <Field2 label="Attending Officer" required>
            <Select value={attendingOfficer} onChange={setAttendingOfficer} options={[{value:'saladm1',label:'saladm1'},{value:'saladm2',label:'saladm2'}]}/>
          </Field2>
          <Field2 label="Source">
            <Select value={source} onChange={setSource} options={[{value:'NIL',label:'NIL'},{value:'Dealer',label:'Dealer'},{value:'Direct',label:'Direct'},{value:'Referral',label:'Referral'}]}/>
          </Field2>
          <Field2 label="Sales Officer" required>
            <Select value={salesOfficer} onChange={setSalesOfficer} options={[{value:'SalesOfficer1 (sal001)',label:'SalesOfficer1 (sal001)'},{value:'SalesHead1 (salhed1)',label:'SalesHead1 (salhed1)'}]}/>
          </Field2>
          <Field2 label="Delivery Channel" required>
            <Select value={deliveryChannel} onChange={setDeliveryChannel} options={[{value:'H23 - ALC MIRI',label:'H23 – ALC MIRI'},{value:'H25 - ALC MELAKA',label:'H25 – ALC MELAKA'},{value:'H01 - KL MAIN',label:'H01 – KL MAIN'}]}/>
          </Field2>
          <Field2 label="Loan Proposal">
            <Select value={loanProposal} onChange={setLoanProposal} options={[{value:'',label:'— Select —'},{value:'JAN LAI MUN(1206967)',label:'JAN LAI MUN (1206967)'}]}/>
          </Field2>
          <Field2 label="Closing Branch" required>
            <Select value={closingBranch} onChange={setClosingBranch} options={[{value:'Miri Branch',label:'Miri Branch'},{value:'Skudai Branch',label:'Skudai Branch'},{value:'KL Main',label:'KL Main Branch'}]}/>
          </Field2>
          <Field2 label="Sales Manager" required>
            <Select value={salesManager} onChange={setSalesManager} options={[{value:'saladm1',label:'saladm1'},{value:'saladm2',label:'saladm2'}]}/>
          </Field2>
          <Field2 label="Campaign Code">
            <div className="flex gap-2">
              <Input value={campaignCode} onChange={setCampaignCode} placeholder="Search campaign..."/>
              <button className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">↻</button>
            </div>
          </Field2>
          <Field2 label="Preferred Language" required>
            <Select value={preferLang} onChange={setPreferLang} options={[{value:'English',label:'English'},{value:'Bahasa Malaysia',label:'Bahasa Malaysia'},{value:'Chinese',label:'Chinese'}]}/>
          </Field2>
          <Field2 label="Line of Business">
            <Input value="Retail" readOnly/>
          </Field2>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={()=>{ markComplete('appDetails'); goTo('companyBasic'); }} className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Save & Continue →</button>
        </div>
      </SectionPanel>
    );
  }

  // ─── Section: Applicant Information wrapper ───────────────────────────────
  function ApplicantInfoSection() {
    return (
      <SectionPanel id="applicant" icon="🏢" title="Applicant Information"
        badge={<button onClick={()=>setShowAddGuar(true)} className="flex items-center gap-1 px-3 py-1 border border-blue-500 text-blue-600 text-xs rounded hover:bg-blue-50">👤 Add Guarantor</button>}
      >
        {/* Company Basic Information */}
        <SubSection title="Company Basic Information —">
          <div id="companyBasic" className="scroll-mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Field2 label="ID Type 1" required source="SSM">
                <Input value={idType1} readOnly/>
              </Field2>
              <Field2 label="Registration / ID Number" required source="SSM">
                <div className="flex items-center gap-2">
                  <Input value={idNo1} readOnly/>
                  {corpLocked && <Badge label="🔒" color="gray"/>}
                </div>
              </Field2>
              <Field2 label="Company Name" source="SSM">
                <Input value={companyName} readOnly/>
              </Field2>
              <Field2 label="Enterprise Type" required source="SSM">
                <Select value={enterpriseType} onChange={v=>setEnterpriseType(v as EntityCode)} options={ENTITY_TYPES} placeholder="— Select —"/>
              </Field2>
              <Field2 label="CIF No." source="System">
                <div className="flex items-center gap-2">
                  <Input value={cifNo||'—'} readOnly/>
                  <Badge label={etbStatus||'NTB'} color={etbStatus==='ETB'?'green':'blue'}/>
                </div>
              </Field2>
              <Field2 label="Establishment Date" required source="SSM">
                <Input value={corpEstDate} onChange={setCorpEstDate} placeholder="YYYY-MM-DD"/>
              </Field2>
              <Field2 label="Database Income" source="System">
                <Badge label="No Record" color="red"/>
              </Field2>
              <Field2 label="HP Line" source="System">
                <Badge label={hpLineStatus==='ok'?'HP Line Hit':'No HP Line'} color={hpLineStatus==='ok'?'amber':'gray'}/>
              </Field2>
            </div>
          </div>
        </SubSection>

        {/* Company Profile */}
        <SubSection title="Company Profile">
          <div id="companyProfile" className="scroll-mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Field2 label="Basic Group" required source="System">
                <div className="flex gap-2 items-center">
                  <Select value={effBasicGroup} onChange={setBasicGroup} options={BASIC_GROUP_OPTIONS} placeholder="— Select —"/>
                  {derivedBasicGroup && basicGroup==='' && <Badge label="Auto-mapped" color="blue"/>}
                </div>
              </Field2>
              <Field2 label="Constitution" required source="System">
                <div className="flex gap-2 items-center">
                  <Select value={effConstitution} onChange={setConstitution} options={CONSTITUTION_OPTIONS} placeholder="— Select —"/>
                  {derivedConstitution && constitution==='' && <Badge label="Auto-mapped" color="blue"/>}
                </div>
              </Field2>
              <Field2 label="Nature of Business Group" required source="Manual">
                <Select value={msicGroup} onChange={setMsicGroup} options={MSIC_GROUPS} placeholder="— Select group —"/>
              </Field2>
              <Field2 label="Nature of Business Code" source="Manual">
                <Input value={msicCode} onChange={setMsicCode} placeholder="e.g. 46510"/>
              </Field2>
              <Field2 label="Bumiputera Status" required source="Manual">
                <RadioGroup value={bumiStatus} onChange={setBumiStatus} options={['Yes','No']}/>
              </Field2>
              <Field2 label="Paid Up Capital (RM)" source="SSM">
                <Input value={paidUpCapital} onChange={setPaidUpCapital} placeholder="e.g. 500000"/>
              </Field2>
              <Field2 label="Authorized Capital (RM)" source="SSM">
                <Input value={authorizedCapital} onChange={setAuthorizedCapital} placeholder="e.g. 1000000"/>
              </Field2>
            </div>
            {/* Scope & Tax */}
            <p className="text-xs font-semibold text-gray-600 mt-4 mb-2">Scope & Tax</p>
            <div className="grid grid-cols-2 gap-4">
              <Field2 label="TIN (Tax Identification No.)" required source="Manual">
                <div className="relative">
                  <Input value={corpTIN} onChange={v=>{ setCorpTIN(v); setTinValid(null); }}
                    onBlur={()=>setTinValid(validateTIN(corpTIN))}
                    placeholder="e.g. AB1234567C"/>
                  {tinValid===true  && <span className="absolute right-2 top-2 text-green-500 text-xs">✓</span>}
                  {tinValid===false && <span className="absolute right-2 top-2 text-red-500 text-xs">✗</span>}
                </div>
                {tinValid===false && <p className="text-xs text-red-500 mt-1">Invalid format. Expected: 1-2 letters + 7-12 digits</p>}
              </Field2>
              <Field2 label="SST Registration No." source="Manual">
                <Input value={corpSST} onChange={setCorpSST} placeholder="Optional"/>
              </Field2>
              <Field2 label="Country of Operation" required>
                <Select value={countryOfOp} onChange={setCountryOfOp} options={[{value:'Malaysia',label:'Malaysia'},{value:'Singapore',label:'Singapore'},{value:'Indonesia',label:'Indonesia'}]}/>
              </Field2>
              <Field2 label="State of Operation" required={countryOfOp==='Malaysia'}>
                <Select value={stateOfOp} onChange={setStateOfOp} options={MY_STATES.map(s=>({value:s,label:s}))} placeholder="— Select —"/>
              </Field2>
              <Field2 label="FEN Resident Status">
                <Select value={fenResident} onChange={setFenResident} options={[{value:'',label:'— Select —'},{value:'Resident',label:'Resident'},{value:'Non-Resident',label:'Non-Resident'}]}/>
              </Field2>
              <Field2 label="Labuan Entity">
                <RadioGroup value={labuanEntity} onChange={setLabuanEntity} options={['Yes','No']}/>
              </Field2>
            </div>
            {/* Workforce & Financials */}
            <p className="text-xs font-semibold text-gray-600 mt-4 mb-2">Workforce & Financials</p>
            <div className="grid grid-cols-2 gap-4">
              <Field2 label="Annual Turnover (Actual, RM)" source="Manual">
                <Input value={turnoverActual} onChange={setTurnoverActual} placeholder="e.g. 2500000"/>
              </Field2>
              <Field2 label="Annual Turnover Range" required source="Manual">
                <Select value={turnoverRange} onChange={setTurnoverRange} options={TURNOVER_RANGES.map(r=>({value:r,label:r}))} placeholder="— Select —"/>
              </Field2>
              <Field2 label="No. of Employees (Actual)" source="Manual">
                <Input value={employeeActual} onChange={setEmployeeActual} placeholder="e.g. 25"/>
              </Field2>
              <Field2 label="Employee Range" source="Manual">
                <Select value={employeeRange} onChange={setEmployeeRange} options={EMPLOYEE_RANGES.map(r=>({value:r,label:r}))} placeholder="— Select —"/>
              </Field2>
              <Field2 label="Source of Repayment" required source="Manual">
                <Select value={sourceOfRepayment} onChange={setSourceOfRepayment} options={['Business Income','Rental Income','Investment Returns','Contract Revenue','Other'].map(r=>({value:r,label:r}))} placeholder="— Select —"/>
              </Field2>
              <Field2 label="Primary Income Document" source="OCR">
                <Select value={primaryIncomeDoc} onChange={setPrimaryIncomeDoc} options={['Audited Financial Statement','Management Accounts','Bank Statements (6 months)','Form B / BE','Form C (Company Tax)'].map(r=>({value:r,label:r}))} placeholder="— Select —"/>
              </Field2>
            </div>
          </div>
        </SubSection>

        {/* Customer Classification */}
        <SubSection title="Customer Classification">
          <div id="classification" className="scroll-mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Field2 label="Basic Group (BNM)"><Input value={effBasicGroup} readOnly/></Field2>
              <Field2 label="Constitution Code"><Input value={effConstitution} readOnly/></Field2>
              <Field2 label="Customer Sector Code">
                <Select value={customerSector} onChange={setCustomerSector} options={[
                  {value:'',label:'— Select —'},{value:'SME',label:'SME – Small Medium Enterprise'},
                  {value:'CORP',label:'Corporate'},{value:'GLC',label:'GLC – Government-Linked Company'},
                  {value:'NPO',label:'NPO – Non-Profit Organization'},
                ]}/>
              </Field2>
              <Field2 label="Bumiputera / NRCC">
                <Select value={nrccFlag} onChange={setNrccFlag} options={[{value:'',label:'— Select —'},{value:'B',label:'B – Bumiputera'},{value:'N',label:'N – Non-Bumiputera'},{value:'F',label:'F – Foreign'}]}/>
              </Field2>
              <Field2 label="SMI Flag">
                <RadioGroup value={smiFlag} onChange={setSmiFlag} options={['Yes','No']}/>
              </Field2>
              <Field2 label="GP Ratings">
                <Select value={gpRatings} onChange={setGpRatings} options={[{value:'',label:'— Select —'},{value:'GP1',label:'GP1'},{value:'GP2',label:'GP2'},{value:'GP3',label:'GP3'},{value:'GP4',label:'GP4'}]}/>
              </Field2>
            </div>
          </div>
        </SubSection>

        {/* Address */}
        <SubSection title="Address Information (Registered)">
          <div id="addressReg" className="scroll-mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field2 label="Registered Address Line 1" required source="SSM">
                  <Input value={regAddr1} onChange={setRegAddr1} placeholder="Street address from SSM" readOnly={corpLocked && !!regAddr1}/>
                </Field2>
              </div>
              <Field2 label="City" required source="SSM"><Input value={regCity} onChange={setRegCity} placeholder="e.g. Kuala Lumpur"/></Field2>
              <Field2 label="State" required source="SSM">
                <Select value={regState} onChange={setRegState} options={MY_STATES.map(s=>({value:s,label:s}))} placeholder="— Select —"/>
              </Field2>
              <Field2 label="Postcode" required source="SSM"><Input value={regPostal} onChange={setRegPostal} placeholder="e.g. 50100"/></Field2>
            </div>
          </div>
        </SubSection>
        <SubSection title="Address Information (Business / Office)">
          <div id="addressBiz" className="scroll-mt-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 mb-3 cursor-pointer">
              <input type="checkbox" checked={sameAddr} onChange={e=>{setSameAddr(e.target.checked); if(e.target.checked){setBizAddr1(regAddr1);setBizCity(regCity);setBizState(regState);setBizPostal(regPostal);}}}/>
              Same as Registered Address
            </label>
            {!sameAddr && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Field2 label="Business Address Line 1" required><Input value={bizAddr1} onChange={setBizAddr1}/></Field2></div>
                <Field2 label="City"><Input value={bizCity} onChange={setBizCity}/></Field2>
                <Field2 label="State"><Select value={bizState} onChange={setBizState} options={MY_STATES.map(s=>({value:s,label:s}))} placeholder="—"/></Field2>
                <Field2 label="Postcode"><Input value={bizPostal} onChange={setBizPostal}/></Field2>
              </div>
            )}
          </div>
        </SubSection>

        {/* Email / Contact */}
        <SubSection title="Email Information">
          <div id="email" className="scroll-mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Field2 label="Corporate Email" required>
                <Input value={corpEmail} onChange={setCorpEmail} placeholder="e.g. finance@company.com"/>
              </Field2>
            </div>
          </div>
        </SubSection>
        <SubSection title="Contact Person">
          <div id="contact" className="scroll-mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Field2 label="Contact Name" required><Input value={contactName} onChange={setContactName}/></Field2>
              <Field2 label="Mobile Phone" required><Input value={contactPhone} onChange={setContactPhone} placeholder="+60 12 345 6789"/></Field2>
              <Field2 label="Email"><Input value={contactEmail} onChange={setContactEmail}/></Field2>
            </div>
          </div>
        </SubSection>

        {/* Confirmation / AML Compliance */}
        <SubSection title="Confirmation">
          <div id="confirmation" className="scroll-mt-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">1. Does the customer have complex ownership/control structure?</p>
                <RadioGroup value={complexStructure} onChange={setComplexStructure} options={['Yes','No']}/>
                {complexStructure==='Yes' && <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">⚠ Complex structure detected — Enhanced Due Diligence (EDD) required. Document all beneficial ownership layers.</div>}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">2. Does the company have nominee / bearer shares?</p>
                <RadioGroup value={nomineeShares} onChange={setNomineeShares} options={['Yes','No']}/>
                {nomineeShares==='Yes' && <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">🚫 High-risk indicator — Nominee/bearer shares require additional AML assessment and senior approval.</div>}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">3. Customer Identification — Face-to-Face?</p>
                <RadioGroup value={isFaceToFace} onChange={setIsFaceToFace} options={['Yes','No']}/>
              </div>
              {isFaceToFace && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                  <Field2 label="Date of Contact" required><Input value={dateOfContact} onChange={setDateOfContact} placeholder="YYYY-MM-DD"/></Field2>
                  <Field2 label="Mode of Contact" required>
                    <Select value={modeOfContact} onChange={setModeOfContact} options={[{value:'',label:'—'},{value:'Face-to-Face',label:'Face-to-Face'},{value:'Video Call',label:'Video Call'},{value:'Phone',label:'Phone'}]}/>
                  </Field2>
                  <Field2 label="Contacted By" required><Input value={contactedBy} onChange={setContactedBy} placeholder="Officer name"/></Field2>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">4. Customer confirms intent to apply for HP financing?</p>
                <RadioGroup value={customerConfirmHP} onChange={setCustomerConfirmHP} options={['Yes','No']}/>
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={pdsConfirmed} onChange={e=>setPdsConfirmed(e.target.checked)} className="mt-0.5"/>
                  <span>Customer has received and acknowledged the <span className="font-medium">Product Disclosure Sheet (PDS)</span></span>
                </label>
                <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={marketingConsent} onChange={e=>setMarketingConsent(e.target.checked)} className="mt-0.5"/>
                  <span>Customer consents to receive marketing communications from HLB</span>
                </label>
              </div>
            </div>
          </div>
        </SubSection>

        {/* Management & Shareholder */}
        <SubSection title="Management & Shareholder">
          <div id="management" className="scroll-mt-4">
            {/* Guarantor rule banner */}
            {gr && (
              <div className={`mb-4 p-3 rounded border text-sm ${gr.mandatory?'bg-amber-50 border-amber-200 text-amber-800':'bg-blue-50 border-blue-200 text-blue-800'}`}>
                <p className="font-semibold">{gr.mandatory?'⚠ Guarantor Required':'ℹ Guarantor Note'}: {gr.desc}</p>
                <p className="text-xs mt-1">Signing Entity: {ENTITY_GUARANTOR[et]?.signatories}</p>
                {et==='E' && <p className="text-xs mt-1 font-bold text-amber-700">⚠ Partnership: ALL Partners must co-sign — incomplete signing is legally void.</p>}
              </div>
            )}
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                {expertianFetched ? `${directors.length} record(s)` : 'Not yet fetched'}
                {expertianFetched && <SourceTag src="Experian"/>}
              </span>
              <div className="flex gap-2">
                {!expertianFetched && corpLocked && (
                  <button onClick={fetchExperian} disabled={experianLoading} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
                    {experianLoading?'Fetching...':'⟳ Fetch from Experian'}
                  </button>
                )}
                <button onClick={()=>{ const id='m'+Date.now(); setDirectors(ds=>[...ds,{ id, name:'', icNo:'', nationality:'Malaysia', sharePercent:0, isCorporate:false, roles:['Director'], isUBO:false, isSignatory:false, isGuarantor:false }]); }} className="px-3 py-1.5 border border-gray-300 text-xs rounded hover:bg-gray-50">+ Add Manual</button>
              </div>
            </div>

            {/* Drill-down requirement notice for A/C/F/G/H */}
            {needsDrillDown && corpDirs.length > 0 && !drillComplete && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-1.5">
                <span className="flex-shrink-0">🔴</span>
                <span><strong>UBO Penetration Required (Entity {et}):</strong> Corporate shareholder(s) must be drilled-down to natural person(s) with &gt;25% effective shareholding or actual control. Click <strong>⊕ Drill-down</strong> for each corporate row.</span>
              </div>
            )}
            {!hasSignatory && directors.length > 0 && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex items-start gap-1.5">
                <span>⚠</span>
                <span><strong>Signatory Required:</strong> At least one person must be designated as Signatory before submission. {et==='E'?'All Partners must co-sign for Partnership.':''}</span>
              </div>
            )}

            {directors.length>0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Name / ID</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Role(s)</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500">Share %</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500">UBO</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500">Signatory</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-500">Guarantor</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directors.map(d=>(
                      <tr key={d.id} className={`border-b border-gray-100 hover:bg-gray-50 ${needsDrillDown && d.isCorporate && !drilledDirectors.has(d.id) ? 'bg-red-50' : ''}`}>
                        <td className="py-2 px-2">
                          {d.isCorporate
                            ? <span className="text-purple-700 font-medium">{d.name||'(name)'}</span>
                            : <span>{d.name||'(name)'}</span>
                          }
                          <div className="text-gray-400">{d.icNo}</div>
                          {d.isCorporate && <Badge label="Corporate" color="purple"/>}
                          {d.isCorporate && drilledDirectors.has(d.id) && <Badge label="✓ Drilled" color="green"/>}
                        </td>
                        <td className="py-2 px-2">{d.roles.join(', ')}</td>
                        <td className="py-2 px-2 text-center">
                          <input type="number" value={d.sharePercent} onChange={e=>setDirectors(ds=>ds.map(x=>x.id===d.id?{...x,sharePercent:+e.target.value}:x))} className="w-14 border border-gray-200 rounded px-1 py-0.5 text-center text-xs" min={0} max={100}/>%
                        </td>
                        <td className="py-2 px-2 text-center">
                          {d.isCorporate
                            ? <span className="text-gray-300">—</span>
                            : <input type="checkbox" checked={d.isUBO} onChange={()=>toggleUBO(d.id)} className="cursor-pointer"/>
                          }
                        </td>
                        <td className="py-2 px-2 text-center">
                          {et === 'E'
                            ? <input type="checkbox" checked={d.isSignatory} readOnly className="cursor-not-allowed opacity-70" title="All Partners must co-sign"/>
                            : <input type="checkbox" checked={d.isSignatory} onChange={()=>toggleSignatory(d.id)} className="cursor-pointer"/>
                          }
                        </td>
                        <td className="py-2 px-2 text-center">
                          {d.isCorporate
                            ? <span className="text-gray-300">—</span>
                            : et === 'E'
                              ? <input type="checkbox" checked={d.isGuarantor} readOnly className="cursor-not-allowed opacity-70" title="All Partners are guarantors for Partnership"/>
                              : <input type="checkbox" checked={d.isGuarantor} onChange={()=>toggleGuarantorFromDir(d.id)} className="cursor-pointer"/>
                          }
                        </td>
                        <td className="py-2 px-2">
                          {d.isCorporate && (
                            <button onClick={()=>{ setDrillTarget(d); setShowDrillDown(true); }}
                              className={`text-xs hover:underline ${needsDrillDown && !drilledDirectors.has(d.id) ? 'text-red-600 font-semibold' : 'text-blue-600'}`}>
                              ⊕ Drill-down{needsDrillDown && !drilledDirectors.has(d.id) ? ' ⚠' : ''}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SubSection>

        {/* UBO Identification */}
        <SubSection title="UBO Identification">
          <div id="ubo" className="scroll-mt-4">
            {uboRule && (
              <div className={`mb-3 p-2 rounded text-xs border ${uboRule.mode==='exempt'?'bg-green-50 border-green-200 text-green-700':'bg-blue-50 border-blue-200 text-blue-700'}`}>
                <span className="font-semibold">Rule ({uboRule.mode}): </span>{uboRule.desc}
              </div>
            )}
            {ubos.length===0 && (
              <p className="text-xs text-gray-400 italic">No UBO confirmed yet. Check boxes in Management table above, or add manually below.</p>
            )}
            {ubos.map(u=>(
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
                <div>
                  <span className="font-medium">{u.name}</span>
                  <span className="text-gray-400 ml-2 text-xs">{u.icNo}</span>
                  <span className="ml-2 text-xs text-gray-400">{u.sharePercent}% shareholding</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={u.source} color="blue"/>
                  <button onClick={()=>setUbos(prev=>prev.filter(x=>x.id!==u.id))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button onClick={()=>{ const id='ubo'+Date.now(); setUbos(prev=>[...prev,{ id, name:'', icNo:'', nationality:'Malaysia', sharePercent:0, source:'Manual' }]); }} className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50">+ Add UBO Manually</button>
              {uboRule?.mode==='exempt' && (
                <button onClick={()=>setUbos([{ id:'exempt', name:'EXEMPTED', icNo:'—', nationality:'—', sharePercent:0, source:'Exemption', exemptReason:'Listed Company / Government Entity' }])} className="text-xs px-3 py-1.5 border border-green-300 text-green-600 rounded hover:bg-green-50">✓ Apply Exemption</button>
              )}
            </div>
          </div>
        </SubSection>

        {/* Applicant Income */}
        <SubSection title="Applicant Income">
          <div id="applicantIncome" className="scroll-mt-4">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs text-gray-400">Enterprise income — used in DSR/DSCR calculation with Guarantor(s) income only</p>
              <SourceTag src="OCR"/>
            </div>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border border-gray-200 rounded">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Year</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Turnover (RM)</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Net Profit (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  {['2025','2024','2023'].map((yr,i)=>(
                    <tr key={yr} className="border-t border-gray-100">
                      <td className="py-2 px-3">{yr}</td>
                      <td className="py-2 px-3">
                        <input value={bizTurnover3Y[i]} onChange={e=>{ const a=[...bizTurnover3Y]; a[i]=e.target.value; setBizTurnover3Y(a); }} className="w-full border border-gray-200 rounded px-2 py-1 text-xs" placeholder="0"/>
                      </td>
                      <td className="py-2 px-3">
                        <input value={bizProfit3Y[i]} onChange={e=>{ const a=[...bizProfit3Y]; a[i]=e.target.value; setBizProfit3Y(a); }} className="w-full border border-gray-200 rounded px-2 py-1 text-xs" placeholder="0"/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field2 label="Monthly Net Declared Income (RM)" required source="Manual">
                <Input value={bizNetIncome} onChange={setBizNetIncome} placeholder="System-calculated or manual"/>
              </Field2>
            </div>
            <button onClick={()=>{ markComplete('applicantIncome'); markComplete('companyProfile'); markComplete('classification'); markComplete('addressReg'); markComplete('email'); markComplete('confirmation'); markComplete('management'); markComplete('ubo'); }} className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">✓ Save Applicant Info</button>
          </div>
        </SubSection>
      </SectionPanel>
    );
  }

  // ─── Section: Guarantor Information ──────────────────────────────────────
  function GuarantorSection() {
    return (
      <SectionPanel id="guarantor" icon="🤝" title="Guarantor Information">
        {gr?.mandatory && guarantors.length===0 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
            ⚠ {gr.desc} — at least one guarantor is required before submission.
          </div>
        )}
        {guarantors.length===0 && !gr?.mandatory && (
          <p className="mt-3 text-sm text-gray-400 italic">No guarantors added.</p>
        )}
        {guarantors.map((g,i)=>(
          <div key={g.id} className="mt-3 border border-gray-200 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Guarantor {i+1}</span>
              <div className="flex gap-2">
                <Badge label={g.relationship} color="purple"/>
                <Badge label={g.cifStatus==='ok'?'ETB':'NTB'} color={g.cifStatus==='ok'?'green':'blue'}/>
                <button onClick={()=>{ setGuarantors(gs=>gs.filter(x=>x.id!==g.id)); setDirectors(ds=>ds.map(d=>d.id===g.id?{...d,isGuarantor:false}:d)); }} className="text-xs text-red-400 hover:text-red-600">✕ Remove</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400 text-xs block">Name</span><span>{g.name}</span></div>
              <div><span className="text-gray-400 text-xs block">IC / ID No.</span><span>{g.icNo}</span></div>
              <div><span className="text-gray-400 text-xs block">Nationality</span><span>{g.nationality}</span></div>
              <div>
                <span className="text-gray-400 text-xs block">Monthly Income (RM)</span>
                <input type="number" value={g.income} onChange={e=>setGuarantors(gs=>gs.map(x=>x.id===g.id?{...x,income:+e.target.value}:x))} className="w-full border border-gray-200 rounded px-2 py-1 text-sm"/>
              </div>
            </div>
            {/* Verification checks */}
            <div className="mt-2 border-t border-gray-100 pt-2">
              <p className="text-xs text-gray-400 mb-1">Background checks</p>
              <div className="grid grid-cols-3 gap-2">
                {[['CIF Profile','ok'],['WT Whitelist','ok'],['Income DB','error'],['App History','ok'],['Pre-Consent','ok'],['AML / SIRON','ok']].map(([lbl,s])=>(
                  <ApiRow key={lbl} label={lbl} status={s as 'ok'|'error'}/>
                ))}
              </div>
            </div>
          </div>
        ))}
        <button onClick={()=>setShowAddGuar(true)} className="mt-3 px-4 py-2 border border-blue-500 text-blue-600 text-sm rounded hover:bg-blue-50">+ Add Guarantor</button>
      </SectionPanel>
    );
  }

  // ─── Section: Income Summary ──────────────────────────────────────────────
  function IncomeSummarySection() {
    return (
      <SectionPanel id="incomeSummary" icon="💰" title="Income Summary">
        {/* Income aggregation rule notice */}
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 flex items-start gap-1.5">
          <span>ℹ</span>
          <span><strong>Aggregation scope:</strong> DSR base = Main Applicant (Enterprise) + Guarantor(s) income only. UBO, Director (non-guarantor), and Shareholder income are <strong>excluded</strong>.</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Main Applicant (Enterprise)</p>
            <p className="text-xs text-gray-300 mb-1">Monthly Net Income</p>
            <p className="text-lg font-bold text-gray-800">RM {corpIncome.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Guarantor(s) Combined</p>
            <p className="text-xs text-gray-300 mb-1">{guarantors.length} guarantor(s)</p>
            <p className="text-lg font-bold text-gray-800">RM {gIncome.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 rounded p-3 text-center border border-blue-200">
            <p className="text-xs text-blue-500 mb-1">DSR Base (Combined)</p>
            <p className="text-xs text-blue-300 mb-1">Main Applicant + Guarantors</p>
            <p className="text-lg font-bold text-blue-700">RM {totalIncome.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-400">Monthly Instalment</p>
            <p className="font-bold text-gray-800">RM {instalment.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">DSR</p>
            <p className={`font-bold text-lg ${dsr<=60?'text-green-600':dsr<=80?'text-amber-600':'text-red-600'}`}>{dsr.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Threshold</p>
            <p className="text-sm text-gray-600">≤ 60%</p>
          </div>
          <Badge label={dsr===0?'—':dsr<=60?'Pass':'Fail'} color={dsr===0?'gray':dsr<=60?'green':'red'}/>
        </div>
      </SectionPanel>
    );
  }

  // ─── Section: Asset Information ───────────────────────────────────────────
  function AssetSection() {
    return (
      <SectionPanel id="asset" icon="🏦" title="Asset Information">
        <p className="mt-3 text-xs text-gray-400 italic">Asset information for Guarantor(s). Complete after Guarantor Information.</p>
        <SubSection title="Investments & Savings">
          <div id="investments">
            <p className="text-xs text-gray-400">No investments recorded.</p>
          </div>
        </SubSection>
        <SubSection title="Properties & EPF">
          <div id="properties">
            <p className="text-xs text-gray-400">No properties / EPF recorded.</p>
          </div>
        </SubSection>
      </SectionPanel>
    );
  }

  // ─── Section: Collateral & Seller ─────────────────────────────────────────
  function CollateralSection() {
    const models = vehicleMake ? (MOCK_VEHICLE_MODELS[vehicleMake]||[]) : [];
    const yearOptions = ['2025','2024','2023','2022','2021','2020','2019','2018'].map(y=>({value:y,label:y}));
    return (
      <SectionPanel id="collateral" icon="🚗" title="Collateral & Seller">
        <SubSection title="Purchase Detail">
          <div id="purchase">
            <div className="grid grid-cols-2 gap-4">
              <Field2 label="Vehicle Condition" required>
                <RadioGroup value={isNewVehicle} onChange={setIsNewVehicle} options={['New','Used','Reconditioned']}/>
              </Field2>
              <Field2 label="Vehicle Category">
                <Select value="" onChange={()=>{}} options={[{value:'MV',label:'MV – Motor Vehicle'},{value:'RB',label:'RB – Road Bus'},{value:'MC',label:'MC – Motor Cycle'}]} placeholder="MV – Motor Vehicle"/>
              </Field2>
            </div>
          </div>
        </SubSection>
        <SubSection title="Vehicle Detail">
          <div id="vehicle">
            <div className="grid grid-cols-2 gap-4">
              <Field2 label="Make / Brand" required>
                <Select value={vehicleMake} onChange={v=>{ setVehicleMake(v); setVehicleModel(''); setVehicleMSRP(''); }} options={VEHICLE_MAKES.map(m=>({value:m,label:m}))} placeholder="— Select Make —"/>
              </Field2>
              <Field2 label="Model / Variant" required>
                <Select value={vehicleModel} onChange={v=>{ setVehicleModel(v); const m=models.find(x=>x.model===v); setVehicleMSRP(m?String(m.msrp):''); }} options={models.map(m=>({value:m.model,label:m.model}))} placeholder="— Select Model —"/>
              </Field2>
              <Field2 label="Year of Manufacture" required>
                <Select value={vehicleYear} onChange={setVehicleYear} options={yearOptions} placeholder="— Year —"/>
              </Field2>
              <Field2 label="Indicative Price / MSRP (RM)" source="System">
                <Input value={vehicleMSRP} onChange={setVehicleMSRP} placeholder="Auto-filled from FIS"/>
              </Field2>
              <Field2 label="VIN / Chassis No.">
                <Input value={vehicleVIN} onChange={setVehicleVIN} placeholder="17-character VIN"/>
              </Field2>
            </div>
          </div>
        </SubSection>
        <SubSection title="Dealer Info">
          <div id="dealer">
            <div className="grid grid-cols-2 gap-4">
              <Field2 label="Dealer Code">
                <Input value={dealerCode} onChange={setDealerCode} placeholder="e.g. D12345"/>
              </Field2>
              <Field2 label="Dealer Name">
                <Input value={dealerName} onChange={setDealerName} placeholder="Dealer company name"/>
              </Field2>
            </div>
          </div>
        </SubSection>
        <SubSection title="Insurance">
          <div id="insurance">
            <p className="text-xs text-gray-400">Insurance details to be confirmed at Disbursement stage.</p>
          </div>
        </SubSection>
      </SectionPanel>
    );
  }

  // ─── Section: Facility / Financing ────────────────────────────────────────
  function FacilitySection() {
    const msrp = parseFloat(vehicleMSRP)||0;
    const ltv  = msrp>0 && principal>0 ? (principal/msrp)*100 : 0;
    const totalInterest = instalment*months - principal;
    return (
      <SectionPanel id="facility" icon="💳" title="Facility / Financing">
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field2 label="Loan / Financing Amount (RM)" required>
            <Input value={loanAmount} onChange={setLoanAmount} placeholder="e.g. 150000"/>
          </Field2>
          <Field2 label="Down Payment (RM)">
            <Input value={downPayment} onChange={setDownPayment} placeholder="e.g. 10000"/>
          </Field2>
          <Field2 label="Tenure (Months)" required>
            <Select value={tenureMonths} onChange={setTenureMonths} options={[24,36,48,60,72,84,96].map(n=>({value:String(n),label:`${n} Months`}))} placeholder="— Select —"/>
          </Field2>
          <Field2 label="EIR (Effective Interest Rate %)" required>
            <Input value={eirValue} onChange={setEirValue} placeholder="e.g. 3.5"/>
          </Field2>
          <Field2 label="Islamic Financing">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={islamicMode} onChange={e=>setIslamicMode(e.target.checked)}/>
              IHP (Islamic Hire Purchase)
            </label>
          </Field2>
        </div>
        {/* Computed results */}
        {instalment>0 && (
          <div className="mt-4 bg-gray-50 rounded p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-3">📊 Financial Summary</p>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-xs text-gray-400">Monthly Instalment</p>
                <p className="font-bold text-blue-700 text-base">RM {instalment.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Total Interest</p>
                <p className="font-bold text-gray-800">RM {totalInterest>0?totalInterest.toFixed(0):'—'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">LTV</p>
                <p className={`font-bold text-base ${ltv<=90?'text-green-600':'text-red-600'}`}>{ltv>0?ltv.toFixed(1)+'%':'—'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">DSR</p>
                <p className={`font-bold text-base ${dsr<=60?'text-green-600':dsr<=80?'text-amber-600':'text-red-600'}`}>{dsr>0?dsr.toFixed(1)+'%':'—'}</p>
              </div>
            </div>
          </div>
        )}
        <SubSection title="Repayment Schedule">
          <div id="repayment">
            {months>0 && instalment>0 ? (
              <div className="overflow-y-auto max-h-56">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr><th className="text-left py-1.5 px-2 font-medium text-gray-500">Period</th><th className="text-right py-1.5 px-2 font-medium text-gray-500">Instalment (RM)</th><th className="text-right py-1.5 px-2 font-medium text-gray-500">Balance (RM)</th></tr>
                  </thead>
                  <tbody>
                    {Array.from({length:Math.min(months,12)}).map((_,i)=>{
                      const bal = principal - (instalment - principal*monthlyRate)*(Math.pow(1+monthlyRate,i+1)-1)/monthlyRate;
                      return <tr key={i} className="border-b border-gray-100"><td className="py-1.5 px-2">{i+1}</td><td className="py-1.5 px-2 text-right">{instalment.toFixed(2)}</td><td className="py-1.5 px-2 text-right">{Math.max(0,bal).toFixed(0)}</td></tr>;
                    })}
                    {months>12 && <tr><td colSpan={3} className="py-1.5 px-2 text-gray-400 text-center">… {months-12} more periods</td></tr>}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-xs text-gray-400">Enter loan amount, tenure and EIR to generate schedule.</p>}
          </div>
        </SubSection>
        <div className="mt-4 flex justify-end">
          <button onClick={()=>{ markComplete('collateral'); markComplete('facility'); }} className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">✓ Save Facility</button>
        </div>
      </SectionPanel>
    );
  }

  // ─── Section: Risk Relate ─────────────────────────────────────────────────
  function RiskSection() {
    return (
      <SectionPanel id="aml" icon="⚠️" title="Risk Relate">
        <p className="mt-3 text-xs text-gray-500 mb-4">Risk assessment results are populated after submission to Risk Engine. Sales view only — no editing.</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id:'aml', label:'AML / SIRON CDD', status:'Pending' },
            { id:'credit', label:'Credit Summary (CCRIS/CTOS)', status:'Pending' },
            { id:'uw', label:'UW Result / AIP', status:'Pending' },
            { id:'customer', label:'Customer', status:'Pending' },
            { id:'tvcheck', label:'TV-Check', status:'Pending' },
            { id:'exposure', label:'Exposure Summary', status:'Pending' },
          ].map(r=>(
            <div key={r.id} id={r.id} className="border border-gray-200 rounded p-3">
              <p className="text-xs font-semibold text-gray-600">{r.label}</p>
              <Badge label={r.status} color="gray"/>
            </div>
          ))}
        </div>
      </SectionPanel>
    );
  }

  // ─── Modals ────────────────────────────────────────────────────────────────
  function AddGuarantorModal() {
    if (!showAddGuar) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[480px] p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Add Guarantor</h3>
            <button onClick={()=>setShowAddGuar(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="space-y-3">
            <Field2 label="Name" required><Input value={newGuar.name||''} onChange={v=>setNewGuar(g=>({...g,name:v}))}/></Field2>
            <Field2 label="IC / Passport No." required><Input value={newGuar.icNo||''} onChange={v=>setNewGuar(g=>({...g,icNo:v}))}/></Field2>
            <Field2 label="Relationship">
              <Select value={newGuar.relationship||''} onChange={v=>setNewGuar(g=>({...g,relationship:v}))} options={[
                {value:'Guarantor',label:'Guarantor'},
                {value:'Director / Guarantor',label:'Director / Guarantor'},
                {value:'Director / Shareholder / Guarantor',label:'Director / Shareholder / Guarantor'},
                {value:'Partner of Partnership',label:'Partner of Partnership'},
                {value:'Corporate Guarantor',label:'Corporate Guarantor (CG)'},
              ]} placeholder="—"/>
            </Field2>
            <Field2 label="Monthly Income (RM)"><Input value={String(newGuar.income||'')} onChange={v=>setNewGuar(g=>({...g,income:+v}))}/></Field2>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={()=>{ setShowAddGuar(false); setNewGuar({}); }} className="px-4 py-2 border border-gray-300 rounded text-sm">Cancel</button>
            <button onClick={()=>{
              if (newGuar.name && newGuar.icNo) {
                // Age check from IC (format: YYMMDD-PP-XXXX)
                const ic = (newGuar.icNo||'').replace(/[-\s]/g,'');
                const yymmdd = ic.substring(0,6);
                if (yymmdd.length===6) {
                  const yy=parseInt(yymmdd.substring(0,2)); const yr=yy<=26?2000+yy:1900+yy;
                  const age=new Date().getFullYear()-yr;
                  if (age<18||age>75) { alert(`Guarantor age (${age}) must be between 18 and 75.`); return; }
                }
                const id='g'+Date.now();
                setGuarantors(gs=>[...gs,{ id, name:newGuar.name!, icNo:newGuar.icNo!, nationality:'Malaysia', relationship:newGuar.relationship||'Guarantor', cifStatus:'ok', income:newGuar.income||0 }]);
                setShowAddGuar(false); setNewGuar({});
              }
            }} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Add Guarantor</button>
          </div>
        </div>
      </div>
    );
  }

  function DrillDownModal() {
    const [ddIdNo, setDdIdNo] = useState('');
    const [ddResult, setDdResult] = useState<'idle'|'loading'|'found'>('idle');
    if (!showDrillDown || !drillTarget) return null;
    function doDD() {
      setDdResult('loading');
      setTimeout(()=>setDdResult('found'),1500);
    }
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[520px] p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">⊕ UBO Drill-down: {drillTarget.name}</h3>
            <button onClick={()=>{ setShowDrillDown(false); setDrillTarget(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <p className="text-xs text-gray-500 mb-4">Corporate shareholder holding {drillTarget.sharePercent}%. Enter their SSM registration number to fetch next-level shareholders.</p>
          <div className="flex gap-2 mb-4">
            <Input value={ddIdNo} onChange={setDdIdNo} placeholder="Corporate shareholder SSM ID"/>
            <button onClick={doDD} disabled={!ddIdNo} className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 whitespace-nowrap">{ddResult==='loading'?'…':'Fetch'}</button>
          </div>
          {ddResult==='found' && (
            <div className="border border-green-200 bg-green-50 rounded p-3">
              <p className="text-xs text-green-700 font-semibold mb-2">✓ Next-level shareholders found:</p>
              <div className="text-xs text-gray-600">
                {[
                  { name:'CHAN WEI KIAT', icNo:'810301-14-9999', pct:0.70 },
                  { name:'LIM AH KOW',   icNo:'850615-07-1234', pct:0.30 },
                ].map(person=>(
                  <div key={person.name} className="flex items-center justify-between py-1 border-b border-green-100 last:border-0">
                    <span>{person.name} — {Math.round(drillTarget.sharePercent * person.pct)}%</span>
                    <button onClick={()=>{
                      const id = 'ubo_dd'+Date.now();
                      setUbos(prev=>[...prev,{
                        id, name:person.name, icNo:person.icNo, nationality:'Malaysia',
                        sharePercent: Math.round(drillTarget.sharePercent * person.pct),
                        source: 'Drill-down via '+drillTarget.name,
                      }]);
                      setDrilledDirectors(prev=>{ const n=new Set(prev); n.add(drillTarget.id); return n; });
                      setShowDrillDown(false); setDrillTarget(null);
                    }} className="text-blue-600 hover:underline">Set as UBO</button>
                  </div>
                ))}
                <button onClick={()=>{
                  setDrilledDirectors(prev=>{ const n=new Set(prev); n.add(drillTarget.id); return n; });
                  setShowDrillDown(false); setDrillTarget(null);
                }} className="mt-2 w-full text-center text-xs text-green-700 font-semibold hover:underline">
                  ✓ Mark drill-down complete (no additional UBO)
                </button>
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button onClick={()=>{ setShowDrillDown(false); setDrillTarget(null); }} className="px-4 py-2 border border-gray-300 rounded text-sm">Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Input helper with onBlur support ─────────────────────────────────────
  // (using JSX inline above works; extended version if needed)

  // ─── Render ────────────────────────────────────────────────────────────────
  const canSubmit = corpLocked && !!enterpriseType && !!loanAmount && !!tenureMonths && !!vehicleMake && hasSignatory && mandatoryGuarSatisfied;
  const missingList = [
    !corpLocked && 'Company not locked',
    !enterpriseType && 'Enterprise Type',
    !corpTIN && 'TIN',
    !loanAmount && 'Loan Amount',
    !tenureMonths && 'Tenure',
    !vehicleMake && 'Vehicle',
    (!!enterpriseType && !hasSignatory) && 'At least 1 Signatory required',
    gr?.mandatory && guarantors.length === 0 && `${gr.type} Guarantor required (${gr.desc.split(' ')[0]})`,
    (needsDrillDown && !drillComplete) && 'UBO Drill-down incomplete for corporate shareholder(s)',
  ].filter(Boolean) as string[];

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 text-sm font-sans overflow-hidden">
      {/* ── Left Navigation ── */}
      <div className="w-[260px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        {NavSidebar()}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab header */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0">
          <span className="text-sm font-medium text-gray-600">📋 {appNo}</span>
          <span className="ml-3 text-xs text-gray-400">{appType} Application — Created {now}</span>
        </div>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-y-auto p-4">
          {ProcessSummarySection()}
          {IdentitySection()}
          {AppDetailsSection()}
          {appType==='Non-Individual' && ApplicantInfoSection()}
          {GuarantorSection()}
          {IncomeSummarySection()}
          {AssetSection()}
          {CollateralSection()}
          {FacilitySection()}
          {RiskSection()}
        </div>

        {/* ── Bottom Action Bar ── */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-xs font-semibold uppercase ${statusColor}`}>{statusLabel}</span>
            {missingList.length>0 && (
              <span className="text-xs text-gray-400">Missing: {missingList.slice(0,3).join(', ')}{missingList.length>3?` +${missingList.length-3} more`:''}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 text-sm rounded text-gray-600 hover:bg-gray-50">Sync from OCR</button>
            <button className="px-4 py-2 border border-gray-300 text-sm rounded text-gray-600 hover:bg-gray-50">Save</button>
            <button disabled={!canSubmit} className={`px-5 py-2 text-sm rounded font-medium ${canSubmit?'bg-blue-600 text-white hover:bg-blue-700':'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Submit</button>
            <button className="px-4 py-2 border border-gray-300 text-sm rounded text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-[280px] flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
        {RightPanel()}
      </div>

      {/* Modals */}
      {AddGuarantorModal()}
      {DrillDownModal()}
    </div>
  );
}
