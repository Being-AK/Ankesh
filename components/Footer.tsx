import React from 'react';
import { 
  Mail, 
  Linkedin, 
  Calculator, 
  ShieldCheck, 
  FileText, 
  Search, 
  Calendar, 
  Building2, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';

const Footer: React.FC = () => {
  
  // Custom dispatcher helper to notify the compliance suite
  const triggerTool = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const event = new CustomEvent('select-compliance-tool', { detail: { id } });
    window.dispatchEvent(event);
  };

  const handleNavigate = (hash: string, e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.querySelector(hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="bg-slate-50 dark:bg-darkBg pt-24 pb-12 border-t border-slate-200/50 dark:border-slate-850/40 transition-colors duration-300 relative overflow-hidden">
      {/* Absolute decorative ambient lights */}
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-corporate/5 dark:bg-corporate/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        {/* Apple-style Prominent Closing Banner */}
        <div className="pb-16 mb-16 border-b border-slate-200/60 dark:border-slate-800/65 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
          <div className="max-w-2xl space-y-4">
            <h3 className="text-3xl md:text-5xl font-black text-navy dark:text-white tracking-tight leading-tight">
              Let's Build Smarter <span className="text-orange-500">Finance Together</span>.
            </h3>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Combining Chartered Accountancy with Software Engineering to design secure, client-side, privacy-first financial operations. Reach out to discuss engineering opportunities, audits, or legal tech development.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <a 
              href="mailto:ankeshkumar9949@gmail.com"
              className="group inline-flex items-center justify-center gap-2.5 text-xs font-bold uppercase tracking-wider bg-corporate text-white hover:bg-navy dark:bg-white dark:text-navy dark:hover:bg-slate-150 px-6 py-4 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>Email Ankesh Directly</span>
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
            <a 
              href="https://linkedin.com/in/ankeshkumar9949"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-xl shadow-sm hover:shadow transition-all duration-300"
            >
              <Linkedin size={14} className="text-[#0a66c2]" />
              <span>Connect on LinkedIn</span>
            </a>
          </div>
        </div>
        
        {/* Main Footer Dynamic Directory Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-20">
            
            {/* Column 1: Core Brand */}
            <div className="col-span-2 md:col-span-2 lg:col-span-1 space-y-5">
              <a href="#home" onClick={(e) => handleNavigate('#home', e)} className="flex flex-col leading-tight group w-fit">
                <span className="font-black text-2xl text-corporate dark:text-white tracking-tight">
                  Ankesh
                  <span className="text-orange-500 ml-0.5">.in</span>
                </span>
                <span className="text-[9px] font-extrabold text-gold tracking-widest uppercase mt-0.5">CA • Compliance • Developer</span>
              </a>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
                Designing high-performance sandboxed utilities, compliant database tools, and statutory legal models built entirely on client privacy.
              </p>
              <div className="text-xs font-semibold pt-1">
                <a 
                  href="mailto:ankeshkumar9949@gmail.com" 
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-350 hover:text-corporate dark:hover:text-gold transition-colors"
                >
                  <Mail size={14} className="text-corporate dark:text-gold shrink-0" />
                  <span>ankeshkumar9949@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Column 2: Indian Compliance Suite */}
            <div className="space-y-4">
              <h4 className="font-bold text-navy dark:text-white uppercase text-[10px] tracking-widest border-b border-slate-200/50 dark:border-slate-800/40 pb-2 flex items-center gap-1.5">
                <Calculator size={13} className="text-corporate dark:text-gold" />
                <span>Compliance Console</span>
              </h4>
              <ul className="space-y-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <li>
                  <a 
                    href="#tech-compliance-desk" 
                    onClick={(e) => triggerTool('calc-salary', e)}
                    className="text-corporate dark:text-gold hover:opacity-85 transition-opacity flex items-center gap-2 font-bold"
                  >
                    <Calculator size={12} className="shrink-0" /> 
                    <span>Income Tax Calculator (FY 2025–26)</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="#tech-compliance-desk" 
                    onClick={(e) => triggerTool('calc-gst', e)}
                    className="hover:text-corporate dark:hover:text-gold transition-colors flex items-center gap-2"
                  >
                    <Calculator size={12} className="shrink-0 text-slate-400" /> 
                    <span>GST & Late Fee Calculator</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="#compliance-hub" 
                    onClick={(e) => handleNavigate('#compliance-hub', e)}
                    className="hover:text-corporate dark:hover:text-gold transition-colors flex items-center gap-2"
                  >
                    <Calendar size={12} className="shrink-0 text-slate-400" /> 
                    <span>Incorporation Timelines</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="#tech-compliance-desk" 
                    onClick={(e) => triggerTool('company-search', e)}
                    className="hover:text-corporate dark:hover:text-gold transition-colors flex items-center gap-2"
                  >
                    <Building2 size={12} className="shrink-0 text-slate-400" /> 
                    <span>ROC & Company Registry</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Security & Verification */}
            <div className="space-y-4">
              <h4 className="font-bold text-navy dark:text-white uppercase text-[10px] tracking-widest border-b border-slate-200/50 dark:border-slate-800/40 pb-2 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-corporate dark:text-gold" />
                <span>Security & Registry</span>
              </h4>
              <ul className="space-y-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <li>
                  <a 
                    href="#tech-compliance-desk" 
                    onClick={(e) => triggerTool('gstin-search', e)}
                    className="hover:text-corporate dark:hover:text-gold transition-colors flex items-center gap-2"
                  >
                    <Search size={12} className="shrink-0 text-slate-400" /> 
                    <span>GSTIN Legal Lookup</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="#tech-compliance-desk" 
                    onClick={(e) => triggerTool('udyam-search', e)}
                    className="hover:text-corporate dark:hover:text-gold transition-colors flex items-center gap-2"
                  >
                    <ShieldCheck size={12} className="shrink-0 text-slate-400" /> 
                    <span>MSME Udyam Verifier</span>
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                    className="text-left font-bold text-corporate dark:text-gold hover:text-navy dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 outline-none group"
                  >
                    <MessageSquare size={12} className="shrink-0 text-corporate dark:text-gold transition-transform duration-250 group-hover:scale-110" /> 
                    <span>Chat with Ankesh AI</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Private Tools */}
            <div className="space-y-4">
              <h4 className="font-bold text-navy dark:text-white uppercase text-[10px] tracking-widest border-b border-slate-200/50 dark:border-slate-800/40 pb-2 flex items-center gap-1.5">
                <FileText size={13} className="text-corporate dark:text-gold" />
                <span>Local PDF Toolkit</span>
              </h4>
              <ul className="space-y-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <li>
                  <a 
                    href="#pdf-toolkit" 
                    onClick={(e) => handleNavigate('#pdf-toolkit', e)}
                    className="hover:text-corporate dark:hover:text-gold transition-colors flex items-center gap-2"
                  >
                    <FileText size={12} className="shrink-0 text-slate-400" /> 
                    <span>Lossless PDF Compression</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="#pdf-toolkit" 
                    onClick={(e) => handleNavigate('#pdf-toolkit', e)}
                    className="hover:text-corporate dark:hover:text-gold transition-colors flex items-center gap-2"
                  >
                    <Search size={12} className="shrink-0 text-slate-400" /> 
                    <span>Secure Local OCR Scanner</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="#pdf-toolkit" 
                    onClick={(e) => handleNavigate('#pdf-toolkit', e)}
                    className="hover:text-corporate dark:hover:text-gold transition-colors flex items-center gap-2"
                  >
                    <ShieldCheck size={12} className="shrink-0 text-slate-400" /> 
                    <span>Watermark & Split Ledgers</span>
                  </a>
                </li>
              </ul>
            </div>

        </div>

        {/* Bottom Metadata & Legal Copyright */}
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left leading-relaxed space-y-0.5">
            <p className="font-bold text-slate-700 dark:text-slate-300">
              © 2026 Ankesh Kumar • All Rights Reserved
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Built on Next-Gen React & WebAssembly. Verified Financial Compliance Practitioner.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://linkedin.com/in/ankeshkumar9949" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-slate-500 dark:text-slate-400 hover:text-corporate dark:hover:text-gold transition-all duration-350 flex items-center gap-1.5 font-bold"
            >
              <Linkedin size={14} className="text-[#0a66c2]" /> 
              <span>LinkedIn Profile</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
