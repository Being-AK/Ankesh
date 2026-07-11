import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onClose: () => void;
}

export default function WorkspaceHeader({
  title,
  subtitle = "Local sandboxed execution: Files never upload or leave your system",
  icon,
  onClose
}: WorkspaceHeaderProps) {
  return (
    <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-start bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 bg-orange-500/10 text-orange-500 rounded-lg">
            {icon}
          </span>
          <h3 className="text-lg font-bold text-navy dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-450 font-semibold">
          <ShieldCheck size={14} className="shrink-0" />
          <span>{subtitle}</span>
        </div>
      </div>
      <button 
        onClick={onClose}
        aria-label="Close Workspace"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <X size={20} />
      </button>
    </div>
  );
}
