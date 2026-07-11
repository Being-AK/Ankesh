import React, { useState } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { History, ArrowLeft, ArrowRight, CornerDownRight, RotateCcw } from 'lucide-react';

export const WorkspaceHistory: React.FC = () => {
  const {
    history,
    historyIndex,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    setWorkspace,
    setTool,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);

  const handleJumpToHistory = (idx: number) => {
    // Custom jumper to history step
    if (idx === historyIndex) return;
    
    // Set to index directly (internal navigation can be hooked into context if needed, 
    // but we can just trigger goBack or goForward multiple times to reach that index or we can let goBack/goForward be sufficient).
    // For simplicity, we can do multiple sequential steps:
    let diff = idx - historyIndex;
    if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) goBack();
    } else {
      for (let i = 0; i < diff; i++) goForward();
    }
    setIsOpen(false);
  };

  const getStepLabel = (item: any) => {
    if (!item.workspace) return 'Portfolio Home';
    const wsLabel = item.workspace === 'pdf-toolkit' ? 'PDF Toolkit' : 'Compliance Workspace';
    if (!item.tool) return `${wsLabel} (Index)`;
    
    // Format tool ID beautifully
    const toolLabel = item.tool
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `${wsLabel} > ${toolLabel}`;
  };

  return (
    <div className="relative inline-block text-left select-none font-sans">
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 rounded-xl p-1 shrink-0">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${canGoBack ? 'text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
          title="Go Back (Alt+Left)"
        >
          <ArrowLeft size={13} />
        </button>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-250 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="Inspect navigation history timeline"
        >
          <History size={13} />
          <span className="text-[11px] font-black">{historyIndex + 1}/{history.length}</span>
        </button>

        <button
          onClick={goForward}
          disabled={!canGoForward}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${canGoForward ? 'text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
          title="Go Forward (Alt+Right)"
        >
          <ArrowRight size={13} />
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-3 z-50 animate-fade-in text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <History size={11} />
                Navigation History Stack
              </span>
              <button 
                onClick={() => handleJumpToHistory(0)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Reset back to start"
              >
                <RotateCcw size={10} />
              </button>
            </div>
            
            <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin">
              {history.map((item, idx) => {
                const isActive = idx === historyIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => handleJumpToHistory(idx)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-corporate text-white dark:bg-gold dark:text-navy font-bold' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <CornerDownRight size={11} className={`shrink-0 ${isActive ? 'text-white dark:text-navy opacity-80' : 'text-slate-400 opacity-60'}`} />
                    <span className="truncate">{getStepLabel(item)}</span>
                    {isActive && (
                      <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ml-auto bg-white/20 dark:bg-navy/10 text-white dark:text-navy border border-transparent">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default WorkspaceHistory;
