import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, 
  Settings, 
  Search, 
  Copy, 
  Download, 
  Loader2, 
  Sparkles, 
  Sliders, 
  X, 
  CheckCircle2, 
  Globe, 
  AlertTriangle,
  Info,
  Check,
  Languages,
  Square,
  CheckSquare,
  HelpCircle,
  Play,
  ClipboardCheck,
  Eye
} from 'lucide-react';
import UploadZone from './UploadZone';
import { formatFileSize } from './utils/fileHelpers';
import { validatePdfFile } from './utils/validation';
import { parsePageRanges } from './utils/pdfHelpers';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import LoadingOverlay from './ui/LoadingOverlay';
import ActionToolbar from './ui/ActionToolbar';

interface OcrPdfToolProps {
  onClose: () => void;
}

interface PageOcrResult {
  pageNum: number;
  text: string;
  confidence: number; // 0 to 100
  failed: boolean;
  status: 'pending' | 'processing' | 'done' | 'failed';
}

// Popular OCR languages supported by Tesseract.js
const OCR_LANGUAGES = [
  { code: 'eng', name: 'English', nativeName: 'English' },
  { code: 'spa', name: 'Spanish', nativeName: 'Español' },
  { code: 'fra', name: 'French', nativeName: 'Français' },
  { code: 'deu', name: 'German', nativeName: 'Deutsch' },
  { code: 'ita', name: 'Italian', nativeName: 'Italiano' },
  { code: 'por', name: 'Portuguese', nativeName: 'Português' },
  { code: 'hin', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'chi_sim', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'jpn', name: 'Japanese', nativeName: '日本語' },
];

