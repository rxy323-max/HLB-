'use client';

import { useState } from 'react';
import Link from 'next/link';

type AppStatus = 'Application Input' | 'AIP Excellent' | 'AIP Pass' | 'AIP Refer' | 'AIP Failed'
  | 'Submit to CED' | 'KIV CED' | 'Reject' | 'Printing of Letter' | 'Pending Disbursement Doc'
  | 'Sales Defect Pending Rectification';

type AppEntry = {
  ref: string; applicant: string; nric: string;
  vehicle: string; dealer: string;
  loanAmt: number; purchasePrice: number;
  product: 'HP' | 'IHP'; type: 'Conventional' | 'Islamic';
  status: AppStatus; date: string;
  tags: string[];
  officer: string; branch: string;
  rework: boolean;
};

const MOCK_APPS: AppEntry[] = [
  {
    ref: 'PCJ/HP/2026/W0004724', applicant: 'Lim Boon Keong', nric: '761203-10-5981',
    vehicle: 'Toyota Vios 1.5G CVT', dealer: 'Auto City Sdn Bhd',
    loanAmt: 75000, purchasePrice: 89980,
    product: 'HP', type: 'Conventional', status: 'AIP Excellent', date: '2026-04-25',
    tags: ['Greenlane'], officer: 'Ahmad Razif', branch: 'PJ Branch', rework: false,
  },
  {
    ref: 'PCJ/HP/2026/W0004511', applicant: 'Nurul Ain Binti Aziz', nric: '890312-14-2234',
    vehicle: 'Perodua Myvi 1.5 AV CVT', dealer: 'Perodua Sales Sdn Bhd',
    loanAmt: 45000, purchasePrice: 59990,
    product: 'HP', type: 'Conventional', status: 'Printing of Letter', date: '2026-04-22',
    tags: ['HP Line'], officer: 'Ahmad Razif', branch: 'PJ Branch', rework: false,
  },
  {
    ref: 'PCJ/IHP/2026/W0004102', applicant: 'Mohd Fadzil Bin Karim', nric: '750808-08-5512',
    vehicle: 'BMW 3 Series 330e M Sport', dealer: 'Autohaus Malaysia',
    loanAmt: 250000, purchasePrice: 318380,
    product: 'IHP', type: 'Islamic', status: 'KIV CED', date: '2026-04-18',
    tags: ['Islamic'], officer: 'Siti Hajar', branch: 'KL HQ', rework: false,
  },
  {
    ref: 'PCJ/HP/2026/W0003891', applicant: 'Tan Wei Ming', nric: '920415-10-1122',
    vehicle: 'Honda City 1.5 V Sensing CVT', dealer: 'Direct',
    loanAmt: 88000, purchasePrice: 111900,
    product: 'HP', type: 'Conventional', status: 'Sales Defect Pending Rectification', date: '2026-04-10',
    tags: [], officer: 'Ahmad Razif', branch: 'PJ Branch', rework: true,
  },
  {
    ref: 'PCJ/HP/2025/W0009921', applicant: 'Rajesh A/L Kumar', nric: '830722-10-6631',
    vehicle: 'Proton X50 1.5T Standard CVT', dealer: 'Proton Edar Sdn Bhd',
    loanAmt: 55000, purchasePrice: 79200,
    product: 'HP', type: 'Conventional', status: 'Reject', date: '2025-12-01',
    tags: [], officer: 'Siti Hajar', branch: 'KL HQ', rework: false,
  },
];

const STATUS_STYLE: Record<string, string> = {
  'AIP Excellent':                     'bg-green-100 text-green-700',
  'AIP Pass':                          'bg-green-50  text-green-600',
  'AIP Refer':                         'bg-yellow-100 text-yellow-700',
  'AIP Failed':                        'bg-orange-100 text-orange-700',
  'Submit to CED':                     'bg-blue-100  text-blue-700',
  'Application Input':                 'bg-gray-100  text-gray-600',
  'Printing of Letter':                'bg-purple-100 text-purple-700',
  'Pending Disbursement Doc':          'bg-indigo-100 text-indigo-700',
  'KIV CED':                           'bg-amber-100  text-amber-700',
  'Reject':                            'bg-red-100   text-red-600',
  'Sales Defect Pending Rectification':'bg-rose-100   text-rose-700',
};

