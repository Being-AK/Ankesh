import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Unlock, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  FileText, 
  CheckSquare, 
  Square, 
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import UploadZone from './UploadZone';
import { formatFileSize } from './utils/fileHelpers';
import { validatePdfFile } from './utils/validation';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import LoadingOverlay from './ui/LoadingOverlay';

interface ScannedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  isEncrypted: boolean;
  pages: number | null;
  status: 'scanning' | 'waiting' | 'decrypting' | 'success' | 'error';
  errorMsg: string | null;
  password: string;
  decryptedBlob: Blob | null;
  errType?: 'wrong_password' | 'unsupported_encryption' | 'corrupted' | 'unexpected';
  isAlreadyUnlocked?: boolean;
}

interface UnlockPdfToolProps {
  onClose: () => void;
}

// Global console capture delegates to intercept and suppress noisy minified qpdf.js console logs
let globalStderrIntercept: ((...args: any[]) => void) | null = null;
let globalLogIntercept: ((...args: any[]) => void) | null = null;

let originalConsoleError: (...args: any[]) => void = typeof console !== 'undefined' ? console.error : () => {};
let originalConsoleLog: (...args: any[]) => void = typeof console !== 'undefined' ? console.log : () => {};

if (typeof window !== 'undefined') {
  originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (globalStderrIntercept) {
      globalStderrIntercept(...args);
    } else {
      originalConsoleError(...args);
    }
  };

  originalConsoleLog = console.log;
  console.log = (...args: any[]) => {
    if (globalLogIntercept) {
      globalLogIntercept(...args);
    } else {
      originalConsoleLog(...args);
    }
  };
}

/*
 * CRITICAL ARCHITECTURAL RULES FOR qpdf.wasm:
 * 1. Why qpdf.wasm must never be edited:
 *    The qpdf.wasm file is a pre-compiled WebAssembly binary built from the C++ source of QPDF using Emscripten.
 *    Any direct text edits or modification attempts to this file will corrupt the WebAssembly section offsets,
 *    causing compilation/instantiation errors like "WebAssembly.instantiate(): section ... extends past end of the module".
 * 
 * 2. Why it must remain a binary file:
 *    WebAssembly is a binary instruction format. It must be kept intact in its raw binary form. Attempting to convert
 *    or bundle it inside javascript or treat it as text will introduce encoding mutations (such as UTF-8 or UTF-16 surrogate pairing)
 *    which alters the byte content and completely breaks WebAssembly compilation.
 * 
 * 3. Why changing the query version (cache-busting query parameter) is required after replacing the binary:
 *    Browsers aggressively cache WebAssembly assets (.wasm files) due to their size. If the binary file on the server is updated or replaced,
 *    the browser may continue to load a stale, cached, or partially corrupt version from memory. Appending or updating the query version
 *    (e.g., `?v=0.3.1`) forces the browser to bypass any outdated caches and download the fresh, valid binary directly.
 */

// Central source of truth for the qpdf.wasm URL path. Using the clean /qpdf.wasm path to enable flawless offline Service Worker caching.
const QPDF_WASM_PATH = '/qpdf.wasm';

let wasmValidated = false;

/**
 * Validates that the qpdf.wasm binary is fully reachable, returns HTTP 200, is served with
 * the proper application/wasm Content-Type (if available), begins with the WebAssembly magic header,
 * and matches the expected binary file size.
 */
