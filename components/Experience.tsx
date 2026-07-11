import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  ClipboardCheck, 
  FileText, 
  Landmark, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Coins,
  FileCheck
} from 'lucide-react';

interface Metric {
  value: string;
  label: string;
}

interface CapabilityItem {
  title: string;
  desc: string;
}

interface Domain {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  metrics: Metric[];
  items: CapabilityItem[];
}

export default function Experience() {
  const [activeDomain, setActiveDomain] = useState<string>('audit');

  const domains: Domain[] = [
    {
      id: 'audit',
      label: 'Audit & Assurance',
      title: 'Audit & Assurance Services',
      subtitle: 'Statutory, Internal, and Branch Audits conforming to Indian Accounting Standards (Ind AS) and regulatory guidelines.',
      icon: ClipboardCheck,
      metrics: [
        { value: "30+", label: "Statutory Audits" },
        { value: "15+", label: "Tax Audits" }
      ],
      items: [
        {
          title: "Statutory & Tax Audits",
          desc: "Conducted extensive testing, ledger scrutiny, vouching, and analytical procedures to verify the fair presentation of corporate balance sheets."
        },
        {
          title: "Ledger Scrutiny & Reconciliations",
          desc: "Identified accounting irregularities and verified bank, vendor, and cash balances against actual sub-ledgers."
        },
        {
          title: "Statutory Bank Branch Audits",
          desc: "Supported branch audits for nationalized banks, focusing on credit asset verification, NPA identification, and compliance checks."
        }
      ]
    },
    {
      id: 'tax',
      label: 'Taxation & Regulatory',
      title: 'Taxation & Regulatory Advisory',
      subtitle: 'Direct and indirect corporate tax computations, Form 3CD compliance, and comprehensive GSTR reconciliation.',
      icon: FileText,
      metrics: [
        { value: "100+", label: "GST Returns Filed" },
        { value: "₹300Cr+", label: "Transfer Pricing Exposure" }
      ],
      items: [
        {
          title: "GST Returns & Input Tax Credit",
          desc: "Managed monthly GSTR-1 and GSTR-3B filings, and executed massive multi-year GSTR-2B reconciliations to safeguard input credits."
        },
        {
          title: "Tax Audit Reporting (Form 3CD)",
          desc: "Prepared tax computations, calculated deferred tax assets, and gathered supporting documentation for Form 3CD clauses."
        },
        {
          title: "Transfer Pricing Auditing",
          desc: "Contributed to transfer pricing documentation and drafted critical sections of Form 3CEB reports for multinational transactions."
        }
      ]
    },
    {
      id: 'governance',
      label: 'Corporate Governance',
      title: 'Corporate Advisory & Governance',
      subtitle: 'Corporate secretarial filings, Ministry of Corporate Affairs (MCA) compliance, and statutory Board audits.',
      icon: ShieldCheck,
      metrics: [
        { value: "100%", label: "Filing Accuracy" },
        { value: "5+", label: "Entity Formations" }
      ],
      items: [
        {
          title: "Ministry of Corporate Affairs (MCA)",
          desc: "Prepared ROC annual returns (Forms AOC-4, MGT-7), registered new entities, and monitored dynamic regulatory portals."
        },
        {
          title: "Corporate Governance Auditing",
          desc: "Conducted minute audits and checked compliance metrics against the mandatory statutory norms of the Companies Act, 2013."
        },
        {
          title: "Legal Response Drafting",
          desc: "Drafted clear, structured, formal responses to GST and Income Tax notices for partner review."
        }
      ]
    }
  ];

  const currentDomain = domains.find(d => d.id === activeDomain) || domains[0];
  const DomainIcon = currentDomain.icon;

  return (
    <section 
      id="experience" 
      className="py-28 bg-white dark:bg-darkBg border-y border-slate-200/50 dark:border-slate-850/40 transition-colors duration-300 relative overflow-hidden"
    >
      {/* Decorative background radial gradients */}
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-corporate/5 dark:bg-corporate/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-40 w-96 h-96 bg-gold/5 dark:bg-gold/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-1.5 mb-3.5">
            <span className="w-4 h-1 bg-orange-500 rounded-full"></span>
            <span className="w-4 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
            <span className="w-4 h-1 bg-emerald-500 rounded-full"></span>
          </div>
          <h2 className="text-xs font-bold text-gold uppercase tracking-[0.25em] mb-4">PROFESSIONAL EXPOSURE</h2>
          <h3 className="text-4xl md:text-5xl font-black text-navy dark:text-white tracking-tight">
            Articleship <span className="text-orange-500">Practice</span>
          </h3>
          <p className="mt-5 text-sm md:text-base text-slate-500 dark:text-slate-450 max-w-2xl mx-auto leading-relaxed font-medium">
            Redefining professional service delivery. This capability card presents the actual audit, taxation, and statutory exposure earned at GPHK & Associates.
          </p>
        </div>

        {/* Big 4 Style Interactive Platform Deck */}
        <div className="bg-slate-50/50 dark:bg-slate-900/35 backdrop-blur-md rounded-[32px] border border-slate-250/60 dark:border-slate-800/80 p-6 md:p-10 lg:p-12 shadow-sm">
          
          {/* Header of the Articleship Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 mb-10 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-corporate/10 text-corporate dark:bg-gold/10 dark:text-gold flex items-center justify-center shrink-0 border border-corporate/10 dark:border-gold/10">
                <Briefcase size={26} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">ASSOCIATESHIP DETAILS</span>
                <h4 className="text-2xl md:text-3xl font-black text-navy dark:text-white tracking-tight leading-none mt-1">
                  CA Article Assistant
                </h4>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  GPHK & Associates • Chartered Accountants
                </p>
              </div>
            </div>
            
            {/* Firm Exposure Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
              <FileCheck size={14} className="text-emerald-500" />
              <span>Full-Time Verified Tenure</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* LEFT COLUMN: Vertical Navigation Tabs (horizontal on mobile) */}
            <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-none shrink-0">
              {domains.map((dom) => {
                const isSelected = activeDomain === dom.id;
                const DomIcon = dom.icon;
                return (
                  <button
                    key={dom.id}
                    onClick={() => setActiveDomain(dom.id)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl border text-left font-bold text-xs uppercase tracking-wider transition-all duration-300 shrink-0 lg:w-full select-none cursor-pointer ${
                      isSelected
                        ? 'bg-corporate text-white border-corporate shadow-md dark:bg-gold dark:text-navy dark:border-gold scale-[1.02]'
                        : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-450 border-slate-200 dark:border-slate-850 hover:border-corporate dark:hover:border-slate-750 hover:bg-slate-100/50'
                    }`}
                  >
                    <DomIcon size={16} className={isSelected ? 'text-white dark:text-navy' : 'text-slate-400 dark:text-slate-500'} />
                    <span>{dom.label}</span>
                  </button>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Active Domain Showcase with Fade Animations */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850/80 rounded-3xl p-6 md:p-8 min-h-[360px] flex flex-col justify-between shadow-[0_5px_15px_rgba(0,0,0,0.01)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDomain}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-5">
                    {/* Title & Domain Description */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-orange-500/5 dark:bg-gold/5 text-orange-500 dark:text-gold border border-orange-500/10 dark:border-gold/10">
                          <DomainIcon size={20} />
                        </div>
                        <h5 className="text-xl font-black text-navy dark:text-white tracking-tight">
                          {currentDomain.title}
                        </h5>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
                        {currentDomain.subtitle}
                      </p>
                    </div>

                    {/* Domain-Specific Capabilities Checklist */}
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-850/60">
                      {currentDomain.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex gap-4 items-start">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                          <div className="space-y-0.5">
                            <h6 className="text-sm font-bold text-navy dark:text-slate-200">
                              {item.title}
                            </h6>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Domain Metrics Footer Row */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-850/60 mt-6 bg-slate-50/50 dark:bg-slate-900/20 -mx-6 -mb-6 p-6 rounded-b-3xl">
                    {currentDomain.metrics.map((metric, metricIdx) => (
                      <div key={metricIdx} className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850/50 p-4 rounded-2xl text-center shadow-sm">
                        <div className="text-2xl md:text-3xl font-black text-navy dark:text-gold tracking-tight">
                          {metric.value}
                        </div>
                        <div className="text-[10px] md:text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
