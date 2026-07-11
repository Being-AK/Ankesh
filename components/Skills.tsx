import React from 'react';
import { Icon3D, Icons3D } from './Icons3D';

const Skills: React.FC = () => {
  const tools = [
    {
      category: "Finance & Compliance Domain",
      items: [
        { name: "Statutory & Tax Audit", desc: "Ledger scrutiny, CARO 2020 reporting compliance, and data verification.", icon: Icons3D.Audit, theme: 'gold', badge: "Expertise" },
        { name: "Direct & Indirect Taxes", desc: "GST returns (GSTR-1, 3B, ITC reconciliation), and Income Tax filings.", icon: Icons3D.GST, theme: 'emerald', badge: "Expertise" },
        { name: "Corporate Law (ROC/MCA)", desc: "Filing AOC-4, MGT-7, and drafting board resolutions.", icon: Icons3D.ROC, theme: 'blue', badge: "Proficient" },
      ]
    },
    {
      category: "Software & Data Engineering",
      items: [
        { name: "Client-Side Apps (Web)", desc: "Building secure React, TypeScript, and WASM applications.", icon: Icons3D.AI, theme: 'corporate', badge: "Proficient" },
        { name: "Advanced Data Analysis", desc: "Auditing formulas, pivot tables, and analytical financial models.", icon: Icons3D.Analytics, theme: 'blue', badge: "Advanced" },
        { name: "Client-Side Document Eng", desc: "OCR text extraction and secure file operations entirely in-browser.", icon: Icons3D.OCR, theme: 'gold', badge: "Specialist" },
      ]
    },
    {
      category: "AI & ERP Workflows",
      items: [
        { name: "Secure LLM Integrations", desc: "Prompt engineering, Gemini API integrations, and document intelligence.", icon: Icons3D.AI, theme: 'purple', badge: "Proficient" },
        { name: "Financial Systems (ERP)", desc: "Tally Prime, QuickBooks, and automated ledger imports.", icon: Icons3D.FinancialReport, theme: 'emerald', badge: "Advanced" },
      ]
    }
  ] as const;

  return (
    <section id="skills" className="py-20 bg-white dark:bg-darkBg border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-gold uppercase tracking-widest mb-2">Technical Proficiency</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-navy dark:text-white">Professional Skills & Exposure</h3>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {tools.map((group, idx) => (
                <div key={idx}>
                    <h4 className="text-lg font-bold text-corporate dark:text-blue-300 mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">{group.category}</h4>
                    <div className="space-y-4">
                        {group.items.map((tool, tIdx) => (
                            <div key={tIdx} className="flex items-center gap-4 bg-light dark:bg-darkCard p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-corporate dark:hover:border-gold transition-colors">
                                <Icon3D icon={tool.icon} theme={tool.theme} size="sm" className="shrink-0" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-bold text-navy dark:text-white text-sm">{tool.name}</p>
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-800/60 rounded">
                                            {tool.badge}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 leading-normal">{tool.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;