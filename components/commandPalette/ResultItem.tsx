import React from 'react';
import { SearchItem } from './searchIndex';
import { 
  FileText, 
  Layers, 
  Scissors, 
  Minimize2, 
  Lock, 
  Unlock, 
  Type, 
  RotateCw, 
  FileX, 
  ExternalLink, 
  Languages, 
  Images, 
  FileImage, 
  LayoutGrid, 
  Shield, 
  Calculator, 
  ShieldCheck, 
  TrendingUp, 
  BadgeCheck, 
  Building2, 
  Coins, 
  Cpu,
  CornerDownLeft,
  Compass,
  Bookmark,
  Sparkles,
  Info
} from 'lucide-react';

interface ResultItemProps {
  item: SearchItem;
  isActive: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

// Map tool IDs to corresponding Lucide icons
export const getSearchItemIcon = (id: string, category: string): React.ReactNode => {
  if (id.startsWith('portfolio-')) {
    switch (id) {
      case 'portfolio-home': return <Compass size={16} />;
      case 'portfolio-about': return <Bookmark size={16} />;
      case 'portfolio-experience': return <Building2 size={16} />;
      case 'portfolio-highlights': return <Sparkles size={16} />;
      case 'portfolio-products': return <LayoutGrid size={16} />;
      case 'portfolio-contact': return <ExternalLink size={16} />;
      default: return <Compass size={16} />;
    }
  }

  switch (id) {
    // PDF Toolkit
    case 'pdf-merge': return <Layers size={16} />;
    case 'pdf-split': return <Scissors size={16} />;
    case 'pdf-compress': return <Minimize2 size={16} />;
    case 'pdf-protect': return <Lock size={16} />;
    case 'pdf-unlock': return <Unlock size={16} />;
    case 'pdf-watermark': return <Type size={16} />;
    case 'pdf-rotate': return <RotateCw size={16} />;
    case 'pdf-delete': return <FileX size={16} />;
    case 'pdf-extract': return <ExternalLink size={16} />;
    case 'pdf-ocr': return <Languages size={16} />;
    case 'pdf-pdf2img': return <Images size={16} />;
    case 'pdf-img2pdf': return <FileImage size={16} />;
    case 'pdf-organize': return <LayoutGrid size={16} />;
    case 'pdf-redact': return <Shield size={16} />;

    // Compliance Workspace
    case 'comp-gst-calc': return <Calculator size={16} />;
    case 'comp-gst-verify': return <ShieldCheck size={16} />;
    case 'comp-gst-guide': return <Info size={16} />;
    case 'comp-tax-calc': return <TrendingUp size={16} />;
    case 'comp-roi-calc': return <TrendingUp size={16} />;
    case 'comp-tds-charts': return <BadgeCheck size={16} />;
    case 'comp-salary-tds': return <BadgeCheck size={16} />;
    case 'comp-company-search': return <Building2 size={16} />;
    case 'comp-director-search': return <Building2 size={16} />;
    case 'comp-udyam-search': return <Building2 size={16} />;
    case 'comp-inc-estimator': return <Layers size={16} />;
    case 'comp-inc-docs': return <Layers size={16} />;
    case 'comp-inc-timeline': return <Layers size={16} />;
    case 'comp-takehome': return <FileText size={16} />;
    case 'comp-compound': return <Calculator size={16} />;
    case 'comp-gst-interest': return <Calculator size={16} />;
    case 'comp-emi-calc': return <Calculator size={16} />;
    case 'comp-gst-penalty': return <Shield size={16} />;
    case 'comp-inc-deadlines': return <Shield size={16} />;
    case 'comp-wealth-goals': return <Coins size={16} />;
    case 'comp-demat': return <Coins size={16} />;
    case 'comp-lei-reg': return <Coins size={16} />;
    case 'comp-dev-sandbox': return <LayoutGrid size={16} />;

    // AI
    case 'ai-assistant': return <Cpu size={16} />;
    case 'ai-workspace': return <Cpu size={16} />;

    default: return <FileText size={16} />;
  }
};

export const ResultItem: React.FC<ResultItemProps> = ({ item, isActive, onMouseEnter, onClick }) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`group flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-150 select-none ${
        isActive
          ? 'bg-corporate text-white dark:bg-gold dark:text-navy font-bold shadow-md'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
      }`}
      role="option"
      aria-selected={isActive}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-grow">
        {/* Rounded Icon Box */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
          isActive 
            ? 'bg-white/10 dark:bg-navy/10 text-white dark:text-navy' 
            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover:text-corporate dark:group-hover:text-gold'
        }`}>
          {getSearchItemIcon(item.id, item.category)}
        </div>
        
        {/* Info Column */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-tight truncate">
              {item.title}
            </span>
            <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border shrink-0 font-sans ${
              isActive
                ? 'bg-white/10 text-white dark:bg-navy/10 dark:text-navy border-transparent'
                : 'bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
            }`}>
              {item.category}
            </span>
          </div>
          <p className={`text-[11px] leading-normal truncate mt-0.5 max-w-md ${
            isActive ? 'text-white/80 dark:text-navy/80 font-medium' : 'text-slate-400 dark:text-slate-500 font-medium'
          }`}>
            {item.desc}
          </p>
        </div>
      </div>

      {/* Action Hint (Enter badge or selection indicator) */}
      <div className={`flex items-center gap-1 shrink-0 ml-4 font-sans ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60 transition-opacity'}`}>
        <CornerDownLeft className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold">Enter</span>
      </div>
    </div>
  );
};
