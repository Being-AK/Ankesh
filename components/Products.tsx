import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Lock, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  FileText,
  Calendar,
  Building2,
  ShieldCheck,
  Play
} from 'lucide-react';

interface Product {
  id: string;
  hash: string;
  tag: string;
  title: string;
  oneLiner: string;
  description: string;
  icon: React.ComponentType<any>;
  accentColor: string;
  details: string[];
  mockPreview: React.ReactNode;
}

export default function Products() {
  const products: Product[] = [
    {
      id: "pdf-toolkit",
      hash: "#pdf-toolkit",
      tag: "ENGINEERING • 100% OFFLINE",
      title: "Offline PDF Toolkit",
      oneLiner: "Private document processing. Runs entirely inside your browser. No uploads. No cloud. No compromise.",
      description: "Perform heavy PDF operations—such as splitting, merging, compressing, or text OCR scanning—directly in local browser memory. Perfect for protecting sensitive client ledgers and statutory tax reports from external data leaks.",
      icon: FileText,
      accentColor: "text-amber-500",
      details: [
        "Private local OCR text extraction (zero cloud leakage)",
        "High-ratio lossless ledger file compression",
        "Secure local merge, split, and protective watermarking"
      ],
      mockPreview: (
        <div className="bg-slate-950 rounded-2xl p-6 font-mono text-[11px] text-slate-300 border border-slate-800/80 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden group-hover:border-amber-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <span className="text-amber-500 font-bold flex items-center gap-1.5">
                <Lock size={12} className="text-amber-500 animate-pulse" />
                SECURE_SANDBOX: ACTIVE
              </span>
              <span className="text-slate-500 text-[10px]">Local-WASM</span>
            </div>
            <div className="text-emerald-400 font-semibold transition-transform group-hover:translate-x-1 duration-300">&gt; Initializing WebAssembly engine...</div>
            <div className="text-slate-400">&gt; Loading qpdf.wasm (4.2 MB) [100%]</div>
            <div className="text-slate-400">&gt; Allocation: 512MB Local Memory Sandbox</div>
            <div className="text-amber-400">&gt; File: Audit_Ledger_Q4.pdf (12.4 MB)</div>
            <div className="text-slate-400">&gt; Operation: Split & Compress [Ratio: 64%]</div>
          </div>
          <div className="mt-4 flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800 relative z-10 transition-transform group-hover:scale-[1.01] duration-300">
            <span className="text-[9px] text-slate-500 font-bold tracking-wider">COMPLETED_LOCAL_EXEC</span>
            <span className="text-emerald-400 font-bold">0.82s (100% Client-side)</span>
          </div>
        </div>
      )
    },
    {
      id: "assistant",
      hash: "#assistant",
      tag: "ARTIFICIAL INTELLIGENCE",
      title: "AI Compliance Workspace",
      oneLiner: "Intelligent document scrutiny. Automated notice drafting. Direct regulatory search answers.",
      description: "Accelerate response drafting and legal tax audits. This secure workspace utilizes high-end AI models to analyze complex ledger variances, cross-reference Companies Act schedules, and generate professional compliance replies.",
      icon: Sparkles,
      accentColor: "text-purple-500",
      details: [
        "Structured drafting for Income Tax and GST notice replies",
        "Semantic search assistant across complex company laws",
        "AI audit ledger analysis and comparative compliance tools"
      ],
      mockPreview: (
        <div className="bg-slate-950 rounded-2xl p-6 font-mono text-[11px] text-slate-300 border border-slate-800/80 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden group-hover:border-purple-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
              <span className="text-purple-400 font-bold flex items-center gap-1.5">
                <Sparkles size={12} className="animate-pulse" />
                COMPLIANCE_AI: READY
              </span>
              <span className="text-slate-500 text-[10px]">Gemini-2.5</span>
            </div>
            <div className="text-slate-400 italic text-[10px] transition-transform group-hover:translate-x-1 duration-300">&gt; Draft response to GST Sec 73 ITC mismatch...</div>
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-[10px] leading-relaxed text-slate-300 max-h-[90px] overflow-y-auto">
              <span className="text-purple-400 font-semibold block mb-0.5">Assistant Draft:</span>
              "We submit that the Input Tax Credit (ITC) of ₹4.2L claimed in GSTR-3B matches GSTR-2B layout validation parameters..."
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[9px] text-slate-500 relative z-10">
            <span>Security: AES-256</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={10} /> Draft Generated
            </span>
          </div>
        </div>
      )
    },
    {
      id: "compliance-suite",
      hash: "#compliance-suite",
      tag: "TAX & AUDIT UTILITIES",
      title: "Professional Compliance Console",
      oneLiner: "Statutory tax computations. Real-time GSTIN validation. Multi-regime financial comparisons.",
      description: "Run error-free salary models, calculate optimal tax regime benefits, and instantly verify GSTIN validity. Designed for modern accountants to execute precise corporate compliance with extreme speed.",
      icon: Layers,
      accentColor: "text-blue-500",
      details: [
        "Real-time GSTIN layout verification & active search tracker",
        "Dual-regime Income Tax comparative analysis engine",
        "Unified compliance calculators for direct audit support"
      ],
      mockPreview: (
        <div className="bg-slate-950 rounded-2xl p-6 font-mono text-[11px] text-slate-300 border border-slate-800/80 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden group-hover:border-blue-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-blue-400 font-bold flex items-center gap-1.5">
                <Layers size={12} className="animate-pulse" />
                COMPLIANCE_ENGINE: ACTIVE
              </span>
              <span className="text-slate-500 text-[10px]">Realtime</span>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-[10px] transition-transform group-hover:translate-x-1 duration-300">
              <span className="text-slate-500 block text-[9px] tracking-wider mb-0.5">INPUT GSTIN:</span>
              <span className="text-white font-bold tracking-wide">36AAAAA1111A1Z1</span>
              <span className="text-emerald-400 block mt-1 font-semibold">✔ FORMAT VALID (Telangana / Corporate)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-slate-900/45 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[8px] font-bold">OLD REGIME Tax:</span>
                <span className="text-red-400 font-extrabold text-[12px]">₹1,45,000</span>
              </div>
              <div className="bg-slate-900/45 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[8px] font-bold">NEW REGIME Tax:</span>
                <span className="text-emerald-400 font-extrabold text-[12px]">₹1,12,500</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 bg-blue-950/20 p-2.5 rounded-xl border border-blue-900/30 flex items-center justify-between mt-2 relative z-10">
            <span className="font-semibold text-slate-300">Optimal Regime:</span>
            <span className="text-amber-400 font-bold">New (Save ₹32,500)</span>
          </div>
        </div>
      )
    },
    {
      id: "compliance-hub",
      hash: "#compliance-hub",
      tag: "CORPORATE SECRETARIAL",
      title: "Incorporation & Compliance Hub",
      oneLiner: "End-to-end ROC filing. Structured MCA registry lookups. Compliance timelines tracker.",
      description: "Track statutory board timelines, estimate MCA incorporation milestones, and scrape company registry details. A single terminal to manage legal corporate formations without spreadsheet fatigue.",
      icon: Building2,
      accentColor: "text-emerald-500",
      details: [
        "Dynamic incorporation countdown gates and cost estimators",
        "Ministry of Corporate Affairs (MCA) compliance checklist",
        "ROC annual return form filing triggers and deadline alerts"
      ],
      mockPreview: (
        <div className="bg-slate-950 rounded-2xl p-6 font-mono text-[11px] text-slate-300 border border-slate-800/80 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden group-hover:border-emerald-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Building2 size={12} className="animate-pulse" />
                REGISTRY_HUB: SYNCHRONIZED
              </span>
              <span className="text-slate-500 text-[10px]">MCA Portal</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] bg-slate-900/50 p-2 rounded-lg border border-slate-800 transition-transform group-hover:translate-x-1 duration-300">
                <span className="text-slate-400">1. RUN Name Approval</span>
                <span className="text-emerald-400 font-bold">Approved</span>
              </div>
              <div className="flex items-center justify-between text-[10px] bg-slate-900/50 p-2 rounded-lg border border-slate-800 transition-transform group-hover:translate-x-1 duration-300" style={{ transitionDelay: '50ms' }}>
                <span className="text-slate-400">2. SPICe+ Part B Draft</span>
                <span className="text-emerald-400 font-bold">100% Prepared</span>
              </div>
              <div className="flex items-center justify-between text-[10px] bg-slate-900/50 p-2 rounded-lg border border-slate-800 transition-transform group-hover:translate-x-1 duration-300" style={{ transitionDelay: '100ms' }}>
                <span className="text-slate-400">3. ROC Filing Submission</span>
                <span className="text-amber-400 font-bold animate-pulse">Awaiting DSC</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/30 text-[9px] text-slate-300 relative z-10">
            <span>Incorporation Speed Run:</span>
            <span className="text-emerald-400 font-bold">Est. 4 Days Total</span>
          </div>
        </div>
      )
    }
  ];

  const handleOpenWorkspace = (hash: string, id: string) => {
    // Set active workspace in parent app via window event or direct click
    // Our global router triggers when hash is modified. Let's sync hash
    window.location.hash = hash;
    
    // Dispatch a global event to let individual modules know they were opened
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('glow-workspace', { detail: { id } }));
    }, 100);
  };

  return (
    <section 
      id="products" 
      className="py-32 bg-white dark:bg-darkBg transition-colors duration-300 relative overflow-hidden"
    >
      {/* Decorative premium ambient spots */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-corporate/5 dark:bg-corporate/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/5 dark:bg-gold/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        {/* Main Products Grid - Overhauled into high-end Apple-style chapters */}
        <div className="space-y-32">
          {products.map((product, idx) => {
            const Icon = product.icon;
            const isEven = idx % 2 === 0;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col lg:flex-row items-stretch gap-12 lg:gap-20 min-h-[460px] group"
              >
                {/* Product Content Column */}
                <div className={`w-full lg:w-[50%] flex flex-col justify-between ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="space-y-6">
                    {/* Tiny premium badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                      {product.tag}
                    </div>
                    
                    {/* Title and Icon */}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 ${product.accentColor} flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:rotate-2`}>
                        <Icon size={22} />
                      </div>
                      <h3 className="text-3xl md:text-4xl font-extrabold text-navy dark:text-white tracking-tight leading-none">
                        {product.title}
                      </h3>
                    </div>

                    {/* Apple Style Value Propositions */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-200 tracking-tight leading-snug">
                        {product.oneLiner}
                      </h4>
                      <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                        {product.description}
                      </p>
                    </div>

                    {/* Minimal details list */}
                    <div className="pt-5 border-t border-slate-100 dark:border-slate-800/60">
                      <ul className="grid grid-cols-1 gap-3.5">
                        {product.details.map((detail, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-3 text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Elegant Tactile Launch Button */}
                  <div className="pt-8">
                    <button 
                      onClick={() => handleOpenWorkspace(product.hash, product.id)}
                      className="group/btn relative inline-flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest bg-corporate dark:bg-white text-white dark:text-navy hover:bg-navy dark:hover:bg-slate-100 px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-[transform,shadow] duration-300 ease-[0.16,1,0.3,1] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>

                {/* Visual Showcase Block */}
                <div className={`w-full lg:w-[50%] flex flex-col justify-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="relative p-1.5 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 w-full mx-auto aspect-[4/3] flex items-stretch transition-all duration-500 hover:shadow-xl hover:shadow-corporate/5 dark:hover:shadow-none hover:-translate-y-1">
                    <div className="flex-grow rounded-[1.75rem] overflow-hidden bg-slate-900 p-6 md:p-8 flex flex-col justify-between border border-slate-800/50">
                      {product.mockPreview}
                    </div>
                    {/* Subtle glass sweep effect */}
                    <div className="absolute inset-0 pointer-events-none rounded-[2rem] overflow-hidden">
                      <div className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
