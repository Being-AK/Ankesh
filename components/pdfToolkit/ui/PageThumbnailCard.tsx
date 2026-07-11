import React, { useEffect, useState, useRef } from 'react';
import { Square, CheckSquare, Trash2 } from 'lucide-react';

interface PageThumbnailCardProps {
  pageIndex: number;
  pdfDoc: any;
  isSelected?: boolean;
  onToggle?: (pageIndex: number) => void;
  rotation?: number;
  deleted?: boolean;
  showCheckbox?: boolean;
}

export default function PageThumbnailCard({
  pageIndex,
  pdfDoc,
  isSelected = false,
  onToggle,
  rotation = 0,
  deleted = false,
  showCheckbox = true,
}: PageThumbnailCardProps) {
  const [thumbnail, setThumbnail] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!cardRef.current || !pdfDoc) return;

    // Reset rendering state if pdfDoc changes
    renderedRef.current = false;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !renderedRef.current) {
          renderedRef.current = true;
          observer.disconnect();
          try {
            const page = await pdfDoc.getPage(pageIndex + 1);
            const viewport = page.getViewport({ scale: 0.35 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            if (context) {
              context.fillStyle = '#FFFFFF';
              context.fillRect(0, 0, canvas.width, canvas.height);
              await page.render({ canvasContext: context, viewport }).promise;
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  setThumbnail(url);
                }
                // Free memory immediately
                canvas.width = 0;
                canvas.height = 0;
              }, 'image/jpeg', 0.7);
            }
          } catch (err) {
            console.warn(`Could not render page preview for index ${pageIndex}:`, err);
          }
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(cardRef.current);
    return () => {
      observer.disconnect();
    };
  }, [pdfDoc, pageIndex]);

  // Prevent memory leaks on URL revocations
  useEffect(() => {
    return () => {
      if (thumbnail) {
        URL.revokeObjectURL(thumbnail);
      }
    };
  }, [thumbnail]);

  const handleCardClick = () => {
    if (onToggle) {
      onToggle(pageIndex);
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className={`relative border rounded-xl p-3 flex flex-col items-center justify-between gap-3 cursor-pointer select-none transition-all duration-300 ${
        deleted
          ? 'border-red-200 dark:border-red-900 bg-red-500/5 opacity-55 ring-1 ring-red-500/20'
          : isSelected
          ? 'border-corporate dark:border-gold bg-corporate/5 dark:bg-gold/5 ring-1 ring-corporate/30 dark:ring-gold/30 shadow-sm'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Selection / Status Badging */}
      {showCheckbox && (
        <div className="absolute top-2 left-2 z-10">
          {deleted ? (
            <div className="text-red-500 flex items-center justify-center p-0.5 bg-red-100 dark:bg-red-950/45 rounded shadow-sm">
              <Trash2 size={11} />
            </div>
          ) : isSelected ? (
            <CheckSquare size={14} className="text-corporate dark:text-gold" />
          ) : (
            <Square size={14} className="text-slate-350 dark:text-slate-650" />
          )}
        </div>
      )}

      {/* Page Label */}
      <span className="absolute top-2 right-2.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        P. {pageIndex + 1}
      </span>

      {/* Page Thumbnail Artboard */}
      <div className={`w-20 h-24 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 rounded-lg flex items-center justify-center relative mt-5 overflow-hidden shadow-inner ${deleted ? 'brightness-75' : ''}`}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`Page ${pageIndex + 1}`}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain shadow-sm transition-transform duration-350"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border border-slate-300 border-t-corporate dark:border-t-gold animate-spin" />
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Load</span>
          </div>
        )}
      </div>

      {/* Page text detail footer */}
      <div className="text-center w-full">
        <p className={`text-[10px] font-bold ${deleted ? 'text-slate-450 dark:text-slate-500 line-through' : 'text-slate-750 dark:text-slate-300'}`}>
          Page {pageIndex + 1}
        </p>
        {rotation > 0 && !deleted && (
          <p className="text-[7px] font-bold text-orange-500 uppercase tracking-wider mt-0.5">
            Rotated {rotation}°
          </p>
        )}
      </div>
    </div>
  );
}