async function validateWasmAsset(): Promise<void> {
  if (wasmValidated) {
    return;
  }

  try {
    const response = await fetch(QPDF_WASM_PATH);
    if (!response.ok) {
      throw new Error(`Failed to fetch qpdf.wasm: HTTP status ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/wasm') && !contentType.includes('application/octet-stream')) {
      if (contentType.includes('text/html') || contentType.includes('application/json')) {
        throw new Error(`Unexpected Content-Type: ${contentType}. The asset may have been served as a fallback page.`);
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    
    /*
     * WHY WE VERIFY THE EXPECTED FILE SIZE:
     * Checking the exact WebAssembly binary file size protects the system from:
     * - Truncated downloads due to network instability or early stream termination.
     * - Server-side asset misconfiguration or wrong file mapping issues (e.g., serving a 0-byte file or placeholder).
     * - Corrupt CDN or local proxy caching that serves a partial or broken chunk of the binary file.
     * This provides an early defense before attempting the heavy WebAssembly.instantiate() call.
     */
    const EXPECTED_WASM_SIZE = 1334286; // Size of public/qpdf.wasm in bytes
    const SIZE_TOLERANCE = 1000;       // Small buffer tolerance
    const actualSize = arrayBuffer.byteLength;
    if (Math.abs(actualSize - EXPECTED_WASM_SIZE) > SIZE_TOLERANCE) {
      throw new Error("The PDF engine appears to be corrupted or incomplete. Please refresh the page.");
    }

    if (arrayBuffer.byteLength < 4) {
      throw new Error("The downloaded WebAssembly file is too small (less than 4 bytes).");
    }
    const bytes = new Uint8Array(arrayBuffer, 0, 4);
    if (bytes[0] !== 0x00 || bytes[1] !== 0x61 || bytes[2] !== 0x73 || bytes[3] !== 0x6d) {
      throw new Error("Invalid WebAssembly file header: magic bytes [0x00, 0x61, 0x73, 0x6d] not found.");
    }

    wasmValidated = true;
  } catch (err: any) {
    throw new Error(`WebAssembly Asset Validation Error: ${err.message || err}`);
  }
}

// ============================================================================
// Internal Reusable UI Components
// ============================================================================

interface StatusBadgeProps {
  status: 'scanning' | 'waiting' | 'decrypting' | 'success' | 'error';
  errorMsg: string | null;
}

function StatusBadge({ status, errorMsg }: StatusBadgeProps) {
  if (status === 'scanning') {
    return (
      <span className="inline-flex items-center gap-1.5 text-corporate dark:text-gold">
        <Loader2 size={12} className="animate-spin" />
        <span>Scanning...</span>
      </span>
    );
  }
  if (status === 'waiting') {
    return (
      <span className="inline-flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full text-[11px]">
        <span>Waiting</span>
      </span>
    );
  }
  if (status === 'decrypting') {
    return (
      <span className="inline-flex items-center gap-1.5 text-orange-500">
        <Loader2 size={12} className="animate-spin" />
        <span>Decrypting...</span>
      </span>
    );
  }
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-[11px]">
        <CheckCircle2 size={11} />
        <span>Unlocked</span>
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 px-2.5 py-0.5 rounded-full text-[11px]" title={errorMsg || 'Decryption failed'}>
        <XCircle size={11} />
        <span className="max-w-[120px] truncate">{errorMsg || 'Failed'}</span>
      </span>
    );
  }
  return null;
}

interface PasswordRowInputProps {
  itemId: string;
  value: string;
  showPassword: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  fileName: string;
}

function PasswordRowInput({ value, showPassword, onChange, onToggleVisibility, fileName }: PasswordRowInputProps) {
  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Password"
        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-corporate dark:focus:border-gold pr-8"
        aria-label={`Password for ${fileName}`}
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
        aria-label={showPassword ? "Hide Password" : "Show Password"}
      >
        {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
      </button>
    </div>
  );
}

interface SummaryCardProps {
  value: number | string;
  label: string;
  colorClass?: string;
  className?: string;
}

function SummaryCard({ value, label, colorClass = "text-slate-800 dark:text-white", className = "" }: SummaryCardProps) {
  return (
    <div className={`text-center p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm ${className}`}>
      <p className={`text-2xl font-black ${colorClass}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mt-1">{label}</p>
    </div>
  );
}

interface ProgressRowProps {
  percent: number;
  current: number;
  total: number;
}

function ProgressRow({ percent, current, total }: ProgressRowProps) {
  const getBlockProgressBar = (pct: number) => {
    const totalBlocks = 15;
    const filledBlocks = Math.round((pct / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Progress Bar graphics */}
      <div className="font-mono text-base tracking-widest text-corporate dark:text-gold select-none leading-none">
        {getBlockProgressBar(percent)}
      </div>
      
      {/* Percent & Count status */}
      <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
        <span>{percent}%</span>
        <span>{current} / {total} PDFs</span>
      </div>
    </div>
  );
}

// ============================================================================
// Custom Hooks for State Encapsulation
// ============================================================================

function useProcessingState() {
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [totalToProcess, setTotalToProcess] = useState<number>(0);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const cancelRef = useRef<boolean>(false);

  const resetProcessing = useCallback((total: number) => {
    setCurrentFileIndex(0);
    setCurrentFileName('');
    setTotalToProcess(total);
    setIsCancelled(false);
    cancelRef.current = false;
  }, []);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
    setIsCancelled(true);
  }, []);

  const progressPercentage = totalToProcess > 0 ? Math.round((currentFileIndex / totalToProcess) * 100) : 0;

  return {
    currentFileIndex,
    setCurrentFileIndex,
    currentFileName,
    setCurrentFileName,
    totalToProcess,
    setTotalToProcess,
    isCancelled,
    setIsCancelled,
    cancelRef,
    resetProcessing,
    handleCancel,
    progressPercentage
  };
}

function useScannedFilesStats(scannedFiles: ScannedFile[]) {
  return React.useMemo(() => {
    const totalFilesCount = scannedFiles.length;
    const lockedCount = scannedFiles.filter((f) => f.isEncrypted).length;
    const successCount = scannedFiles.filter((f) => f.status === 'success').length;
    const errorCount = scannedFiles.filter((f) => f.status === 'error').length;
    const readyFilesCount = scannedFiles.filter(f => f.status === 'success' && f.decryptedBlob).length;
    
    const unlockedCount = scannedFiles.filter(f => f.isEncrypted && f.status === 'success').length;
    const alreadyUnlockedCount = scannedFiles.filter(f => !f.isEncrypted && f.status === 'success').length;
    const failedCount = scannedFiles.filter(f => f.status === 'error').length;
    const skippedCount = scannedFiles.filter(f => f.status === 'waiting').length;

    return {
      totalFilesCount,
      lockedCount,
      successCount,
      errorCount,
      readyFilesCount,
      unlockedCount,
      alreadyUnlockedCount,
      failedCount,
      skippedCount
    };
  }, [scannedFiles]);
}

// ============================================================================
// Main Workspace Component
// ============================================================================

export default function UnlockPdfTool({ onClose }: UnlockPdfToolProps) {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const checkMd = () => setIsMd(window.innerWidth >= 768);
    checkMd();
    window.addEventListener('resize', checkMd);
    return () => window.removeEventListener('resize', checkMd);
  }, []);

  // Core State
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [useCommonPassword, setUseCommonPassword] = useState<boolean>(true);
  const [commonPassword, setCommonPassword] = useState<string>('');
  const [showCommonPassword, setShowCommonPassword] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [processingSuccess, setProcessingSuccess] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [successfulPasswords, setSuccessfulPasswords] = useState<string[]>([]);
  const [showRowPassword, setShowRowPassword] = useState<Record<string, boolean>>({});

  // Encapsulated Processing & Summary Statistics State Hooks
  const {
    currentFileIndex,
    setCurrentFileIndex,
    currentFileName,
    setCurrentFileName,
    totalToProcess,
    isCancelled,
    cancelRef,
    resetProcessing,
    handleCancel,
    progressPercentage
  } = useProcessingState();

  const {
    totalFilesCount,
    lockedCount,
    successCount,
    errorCount,
    readyFilesCount,
    unlockedCount,
    alreadyUnlockedCount,
    failedCount,
    skippedCount
  } = useScannedFilesStats(scannedFiles);

  // Refs for Accessibility & Resource Cleanup
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const createdUrlsRef = useRef<string[]>([]);

  // Track and cleanup Blob Object URLs
  const trackUrl = useCallback((url: string) => {
    createdUrlsRef.current.push(url);
  }, []);

  // Clean up states
  const clearState = useCallback(() => {
    setScannedFiles([]);
    setCommonPassword('');
    setProcessingError(null);
    setProcessingSuccess(false);
    setIsProcessing(false);
    setShowSummary(false);
    setSuccessfulPasswords([]);
    resetProcessing(0);
  }, [resetProcessing]);

  const handleClose = () => {
    clearState();
    onClose();
  };

  // Accessibility: Focus trap, modal attributes, escape to close
  useEffect(() => {
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    if (modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        modalRef.current.focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!modalRef.current.contains(document.activeElement)) {
          firstElement.focus();
          e.preventDefault();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      
      // Cleanup all tracked URLs on unmount to prevent leaks
      createdUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      });
      createdUrlsRef.current = [];

      // Restore focus to original trigger element
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, []);

  // Perform initial scan of uploaded PDFs to detect encryption & read page counts
  const handleFilesSelected = async (files: File[]) => {
    setProcessingError(null);
    setProcessingSuccess(false);
    setScanProgress(true);

    const validFiles = files.filter(f => {
      const v = validatePdfFile(f);
      return v.isValid;
    });

    if (validFiles.length === 0) {
      setProcessingError('No valid PDF files selected.');
      setScanProgress(false);
      return;
    }

    const newScanned = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      isEncrypted: false,
      pages: null as number | null,
      status: 'scanning' as const,
      errorMsg: null as string | null,
      password: '',
      decryptedBlob: null as Blob | null,
    }));

    setScannedFiles((prev) => [...prev, ...newScanned]);

    // Read pages or encryption status sequentially to minimize memory usage
    for (const item of newScanned) {
      try {
        const arrayBuffer = await item.file.arrayBuffer();
        const { PDFDocument } = await import('pdf-lib');
        
        try {
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const pages = pdfDoc.getPageCount();
          
          setScannedFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { 
                    ...f, 
                    isEncrypted: false, 
                    pages, 
                    status: 'success', 
                    decryptedBlob: new Blob([arrayBuffer], { type: 'application/pdf' }),
                    isAlreadyUnlocked: true 
                  }
                : f
            )
          );
        } catch (loadErr: any) {
          const errorStr = loadErr.message || String(loadErr);
          if (
            errorStr.toLowerCase().includes('encrypt') || 
            errorStr.toLowerCase().includes('password') ||
            loadErr.name === 'EncryptedPDFError' ||
            errorStr.includes('EncryptFilterNotDefinedError')
          ) {
            // File is password-protected
            setScannedFiles((prev) =>
              prev.map((f) =>
                f.id === item.id
                  ? { ...f, isEncrypted: true, status: 'waiting' }
                  : f
              )
            );
          } else {
            // General corrupt or load file issue
            setScannedFiles((prev) =>
              prev.map((f) =>
                f.id === item.id
                  ? { 
                      ...f, 
                      status: 'error', 
                      errorMsg: 'The PDF appears to be damaged or unreadable.',
                      errType: 'corrupted'
                    }
                  : f
              )
            );
          }
        }
      } catch (err: any) {
        console.error("Unlock PDF error:", err);
        const devMode = import.meta.env.DEV || (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');
        
        const errStr = (err?.message || String(err) || '').toLowerCase();
        let errorMsg = '';
        if (errStr.includes('corrupt') || errStr.includes('damaged') || errStr.includes('truncated') || errStr.includes('not a pdf')) {
          errorMsg = 'Corrupted PDF / Invalid PDF: The document appears to be damaged or unreadable.';
        } else if (errStr.includes('import') || errStr.includes('module')) {
          errorMsg = 'Import failure: qpdf module initialization failed.';
        } else {
          errorMsg = devMode
            ? `Unexpected Error:\n${err?.message || String(err)}`
            : 'An unexpected error occurred while processing the document.';
        }

        setScannedFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { 
                  ...f, 
                  status: 'error', 
                  errorMsg: errorMsg,
                  errType: 'unexpected'
                }
              : f
          )
        );
      }
    }

    setScanProgress(false);
  };

  const removeFile = (id: string) => {
    setScannedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateRowPassword = (id: string, value: string) => {
    setScannedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, password: value } : f))
    );
  };

  const toggleRowPasswordVisibility = (id: string) => {
    setShowRowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // True Browser-Side PDF Decryption utilizing @neslinesli93/qpdf-wasm
  const decryptSingleFile = async (
    file: File, 
    password?: string
  ): Promise<{ 
    success: boolean; 
    blob?: Blob; 
    error?: string; 
    pageCount?: number; 
    errType?: 'wrong_password' | 'unsupported_encryption' | 'corrupted' | 'unexpected' 
  }> => {
    let stderrText = '';
    let qpdf: any = null;
    let exitCode = -1;
    
    // Set up interceptors to absorb any stdout/stderr logs printed by the WASM module
    globalStderrIntercept = (msg: any) => {
      stderrText += String(msg) + '\n';
    };
    globalLogIntercept = (msg: any) => {
      stderrText += String(msg) + '\n';
    };

    try {
      // Validate that the qpdf.wasm asset is reachable and has valid binary headers
      await validateWasmAsset();

      let createModuleDefault;
      try {
        createModuleDefault = await import('@neslinesli93/qpdf-wasm');
      } catch (importErr: any) {
        originalConsoleError("Dynamic import of @neslinesli93/qpdf-wasm failed:", importErr);
        throw importErr;
      }

      const createModule = createModuleDefault.default;

      try {
        qpdf = await createModule({
          locateFile: (wasmPath: string) => {
            if (wasmPath.endsWith('.wasm')) {
              return QPDF_WASM_PATH;
            }
            return wasmPath;
          },
          printErr: (msg: string) => {
            stderrText += msg + '\n';
          }
        } as any);
      } catch (wasmLoadErr: any) {
        originalConsoleError("WASM module creation/instantiation failed:", wasmLoadErr);
        throw wasmLoadErr;
      }

      const fileId = Math.random().toString(36).substring(7);
      const inputPath = `/input_${fileId}.pdf`;
      const outputPath = `/output_${fileId}.pdf`;

      let uint8Array: Uint8Array;
      try {
        const fileBuffer = await file.arrayBuffer();
        uint8Array = new Uint8Array(fileBuffer);
      } catch (bufErr: any) {
        originalConsoleError("Buffer conversion failed:", bufErr);
        throw bufErr;
      }

      try {
        qpdf.FS.writeFile(inputPath, uint8Array);
      } catch (fsErr: any) {
        originalConsoleError("FS.writeFile failed:", fsErr);
        throw fsErr;
      }

      const args = password 
        ? [`--password=${password}`, '--decrypt', inputPath, outputPath]
        : ['--decrypt', inputPath, outputPath];

      try {
        exitCode = qpdf.callMain(args);
      } catch (wasmRuntimeErr: any) {
        try { qpdf.FS.unlink(inputPath); } catch (e) {}
        try { qpdf.FS.unlink(outputPath); } catch (e) {}
        throw wasmRuntimeErr;
      }

      if (exitCode === 0 || exitCode === 3) {
        let outputFile;
        try {
          outputFile = qpdf.FS.readFile(outputPath);
        } catch (readFsErr: any) {
          try { qpdf.FS.unlink(inputPath); qpdf.FS.unlink(outputPath); } catch (e) {}
          throw readFsErr;
        }
        
        try {
          qpdf.FS.unlink(inputPath);
          qpdf.FS.unlink(outputPath);
        } catch (cleanupErr: any) {}

        const outBlob = new Blob([outputFile], { type: 'application/pdf' });

        let pageCount: number | undefined;
        try {
          const { PDFDocument } = await import('pdf-lib');
          const pdfDoc = await PDFDocument.load(await outBlob.arrayBuffer());
          pageCount = pdfDoc.getPageCount();
        } catch (err: any) {
          // Fail gracefully if reading page count fails on decrypted document
        }

        return { success: true, blob: outBlob, pageCount };
      } else {
        try {
          qpdf.FS.unlink(inputPath);
        } catch (cleanupErr: any) {}
        try {
          qpdf.FS.unlink(outputPath);
        } catch (cleanupErr: any) {}

        let errType: 'wrong_password' | 'unsupported_encryption' | 'corrupted' | 'unexpected' = 'unexpected';
        let errorMsg = '';

        const lowerStderr = stderrText.toLowerCase();
        if (!password) {
          errType = 'wrong_password';
          errorMsg = 'Password missing or incorrect.';
        } else if (lowerStderr.includes('password') || lowerStderr.includes('incorrect') || lowerStderr.includes('invalid') || lowerStderr.includes('wrong')) {
          errType = 'wrong_password';
          errorMsg = 'Password missing or incorrect.';
        } else if (lowerStderr.includes('unsupported') || lowerStderr.includes('algorithm') || lowerStderr.includes('crypt filter')) {
          errType = 'unsupported_encryption';
          errorMsg = 'Unsupported encryption: This document uses an encryption method that is not currently supported.';
        } else if (lowerStderr.includes('corrupt') || lowerStderr.includes('damaged') || lowerStderr.includes('truncated') || lowerStderr.includes('not a pdf')) {
          errType = 'corrupted';
          errorMsg = 'Corrupted PDF / Invalid PDF: The document appears to be damaged or unreadable.';
        } else {
          const qpdfErr = new Error(`QPDF failed with exit code ${exitCode}. Stderr: ${stderrText}`);
          originalConsoleError("Unlock PDF error:", qpdfErr);
          const devMode = import.meta.env.DEV || (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');
          errorMsg = devMode 
            ? `Unexpected Error:\nQPDF failed with exit code ${exitCode}. Stderr:\n${stderrText}`
            : 'An unexpected error occurred while processing the document.';
        }

        return { success: false, error: errorMsg, errType };
      }
    } catch (err: any) {
      if (qpdf) {
        try {
          const files = qpdf.FS.readdir('/');
          files.forEach((f: string) => {
            if (f.startsWith('input_') || f.startsWith('output_')) {
              qpdf.FS.unlink('/' + f);
            }
          });
        } catch (e: any) {}
      }

      originalConsoleError("Unlock PDF pipeline exception occurred:", err);

      const errStr = (err?.message || String(err) || '').toLowerCase();
      const combinedError = (errStr + '\n' + stderrText).toLowerCase();

      let errType: 'wrong_password' | 'unsupported_encryption' | 'corrupted' | 'unexpected' = 'unexpected';
      let errorMsg = '';

      if (combinedError.includes('password') || combinedError.includes('incorrect') || combinedError.includes('invalid') || combinedError.includes('wrong')) {
        errType = 'wrong_password';
        errorMsg = 'Password missing or incorrect.';
      } else if (combinedError.includes('unsupported') || combinedError.includes('algorithm') || combinedError.includes('crypt filter')) {
        errType = 'unsupported_encryption';
        errorMsg = 'Unsupported encryption: This document uses an encryption method that is not currently supported.';
      } else if (combinedError.includes('corrupt') || combinedError.includes('damaged') || combinedError.includes('truncated') || combinedError.includes('not a pdf')) {
        errType = 'corrupted';
        errorMsg = 'Corrupted PDF / Invalid PDF: The document appears to be damaged or unreadable.';
      } else {
        const devMode = import.meta.env.DEV || (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');
        
        if (combinedError.includes('fetch') || combinedError.includes('404') || combinedError.includes('wasm')) {
          errorMsg = "qpdf.wasm failed to load: Missing /qpdf.wasm or network fetch error.";
        } else if (combinedError.includes('import') || combinedError.includes('module')) {
          errorMsg = "Import failure: qpdf module initialization failed.";
        } else if (combinedError.includes('fs') || combinedError.includes('filesystem') || combinedError.includes('writefile') || combinedError.includes('readfile')) {
          errorMsg = "File system (FS) error: Failed to process files in virtual sandbox memory.";
        } else if (combinedError.includes('runtime') || combinedError.includes('exception')) {
          errorMsg = "WASM runtime exception: An error occurred executing WebAssembly instructions.";
        } else {
          errorMsg = devMode 
            ? `Unexpected Error:\n${err?.message || String(err)}\nStderr:\n${stderrText}`
            : 'An unexpected error occurred while processing the document.';
        }
      }

      return { 
        success: false, 
        error: errorMsg, 
        errType 
      };
    } finally {
      // Release interceptors so that ordinary application logging remains normal
      globalStderrIntercept = null;
      globalLogIntercept = null;
    }
  };

  const handleDecryptAll = async () => {
    try {
      const lockedFiles = scannedFiles.filter(f => f.isEncrypted && f.status !== 'success');
      
      if (lockedFiles.length === 0) {
        setProcessingError('No locked PDF files require decryption.');
        return;
      }

      if (useCommonPassword && !commonPassword) {
        setProcessingError('Please enter a decryption password.');
        return;
      }

      setProcessingError(null);
      setProcessingSuccess(false);
      setIsProcessing(true);
      resetProcessing(lockedFiles.length);

      let localSuccessfulPasswords = [...successfulPasswords];
      let currentIdx = 0;

      // Sequential process loop to maintain light memory footprint
      for (const item of scannedFiles) {
        // Graceful cancellation check
        if (cancelRef.current) {
          break;
        }

        if (!item.isEncrypted || item.status === 'success') {
          continue;
        }

        setCurrentFileIndex(currentIdx + 1);
        setCurrentFileName(item.name);

        setScannedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'decrypting' } : f))
        );

        let triedPassword = useCommonPassword ? commonPassword : item.password;

        let result: any = { 
          success: false, 
          blob: undefined as Blob | undefined, 
          pageCount: undefined as number | undefined, 
          error: '', 
          errType: undefined as any 
        };

        // 1. Attempt decryption with specified password first
        if (triedPassword) {
          try {
            result = await decryptSingleFile(item.file, triedPassword);
          } catch (decryptErr: any) {
            originalConsoleError("Failed to decrypt: decryptSingleFile threw exception:", decryptErr);
            throw decryptErr;
          }
        }

        // 2. Smart Password Reuse: If fail, attempt previously successful passwords
        if (!result.success && localSuccessfulPasswords.length > 0) {
          for (const prevPass of localSuccessfulPasswords) {
            if (prevPass === triedPassword) continue;
            try {
              const retryResult = await decryptSingleFile(item.file, prevPass);
              if (retryResult.success) {
                result = retryResult;
                triedPassword = prevPass;
                break;
              }
            } catch (retryErr: any) {
              originalConsoleError("Failed retry: decryptSingleFile threw exception:", retryErr);
              throw retryErr;
            }
          }
        }

        // 3. Final state update based on result
        if (result.success && result.blob) {
          if (triedPassword && !localSuccessfulPasswords.includes(triedPassword)) {
            localSuccessfulPasswords.push(triedPassword);
            setSuccessfulPasswords(localSuccessfulPasswords);
          }

          setScannedFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { 
                    ...f, 
                    status: 'success', 
                    pages: result.pageCount ?? null,
                    decryptedBlob: result.blob!,
                    password: triedPassword || ''
                  }
                : f
            )
          );
        } else {
          setScannedFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { 
                    ...f, 
                    status: 'error', 
                    errorMsg: result.error || 'Decryption failed',
                    errType: result.errType || 'unexpected'
                  }
                : f
            )
          );
        }

        currentIdx++;
      }

      setIsProcessing(false);
      setShowSummary(true);

      const currentFiles = scannedFiles;
      const hasUnlocks = currentFiles.some(f => f.status === 'success' && f.isEncrypted);
      const hasErrors = currentFiles.some(f => f.status === 'error');

      if (cancelRef.current) {
        setProcessingError('Processing was cancelled. Unlocked documents can be downloaded below.');
      } else if (hasUnlocks && !hasErrors) {
        setProcessingSuccess(true);
      } else if (hasErrors) {
        setProcessingError('Some PDF documents could not be decrypted. Please verify their passwords.');
      }
    } catch (err: any) {
      originalConsoleError("Failed in handleDecryptAll:", err);
    }
  };

  const generateUnlockReportText = (files: ScannedFile[]): string => {
    return files.map((f) => {
      let statusStr = "";
      if (f.status === 'success') {
        statusStr = f.isEncrypted ? "Unlocked" : "Already Unlocked";
      } else if (f.status === 'error') {
        if (f.errType === 'wrong_password') {
          statusStr = "Wrong Password";
        } else if (f.errType === 'unsupported_encryption') {
          statusStr = "Unsupported Encryption";
        } else if (f.errType === 'corrupted') {
          statusStr = "Corrupted PDF";
        } else {
          statusStr = "Unexpected Error";
        }
      } else if (f.status === 'waiting') {
        statusStr = "Skipped (Cancelled)";
      } else {
        statusStr = "Pending";
      }
      return `${f.name}\n${statusStr}\n`;
    }).join('\n');
  };

  const handleDownloadReportOnly = () => {
    const reportText = generateUnlockReportText(scannedFiles);
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, 'Unlock_Report.txt');
  };

  // Trigger individual or bundled downloads
  const handleDownloadAll = async () => {
    const readyFiles = scannedFiles.filter(f => f.status === 'success' && f.decryptedBlob);

    if (readyFiles.length === 0) return;

    if (readyFiles.length === 1 && scannedFiles.length === 1) {
      // Single PDF download (no ZIP needed)
      const target = readyFiles[0];
      const baseName = target.name.replace(/\.pdf$/i, '');
      const downloadName = `${baseName}_unlocked.pdf`;
      triggerBlobDownload(target.decryptedBlob!, downloadName);
    } else {
      // Multiple files - Bundle inside a .zip file and include Unlock_Report.txt
      try {
        const JSZipDefault = await import('jszip');
        const JSZip = JSZipDefault.default;
        const zip = new JSZip();

        readyFiles.forEach((item) => {
          const baseName = item.name.replace(/\.pdf$/i, '');
          zip.file(`${baseName}_unlocked.pdf`, item.decryptedBlob!);
        });

        // Add the Unlock_Report.txt report
        const reportText = generateUnlockReportText(scannedFiles);
        zip.file('Unlock_Report.txt', reportText);

        const zipContent = await zip.generateAsync({ type: 'blob' });
        triggerBlobDownload(zipContent, 'unlocked_documents.zip');
      } catch (err) {
        console.error('ZIP compilation failed:', err);
        setProcessingError('Failed to compile files into ZIP bundle.');
      }
    }
  };

  const triggerBlobDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    trackUrl(url);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Immediate cleanup of Object URL
    try {
      URL.revokeObjectURL(url);
    } catch (e) {}
    createdUrlsRef.current = createdUrlsRef.current.filter((u) => u !== url);
  };

  const handleBackToWorkspace = () => {
    setShowSummary(false);
    setProcessingSuccess(false);
    setProcessingError(null);
  };

  const renderSummaryScreen = () => {
    return (
      <div className="space-y-6 animate-fade-in py-4 text-left">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-full mb-2">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-navy dark:text-white">Processing Complete</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isCancelled 
              ? "Decryption process was cancelled. Finished documents can be downloaded below." 
              : "Cryptographic local decryption flow completed successfully."}
          </p>
        </div>

        {/* Stats Grid using standard UI SummaryCard component */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-5 border border-slate-150 dark:border-slate-800/60 rounded-3xl">
          <SummaryCard value={totalFilesCount} label="Total Files" />
          <SummaryCard value={unlockedCount} label="Unlocked" colorClass="text-emerald-500" />
          <SummaryCard value={alreadyUnlockedCount} label="Already Unlocked" colorClass="text-corporate dark:text-gold" />
          <SummaryCard value={failedCount} label="Failed" colorClass="text-red-500" />
          <SummaryCard value={skippedCount} label="Skipped" colorClass="text-slate-450 dark:text-slate-500" className="col-span-2 md:col-span-1" />
        </div>

        {/* Detailed file outcomes list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm">
          <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 flex justify-between items-center">
            <span>Processed Document Details</span>
            <button
              onClick={handleDownloadReportOnly}
              className="text-corporate dark:text-gold hover:underline text-[10px] font-bold uppercase tracking-wider cursor-pointer font-sans"
            >
              Download Unlock_Report.txt
            </button>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto text-xs font-semibold text-slate-700 dark:text-slate-300">
            {scannedFiles.map((f) => {
              let icon = <FileText size={14} className="text-slate-400" />;
              let statusText = "Pending";
              let statusClass = "text-slate-400";

              if (f.status === 'success') {
                icon = <FileText size={14} className="text-emerald-500" />;
                statusText = f.isEncrypted ? "Unlocked" : "Already Unlocked";
                statusClass = "text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[10px]";
              } else if (f.status === 'error') {
                icon = <FileText size={14} className="text-red-500" />;
                if (f.errType === 'wrong_password') statusText = "Wrong Password";
                else if (f.errType === 'unsupported_encryption') statusText = "Unsupported Encryption";
                else if (f.errType === 'corrupted') statusText = "Corrupted PDF";
                else statusText = "Unexpected Error";
                statusClass = "text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md text-[10px]";
              } else if (f.status === 'waiting') {
                statusText = "Skipped";
                statusClass = "text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px]";
              }

              return (
                <li key={f.id} className="p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 truncate">
                    {icon}
                    <span className="truncate" title={f.name}>{f.name}</span>
                  </div>
                  <span className={`${statusClass} shrink-0`}>{statusText}</span>
                </li>
              );
            })}
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
        aria-labelledby="unlock-modal-title"
        aria-describedby="unlock-modal-description"
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] my-4 md:my-8 animate-scale-in relative outline-none"
      >
        {/* Hidden Screen Reader labels for Accessible Dialog standards */}
        <span id="unlock-modal-title" className="sr-only">Unlock PDF Workspace</span>
        <span id="unlock-modal-description" className="sr-only">Genuine client-side decryption: Remove PDF passwords locally with secure WASM sandboxing</span>
        
        {/* Workspace Header */}
        <WorkspaceHeader
          title="Unlock PDF Workspace"
          subtitle="Genuine client-side decryption: Remove PDF passwords locally with secure WASM sandboxing"
          icon={<Unlock size={18} />}
          onClose={handleClose}
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 relative">
          
          {showSummary ? (
            renderSummaryScreen()
          ) : !scannedFiles.length ? (
            <UploadZone
              onFilesSelected={handleFilesSelected}
              multiple={true}
              title={
                <>
                  Drag and drop locked PDF documents here, or <span className="text-corporate dark:text-gold hover:underline">browse</span>
                </>
              }
              description="Supports scanning multiple encrypted PDFs. Decryption runs entirely locally inside your browser."
            />
          ) : (
            <div className="space-y-6">
              
              {/* Scan Results Table */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 border border-slate-150 dark:border-slate-800/60 rounded-3xl space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    <h4 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Document Scan Inventory</h4>
                  </div>
                  <button 
                    onClick={clearState}
                    className="text-slate-400 hover:text-red-500 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer font-sans"
                    aria-label="Clear All Selected Files"
                  >
                    <Trash2 size={13} />
                    <span>Clear All</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Filename</th>
                        <th className="py-3 px-4">Pages</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Encrypted?</th>
                        <th className="py-3 px-4">Status</th>
                        {!useCommonPassword && <th className="py-3 px-4 w-52">Password</th>}
                        <th className="py-3 px-4 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {scannedFiles.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition-colors">
                          <td className="py-3.5 px-4 max-w-xs truncate flex items-center gap-2.5">
                            <span className="p-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg shrink-0">
                              <FileText size={14} />
                            </span>
                            <span className="truncate" title={item.name}>{item.name}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {item.pages !== null ? `${item.pages} pgs` : '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {formatFileSize(item.size)}
                          </td>
                          <td className="py-3.5 px-4">
                            {item.isEncrypted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                                <Lock size={10} />
                                <span>Yes</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <Unlock size={10} />
                                <span>No</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={item.status} errorMsg={item.errorMsg} />
                          </td>
                          
                          {/* Row password fields (when common password toggle is off) */}
                          {!useCommonPassword && (
                            <td className="py-3.5 px-4">
                              {item.isEncrypted && item.status !== 'success' ? (
                                <PasswordRowInput
                                  itemId={item.id}
                                  value={item.password}
                                  showPassword={!!showRowPassword[item.id]}
                                  onChange={(val) => updateRowPassword(item.id, val)}
                                  onToggleVisibility={() => toggleRowPasswordVisibility(item.id)}
                                  fileName={item.name}
                                />
                              ) : (
                                <span className="text-slate-400 text-[10px]">—</span>
                              )}
                            </td>
                          )}

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => removeFile(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850/60 transition-all cursor-pointer"
                              aria-label={`Remove file ${item.name}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Password Workflow Options */}
              {lockedCount > 0 && scannedFiles.some(f => f.status !== 'success') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-950/20 p-5 border border-slate-150 dark:border-slate-800/60 rounded-3xl items-center text-left">
                  
                  {/* Left Column: Toggle */}
                  <div className="md:col-span-1 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-corporate dark:bg-gold rounded-full"></span>
                      <h4 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Password Mapping</h4>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setUseCommonPassword(!useCommonPassword)}
                      className="flex items-start gap-2.5 cursor-pointer select-none group text-left w-full focus:outline-none"
                    >
                      <div className="text-corporate dark:text-gold shrink-0 mt-0.5">
                        {useCommonPassword ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-corporate dark:group-hover:text-gold transition-colors">
                          One password for all locked PDFs
                        </p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500">
                          Applies a single key to decrypt all selected files.
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Right Column: Single password input */}
                  {useCommonPassword && (
                    <div className="md:col-span-2 space-y-1">
                      <label htmlFor="common-password-input" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                        Common Access Password (Required to Decrypt)
                      </label>
                      <div className="relative">
                        <input
                          id="common-password-input"
                          type={showCommonPassword ? 'text' : 'password'}
                          value={commonPassword}
                          onChange={(e) => {
                            setCommonPassword(e.target.value);
                            setProcessingError(null);
                          }}
                          placeholder="Enter password..."
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold pl-3.5 pr-10 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCommonPassword(!showCommonPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition-colors"
                          aria-label={showCommonPassword ? "Hide common password" : "Show common password"}
                        >
                          {showCommonPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Offline Warning Banner standard AlertBanner migration */}
              <AlertBanner 
                type="success" 
                message="Secured Client-Side Decryption Stream" 
                description="This decryption action performs standard cryptographic key negotiation using industrial WebAssembly routines completely inside your browser sandbox. No file chunks are ever uploaded or transmitted out of your computer." 
              />

            </div>
          )}

          {/* Shared LoadingOverlay components integration */}
          {scanProgress && (
            <LoadingOverlay message="Scanning PDF structures..." />
          )}

          {/* Professional Processing Progress Overlay */}
          {isProcessing && (
            <LoadingOverlay
              message={
                <div className="space-y-4 max-w-sm mx-auto p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 text-left">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Decrypting Document</p>
                    <p className="text-sm font-bold truncate max-w-[280px]" title={currentFileName}>{currentFileName}</p>
                  </div>
                  
                  <ProgressRow percent={progressPercentage} current={currentFileIndex} total={totalToProcess} />

                  {/* Graceful Cancel Trigger */}
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer mt-2 shadow-sm font-sans"
                  >
                    Cancel Processing
                  </button>
                </div>
              }
            />
          )}

          {processingError && !showSummary && (
            <AlertBanner type="error" message={processingError} />
          )}

          {processingSuccess && !showSummary && (
            <AlertBanner 
              type="success" 
              message="PDF Documents Unlocked Successfully!" 
              description={`Decrypted ${successCount} out of ${totalFilesCount} uploaded document(s) with true cryptographic password removal.`} 
            />
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-950/10 shrink-0">
          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold text-left">
            {totalFilesCount > 0 && (
              <span>Inventory: {totalFilesCount} file(s) ({lockedCount} locked, {successCount} decrypted, {errorCount} failed)</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {showSummary ? (
              <>
                <button
                  type="button"
                  onClick={handleBackToWorkspace}
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
                {readyFilesCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadAll}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg font-sans"
                  >
                    <Download size={14} />
                    <span>Download {readyFilesCount > 1 ? 'ZIP Archive' : 'Decrypted PDF'}</span>
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
                
                {totalFilesCount > 0 && successCount === totalFilesCount ? (
                  <button
                    type="button"
                    onClick={handleDownloadAll}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all duration-300 animate-pulse hover:animate-none font-sans"
                  >
                    <Download size={14} />
                    <span>Download Decrypted Document{totalFilesCount > 1 ? 's (ZIP)' : ''}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDecryptAll}
                    disabled={isProcessing || totalFilesCount === 0 || scanProgress}
                    className={`font-bold py-2.5 px-6 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 shadow-md cursor-pointer font-sans ${
                      isProcessing || totalFilesCount === 0 || scanProgress
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed shadow-none'
                        : 'bg-corporate hover:bg-corporate/90 text-white dark:bg-gold dark:text-navy dark:hover:bg-amber-500'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Decrypting Documents...</span>
                      </>
                    ) : (
                      <>
                        <Unlock size={14} />
                        <span>Decrypt PDF Documents</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
