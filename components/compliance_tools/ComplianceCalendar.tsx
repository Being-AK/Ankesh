import React, { useState } from 'react';
import { Calendar, Search, Filter, AlertTriangle, FileText, Clock, HelpCircle } from 'lucide-react';

interface DueDate {
  id: string;
  name: string;
  form: string;
  category: 'GST' | 'IT' | 'TDS' | 'ROC' | 'PF';
  frequency: string;
  dueDate: string;
  taxpayer: string;
  consequence: string;
  priority: 'Critical' | 'High' | 'Medium';
}

const COMPLIANCE_DEADLINES: DueDate[] = [
  {
    id: 'gstr1-monthly',
    name: 'GSTR-1 (Outward Supplies Statement)',
    form: 'GSTR-1 (Monthly)',
    category: 'GST',
    frequency: 'Monthly',
    dueDate: '11th of succeeding month',
    taxpayer: 'Regular Taxpayers (Turnover > ₹5 Crores or opted out of QRMP)',
    consequence: '₹50/day late fee (₹20 for Nil return). Inability of buyers to claim matching GSTR-2B Input Tax Credit (ITC).',
    priority: 'High'
  },
  {
    id: 'gstr1-qrmp',
    name: 'GSTR-1 (Outward Supplies under QRMP)',
    form: 'GSTR-1 (Quarterly)',
    category: 'GST',
    frequency: 'Quarterly',
    dueDate: '13th of month following the quarter',
    taxpayer: 'QRMP Taxpayers (Turnover up to ₹5 Crores who opted for quarterly)',
    consequence: 'Late fee of ₹50/day (Nil: ₹20/day). Invoice Furnishing Facility (IFF) window closes, blocking buyer credit.',
    priority: 'Medium'
  },
  {
    id: 'gstr3b-monthly',
    name: 'GSTR-3B (Summary Return & Tax Payment)',
    form: 'GSTR-3B (Monthly)',
    category: 'GST',
    frequency: 'Monthly',
    dueDate: '20th of succeeding month',
    taxpayer: 'Regular Taxpayers (Turnover > ₹5 Crores or opted out of QRMP)',
    consequence: '₹50/day late fee (₹20 for Nil) + Section 50 interest @ 18% per annum on the Net Cash Tax Liability. E-Way bill blocking after 2 missed periods.',
    priority: 'Critical'
  },
  {
    id: 'gstr3b-qrmp-a',
    name: 'GSTR-3B (Summary Return - Category A States)',
    form: 'GSTR-3B (Quarterly)',
    category: 'GST',
    frequency: 'Quarterly',
    dueDate: '22nd of month following the quarter',
    taxpayer: 'QRMP taxpayers in South & West India (MH, KA, GJ, TN, AP, KL, etc.)',
    consequence: '₹50/day late fee + Section 50 cash ledger interest @ 18% p.a. GSTR-1 matching issues.',
    priority: 'High'
  },
  {
    id: 'gstr3b-qrmp-b',
    name: 'GSTR-3B (Summary Return - Category B States)',
    form: 'GSTR-3B (Quarterly)',
    category: 'GST',
    frequency: 'Quarterly',
    dueDate: '24th of month following the quarter',
    taxpayer: 'QRMP taxpayers in North & East India (DL, HR, UP, WB, BR, PJ, etc.)',
    consequence: '₹50/day late fee + Section 50 interest @ 18% p.a.',
    priority: 'High'
  },
  {
    id: 'pmt06-qrmp',
    name: 'Challan Payment for Monthly Tax under QRMP',
    form: 'Form PMT-06',
    category: 'GST',
    frequency: 'Monthly',
    dueDate: '25th of succeeding month (M1 & M2)',
    taxpayer: 'All QRMP registered businesses',
    consequence: '18% p.a. interest under Section 50 on short payment or late payment of cash tax liability.',
    priority: 'High'
  },
  {
    id: 'gstr9-annual',
    name: 'GST Annual Return & Reconciliation (GSTR-9 & 9C)',
    form: 'GSTR-9 & 9C',
    category: 'GST',
    frequency: 'Annual',
    dueDate: '31st December of succeeding FY',
    taxpayer: 'Registered taxpayers with turnover exceeding ₹2 Crores (9C is audit-reconciliation for > ₹5 Crores)',
    consequence: 'Late fee of ₹200/day (₹100 CGST + ₹100 SGST) subject to 0.5% turnover cap. Non-compliance audits.',
    priority: 'High'
  },
  {
    id: 'itr-individual',
    name: 'Income Tax Return (Non-Audit Cases)',
    form: 'ITR-1 / ITR-2 / ITR-4',
    category: 'IT',
    frequency: 'Annual',
    dueDate: '31st July of Assessment Year (31st July 2026)',
    taxpayer: 'Individuals, Salaried, HUFs, Partners, Businesses without audit requirements',
    consequence: 'Section 234F fee up to ₹5,000. Interest under Section 234A (1% per month on outstanding tax). Inability to carry forward business losses.',
    priority: 'Critical'
  },
  {
    id: 'tax-audit-report',
    name: 'Filing of Tax Audit Report',
    form: 'Form 3CD / 3CA / 3CB',
    category: 'IT',
    frequency: 'Annual',
    dueDate: '30th September of Assessment Year (30th September 2026)',
    taxpayer: 'Businesses with turnover > ₹10 Crores (if cash trans <= 5%) or ₹1 Crore (general). Professionals with receipts > ₹75 Lakhs.',
    consequence: 'Penalty under Section 271B equal to 0.5% of turnover or gross receipts, capped at ₹1.5 Lakhs.',
    priority: 'Critical'
  },
  {
    id: 'itr-corporate',
    name: 'Income Tax Return (Audit & Corporate Cases)',
    form: 'ITR-6 / ITR-5',
    category: 'IT',
    frequency: 'Annual',
    dueDate: '31st October of Assessment Year (31st October 2026)',
    taxpayer: 'All companies (Private/Public), working partners of firms subject to audit, and taxpayers under transfer pricing',
    consequence: 'Section 234F late fee of ₹5,000 + 1% per month interest under Section 234A. Reopening of assessment risks.',
    priority: 'Critical'
  },
  {
    id: 'tds-payment',
    name: 'Monthly TDS Payment Outflow',
    form: 'Challan ITNS 281',
    category: 'TDS',
    frequency: 'Monthly',
    dueDate: '7th of succeeding month (30th April for March TDS)',
    taxpayer: 'All deductors (Corporate and specified individuals/firms)',
    consequence: '1.5% per month interest from date of deduction to date of payment under Section 201(1A). Expense disallowance under Section 40(a)(ia).',
    priority: 'Critical'
  },
  {
    id: 'tds-q1',
    name: 'Quarterly TDS Return (Q1 April - June)',
    form: 'Form 24Q / 26Q / 27Q (Q1)',
    category: 'TDS',
    frequency: 'Quarterly',
    dueDate: '31st July of succeeding financial year',
    taxpayer: 'All deductors filing quarterly statements',
    consequence: 'Section 234E late fee of ₹200 per day from due date to actual filing date, capped at total TDS amount. Section 271H penalty from ₹10,000 to ₹1,00,000.',
    priority: 'High'
  },
  {
    id: 'tds-q2',
    name: 'Quarterly TDS Return (Q2 July - September)',
    form: 'Form 24Q / 26Q / 27Q (Q2)',
    category: 'TDS',
    frequency: 'Quarterly',
    dueDate: '31st October',
    taxpayer: 'All deductors filing quarterly statements',
    consequence: '₹200/day Section 234E penalty. Inability of deductees to claim TDS credit in Form 26AS/AIS.',
    priority: 'High'
  },
  {
    id: 'tds-q3',
    name: 'Quarterly TDS Return (Q3 October - December)',
    form: 'Form 24Q / 26Q / 27Q (Q3)',
    category: 'TDS',
    frequency: 'Quarterly',
    dueDate: '31st January of succeeding year',
    taxpayer: 'All deductors filing quarterly statements',
    consequence: '₹200/day Section 234E penalty + deductee credit mismatch issues.',
    priority: 'High'
  },
  {
    id: 'tds-q4',
    name: 'Quarterly TDS Return (Q4 January - March)',
    form: 'Form 24Q / 26Q / 27Q (Q4)',
    category: 'TDS',
    frequency: 'Quarterly',
    dueDate: '31st May of succeeding year',
    taxpayer: 'All deductors filing quarterly statements',
    consequence: '₹200/day late fee + deduction default interest penalties.',
    priority: 'High'
  },
  {
    id: 'mca-dir3-kyc',
    name: 'Director KYC Verification filing',
    form: 'Form DIR-3 KYC',
    category: 'ROC',
    frequency: 'Annual',
    dueDate: '30th September of every year',
    taxpayer: 'All Directors holding active DIN (Director Identification Number)',
    consequence: 'Deactivation of DIN. Re-activation late fee penalty of ₹5,000 per director.',
    priority: 'High'
  },
  {
    id: 'mca-aoc4',
    name: 'Filing of Annual Financial Statements',
    form: 'Form AOC-4',
    category: 'ROC',
    frequency: 'Annual',
    dueDate: 'Within 30 days of holding AGM (Generally by 30th October)',
    taxpayer: 'All registered Companies (Private, Public, OPC, NPL)',
    consequence: '₹100 per day late fee automatically accrued per form without upper limit. Prosecution of Directors for persistent defaults.',
    priority: 'Critical'
  },
  {
    id: 'mca-mgt7',
    name: 'Filing of Annual Returns',
    form: 'Form MGT-7',
    category: 'ROC',
    frequency: 'Annual',
    dueDate: 'Within 60 days of holding AGM (Generally by 29th November)',
    taxpayer: 'All registered Companies (Private, Public, OPC)',
    consequence: '₹100 per day automatic late fee without upper limit.',
    priority: 'Critical'
  },
  {
    id: 'mca-msme1-h1',
    name: 'MSME Outstandings Half Yearly Return (H1 Apr-Sep)',
    form: 'Form MSME-1 (H1)',
    category: 'ROC',
    frequency: 'Half-Yearly',
    dueDate: '31st October of every year',
    taxpayer: 'Companies with outstanding dues exceeding 45 days to MSME vendors',
    consequence: 'Penal interest on delayed payments to MSME vendors (3 times bank rate) + MCA regulatory penalties.',
    priority: 'Medium'
  },
  {
    id: 'pf-esic-monthly',
    name: 'Monthly EPF & ESIC Return & Payment',
    form: 'PF ECR & ESIC Challan',
    category: 'PF',
    frequency: 'Monthly',
    dueDate: '15th of succeeding month',
    taxpayer: 'All establishments with EPF (>= 20 workers) or ESIC (>= 10 workers) registrations',
    consequence: 'Interest under Section 7Q @ 12% p.a. + Damages under Section 14B (up to 25% p.a.) on delayed PF deposits. Disallowance of employer portion expense.',
    priority: 'Critical'
  }
];

