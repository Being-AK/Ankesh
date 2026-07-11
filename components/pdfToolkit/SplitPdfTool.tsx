import React, { useState, useEffect, useRef } from 'react';
import { 
  Scissors, 
  FileText, 
  Loader2, 
  Settings,
  HelpCircle
} from 'lucide-react';
import UploadZone from './UploadZone';
import { usePdfDownload } from './hooks/usePdfDownload';
import { formatFileSize } from './utils/fileHelpers';
import { parsePageRanges, readPdfDocument } from './utils/pdfHelpers';
import { validatePdfFile } from './utils/validation';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import ActionToolbar from './ui/ActionToolbar';
import PageThumbnailCard from './ui/PageThumbnailCard';

interface SplitPdfToolProps {
  onClose: () => void;
}

export default function SplitPdfTool({ onClose }: SplitPdfToolProps) {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const checkMd = () => setIsMd(window.innerWidth >= 768);
    checkMd();
    window.addEventListener('resize', checkMd);
    return () => window.removeEventListener('resize', checkMd);
  }, []);

  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null); // PDF.js Document
  const [splitTotalPages, setSplitTotalPages] = useState<number | null>(null);
  const [splitRangeInput, setSplitRangeInput] = useState<string>('');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set()); // 0-based indices
  const [splitOutputName, setSplitOutputName] = useState<string>('split_document.pdf');
  const [strategy, setStrategy] = useState<'custom' | 'all' | 'odd' | 'even' | 'selected'>('custom');

  const [libLoading, setLibLoading] = useState<boolean>(false);
  const [libLoaded, setLibLoaded] = useState<boolean>(false);

  const {
    downloading: splitting,
    error: downloadError,
    success: splitSuccess,
    setError: setSplitError,
    executeDownload,
    clearDownloadStates,
  } = usePdfDownload();

  const [validationError, setValidationError] = useState<string | null>(null);
  const splitError = downloadError || validationError;

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

  const handleSplitFileChange = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    
    const validation = validatePdfFile(file);
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }
    
    setSplitFile(file);
    setValidationError(null);
    clearDownloadStates();
    setSelectedPages(new Set());
    setStrategy('custom');
    
    // Set default output name based on input name
    const baseName = file.name.replace(/\.pdf$/i, '');
    setSplitOutputName(`${baseName}_split.pdf`);
    
    try {
      // 1. Read page count for splitting engine
      const pdf = await readPdfDocument(file, { 
        updateMetadata: false 
      });
      const pagesCount = pdf.getPageCount();
      setSplitTotalPages(pagesCount);
      setSplitRangeInput(`1-${pagesCount}`);

      // 2. Load PDF.js for rendering thumbnails
      const pdfjs = await loadPdfJsLibrary();
      const arrayBuffer = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
    } catch (err: any) {
      console.error('Error reading PDF pages:', err);
      setValidationError('Could not read PDF page details. The file might be corrupted, password-protected, or encrypted.');
      setSplitTotalPages(null);
      setPdfDoc(null);
    }
  };

  const generateRangeString = (pageIndicesArray: number[]): string => {
    if (pageIndicesArray.length === 0) return '';
    const sorted = [...pageIndicesArray].sort((a, b) => a - b);
    const parts: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      if (current === prev + 1) {
        prev = current;
      } else {
        if (start === prev) {
          parts.push(`${start + 1}`);
        } else {
          parts.push(`${start + 1}-${prev + 1}`);
        }
        start = current;
        prev = current;
      }
    }
    if (start === prev) {
      parts.push(`${start + 1}`);
    } else {
      parts.push(`${start + 1}-${prev + 1}`);
    }
    return parts.join(', ');
  };

  // Synchronize range typed in text box with visual checkboxes
  const handleRangeInputChange = (val: string) => {
    setSplitRangeInput(val);
    setValidationError(null);
    clearDownloadStates();

    try {
      if (!val.trim()) {
        setSelectedPages(new Set());
        return;
      }
      const parsed = parsePageRanges(val, splitTotalPages || 0);
      const zeroBased = parsed.map(p => p - 1);
      setSelectedPages(new Set(zeroBased));
    } catch (e) {
      // Graceful fail while typing
    }
  };

  // Click on visual page to toggle selection
  const handlePageToggle = (pageIndex: number) => {
    const updated = new Set(selectedPages);
    if (updated.has(pageIndex)) {
      updated.delete(pageIndex);
    } else {
      updated.add(pageIndex);
    }
    setSelectedPages(updated);
    setStrategy('selected');

    const formattedRange = generateRangeString(Array.from(updated));
    setSplitRangeInput(formattedRange);
    clearDownloadStates();
  };

  const applyStrategy = (selectedStrategy: 'custom' | 'all' | 'odd' | 'even') => {
    if (!splitTotalPages) return;
    setStrategy(selectedStrategy);
    clearDownloadStates();
    setValidationError(null);

    let list: number[] = [];
    if (selectedStrategy === 'all') {
      for (let i = 0; i < splitTotalPages; i++) list.push(i);
    } else if (selectedStrategy === 'odd') {
      for (let i = 0; i < splitTotalPages; i += 2) list.push(i);
    } else if (selectedStrategy === 'even') {
      for (let i = 1; i < splitTotalPages; i += 2) list.push(i);
    } else {
      // custom
      setSplitRangeInput(`1-${splitTotalPages}`);
      setSelectedPages(new Set());
      return;
    }

    setSelectedPages(new Set(list));
    setSplitRangeInput(generateRangeString(list));
  };

  const clearSplitState = () => {
    setSplitFile(null);
    setPdfDoc(null);
    setSplitTotalPages(null);
    setSplitRangeInput('');
    setSelectedPages(new Set());
    setStrategy('custom');
    setValidationError(null);
    clearDownloadStates();
  };

  const handleClose = () => {
    clearSplitState();
    onClose();
  };

  const handleSplit = async () => {
    if (!splitFile) {
      setValidationError('Please select a PDF file first.');
      return;
    }
    if (!splitTotalPages) {
      setValidationError('Could not determine page count. Please re-upload the file.');
      return;
    }
    if (!splitRangeInput.trim()) {
      setValidationError('Please configure an extraction page range first.');
      return;
    }

    setValidationError(null);

    await executeDownload(async () => {
      const pagesToExtract = parsePageRanges(splitRangeInput, splitTotalPages);

      const srcPdf = await readPdfDocument(splitFile);
      const { PDFDocument } = await import('pdf-lib');
      const splitPdf = await PDFDocument.create();
      const copiedPages = await splitPdf.copyPages(srcPdf, pagesToExtract);
      copiedPages.forEach((page) => splitPdf.addPage(page));

      const splitPdfBytes = await splitPdf.save();
      return new Blob([splitPdfBytes], { type: 'application/pdf' });
    }, splitOutputName);
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
          title="Split PDF Workspace"
          subtitle="Local sandboxed extraction: Files never upload or leave your system"
          icon={<Scissors size={18} />}
          onClose={handleClose}
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Drag and Drop Zone / File Info */}
          {!splitFile ? (
            <UploadZone
              onFilesSelected={handleSplitFileChange}
              multiple={false}
              title={
                <>
                  Drag and drop your PDF file here, or <span className="text-corporate dark:text-gold hover:underline">browse</span>
                </>
              }
              description="Supports one PDF file. Extraction is processed entirely client-side."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Controls & Settings */}
              <div className="lg:col-span-4 space-y-5">
                
                {/* File details banner */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/20 dark:bg-slate-950/5 flex flex-col gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 bg-orange-500/10 text-orange-500 font-bold rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                        {splitFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                        {formatFileSize(splitFile.size)} • {splitTotalPages} {splitTotalPages === 1 ? 'Page' : 'Pages'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={clearSplitState}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-black transition-colors cursor-pointer text-left self-start"
                  >
                    Change PDF File
                  </button>
                </div>

                {/* Strategies & Inputs Panel */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 border border-slate-150 dark:border-slate-800/60 rounded-2xl space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-corporate dark:bg-gold rounded-full"></span>
                    <h4 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Split Strategy</h4>
                  </div>

                  {/* Strategies Buttons List */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => applyStrategy('custom')}
                      className={`px-3 py-2 border font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm text-center ${
                        strategy === 'custom'
                          ? 'border-corporate dark:border-gold bg-corporate/5 dark:bg-gold/5 text-corporate dark:text-gold'
                          : 'border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-450 hover:border-slate-350'
                      }`}
                    >
                      Custom Ranges
                    </button>
                    <button
                      type="button"
                      onClick={() => applyStrategy('all')}
                      className={`px-3 py-2 border font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm text-center ${
                        strategy === 'all'
                          ? 'border-corporate dark:border-gold bg-corporate/5 dark:bg-gold/5 text-corporate dark:text-gold'
                          : 'border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-450 hover:border-slate-350'
                      }`}
                    >
                      Every Page
                    </button>
                    <button
                      type="button"
                      onClick={() => applyStrategy('odd')}
                      className={`px-3 py-2 border font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm text-center ${
                        strategy === 'odd'
                          ? 'border-corporate dark:border-gold bg-corporate/5 dark:bg-gold/5 text-corporate dark:text-gold'
                          : 'border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-450 hover:border-slate-350'
                      }`}
                    >
                      Odd Pages
                    </button>
                    <button
                      type="button"
                      onClick={() => applyStrategy('even')}
                      className={`px-3 py-2 border font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm text-center ${
                        strategy === 'even'
                          ? 'border-corporate dark:border-gold bg-corporate/5 dark:bg-gold/5 text-corporate dark:text-gold'
                          : 'border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-450 hover:border-slate-350'
                      }`}
                    >
                      Even Pages
                    </button>
                  </div>

                  {/* Range Input box */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Extraction Range
                      </label>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                        Max: {splitTotalPages}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={splitRangeInput}
                      onChange={(e) => handleRangeInputChange(e.target.value)}
                      placeholder="e.g. 1-3, 5, 8-10"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors shadow-sm"
                    />
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 italic">
                      Format: &quot;1-3, 5, 7&quot; or select pages dynamically in the workspace.
                    </p>
                  </div>
                </div>

                {/* Output File Configuration */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 border border-slate-150 dark:border-slate-800/60 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-corporate dark:bg-gold rounded-full"></span>
                    <h4 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Output File Setup</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={splitOutputName}
                      onChange={(e) => setSplitOutputName(e.target.value)}
                      placeholder="split_document.pdf"
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3.5 py-2 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors shadow-sm"
                    />
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Interactive Page Workspace */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-xs font-extrabold text-navy dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Settings size={14} className="text-slate-400" />
                    <span>Interactive Workspace Grid ({selectedPages.size} Selected)</span>
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => applyStrategy('all')}
                      className="text-[10px] font-bold text-corporate dark:text-gold hover:underline transition-all"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300 dark:text-slate-800">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPages(new Set());
                        setSplitRangeInput('');
                        setStrategy('custom');
                        clearDownloadStates();
                      }}
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-450 hover:underline transition-all"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="border border-slate-100 dark:border-slate-800/85 rounded-3xl p-5 bg-slate-50/10 dark:bg-slate-950/5 max-h-[55vh] overflow-y-auto">
                  {pdfDoc ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
                      {Array.from({ length: splitTotalPages || 0 }).map((_, idx) => (
                        <PageThumbnailCard
                          key={`split-page-${idx}`}
                          pageIndex={idx}
                          pdfDoc={pdfDoc}
                          isSelected={selectedPages.has(idx)}
                          onToggle={handlePageToggle}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-corporate dark:border-t-gold animate-spin" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Preparing secure rendering workspace...
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Status and Notifications */}
          {splitError && (
            <AlertBanner type="error" message={splitError} />
          )}

          {splitSuccess && (
            <AlertBanner 
              type="success" 
              message="PDF Split Successfully!" 
              description="Your customized range or selected pages have been parsed, bundled, and downloaded automatically." 
            />
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3 bg-slate-50/30 dark:bg-slate-950/10">
          <button
            onClick={handleClose}
            className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-350 font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-150 dark:border-slate-800/60"
          >
            Close Workspace
          </button>
          
          <button
            onClick={handleSplit}
            disabled={!splitFile || !splitRangeInput.trim() || splitting}
            className={`font-bold py-2.5 px-6 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 shadow-md cursor-pointer ${
              !splitFile || !splitRangeInput.trim() || splitting
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed shadow-none'
                : 'bg-corporate hover:bg-corporate/90 text-white dark:bg-gold dark:text-navy dark:hover:bg-amber-500'
            }`}
          >
            {splitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Extracting Pages...</span>
              </>
            ) : (
              <>
                <Scissors size={14} />
                <span>Extract & Download</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
