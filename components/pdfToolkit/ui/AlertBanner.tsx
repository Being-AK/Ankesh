import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AlertBannerProps {
  type: 'error' | 'success' | 'info';
  message: string;
  description?: string;
}

export default function AlertBanner({ type, message, description }: AlertBannerProps) {
  if (type === 'error') {
    return (
      <div className="flex items-start gap-2.5 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs animate-fade-in">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <span className="leading-relaxed font-medium">{message}</span>
      </div>
    );
  }

  if (type === 'info') {
    return (
      <div className="flex items-start gap-2.5 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl text-amber-600 dark:text-amber-450 text-xs animate-fade-in">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <div className="leading-relaxed font-medium">
          <p className="font-bold mb-0.5">{message}</p>
          {description && <p className="text-[11px] opacity-90 font-medium">{description}</p>}
        </div>
      </div>
    );
  }

  // Premium Completion Screen for Success state
  return (
    <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.03] border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl p-6 flex flex-col items-center text-center gap-5 animate-scale-in relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -left-16 -top-16 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Centered Success Icon with elegant pulse ring */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-12 h-12 bg-emerald-500/10 rounded-full animate-ping"></div>
        <div className="relative w-12 h-12 bg-emerald-500/20 dark:bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-full flex items-center justify-center shadow-inner">
          <CheckCircle2 size={24} className="stroke-[2.5px]" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-1">
        <h4 className="text-sm font-black text-navy dark:text-white uppercase tracking-wider">{message}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {description || "Your compiled document has been assembled successfully and is ready in your local downloads."}
        </p>
      </div>

      {/* Statistics & Insights Grid */}
      <div className="grid grid-cols-3 gap-3 w-full bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Privacy</span>
          <span className="text-xs font-black text-emerald-500 mt-1">100% Local</span>
        </div>
        <div className="flex flex-col items-center text-center border-x border-slate-200/50 dark:border-slate-800/50 px-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Network</span>
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 mt-1">0 KB Sent</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Engine</span>
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 mt-1">Sandbox</span>
        </div>
      </div>

      {/* Security Assurance Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Processed completely inside your secure browser thread
      </div>
    </div>
  );
}
