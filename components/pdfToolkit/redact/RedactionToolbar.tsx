import React from 'react';
import {
  MousePointer,
  Square,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Trash2,
  XOctagon,
  Eye,
  EyeOff,
  Download,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface RedactionToolbarProps {
  activeMode: 'pointer' | 'draw' | 'pan';
  setActiveMode: (mode: 'pointer' | 'draw' | 'pan') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onClearPage: () => void;
  onClearAll: () => void;
  isPreviewMode: boolean;
  setIsPreviewMode: (preview: boolean) => void;
  onApply: () => void;
  redactionCount: number;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  zoomPercent: number;
}

export default function RedactionToolbar({
  activeMode,
  setActiveMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  onClearPage,
  onClearAll,
  isPreviewMode,
  setIsPreviewMode,
  onApply,
  redactionCount,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  zoomPercent,
}: RedactionToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm z-10">
      {/* Modes & Undo/Redo */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Pointer / Draw Buttons */}
        <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('pointer')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeMode === 'pointer'
                ? 'bg-white dark:bg-slate-900 text-corporate dark:text-gold shadow-sm'
                : 'text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Pointer Tool: Drag, select, resize, or delete redactions. Click blank space to draw."
            aria-label="Pointer Tool"
          >
            <MousePointer size={13} />
            <span className="hidden sm:inline">Select & Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('draw')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeMode === 'draw'
                ? 'bg-white dark:bg-slate-900 text-corporate dark:text-gold shadow-sm'
                : 'text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Draw Redaction: Force-draw redaction box by clicking and dragging."
            aria-label="Draw Redaction Tool"
          >
            <Square size={13} />
            <span className="hidden sm:inline">Draw Box</span>
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo2 size={13} />
          </button>
        </div>
      </div>

      {/* Navigation & Zoom controls */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Page Nav */}
        <div className="flex items-center bg-slate-50 dark:bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold gap-2 text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPage === 0}
            className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ArrowLeft size={12} />
          </button>
          <span className="min-w-[45px] text-center select-none text-[10px]">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPage === totalPages - 1}
            className="p-1 hover:bg-white dark:hover:bg-slate-900 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Next Page"
            aria-label="Next Page"
          >
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-250 cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="w-11 text-center text-[10px] select-none">{zoomPercent}%</span>
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-250 cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
        </div>

        {/* Fit width & page */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onFitWidth}
            className="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase rounded-xl tracking-wider transition-colors cursor-pointer"
            title="Fit Page Width"
          >
            <Maximize size={12} className="inline mr-1" />
            Fit Width
          </button>
          <button
            type="button"
            onClick={onFitPage}
            className="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase rounded-xl tracking-wider transition-colors cursor-pointer"
            title="Fit Entire Page"
          >
            <Minimize size={12} className="inline mr-1" />
            Fit Page
          </button>
        </div>
      </div>

      {/* Clear ops, Preview Switch & Apply Action */}
      <div className="flex items-center flex-wrap justify-between lg:justify-end gap-3 border-t lg:border-t-0 border-slate-100 dark:border-slate-850 pt-3 lg:pt-0">
        {/* Clears */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onClearPage}
            className="p-2 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/15 dark:hover:bg-rose-950/25 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/50 text-[10px] font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            title="Clear all redactions on active page"
          >
            <Trash2 size={12} />
            <span className="hidden sm:inline">Clear Page</span>
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="p-2 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/15 dark:hover:bg-rose-950/25 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/50 text-[10px] font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            title="Clear absolutely all redactions in document"
          >
            <XOctagon size={12} />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Preview Switch */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider font-extrabold rounded-xl border transition-all cursor-pointer ${
                isPreviewMode
                  ? 'bg-navy dark:bg-gold text-white dark:text-navy border-navy dark:border-gold shadow-sm'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700'
              }`}
            >
              {isPreviewMode ? <EyeOff size={11} /> : <Eye size={11} />}
              <span>{isPreviewMode ? 'Previewing' : 'Edit Mode'}</span>
            </button>
          </label>
        </div>

        {/* Apply/Save Action button */}
        <button
          type="button"
          onClick={onApply}
          disabled={redactionCount === 0}
          className="bg-corporate hover:bg-corporate/95 dark:bg-gold dark:hover:bg-amber-500 text-white dark:text-navy font-bold py-2 px-4 rounded-xl text-xs transition-all duration-300 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none outline-none focus:ring-1 focus:ring-corporate/50"
        >
          <CheckCircle size={13} />
          <span>Apply Redactions ({redactionCount})</span>
        </button>
      </div>
    </div>
  );
}
