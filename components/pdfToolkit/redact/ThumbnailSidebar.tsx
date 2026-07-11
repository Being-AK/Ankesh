import React, { useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';

interface ThumbnailSidebarProps {
  totalPages: number;
  currentPageIndex: number;
  onPageSelect: (index: number) => void;
  thumbnails: { [key: number]: string };
  onRenderThumbnail: (index: number) => void;
  redactionsCountByPage: { [key: number]: number };
}

export default function ThumbnailSidebar({
  totalPages,
  currentPageIndex,
  onPageSelect,
  thumbnails,
  onRenderThumbnail,
  redactionsCountByPage,
}: ThumbnailSidebarProps) {
  return (
    <div className="w-56 bg-slate-50 dark:bg-slate-950/40 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full select-none overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
        <h4 className="text-[10px] font-black text-navy dark:text-white uppercase tracking-wider">Pages ({totalPages})</h4>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sidebar</span>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
        {Array.from({ length: totalPages }).map((_, idx) => {
          const isCurrent = idx === currentPageIndex;
          const thumbnailSrc = thumbnails[idx];
          const hasRedactions = redactionsCountByPage[idx] > 0;
          const redCount = redactionsCountByPage[idx] || 0;

          return (
            <SidebarItem
              key={idx}
              index={idx}
              isCurrent={isCurrent}
              thumbnailSrc={thumbnailSrc}
              hasRedactions={hasRedactions}
              redactionCount={redCount}
              onSelect={() => onPageSelect(idx)}
              onVisible={() => onRenderThumbnail(idx)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface SidebarItemProps {
  index: number;
  isCurrent: boolean;
  thumbnailSrc: string | undefined;
  hasRedactions: boolean;
  redactionCount: number;
  onSelect: () => void;
  onVisible: () => void;
}

function SidebarItem({
  index,
  isCurrent,
  thumbnailSrc,
  hasRedactions,
  redactionCount,
  onSelect,
  onVisible,
}: SidebarItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  // Lazy render when item scrolls into view
  useEffect(() => {
    if (!itemRef.current || thumbnailSrc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onVisible();
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' }
    );

    observer.observe(itemRef.current);
    return () => observer.disconnect();
  }, [index, onVisible, thumbnailSrc]);

  return (
    <div
      ref={itemRef}
      onClick={onSelect}
      className={`relative group cursor-pointer p-2.5 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
        isCurrent
          ? 'bg-white dark:bg-slate-900 border-corporate dark:border-gold shadow-md ring-1 ring-corporate/20 dark:ring-gold/20'
          : 'bg-white/50 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 shadow-sm'
      }`}
    >
      {/* Page Number Indicator */}
      <div className="absolute top-1.5 left-1.5 text-[8px] font-black text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
        P. {index + 1}
      </div>

      {/* Redactions Indicator Badge */}
      {hasRedactions && (
        <div className="absolute top-1.5 right-1.5 bg-red-500 text-white font-black text-[7px] px-1.5 py-0.5 rounded-full shadow-sm">
          {redactionCount}
        </div>
      )}

      {/* Preview Box */}
      <div className="w-24 aspect-[3/4] bg-slate-50 dark:bg-slate-950/60 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-850 flex items-center justify-center relative mt-2 shadow-inner">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-slate-300 dark:text-slate-800">
            <FileText size={20} className="animate-pulse" />
            <span className="text-[7px] font-bold uppercase tracking-widest">LOADING</span>
          </div>
        )}
      </div>

      <div className="text-[9px] font-bold text-slate-450 dark:text-slate-500">
        Page {index + 1}
      </div>
    </div>
  );
}
