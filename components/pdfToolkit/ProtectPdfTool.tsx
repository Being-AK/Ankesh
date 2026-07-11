import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Lock, 
  FileText, 
  Loader2,
  CheckSquare,
  Square,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import UploadZone from './UploadZone';
import { formatFileSize } from './utils/fileHelpers';
import { readPdfDocument } from './utils/pdfHelpers';
import { validatePdfFile } from './utils/validation';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import FileList from './ui/FileList';

interface ProtectPdfToolProps {
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

export default function ProtectPdfTool({ onClose }: ProtectPdfToolProps) {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const checkMd = () => setIsMd(window.innerWidth >= 768);
    checkMd();
    window.addEventListener('resize', checkMd);
    return () => window.removeEventListener('resize', checkMd);
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [outputName, setOutputName] = useState<string>('protected_document.pdf');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Password Setup States
  const [userPassword, setUserPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [ownerPassword, setOwnerPassword] = useState<string>('');
  
  // Visibility States
  const [showUserPassword, setShowUserPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState<boolean>(false);

  // Permissions States
  const [allowPrinting, setAllowPrinting] = useState<boolean>(true);
  const [allowCopying, setAllowCopying] = useState<boolean>(true);
  const [allowEditing, setAllowEditing] = useState<boolean>(false);
  const [allowAnnotation, setAllowAnnotation] = useState<boolean>(true);

  // Processing & Success State
  const [isProtecting, setIsProtecting] = useState<boolean>(false);
  const [protectedBlob, setProtectedBlob] = useState<Blob | null>(null);
  const [protectionSuccess, setProtectionSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createdUrlsRef = useRef<string[]>([]);

  // Track and cleanup Blob Object URLs
  const trackUrl = useCallback((url: string) => {
    createdUrlsRef.current.push(url);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup all tracked URLs on unmount to prevent leaks
      createdUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      });
      createdUrlsRef.current = [];
    };
  }, []);

  const handleFileChange = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];

    const validation = validatePdfFile(selectedFile);
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    setFile(selectedFile);
    setValidationError(null);
    setProtectionSuccess(false);
    setErrorMsg(null);

    // Set default output name
    const baseName = selectedFile.name.replace(/\.pdf$/i, '');
    setOutputName(`${baseName}_protected.pdf`);

