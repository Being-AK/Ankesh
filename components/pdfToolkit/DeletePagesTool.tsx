import React, { useState, useEffect } from 'react';
import { 
  FileX, 
  FileText, 
  Loader2,
  CheckSquare,
  Square,
  Trash2,
  RefreshCw,
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
import FileList from './ui/FileList';
import LoadingOverlay from './ui/LoadingOverlay';
import PageThumbnailCard from './ui/PageThumbnailCard';

interface DeletePagesToolProps {
  onClose: () => void;
}

export default function DeletePagesTool({ onClose }: DeletePagesToolProps) {
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
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set()); // Set of 0-based page indices to delete
  const [outputName, setOutputName] = useState<string>('deleted_document.pdf');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [libLoading, setLibLoading] = useState<boolean>(false);
  const [libLoaded, setLibLoaded] = useState<boolean>(false);

  const {
    downloading: processing,
    error: downloadError,
    success: deleteSuccess,
    setError: setDeleteError,
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
    setOutputName(`${baseName}_edited.pdf`);

    try {
      // 1. Read details via pdf-lib
      const pdf = await readPdfDocument(selectedFile);
      const count = pdf.getPageCount();
      setTotalPages(count);
      setSelectedPages(new Set()); // start with no pages marked for deletion

      // 2. Load PDF.js Document
      const pdfjs = await loadPdfJsLibrary();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
    } catch (err: any) {
      console.error('Error reading PDF pages for page deletion:', err);
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
    setValidationError(null);
    clearDownloadStates();
  };

  const selectAll = () => {
    if (!totalPages) return;
    const next = new Set<number>();
    for (let i = 0; i < totalPages; i++) {
      next.add(i);
    }
    setSelectedPages(next);
    setValidationError(null);
    clearDownloadStates();
  };

  const selectNone = () => {
    setSelectedPages(new Set());
    setValidationError(null);
    clearDownloadStates();
  };

  const invertSelection = () => {
    if (!totalPages) return;
    const next = new Set<number>();
    for (let i = 0; i < totalPages; i++) {
      if (!selectedPages.has(i)) {
        next.add(i);
      }
    }
    setSelectedPages(next);
    setValidationError(null);
    clearDownloadStates();
  };

  const clearState = () => {
    setFile(null);
    setPdfDoc(null);
    setTotalPages(null);
    setSelectedPages(new Set());
    setValidationError(null);
    clearDownloadStates();
  };

  const handleClose = () => {
    clearState();
    onClose();
  };

  const handleDeletePages = async () => {
    if (!file) {
      setValidationError('Please select a PDF file first.');
      return;
    }

    if (!totalPages) {
      setValidationError('Could not retrieve PDF details. Please reload the file.');
      return;
    }

    if (selectedPages.size === 0) {
      setValidationError('Please select at least one page to delete.');
      return;
    }

    if (selectedPages.size === totalPages) {
      setValidationError('At least one page must remain in the document. You cannot delete all pages.');
      return;
    }

    setValidationError(null);

    await executeDownload(async () => {
      const srcPdf = await readPdfDocument(file);
      const { PDFDocument } = await import('pdf-lib');
      const newPdf = await PDFDocument.create();

      // Determine which page indices to keep
      const pagesToKeep: number[] = [];
      for (let i = 0; i < totalPages; i++) {
        if (!selectedPages.has(i)) {
          pagesToKeep.push(i);
        }
      }

      // Copy remaining pages to new document to preserve original quality
      const copiedPages = await newPdf.copyPages(srcPdf, pagesToKeep);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    }, outputName);
  };

  const remainingPagesCount = totalPages ? totalPages - selectedPages.size : 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto transition-all duration-300"
      style={{ 
        left: isMd ? 'var(--pdf-sidebar-width, 256px)' : '0px', 
        paddingLeft: '16px', 
        paddingRight: '16px' 
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] my-4 md:my-8 animate-scale-in relative">
        
        {processing && <LoadingOverlay message="Deleting pages and rebuilding PDF..." />}

        {/* Workspace Header */}
        <WorkspaceHeader
          title="Delete PDF Pages Workspace"
          subtitle="Local client exclusion: Selected pages will be discarded on your device"
          icon={<FileX size={18} />}
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
              subtitle="Upload a PDF document to select and remove specific pages"
            />
          ) : (
            <div className="space-y-6">
              
              {/* Loaded File List Component */}
              <FileList
                pdfFiles={[file]}
                onRemove={clearState}
                onClearAll={clearState}
                showIndexBadge={false}
                titleText="Source Document"
              />

              {/* Action Toolbar Component */}
              <ActionToolbar
                leftSection={
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Select Pages for Deletion</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={selectAll}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-corporate dark:hover:border-gold text-slate-600 dark:text-slate-330 font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={selectNone}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-corporate dark:hover:border-gold text-slate-600 dark:text-slate-330 font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1"
                      >
                        Select None
                      </button>
                      <button
                        type="button"
                        onClick={invertSelection}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-corporate dark:hover:border-gold text-slate-600 dark:text-slate-330 font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1"
                      >
                        Invert Selection
                      </button>
                    </div>
                  </div>
                }
                rightSection={
                  <div className="flex flex-col gap-1.5 items-end">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider md:text-right w-full">Page Summary</span>
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded-lg">
                        Original: {totalPages} pages
                      </div>
                      <div className={`px-2.5 py-1.5 border text-[10px] font-bold rounded-lg ${
                        remainingPagesCount === 0 
                          ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-450'
                      }`}>
                        Output: {remainingPagesCount} {remainingPagesCount === 1 ? 'page' : 'pages'}
                      </div>
                    </div>
                  </div>
                }
              />

              {/* Page Grid/Thumbnails layout */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-xs font-extrabold text-navy dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Settings size={14} className="text-slate-400" />
                    <span>Interactive Workspace Page Grid</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Click cards to toggle delete status. At least one page must remain.
                  </span>
                </div>

                <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 bg-slate-50/10 dark:bg-slate-950/5 max-h-[35vh] overflow-y-auto">
                  {pdfDoc ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {Array.from({ length: totalPages || 0 }).map((_, i) => (
                        <PageThumbnailCard
                          key={`delete-page-${i}`}
                          pageIndex={i}
                          pdfDoc={pdfDoc}
                          deleted={selectedPages.has(i)}
                          onToggle={togglePageSelection}
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
                    placeholder="deleted_document.pdf"
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

          {deleteSuccess && (
            <AlertBanner 
              type="success" 
              message="Pages Deleted Successfully!" 
              description="Your optimized PDF file has been compiled and downloaded automatically." 
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
            onClick={handleDeletePages}
            disabled={!file || selectedPages.size === 0 || selectedPages.size === totalPages || processing}
            className={`font-bold py-2.5 px-6 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 shadow-md cursor-pointer ${
              !file || selectedPages.size === 0 || selectedPages.size === totalPages || processing
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed shadow-none'
                : 'bg-rose-500 hover:bg-rose-600 text-white dark:bg-rose-600 dark:hover:bg-rose-700'
            }`}
          >
            {processing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Excluding Pages...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Delete Pages & Download</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
