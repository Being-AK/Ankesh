import React, { useState, useEffect } from 'react';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import { FloatingIcon, FinanceIcons } from './FinanceElements';

const Hero: React.FC = () => {
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Gentle clamp: max 5px movement
      const x = (e.clientX / window.innerWidth - 0.5) * 5;
      const y = (e.clientY / window.innerHeight - 0.5) * 5;
      setParallaxOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-darkBg dark:to-darkBg transition-colors duration-300">
      {/* Abstract Background Pattern - Premium Dark Mode Gradient */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-corporate/5 dark:bg-corporate/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/5 dark:bg-gold/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        
        {/* Animated Floating Finance Icons */}
        <FloatingIcon icon={FinanceIcons.Calculator} className="top-20 left-[10%]" delay="0s" />
        <FloatingIcon icon={FinanceIcons.Graph} className="bottom-40 right-[15%]" delay="2s" />
        <FloatingIcon icon={FinanceIcons.Coins} className="top-40 right-[20%]" delay="4s" />
        <FloatingIcon icon={FinanceIcons.Chart} className="bottom-20 left-[20%]" delay="1s" />
        <FloatingIcon icon={FinanceIcons.Percent} className="top-1/3 left-[5%]" delay="3s" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
          
          {/* Text Content */}
          <div className="w-full md:w-3/5 order-2 md:order-1">
            <div className="flex items-center gap-1.5 mb-3 animate-fade-in-up">
              <span className="w-3 h-1 bg-orange-500 rounded-full"></span>
              <span className="w-3 h-1 bg-slate-200 dark:bg-slate-750 rounded-full"></span>
              <span className="w-3 h-1 bg-emerald-500 rounded-full"></span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase ml-1">CA Finalist • Fintech Developer • B.Com (Computer Applications)</span>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-yellow-100 dark:bg-blue-900/30 text-navy dark:text-blue-200 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in border border-yellow-250 dark:border-blue-800">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>Open for Full-time Roles at the Intersection of Finance & Tech</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-4 text-navy dark:text-white animate-fade-in-up tracking-tight">
              Ankesh Kumar
            </h1>
            
            <h2 className="text-xl md:text-2xl font-bold text-corporate dark:text-gold mb-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Building Modern Software for Finance &amp; Compliance
            </h2>

            <p className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 animate-fade-in-up tracking-wide" style={{ animationDelay: '0.15s' }}>
              Combining Chartered Accountancy with Client-Side Software Engineering
            </p>
            
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-350 mb-6 leading-relaxed max-w-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Secure, privacy-first web applications that automate complex compliance workflows, ROC filings, and multi-regime audit computations. Real software designed for extreme accuracy.
            </p>

            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up max-w-xl" style={{ animationDelay: '0.25s' }}>
              <div className="group/card relative p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 hover:border-gold/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-300 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 mb-2 text-navy dark:text-slate-200 font-bold">
                  <Lock size={12} className="text-amber-500" />
                  <span>PDF_ENGINE: ACTIVE</span>
                </div>
                <div className="text-emerald-500 mb-1">✔ loaded qpdf.wasm successfully</div>
                <div className="text-slate-400">Memory isolation active [0% network usage]</div>
              </div>

              <div className="group/card relative p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 hover:border-gold/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-300 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 mb-2 text-navy dark:text-slate-200 font-bold">
                  <Sparkles size={12} className="text-purple-500" />
                  <span>COMPLIANCE_AI: READY</span>
                </div>
                <div className="text-purple-400 mb-1">⚡ drafting reply to Sec 73 mismatch...</div>
                <div className="text-slate-400">Validation complete against GSTR-2B datasets</div>
              </div>
            </div>
            
             <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#products" className="relative group inline-flex justify-center items-center gap-2 bg-corporate hover:bg-navy dark:bg-white dark:text-navy dark:hover:bg-slate-200 text-white px-8 py-3.5 rounded-xl font-bold transition-[transform,shadow] duration-300 ease-[0.16,1,0.3,1] shadow-[0_4px_20px_rgba(30,58,138,0.15)] hover:shadow-[0_8px_30px_rgba(30,58,138,0.25)] hover:-translate-y-0.5 active:scale-[0.98] overflow-hidden">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                    <span className="relative flex items-center gap-2">View My Products <ArrowRight size={18} /></span>
                </a>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                  className="inline-flex justify-center items-center gap-2 bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-white dark:text-yellow-400 dark:border-yellow-400 dark:hover:bg-yellow-400 dark:hover:text-navy px-8 py-3.5 rounded-xl font-bold transition-[transform,shadow,background-color] duration-300 ease-[0.16,1,0.3,1] hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                >
                    Try AI Assistant <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Professional Headshot */}
          <div className="w-full md:w-2/5 order-1 md:order-2 flex justify-center animate-fade-in relative py-6 md:py-0">
             {/* Glow Effect behind image */}
             <div className="absolute inset-0 bg-gradient-to-tr from-corporate/20 to-gold/20 rounded-2xl blur-2xl transform rotate-3 scale-105 -z-10 animate-pulse-slow"></div>
             
             {/* Image Frame - Rounded Rectangle 4:5 Ratio */}
             <div 
               className="relative w-64 md:w-80 aspect-[4/5] rounded-2xl overflow-hidden border-4 border-yellow-500/20 shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] dark:shadow-blue-900/20 bg-white dark:bg-darkCard group transition-transform duration-300 ease-out"
               style={{
                 transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`
               }}
             >
                {/* Vignette Overlay (Inner Shadow) to fade edges */}
                <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_80px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] rounded-2xl"></div>
                
                <img 
                    src="/Hero.webp" 
                    alt="Ankesh Kumar" 
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover object-[50%_34%] transition-transform duration-700 group-hover:scale-105"
                />
             </div>
             
             {/* Decorative Status Element */}
             <div className="absolute -bottom-4 -right-2 md:right-10 bg-white dark:bg-darkCard px-4 py-2 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-2 animate-bounce-gentle z-20">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-navy dark:text-white">Article Assistant • GPHK &amp; Associates</span>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;