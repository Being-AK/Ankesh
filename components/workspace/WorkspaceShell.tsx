import React from 'react';
import { useWorkspace } from './WorkspaceContext';
import { WorkspaceBadge } from './WorkspaceBadge';
import { WorkspaceHistory } from './WorkspaceHistory';
import { Copy, Download, RotateCcw, Printer, HelpCircle, Settings, Star, AlertCircle } from 'lucide-react';

interface WorkspaceShellProps {
  title: string;
  subtitle?: string;
  category: 'PDF Toolkit' | 'Compliance Suite' | 'AI Workspace';
  toolId?: string;
  
  // Standard Actions
  onCopy?: () => void;
  onDownload?: () => void;
  onReset?: () => void;
  onPrint?: () => void;
  
  // Help configuration
  helpText?: string;
  
  // Custom headers or tools
  extraActions?: React.ReactNode;
  children?: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  title,
  subtitle,
  category,
  toolId,
  onCopy,
  onDownload,
  onReset,
  onPrint,
  helpText,
  extraActions,
  children,
}) => {
  const { isToolPinned, pinTool, unpinTool, addNotification } = useWorkspace();

  const handlePinToggle = () => {
    if (!toolId) return;
    if (isToolPinned(toolId)) {
      unpinTool(toolId);
      addNotification(`${title} unpinned from workspace`, 'info', 2000);
    } else {
      pinTool(toolId);
      addNotification(`${title} pinned to workspace!`, 'success', 2000);
    }
  };

  const handleSettingsPlaceholder = () => {
    addNotification('Workspace settings configuration will be accessible in production grade rollout.', 'info', 3000);
  };

  const handleHelpClick = () => {
    if (helpText) {
      addNotification(`Help: ${helpText}`, 'info', 5000);
    } else {
      addNotification(`This sandbox executes 100% locally on your browser. For advanced inquiries, contact CA Ankesh.`, 'info', 4000);
    }
  };

  return (
    <div className="w-full flex flex-col min-h-full bg-light dark:bg-darkBg text-navy dark:text-darkText transition-colors duration-300 relative">
      
      {/* UNIFIED ACTION BAR */}
      <header 
        id={`action-bar-${toolId || 'generic'}`}
        className="sticky top-0 z-40 bg-white/95 dark:bg-[#0d1324]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-300 shadow-sm"
      >
        {/* Left Side: Breadcrumbs, Title, Pinned Indicator */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex flex-col min-w-0">
            {/* Breadcrumb row */}
            <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 font-mono">
              <span>{category}</span>
              <span>/</span>
              <span className="text-corporate dark:text-gold">{title}</span>
            </div>
            
            {/* Title & Star button */}
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-xl md:text-2xl font-black text-navy dark:text-white tracking-tight">
                {title}
              </h1>
              {toolId && (
                <button
                  onClick={handlePinToggle}
                  className={`p-1 rounded-lg transition-all hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${isToolPinned(toolId) ? 'text-gold scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                  title={isToolPinned(toolId) ? "Remove from Pinned Tools" : "Pin Tool to Workspace"}
                >
                  <Star size={16} fill={isToolPinned(toolId) ? "currentColor" : "none"} />
                </button>
              )}
            </div>

            {/* Subtitle / Description */}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed max-w-xl truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Navigation controllers & actions */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
          
          {/* History Stack Controller */}
          <WorkspaceHistory />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800/80 hidden sm:block" />

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
            {/* 1. Reset Action */}
            {onReset && (
              <button
                onClick={onReset}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 dark:hover:bg-orange-500/15 rounded-lg transition-colors cursor-pointer"
                title="Reset Form & Clear Data"
              >
                <RotateCcw size={14} />
              </button>
            )}

            {/* 2. Copy Action */}
            {onCopy && (
              <button
                onClick={onCopy}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-corporate dark:hover:text-gold hover:bg-corporate/10 dark:hover:bg-gold/15 rounded-lg transition-colors cursor-pointer"
                title="Copy Results to Clipboard"
              >
                <Copy size={14} />
              </button>
            )}

            {/* 3. Download / Export Action */}
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 rounded-lg transition-colors cursor-pointer"
                title="Download / Export Document"
              >
                <Download size={14} />
              </button>
            )}

            {/* 4. Print Action */}
            {onPrint && (
              <button
                onClick={onPrint}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/15 rounded-lg transition-colors cursor-pointer"
                title="Print Report"
              >
                <Printer size={14} />
              </button>
            )}

            {/* 5. Extra Actions injected */}
            {extraActions}

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* 6. Settings Action (Future rollout placeholder) */}
            <button
              onClick={handleSettingsPlaceholder}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Workspace Slabs Settings"
            >
              <Settings size={14} />
            </button>

            {/* 7. Help Action */}
            <button
              onClick={handleHelpClick}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Statutory Help & Security Information"
            >
              <HelpCircle size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Badges Underbar */}
      <div className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200/50 dark:border-slate-850/30 px-6 py-2 flex items-center justify-between text-[10px] font-mono select-none">
        <WorkspaceBadge 
          clientSide={category !== 'AI Workspace'} 
          privateSecure={true} 
          offlineReady={category !== 'AI Workspace'} 
          enterpriseGrade={category === 'Compliance Suite'}
          aiPowered={category === 'AI Workspace'}
        />
        <div className="text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1.5">
          <AlertCircle size={11} className="text-slate-400 shrink-0" />
          <span>Local Memory Shield Enabled</span>
        </div>
      </div>

      {/* Main Container Children */}
      <div className="flex-grow w-full relative">
        {children}
      </div>
    </div>
  );
};

export default WorkspaceShell;
