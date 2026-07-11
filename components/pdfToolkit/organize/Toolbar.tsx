import React from 'react';
import {
  Undo2,
  Redo2,
  RotateCw,
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';

interface ToolbarProps {
  zoom: 'small' | 'medium' | 'large';
  setZoom: (z: 'small' | 'medium' | 'large') => void;
  selectedCount: number;
  historyIndex: number;
  historyLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onInvertSelection: () => void;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
}

export default function Toolbar({
  zoom,
  setZoom,
  selectedCount,
  historyIndex,
  historyLength,
  onUndo,
  onRedo,
  onSelectAll,
  onSelectNone,
  onInvertSelection,
  onRotateSelected,
  onDeleteSelected,
}: ToolbarProps) {
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Undo/Redo & Selection Tools */}
      <div className="flex items-center flex-wrap gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={14} />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={onSelectAll}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold transition-colors cursor-pointer"
        >
          <CheckSquare size={12} />
          <span>Select All</span>
        </button>
        <button
          type="button"
          onClick={onSelectNone}
          disabled={selectedCount === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <Square size={12} />
          <span>Deselect</span>
        </button>
        <button
          type="button"
          onClick={onInvertSelection}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          title="Invert selection"
        >
          <RefreshCw size={12} />
          <span>Invert</span>
        </button>
      </div>

      {/* Bulk Operations (Rotate, Delete) & Zoom Controls */}
      <div className="flex items-center justify-between md:justify-end flex-wrap gap-4">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase mr-1">{selectedCount} selected:</span>
            <button
              type="button"
              onClick={onRotateSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200 border border-slate-250 dark:border-slate-750 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="Rotate selected clockwise 90°"
            >
              <RotateCw size={12} />
              <span>Rotate</span>
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/25 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/40 dark:border-red-950/60 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="Delete selected pages"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        )}

        {selectedCount > 0 && <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />}

        {/* Zoom selector */}
        <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setZoom('small')}
            className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
              zoom === 'small'
                ? 'bg-white dark:bg-slate-900 text-navy dark:text-white shadow-sm'
                : 'text-slate-450 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
            }`}
          >
            S
          </button>
          <button
            type="button"
            onClick={() => setZoom('medium')}
            className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
              zoom === 'medium'
                ? 'bg-white dark:bg-slate-900 text-navy dark:text-white shadow-sm'
                : 'text-slate-450 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
            }`}
          >
            M
          </button>
          <button
            type="button"
            onClick={() => setZoom('large')}
            className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
              zoom === 'large'
                ? 'bg-white dark:bg-slate-900 text-navy dark:text-white shadow-sm'
                : 'text-slate-450 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
            }`}
          >
            L
          </button>
        </div>
      </div>
    </div>
  );
}
