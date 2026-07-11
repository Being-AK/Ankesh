import React, { useEffect, useState } from 'react';
import { SearchItem, searchIndex } from './searchIndex';
import { Sparkles, Cpu, Layers, Shield, Calculator, ArrowRight, FileText, Star, History, Download, Compass } from 'lucide-react';

interface QuickActionsProps {
  onSelectAction: (item: SearchItem) => void;
  onOpenWorkspace: (hash: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectAction, onOpenWorkspace }) => {
  const [pinned, setPinned] = useState<string[]>([]);
  const [recents, setRecents] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);

  // Load dynamic data from localStorage on mount
  useEffect(() => {
    try {
      const storedPinned = localStorage.getItem('ankesh_pinned_tools_v1');
      if (storedPinned) {
        setPinned(JSON.parse(storedPinned));
      } else {
        // Default pinned items if empty
        const defaultPinned = ['merge', 'calc-gst', 'ai-chat', 'organize-pdf'];
        setPinned(defaultPinned);
        localStorage.setItem('ankesh_pinned_tools_v1', JSON.stringify(defaultPinned));
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const storedRecents = localStorage.getItem('ankesh_recent_workspaces_v1');
      if (storedRecents) {
        setRecents(JSON.parse(storedRecents));
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const storedDownloads = localStorage.getItem('ankesh_download_log_v1');
      if (storedDownloads) {
        setDownloads(JSON.parse(storedDownloads));
      } else {
        // Pre-seed some beautiful, professional historical entries
        const seedDownloads = [
          { name: 'GST_Computation_Report_Q1_FY26.pdf', size: '142 KB', date: 'Just now' },
          { name: 'Merged_Financial_Statements_Signed.pdf', size: '1.2 MB', date: '3 hours ago' },
          { name: 'Salary_Regime_Comparison_FY2526.pdf', size: '89 KB', date: '1 day ago' }
        ];
        setDownloads(seedDownloads);
        localStorage.setItem('ankesh_download_log_v1', JSON.stringify(seedDownloads));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Helper to resolve a tool ID/target to its SearchItem
  const resolveSearchItem = (id: string): SearchItem | undefined => {
    return searchIndex.find(item => item.target === id || item.id === id);
  };

  // Continue Last Session configuration
  const lastWorkspaceHash = localStorage.getItem('ankesh_last_workspace_hash') || '#compliance-suite';
  const lastWorkspaceName = lastWorkspaceHash.includes('pdf') ? 'PDF Toolkit' : 'Compliance Suite';

  // Format category display names
  const getCategoryLabel = (cat: string) => {
    if (cat === 'pdf-toolkit') return 'PDF Toolkit';
    if (cat === 'compliance-suite') return 'Compliance Suite';
    return cat;
  };

  return (
    <div className="px-4 py-3 space-y-5 select-none font-sans text-left">
      
      {/* SECTION 1: Resume Session & Quick Launch */}
      <div className="space-y-2">
        <div className="px-2 text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Sparkles size={11} className="text-orange-500 animate-pulse shrink-0" />
          Continue Session
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Last opened workspace */}
          <button
            onClick={() => onOpenWorkspace(lastWorkspaceHash)}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-corporate dark:hover:border-gold bg-slate-50/50 dark:bg-slate-900/30 text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/10 transition-all cursor-pointer group"
          >
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 font-mono">Last Opened Module</span>
              <span className="text-xs font-black text-navy dark:text-white block truncate tracking-tight mt-0.5">Resume {lastWorkspaceName}</span>
            </div>
            <ArrowRight size={14} className="text-slate-400 group-hover:text-corporate dark:group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
          </button>

          {/* Quick Launch PDF Workspace */}
          <button
            onClick={() => onOpenWorkspace('#pdf-toolkit')}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-corporate dark:hover:border-gold bg-slate-50/50 dark:bg-slate-900/30 text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/10 transition-all cursor-pointer group"
          >
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 font-mono">File Sandbox</span>
              <span className="text-xs font-black text-navy dark:text-white block truncate tracking-tight mt-0.5">Open PDF Workspace</span>
            </div>
            <ArrowRight size={14} className="text-slate-400 group-hover:text-corporate dark:group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
          </button>
        </div>
      </div>

      {/* SECTION 2: Pinned Tools */}
      {pinned.length > 0 && (
        <div className="space-y-2">
          <div className="px-2 text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Star size={11} className="text-gold fill-gold shrink-0" />
            Pinned Tools
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {pinned.map((toolId) => {
              const item = resolveSearchItem(toolId);
              if (!item) return null;
              
              // Get custom colors based on type
              const isPdf = item.category === 'PDF Toolkit';
              const isAi = item.category === 'AI' || item.target === 'ai-chat';
              
              const iconColor = isPdf 
                ? 'bg-orange-500/10 text-orange-500' 
                : isAi 
                  ? 'bg-purple-500/10 text-purple-500' 
                  : 'bg-emerald-500/10 text-emerald-500';

              const IconComponent = isPdf ? Layers : isAi ? Cpu : Calculator;

              return (
                <button
                  key={toolId}
                  onClick={() => onSelectAction(item)}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-100/30 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-850/60 hover:border-corporate dark:hover:border-gold transition-all cursor-pointer text-center group"
                >
                  <div className={`w-9 h-9 rounded-xl ${iconColor} flex items-center justify-center mb-2 shrink-0 transition-transform group-hover:scale-105 duration-200 shadow-sm`}>
                    <IconComponent size={15} />
                  </div>
                  <span className="text-[10.5px] font-extrabold text-navy dark:text-white tracking-tight leading-tight block truncate max-w-full">
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: Recent Workspaces & History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Side: Recent Workspace Modules */}
        <div className="space-y-2">
          <div className="px-2 text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <History size={11} className="text-corporate dark:text-gold shrink-0" />
            Recent Workspaces
          </div>
          
          <div className="space-y-1.5">
            {recents.length > 0 ? (
              recents.slice(0, 3).map((item, idx) => {
                const resolved = resolveSearchItem(item.id);
                return (
                  <button
                    key={idx}
                    onClick={() => resolved ? onSelectAction(resolved) : onOpenWorkspace(item.id === 'pdf-toolkit' ? '#pdf-toolkit' : '#compliance-suite')}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-slate-100/50 dark:hover:bg-slate-850/30 transition-colors cursor-pointer group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-corporate dark:group-hover:text-gold shrink-0 text-xs">
                      💼
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-navy dark:text-slate-200 block truncate group-hover:text-corporate dark:group-hover:text-gold">
                        {resolved ? resolved.title : item.title}
                      </span>
                      <span className="text-[8.5px] font-mono uppercase tracking-wider text-slate-400 block leading-none mt-0.5">
                        {getCategoryLabel(item.category)}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 px-2 py-1 font-mono italic">
                No recent activity logs recorded.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Recently Downloaded files (metadata-only) */}
        <div className="space-y-2">
          <div className="px-2 text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Download size={11} className="text-emerald-500 shrink-0" />
            Exported Artifacts
          </div>

          <div className="space-y-1.5">
            {downloads.slice(0, 3).map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 border border-transparent hover:border-slate-100 dark:hover:border-slate-850/40"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <FileText size={12} />
                </div>
                <div className="min-w-0 flex-grow">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block truncate" title={file.name}>
                    {file.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[8.5px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
