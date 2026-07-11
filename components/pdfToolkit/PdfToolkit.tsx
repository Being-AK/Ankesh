import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { motion } from 'motion/react';
import { 
  Layers, 
  Scissors, 
  Minimize2, 
  RotateCw, 
  FileX, 
  ExternalLink, 
  Lock, 
  Unlock, 
  FileImage, 
  Images, 
  ArrowRight,
  Info,
  X,
  Languages,
  Type,
  LayoutGrid,
  Search,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ShieldCheck,
  Shield,
  WifiOff,
  Zap
} from 'lucide-react';
import MergePdfTool from './MergePdfTool';
import SplitPdfTool from './SplitPdfTool';
import CompressPdfTool from './CompressPdfTool';
import RotatePdfTool from './RotatePdfTool';
import DeletePagesTool from './DeletePagesTool';
import ExtractPagesTool from './ExtractPagesTool';
import ProtectPdfTool from './ProtectPdfTool';
import ImagesToPdfTool from './ImagesToPdfTool';
import UnlockPdfTool from './UnlockPdfTool';
import PdfToImagesTool from './PdfToImagesTool';
import OcrPdfTool from './OcrPdfTool';
import WatermarkPdfTool from './WatermarkPdfTool';
import OrganizePdfTool from './OrganizePdfTool';
import RedactPdfTool from './RedactPdfTool';

interface PdfTool {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

interface PdfToolkitProps {
  onWorkspaceStateChange?: (isOpen: boolean) => void;
}

export default function PdfToolkit({ onWorkspaceStateChange }: PdfToolkitProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showDemoBanner, setShowDemoBanner] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGlowing, setIsGlowing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const glowTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { setTool } = useWorkspace();

  useEffect(() => {
    setTool(selectedTool);
  }, [selectedTool, setTool]);

