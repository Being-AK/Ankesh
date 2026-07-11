import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import UploadZone from './UploadZone';
import { usePdfDownload } from './hooks/usePdfDownload';
import { validatePdfFile } from './utils/validation';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import LoadingOverlay from './ui/LoadingOverlay';

// Import newly designed sub-components
import ThumbnailSidebar from './redact/ThumbnailSidebar';
import RedactionToolbar from './redact/RedactionToolbar';
import CanvasViewer from './redact/CanvasViewer';
import ExportDialog from './redact/ExportDialog';

interface RedactPdfToolProps {
  onClose: () => void;
}

interface RedactionBox {
  id: string;
  pageIndex: number;
  x: number;      // percentage (0-100)
  y: number;      // percentage (0-100)
  width: number;  // percentage (0-100)
  height: number; // percentage (0-100)
}

// Custom Zoom Level Steps
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0];

export default function RedactPdfTool({ onClose }: RedactPdfToolProps) {
  // Document state
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null); // PDF.js Document object
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Redactions & History State
  const [redactions, setRedactions] = useState<RedactionBox[]>([]);
  const [history, setHistory] = useState<RedactionBox[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  // Zoom & Modes
  const [scale, setScale] = useState<number>(1.0);
  const [activeMode, setActiveMode] = useState<'pointer' | 'draw' | 'pan'>('pointer');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Render & Library Progress loading indicators
  const [libLoading, setLibLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [thumbnails, setThumbnails] = useState<{ [key: number]: string }>({});

  // Export settings dialog
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);
  const [outputName, setOutputName] = useState<string>('redacted_document.pdf');

  // Error messaging
  const [validationError, setValidationError] = useState<string | null>(null);

  const activeUrlsRef = useRef<Set<string>>(new Set());
  const renderedIndicesRef = useRef<Set<number>>(new Set());

  const {
    downloading: processing,
    error: downloadError,
    executeDownload,
    clearDownloadStates,
  } = usePdfDownload();

  const error = downloadError || validationError;

  // Handle object URL safety cleanup
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
    setThumbnails({});
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllUrls();
    };
  }, [cleanupAllUrls]);

  // Load PDF.js dynamically (identical to OrganizePdfTool loading strategy)
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
          reject(new Error('PDF.js script loaded but libraries were not found on the window object.'));
        }
      };
      script.onerror = () => {
        setLibLoading(false);
        reject(new Error('Failed to load local PDF.js engine. Please verify files are present.'));
      };
      document.head.appendChild(script);
    });
  };

  // State History controls (Undo / Redo / Ctrl+Z / Ctrl+Y)
  const pushToHistory = (newRedactions: RedactionBox[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newRedactions)));
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setRedactions(JSON.parse(JSON.stringify(history[nextIndex])));
      setSelectedBoxId(null);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setRedactions(JSON.parse(JSON.stringify(history[nextIndex])));
      setSelectedBoxId(null);
    }
  }, [history, historyIndex]);

  // Listen for keyboard shortcuts (Ctrl+Z, Ctrl+Y, Backspace, Delete)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (showExportDialog || processing) return;

      const isCtrlCmd = e.ctrlKey || e.metaKey;

      if (isCtrlCmd && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if (isCtrlCmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [history, historyIndex, showExportDialog, processing, handleUndo, handleRedo]);

  // Handle document uploaded
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
    cleanupAllUrls();
    renderedIndicesRef.current.clear();
    setRedactions([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setCurrentPageIndex(0);
    setSelectedBoxId(null);
    setScale(1.0);

    const baseName = selectedFile.name.replace(/\.pdf$/i, '');
    setOutputName(`${baseName}_redacted.pdf`);

    try {
      const pdfjs = await loadPdfJsLibrary();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setIsScanning(false);
    } catch (err: any) {
      console.error('Error loading PDF structure:', err);
      setValidationError('Failed to parse the PDF document. It may be password-secured or corrupted.');
      setFile(null);
      setIsScanning(false);
    }
  };

  // Generate lazy rendered page thumbnails on sidebar scroll
  const renderThumbnailForPage = useCallback(async (pageIndex: number) => {
    if (!pdfDoc || renderedIndicesRef.current.has(pageIndex)) return;
    renderedIndicesRef.current.add(pageIndex);

    try {
      const page = await pdfDoc.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: 0.25 });
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

              setThumbnails((prev) => ({
                ...prev,
                [pageIndex]: url,
              }));
            }
            canvas.width = 0;
            canvas.height = 0;
            resolve();
          }, 'image/jpeg', 0.65);
        });
      }
    } catch (e) {
      console.warn(`Could not render thumbnail index ${pageIndex}:`, e);
    }
  }, [pdfDoc, trackUrl]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale((prev) => {
      const index = ZOOM_STEPS.findIndex((s) => s > prev);
      return index !== -1 ? ZOOM_STEPS[index] : prev;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const reversed = [...ZOOM_STEPS].reverse();
      const index = reversed.findIndex((s) => s < prev);
      return index !== -1 ? reversed[index] : prev;
    });
  }, []);

  const handleFitWidth = useCallback(async () => {
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(currentPageIndex + 1);
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = window.innerWidth - 300; // Approx subtract sidebar and paddings
      const computed = Math.max(0.4, Math.min(3.0, (containerWidth - 64) / viewport.width));
      setScale(computed);
    } catch (e) {
      setScale(1.0);
    }
  }, [pdfDoc, currentPageIndex]);

  const handleFitPage = useCallback(async () => {
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(currentPageIndex + 1);
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = window.innerWidth - 300;
      const containerHeight = window.innerHeight - 250;
      const fitW = (containerWidth - 64) / viewport.width;
      const fitH = (containerHeight - 64) / viewport.height;
      const computed = Math.max(0.4, Math.min(3.0, Math.min(fitW, fitH)));
      setScale(computed);
    } catch (e) {
      setScale(1.0);
    }
  }, [pdfDoc, currentPageIndex]);

  // Clears / Deletes redactions
  const handleClearCurrentPage = () => {
    const nextRedactions = redactions.filter((r) => r.pageIndex !== currentPageIndex);
    setRedactions(nextRedactions);
    pushToHistory(nextRedactions);
    setSelectedBoxId(null);
  };

  const handleClearAll = () => {
    setRedactions([]);
    pushToHistory([]);
    setSelectedBoxId(null);
  };

  const handleAddRedaction = (newBox: Omit<RedactionBox, 'id' | 'pageIndex'>) => {
    const box: RedactionBox = {
      ...newBox,
      id: `redact-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      pageIndex: currentPageIndex,
    };
    const nextRedactions = [...redactions, box];
    setRedactions(nextRedactions);
    pushToHistory(nextRedactions);
  };

  const handleUpdateRedaction = useCallback((id: string, updates: Partial<RedactionBox>) => {
    setRedactions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const handleCommitChanges = useCallback(() => {
    // Sync current state to history stack after transformation finishes
    setRedactions((current) => {
      pushToHistory(current);
      return current;
    });
  }, [history, historyIndex]);

  const handleDeleteRedaction = (id: string) => {
    const nextRedactions = redactions.filter((r) => r.id !== id);
    setRedactions(nextRedactions);
    pushToHistory(nextRedactions);
  };

  // Dynamic values
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const zoomPercent = Math.round(scale * 100);

  const redactionsCountByPage = useMemo(() => {
    const counts: { [key: number]: number } = {};
    redactions.forEach((r) => {
      counts[r.pageIndex] = (counts[r.pageIndex] || 0) + 1;
    });
    return counts;
  }, [redactions]);

  // --- PDF REDACTION EXPORT GENERATOR (REAL HARD-BURNING REDACTION) ---
  const handleCompilePdf = async () => {
    if (!file || redactions.length === 0) return;
    setShowExportDialog(false);

    await executeDownload(async () => {
      const { PDFDocument } = await import('pdf-lib');
      const srcArrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(srcArrayBuffer);
      const destDoc = await PDFDocument.create();

      const numPages = srcDoc.getPageCount();

      for (let i = 0; i < numPages; i++) {
        const pageReds = redactions.filter((r) => r.pageIndex === i);

        // Optimization: If page has NO redactions, copy it exactly as a high-fidelity vector page!
        if (pageReds.length === 0) {
          const [copiedPage] = await destDoc.copyPages(srcDoc, [i]);
          destDoc.addPage(copiedPage);
          continue;
        }

        // Secure Rasterization & Hard-burning of redactions for redacted pages:
        // 1. Render page at high scale for extremely crisp text layout resolution
        const page = await pdfDoc.getPage(i + 1);
        const renderScale = 2.5; // High res
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to create high resolution canvas context for security rendering.');
        }

        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Render PDF page vectors to canvas pixels
        await page.render({ canvasContext: context, viewport }).promise;

        // Draw physical solid black pixels permanently over the redaction coordinates
        pageReds.forEach((box) => {
          const rx = (box.x / 100) * canvas.width;
          const ry = (box.y / 100) * canvas.height;
          const rw = (box.width / 100) * canvas.width;
          const rh = (box.height / 100) * canvas.height;

          context.fillStyle = '#000000';
          context.fillRect(rx, ry, rw, rh);
        });

        // Convert rasterized canvas to JPG
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.92); // Keep high image clarity
        });

        if (!blob) {
          throw new Error('Failed to create secure flattened raster page.');
        }

        const imgArrayBuffer = await blob.arrayBuffer();
        const embedImage = await destDoc.embedJpg(imgArrayBuffer);

        // Get original page bounds to preserve formatting perfectly
        const origViewport = page.getViewport({ scale: 1 });
        const blankPage = destDoc.addPage([origViewport.width, origViewport.height]);

        // Draw the flattened pixel layer on the blank page
        blankPage.drawImage(embedImage, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });

        // Housekeeping
        canvas.width = 0;
        canvas.height = 0;
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
    setRedactions([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[92vh] my-4 animate-scale-in outline-none">
        
        {/* Workspace Header */}
        <WorkspaceHeader
          title="Secure PDF Redaction"
          subtitle="Enterprise pixel flattening: Draw bounding boxes permanently baking black redaction blocks into your document locally."
          icon={<Shield size={18} />}
          onClose={handleClose}
        />

        {/* Workspace Body */}
        <div className="flex-grow flex relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/15">
          {libLoading && (
            <LoadingOverlay message="Initializing security rendering engines..." />
          )}

          {isScanning && (
            <div className="absolute inset-0 z-40 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-[3px] flex items-center justify-center">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3.5 max-w-xs w-full text-center">
                <Loader2 size={32} className="animate-spin text-red-600 dark:text-red-400" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-navy dark:text-white">Mapping PDF structure...</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">Raster previews indexing</p>
                </div>
              </div>
            </div>
          )}

          {!file ? (
            <div className="p-6 flex-grow flex items-center justify-center">
              <UploadZone
                onFilesSelected={handleFileChange}
                multiple={false}
                title={
                  <>
                    Drag & drop your PDF file here, or <span className="text-red-600 dark:text-red-400 hover:underline">browse files</span>
                  </>
                }
                description="Secure processing occurs entirely inside your browser. No server uploads."
              />
            </div>
          ) : (
            <div className="flex flex-grow overflow-hidden h-full">
              {/* Thumbnail Sidebar */}
              {totalPages && (
                <ThumbnailSidebar
                  totalPages={totalPages}
                  currentPageIndex={currentPageIndex}
                  onPageSelect={(idx) => {
                    setCurrentPageIndex(idx);
                    setSelectedBoxId(null);
                  }}
                  thumbnails={thumbnails}
                  onRenderThumbnail={renderThumbnailForPage}
                  redactionsCountByPage={redactionsCountByPage}
                />
              )}

              {/* Main Content Workspace containing Toolbar and interactive Canvas */}
              <div className="flex-grow flex flex-col overflow-hidden h-full p-4 gap-4">
                {totalPages && (
                  <RedactionToolbar
                    activeMode={activeMode}
                    setActiveMode={setActiveMode}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onFitWidth={handleFitWidth}
                    onFitPage={handleFitPage}
                    onClearPage={handleClearCurrentPage}
                    onClearAll={handleClearAll}
                    isPreviewMode={isPreviewMode}
                    setIsPreviewMode={setIsPreviewMode}
                    onApply={() => setShowExportDialog(true)}
                    redactionCount={redactions.length}
                    currentPage={currentPageIndex}
                    totalPages={totalPages}
                    onPrevPage={() => {
                      if (currentPageIndex > 0) {
                        setCurrentPageIndex(currentPageIndex - 1);
                        setSelectedBoxId(null);
                      }
                    }}
                    onNextPage={() => {
                      if (currentPageIndex < totalPages - 1) {
                        setCurrentPageIndex(currentPageIndex + 1);
                        setSelectedBoxId(null);
                      }
                    }}
                    zoomPercent={zoomPercent}
                  />
                )}

                {/* Canvas Viewer */}
                <CanvasViewer
                  pdfDoc={pdfDoc}
                  currentPageIndex={currentPageIndex}
                  scale={scale}
                  activeMode={activeMode}
                  redactions={redactions}
                  selectedBoxId={selectedBoxId}
                  onSelectBox={setSelectedBoxId}
                  onAddRedaction={handleAddRedaction}
                  onUpdateRedaction={handleUpdateRedaction}
                  onDeleteRedaction={handleDeleteRedaction}
                  isPreviewMode={isPreviewMode}
                  zoomPercent={zoomPercent}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onCommitChanges={handleCommitChanges}
                />
              </div>
            </div>
          )}

          {/* Error alerts */}
          {error && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
              <AlertBanner type="error" message={error} />
            </div>
          )}

          {/* Secure Compiling Byte Overlay */}
          {processing && (
            <LoadingOverlay message="Executing pixel destruction & compiling document bytes..." />
          )}
        </div>
      </div>

      {/* Export Settings Dialog */}
      {showExportDialog && (
        <ExportDialog
          outputName={outputName}
          setOutputName={setOutputName}
          onClose={() => setShowExportDialog(false)}
          onSave={handleCompilePdf}
          redactionCount={redactions.length}
        />
      )}
    </div>
  );
}
