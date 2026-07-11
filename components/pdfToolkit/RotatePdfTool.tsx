import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  FileText, 
  Loader2,
  Undo2,
  RefreshCw,
  CheckSquare,
  Square,
  Settings
} from 'lucide-react';
import UploadZone from './UploadZone';
import { usePdfDownload } from './hooks/usePdfDownload';
import { formatFileSize } from './utils/fileHelpers';
import { readPdfDocument } from './utils/pdfHelpers';
import { validatePdfFile } from './utils/validation';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import ActionToolbar from './ui/ActionToolbar';
import PageThumbnailCard from './ui/PageThumbnailCard';

interface RotatePdfToolProps {
  onClose: () => void;
}

interface PageRotationState {
  pageIndex: number;
  originalRotation: number;
  currentRotation: number; // 0, 90, 180, 270
}

export default function RotatePdfTool({ onClose }: RotatePdfToolProps) {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const checkMd = () => setIsMd(window.innerWidth >= 768);
    checkMd();
    window.addEventListener('resize', checkMd);
    return () => window.removeEventListener('resize', checkMd);
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null); // PDF.js Document object
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pagesState, setPagesState] = useState<PageRotationState[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [outputName, setOutputName] = useState<string>('rotated_document.pdf');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [libLoading, setLibLoading] = useState<boolean>(false);
  const [libLoaded, setLibLoaded] = useState<boolean>(false);

  const {
    downloading: processing,
    error: downloadError,
    success: rotateSuccess,
    setError: setRotateError,
    executeDownload,
    clearDownloadStates,
  } = usePdfDownload();

  const error = downloadError || validationError;

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
          setLibLoaded(true);
          setLibLoading(false);
          resolve(pdfjsLib);
        } else {
          setLibLoading(false);
          reject(new Error('PDF.js not found in window object.'));
        }
      };
      script.onerror = () => {
        setLibLoading(false);
        reject(new Error('Failed to load local PDF.js engine.'));
      };
      document.head.appendChild(script);
    });
  };

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
    clearDownloadStates();

    // Set default output name
    const baseName = selectedFile.name.replace(/\.pdf$/i, '');
    setOutputName(`${baseName}_rotated.pdf`);

    try {
      // 1. Read PDF page counts & original rotation degrees
      const pdf = await readPdfDocument(selectedFile);
      const count = pdf.getPageCount();
      setTotalPages(count);

      const initialPages: PageRotationState[] = [];
      const initialSelected = new Set<number>();

      for (let i = 0; i < count; i++) {
        const page = pdf.getPage(i);
        const rotObj = page.getRotation();
        const angle = rotObj ? rotObj.angle : 0;
        
        initialPages.push({
          pageIndex: i,
          originalRotation: angle,
          currentRotation: angle
        });
        initialSelected.add(i); // select all pages by default
      }

      setPagesState(initialPages);
      setSelectedPages(initialSelected);

      // 2. Load PDF.js Document object for preview rendering
      const pdfjs = await loadPdfJsLibrary();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
    } catch (err: any) {
      console.error('Error reading PDF pages for rotation:', err);
      setValidationError('Could not read PDF details. The file might be password-protected, encrypted, or corrupted.');
      setFile(null);
      setTotalPages(null);
      setPdfDoc(null);
    }
  };

  const togglePageSelection = (pageIndex: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) {
        next.delete(pageIndex);
      } else {
        next.add(pageIndex);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!totalPages) return;
    const next = new Set<number>();
    for (let i = 0; i < totalPages; i++) {
      next.add(i);
    }
    setSelectedPages(next);
  };

  const selectNone = () => {
    setSelectedPages(new Set());
  };

  const selectOdd = () => {
    if (!totalPages) return;
    const next = new Set<number>();
    for (let i = 0; i < totalPages; i += 2) {
      next.add(i);
    }
    setSelectedPages(next);
  };

  const selectEven = () => {
    if (!totalPages) return;
    const next = new Set<number>();
    for (let i = 1; i < totalPages; i += 2) {
      next.add(i);
    }
    setSelectedPages(next);
  };

  const rotateSelected = (direction: 'left' | 'right' | '180') => {
    if (selectedPages.size === 0) {
      setValidationError('Please select at least one page to rotate.');
      return;
    }
    setValidationError(null);

    setPagesState((prev) =>
      prev.map((page) => {
        if (!selectedPages.has(page.pageIndex)) return page;

        let delta = 0;
        if (direction === 'left') delta = 270;
        else if (direction === 'right') delta = 90;
        else if (direction === '180') delta = 180;

        const nextRotation = (page.currentRotation + delta) % 360;

        return {
          ...page,
          currentRotation: nextRotation
        };
      })
    );
  };

  const resetAllRotations = () => {
    setPagesState((prev) =>
      prev.map((page) => ({
        ...page,
        currentRotation: page.originalRotation
      }))
    );
    setValidationError(null);
    clearDownloadStates();
  };

  const clearState = () => {
    setFile(null);
    setPdfDoc(null);
    setTotalPages(null);
    setPagesState([]);
    setSelectedPages(new Set());
    setValidationError(null);
    clearDownloadStates();
  };

  const handleClose = () => {
    clearState();
    onClose();
  };

  const handleSaveRotation = async () => {
    if (!file) {
      setValidationError('Please select a PDF file first.');
      return;
    }

    setValidationError(null);

    await executeDownload(async () => {
      const { degrees } = await import('pdf-lib');
      const pdf = await readPdfDocument(file);

      pagesState.forEach((pageState) => {
        const page = pdf.getPage(pageState.pageIndex);
        page.setRotation(degrees(pageState.currentRotation));
      });

      const pdfBytes = await pdf.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    }, outputName);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto transition-all duration-300"
      style={{ 
        left: isMd ? 'var(--pdf-sidebar-width, 256px)' : '0px', 
        paddingLeft: '16px', 
        paddingRight: '16px' 
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] my-4 md:my-8 animate-scale-in">
        
        {/* Workspace Header */}
        <WorkspaceHeader
          title="Rotate PDF Workspace"
          subtitle="Local sandboxed rotation: Preserves 100% of original visual quality"
          icon={<RotateCw size={18} />}
          onClose={handleClose}
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Upload Zone */}
          {!file ? (
            <UploadZone
              onFilesSelected={handleFileChange}
              multiple={false}
              title={
                <>
                  Drag and drop your PDF file here, or <span className="text-corporate dark:text-gold hover:underline">browse</span>
                </>
              }
              description="Supports one PDF file. Rotation is performed securely entirely inside your browser."
            />
          ) : (
            <div className="space-y-6">
              {/* File details banner */}
              <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/20 dark:bg-slate-950/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 bg-orange-500/10 text-orange-500 font-bold rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {formatFileSize(file.size)} • {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={resetAllRotations}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-corporate dark:hover:border-gold text-slate-600 dark:text-slate-350 hover:text-corporate dark:hover:text-gold font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Undo2 size={12} />
                    <span>Reset All</span>
                  </button>
                  <button 
                    onClick={clearState}
                    className="text-xs text-rose-500 hover:text-rose-600 font-bold transition-colors cursor-pointer px-1"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Action Toolbar Component */}
              <ActionToolbar
                leftSection={
                  <>
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Select Pages</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={selectAll}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-330 font-bold text-[10px] rounded-md hover:border-corporate dark:hover:border-gold transition-all cursor-pointer"
                      >
                        All
                      </button>
                      <button
                        onClick={selectNone}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-330 font-bold text-[10px] rounded-md hover:border-corporate dark:hover:border-gold transition-all cursor-pointer"
                      >
                        None
                      </button>
                      {totalPages && totalPages > 1 && (
                        <>
                          <button
                            onClick={selectOdd}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-330 font-bold text-[10px] rounded-md hover:border-corporate dark:hover:border-gold transition-all cursor-pointer"
                          >
                            Odd Pages
                          </button>
                          <button
                            onClick={selectEven}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-330 font-bold text-[10px] rounded-md hover:border-corporate dark:hover:border-gold transition-all cursor-pointer"
                          >
                            Even Pages
                          </button>
                        </>
                      )}
                    </div>
                  </>
                }
                rightSection={
                  <>
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Rotate Selected ({selectedPages.size})</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => rotateSelected('left')}
                        className="px-3 py-1.5 bg-corporate text-white dark:bg-gold dark:text-navy font-bold text-[10px] rounded-md hover:bg-corporate/90 dark:hover:bg-amber-500 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <RefreshCw size={11} className="transform -scale-x-100" />
                        <span>Left 90°</span>
                      </button>
                      <button
                        onClick={() => rotateSelected('right')}
                        className="px-3 py-1.5 bg-corporate text-white dark:bg-gold dark:text-navy font-bold text-[10px] rounded-md hover:bg-corporate/90 dark:hover:bg-amber-500 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <RefreshCw size={11} />
                        <span>Right 90°</span>
                      </button>
                      <button
                        onClick={() => rotateSelected('180')}
                        className="px-3 py-1.5 bg-corporate text-white dark:bg-gold dark:text-navy font-bold text-[10px] rounded-md hover:bg-corporate/90 dark:hover:bg-amber-500 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <RotateCw size={11} />
                        <span>180°</span>
                      </button>
                    </div>
                  </>
                }
              />

              {/* Page Grid/Thumbnails layout */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-navy dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Settings size={14} className="text-slate-400" />
                  <span>Interactive Workspace Page Grid</span>
                </h4>
                
                <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 bg-slate-50/10 dark:bg-slate-950/5 max-h-[35vh] overflow-y-auto">
                  {pdfDoc ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {pagesState.map((page) => (
                        <PageThumbnailCard
                          key={`rotate-page-${page.pageIndex}`}
                          pageIndex={page.pageIndex}
                          pdfDoc={pdfDoc}
                          isSelected={selectedPages.has(page.pageIndex)}
                          onToggle={togglePageSelection}
                          rotation={page.currentRotation}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-corporate dark:border-t-gold animate-spin" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Preparing secure page workspace...
                      </p>
                    </div>
                  )}
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
                    placeholder="rotated_document.pdf"
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Status and Notifications */}
          {error && (
            <AlertBanner type="error" message={error} />
          )}

          {rotateSuccess && (
            <AlertBanner 
              type="success" 
              message="PDF Rotated Successfully!" 
              description="Your customized PDF document has been compiled and downloaded automatically." 
            />
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3 bg-slate-50/30 dark:bg-slate-950/10 shrink-0">
          <button
            onClick={handleClose}
            className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-350 font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-150 dark:border-slate-800/60"
          >
            Close Workspace
          </button>
          
          <button
            onClick={handleSaveRotation}
            disabled={!file || processing}
            className={`font-bold py-2.5 px-6 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 shadow-md cursor-pointer ${
              !file || processing
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed shadow-none'
                : 'bg-corporate hover:bg-corporate/90 text-white dark:bg-gold dark:text-navy dark:hover:bg-amber-500'
            }`}
          >
            {processing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Applying Rotations...</span>
              </>
            ) : (
              <>
                <RotateCw size={14} />
                <span>Save & Download</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
