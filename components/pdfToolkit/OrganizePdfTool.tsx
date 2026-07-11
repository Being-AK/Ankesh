import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { 
  LayoutGrid, 
  Download, 
  Loader2, 
  AlertTriangle,
} from 'lucide-react';
import UploadZone from './UploadZone';
import { usePdfDownload } from './hooks/usePdfDownload';
import { validatePdfFile } from './utils/validation';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import LoadingOverlay from './ui/LoadingOverlay';

// Import newly refactored sub-components
import SortablePage from './organize/SortablePage';
import Toolbar from './organize/Toolbar';
import ExportDialog from './organize/ExportDialog';

interface OrganizePdfToolProps {
  onClose: () => void;
}

interface PageState {
  id: string;
  pageIndex: number; // 0-based page number from original file
  rotation: number;   // 0, 90, 180, 270 degrees
  deleted: boolean;
  thumbnail: string;  // Object URL for the preview image
  width: number;
  height: number;
  pageSizeName: string;
}

// Maps dimensions in points to standard page size names
const getPageSizeName = (w: number, h: number): string => {
  const width = Math.round(Math.min(w, h));
  const height = Math.round(Math.max(w, h));
  
  if (Math.abs(width - 595) < 10 && Math.abs(height - 842) < 10) return 'A4';
  if (Math.abs(width - 612) < 10 && Math.abs(height - 792) < 10) return 'Letter';
  if (Math.abs(width - 612) < 10 && Math.abs(height - 1008) < 10) return 'Legal';
  if (Math.abs(width - 501) < 10 && Math.abs(height - 709) < 10) return 'B5';
  if (Math.abs(width - 420) < 10 && Math.abs(height - 595) < 10) return 'A5';
  
  return `${Math.round(w / 72 * 25.4)}x${Math.round(h / 72 * 25.4)}mm`;
};

