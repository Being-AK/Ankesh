import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Images, 
  FileText, 
  CheckSquare, 
  Square, 
  Download, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Info, 
  X, 
  Sliders, 
  Sparkles, 
  Settings,
  HelpCircle
} from 'lucide-react';
import UploadZone from './UploadZone';
import { formatFileSize } from './utils/fileHelpers';
import { validatePdfFile } from './utils/validation';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import LoadingOverlay from './ui/LoadingOverlay';
import ActionToolbar from './ui/ActionToolbar';

interface PdfToImagesToolProps {
  onClose: () => void;
}

// Map user quality options to numeric values for canvas.toBlob
const QUALITY_MAP = {
  low: 0.5,
  medium: 0.75,
  high: 0.9,
  original: 1.0,
};

// Map DPI selection to scale multipliers (relative to default 72 PDF points per inch)
const getDpiScale = (dpiSetting: string, customDpiValue: string): number => {
  if (dpiSetting === '72') return 1.0;
  if (dpiSetting === '150') return 150 / 72; // ~2.0833
  if (dpiSetting === '300') return 300 / 72; // ~4.1667
  if (dpiSetting === 'custom') {
    const custom = parseInt(customDpiValue, 10) || 150;
    return Math.max(36, Math.min(600, custom)) / 72; // bounds safety
  }
  return 150 / 72;
};

