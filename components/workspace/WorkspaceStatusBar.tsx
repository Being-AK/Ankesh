import React from 'react';
import { useWorkspace } from './WorkspaceContext';
import { Star, ShieldAlert, Cpu, Monitor, WifiOff, Sun, Moon, Search, Sparkles } from 'lucide-react';

export const WorkspaceStatusBar: React.FC = () => {
  const {
    workspace,
    tool,
    processing,
    isOffline,
    isToolPinned,
    pinTool,
    unpinTool,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  } = useWorkspace();

  // Get display names
  const getWorkspaceLabel = () => {
    if (workspace === 'compliance-suite') return 'Compliance Workspace';
    if (workspace === 'pdf-toolkit') return 'PDF Toolkit';
    return 'Portfolio Home';
  };

  const getToolLabel = () => {
    if (!tool) return 'Overview';
    
    // Format tool id beautifully
    return tool
      .split('-')
      .map(word => {
        if (word.toUpperCase() === 'GST') return 'GST';
        if (word.toUpperCase() === 'GSTIN') return 'GSTIN';
        if (word.toUpperCase() === 'TDS') return 'TDS';
        if (word.toUpperCase() === 'MCA') return 'MCA';
        if (word.toUpperCase() === 'ROI') return 'ROI';
        if (word.toUpperCase() === 'CAGR') return 'CAGR';
        if (word.toUpperCase() === 'EMI') return 'EMI';
        if (word.toUpperCase() === 'KYC') return 'KYC';
        if (word.toUpperCase() === 'OCR') return 'OCR';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  const handlePinClick = () => {
    if (!tool) return;
    if (isToolPinned(tool)) {
      unpinTool(tool);
    } else {
      pinTool(tool);
    }
  };

  // Determine dark mode
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div 
      id="global-workspace-status-bar"
      className="fixed bottom-0 inset-x-0 h-9.5 bg-slate-900/95 dark:bg-[#020617]/95 border-t border-slate-800/80 backdrop-blur-md z-[110] flex items-center justify-between px-4 text-[10.5px] font-mono text-slate-400 select-none shadow-[0_-8px_24px_rgba(0,0,0,0.15)] font-sans"
    >
      {/* 1. LEFT: Workspace / Tool Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Navigation History Buttons */}
        <div className="flex items-center gap-1 border-r border-slate-800/70 pr-2.5 mr-0.5">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${canGoBack ? 'text-slate-300' : 'text-slate-600 cursor-not-allowed'}`}
            title="Go Back"
          >
            ◀
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${canGoForward ? 'text-slate-300' : 'text-slate-600 cursor-not-allowed'}`}
            title="Go Forward"
          >
            ▶
          </button>
        </div>

        {/* Current Workspace Icon/Tag */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] uppercase font-black text-slate-500">Workspace</span>
          <span className="text-slate-200 font-extrabold flex items-center gap-1 tracking-tight">
            💼 {getWorkspaceLabel()}
          </span>
        </div>

        <span className="text-slate-600">/</span>

        {/* Current Active Tool + Pin Button */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-slate-300 font-bold truncate">
            {getToolLabel()}
          </span>
          {tool && (
            <button
              onClick={handlePinClick}
              className={`p-0.5 rounded transition-all hover:bg-slate-800 cursor-pointer ${isToolPinned(tool) ? 'text-gold' : 'text-slate-500 hover:text-slate-300'}`}
              title={isToolPinned(tool) ? "Unpin tool from quick access" : "Pin tool to workspace"}
            >
              <Star size={11} fill={isToolPinned(tool) ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>

      {/* 2. MIDDLE: Live Processing Engine */}
      <div className="hidden md:flex items-center gap-4 px-4 max-w-sm lg:max-w-md w-full justify-center">
        {processing.status === 'processing' ? (
          <div className="flex items-center gap-3 w-full bg-slate-950/40 border border-slate-800/50 rounded-full px-3 py-1 select-none animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping shrink-0" />
            <span className="text-slate-300 font-bold truncate max-w-[120px] lg:max-w-[180px]">
              {processing.message || 'Processing...'}
            </span>
            {/* Visual Mini Progress Bar */}
            <div className="flex-grow h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-corporate to-gold dark:from-gold dark:to-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${processing.progress}%` }}
              />
            </div>
            <span className="text-slate-300 font-black shrink-0 font-mono">
              {processing.progress}%
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-extrabold tracking-tight">
              {isOffline ? 'Offline Mode Active' : 'All Systems Operational'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500 font-medium">100% Client-Side Sandbox</span>
          </div>
        )}
      </div>

      {/* 3. RIGHT: Badges & Short-cuts */}
      <div className="flex items-center gap-3.5 shrink-0">
        {/* Offline Badge */}
        {isOffline ? (
          <span className="hidden sm:flex items-center gap-1 text-[9px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest">
            <WifiOff size={10} />
            Offline
          </span>
        ) : (
          <span className="hidden sm:flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 uppercase tracking-widest">
            ● Local Safe
          </span>
        )}

        {/* Privacy Shield */}
        <span className="hidden lg:flex items-center gap-1 text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-800/50">
          🔒 <span className="font-semibold">Privacy Secure</span>
        </span>

        {/* Theme Indicator */}
        <div className="flex items-center gap-1 text-slate-500 bg-slate-800/30 px-1.5 py-0.5 rounded border border-slate-800/40">
          {isDarkMode ? <Moon size={10} className="text-gold" /> : <Sun size={10} className="text-orange-400" />}
          <span className="text-[9px] font-bold uppercase">{isDarkMode ? 'Dark' : 'Light'}</span>
        </div>

        {/* Search Shortcut Hint */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-750 cursor-pointer"
          title="Search Command Palette (Ctrl+K)"
        >
          <Search size={9.5} />
          <kbd className="font-sans text-[9px] font-black uppercase">Ctrl+K</kbd>
        </button>
      </div>
    </div>
  );
};
