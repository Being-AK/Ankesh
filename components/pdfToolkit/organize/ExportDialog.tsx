import React from 'react';
import { X, FileText, Download } from 'lucide-react';

interface ExportDialogProps {
  outputName: string;
  setOutputName: (name: string) => void;
  selectedCount: number;
  totalCount: number;
  exportPagesOption: 'all' | 'selected';
  setExportPagesOption: (opt: 'all' | 'selected') => void;
  onClose: () => void;
  onSave: () => void;
}

export default function ExportDialog({
  outputName,
  setOutputName,
  selectedCount,
  totalCount,
  exportPagesOption,
  setExportPagesOption,
  onClose,
  onSave,
}: ExportDialogProps) {
  const hasSelected = selectedCount > 0;

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 dark:bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-corporate dark:text-gold" />
            <h3 className="text-sm font-bold text-navy dark:text-white uppercase tracking-wider">Export PDF Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-left">
          {/* File Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Output File Name</label>
            <input
              type="text"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              placeholder="document_organized.pdf"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-navy dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-corporate dark:focus:ring-gold transition-all"
            />
          </div>

          {/* Export Option */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Export Range</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportPagesOption('all')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  exportPagesOption === 'all'
                    ? 'border-corporate dark:border-gold bg-corporate/5 dark:bg-gold/5'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className={`text-xs font-bold ${exportPagesOption === 'all' ? 'text-corporate dark:text-gold' : 'text-slate-650 dark:text-slate-300'}`}>All Pages</div>
                <div className="text-[9px] text-slate-400 mt-0.5 font-medium">{totalCount} total pages</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (hasSelected) setExportPagesOption('selected');
                }}
                disabled={!hasSelected}
                className={`p-3 rounded-xl border text-center transition-all ${
                  !hasSelected 
                    ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800' 
                    : exportPagesOption === 'selected'
                    ? 'border-corporate dark:border-gold bg-corporate/5 dark:bg-gold/5 cursor-pointer'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer'
                }`}
                title={!hasSelected ? "Select some pages first" : undefined}
              >
                <div className={`text-xs font-bold ${exportPagesOption === 'selected' ? 'text-corporate dark:text-gold' : 'text-slate-650 dark:text-slate-300'}`}>Selected Only</div>
                <div className="text-[9px] text-slate-400 mt-0.5 font-medium">{selectedCount} pages selected</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-corporate hover:bg-corporate/90 dark:bg-gold dark:hover:bg-amber-500 text-white dark:text-navy text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Generate Document</span>
          </button>
        </div>
      </div>
    </div>
  );
}