    try {
      const pdf = await readPdfDocument(selectedFile);
      const count = pdf.getPageCount();
      setTotalPages(count);
    } catch (err: any) {
      console.error('Error reading PDF pages for protection:', err);
      setValidationError('Could not read PDF details. The file might be password-protected already, encrypted, or corrupted.');
      setFile(null);
      setTotalPages(null);
    }
  };

  const getValidationErrorMsg = (): string | null => {
    if (!file) return null;
    if (!userPassword) {
      return 'User Password is required to secure the PDF.';
    }
    if (userPassword.length < 4) {
      return 'User Password must be at least 4 characters long.';
    }
    if (userPassword !== confirmPassword) {
      return 'User Passwords do not match.';
    }
    if (ownerPassword && ownerPassword.length < 4) {
      return 'Owner Password must be at least 4 characters long if specified.';
    }
    return null;
  };

  const clearState = () => {
    setFile(null);
    setTotalPages(null);
    setUserPassword('');
    setConfirmPassword('');
    setOwnerPassword('');
    setValidationError(null);
    setProtectedBlob(null);
    setProtectionSuccess(false);
    setErrorMsg(null);
  };

  const handleClose = () => {
    clearState();
    onClose();
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

  // True Client-Side PDF Encryption utilizing @neslinesli93/qpdf-wasm
  const encryptPdf = async () => {
    if (!file) return;

    const validationMsg = getValidationErrorMsg();
    if (validationMsg) {
      setValidationError(validationMsg);
      return;
    }

    setIsProtecting(true);
    setValidationError(null);
    setErrorMsg(null);
    setProtectedBlob(null);
    setProtectionSuccess(false);

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
      // Step 1: Validate qpdf.wasm
      await validateWasmAsset();

      // Step 2: Dynamically import @neslinesli93/qpdf-wasm
      let createModuleDefault;
      try {
        createModuleDefault = await import('@neslinesli93/qpdf-wasm');
      } catch (importErr: any) {
        originalConsoleError("Dynamic import of @neslinesli93/qpdf-wasm failed:", importErr);
        throw importErr;
      }

      const createModule = createModuleDefault.default;

      // Step 3: Instantiate WASM module
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

      // Step 4: Write input file to Virtual Filesystem (FS)
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

      // Step 5: Build QPDF encryption CLI arguments
      // We enforce AES-256 bit encryption key length.
      // If ownerPassword is not specified, we fall back to userPassword to ensure encryption standard constraints.
      const finalOwnerPassword = ownerPassword || userPassword;

      const args = [
        '--encrypt',
        userPassword,
        finalOwnerPassword,
        '256',
        `--print=${allowPrinting ? 'full' : 'none'}`,
        `--modify=${allowEditing ? 'all' : 'none'}`,
        `--extract=${allowCopying ? 'y' : 'n'}`,
        `--annotate=${allowAnnotation ? 'y' : 'n'}`,
        '--',
        inputPath,
        outputPath
      ];

      // Step 6: Execute QPDF processing
      try {
        exitCode = qpdf.callMain(args);
      } catch (wasmRuntimeErr: any) {
        try { qpdf.FS.unlink(inputPath); } catch (e) {}
        try { qpdf.FS.unlink(outputPath); } catch (e) {}
        throw wasmRuntimeErr;
      }

      // Step 7: Handle execution results
      if (exitCode === 0 || exitCode === 3) {
        let outputFile;
        try {
          outputFile = qpdf.FS.readFile(outputPath);
        } catch (readFsErr: any) {
          try { qpdf.FS.unlink(inputPath); qpdf.FS.unlink(outputPath); } catch (e) {}
          throw readFsErr;
        }

        // Clean up virtual filesystem immediately to prevent leaks
        try {
          qpdf.FS.unlink(inputPath);
          qpdf.FS.unlink(outputPath);
        } catch (cleanupErr: any) {}

        const outBlob = new Blob([outputFile], { type: 'application/pdf' });
        setProtectedBlob(outBlob);
        setProtectionSuccess(true);
        
        // Auto-download protected file
        const finalName = outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`;
        triggerBlobDownload(outBlob, finalName);
      } else {
        try { qpdf.FS.unlink(inputPath); } catch (cleanupErr: any) {}
        try { qpdf.FS.unlink(outputPath); } catch (cleanupErr: any) {}
        throw new Error(`QPDF encryption process exited with non-zero code ${exitCode}. Details: ${stderrText}`);
      }
    } catch (err: any) {
      originalConsoleError("PDF protection failed:", err);
      setErrorMsg(err.message || 'An unexpected error occurred during PDF protection.');
    } finally {
      // Unregister intercepts
      globalStderrIntercept = null;
      globalLogIntercept = null;
      setIsProtecting(false);
    }
  };

  const activeValidationError = getValidationErrorMsg() || validationError;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto transition-all duration-300" 
      id="protect-pdf-modal"
      style={{ 
        left: isMd ? 'var(--pdf-sidebar-width, 256px)' : '0px', 
        paddingLeft: '16px', 
        paddingRight: '16px' 
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] my-4 md:my-8 animate-scale-in relative">
        
        {/* Workspace Header */}
        <WorkspaceHeader
          title="Protect PDF Workspace"
          subtitle="Local secure sandboxing: Apply local access restrictions and permissions"
          icon={<Lock size={18} />}
          onClose={handleClose}
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Drag and Drop Zone / File Info */}
          {!file ? (
            <UploadZone
              onFilesSelected={handleFileChange}
              accept={{ 'application/pdf': ['.pdf'] }}
              maxFiles={1}
              subtitle="Upload a PDF document to configure local password access and document restrictions"
            />
          ) : (
            <div className="space-y-6">
              
              {/* Loaded File List Component */}
              <FileList
                pdfFiles={[file]}
                onRemove={clearState}
                onClearAll={clearState}
                showIndexBadge={false}
                titleText="Target PDF Document"
              />

              {/* Password & Security configuration form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Password Inputs */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 border border-slate-150 dark:border-slate-800/60 rounded-2xl space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-corporate dark:bg-gold rounded-full"></span>
                    <h4 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Access Passwords</h4>
                  </div>

                  {/* User Password field */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>User Password (Required to Open)</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Min 4 chars</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showUserPassword ? 'text' : 'password'}
                        value={userPassword}
                        onChange={(e) => {
                          setUserPassword(e.target.value);
                          setValidationError(null);
                        }}
                        disabled={isProtecting}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold pl-3.5 pr-10 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors shadow-sm disabled:opacity-60"
                        id="user-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUserPassword(!showUserPassword)}
                        disabled={isProtecting}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition-colors disabled:opacity-60"
                      >
                        {showUserPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm User Password field */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Confirm User Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setValidationError(null);
                        }}
                        disabled={isProtecting}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold pl-3.5 pr-10 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors shadow-sm disabled:opacity-60"
                        id="confirm-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isProtecting}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition-colors disabled:opacity-60"
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Owner Password field */}
                  <div className="space-y-1.5 relative pt-1">
                    <div className="h-px bg-slate-200/60 dark:bg-slate-800/80 my-2"></div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>Owner / Master Password (Optional)</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Bypasses limits</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showOwnerPassword ? 'text' : 'password'}
                        value={ownerPassword}
                        onChange={(e) => {
                          setOwnerPassword(e.target.value);
                          setValidationError(null);
                        }}
                        disabled={isProtecting}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold pl-3.5 pr-10 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors shadow-sm disabled:opacity-60"
                        id="owner-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                        disabled={isProtecting}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition-colors disabled:opacity-60"
                      >
                        {showOwnerPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: PDF Permissions checkboxes */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 border border-slate-150 dark:border-slate-800/60 rounded-2xl space-y-4 flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-corporate dark:bg-gold rounded-full"></span>
                    <h4 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Document Permissions</h4>
                  </div>

                  <div className="space-y-3 flex-1 justify-center flex flex-col">
                    {/* Allow Printing */}
                    <div 
                      onClick={() => !isProtecting && setAllowPrinting(!allowPrinting)}
                      className={`flex items-start gap-2.5 select-none group ${isProtecting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      id="allow-printing-checkbox"
                    >
                      <div className="text-corporate dark:text-gold shrink-0 mt-0.5">
                        {allowPrinting ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-corporate dark:group-hover:text-gold transition-colors">
                          Allow Printing
                        </p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500">
                          Users can print high-quality copies of the PDF.
                        </p>
                      </div>
                    </div>

                    {/* Allow Copying */}
                    <div 
                      onClick={() => !isProtecting && setAllowCopying(!allowCopying)}
                      className={`flex items-start gap-2.5 select-none group ${isProtecting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      id="allow-copying-checkbox"
                    >
                      <div className="text-corporate dark:text-gold shrink-0 mt-0.5">
                        {allowCopying ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-corporate dark:group-hover:text-gold transition-colors">
                          Allow Content Copying
                        </p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500">
                          Permits selecting and copying text or image content.
                        </p>
                      </div>
                    </div>

                    {/* Allow Editing */}
                    <div 
                      onClick={() => !isProtecting && setAllowEditing(!allowEditing)}
                      className={`flex items-start gap-2.5 select-none group ${isProtecting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      id="allow-editing-checkbox"
                    >
                      <div className="text-corporate dark:text-gold shrink-0 mt-0.5">
                        {allowEditing ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-corporate dark:group-hover:text-gold transition-colors">
                          Allow Content Editing
                        </p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500">
                          Enables modifying form fields or text templates.
                        </p>
                      </div>
                    </div>

                    {/* Allow Annotation */}
                    <div 
                      onClick={() => !isProtecting && setAllowAnnotation(!allowAnnotation)}
                      className={`flex items-start gap-2.5 select-none group ${isProtecting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      id="allow-annotation-checkbox"
                    >
                      <div className="text-corporate dark:text-gold shrink-0 mt-0.5">
                        {allowAnnotation ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-corporate dark:group-hover:text-gold transition-colors">
                          Allow Commenting & Annotation
                        </p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500">
                          Permits drawing, highlighting, and writing comments.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Output filename setup */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-150 dark:border-slate-800/60 rounded-2xl space-y-3">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-corporate dark:bg-gold rounded-full"></span>
                  <h4 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Output File Setup</h4>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    disabled={isProtecting}
                    placeholder="protected_document.pdf"
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors shadow-sm disabled:opacity-60"
                    id="output-name-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Status and Notifications */}
          {activeValidationError && (
            <AlertBanner type="error" message={activeValidationError} />
          )}

          {errorMsg && (
            <AlertBanner type="error" message={errorMsg} />
          )}

          {protectionSuccess && (
            <AlertBanner 
              type="success" 
              message="PDF successfully protected!" 
              description="Your secure password-encrypted document has been downloaded."
            />
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3 bg-slate-50/30 dark:bg-slate-950/10 shrink-0">
          <button
            onClick={handleClose}
            disabled={isProtecting}
            className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-350 font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-150 dark:border-slate-800/60 disabled:opacity-60 disabled:cursor-not-allowed"
            id="close-protect-workspace-button"
          >
            Close Workspace
          </button>
          
          <button
            onClick={encryptPdf}
            disabled={!file || isProtecting || !!getValidationErrorMsg()}
            className={`font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
              !file || isProtecting || !!getValidationErrorMsg()
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-150 dark:border-slate-800/50 cursor-not-allowed'
                : 'bg-corporate text-white hover:bg-corporate/95 dark:bg-gold dark:text-navy dark:hover:bg-gold/95 border border-transparent shadow-md hover:shadow-lg active:scale-[0.98]'
            }`}
            id="apply-protection-button"
          >
            {isProtecting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Encrypting PDF...</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>Apply Protection & Download</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
