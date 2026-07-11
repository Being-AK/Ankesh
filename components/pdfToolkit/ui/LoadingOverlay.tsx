import React from 'react';
import { Loader2, CheckCircle2, Lock, Cpu, Layers, Download } from 'lucide-react';

interface LoadingOverlayProps {
  message?: React.ReactNode;
}

export default function LoadingOverlay({ message = "Processing..." }: LoadingOverlayProps) {
  const msgStr = typeof message === 'string' ? message : String(message || '');

  // Determine stage states based on active messages from parent operations
  let s1 = 'pending'; // Ingestion
  let s2 = 'pending'; // Processing
  let s3 = 'pending'; // Assembly
  let s4 = 'pending'; // Finalizing

  if (
    msgStr.includes('Loading') || 
    msgStr.includes('Initialize') || 
    msgStr.includes('Scan') || 
    msgStr.includes('Analyzing')
  ) {
    s1 = 'active';
  } else if (
    msgStr.includes('Applying') || 
    msgStr.includes('Watermark') || 
    msgStr.includes('Processing') || 
    msgStr.includes('Deleting') || 
    msgStr.includes('Extracting') || 
    msgStr.includes('Deconstructing') || 
    msgStr.includes('Tesseract') ||
    msgStr.includes('language')
  ) {
    s1 = 'completed';
    s2 = 'active';
  } else if (
    msgStr.includes('Saving') || 
    msgStr.includes('Rebuilding') || 
    msgStr.includes('Compiling')
  ) {
    s1 = 'completed';
    s2 = 'completed';
    s3 = 'active';
  } else if (
    msgStr.includes('Download') || 
    msgStr.includes('Preparing') || 
    msgStr.includes('Finishing')
  ) {
    s1 = 'completed';
    s2 = 'completed';
    s3 = 'completed';
    s4 = 'active';
  } else {
    // Smart fallback: parse context or set processing as active
    s1 = 'completed';
    s2 = 'active';
  }

  const stages = [
    { 
      id: 1, 
      label: 'Document Ingestion', 
      desc: 'Local sandbox verification', 
      status: s1,
      icon: <Lock size={14} />
    },
    { 
      id: 2, 
      label: 'On-Device Processing', 
      desc: 'Executing requested edits', 
      status: s2,
      icon: <Cpu size={14} />
    },
    { 
      id: 3, 
      label: 'PDF Stream Assembly', 
      desc: 'Rebuilding file container bytes', 
      status: s3,
      icon: <Layers size={14} />
    },
    { 
      id: 4, 
      label: 'Finalizing Output', 
      desc: 'Triggering local auto-download', 
      status: s4,
      icon: <Download size={14} />
    },
  ];

  return (
    <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-[4px] z-40 flex items-center justify-center p-4 animate-fade-in rounded-2xl">
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.3; }
        }
        .scan-bar {
          animation: scan 2.5s ease-in-out infinite;
        }
      `}</style>
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-5 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -right-24 -top-24 w-48 h-48 bg-corporate/5 dark:bg-gold/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Local Security Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">On-Device Sandbox</span>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-medium border border-slate-200/50 dark:border-slate-800/50">
            Secure
          </span>
        </div>

        {/* Animated Document Scan Visual */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/40 rounded-xl">
          <div className="w-14 h-16 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative flex items-center justify-center overflow-hidden">
            {/* Animated Laser Scan Bar */}
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-corporate dark:via-gold to-transparent scan-bar shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            {/* Inside Content Representation */}
            <div className="space-y-1.5 w-8">
              <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full w-full"></div>
              <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full w-4/5"></div>
              <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full w-5/6"></div>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Processing Local Stream...</span>
        </div>

        {/* Progress Pipeline / Stepper */}
        <div className="space-y-3">
          {stages.map((stg) => {
            const isCompleted = stg.status === 'completed';
            const isActive = stg.status === 'active';
            
            return (
              <div key={stg.id} className="flex items-start gap-3 group transition-all duration-300">
                {/* Visual Connector Line */}
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-350 ${
                    isCompleted 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                      : isActive 
                        ? 'bg-corporate/10 dark:bg-gold/10 border-corporate dark:border-gold text-corporate dark:text-gold shadow-sm scale-105' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 size={13} className="stroke-[2.5px]" />
                    ) : isActive ? (
                      <Loader2 size={12} className="animate-spin stroke-[2.5px]" />
                    ) : (
                      stg.icon
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-bold leading-tight ${
                    isCompleted 
                      ? 'text-slate-500 dark:text-slate-450 line-through decoration-slate-300/60 dark:decoration-slate-700/60' 
                      : isActive 
                        ? 'text-navy dark:text-white font-black' 
                        : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {stg.label}
                  </span>
                  <span className={`text-[10px] leading-tight mt-0.5 ${
                    isActive 
                      ? 'text-slate-500 dark:text-slate-450 font-medium' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {stg.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Raw detailed step output */}
        <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/40 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-corporate dark:bg-gold animate-ping"></span>
          <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 truncate text-center">
            {msgStr}
          </span>
        </div>
      </div>
    </div>
  );
}