export default function PdfToImagesTool({ onClose }: PdfToImagesToolProps) {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const checkMd = () => setIsMd(window.innerWidth >= 768);
    checkMd();
    window.addEventListener('resize', checkMd);
    return () => window.removeEventListener('resize', checkMd);
  }, []);

  // Core State
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null); // PDF.js Document object
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  
  // Library Load State
  const [libLoading, setLibLoading] = useState<boolean>(false);
  const [libLoaded, setLibLoaded] = useState<boolean>(false);

  // Flow State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingPage, setProcessingPage] = useState<number>(0);
  const [totalToProcess, setTotalToProcess] = useState<number>(0);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  // Errors & Alerts
  const [validationError, setValidationError] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Configuration Settings
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'original'>('original');
  const [resolution, setResolution] = useState<'72' | '150' | '300' | 'custom'>('150');
  const [customDpi, setCustomDpi] = useState<string>('200');
  const [background, setBackground] = useState<'transparent' | 'white' | 'black'>('white');
  const [namingConvention, setNamingConvention] = useState<'page-number' | 'original' | 'custom'>('original');
  const [customPrefix, setCustomPrefix] = useState<string>('Export');

  // Completed items tracking
  const [exportedImages, setExportedImages] = useState<{ name: string; size: number }[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [singleImageBlob, setSingleImageBlob] = useState<Blob | null>(null);
  const [singleImageName, setSingleImageName] = useState<string>('');

  // Refs for cancellation, URLs tracking and accessibility
  const cancelRef = useRef<boolean>(false);
  const activeUrlsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef<boolean>(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Safe tracking for object URLs to ensure cleanups
  const trackUrl = useCallback((url: string) => {
    activeUrlsRef.current.add(url);
  }, []);

  const revokeUrl = useCallback((url: string) => {
    if (activeUrlsRef.current.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('URL Revocation error:', e);
      }
      activeUrlsRef.current.delete(url);
    }
  }, []);

  const cleanupAllUrls = useCallback(() => {
    activeUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    });
    activeUrlsRef.current.clear();
  }, []);

  // Set mounted flag and clean up memory on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupAllUrls();
    };
  }, [cleanupAllUrls]);

  // Handle Close
  const handleClose = () => {
    cleanupAllUrls();
    onClose();
  };

  // Accessibility Focus Trap and Escape Key Handler
  useEffect(() => {
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    if (modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        modalRef.current.focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!modalRef.current.contains(document.activeElement)) {
          first.focus();
          e.preventDefault();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, []);

  // Lazy-load PDF.js locally to avoid Vite bundler problems and keep initial bundle tiny
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
          setLibLoaded(true);
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

  // Perform Initial Scan of Selected PDF
  const handleFileChange = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];

    // Local basic validation
    const valResult = validatePdfFile(selectedFile);
    if (!valResult.isValid) {
      setValidationError(valResult.error);
      return;
    }

    setValidationError(null);
    setProcessingError(null);
    setIsScanning(true);
    cleanupAllUrls();
    setThumbnails({});
    setPdfDoc(null);
    setTotalPages(null);
    setSelectedPages(new Set());
    setShowSummary(false);

    try {
      const pdfjs = await loadPdfJsLibrary();
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const doc = await loadingTask.promise;
      
      setFile(selectedFile);
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      
      // Auto-select all pages by default for friendly flow
      const autoSelected = new Set<number>();
      for (let i = 1; i <= doc.numPages; i++) {
        autoSelected.add(i);
      }
      setSelectedPages(autoSelected);
    } catch (err: any) {
      console.error('Error scanning PDF document structure:', err);
      if (err.name === 'PasswordException' || err.message?.toLowerCase().includes('password') || err.message?.toLowerCase().includes('decrypt')) {
        setValidationError('This PDF is password-protected. Please decrypt and unlock the file first using the Unlock PDF tool.');
      } else {
        setValidationError('Failed to parse this PDF. The document might be corrupted, damaged, or unsupported.');
      }
      setFile(null);
    } finally {
      setIsScanning(false);
    }
  };

  // Sequential Page Thumbnail Previews Rendering (Optimized with requestAnimationFrame)
  useEffect(() => {
    if (!file || !pdfDoc || !totalPages) return;

    let active = true;
    const renderPreviews = async () => {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (!active) break;
        
        try {
          const page = await pdfDoc.getPage(pageNum);
          // Scale 0.35 creates a perfectly balanced lightweight preview
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (context) {
            // Draw a standard white background for loading layout consistency
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            await page.render({ canvasContext: context, viewport }).promise;
            
            canvas.toBlob((blob) => {
              if (!active || !blob) {
                // Free canvas memory immediately
                canvas.width = 0;
                canvas.height = 0;
                return;
              }
              const url = URL.createObjectURL(blob);
              trackUrl(url);

              setThumbnails((prev) => {
                if (!active) {
                  URL.revokeObjectURL(url);
                  return prev;
                }
                return { ...prev, [pageNum]: url };
              });

              // Clean canvas references
              canvas.width = 0;
              canvas.height = 0;
            }, 'image/jpeg', 0.8);
          }
        } catch (e) {
          console.warn(`Could not render thumbnail preview for page ${pageNum}:`, e);
        }
      }
    };

    renderPreviews();

    return () => {
      active = false;
    };
  }, [file, pdfDoc, totalPages, trackUrl]);

  // Page Selection Handlers
  const togglePageSelection = (pageNum: number) => {
    setSelectedPages((prev) => {
      const updated = new Set(prev);
      if (updated.has(pageNum)) {
        updated.delete(pageNum);
      } else {
        updated.add(pageNum);
      }
      return updated;
    });
  };

  const selectAll = () => {
    if (!totalPages) return;
    const updated = new Set<number>();
    for (let i = 1; i <= totalPages; i++) {
      updated.add(i);
    }
    setSelectedPages(updated);
  };

  const selectNone = () => {
    setSelectedPages(new Set());
  };

  const invertSelection = () => {
    if (!totalPages) return;
    const updated = new Set<number>();
    for (let i = 1; i <= totalPages; i++) {
      if (!selectedPages.has(i)) {
        updated.add(i);
      }
    }
    setSelectedPages(updated);
  };

  const handleClearFile = () => {
    cleanupAllUrls();
    setFile(null);
    setPdfDoc(null);
    setTotalPages(null);
    setSelectedPages(new Set());
    setThumbnails({});
    setValidationError(null);
    setProcessingError(null);
    setShowSummary(false);
  };

  // Dynamic naming string generator
  const getOutputFileName = (pageNum: number): string => {
    const ext = format === 'jpeg' ? 'jpg' : format;
    if (namingConvention === 'page-number') {
      return `Page_${pageNum}.${ext}`;
    }
    if (namingConvention === 'original' && file) {
      const base = file.name.replace(/\.pdf$/i, '');
      return `${base}_Page_${pageNum}.${ext}`;
    }
    // Custom Prefix
    const prefix = customPrefix.trim() || 'Custom';
    const padNum = String(pageNum).padStart(3, '0');
    return `${prefix}_${padNum}.${ext}`;
  };

  // Main Conversion Action (Sequential & Leak-Free)
  const handleConvert = async () => {
    if (!file || !pdfDoc || selectedPages.size === 0) {
      setProcessingError('Please select at least one page to convert.');
      return;
    }

    setProcessingError(null);
    setIsProcessing(true);
    setIsCancelled(false);
    cancelRef.current = false;
    setProcessingProgress(0);
    setZipBlob(null);
    setSingleImageBlob(null);

    const pagesToRender = Array.from(selectedPages).sort((a, b) => a - b);
    const totalSelected = pagesToRender.length;
    setTotalToProcess(totalSelected);

    const renderedBlobs: { name: string; blob: Blob }[] = [];
    let currentIdx = 0;

    for (const pageNum of pagesToRender) {
      if (cancelRef.current) {
        break;
      }

      currentIdx++;
      setProcessingPage(pageNum);
      // Stagger progress animation safely
      setProcessingProgress(Math.round(((currentIdx - 1) / totalSelected) * 100));

      try {
        const page = await pdfDoc.getPage(pageNum);
        const scale = getDpiScale(resolution, customDpi);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
          // Transparent vs Color fill backgrounds
          if (background === 'white') {
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);
          } else if (background === 'black') {
            context.fillStyle = '#000000';
            context.fillRect(0, 0, canvas.width, canvas.height);
          } else if (background === 'transparent' && format === 'png') {
            // PNG transparency stays transparent
          } else {
            // JPEG & WEBP don't support transparent transparency, fallback to white background safely
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Execute rendering
          await page.render({ canvasContext: context, viewport }).promise;

          // Compression quality selection
          const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
          const qualityVal = format === 'png' ? 1.0 : QUALITY_MAP[quality];

          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), mimeType, qualityVal);
          });

          if (blob) {
            const outName = getOutputFileName(pageNum);
            renderedBlobs.push({ name: outName, blob });
          }

          // Clear canvas memory allocations immediately after processing the page
          canvas.width = 0;
          canvas.height = 0;
        }
      } catch (err: any) {
        console.error(`Failed to render page ${pageNum}:`, err);
        // We continue gracefully if possible, or show alert later
      }
    }

    setProcessingProgress(100);

    if (renderedBlobs.length === 0) {
      setProcessingError(cancelRef.current ? 'Conversion cancelled. No pages rendered.' : 'Rendering failed. Please try a lower DPI or output format.');
      setIsProcessing(false);
      return;
    }

    // Trigger Downloads
    if (renderedBlobs.length === 1) {
      // Single Image Flow
      const single = renderedBlobs[0];
      setSingleImageBlob(single.blob);
      setSingleImageName(single.name);
      
      const fileUrl = URL.createObjectURL(single.blob);
      trackUrl(fileUrl);

      // Trigger automatic instant download for single file
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = single.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportedImages([{ name: single.name, size: single.blob.size }]);
    } else {
      // Multi-Page ZIP Bundling
      try {
        const JSZipDefault = await import('jszip');
        const JSZip = JSZipDefault.default;
        const zip = new JSZip();

        renderedBlobs.forEach((item) => {
          zip.file(item.name, item.blob);
        });

        const zipFileBlob = await zip.generateAsync({ type: 'blob' });
        setZipBlob(zipFileBlob);

        const zipUrl = URL.createObjectURL(zipFileBlob);
        trackUrl(zipUrl);

        // Trigger automatic instant zip download
        const link = document.createElement('a');
        link.href = zipUrl;
        link.download = 'PDF_Images.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportedImages(renderedBlobs.map(item => ({ name: item.name, size: item.blob.size })));
      } catch (zipErr) {
        console.error('ZIP compiling failed:', zipErr);
        setProcessingError('Image processing was successful, but compiled ZIP folder construction failed.');
      }
    }

    setIsProcessing(false);
    setShowSummary(true);
    if (cancelRef.current) {
      setIsCancelled(true);
    }
  };

  const handleDownloadSingleAgain = () => {
    if (!singleImageBlob || !singleImageName) return;
    const url = URL.createObjectURL(singleImageBlob);
    trackUrl(url);
    const link = document.createElement('a');
    link.href = url;
    link.download = singleImageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadZipAgain = () => {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    trackUrl(url);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PDF_Images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCancelProcess = () => {
    cancelRef.current = true;
    setIsCancelled(true);
  };

  // Renders a visual textual progress bar block
  const getBlockProgressBar = (pct: number) => {
    const blocksCount = 15;
    const filled = Math.round((pct / 100) * blocksCount);
    const empty = blocksCount - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  // UI Sections
  const renderSummaryScreen = () => {
    return (
      <div className="space-y-6 animate-fade-in py-4 text-left">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-full mb-1">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-navy dark:text-white">Conversion Completed</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isCancelled 
              ? 'Conversion was cancelled. Rendered documents are packed and ready below.'
              : 'All target PDF pages have been sequentially rendered and saved locally.'}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-5 border border-slate-150 dark:border-slate-800/60 rounded-3xl">
          <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
            <p className="text-xl font-black text-slate-800 dark:text-white">{exportedImages.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mt-1">Images Exported</p>
          </div>
          <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
            <p className="text-xl font-black text-corporate dark:text-gold uppercase">{format}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mt-1">Output Format</p>
          </div>
          <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
            <p className="text-xl font-black text-emerald-500">
              {resolution === 'custom' ? `${customDpi} DPI` : `${resolution} DPI`}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mt-1">Resolution</p>
          </div>
          <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
            <p className="text-xl font-black text-amber-500 uppercase">{quality}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mt-1">Export Quality</p>
          </div>
        </div>

        {/* File inventory list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm">
          <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
            Exported File Packages
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto text-xs font-semibold text-slate-700 dark:text-slate-300">
            {exportedImages.map((img, i) => (
              <li key={i} className="p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 truncate">
                  <FileText size={14} className="text-emerald-500 shrink-0" />
                  <span className="truncate" title={img.name}>{img.name}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px] shrink-0">{formatFileSize(img.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto transition-all duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      style={{ 
        left: isMd ? 'var(--pdf-sidebar-width, 256px)' : '0px', 
        paddingLeft: '16px', 
        paddingRight: '16px' 
      }}
    >
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf2img-modal-title"
        aria-describedby="pdf2img-modal-desc"
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] my-4 md:my-8 animate-scale-in outline-none"
      >
        <span id="pdf2img-modal-title" className="sr-only">PDF to Images Workspace</span>
        <span id="pdf2img-modal-desc" className="sr-only">Convert document pages into high-fidelity image formats locally.</span>

        {/* Workspace Header */}
        <WorkspaceHeader
          title="PDF to Images Workspace"
          subtitle="Genuine client-side extraction: Render PDF pages into high-fidelity PNG, JPEG, or WEBP images completely offline."
          icon={<Images size={18} />}
          onClose={handleClose}
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 relative min-h-[300px]">
          {libLoading && (
            <LoadingOverlay message="Initializing high-performance PDF renderer..." />
          )}

          {showSummary ? (
            renderSummaryScreen()
          ) : !file ? (
            <UploadZone
              onFilesSelected={handleFileChange}
              multiple={false}
              title={
                <>
                  Drag & drop your PDF here, or <span className="text-corporate dark:text-gold hover:underline">browse files</span>
                </>
              }
              description="Requires exactly one valid PDF document. Rendering operates in-memory inside your browser."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Side: Pages Grid and Preview Selection */}
              <div className="lg:col-span-7 space-y-5 text-left">
                {/* File summary details banner */}
                <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10 border border-slate-200/60 dark:border-slate-850 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-navy dark:text-white truncate max-w-[280px]" title={file.name}>{file.name}</p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
                        {totalPages} pages • {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearFile}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider cursor-pointer font-sans"
                    aria-label="Remove and Upload Different File"
                  >
                    <Trash2 size={12} />
                    <span>Change File</span>
                  </button>
                </div>

                {/* Selection Toolbar */}
                <ActionToolbar
                  className="!p-3.5"
                  leftSection={
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">Select PDF Pages to Render</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={selectAll}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-corporate dark:hover:border-gold text-slate-600 dark:text-slate-350 font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1 font-sans"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={selectNone}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-corporate dark:hover:border-gold text-slate-600 dark:text-slate-350 font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1 font-sans"
                        >
                          Select None
                        </button>
                        <button
                          type="button"
                          onClick={invertSelection}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-corporate dark:hover:border-gold text-slate-600 dark:text-slate-350 font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1 font-sans"
                        >
                          Invert Selection
                        </button>
                      </div>
                    </div>
                  }
                  rightSection={
                    <div className="text-right flex flex-col justify-center items-end">
                      <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Selection Count</p>
                      <p className="text-sm font-black text-corporate dark:text-gold mt-1">
                        {selectedPages.size} / {totalPages} Pages
                      </p>
                    </div>
                  }
                />

                {/* Grid of Pages */}
                <div className="border border-slate-150 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-950/10 p-4 max-h-[380px] overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                    {Array.from({ length: totalPages || 0 }, (_, idx) => {
                      const pageNum = idx + 1;
                      const isSelected = selectedPages.has(pageNum);
                      const thumbUrl = thumbnails[pageNum];

                      return (
                        <div
                          key={pageNum}
                          tabIndex={0}
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-label={`Select page ${pageNum}`}
                          onClick={() => togglePageSelection(pageNum)}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              togglePageSelection(pageNum);
                            }
                          }}
                          className={`group relative aspect-[3/4] bg-white dark:bg-slate-900 border-2 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-2 select-none outline-none focus-visible:ring-2 focus-visible:ring-corporate dark:focus-visible:ring-gold ${
                            isSelected 
                              ? 'border-corporate dark:border-gold ring-1 ring-corporate dark:ring-gold' 
                              : 'border-slate-200/70 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600'
                          }`}
                        >
                          {/* Checked Indicator */}
                          <div className="flex justify-between items-start">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 dark:text-slate-400 rounded-md">
                              Pg {pageNum}
                            </span>
                            <div className={`rounded-md p-0.5 ${isSelected ? 'text-corporate dark:text-gold' : 'text-slate-300 dark:text-slate-700'}`}>
                              {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                            </div>
                          </div>

                          {/* Preview Screen */}
                          <div className="flex-1 flex items-center justify-center overflow-hidden my-1 relative">
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={`Page ${pageNum} Preview`}
                                className="max-h-full max-w-full object-contain rounded border border-slate-100 dark:border-slate-800 shadow-sm group-hover:scale-102 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 p-2 text-center text-slate-400 animate-pulse">
                                <Loader2 size={14} className="animate-spin text-corporate dark:text-gold" />
                                <span className="text-[9px] font-bold">Scanning...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Side: Options and Configurations */}
              <div className="lg:col-span-5 space-y-5 text-left border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 lg:pl-6 pt-5 lg:pt-0">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-corporate dark:text-gold" />
                  <h4 className="text-xs font-black text-navy dark:text-white uppercase tracking-wider">Export Parameters</h4>
                </div>

                <div className="space-y-4">
                  {/* Format Options */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Image format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => {
                            setFormat(fmt);
                            if (fmt !== 'png' && background === 'transparent') {
                              setBackground('white'); // Autocorrect transparent background for non-PNG formats
                            }
                          }}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer font-sans uppercase ${
                            format === fmt
                              ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality Settings (only active for lossy JPEG/WEBP formats) */}
                  {format !== 'png' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Compression Quality</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['low', 'medium', 'high', 'original'] as const).map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => setQuality(qty)}
                            className={`py-2 px-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer font-sans uppercase ${
                              quality === qty
                                ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                            }`}
                          >
                            {qty}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DPI Resolution */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Rendering DPI</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['72', '150', '300', 'custom'] as const).map((dpi) => (
                        <button
                          key={dpi}
                          type="button"
                          onClick={() => setResolution(dpi)}
                          className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all cursor-pointer font-sans uppercase ${
                            resolution === dpi
                              ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                          }`}
                        >
                          {dpi === 'custom' ? 'Custom' : `${dpi} DPI`}
                        </button>
                      ))}
                    </div>

                    {resolution === 'custom' && (
                      <div className="pt-1.5 animate-fade-in">
                        <input
                          type="number"
                          min="36"
                          max="600"
                          value={customDpi}
                          onChange={(e) => setCustomDpi(e.target.value)}
                          placeholder="e.g. 200"
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors"
                          aria-label="Custom DPI value between 36 and 600"
                        />
                        <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-relaxed">
                          Enter custom value between 36 and 600 DPI. Higher values yield ultra-sharp images but consume substantial device memory.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Background Options */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Canvas Background</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['white', 'black', 'transparent'] as const).map((bg) => {
                        const disabled = bg === 'transparent' && format !== 'png';
                        return (
                          <button
                            key={bg}
                            type="button"
                            disabled={disabled}
                            onClick={() => setBackground(bg)}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer font-sans uppercase ${
                              background === bg
                                ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy'
                                : disabled
                                ? 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850/50 text-slate-300 dark:text-slate-650 cursor-not-allowed'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                            }`}
                            title={disabled ? 'Transparency requires PNG format option' : ''}
                          >
                            {bg}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Naming Convention */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">File Naming Convention</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setNamingConvention('page-number')}
                        className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all cursor-pointer font-sans ${
                          namingConvention === 'page-number'
                            ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                        }`}
                      >
                        Page No.
                      </button>
                      <button
                        type="button"
                        onClick={() => setNamingConvention('original')}
                        className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all cursor-pointer font-sans ${
                          namingConvention === 'original'
                            ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                        }`}
                      >
                        Original
                      </button>
                      <button
                        type="button"
                        onClick={() => setNamingConvention('custom')}
                        className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all cursor-pointer font-sans ${
                          namingConvention === 'custom'
                            ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                        }`}
                      >
                        Custom Prefix
                      </button>
                    </div>

                    {namingConvention === 'custom' && (
                      <div className="pt-1.5 animate-fade-in">
                        <input
                          type="text"
                          maxLength={32}
                          value={customPrefix}
                          onChange={(e) => setCustomPrefix(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, ''))}
                          placeholder="e.g. My_Export"
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors"
                          aria-label="Custom File Prefix name"
                        />
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/80 mt-2 space-y-1 text-left">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Naming Pattern Example:</span>
                      <p className="font-mono text-[10px] font-bold text-corporate dark:text-gold truncate">
                        {getOutputFileName(1)}
                      </p>
                      <p className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                        {getOutputFileName(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Secured sandboxed local browser disclaimer */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex gap-3 items-start">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-lg shrink-0">
                    <Sparkles size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      Secure Sandboxed Extraction
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
                      All sequential extraction routines compile locally in-memory on your CPU. No data packets ever upload or leave this workstation.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {isScanning && (
            <LoadingOverlay message="Deconstructing PDF file streams..." />
          )}

          {/* Sequential rendering with live progress overlay */}
          {isProcessing && (
            <LoadingOverlay
              message={
                <div className="space-y-4 max-w-sm mx-auto p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 text-left">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Converting PDF to Images</p>
                    <p className="text-sm font-bold truncate">Rendering page {processingPage} of {totalPages}</p>
                  </div>
                  
                  {/* Progress Graphics bar */}
                  <div className="font-mono text-base tracking-widest text-corporate dark:text-gold select-none leading-none">
                    {getBlockProgressBar(processingProgress)}
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>{processingProgress}%</span>
                    <span>Processed {exportedImages.length + 1} / {totalToProcess} pages</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelProcess}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer mt-2 shadow-sm font-sans"
                  >
                    Cancel Conversion
                  </button>
                </div>
              }
            />
          )}

          {validationError && (
            <AlertBanner type="error" message={validationError} />
          )}

          {processingError && (
            <AlertBanner type="error" message={processingError} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-950/10 shrink-0">
          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold text-left">
            {file && totalPages && (
              <span>Queue Inventory: {selectedPages.size} / {totalPages} pages selected</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showSummary ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setShowSummary(false);
                    setExportedImages([]);
                    setZipBlob(null);
                    setSingleImageBlob(null);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-350 font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-150 dark:border-slate-800/60 font-sans"
                >
                  Back to Workspace
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-350 font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-150 dark:border-slate-800/60 font-sans"
                >
                  Close Workspace
                </button>
                {singleImageBlob && (
                  <button
                    type="button"
                    onClick={handleDownloadSingleAgain}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all duration-300 font-sans"
                  >
                    <Download size={14} />
                    <span>Download Image</span>
                  </button>
                )}
                {zipBlob && (
                  <button
                    type="button"
                    onClick={handleDownloadZipAgain}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all duration-300 font-sans"
                  >
                    <Download size={14} />
                    <span>Download ZIP Package</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-350 font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-150 dark:border-slate-800/60 font-sans"
                >
                  Close Workspace
                </button>
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={!file || selectedPages.size === 0 || isProcessing || isScanning}
                  className={`font-bold py-2.5 px-6 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 shadow-md cursor-pointer font-sans ${
                    !file || selectedPages.size === 0 || isProcessing || isScanning
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed shadow-none'
                      : 'bg-corporate hover:bg-corporate/90 text-white dark:bg-gold dark:text-navy dark:hover:bg-amber-500'
                  }`}
                >
                  <Download size={14} />
                  <span>Convert PDF to Images</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
