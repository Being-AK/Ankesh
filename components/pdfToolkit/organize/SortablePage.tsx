import React, { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RotateCw, Trash2, GripVertical } from 'lucide-react';

interface PageState {
  id: string;
  pageIndex: number;
  rotation: number;
  deleted: boolean;
  thumbnail: string;
  width: number;
  height: number;
  pageSizeName: string;
}

interface SortablePageProps {
  page: PageState;
  isSelected: boolean;
  cardWidthClass: string;
  onSelect: (id: string, event: React.MouseEvent) => void;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  onVisible: (pageIndex: number) => void;
}

export default function SortablePage({
  page,
  isSelected,
  cardWidthClass,
  onSelect,
  onRotate,
  onDelete,
  onVisible,
}: SortablePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const cardRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver to detect when page is visible
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onVisible(page.pageIndex);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' } // Load a bit early before scrolling into view
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [page.pageIndex, onVisible]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  // Combine refs
  const setCombinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    (cardRef as any).current = node;
  };

  return (
    <div
      ref={setCombinedRef}
      style={style}
      className={`relative rounded-2xl border bg-white dark:bg-slate-900 transition-all duration-200 select-none ${cardWidthClass} ${
        isSelected
          ? 'border-corporate ring-2 ring-corporate/20 dark:border-gold dark:ring-gold/20 shadow-lg'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
      }`}
      onClick={(e) => onSelect(page.id, e)}
    >
      {/* Top Bar with Grab Handle & Page Number */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-t-2xl border-b border-slate-100 dark:border-slate-850">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
          title="Drag to rearrange"
        >
          <GripVertical size={12} />
        </div>
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">P. {page.pageIndex + 1}</span>
        <span className="text-[8px] font-bold bg-slate-250 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded uppercase">{page.pageSizeName}</span>
      </div>

      {/* Thumbnail Area */}
      <div className="w-full aspect-[3/4] p-3 flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/20 overflow-hidden relative">
        {page.thumbnail ? (
          <img
            src={page.thumbnail}
            alt={`Page ${page.pageIndex + 1} preview`}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain shadow-sm transition-transform duration-200 bg-white"
            style={{ transform: `rotate(${page.rotation}deg)` }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-corporate dark:border-slate-700 dark:border-t-gold animate-spin" />
            <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Loading</span>
          </div>
        )}
      </div>

      {/* Hover Toolbar Action Buttons */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 p-1.5 bg-slate-50/30 dark:bg-slate-950/10 rounded-b-2xl">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRotate(page.id);
          }}
          className="p-1 text-slate-450 hover:text-corporate dark:hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Rotate 90° clockwise"
        >
          <RotateCw size={12} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(page.id);
          }}
          className="p-1 text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
          title="Delete page"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