export default function OcrPdfTool({ onClose }: OcrPdfToolProps) {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const checkMd = () => setIsMd(window.innerWidth >= 768);
    checkMd();
    window.addEventListener('resize', checkMd);
    return () => window.removeEventListener('resize', checkMd);
  }, []);

  // Core State
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null); // PDF.js Doc object
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  // Dynamic Loading States
  const [pdfLibLoading, setPdfLibLoading] = useState<boolean>(false);
  const [ocrLibLoading, setOcrLibLoading] = useState<boolean>(false);

  // Flow & Progress States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [currentPageNum, setCurrentPageNum] = useState<number>(0);
  const [totalToProcess, setTotalToProcess] = useState<number>(0);
  const [ocrResults, setOcrResults] = useState<Record<number, PageOcrResult>>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);

  // Selection Type state ('all' | 'range' | 'select')
  const [selectionType, setSelectionType] = useState<'all' | 'range' | 'select'>('all');
  const [rangeInput, setRangeInput] = useState<string>('');
  const [rangeError, setRangeError] = useState<string | null>(null);

  // OCR Preferences State
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['eng']);
  const [textMode, setTextMode] = useState<'single' | 'all'>('all'); // display whole document or single page
  const [activeResultsPage, setActiveResultsPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Errors & Alerts
  const [validationError, setValidationError] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Refs for Cancel and Cleanups
  const cancelRef = useRef<boolean>(false);
  const activeUrlsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef<boolean>(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const tesseractWorkerRef = useRef<any>(null);

  // Tracking Object URLs
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

  // Component Mount Setup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupAllUrls();
      // Safe worker termination if unmounted during processing
      if (tesseractWorkerRef.current) {
        try {
          tesseractWorkerRef.current.terminate();
        } catch (e) {}
      }
    };
  }, [cleanupAllUrls]);

  // Handle Safe Modal Close
  const handleClose = () => {
    cleanupAllUrls();
    if (tesseractWorkerRef.current) {
      try {
        tesseractWorkerRef.current.terminate();
      } catch (e) {}
    }
    onClose();
  };

  // Accessibility Focus Trap & Escape Key
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

  // Lazy Load PDF.js locally
  const loadPdfJsLibrary = (): Promise<any> => {
    if ((window as any).pdfjsLib) {
      return Promise.resolve((window as any).pdfjsLib);
    }
    setPdfLibLoading(true);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/pdf.min.js';
      script.async = true;
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          setPdfLibLoading(false);
          resolve(pdfjsLib);
        } else {
          setPdfLibLoading(false);
          reject(new Error('PDF.js script loaded but libraries were not found in window object.'));
        }
      };
      script.onerror = () => {
        setPdfLibLoading(false);
        reject(new Error('Failed to load local PDF engine. Please verify files are present.'));
      };
      document.head.appendChild(script);
    });
  };

  // Lazy Load Tesseract.js locally
  const loadTesseractLibrary = (): Promise<any> => {
    if ((window as any).Tesseract) {
      return Promise.resolve((window as any).Tesseract);
    }
    setOcrLibLoading(true);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js';
      script.async = true;
      script.onload = () => {
        const Tesseract = (window as any).Tesseract;
        if (Tesseract) {
          setOcrLibLoading(false);
          resolve(Tesseract);
        } else {
          setOcrLibLoading(false);
          reject(new Error('Tesseract.js script loaded but was not found in window object.'));
        }
      };
      script.onerror = () => {
        setOcrLibLoading(false);
        reject(new Error('Failed to load local OCR engine. Please verify files are present.'));
      };
      document.head.appendChild(script);
    });
  };

  // PDF File Upload Handler
  const handleFileChange = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];

    // Local basic validation (corrupted / size)
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
    setShowResults(false);
    setOcrResults({});
    setRangeInput('');
    setSelectionType('all');

    try {
      const pdfjs = await loadPdfJsLibrary();
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const doc = await loadingTask.promise;
      
      setFile(selectedFile);
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      
      // Select all by default
      const autoSelected = new Set<number>();
      for (let i = 1; i <= doc.numPages; i++) {
        autoSelected.add(i);
      }
      setSelectedPages(autoSelected);
    } catch (err: any) {
      console.error('Error scanning PDF document:', err);
      if (err.name === 'PasswordException' || err.message?.toLowerCase().includes('password') || err.message?.toLowerCase().includes('decrypt')) {
        setValidationError('This PDF is password-protected. Please decrypt and unlock the file first using the Unlock PDF tool.');
      } else {
        setValidationError('Failed to parse this PDF. The document might be corrupted or damaged.');
      }
      setFile(null);
    } finally {
      setIsScanning(false);
    }
  };

  // Page Preview Thumbnail Rendering (Sequential with safe disposes)
  useEffect(() => {
    if (!file || !pdfDoc || !totalPages) return;

    let active = true;
    const renderPreviews = async () => {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (!active) break;
        
        try {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (context) {
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            await page.render({ canvasContext: context, viewport }).promise;
            
            canvas.toBlob((blob) => {
              if (!active || !blob) {
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

              canvas.width = 0;
              canvas.height = 0;
            }, 'image/jpeg', 0.85);
          }
        } catch (e) {
          console.warn(`Preview rendering failed for page ${pageNum}:`, e);
        }
      }
    };

    renderPreviews();
    return () => {
      active = false;
    };
  }, [file, pdfDoc, totalPages, trackUrl]);

  // Handlers for Visual Selection Grid
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

  // Sync range inputs with selection
  const handleRangeInputChange = (val: string) => {
    setRangeInput(val);
    setRangeError(null);
  };

  const validateAndSyncRangeInput = () => {
    if (!totalPages || !rangeInput.trim()) {
      setRangeError("Please specify at least one page or range.");
      return false;
    }
    try {
      // parsePageRanges returns 0-indexed page indices
      const pageIndices = parsePageRanges(rangeInput, totalPages);
      const updated = new Set(pageIndices.map(p => p + 1));
      setSelectedPages(updated);
      setRangeError(null);
      return true;
    } catch (err: any) {
      setRangeError(err.message || "Invalid page range format.");
      return false;
    }
  };

  // Helper to change page range selection types
  const handleSelectionTypeChange = (type: 'all' | 'range' | 'select') => {
    setSelectionType(type);
    if (type === 'all' && totalPages) {
      const allPages = new Set<number>();
      for (let i = 1; i <= totalPages; i++) allPages.add(i);
      setSelectedPages(allPages);
    } else if (type === 'range') {
      setSelectedPages(new Set());
      setRangeInput('');
    } else if (type === 'select') {
      // Copy current or clear
      setSelectedPages(new Set());
    }
  };

  const handleLanguageToggle = (code: string) => {
    setSelectedLangs((prev) => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
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
    setOcrResults({});
    setShowResults(false);
    setRangeInput('');
    setSelectionType('all');
  };

  // Perform Sequential OCR Loop
  const handleRunOcr = async () => {
    if (!file || !pdfDoc) return;

    let targetPages: number[] = [];
    if (selectionType === 'range') {
      const isValid = validateAndSyncRangeInput();
      if (!isValid) return;
      targetPages = Array.from(selectedPages).sort((a, b) => a - b);
    } else {
      targetPages = Array.from(selectedPages).sort((a, b) => a - b);
    }

    if (targetPages.length === 0) {
      setProcessingError('Please select at least one page to process.');
      return;
    }

    setProcessingError(null);
    setIsProcessing(true);
    setIsCancelled(false);
    cancelRef.current = false;
    setProcessingProgress(0);
    setOcrResults({});

    const totalSelected = targetPages.length;
    setTotalToProcess(totalSelected);

    // Load libraries
    let Tesseract: any;
    try {
      Tesseract = await loadTesseractLibrary();
    } catch (err: any) {
      setProcessingError(err.message || 'Failed to load Tesseract OCR engine.');
      setIsProcessing(false);
      return;
    }

    // Initialize initial results dictionary with 'pending' status
    const initialResults: Record<number, PageOcrResult> = {};
    targetPages.forEach(p => {
      initialResults[p] = {
        pageNum: p,
        text: '',
        confidence: 0,
        failed: false,
        status: 'pending'
      };
    });
    setOcrResults(initialResults);

    // Create the Tesseract worker with offline parameters
    let worker: any = null;
    try {
      const languagesString = selectedLangs.join('+');
      worker = await Tesseract.createWorker(languagesString, 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            const pagePct = Math.round(m.progress * 100);
            setProcessingProgress(pagePct);
          }
        }
      });
      tesseractWorkerRef.current = worker;
    } catch (err: any) {
      console.error('OCR Worker Init Error:', err);
      setProcessingError('Could not initialize the OCR worker. This might be due to a browser memory sandbox constraint.');
      setIsProcessing(false);
      return;
    }

    let completedCount = 0;
    
    // Process pages sequentially
    for (const pageNum of targetPages) {
      if (cancelRef.current) {
        break;
      }

      setCurrentPageNum(pageNum);
      setProcessingProgress(0);

      // Update active state in state dictionary
      setOcrResults((prev) => ({
        ...prev,
        [pageNum]: {
          ...prev[pageNum],
          status: 'processing'
        }
      }));

      let canvas: HTMLCanvasElement | null = null;
      try {
        const page = await pdfDoc.getPage(pageNum);
        // Render at scale 1.5 to provide a high-resolution canvas for optimal OCR accuracy
        const viewport = page.getViewport({ scale: 1.5 });
        canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (!context) throw new Error('Could not instantiate a valid 2D canvas context.');

        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        await page.render({ canvasContext: context, viewport }).promise;

        // Perform text recognition
        const { data } = await worker.recognize(canvas);
        
        const extractedText = data.text || '';
        const score = Math.round(data.confidence || 0);

        setOcrResults((prev) => ({
          ...prev,
          [pageNum]: {
            pageNum,
            text: extractedText,
            confidence: score,
            failed: score < 20 && extractedText.trim().length === 0,
            status: score < 20 && extractedText.trim().length === 0 ? 'failed' : 'done'
          }
        }));

      } catch (err: any) {
        console.error(`OCR processing error on page ${pageNum}:`, err);
        setOcrResults((prev) => ({
          ...prev,
          [pageNum]: {
            pageNum,
            text: `[ERROR: Page ${pageNum} failed to process during OCR text recognition]`,
            confidence: 0,
            failed: true,
            status: 'failed'
          }
        }));
      } finally {
        // Absolute memory cleanups: zero out the canvas and release browser garbage collector reference
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
          canvas = null;
        }
      }

      completedCount++;
    }

    // Clean up Tesseract worker allocation immediately
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {}
      tesseractWorkerRef.current = null;
    }

    setIsProcessing(false);
    if (cancelRef.current) {
      setIsCancelled(true);
    }

    // Determine the first successful page to set active in results
    const processedPages = targetPages.filter(p => !cancelRef.current || ocrResults[p]?.status === 'done' || ocrResults[p]?.status === 'failed');
    if (processedPages.length > 0) {
      setActiveResultsPage(processedPages[0]);
    }
    setShowResults(true);
  };

  const handleCancelOcr = () => {
    cancelRef.current = true;
    setIsCancelled(true);
  };

  // Text Results Actions
  const handlePageTextChange = (pageNum: number, newText: string) => {
    setOcrResults((prev) => {
      if (!prev[pageNum]) return prev;
      return {
        ...prev,
        [pageNum]: {
          ...prev[pageNum],
          text: newText
        }
      };
    });
  };

  // Consolidates all page text or specific active page text
  const getCompiledText = (mode: 'single' | 'all'): string => {
    if (mode === 'single') {
      return ocrResults[activeResultsPage]?.text || '';
    }
    // Concatenate all pages in sequence
    const sortedPageKeys = Object.keys(ocrResults)
      .map(Number)
      .sort((a, b) => a - b);
    
    return sortedPageKeys
      .map(k => {
        const result = ocrResults[k];
        if (!result || result.status !== 'done') return '';
        return `--- PAGE ${result.pageNum} ---\n\n${result.text}`;
      })
      .filter(Boolean)
      .join('\n\n');
  };

  const handleCopyText = () => {
    const textToCopy = getCompiledText(textMode);
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadTxt = () => {
    const textContent = getCompiledText(textMode);
    if (!textContent) return;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    trackUrl(url);

    const suffix = textMode === 'single' ? `_Page_${activeResultsPage}` : '_Full_Extract';
    const baseName = file ? file.name.replace(/\.pdf$/i, '') : 'Extracted_Text';

    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}${suffix}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadMarkdown = () => {
    const textContent = getCompiledText(textMode);
    if (!textContent) return;

    // Convert into beautiful structural Markdown
    let mdContent = '';
    const sortedPageKeys = Object.keys(ocrResults)
      .map(Number)
      .sort((a, b) => a - b);

    if (textMode === 'single') {
      mdContent = `# Extracted Text: Page ${activeResultsPage}\n\n${ocrResults[activeResultsPage]?.text}`;
    } else {
      mdContent = `# Extracted Document Content\n\n`;
      mdContent += `* **Original File**: ${file?.name || 'Document.pdf'}\n`;
      mdContent += `* **Total Pages**: ${sortedPageKeys.length}\n`;
      mdContent += `* **Extraction Type**: Sequential Tesseract.js OCR\n\n---\n\n`;

      sortedPageKeys.forEach(k => {
        const result = ocrResults[k];
        if (!result || result.status !== 'done') return;
        mdContent += `## Page ${result.pageNum}\n\n${result.text}\n\n---\n\n`;
      });
    }

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    trackUrl(url);

    const suffix = textMode === 'single' ? `_Page_${activeResultsPage}` : '_Full_Extract';
    const baseName = file ? file.name.replace(/\.pdf$/i, '') : 'Extracted_Text';

    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}${suffix}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search occurrence helpers
  const countSearchMatches = (text: string, query: string): number => {
    if (!query.trim() || !text) return 0;
    try {
      const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      return (text.match(regex) || []).length;
    } catch (e) {
      return 0;
    }
  };

  // Get computed confidence score statistics
  const getOcrStats = () => {
    const values = Object.values(ocrResults).filter(r => r.status === 'done' && !r.failed);
    if (values.length === 0) return { avgConfidence: 0, failedPagesCount: 0 };
    const sum = values.reduce((acc, curr) => acc + curr.confidence, 0);
    const avg = Math.round(sum / values.length);
    const failed = Object.values(ocrResults).filter(r => r.status === 'failed' || r.failed).length;
    return { avgConfidence: avg, failedPagesCount: failed };
  };

  const { avgConfidence, failedPagesCount } = getOcrStats();

  const getBlockProgressBar = (pct: number) => {
    const blocksCount = 15;
    const filled = Math.round((pct / 100) * blocksCount);
    const empty = blocksCount - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  // UI Renders
  const renderResultsScreen = () => {
    const activeText = ocrResults[activeResultsPage]?.text || '';
    const matchCountOnActive = countSearchMatches(activeText, searchQuery);
    
    // Sort page results sequentially
    const sortedPageKeys = Object.keys(ocrResults)
      .map(Number)
      .sort((a, b) => a - b);

    return (
      <div className="space-y-6 animate-fade-in text-left">
        {/* Statistics and Highlight Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-150 dark:border-slate-800/60 rounded-2xl">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Average Confidence</p>
              <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{avgConfidence}%</p>
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${failedPagesCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Low Confidence Pages</p>
              <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{failedPagesCount}</p>
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-corporate/10 text-corporate dark:text-gold rounded-xl shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pages Processed</p>
              <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">
                {sortedPageKeys.length} / {totalPages}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Dual Panel Workspace layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel: Processed pages index list */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider px-1">Pages Inventory</h4>
            <div className="border border-slate-150 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950/20 max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm">
              {sortedPageKeys.map((pNum) => {
                const resObj = ocrResults[pNum];
                const isSelected = activeResultsPage === pNum;
                const matches = countSearchMatches(resObj?.text || '', searchQuery);

                return (
                  <div
                    key={pNum}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select Page ${pNum} Text`}
                    onClick={() => {
                      setActiveResultsPage(pNum);
                      setTextMode('single'); // fallback to single page display mode for editing
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveResultsPage(pNum);
                        setTextMode('single');
                      }
                    }}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-900 ${
                      isSelected 
                        ? 'bg-corporate/5 dark:bg-gold/5 border-l-2 border-corporate dark:border-gold' 
                        : 'hover:bg-slate-50/55 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mini Thumbnail */}
                      <div className="w-10 h-12 bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded overflow-hidden shrink-0 flex items-center justify-center">
                        {thumbnails[pNum] ? (
                          <img src={thumbnails[pNum]} alt="" className="object-contain max-h-full max-w-full" referrerPolicy="no-referrer" />
                        ) : (
                          <FileText size={14} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Page {pNum}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {resObj.failed ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-red-500/10 text-red-500 text-[9px] font-bold rounded">
                              Failed
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded ${
                              resObj.confidence >= 80 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : resObj.confidence >= 50
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {resObj.confidence}% Conf
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Search matches indicators */}
                    {matches > 0 && (
                      <span className="px-2 py-0.5 bg-corporate text-white dark:bg-gold dark:text-navy text-[10px] font-black rounded-lg">
                        {matches}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Back button */}
            <button
              onClick={() => {
                setShowResults(false);
                setOcrResults({});
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-150 dark:border-slate-800/80 cursor-pointer transition-colors"
            >
              Restart OCR Extraction
            </button>
          </div>

          {/* Right panel: Search and Text Editor Workspace */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Search and view toggle controllers */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto">
                <button
                  onClick={() => setTextMode('single')}
                  className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    textMode === 'single'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-450 hover:text-slate-800'
                  }`}
                >
                  Edit Page {activeResultsPage}
                </button>
                <button
                  onClick={() => setTextMode('all')}
                  className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    textMode === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-450 hover:text-slate-800'
                  }`}
                >
                  View Entire Document
                </button>
              </div>

              {/* Live search box */}
              <div className="relative w-full md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search extracted text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors"
                  aria-label="Search within extracted text"
                />
                {searchQuery && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-450 dark:text-slate-500 bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {textMode === 'single' ? matchCountOnActive : countSearchMatches(getCompiledText('all'), searchQuery)} matches
                  </span>
                )}
              </div>
            </div>

            {/* Main Textarea Editor / Viewer */}
            <div className="relative border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex flex-col h-[340px]">
              
              {/* Header inside editor */}
              <div className="bg-slate-50/50 dark:bg-slate-950/40 p-3 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                <span>
                  {textMode === 'single' ? `Currently Editing: Page ${activeResultsPage}` : 'Consolidated Document (Read Only)'}
                </span>
                {textMode === 'single' && !ocrResults[activeResultsPage]?.failed && (
                  <span className="text-emerald-500 font-bold">
                    Confidence: {ocrResults[activeResultsPage]?.confidence}%
                  </span>
                )}
              </div>

              <textarea
                value={textMode === 'single' ? activeText : getCompiledText('all')}
                readOnly={textMode === 'all'}
                onChange={(e) => {
                  if (textMode === 'single') {
                    handlePageTextChange(activeResultsPage, e.target.value);
                  }
                }}
                className={`w-full flex-1 p-5 text-sm font-semibold outline-none resize-none bg-transparent text-slate-800 dark:text-slate-200 ${
                  textMode === 'all' ? 'bg-slate-50/10 cursor-not-allowed dark:bg-slate-950/5' : ''
                }`}
                placeholder="No text extracted. Write or edit manually..."
                aria-label="Extracted OCR text content editor"
              />
            </div>

            {/* Extracted file downloads action bar */}
            <div className="flex flex-wrap items-center gap-3 justify-end">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-150 dark:border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copied ? <ClipboardCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-150 dark:border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download size={14} />
                <span>Download TXT</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="px-4 py-2.5 bg-corporate hover:bg-corporate/90 dark:bg-gold dark:hover:bg-amber-500 text-white dark:text-navy font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download size={14} />
                <span>Download Markdown</span>
              </button>
            </div>

          </div>
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
        aria-labelledby="ocr-modal-title"
        aria-describedby="ocr-modal-desc"
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] my-4 md:my-8 animate-scale-in outline-none"
      >
        <span id="ocr-modal-title" className="sr-only">OCR PDF Workspace</span>
        <span id="ocr-modal-desc" className="sr-only">Extract structural textual data from scanned PDF documents client-side.</span>

        {/* Workspace Header */}
        <WorkspaceHeader
          title="OCR PDF (Extract Text) Workspace"
          subtitle="True in-browser OCR processing: Analyze scanned documents and extract text structures entirely offline with local Tesseract.js engine."
          icon={<Languages size={18} />}
          onClose={handleClose}
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 relative min-h-[300px]">
          {pdfLibLoading && (
            <LoadingOverlay message="Initializing high-performance PDF renderer..." />
          )}

          {ocrLibLoading && (
            <LoadingOverlay message="Downloading lightweight Tesseract.js intelligence modules..." />
          )}

          {showResults ? (
            renderResultsScreen()
          ) : !file ? (
            <UploadZone
              onFilesSelected={handleFileChange}
              multiple={false}
              title={
                <>
                  Drag & drop your scanned PDF here, or <span className="text-corporate dark:text-gold hover:underline">browse files</span>
                </>
              }
              description="Requires exactly one valid PDF document. Optical character recognition compiles sequentially inside your browser."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Side: Page Selector parameters */}
              <div className="lg:col-span-7 space-y-5 text-left">
                {/* File Details display */}
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
                    <X size={12} />
                    <span>Change File</span>
                  </button>
                </div>

                {/* Range select options bar */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block px-1">Pages Selection</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectionTypeChange('all')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer font-sans ${
                        selectionType === 'all'
                          ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
                      }`}
                    >
                      Entire Document
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectionTypeChange('range')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer font-sans ${
                        selectionType === 'range'
                          ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
                      }`}
                    >
                      Custom Range
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectionTypeChange('select')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer font-sans ${
                        selectionType === 'select'
                          ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
                      }`}
                    >
                      Select From Grid
                    </button>
                  </div>

                  {/* Range Text input */}
                  {selectionType === 'range' && (
                    <div className="pt-1.5 animate-fade-in space-y-2">
                      <input
                        type="text"
                        value={rangeInput}
                        onChange={(e) => handleRangeInputChange(e.target.value)}
                        onBlur={validateAndSyncRangeInput}
                        placeholder="e.g. 1-3, 5, 8-10"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-xs font-semibold px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors shadow-sm"
                        aria-label="Enter comma separated page numbers or ranges"
                      />
                      <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-relaxed">
                        Enter ranges such as "1-3, 5". Pages must be between 1 and {totalPages}.
                      </p>
                      {rangeError && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">{rangeError}</p>
                      )}
                    </div>
                  )}

                  {/* Visual Page grid */}
                  {selectionType === 'select' && (
                    <div className="space-y-3 animate-fade-in pt-1">
                      <ActionToolbar
                        className="!p-2.5"
                        leftSection={
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={selectAll}
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 font-bold text-[9px] rounded-lg cursor-pointer"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={selectNone}
                              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 font-bold text-[9px] rounded-lg cursor-pointer"
                            >
                              Clear All
                            </button>
                          </div>
                        }
                        rightSection={
                          <span className="text-[10px] font-bold text-corporate dark:text-gold">
                            {selectedPages.size} / {totalPages} selected
                          </span>
                        }
                      />

                      <div className="border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-950/10 p-3 max-h-[220px] overflow-y-auto">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {Array.from({ length: totalPages || 0 }, (_, idx) => {
                            const pNum = idx + 1;
                            const isSelected = selectedPages.has(pNum);
                            const thumbUrl = thumbnails[pNum];

                            return (
                              <div
                                key={pNum}
                                onClick={() => togglePageSelection(pNum)}
                                className={`aspect-[3/4] bg-white dark:bg-slate-900 border-2 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow transition-all flex flex-col justify-between p-1.5 select-none outline-none ${
                                  isSelected 
                                    ? 'border-corporate dark:border-gold ring-1 ring-corporate dark:ring-gold' 
                                    : 'border-slate-200/60 dark:border-slate-800 hover:border-slate-400'
                                }`}
                              >
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                                  <span>Pg {pNum}</span>
                                  <div className={isSelected ? 'text-corporate dark:text-gold' : 'text-slate-300'}>
                                    {isSelected ? <CheckSquare size={10} /> : <Square size={10} />}
                                  </div>
                                </div>
                                <div className="flex-1 flex items-center justify-center overflow-hidden my-1 relative">
                                  {thumbUrl ? (
                                    <img src={thumbUrl} alt="" className="max-h-full max-w-full object-contain rounded" referrerPolicy="no-referrer" />
                                  ) : (
                                    <Loader2 size={10} className="animate-spin text-slate-300" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Language & Run configurations */}
              <div className="lg:col-span-5 space-y-5 text-left border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800/80 lg:pl-6 pt-5 lg:pt-0">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-corporate dark:text-gold" />
                  <h4 className="text-xs font-black text-navy dark:text-white uppercase tracking-wider">OCR Configurations</h4>
                </div>

                {/* Multiple Language checklist selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block px-1">
                    Select Target Languages (Multi-select)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto border border-slate-150 dark:border-slate-800 p-3 rounded-2xl bg-white dark:bg-slate-950/20">
                    {OCR_LANGUAGES.map((lang) => {
                      const isChecked = selectedLangs.includes(lang.code);
                      return (
                        <div
                          key={lang.code}
                          onClick={() => handleLanguageToggle(lang.code)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                            isChecked
                              ? 'border-corporate bg-corporate/5 text-corporate dark:border-gold dark:bg-gold/5 dark:text-gold font-bold'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700 font-semibold'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs truncate">{lang.name}</p>
                            <p className="text-[9px] text-slate-450 dark:text-slate-500 truncate">{lang.nativeName}</p>
                          </div>
                          <div className={`shrink-0 ${isChecked ? 'text-corporate dark:text-gold' : 'text-transparent'}`}>
                            <Check size={14} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Local privacy notice disclaimer */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex gap-3 items-start">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-lg shrink-0">
                    <Sparkles size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      Local Offline OCR Processing
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
                      All structural character processing runs directly in-memory on your local CPU. No document files or scanned data ever leave your machine.
                    </p>
                  </div>
                </div>

                {/* Primary RUN trigger */}
                <button
                  type="button"
                  onClick={handleRunOcr}
                  className="w-full bg-corporate hover:bg-corporate/90 dark:bg-gold dark:hover:bg-amber-500 text-white dark:text-navy font-bold py-3 px-5 rounded-2xl text-xs transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Extract Structural Text (OCR)</span>
                </button>
              </div>

            </div>
          )}

          {isScanning && (
            <LoadingOverlay message="Analyzing PDF container metrics..." />
          )}

          {/* Sequential running page processing progress overlay */}
          {isProcessing && (
            <LoadingOverlay
              message={
                <div className="space-y-4 max-w-sm mx-auto p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 text-left">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Running Character Recognition</p>
                    <p className="text-sm font-bold">Scanning page {currentPageNum} of {totalPages}</p>
                  </div>
                  
                  {/* Visual block progress bar */}
                  <div className="font-mono text-base tracking-widest text-corporate dark:text-gold select-none leading-none">
                    {getBlockProgressBar(processingProgress)}
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>{processingProgress}%</span>
                    <span>Processed {Object.values(ocrResults).filter(r => r.status === 'done' || r.status === 'failed').length} / {totalToProcess} pages</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelOcr}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer mt-2 shadow-sm font-sans"
                  >
                    Cancel Scan & Stop
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
            <button
              type="button"
              onClick={handleClose}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer border border-transparent dark:border-slate-800 font-sans"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
