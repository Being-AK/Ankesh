import React from 'react';
import { motion } from 'motion/react';
import { Icon3D, Icons3D } from './Icons3D';
import { 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';

interface Milestone {
  tag: string;
  category: string;
  title: string;
  challenge: string;
  execution: string;
  outcome: string;
  icon: any;
  is3d: boolean;
  theme: "gold" | "corporate" | "emerald" | "purple" | "blue";
}

export default function CareerHighlights() {
  const milestones: Milestone[] = [
    {
      tag: "AUDIT ENGAGEMENT",
      category: "Statutory Audit & Financial Reporting",
      title: "Statutory Ledger Audits",
      challenge: "Verifying high-volume cashflows and inventory valuations across multiple retail, manufacturing, and IT ledgers for partner sign-offs.",
      execution: "Led detailed casework, ledger scrutiny, bank reconciliations, and prepared final statutory schedules in compliance with Ind AS.",
      outcome: "Successfully verified books across 30+ statutory audits, ensuring zero restatement errors and earning partner praise for accuracy.",
      icon: Icons3D.Audit,
      is3d: true,
      theme: "gold"
    },
    {
      tag: "INDIRECT TAX COMPLIANCE",
      category: "GST Audit & Credit Safeguarding",
      title: "GSTR-2B Credit Reconciliation",
      challenge: "Clients suffered significant Input Tax Credit (ITC) leakage and potential interest penalties due to non-matching vendor invoices.",
      execution: "Developed optimized data comparative procedures to systematically cross-reference client purchase registers with live GSTR-2B logs.",
      outcome: "Processed 100+ GST files, recovering thousands in matching credits and providing watertight audit trails for GSTR-9 submissions.",
      icon: Icons3D.GST,
      is3d: true,
      theme: "emerald"
    },
    {
      tag: "FINTECH INNOVATION",
      category: "Client Data Privacy & WASM Tooling",
      title: "Secure Offline PDF Engine",
      challenge: "Audit assistants routinely compromise client confidentiality by uploading private ledgers and bank scans to commercial web-tools.",
      execution: "Pioneered a sandboxed local-WASM file processing suite that splitting, merges, compresses, and OCRs files directly in-browser.",
      outcome: "Created a 100% private, zero-server compliance engine currently used by colleagues to securely process confidential files.",
      icon: Icons3D.Verification,
      is3d: true,
      theme: "purple"
    },
    {
      tag: "CORPORATE ADVISORY",
      category: "International Taxation & Form 3CEB",
      title: "Transfer Pricing Study Assistance",
      challenge: "Auditing arm's-length valuations for corporate groups with international transactions exceeding ₹300 Crores.",
      execution: "Researched global transaction comparables, tracked transfer parameters, and drafted critical sections of Form 3CEB reports.",
      outcome: "Ensured 100% compliance with international transfer pricing rules, supporting partner review cycles well ahead of statutory deadlines.",
      icon: Icons3D.Compliance,
      is3d: true,
      theme: "blue"
    }
  ];

  return (
    <section 
      id="career-highlights" 
      className="py-28 bg-slate-50 dark:bg-darkBg border-t border-slate-200/50 dark:border-slate-850/40 transition-colors duration-300 relative overflow-hidden"
    >
      {/* Background radial accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gold/5 dark:bg-corporate/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="text-center mb-24">
          <div className="flex items-center justify-center gap-1.5 mb-3.5">
            <span className="w-4 h-1 bg-orange-500 rounded-full"></span>
            <span className="w-4 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
            <span className="w-4 h-1 bg-emerald-500 rounded-full"></span>
          </div>
          <h2 className="text-xs font-bold text-gold uppercase tracking-[0.25em] mb-4">VERIFIABLE MILESTONES</h2>
          <h3 className="text-4xl md:text-5xl font-black text-navy dark:text-white tracking-tight leading-none">
            Career <span className="text-orange-500">Highlights</span>
          </h3>
          <p className="mt-5 text-sm md:text-base text-slate-500 dark:text-slate-450 max-w-2xl mx-auto leading-relaxed font-medium">
            Telling the real story. High-impact professional milestones demonstrating regulatory rigor, client advocacy, and compliance tech execution.
          </p>
        </div>

        {/* Milestone Grid with Responsive Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {milestones.map((milestone, idx) => {
            const Icon = milestone.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
                className="bg-white/60 dark:bg-slate-900/35 backdrop-blur-md rounded-[32px] border border-slate-200/50 dark:border-slate-800/80 p-6 md:p-8 hover:border-gold/30 dark:hover:border-gold/35 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group h-full"
              >
                <div className="space-y-6">
                  {/* Card Header row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase block">
                        {milestone.tag}
                      </span>
                      <span className="text-xs font-bold text-corporate dark:text-gold uppercase block mt-1">
                        {milestone.category}
                      </span>
                    </div>
                    
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-850 text-gold shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                      <Icon3D icon={Icon} theme={milestone.theme} size="sm" />
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-xl md:text-2xl font-black text-navy dark:text-white tracking-tight group-hover:text-corporate dark:group-hover:text-gold transition-colors duration-200">
                    {milestone.title}
                  </h4>

                  {/* Narrative details */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-850/60">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider block">Challenge</span>
                      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-450 leading-relaxed font-normal">
                        {milestone.challenge}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-corporate dark:text-gold uppercase tracking-wider block">Contribution</span>
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-normal">
                        {milestone.execution}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block">Outcome</span>
                      <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                        {milestone.outcome}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer validation check */}
                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-850/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Verified Engagement Record</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-700 group-hover:text-gold transition-colors duration-300">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
