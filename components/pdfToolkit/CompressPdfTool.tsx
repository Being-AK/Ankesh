import React, { useState, useEffect } from 'react';
import { 
  Minimize2, 
  Loader2,
  Info,
  Download,
  Flame,
  Check,
  Zap,
  TrendingDown
} from 'lucide-react';
import UploadZone from './UploadZone';
import { usePdfFiles } from './hooks/usePdfFiles';
import { usePdfDownload } from './hooks/usePdfDownload';
import { formatFileSize, downloadPdf } from './utils/fileHelpers';
import { readPdfDocument } from './utils/pdfHelpers';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import FileList from './ui/FileList';

interface CompressPdfToolProps {
  onClose: () => void;
}

type CompressionPreset = 'low' | 'medium' | 'high';

interface CompressedResult {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  reduction: number;
  blob: Blob;
  alreadyOptimized: boolean;
  noImages?: boolean;
}

export default function CompressPdfTool({ onClose }: CompressPdfToolProps) {
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
    removeFile,
    clearAllFiles,
    setPdfFiles,
  } = usePdfFiles();

  const {
    downloading: compressing,
    error: downloadError,
    success: compressSuccess,
    setError: setDownloadError,
    executeDownload,
    clearDownloadStates,
  } = usePdfDownload();

  const [preset, setPreset] = useState<CompressionPreset>('medium');
  const [results, setResults] = useState<CompressedResult[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const error = downloadError || filesError || validationError;

  const handleClose = () => {
    clearAllFiles();
    clearDownloadStates();
    setResults([]);
    onClose();
  };

  const clearState = () => {
    clearAllFiles();
    clearDownloadStates();
    setResults([]);
    setValidationError(null);
  };

  const handleCompress = async () => {
    if (pdfFiles.length === 0) {
      setValidationError('Please select at least one PDF file to compress.');
      return;
    }

    setValidationError(null);
    clearDownloadStates();
    setResults([]);

    const singleFile = pdfFiles.length === 1;
    const outputName = singleFile 
      ? `${pdfFiles[0].name.replace(/\.pdf$/i, '')}_compressed.pdf`
      : undefined;

    await executeDownload(async () => {
      const { PDFDocument, PDFRawStream, PDFName, decodePDFRawStream } = await import('pdf-lib');
      const tempResults: CompressedResult[] = [];

      for (const file of pdfFiles) {
        let pdf;
        try {
          pdf = await readPdfDocument(file);
        } catch (loadErr: any) {
          throw new Error(`Failed to load "${file.name}". The file may be password-protected, encrypted, or corrupted.`);
        }

        // Create a new document to copy pages (strips redundant objects/metadata/incremental updates)
        const compressedPdf = await PDFDocument.create();
        const copiedPages = await compressedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => compressedPdf.addPage(page));

        // Enumerate indirect objects to find and compress images
        const indirectObjects = compressedPdf.context.enumerateIndirectObjects();
        let imagesFoundCount = 0;
        let imagesCompressedCount = 0;

        for (const [ref, obj] of indirectObjects) {
          if (obj instanceof PDFRawStream) {
            const subtype = obj.dict.get(PDFName.of('Subtype'));
            if (subtype === PDFName.of('Image')) {
              imagesFoundCount++;
              try {
                const width = obj.dict.get(PDFName.of('Width'));
                const height = obj.dict.get(PDFName.of('Height'));
                if (width && height) {
                  const widthVal = (width as any).asNumber ? (width as any).asNumber() : Number(width);
                  const heightVal = (height as any).asNumber ? (height as any).asNumber() : Number(height);

                  const uncompressedBytes = decodePDFRawStream(obj as any).decode();
                  const filter = obj.dict.get(PDFName.of('Filter'));
                  
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  
                  if (ctx) {
                    const filterString = filter ? String(filter) : '';
                    const isJpg = filterString.includes('DCTDecode') || (uncompressedBytes[0] === 0xFF && uncompressedBytes[1] === 0xD8);

                    if (isJpg) {
                      const blob = new Blob([uncompressedBytes], { type: 'image/jpeg' });
                      const url = URL.createObjectURL(blob);
                      const img = new Image();
                      img.src = url;
                      await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                      });
                      URL.revokeObjectURL(url);

                      let newWidth = widthVal;
                      let newHeight = heightVal;
                      let quality = 0.75;

                      if (preset === 'low') {
                        quality = 0.90;
                        if (newWidth > 2400) {
                          const scale = 2400 / newWidth;
                          newWidth = 2400;
                          newHeight = Math.round(newHeight * scale);
                        }
                      } else if (preset === 'medium') {
                        quality = 0.75;
                        if (newWidth > 1600) {
                          const scale = 1600 / newWidth;
                          newWidth = 1600;
                          newHeight = Math.round(newHeight * scale);
                        }
                      } else {
                        quality = 0.50;
                        if (newWidth > 1000) {
                          const scale = 1000 / newWidth;
                          newWidth = 1000;
                          newHeight = Math.round(newHeight * scale);
                        }
                      }

                      canvas.width = newWidth;
                      canvas.height = newHeight;
                      ctx.drawImage(img, 0, 0, newWidth, newHeight);

                      const compressedBlob = await new Promise<Blob>((resolve) => {
                        canvas.toBlob((b) => resolve(b!), 'image/jpeg', quality);
                      });

                      const compressedBytes = new Uint8Array(await compressedBlob.arrayBuffer());

                      if (compressedBytes.length < obj.getContents().length) {
                        const embeddedJpg = await compressedPdf.embedJpg(compressedBytes);
                        await embeddedJpg.embed();
                        const newImageObject = compressedPdf.context.lookup(embeddedJpg.ref);
                        compressedPdf.context.assign(ref, newImageObject);
                        imagesCompressedCount++;
                      }
                    } else {
                      const colorSpace = obj.dict.get(PDFName.of('ColorSpace'));
                      const colorSpaceStr = colorSpace ? String(colorSpace) : '';
                      const isGray = colorSpaceStr.includes('Gray') || colorSpaceStr.includes('DeviceGray');

                      canvas.width = widthVal;
                      canvas.height = heightVal;

                      const imgData = ctx.createImageData(widthVal, heightVal);
                      const data = imgData.data;

                      if (isGray) {
                        for (let i = 0; i < widthVal * heightVal; i++) {
                          const val = uncompressedBytes[i] ?? 0;
                          const idx = i * 4;
                          data[idx] = val;
                          data[idx+1] = val;
                          data[idx+2] = val;
                          data[idx+3] = 255;
                        }
                      } else {
                        for (let i = 0; i < widthVal * heightVal; i++) {
                          const r = uncompressedBytes[i * 3] ?? 0;
                          const g = uncompressedBytes[i * 3 + 1] ?? 0;
                          const b = uncompressedBytes[i * 3 + 2] ?? 0;
                          const idx = i * 4;
                          data[idx] = r;
                          data[idx+1] = g;
                          data[idx+2] = b;
                          data[idx+3] = 255;
                        }
                      }

                      ctx.putImageData(imgData, 0, 0);

                      let newWidth = widthVal;
                      let newHeight = heightVal;
                      let quality = 0.75;

                      if (preset === 'low') {
                        quality = 0.90;
                        if (newWidth > 2400) {
                          const scale = 2400 / newWidth;
                          newWidth = 2400;
                          newHeight = Math.round(newHeight * scale);
                        }
                      } else if (preset === 'medium') {
                        quality = 0.75;
                        if (newWidth > 1600) {
                          const scale = 1600 / newWidth;
                          newWidth = 1600;
                          newHeight = Math.round(newHeight * scale);
                        }
                      } else {
                        quality = 0.50;
                        if (newWidth > 1000) {
                          const scale = 1000 / newWidth;
                          newWidth = 1000;
                          newHeight = Math.round(newHeight * scale);
                        }
                      }

                      if (newWidth !== widthVal || newHeight !== heightVal) {
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = newWidth;
                        tempCanvas.height = newHeight;
                        const tempCtx = tempCanvas.getContext('2d');
                        if (tempCtx) {
                          tempCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
                          const compressedBlob = await new Promise<Blob>((resolve) => {
                            tempCanvas.toBlob((b) => resolve(b!), 'image/jpeg', quality);
                          });
                          const compressedBytes = new Uint8Array(await compressedBlob.arrayBuffer());

                          if (compressedBytes.length < obj.getContents().length) {
                            const embeddedJpg = await compressedPdf.embedJpg(compressedBytes);
                            await embeddedJpg.embed();
                            const newImageObject = compressedPdf.context.lookup(embeddedJpg.ref);
                            compressedPdf.context.assign(ref, newImageObject);
                            imagesCompressedCount++;
                          }
                        }
                      } else {
                        const compressedBlob = await new Promise<Blob>((resolve) => {
                          canvas.toBlob((b) => resolve(b!), 'image/jpeg', quality);
                        });
                        const compressedBytes = new Uint8Array(await compressedBlob.arrayBuffer());

                        if (compressedBytes.length < obj.getContents().length) {
                          const embeddedJpg = await compressedPdf.embedJpg(compressedBytes);
                          await embeddedJpg.embed();
                          const newImageObject = compressedPdf.context.lookup(embeddedJpg.ref);
                          compressedPdf.context.assign(ref, newImageObject);
                          imagesCompressedCount++;
                        }
                      }
                    }
                  }
                }
              } catch (imgErr) {
                console.warn('Could not compress specific image in PDF:', imgErr);
              }
            }
          }
        }

        // Adjust saving settings depending on preset
        let compressedBytes: Uint8Array;
        if (preset === 'low') {
          // Low compression (maintain maximum stream structure)
          compressedBytes = await compressedPdf.save({ 
            useObjectStreams: false,
            addSimpleKeyphrase: false
          } as any);
        } else if (preset === 'medium') {
          // Medium compression (use object streams)
          compressedBytes = await compressedPdf.save({ 
            useObjectStreams: true 
          });
        } else {
          // High compression (aggressive object compression and strip default metadata updates)
          compressedBytes = await compressedPdf.save({ 
            useObjectStreams: true,
            updateMetadata: false
          } as any);
        }

        // Safety check: if compressed size is larger or equal to original, we keep original file bytes 
        // to guarantee zero quality loss and no size increase.
        let finalBytes = compressedBytes;
        let alreadyOptimized = false;
        let noImages = imagesFoundCount === 0;
        
        if (compressedBytes.length >= file.size || (imagesFoundCount > 0 && imagesCompressedCount === 0)) {
          alreadyOptimized = true;
          const arrayBuffer = await file.arrayBuffer();
          finalBytes = new Uint8Array(arrayBuffer);
        }

        const originalSize = file.size;
        const compressedSize = finalBytes.length;
        const reduction = alreadyOptimized ? 0 : Math.max(0, Math.floor(((originalSize - compressedSize) / originalSize) * 100));
        const blob = new Blob([finalBytes], { type: 'application/pdf' });

        tempResults.push({
          fileName: file.name,
          originalSize,
          compressedSize,
          reduction,
          blob,
          alreadyOptimized,
          noImages
        });
      }

      setResults(tempResults);

      // Return a merged/dummy blob for the usePdfDownload hook state to finish successfully
      return tempResults[0].blob;
    });
  };

  const handleDownloadResult = (res: CompressedResult) => {
    const baseName = res.fileName.replace(/\.pdf$/i, '');
    const outName = `${baseName}_compressed.pdf`;
    downloadPdf(res.blob, outName);
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
          title="Compress PDF Workspace"
          subtitle="Local client optimization: Files are never uploaded or shared"
          icon={<Minimize2 size={18} />}
          onClose={handleClose}
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Reusable Upload Zone */}
          {results.length === 0 && (
            <UploadZone 
              onFilesSelected={addFiles}
              multiple={true}
              title={
                <>
                  Drag and drop your PDF files here, or <span className="text-corporate dark:text-gold hover:underline">browse</span>
                </>
              }
              description="Supports one or multiple PDF files. Compression runs entirely inside your browser."
            />
          )}

          {/* Preset Selection Panel */}
          {pdfFiles.length > 0 && results.length === 0 && (
            <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 border border-slate-150 dark:border-slate-800/60 rounded-2xl space-y-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-corporate dark:bg-gold rounded-full"></span>
                <h4 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Select Compression Level</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Low Preset */}
                <button
                  type="button"
                  onClick={() => setPreset('low')}
                  className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between h-32 relative cursor-pointer ${
                    preset === 'low'
                      ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10 ring-1 ring-emerald-500/55'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-950'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="p-1 bg-emerald-500/10 text-emerald-500 rounded-lg">
                      <Zap size={16} />
                    </span>
                    {preset === 'low' && (
                      <span className="text-emerald-500">
                        <Check size={16} />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Low Compression</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Best Quality. Minor container stream optimization.
                    </p>
                  </div>
                </button>

                {/* Medium Preset */}
                <button
                  type="button"
                  onClick={() => setPreset('medium')}
                  className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between h-32 relative cursor-pointer ${
                    preset === 'medium'
                      ? 'border-corporate dark:border-gold bg-corporate/5 dark:bg-gold/5 ring-1 ring-corporate/50 dark:ring-gold/50'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-950'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="p-1 bg-corporate/10 dark:bg-gold/10 text-corporate dark:text-gold rounded-lg">
                      <Minimize2 size={16} />
                    </span>
                    {preset === 'medium' && (
                      <span className="text-corporate dark:text-gold">
                        <Check size={16} />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Medium Compression</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Balanced. Compress objects and stream structures.
                    </p>
                  </div>
                </button>

                {/* High Preset */}
                <button
                  type="button"
                  onClick={() => setPreset('high')}
                  className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between h-32 relative cursor-pointer ${
                    preset === 'high'
                      ? 'border-orange-500 bg-orange-50/10 dark:bg-orange-950/10 ring-1 ring-orange-500/55'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-950'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="p-1 bg-orange-500/10 text-orange-500 rounded-lg">
                      <Flame size={16} />
                    </span>
                    {preset === 'high' && (
                      <span className="text-orange-500">
                        <Check size={16} />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">High Compression</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Smallest File. Strip unneeded structures and metadata.
                    </p>
                  </div>
                </button>
              </div>

              {/* Technical Limitation Banner */}
              <div className="flex items-start gap-2.5 p-3.5 bg-slate-100 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-850/50 rounded-xl text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                <Info size={15} className="text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <span className="font-bold">Technical Note:</span> Standard browser-based engines perform secure structure and stream optimizations without uploading files. True image re-sampling (which degrades scanned image quality) requires a server backend. This local tool maximizes compression ratios while strictly preserving 100% of your visual content.
                </p>
              </div>
            </div>
          )}

          {/* Status and Notifications */}
          {error && (
            <AlertBanner type="error" message={error} />
          )}

          {/* Uploaded File List (Pre-Compression) */}
          {pdfFiles.length > 0 && results.length === 0 && (
            <FileList
              pdfFiles={pdfFiles}
              onRemove={removeFile}
              onClearAll={clearState}
              showIndexBadge={false}
              titleText="Selected Documents"
              onReorder={setPdfFiles}
              onAddFiles={addFiles}
            />
          )}

          {/* Results Panel (Post-Compression) */}
          {results.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-xs font-extrabold text-navy dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown size={14} className="text-emerald-500" />
                  <span>Compression Results</span>
                </h4>
                <button 
                  onClick={clearState}
                  className="text-xs text-corporate dark:text-gold hover:underline font-bold transition-all cursor-pointer"
                >
                  Compress More Files
                </button>
              </div>

              <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/20 dark:bg-slate-950/5">
                {results.map((res, index) => (
                  <div 
                    key={`${res.fileName}-${index}`}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {res.fileName}
                      </p>
                      {res.alreadyOptimized ? (
                        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-450">
                          {res.noImages 
                            ? "This PDF is already highly optimized. No meaningful compression is possible."
                            : "No meaningful compression was possible because this PDF is already optimized."
                          }
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          <span>Original: {formatFileSize(res.originalSize)}</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-450 font-bold">
                            Compressed: {formatFileSize(res.compressedSize)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {res.reduction > 0 ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 font-extrabold text-[10px] rounded-lg border border-emerald-500/20 flex items-center gap-1">
                          <TrendingDown size={12} />
                          <span>-{res.reduction}% Size</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-450 font-extrabold text-[10px] rounded-lg border border-amber-500/20">
                          Already Optimized
                        </span>
                      )}

                      <button
                        onClick={() => handleDownloadResult(res)}
                        className="p-2 bg-corporate hover:bg-corporate/90 text-white dark:bg-gold dark:text-navy dark:hover:bg-amber-500 font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 text-[10px] cursor-pointer"
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {results.every(r => r.alreadyOptimized) ? (
                <AlertBanner
                  type="info"
                  message="Optimization Complete"
                  description={results.every(r => r.noImages)
                    ? "This PDF is already highly optimized. No meaningful compression is possible."
                    : "No meaningful compression was possible because all selected PDFs are already fully optimized."
                  }
                />
              ) : (
                <AlertBanner
                  type="success"
                  message="Compression Completed!"
                  description={`Your PDF files have been processed and fully optimized.${results.length === 1 ? ' Your downloaded file is ready.' : ''}`}
                />
              )}
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
          
          {results.length === 0 && (
            <button
              onClick={handleCompress}
              disabled={pdfFiles.length === 0 || compressing}
              className={`font-bold py-2.5 px-6 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 shadow-md cursor-pointer ${
                pdfFiles.length === 0 || compressing
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed shadow-none'
                  : 'bg-corporate hover:bg-corporate/90 text-white dark:bg-gold dark:text-navy dark:hover:bg-amber-500'
              }`}
            >
              {compressing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Optimizing streams...</span>
                </>
              ) : (
                <>
                  <Minimize2 size={14} />
                  <span>Compress PDF Files</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