  useEffect(() => {
    const handleGlow = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id === 'pdf-toolkit') {
        setIsGlowing(true);
        if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
        glowTimerRef.current = setTimeout(() => {
          setIsGlowing(false);
          glowTimerRef.current = null;
        }, 1200);
      }
    };
    window.addEventListener('glow-workspace', handleGlow);
    return () => {
      window.removeEventListener('glow-workspace', handleGlow);
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    };
  }, []);

  // Listen for external select-pdf-tool events
  useEffect(() => {
    const handleSelectPdfTool = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      const id = customEvent.detail?.id;
      if (id) {
        setSelectedTool(id);
      }
    };
    window.addEventListener('select-pdf-tool', handleSelectPdfTool);
    return () => window.removeEventListener('select-pdf-tool', handleSelectPdfTool);
  }, []);

  // Track last active workspace
  useEffect(() => {
    localStorage.setItem('ankesh_last_workspace_hash', '#pdf-toolkit');
  }, []);

  useEffect(() => {
    onWorkspaceStateChange?.(!!selectedTool);
  }, [selectedTool, onWorkspaceStateChange]);

  useEffect(() => {
    const width = selectedTool ? (sidebarCollapsed ? '72px' : '256px') : '0px';
    document.documentElement.style.setProperty('--pdf-sidebar-width', width);
  }, [selectedTool, sidebarCollapsed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSidebarCollapsed(false);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const tools: PdfTool[] = [
    {
      id: 'organize-pdf',
      title: 'Organize PDF',
      desc: 'Rearrange, rotate, delete, and sort pages of your PDF with live previews and drag-and-drop.',
      icon: <LayoutGrid size={24} />
    },
    {
      id: 'merge',
      title: 'Merge PDF',
      desc: 'Combine multiple PDF files into a single document in your preferred sequence.',
      icon: <Layers size={24} />
    },
    {
      id: 'split',
      title: 'Split PDF',
      desc: 'Extract specific page ranges or split a PDF into separate individual files.',
      icon: <Scissors size={24} />
    },
    {
      id: 'compress',
      title: 'Compress PDF',
      desc: 'Reduce PDF file size while maintaining maximum document quality.',
      icon: <Minimize2 size={24} />
    },
    {
      id: 'rotate',
      title: 'Rotate PDF',
      desc: 'Rotate individual pages or entire documents to portrait or landscape.',
      icon: <RotateCw size={24} />
    },
    {
      id: 'delete',
      title: 'Delete Pages',
      desc: 'Remove unnecessary pages from your PDF file before sharing.',
      icon: <FileX size={24} />
    },
    {
      id: 'extract',
      title: 'Extract Pages',
      desc: 'Save only the pages you need from a larger PDF into a new document.',
      icon: <ExternalLink size={24} />
    },
    {
      id: 'protect',
      title: 'Protect PDF',
      desc: 'Secure your PDF with a strong password to prevent unauthorized access.',
      icon: <Lock size={24} />
    },
    {
      id: 'unlock',
      title: 'Unlock PDF',
      desc: 'Remove password security to access or print encrypted PDF documents.',
      icon: <Unlock size={24} />
    },
    {
      id: 'img2pdf',
      title: 'Images to PDF',
      desc: 'Convert JPG, PNG, and WebP images into a single clean PDF file.',
      icon: <FileImage size={24} />
    },
    {
      id: 'pdf2img',
      title: 'PDF to Images',
      desc: 'Extract all pages from a PDF and convert them into high-quality images.',
      icon: <Images size={24} />
    },
    {
      id: 'ocr',
      title: 'OCR PDF (Extract Text)',
      desc: 'Extract structured text blocks, tables, and paragraphs from scanned PDF documents client-side.',
      icon: <Languages size={24} />
    },
    {
      id: 'watermark',
      title: 'Watermark PDF',
      desc: 'Add custom text or image watermarks to your PDF with precise layout and opacity controls.',
      icon: <Type size={24} />
    },
    {
      id: 'redact',
      title: 'Redact PDF',
      desc: 'Permanently blackout and sanitize sensitive text, images, or vectors for client-side security.',
      icon: <Shield size={24} />
    }
  ];

  const handleOpenTool = (toolId: string, toolTitle: string) => {
    if (toolId === 'organize-pdf') {
      setSelectedTool('organize-pdf');
    } else if (toolId === 'merge') {
      setSelectedTool('merge');
    } else if (toolId === 'split') {
      setSelectedTool('split');
    } else if (toolId === 'compress') {
      setSelectedTool('compress');
    } else if (toolId === 'rotate') {
      setSelectedTool('rotate');
    } else if (toolId === 'delete') {
      setSelectedTool('delete');
    } else if (toolId === 'extract') {
      setSelectedTool('extract');
    } else if (toolId === 'protect') {
      setSelectedTool('protect');
    } else if (toolId === 'unlock') {
      setSelectedTool('unlock');
    } else if (toolId === 'img2pdf') {
      setSelectedTool('img2pdf');
    } else if (toolId === 'pdf2img') {
      setSelectedTool('pdf2img');
    } else if (toolId === 'ocr') {
      setSelectedTool('ocr');
    } else if (toolId === 'watermark') {
      setSelectedTool('watermark');
    } else if (toolId === 'redact') {
      setSelectedTool('redact');
    } else {
      setShowDemoBanner(toolTitle);
    }
  };

  const categories = [
    {
      id: 'organize',
      title: 'Organize',
      toolIds: ['organize-pdf', 'merge', 'split', 'delete', 'extract', 'rotate']
    },
    {
      id: 'convert',
      title: 'Convert',
      toolIds: ['img2pdf', 'pdf2img']
    },
    {
      id: 'security',
      title: 'Security',
      toolIds: ['protect', 'unlock', 'redact']
    },
    {
      id: 'ocr',
      title: 'OCR',
      toolIds: ['ocr']
    },
    {
      id: 'edit',
      title: 'Edit',
      toolIds: ['watermark']
    },
    {
      id: 'utilities',
      title: 'Utilities',
      toolIds: ['compress']
    }
  ];

  const filteredTools = tools.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="pdf-toolkit" className={`relative py-24 bg-light dark:bg-darkBg overflow-hidden transition-all duration-1000 ${isGlowing ? 'ring-4 ring-orange-500/20 dark:ring-orange-500/10 shadow-[0_0_60px_rgba(249,115,22,0.15)]' : ''} ${selectedTool ? (sidebarCollapsed ? 'pdf-workspace-active md:pl-[72px]' : 'pdf-workspace-active md:pl-64') : ''}`}>
      {/* If a tool is active, render the Desktop Sidebar on md screens */}
      {selectedTool && (
        <aside className={`fixed left-0 top-[68px] md:top-[84px] bottom-0 ${sidebarCollapsed ? 'w-[72px]' : 'w-64'} bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 z-[100] flex flex-col justify-between hidden md:flex transition-all duration-300 ease-in-out shadow-xl`}>
          {/* Header */}
          <div className={`border-b border-slate-200/60 dark:border-slate-800/60 transition-all duration-300 ${sidebarCollapsed ? 'p-3 flex flex-col items-center' : 'p-6'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              {!sidebarCollapsed && (
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">PDF Workspace</span>
              )}
            </div>
            {!sidebarCollapsed ? (
              <>
                <h4 className="text-sm font-black text-navy dark:text-white uppercase tracking-wider">Workspace Mode</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">100% Secure & Client-Side</p>
              </>
            ) : (
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">PDF</span>
            )}
          </div>

          {/* Quick Search */}
          {!sidebarCollapsed ? (
            <div className="px-4 py-2 border-b border-slate-200/40 dark:border-slate-800/40">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools... (Ctrl+K)"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-navy dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-corporate dark:focus:ring-gold transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-2 border-b border-slate-200/40 dark:border-slate-800/40 flex justify-center">
              <button 
                onClick={() => {
                  setSidebarCollapsed(false);
                  setTimeout(() => searchInputRef.current?.focus(), 150);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-950/60 rounded-xl transition-all"
                title="Search Tools"
              >
                <Search size={16} />
              </button>
            </div>
          )}

          {/* Tools List */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
            {categories.map((cat) => {
              const catTools = filteredTools.filter(t => cat.toolIds.includes(t.id));
              if (catTools.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-1">
                  {!sidebarCollapsed ? (
                    <div className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                      {cat.title}
                    </div>
                  ) : (
                    <div className="h-px bg-slate-250 dark:bg-slate-800 my-2 mx-1" />
                  )}
                  <div className="space-y-0.5">
                    {catTools.map((t) => {
                      const isActive = selectedTool === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleOpenTool(t.id, t.title)}
                          title={sidebarCollapsed ? `${t.title} - ${t.desc}` : undefined}
                          className={`w-full flex items-center rounded-xl text-left transition-all duration-200 cursor-pointer group relative ${
                            sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'
                          } ${
                            isActive
                              ? 'bg-corporate text-white dark:bg-gold dark:text-navy font-bold shadow-md'
                              : 'text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-950/60 hover:text-navy dark:hover:text-white'
                          }`}
                        >
                          {/* Left Accent indicator for active tool */}
                          {isActive && (
                            <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white dark:bg-navy rounded-r-md" />
                          )}
                          
                          <div className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-white dark:text-navy' : 'text-slate-400 dark:text-slate-500 group-hover:text-corporate dark:group-hover:text-gold'}`}>
                            {React.cloneElement(t.icon as React.ReactElement<any>, { size: 16 })}
                          </div>
                          {!sidebarCollapsed && (
                            <span className="text-xs font-semibold truncate">{t.title}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar / Quick Back to Grid */}
          <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-950/40 flex flex-col gap-2">
            {!sidebarCollapsed ? (
              <>
                <button
                  onClick={() => setSelectedTool(null)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:text-navy dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-sm"
                >
                  <LayoutGrid size={13} />
                  <span>Exit Desktop Mode</span>
                </button>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[10px] font-semibold transition-all"
                >
                  <ChevronLeft size={12} />
                  <span>Collapse Sidebar</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 items-center">
                <button
                  onClick={() => setSelectedTool(null)}
                  title="Exit Desktop Mode"
                  className="p-2.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:text-navy dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-sm"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  title="Expand Sidebar"
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-corporate/5 dark:bg-corporate/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-gold/5 dark:bg-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 relative">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="w-3.5 h-1 bg-orange-500 rounded-full"></span>
            <span className="w-3.5 h-1 bg-slate-200 dark:bg-slate-750 rounded-full"></span>
            <span className="w-3.5 h-1 bg-emerald-500 rounded-full"></span>
          </div>
          <h2 className="text-sm font-bold text-gold uppercase tracking-widest mb-2">100% Local Workspace Utilities</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-navy dark:text-white">
            Professional <span className="text-orange-500">PDF</span> Toolkit (Browser-Based & Secure)
          </h3>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Manage your tax filings, financial statements, and compliance audits efficiently with secure document utilities. 
            <strong className="text-navy dark:text-white block mt-1.5 font-bold">⚠️ All operations run locally in your browser. Your files are never uploaded or sent to any server. Privacy-first by design.</strong>
          </p>
        </div>

        {/* Premium Product-Style Feature Bento Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          {/* Card 1: Client-Side Sandbox */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl relative overflow-hidden shadow-md group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-corporate/5 rounded-full blur-xl" />
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-corporate/10 text-corporate dark:text-blue-400 flex items-center justify-center font-bold">
                <Cpu size={20} className="group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-navy dark:text-white uppercase tracking-wider">Client-Side Sandbox</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">100% Browser Executed</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Operations take place entirely within your device's browser memory. Your private financial materials are shielded locally.
            </p>
            {/* Visual Interactive Graphic */}
            <div className="h-14 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex items-center justify-between px-4 overflow-hidden relative">
              <span className="text-[10px] font-mono font-bold text-corporate dark:text-gold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                SECURE_SANDBOX
              </span>
              <div className="flex gap-1">
                <span className="w-1 h-3 bg-corporate/30 dark:bg-gold/30 rounded-full animate-bounce-gentle" />
                <span className="w-1 h-5 bg-corporate/60 dark:bg-gold/60 rounded-full animate-bounce-gentle" style={{ animationDelay: '0.1s' }} />
                <span className="w-1 h-4 bg-corporate dark:bg-gold rounded-full animate-bounce-gentle" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </motion.div>

          {/* Card 2: True Offline Freedom */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl relative overflow-hidden shadow-md group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <WifiOff size={20} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-navy dark:text-white uppercase tracking-wider">Offline Capable</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Zero Cloud Dependency</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              No internet connection required. Disconnect from the web entirely and compile or split files with absolute privacy.
            </p>
            {/* Visual Interactive Graphic */}
            <div className="h-14 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex items-center justify-between px-4 overflow-hidden">
              <span className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                NET_DISCONNECTED
              </span>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/10">READY</span>
            </div>
          </motion.div>

          {/* Card 3: Zero Server Uploads */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl relative overflow-hidden shadow-md group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl" />
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <ShieldCheck size={20} className="group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-navy dark:text-white uppercase tracking-wider">Zero Uploads</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Absolute Protection</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Your confidential ledger files and tax audits never transit across the network. Zero data leak vectors exist.
            </p>
            {/* Visual Interactive Graphic */}
            <div className="h-14 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex items-center justify-between px-4 overflow-hidden relative">
              <span className="text-[10px] font-mono font-bold text-orange-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                UPLOADS: BLOCKED
              </span>
              <div className="flex items-center text-orange-500">
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.36 6.64a9 9 0 01-1.24 11.3l-1.5-1.5a6.5 6.5 0 10-8.49 0l-1.5 1.5a9 9 0 01-1.24-11.3M12 2v4m0 12v4M2 12h4m12 0h4" /></svg>
              </div>
            </div>
          </motion.div>

          {/* Card 4: WebAssembly Speed Engine */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl relative overflow-hidden shadow-md group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-xl" />
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center font-bold">
                <Zap size={20} className="group-hover:scale-110 transition-transform duration-300 text-orange-500" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-navy dark:text-white uppercase tracking-wider">Sub-Second WASM</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">High Performance Core</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              High-speed WebAssembly engines compile and parse document pages locally in sub-seconds.
            </p>
            {/* Visual Interactive Graphic */}
            <div className="h-14 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col justify-center px-4 overflow-hidden gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500">
                <span>WASM_ENGINE</span>
                <span className="text-gold">980 MB/s</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ left: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                  className="relative w-1/2 h-full bg-gradient-to-r from-corporate via-gold to-corporate rounded-full"
                />
              </div>
            </div>
          </motion.div>

        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {tools.map((tool) => (
            <div 
              key={tool.id} 
              className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-corporate dark:hover:border-gold group relative overflow-hidden"
            >
              {/* Decorative Subtle Background Pattern */}
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Tool Icon */}
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 text-corporate dark:text-gold rounded-xl flex items-center justify-center mb-5 transition-colors group-hover:bg-corporate group-hover:text-white dark:group-hover:bg-gold dark:group-hover:text-navy shadow-sm">
                  {tool.icon}
                </div>
                
                {/* Tool Title */}
                <h4 className="text-base font-extrabold text-navy dark:text-white mb-2 group-hover:text-corporate dark:group-hover:text-gold transition-colors">
                  {tool.title}
                </h4>
                
                {/* Tool Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-grow">
                  {tool.desc}
                </p>
                
                {/* Open Button */}
                <button 
                  onClick={() => handleOpenTool(tool.id, tool.title)}
                  className="w-full mt-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-corporate hover:text-white dark:hover:bg-gold dark:hover:text-navy text-xs font-bold rounded-xl border border-slate-100 dark:border-slate-800/80 transition-all duration-300 group/btn cursor-pointer"
                >
                  <span>Open Tool</span>
                  <ArrowRight size={13} className="transform group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Tool Informational Banner */}
      {showDemoBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowDemoBanner(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mb-1">
                <Info size={32} />
              </div>
              <h3 className="text-xl font-bold text-navy dark:text-white">{showDemoBanner} is Offline</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                The <span className="font-semibold text-slate-800 dark:text-white">{showDemoBanner}</span> tool is part of the premium compliance suite. In this professional workspace demo, the <span className="font-bold text-gold">Merge PDF</span> tool is fully unlocked and ready to use.
              </p>
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => {
                    setShowDemoBanner(null);
                    setSelectedTool('merge');
                  }}
                  className="flex-1 bg-corporate hover:bg-corporate/90 dark:bg-gold dark:hover:bg-amber-500 text-white dark:text-navy font-bold py-3 px-4 rounded-xl text-xs transition-all duration-300 cursor-pointer shadow-md"
                >
                  Try Merge PDF Tool
                </button>
                <button
                  onClick={() => setShowDemoBanner(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ORGANIZE PDF INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'organize-pdf' && (
        <OrganizePdfTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- REDACT PDF INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'redact' && (
        <RedactPdfTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- MERGE PDF INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'merge' && (
        <MergePdfTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- SPLIT PDF INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'split' && (
        <SplitPdfTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- COMPRESS PDF INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'compress' && (
        <CompressPdfTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- ROTATE PDF INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'rotate' && (
        <RotatePdfTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- DELETE PAGES INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'delete' && (
        <DeletePagesTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- EXTRACT PAGES INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'extract' && (
        <ExtractPagesTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- PROTECT PDF INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'protect' && (
        <ProtectPdfTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- IMAGES TO PDF INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'img2pdf' && (
        <ImagesToPdfTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- UNLOCK PDF INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'unlock' && (
        <UnlockPdfTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- PDF TO IMAGES INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'pdf2img' && (
        <PdfToImagesTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- OCR PDF INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'ocr' && (
        <OcrPdfTool onClose={() => setSelectedTool(null)} />
      )}

      {/* --- WATERMARK PDF INTERACTIVE WORKSPACE MODAL --- */}
      {selectedTool === 'watermark' && (
        <WatermarkPdfTool onClose={() => setSelectedTool(null)} />
      )}


    </section>
  );
}
