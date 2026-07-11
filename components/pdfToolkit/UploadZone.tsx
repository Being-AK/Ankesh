import React, { useRef } from 'react';
import { Upload, FileText, Shield, FileCode } from 'lucide-react';
import { useDragDrop } from './hooks/useDragDrop';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  title?: React.ReactNode;
  description?: string;
  accept?: any;
  maxFiles?: number;
  subtitle?: string;
}

export default function UploadZone({
  onFilesSelected,
  multiple = false,
  title,
  description,
  accept,
  maxFiles,
  subtitle
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { dragActive, handleDrag, handleDrop } = useDragDrop(onFilesSelected);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={typeof title === 'string' ? title : `Upload PDF file${multiple ? 's' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
        dragActive 
          ? 'border-corporate dark:border-gold bg-corporate/5 dark:bg-gold/5 shadow-inner scale-[0.99]' 
          : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/5 hover:border-corporate dark:hover:border-gold hover:bg-slate-50/80 dark:hover:bg-slate-950/15 hover:shadow-md'
      }`}
    >
      {/* Decorative background radial pattern */}
      <div className="absolute inset-0 bg-radial-at-c from-corporate/[0.01] via-transparent to-transparent pointer-events-none" />

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Beautiful Multi-File Schematic Empty State Illustration */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Pulsing Concentric Outer Ring */}
        <div className={`absolute w-20 h-20 rounded-full bg-corporate/5 dark:bg-gold/5 border border-corporate/10 dark:border-gold/10 transition-transform duration-500 ${
          dragActive ? 'scale-125 animate-pulse' : 'group-hover:scale-110'
        }`}></div>
        
        {/* Secondary Pulsing Ring */}
        <div className="absolute w-14 h-14 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center"></div>

        {/* Floating Stacked Documents Decoration */}
        <div className="absolute -left-6 bottom-0 w-8 h-10 bg-slate-100 dark:bg-slate-850 rounded border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center text-slate-400 rotate-[-12deg] group-hover:rotate-[-20deg] transition-all duration-300 shadow-sm opacity-60">
          <FileText size={12} />
        </div>
        <div className="absolute -right-6 bottom-0 w-8 h-10 bg-slate-100 dark:bg-slate-850 rounded border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center text-slate-400 rotate-[12deg] group-hover:rotate-[20deg] transition-all duration-300 shadow-sm opacity-60">
          <FileCode size={12} />
        </div>

        {/* Core Upload Icon Container */}
        <div className="relative w-10 h-10 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center transition-colors group-hover:text-corporate dark:group-hover:text-gold">
          <Upload size={18} className={dragActive ? "animate-bounce" : "group-hover:-translate-y-0.5 transition-transform"} />
        </div>
      </div>
      
      {/* Dynamic Instruction Title */}
      <p className="text-sm font-bold text-navy dark:text-white mb-2 relative z-10">
        {title || (
          <>
            Drag & drop your PDF file{multiple ? 's' : ''} here, or{' '}
            <span className="text-corporate dark:text-gold group-hover:underline">browse files</span>
          </>
        )}
      </p>

      {/* Structured Supported Information */}
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-5 relative z-10">
        {description || subtitle || `Supports on-device processing of ${multiple ? 'multiple' : 'single'} PDF documents.`}
      </p>

      {/* Security & Specification Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/10">
          <Shield size={10} />
          On-Device Only
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-lg border border-slate-200/50 dark:border-slate-800/50">
          PDF up to 100MB
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-corporate/5 text-corporate dark:text-gold text-[10px] font-bold rounded-lg border border-corporate/10 dark:border-gold/10">
          100% Confidential
        </span>
      </div>
    </div>
  );
}
