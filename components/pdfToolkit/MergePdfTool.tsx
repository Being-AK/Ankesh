import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Loader2 
} from 'lucide-react';
import UploadZone from './UploadZone';
import { usePdfFiles } from './hooks/usePdfFiles';
import { usePdfDownload } from './hooks/usePdfDownload';
import { readPdfDocument } from './utils/pdfHelpers';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import FileList from './ui/FileList';

interface MergePdfToolProps {
  onClose: () => void;
}

export default function MergePdfTool({ onClose }: MergePdfToolProps) {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const checkMd = () => setIsMd(window.innerWidth >= 768);
    checkMd();
    window.addEventListener('resize', checkMd);
    return () => window.removeEventListener('resize', checkMd);
  }, []);
  const {
    pdfFiles,
    error: filesError,
    setError: setFilesError,
    addFiles,
    moveFileUp,
    moveFileDown,
    removeFile,
    clearAllFiles,
    setPdfFiles,
  } = usePdfFiles();

  const {
    downloading: merging,
    error: downloadError,
    success,
    setError: setDownloadError,
    executeDownload,
    clearDownloadStates,
  } = usePdfDownload();

  const [outputName, setOutputName] = useState<string>('merged_document.pdf');

  const error = downloadError || filesError;

  const handleClose = () => {
    clearAllFiles();
    clearDownloadStates();
    onClose();
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) {
      setDownloadError('Please select at least 2 PDF files to merge.');
      return;
    }

    setFilesError(null);

    await executeDownload(async () => {
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();

      for (const file of pdfFiles) {
        let pdf;
        try {
          pdf = await readPdfDocument(file);
        } catch (loadErr: any) {
          throw new Error(`Failed to load "${file.name}". The file may be password-protected, encrypted, or corrupted.`);
        }

        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      return new Blob([mergedPdfBytes], { type: 'application/pdf' });
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
          title="Merge PDF Workspace"
          subtitle="Local sandboxed merge: Files never upload or leave your system"
          icon={<Layers size={18} />}
          onClose={handleClose}
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Reusable Upload Zone */}
          <UploadZone 
            onFilesSelected={addFiles}
            multiple={true}
            title={
              <>
                Drag and drop your PDF files here, or <span className="text-corporate dark:text-gold hover:underline">browse</span>
              </>
            }
            description="Supports multiple PDF files. Merged files are processed entirely client-side."
          />

          {/* Status and Notifications */}
          {error && (
            <AlertBanner type="error" message={error} />
          )}

          {success && (
            <AlertBanner 
              type="success" 
              message="PDF Merged Successfully!" 
              description="Your combined PDF has been compiled and downloaded automatically." 
            />
          )}

          {/* Uploaded File List */}
          <FileList
            pdfFiles={pdfFiles}
            onRemove={removeFile}
            onMoveUp={moveFileUp}
            onMoveDown={moveFileDown}
            onClearAll={clearAllFiles}
            showIndexBadge={true}
            titleText="Document Assembly"
            tipText="💡 Tip: Arrange documents in the exact order you want them merged from top to bottom."
            onReorder={setPdfFiles}
            onAddFiles={addFiles}
          />

          {/* Output File Configuration */}
          {pdfFiles.length >= 2 && (
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
                  placeholder="merged_document.pdf"
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors"
                />
              </div>
            </div>
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
            onClick={handleMerge}
            disabled={pdfFiles.length < 2 || merging}
            className={`font-bold py-2.5 px-6 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 shadow-md cursor-pointer ${
              pdfFiles.length < 2 || merging
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed shadow-none'
                : 'bg-corporate hover:bg-corporate/90 text-white dark:bg-gold dark:text-navy dark:hover:bg-amber-500'
            }`}
          >
            {merging ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Merging Files...</span>
              </>
            ) : (
              <>
                <Layers size={14} />
                <span>Merge PDF Files</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
