import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import WhyChooseMe from './components/WhyChooseMe';
import Experience from './components/Experience';
import Products from './components/Products';
import CareerHighlights from './components/CareerHighlights';
const ComplianceHub = React.lazy(() => import('./components/ComplianceHub'));
const ComplianceSuite = React.lazy(() => import('./components/ComplianceSuite').then(module => ({ default: module.ComplianceSuite })));
const PdfToolkit = React.lazy(() => import('./components/pdfToolkit/PdfToolkit'));
const AIAssistantWorkspace = React.lazy(() => import('./components/compliance_tools/AIAssistantWorkspace'));
import Skills from './components/Skills';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import DigitalAnkesh from './components/VirtualGuide/DigitalAnkesh';
import PortfolioTour from './components/PortfolioTour/PortfolioTour';
import { CursorTrail, BackgroundParticles } from './components/FinanceElements';
import { HandGestureExperience } from './components/HandGestureExperience';
import CommandPalette from './components/commandPalette/CommandPalette';
import { WorkspaceProvider, useWorkspace } from './components/workspace/WorkspaceContext';
import { WorkspaceStatusBar } from './components/workspace/WorkspaceStatusBar';
import { WorkspaceNotifications } from './components/workspace/WorkspaceNotifications';


const WorkspaceLoading = ({ title }: { title: string }) => (
  <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-8 bg-light dark:bg-darkBg relative overflow-hidden transition-colors duration-300">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(15,23,42,0)_0%,rgba(2,6,23,0.02)_100%)] dark:bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(15,23,42,0)_0%,rgba(2,6,23,0.45)_100%)] pointer-events-none" />
    <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full text-center">
      {/* Orbiting Loading Node */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Outermost rotating orbit */}
        <div className="absolute inset-0 rounded-full border border-dashed border-corporate/30 dark:border-gold/20 animate-[spin_10s_linear_infinite]" />
        {/* Middle gradient spinner */}
        <div className="absolute inset-1.5 rounded-full border-t-2 border-b border-l border-gold/40 dark:border-gold/50 animate-[spin_2s_linear_infinite]" />
        {/* Inner pulsing core */}
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 flex items-center justify-center shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-corporate dark:bg-gold animate-ping" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-extrabold text-navy dark:text-white uppercase tracking-widest">{title} Environment</h3>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Initializing secure sandbox...</p>
      </div>
      {/* Sleek loading bar */}
      <div className="w-36 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
        <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-corporate to-gold dark:from-gold dark:to-orange-500 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

// Hash-to-Workspace mapping
const hashToWorkspace: Record<string, string> = {
  '#compliance-hub': 'compliance-suite',
  '#tech-compliance-desk': 'compliance-suite',
  '#compliance-suite': 'compliance-suite',
  '#pdf-toolkit': 'pdf-toolkit',
  '#tax': 'compliance-suite',
  '#gst': 'compliance-suite',
  '#validators': 'compliance-suite',
  '#assistant': 'compliance-suite'
};

function AppContent() {
  const [darkMode, setDarkMode] = useState(false);
  const [showMagic, setShowMagic] = useState(false);
  const [pdfResetKey, setPdfResetKey] = useState(0);

  const { workspace, setWorkspace } = useWorkspace();
  const workspaceRef = useRef<string | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(timer => window.clearTimeout(timer));
    timersRef.current = [];
  };

  // Sync ref with current state
  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    const handleHashChange = () => {
      clearAllTimers();
      const hash = window.location.hash;
      const ws = hashToWorkspace[hash] || null;
      
      if (ws) {
        if (workspaceRef.current !== ws) {
          setWorkspace(ws);
        }
        
        // Dispatch tool selections if sub-tools are referenced in hashes
        if (hash === '#tax') {
          const t = window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent('select-compliance-tool', { detail: { id: 'calc-salary' } }));
          }, 100);
          timersRef.current.push(t);
        } else if (hash === '#gst') {
          const t = window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent('select-compliance-tool', { detail: { id: 'calc-gst' } }));
          }, 100);
          timersRef.current.push(t);
        } else if (hash === '#validators') {
          const t = window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent('select-compliance-tool', { detail: { id: 'gstin-search' } }));
          }, 100);
          timersRef.current.push(t);
        }
      } else {
        if (workspaceRef.current !== null) {
          setWorkspace(null);
        }

        // Smooth scroll spy / anchor transition on back navigation
        if (hash && hash.startsWith('#')) {
          const id = hash.substring(1);
          const t = window.setTimeout(() => {
            const element = document.getElementById(id);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 150);
          timersRef.current.push(t);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initialize once on mount
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      clearAllTimers();
    };
  }, [setWorkspace]);

  // Centralized compliance suite tool clicked from footer or other places
  useEffect(() => {
    const handleSelectTool = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      const id = customEvent?.detail?.id;
      if (!id) return;

      if (workspaceRef.current !== 'compliance-suite') {
        setWorkspace('compliance-suite');
      }

      // Sync URL hash - only update if different to prevent infinite event loop!
      if (['calc-salary', 'calc-gst'].includes(id)) {
        const targetHash = id === 'calc-salary' ? '#tax' : '#gst';
        if (window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }
      } else {
        if (window.location.hash !== '#validators') {
          window.location.hash = '#validators';
        }
      }
    };

    window.addEventListener('select-compliance-tool', handleSelectTool);
    return () => window.removeEventListener('select-compliance-tool', handleSelectTool);
  }, [setWorkspace]);

  // Map "open-chat" event to AI Assistant full screen workspace
  useEffect(() => {
    const handleOpenChatGlobal = () => {
      if (window.location.hash !== '#assistant') {
        window.location.hash = '#assistant';
      }
      if (workspaceRef.current !== 'compliance-suite') {
        setWorkspace('compliance-suite');
      }
    };
    window.addEventListener('open-chat', handleOpenChatGlobal);
    return () => window.removeEventListener('open-chat', handleOpenChatGlobal);
  }, [setWorkspace]);

  // Prevent background scrolling when workspace is active (SaaS UX standard)
  useEffect(() => {
    if (workspace) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [workspace]);

  // Global Escape key listener to exit active workspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && workspaceRef.current) {
        handleBackToHome();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic document.title update based on workspace/sub-tool hash
  useEffect(() => {
    const updateTitle = () => {
      const hash = window.location.hash;
      if (workspace === 'compliance-suite') {
        if (hash === '#tax') {
          document.title = "Income Tax Calculator | Ankesh Kumar";
        } else if (hash === '#gst') {
          document.title = "GST Calculator | Ankesh Kumar";
        } else if (hash === '#validators') {
          document.title = "Compliance Validators | Ankesh Kumar";
        } else {
          document.title = "Compliance Suite | Ankesh Kumar";
        }
      } else if (workspace === 'pdf-toolkit') {
        document.title = "PDF Toolkit | Ankesh Kumar";
      } else if (workspace === 'assistant') {
        document.title = "AI Compliance Assistant | Ankesh Kumar";
      } else if (workspace === 'compliance-hub') {
        document.title = "Compliance Hub | Ankesh Kumar";
      } else {
        document.title = "Ankesh Kumar | Chartered Accountant";
      }
    };

    updateTitle();
    window.addEventListener('hashchange', updateTitle);
    return () => window.removeEventListener('hashchange', updateTitle);
  }, [workspace]);

  const handleBackToHome = () => {
    window.location.hash = '';
    setWorkspace(null);
  };

  const getWorkspaceTitle = (workspace: string) => {
    switch(workspace) {
      case 'compliance-hub': 
      case 'compliance-suite': 
      case 'assistant':
        return 'Compliance Workspace';
      case 'pdf-toolkit': return 'PDF Toolkit';
      default: return 'Application';
    }
  };

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen flex flex-col bg-light text-navy dark:bg-darkBg dark:text-darkText transition-colors duration-300 relative pb-10">
        <BackgroundParticles /> {/* Global Ambient Background */}
        <CursorTrail /> {/* Interactive Trail */}
        
        <Header 
          darkMode={darkMode} 
          toggleTheme={toggleTheme} 
          onOpenMagic={() => setShowMagic(true)} 
          activeWorkspace={workspace}
        />
        
        <main className="flex-grow z-10 flex flex-col">
          {/* Main Portfolio Sections - Kept fully rendered beneath the workspace overlay */}
          <Hero />
          <About />

          {/* Narrative Chapter: FROM PRACTICE TO PRODUCT */}
          <section className="py-32 bg-slate-50 dark:bg-darkBg transition-colors duration-300 relative overflow-hidden border-t border-b border-slate-200/50 dark:border-slate-850/40">
            <div className="container mx-auto px-6 max-w-4xl text-center space-y-8">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.25em] uppercase">FROM PRACTICE TO PRODUCT</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-navy dark:text-white tracking-tight leading-tight max-w-3xl mx-auto">
                Why a Chartered Accountant <span className="text-orange-500">engineers software</span>.
              </h2>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-350 leading-relaxed max-w-2xl mx-auto font-medium">
                During my articleship at GPHK & Associates, I faced a recurring frustration: elite financial practitioners wasting hundreds of hours on manual, repetitive file handling and spreadsheet validations.
              </p>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-350 leading-relaxed max-w-2xl mx-auto font-medium">
                I built <span className="text-navy dark:text-white font-bold">Ankesh Digital Workspace</span> to bridge that gap—transforming rigorous statutory training into high-performance, private, client-side software. Real products solving real corporate compliance challenges.
              </p>
            </div>
          </section>

          <Products />
          <WhyChooseMe />

          {/* Post-Products Divider */}
          <section className="py-32 bg-slate-50 dark:bg-darkBg transition-colors duration-300 relative overflow-hidden border-t border-b border-slate-200/50 dark:border-slate-850/40">
            <div className="container mx-auto px-6 max-w-4xl text-center space-y-6">
              <h3 className="text-3xl md:text-5xl font-black text-navy dark:text-white tracking-tight leading-tight">
                "Built from real articleship experience—<span className="text-orange-500">not hypothetical projects</span>."
              </h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-450 uppercase tracking-[0.25em] font-extrabold">
                PROVEN FIELD EXPOSURE
              </p>
            </div>
          </section>

          <Experience />
          <Skills />
          <CareerHighlights />
          <Contact />

          {/* Full Screen Animated Workspace Overlay Manager */}
          <AnimatePresence mode="wait">
            {workspace && (
              <motion.div
                key={workspace}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-x-0 bottom-0 top-[68px] md:top-[84px] z-[85] bg-light dark:bg-darkBg overflow-y-auto flex flex-col scrollbar-thin"
              >
                {/* Workspace Sticky Control Bar */}
                <div className="sticky top-0 z-[90] bg-white/95 dark:bg-darkCard/95 backdrop-blur-md border-b border-slate-200/85 dark:border-slate-800/85 py-3.5 px-6 flex items-center justify-between transition-colors duration-300">
                  <button 
                    onClick={handleBackToHome}
                    className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-corporate dark:hover:text-gold transition-colors group cursor-pointer outline-none"
                  >
                    <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Home</span>
                  </button>
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {getWorkspaceTitle(workspace)} Workspace
                  </div>
                </div>

                {/* Workspace Sub-Component Injection with Suspense Fallbacks */}
                <div className="flex-grow w-full">
                  {workspace === 'compliance-suite' && (
                    <React.Suspense fallback={<WorkspaceLoading title="Compliance Workspace" />}>
                      <ComplianceSuite />
                    </React.Suspense>
                  )}
                  {workspace === 'pdf-toolkit' && (
                    <React.Suspense fallback={<WorkspaceLoading title="PDF Toolkit" />}>
                      <PdfToolkit key={pdfResetKey} />
                    </React.Suspense>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {!workspace && <Footer />}
        
        {!workspace && <ChatWidget />}
        
        <DigitalAnkesh />
        <PortfolioTour />
        <CommandPalette />

        {/* Full Screen AI Experience Modal */}
        {showMagic && (
          <HandGestureExperience onClose={() => setShowMagic(false)} />
        )}

        {/* Unified Global Workspace Elements */}
        <WorkspaceNotifications />
        <WorkspaceStatusBar />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <AppContent />
    </WorkspaceProvider>
  );
}
