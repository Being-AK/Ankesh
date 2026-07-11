import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileText, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  GripVertical, 
  MoreVertical, 
  ArrowUpToLine, 
  ArrowDownToLine,
  RotateCw,
  Plus,
  ArrowUpDown,
  X,
  Loader2,
  Info,
  ChevronDown,
  LayoutGrid,
  FileSpreadsheet
} from 'lucide-react';
import { formatFileSize } from '../utils/fileHelpers';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FileListProps {
  pdfFiles: File[];
  onRemove: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onClearAll?: () => void;
  showIndexBadge?: boolean;
  titleText?: string;
  tipText?: string;
  onReorder?: (newFiles: File[]) => void;
  onAddFiles?: (files: File[]) => void;
}

// Module-level cache to persist generated thumbnail urls and page counts across re-renders/re-ordering
const previewCache = new Map<string, { url: string; pageCount: number; isLocked: boolean }>();
const fileIds = new WeakMap<File, string>();

function getFileId(file: File): string {
  let id = fileIds.get(file);
  if (!id) {
    id = `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).substring(2, 9)}`;
    fileIds.set(file, id);
  }
  return id;
}

export function getFileCacheKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

// Global script loader for PDF.js to prevent duplicate script mounting
let pdfjsPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) {
    return Promise.resolve((window as any).pdfjsLib);
  }
  if (pdfjsPromise) {
    return pdfjsPromise;
  }
  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        resolve(pdfjsLib);
      } else {
        reject(new Error('PDF.js not found in window object.'));
      }
    };
    script.onerror = () => {
      pdfjsPromise = null;
      reject(new Error('Failed to load local PDF.js engine.'));
    };
    document.head.appendChild(script);
  });
  return pdfjsPromise;
}

interface SortableFileItemProps {
  id: string;
  file: File;
  index: number;
  pdfFiles: File[];
  showIndexBadge: boolean;
  rotation: number;
  onRotate: () => void;
  onRemove: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  moveToTop: (index: number) => void;
  moveToBottom: (index: number) => void;
  onPageCountLoaded: (key: string, count: number) => void;
}