const TAG_STYLE: Record<string, string> = {
  'Greenlane': 'bg-green-50 text-green-600 border-green-200',
  'HP Line':   'bg-blue-50  text-blue-600  border-blue-200',
  'Islamic':   'bg-teal-50  text-teal-600  border-teal-200',
  'Fleet':     'bg-violet-50 text-violet-600 border-violet-200',
};

const CATEGORIES = ['All', 'New Cases', 'Rework Cases', 'Cancel / Reject'];

export default function ApplicationListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = MOCK_APPS.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q || [a.ref, a.applicant, a.nric, a.vehicle, a.officer].some((f) =>
      f.toLowerCase().includes(q)
    );
    const matchCategory =
      category === 'All' ? true
      : category === 'New Cases'    ? !a.rework && a.status !== 'Reject'
      : category === 'Rework Cases' ? a.rework
      : a.status === 'Reject';
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const fmtRM = (n: number) => `RM ${n.toLocaleString('en-MY')}`;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#D0021B] text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl tracking-wide">HLB</span>
          <span className="text-sm opacity-75 border-l border-white/30 pl-3">CrediOS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">Sales Officer · Ahmad Razif</span>
          <Link href="/"
            className="text-xs px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 transition-colors">
            + New Application
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Page title + summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-800">Application List</h1>
            <p className="text-xs text-gray-400 mt-0.5">HP / IHP · {MOCK_APPS.length} total cases</p>
          </div>
          <div className="flex gap-3 text-xs text-center">
            {[
              ['Active', MOCK_APPS.filter((a) => !['Reject'].includes(a.status)).length, 'text-blue-600'],
              ['Approved', MOCK_APPS.filter((a) => a.status === 'Printing of Letter').length, 'text-green-600'],
              ['Pending',  MOCK_APPS.filter((a) => a.status === 'KIV CED').length, 'text-amber-600'],
            ].map(([label, count, color]) => (
              <div key={String(label)} className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <p className={`text-lg font-bold ${color}`}>{count}</p>
                <p className="text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category tabs + search + status filter */}
        <div className="bg-white rounded-lg shadow-sm p-3 flex flex-wrap items-center gap-3">
          {/* Tabs */}
          <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === c ? 'bg-[#D0021B] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}>
                {c}
              </button>
            ))}
          </div>

          {/* Search */}
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ref no / name / NRIC / vehicle / officer…"
            className="flex-1 min-w-48 border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400" />

          {/* Status filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
            <option value="">All Statuses</option>
            {Object.keys(STATUS_STYLE).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-12">No applications match your filters.</p>
          )}
          {filtered.map((a) => (
            <div key={a.ref} className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-start gap-4">
                {/* Left: ref + date */}
                <div className="w-48 shrink-0">
                  <p className="text-xs font-mono font-semibold text-gray-800 leading-tight">{a.ref}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.date}</p>
                  {a.rework && (
                    <span className="text-xs text-rose-500 font-medium">Rework</span>
                  )}
                </div>

                {/* Centre: applicant + vehicle */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{a.applicant}</p>
                  <p className="text-xs text-gray-400">{a.nric}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.vehicle} · {a.dealer}</p>
                </div>

                {/* Tags + product */}
                <div className="flex flex-wrap gap-1 w-32 justify-end">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{a.product}</span>
                  {a.tags.map((t) => (
                    <span key={t} className={`text-xs px-1.5 py-0.5 rounded border font-medium ${TAG_STYLE[t] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Loan amount */}
                <div className="w-28 text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-800">{fmtRM(a.loanAmt)}</p>
                  <p className="text-xs text-gray-400">of {fmtRM(a.purchasePrice)}</p>
                </div>

                {/* Status */}
                <div className="w-44 text-right shrink-0">
                  <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLE[a.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {a.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">{a.officer} · {a.branch}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
