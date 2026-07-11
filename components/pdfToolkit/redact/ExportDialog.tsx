import React from 'react';
import { X, ShieldAlert, Download, Loader2 } from 'lucide-react';

interface ExportDialogProps {
  outputName: string;
  setOutputName: (name: string) => void;
  onClose: () => void;
  onSave: () => void;
  redactionCount: number;
}

export default function ExportDialog({
  outputName,
  setOutputName,
  onClose,
  onSave,
  redactionCount,
}: ExportDialogProps) {
  return (
    <div className="fixed inset-0 z-[110] bg-black/60 dark:bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-600 dark:text-red-400" />
            <h3 className="text-sm font-bold text-navy dark:text-white uppercase tracking-wider">Apply Redactions</h3>
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
          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/50 space-y-1.5">
            <h4 className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1">
              <span>Permanence Security Notice</span>
            </h4>
            <p className="text-[10px] text-slate-550 dark:text-slate-400 font-semibold leading-relaxed">
              These redactions are permanent. The pages containing redactions will be converted to high-resolution raster images with solid black boxes baked directly into the pixels. Hidden content or underlying text stream data will be fully destroyed and unextractable.
            </p>
          </div>

          {/* Redaction count details */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Redactions to Apply</span>
            <span className="text-xs font-extrabold text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md">
              {redactionCount} {redactionCount === 1 ? 'box' : 'boxes'}
            </span>
          </div>

          {/* File Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Output File Name</label>
            <input
              type="text"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              placeholder="document_redacted.pdf"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-navy dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 dark:focus:ring-gold transition-all"
            />
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
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Redact & Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