function SortableFileItem({
  id,
  file,
  index,
  pdfFiles,
  showIndexBadge,
  rotation,
  onRotate,
  onRemove,
  onMoveUp,
  onMoveDown,
  moveToTop,
  moveToBottom,
  onPageCountLoaded,
}: SortableFileItemProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fileKey = getFileCacheKey(file);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Load thumbnail and page count
  useEffect(() => {
    let active = true;

    const loadPreview = async () => {
      // Check cache first
      const cached = previewCache.get(fileKey);
      if (cached) {
        if (active) {
          setThumbnailUrl(cached.url);
          setPageCount(cached.pageCount);
          setIsLocked(cached.isLocked);
          setIsLoading(false);
          onPageCountLoaded(fileKey, cached.pageCount);
        }
        return;
      }

      try {
        setIsLoading(true);
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        
        let doc;
        try {
          doc = await loadingTask.promise;
        } catch (err: any) {
          if (err.name === 'PasswordException' || err.message?.toLowerCase().includes('password') || err.message?.toLowerCase().includes('decrypt')) {
            if (active) {
              setIsLocked(true);
              setPageCount(1);
              setIsLoading(false);
              previewCache.set(fileKey, { url: '', pageCount: 1, isLocked: true });
              onPageCountLoaded(fileKey, 1);
            }
            return;
          }
          throw err;
        }

        const count = doc.numPages;
        if (active) {
          setPageCount(count);
          onPageCountLoaded(fileKey, count);
        }

        // Render first page as thumbnail
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 0.85 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: context, viewport }).promise;

          canvas.toBlob((blob) => {
            canvas.width = 0;
            canvas.height = 0;

            if (!active) return;
            if (blob) {
              const url = URL.createObjectURL(blob);
              setThumbnailUrl(url);
              setIsLoading(false);
              previewCache.set(fileKey, { url, pageCount: count, isLocked: false });
            } else {
              setIsLoading(false);
              previewCache.set(fileKey, { url: '', pageCount: count, isLocked: false });
            }
          }, 'image/jpeg', 0.85);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.warn(`Could not render thumbnail preview for ${file.name}:`, err);
        if (active) {
          setIsLoading(false);
          setPageCount(1);
          onPageCountLoaded(fileKey, 1);
        }
      }
    };

    loadPreview();

    return () => {
      active = false;
    };
  }, [file, fileKey]);

  // Click outside listener for the 3-dots menu
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-between gap-2.5 text-center cursor-grab active:cursor-grabbing group select-none transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-corporate/40 dark:hover:border-gold/40 h-[340px] w-full ${
        isDragging ? 'shadow-2xl border-corporate dark:border-gold scale-[1.03]' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      {/* Index Badge */}
      {showIndexBadge && (
        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-slate-950/85 text-white font-bold text-[9px] rounded-md border border-slate-800 shadow z-20 flex items-center justify-center min-w-[18px]">
          {index + 1}
        </span>
      )}

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-50 dark:bg-rose-950/80 border border-rose-100 dark:border-rose-900/40 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 duration-200 cursor-pointer shadow-sm z-20"
        title="Remove file"
      >
        <X size={11} className="stroke-[2.5px]" />
      </button>

      {/* Thumbnail Container */}
      <div className="w-full h-[210px] bg-slate-50 dark:bg-slate-950/30 rounded-lg border border-slate-100 dark:border-slate-800/80 flex items-center justify-center overflow-hidden relative shadow-inner mt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-slate-500">
            <Loader2 size={18} className="animate-spin text-corporate dark:text-gold" />
            <span className="text-[9px] font-semibold">Generating...</span>
          </div>
        ) : isLocked ? (
          <div className="flex flex-col items-center justify-center text-amber-500 gap-1 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span className="text-[9px] font-extrabold uppercase tracking-wide">Locked PDF</span>
          </div>
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={file.name}
            referrerPolicy="no-referrer"
            className="h-full w-auto object-contain transition-transform duration-300 shadow-sm"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-rose-500 gap-1 animate-fade-in">
            <FileText size={28} />
            <span className="text-[9px] font-extrabold uppercase tracking-wide">PDF</span>
          </div>
        )}
      </div>

      {/* Meta Information */}
      <div className="w-full min-w-0 px-0.5">
        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center justify-center gap-1 mt-0.5">
          <span>{pageCount !== null ? `${pageCount} page${pageCount > 1 ? 's' : ''}` : '...'}</span>
          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800"></span>
          <span>{formatFileSize(file.size)}</span>
        </p>
      </div>

      {/* Bottom Actions Row */}
      <div className="w-full flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-0.5 gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRotate();
          }}
          className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-corporate dark:hover:text-gold hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer"
          title="Rotate 90° Clockwise"
        >
          <RotateCw size={12} />
        </button>

        {/* Quick Reorder Drag Handle visual indicator */}
        <div className="p-1 text-slate-300 dark:text-slate-700 hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors" title="Drag to reorder">
          <GripVertical size={12} />
        </div>

        {/* 3-dots Menu trigger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer"
            title="More Actions"
          >
            <MoreVertical size={12} />
          </button>

          {showMenu && (
            <div className="absolute bottom-full right-0 mb-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 min-w-[130px] text-[10px] font-bold text-slate-700 dark:text-slate-300 flex flex-col align-start animate-scale-in">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveToTop(index);
                  setShowMenu(false);
                }}
                disabled={index === 0}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ArrowUpToLine size={11} className="text-slate-400" />
                <span>Move to Top</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMoveUp) onMoveUp(index);
                  setShowMenu(false);
                }}
                disabled={index === 0}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ArrowUp size={11} className="text-slate-400" />
                <span>Move Up</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMoveDown) onMoveDown(index);
                  setShowMenu(false);
                }}
                disabled={index === pdfFiles.length - 1}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ArrowDown size={11} className="text-slate-400" />
                <span>Move Down</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveToBottom(index);
                  setShowMenu(false);
                }}
                disabled={index === pdfFiles.length - 1}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ArrowDownToLine size={11} className="text-slate-400" />
                <span>Move to Bottom</span>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={11} />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FileList({
  pdfFiles,
  onRemove,
  onMoveUp,
  onMoveDown,
  onClearAll,
  showIndexBadge = false,
  titleText = "Selected Files",
  tipText,
  onReorder,
  onAddFiles
}: FileListProps) {
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({});
  const [rotations, setRotations] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maintain page count updates from children
  const handlePageCountLoaded = (fileKey: string, count: number) => {
    setPageCounts((prev) => {
      if (prev[fileKey] === count) return prev;
      return { ...prev, [fileKey]: count };
    });
  };

  const handleRotate = (fileKey: string) => {
    setRotations((prev) => {
      const current = prev[fileKey] || 0;
      return { ...prev, [fileKey]: (current + 90) % 360 };
    });
  };

  // Drag and Drop configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Drag starts only after dragging 8px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pdfFiles.findIndex((file) => getFileId(file) === active.id);
      const newIndex = pdfFiles.findIndex((file) => getFileId(file) === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(pdfFiles, oldIndex, newIndex);
        if (onReorder) {
          onReorder(reordered);
        }
      }
    }
  };

  // Reorder commands
  const moveToTop = (index: number) => {
    if (index === 0) return;
    const item = pdfFiles[index];
    const reordered = [item, ...pdfFiles.filter((_, i) => i !== index)];
    onReorder?.(reordered);
  };

  const moveToBottom = (index: number) => {
    if (index === pdfFiles.length - 1) return;
    const item = pdfFiles[index];
    const reordered = [...pdfFiles.filter((_, i) => i !== index), item];
    onReorder?.(reordered);
  };

  // Sorting handlers
  const sortAlphabetically = () => {
    const sorted = [...pdfFiles].sort((a, b) => a.name.localeCompare(b.name));
    onReorder?.(sorted);
  };

  const reverseOrder = () => {
    const reversed = [...pdfFiles].reverse();
    onReorder?.(reversed);
  };

  const handleAddFilesClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0 && onAddFiles) {
      onAddFiles(Array.from(selectedFiles));
    }
    // Reset file input value to allow uploading same files again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (pdfFiles.length === 0) return null;

  // Calculate live statistics
  const totalFiles = pdfFiles.length;
  const totalSize = pdfFiles.reduce((sum, file) => sum + file.size, 0);
  const totalPages = pdfFiles.reduce((sum, file) => {
    const key = getFileCacheKey(file);
    return sum + (pageCounts[key] || 1); // fallback to 1 page
  }, 0);

  return (
    <div className="space-y-4">
      {/* Hidden file input for adding more files */}
      {onAddFiles && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="application/pdf"
          className="hidden"
        />
      )}

      {/* Toolbar & Live Statistics */}
      <div className="flex flex-col gap-3.5 bg-slate-50/50 dark:bg-slate-950/10 p-4 border border-slate-100 dark:border-slate-800 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Header & Title */}
          <div>
            <h4 className="text-[11px] font-black text-navy dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid size={13} className="text-corporate dark:text-gold" />
              <span>{titleText}</span>
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
              Drag cards to re-arrange or sort alphabetically.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {onAddFiles && (
              <button
                onClick={handleAddFilesClick}
                className="px-3 py-1.5 rounded-xl bg-corporate text-white hover:bg-corporate-deep dark:bg-gold dark:text-slate-950 dark:hover:bg-gold-light text-[10px] font-extrabold flex items-center gap-1 shadow-sm transition-all cursor-pointer hover:shadow"
              >
                <Plus size={11} className="stroke-[2.5px]" />
                <span>Add PDFs</span>
              </button>
            )}

            {onReorder && pdfFiles.length > 1 && (
              <>
                <button
                  onClick={sortAlphabetically}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-950 text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  title="Sort alphabetically"
                >
                  <ArrowUpDown size={11} />
                  <span>A-Z</span>
                </button>
                <button
                  onClick={reverseOrder}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-950 text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                  title="Reverse current file arrangement"
                >
                  <span>Reverse</span>
                </button>
              </>
            )}

            {onClearAll && (
              <button
                onClick={onClearAll}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 text-rose-500 text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Trash2 size={11} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850/80 rounded-2xl py-2 px-3 shadow-inner">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Files</span>
            <span className="text-xs font-black text-slate-800 dark:text-white">{totalFiles}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Pages</span>
            <span className="text-xs font-black text-slate-800 dark:text-white">{totalPages}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Size</span>
            <span className="text-xs font-black text-slate-800 dark:text-white">{formatFileSize(totalSize)}</span>
          </div>
        </div>
      </div>

      {/* Grid Workspace Wrapper */}
      <div className="border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 bg-slate-50/20 dark:bg-slate-950/5 max-h-[58vh] overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pdfFiles.map((file) => getFileId(file))}
            strategy={rectSortingStrategy}
          >
            {/* The responsive grid matching user's spec:
                - Desktop (xl, lg): 5 to 6 cards.
                - Tablet (md, sm): 3 to 4 cards.
                - Mobile (default): 2 cards.
            */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {pdfFiles.map((file, index) => {
                const id = getFileId(file);
                const fileKey = getFileCacheKey(file);
                return (
                  <SortableFileItem
                    key={id}
                    id={id}
                    file={file}
                    index={index}
                    pdfFiles={pdfFiles}
                    showIndexBadge={showIndexBadge}
                    rotation={rotations[fileKey] || 0}
                    onRotate={() => handleRotate(fileKey)}
                    onRemove={onRemove}
                    onMoveUp={onMoveUp ? () => onMoveUp(index) : undefined}
                    onMoveDown={onMoveDown ? () => onMoveDown(index) : undefined}
                    moveToTop={moveToTop}
                    moveToBottom={moveToBottom}
                    onPageCountLoaded={handlePageCountLoaded}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {tipText && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center font-semibold">
          {tipText}
        </p>
      )}
    </div>
  );
}