export const ComplianceCalendarTool: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'GST' | 'IT' | 'TDS' | 'ROC' | 'PF'>('All');

  const filteredDeadlines = COMPLIANCE_DEADLINES.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.form.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.taxpayer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6" id="compliance-calendar-component">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          📅 Statutory Compliance Due Dates Registry (FY 2025–26)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Stay clear of statutory penalties. Look up filing dates, taxpayer criteria, and automatic late fee schedules for Income Tax, GST, TDS, ROC, and PF/ESIC.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search return type, form name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1 w-full md:w-auto justify-end">
          {(['All', 'GST', 'IT', 'TDS', 'ROC', 'PF'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all border ${
                selectedCategory === cat
                  ? 'bg-corporate text-white border-corporate dark:bg-gold dark:text-navy dark:border-gold shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-700'
              }`}
            >
              {cat === 'All' ? 'All Deadlines' : cat === 'IT' ? 'Income Tax' : cat === 'ROC' ? 'ROC/MCA' : cat === 'PF' ? 'PF & ESIC' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Deadlines List */}
      <div className="space-y-4">
        {filteredDeadlines.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Calendar size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No statutory deadlines match your search criteria.</p>
          </div>
        ) : (
          filteredDeadlines.map(item => (
            <div 
              key={item.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900/10 border transition-all ${
                item.priority === 'Critical'
                  ? 'border-red-500/25 bg-red-500/[0.01]'
                  : item.priority === 'High'
                  ? 'border-amber-500/20 bg-amber-500/[0.01]'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              } flex flex-col md:flex-row gap-4 justify-between items-start md:items-center`}
              id={`deadline-item-${item.id}`}
            >
              <div className="space-y-2 text-left max-w-2xl">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    item.category === 'GST' ? 'bg-indigo-500/10 text-indigo-500' :
                    item.category === 'IT' ? 'bg-emerald-500/10 text-emerald-500' :
                    item.category === 'TDS' ? 'bg-amber-500/10 text-amber-500' :
                    item.category === 'ROC' ? 'bg-sky-500/10 text-sky-500' :
                    'bg-pink-500/10 text-pink-500'
                  }`}>
                    {item.category === 'IT' ? 'Income Tax' : item.category === 'ROC' ? 'ROC/MCA' : item.category === 'PF' ? 'PF & ESIC' : item.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    item.priority === 'Critical' ? 'bg-red-500/10 text-red-500' :
                    item.priority === 'High' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {item.priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Form {item.form}</span>
                </div>

                <h4 className="font-extrabold text-navy dark:text-white text-base leading-snug">{item.name}</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block leading-none mb-0.5">Who Must File</span>
                    <span className="text-slate-600 dark:text-slate-350 leading-relaxed font-bold">{item.taxpayer}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block leading-none mb-0.5">Penalties of Delay</span>
                    <span className="text-red-500 leading-relaxed font-semibold">{item.consequence}</span>
                  </div>
                </div>
              </div>

              {/* Due Date Badge */}
              <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400 md:mb-1 block">Statutory Due Date</span>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-center shadow-sm">
                  <span className="font-mono text-corporate dark:text-gold font-black text-sm block leading-none">{item.dueDate}</span>
                  <span className="text-[8px] uppercase font-bold tracking-widest text-slate-400 block mt-1 font-sans leading-none">{item.frequency} Schedule</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400 leading-normal flex gap-2">
        <Clock size={16} className="shrink-0 text-slate-400" />
        <p>
          *Disclaimer: Dates are subject to changes or extensions issued by CBIC, CBDT, MCA, or EPFO via official circulars. Always check for current circular notices for active extensions. All dates are synchronized with FY 2025–26 calendar years.
        </p>
      </div>
    </div>
  );
};