export default function OrganizePdfTool({ onClose }: OrganizePdfToolProps) {
  // Files & Library states
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null); // pdf.js doc object
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  // Undo/Redo Stacks
  const [history, setHistory] = useState<PageState[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Display/HUD UI settings
  const [zoom, setZoom] = useState<'small' | 'medium' | 'large'>('medium');
  const [libLoading, setLibLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Compile Export Modal state
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);
  const [outputName, setOutputName] = useState<string>('organized_document.pdf');
  const [exportPagesOption, setExportPagesOption] = useState<'all' | 'selected'>('all');

  // Errors & Warnings
  const [validationError, setValidationError] = useState<string | null>(null);

  const activeUrlsRef = useRef<Set<string>>(new Set());
  const renderedIndicesRef = useRef<Set<number>>(new Set());

  const {
    downloading: processing,
    error: downloadError,
    success: compileSuccess,
    setError: setCompileError,
    executeDownload,
    clearDownloadStates,
  } = usePdfDownload();

  const error = downloadError || validationError;

  // Track Object URLs for cleanup
  const trackUrl = useCallback((url: string) => {
    activeUrlsRef.current.add(url);
  }, []);

  const cleanupAllUrls = useCallback(() => {
    activeUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    });
    activeUrlsRef.current.clear();
  }, []);

  // Cleanup Object URLs on unmount
  useEffect(() => {
    return () => {
      cleanupAllUrls();
    };
  }, [cleanupAllUrls]);

  // Sync active drag item state
  const activeDragPage = useMemo(() => {
    return pages.find((p) => p.id === activeId) || null;
  }, [pages, activeId]);

  // Load PDF.js dynamically
  const loadPdfJsLibrary = (): Promise<any> => {
    if ((window as any).pdfjsLib) {
      return Promise.resolve((window as any).pdfjsLib);
    }
    setLibLoading(true);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/pdf.min.js';
      script.async = true;
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          setLibLoading(false);
          resolve(pdfjsLib);
        } else {
          setLibLoading(false);
          reject(new Error('PDF.js script loaded but libraries were not found in window object.'));
        }
      };
      script.onerror = () => {
        setLibLoading(false);
        reject(new Error('Failed to load local PDF.js engine. Please verify files are present.'));
      };
      document.head.appendChild(script);
    });
  };

  // Push State to History Stack for Undo/Redo
  const pushToHistory = (newPages: PageState[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newPages))); // Deep copy
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setPages(JSON.parse(JSON.stringify(history[nextIndex])));
      setSelectedIds(new Set());
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setPages(JSON.parse(JSON.stringify(history[nextIndex])));
      setSelectedIds(new Set());
    }
  };

  // Keyboard Shortcuts (Delete, Ctrl+Z, Ctrl+Y, Ctrl+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showExportDialog || processing) return;

      const isCtrlCmd = e.ctrlKey || e.metaKey;
      
      // Select All (Ctrl+A)
      if (isCtrlCmd && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const allIds = new Set(pages.map(p => p.id));
        setSelectedIds(allIds);
      }
      
      // Undo (Ctrl+Z)
      if (isCtrlCmd && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      
      // Redo (Ctrl+Y)
      if (isCtrlCmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }

      // Delete (Delete / Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages, selectedIds, historyIndex, history, showExportDialog, processing]);

  // Load PDF structure and scan pages metadata (takes ~50ms)
  const handleFileChange = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];

    const validation = validatePdfFile(selectedFile);
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    setValidationError(null);
    setFile(selectedFile);
    clearDownloadStates();
    setIsScanning(true);
    setScanProgress(0);
    cleanupAllUrls();
    renderedIndicesRef.current.clear();
    setSelectedIds(new Set());
    setLastClickedId(null);
    setHistory([]);
    setHistoryIndex(-1);

    const baseName = selectedFile.name.replace(/\.pdf$/i, '');
    setOutputName(`${baseName}_organized.pdf`);

    try {
      const pdfjs = await loadPdfJsLibrary();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);

      const initialPages: PageState[] = [];
      
      // Sequentially load page sizes only (Metadata check is fast)
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const { width, height } = page.getViewport({ scale: 1 });
        const sizeName = getPageSizeName(width, height);
        
        initialPages.push({
          id: `page-${i}`,
          pageIndex: i - 1,
          rotation: 0,
          deleted: false,
          thumbnail: '',
          width,
          height,
          pageSizeName: sizeName
        });
      }

      setPages(initialPages);
      setHistory([JSON.parse(JSON.stringify(initialPages))]);
      setHistoryIndex(0);
      setIsScanning(false);

    } catch (err: any) {
      console.error('Error loading PDF structure:', err);
      setValidationError('Failed to parse the PDF document. It may be password-secured or corrupted.');
      setFile(null);
      setIsScanning(false);
    }
  };

  // Lazy Render Page Preview Thumbnail only when visible in viewport
  const renderThumbnailForPage = useCallback(async (pageIndex: number) => {
    if (!pdfDoc || renderedIndicesRef.current.has(pageIndex)) return;
    renderedIndicesRef.current.add(pageIndex);

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

        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              trackUrl(url);
              
              setPages((prev) => 
                prev.map((p) => p.pageIndex === pageIndex ? { ...p, thumbnail: url } : p)
              );
            }
            canvas.width = 0;
            canvas.height = 0;
            resolve();
          }, 'image/jpeg', 0.7);
        });
      }
    } catch (e) {
      console.warn(`Could not render thumbnail for page index ${pageIndex}:`, e);
    }
  }, [pdfDoc, trackUrl]);

  // --- SELECTION LOGIC (Ctrl+Click, Shift+Click, Normal Click) ---
  const handlePageSelect = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    if (isShift && lastClickedId !== null) {
      const idx1 = pages.findIndex(p => p.id === lastClickedId);
      const idx2 = pages.findIndex(p => p.id === id);
      const start = Math.min(idx1, idx2);
      const end = Math.max(idx1, idx2);
      
      const newSelected = new Set(selectedIds);
      for (let i = start; i <= end; i++) {
        newSelected.add(pages[i].id);
      }
      setSelectedIds(newSelected);
    } else if (isCtrl) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
      setLastClickedId(id);
    } else {
      // Normal click: select target, clear others
      setSelectedIds(new Set([id]));
      setLastClickedId(id);
    }
  };

  // --- INDIVIDUAL CARD ACTIONS ---
  const handleRotatePage = (id: string) => {
    const updated = pages.map(p => 
      p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    );
    setPages(updated);
    pushToHistory(updated);
  };

  const handleDeletePage = (id: string) => {
    const updated = pages.filter(p => p.id !== id);
    setPages(updated);
    setSelectedIds(new Set());
    pushToHistory(updated);
  };

  // --- BULK OPERATIONS ---
  const handleRotateSelected = () => {
    if (selectedIds.size === 0) return;
    const updated = pages.map(p => 
      selectedIds.has(p.id) ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    );
    setPages(updated);
    pushToHistory(updated);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const updated = pages.filter(p => !selectedIds.has(p.id));
    setPages(updated);
    setSelectedIds(new Set());
    pushToHistory(updated);
  };

  const handleSelectAll = () => {
    const all = new Set(pages.map(p => p.id));
    setSelectedIds(all);
  };

  const handleSelectNone = () => {
    setSelectedIds(new Set());
  };

  const handleInvertSelection = () => {
    const inverted = new Set<string>();
    pages.forEach(p => {
      if (!selectedIds.has(p.id)) inverted.add(p.id);
    });
    setSelectedIds(inverted);
  };

  // --- DND-KIT IMPLEMENTATION ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Buffer prevents accidental dragging when clicking
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Touch delay constraint to support scrolling on mobile
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);

    const updated = arrayMove(pages, oldIndex, newIndex);
    setPages(updated);
    pushToHistory(updated);
  };

  const getZoomClass = () => {
    switch (zoom) {
      case 'small': return 'w-[120px]';
      case 'large': return 'w-[200px]';
      default: return 'w-[160px]'; // medium
    }
  };

  // --- EXPORT PDF GENERATION ---
  const handleCompilePdf = async () => {
    if (!file || pages.length === 0) return;
    setShowExportDialog(false);

    await executeDownload(async () => {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const srcArrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(srcArrayBuffer);
      const destDoc = await PDFDocument.create();

      const pagesToCompile = exportPagesOption === 'selected' && selectedIds.size > 0
        ? pages.filter(p => selectedIds.has(p.id))
        : pages;

      for (const pageState of pagesToCompile) {
        const [copiedPage] = await destDoc.copyPages(srcDoc, [pageState.pageIndex]);
        
        const origRotObj = copiedPage.getRotation();
        const origAngle = origRotObj ? origRotObj.angle : 0;
        const finalAngle = (origAngle + pageState.rotation) % 360;
        copiedPage.setRotation(degrees(finalAngle));

        destDoc.addPage(copiedPage);
      }

      const pdfBytes = await destDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    }, outputName);
  };

  const handleClose = () => {
    cleanupAllUrls();
    setFile(null);
    setPdfDoc(null);
    setTotalPages(null);
    setPages([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-4 animate-scale-in outline-none">
        
        {/* Workspace Header */}
        <WorkspaceHeader
          title="Organize PDF Workspace"
          subtitle="Interactive spatial arranger: Drag-and-drop pages to sort, rotate individual nodes, delete items, and rebuild documents locally."
          icon={<LayoutGrid size={18} />}
          onClose={handleClose}
        />

        {/* Workspace Body */}
        <div className="p-5 overflow-y-auto flex-grow space-y-5 relative min-h-[350px] bg-slate-50/50 dark:bg-slate-950/15">
          {libLoading && (
            <LoadingOverlay message="Initializing high-performance PDF renderer..." />
          )}

          {isScanning && (
            <div className="absolute inset-0 z-40 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-[3px] flex items-center justify-center">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3.5 max-w-xs w-full text-center">
                <Loader2 size={32} className="animate-spin text-corporate dark:text-gold" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-navy dark:text-white">Mapping PDF structure...</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">Page thumbnails indexing</p>
                </div>
              </div>
            </div>
          )}

          {!file ? (
            <UploadZone
              onFilesSelected={handleFileChange}
              multiple={false}
              title={
                <>
                  Drag & drop your PDF file here, or <span className="text-corporate dark:text-gold hover:underline">browse files</span>
                </>
              }
              description="Requires exactly one valid PDF document. Visual cards render automatically."
            />
          ) : (
            <div className="flex flex-col h-full gap-4 pb-20">
              
              {/* Dynamic Operations Toolbar */}
              <Toolbar
                zoom={zoom}
                setZoom={setZoom}
                selectedCount={selectedIds.size}
                historyIndex={historyIndex}
                historyLength={history.length}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onSelectAll={handleSelectAll}
                onSelectNone={handleSelectNone}
                onInvertSelection={handleInvertSelection}
                onRotateSelected={handleRotateSelected}
                onDeleteSelected={handleDeleteSelected}
              />

              {/* DND grid area */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pages.map((p) => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <div 
                    className="flex-grow overflow-y-auto min-h-[250px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"
                    role="grid"
                    aria-label="Pages layout grid"
                  >
                    {pages.length === 0 ? (
                      <div className="h-full min-h-[250px] flex flex-col items-center justify-center gap-2 p-6 text-center select-none">
                        <AlertTriangle size={32} className="text-amber-500" />
                        <h4 className="text-sm font-bold text-navy dark:text-white">All pages removed</h4>
                        <p className="text-xs text-slate-400 max-w-xs">You have deleted all pages from this document. Click undo or reload a file to restart.</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-4 items-start justify-center sm:justify-start p-4">
                        {pages.map((page) => (
                          <SortablePage
                            key={page.id}
                            page={page}
                            isSelected={selectedIds.has(page.id)}
                            cardWidthClass={getZoomClass()}
                            onSelect={handlePageSelect}
                            onRotate={handleRotatePage}
                            onDelete={handleDeletePage}
                            onVisible={renderThumbnailForPage}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </SortableContext>

                {/* Drag Overlay for smooth lifted effect */}
                <DragOverlay>
                  {activeId && activeDragPage ? (
                    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-corporate dark:border-gold p-2.5 flex flex-col items-center gap-2 shadow-2xl opacity-80 scale-105 pointer-events-none select-none ${getZoomClass()}`}>
                      <div className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-slate-850">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">P. {activeDragPage.pageIndex + 1}</span>
                        <span className="text-[8px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded uppercase">{activeDragPage.pageSizeName}</span>
                      </div>
                      <div className="w-full aspect-[3/4] bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-100">
                        {activeDragPage.thumbnail && (
                          <img
                            src={activeDragPage.thumbnail}
                            alt=""
                            className="w-full h-full object-contain"
                            style={{ transform: `rotate(${activeDragPage.rotation}deg)` }}
                          />
                        )}
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
              <AlertBanner type="error" message={error} />
            </div>
          )}

          {/* Compiling / Building Overlay */}
          {processing && (
            <LoadingOverlay message="Rebuilding PDF container bytes..." />
          )}

        </div>

        {/* Sticky Bottom Bar */}
        {file && !isScanning && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-black leading-none">Active Inventory</span>
                <span className="text-xs font-bold text-navy dark:text-white mt-1">
                  {pages.length} Pages total | {selectedIds.size} Selected
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-600 dark:text-slate-200 border border-slate-250 dark:border-slate-800 font-bold py-2.5 px-5 rounded-2xl text-xs transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-corporate/50"
                onClick={() => handleFileChange([file])} // Reload resets everything
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setShowExportDialog(true)}
                disabled={pages.length === 0 || processing}
                className="bg-corporate hover:bg-corporate/90 dark:bg-gold dark:hover:bg-amber-500 text-white dark:text-navy font-bold py-2.5 px-6 rounded-2xl text-xs transition-all duration-300 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none outline-none focus:ring-1 focus:ring-corporate/50"
              >
                <Download size={13} />
                Organize PDF
              </button>
            </div>
          </div>
        )}

      </div>

      {/* --- EXPORT SETTINGS DIALOG (MODAL OVERLAY) --- */}
      {showExportDialog && (
        <ExportDialog
          outputName={outputName}
          setOutputName={setOutputName}
          selectedCount={selectedIds.size}
          totalCount={pages.length}
          exportPagesOption={exportPagesOption}
          setExportPagesOption={setExportPagesOption}
          onClose={() => setShowExportDialog(false)}
          onSave={handleCompilePdf}
        />
      )}

    </div>
  );
}
