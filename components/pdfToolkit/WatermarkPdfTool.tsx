import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  RotateCw, 
  Trash2, 
  FileText, 
  Download, 
  Check, 
  Sliders, 
  Grid, 
  Layers, 
  Loader2,
  X
} from 'lucide-react';
import UploadZone from './UploadZone';
import { formatFileSize, downloadPdf } from './utils/fileHelpers';
import { parsePageRanges } from './utils/pdfHelpers';
import { validatePdfFile } from './utils/validation';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import LoadingOverlay from './ui/LoadingOverlay';

interface WatermarkPdfToolProps {
  onClose: () => void;
}

// Coordinate preset maps for position calculation on the PDF page
const getCoordinates = (
  pos: string, 
  pageW: number, 
  pageH: number, 
  itemW: number, 
  itemH: number
) => {
  const padding = 30;
  switch (pos) {
    case 'center':
      return { x: (pageW - itemW) / 2, y: (pageH - itemH) / 2 };
    case 'top-left':
      return { x: padding, y: pageH - padding - itemH };
    case 'top-right':
      return { x: pageW - padding - itemW, y: pageH - padding - itemH };
    case 'bottom-left':
      return { x: padding, y: padding };
    case 'bottom-right':
      return { x: pageW - padding - itemW, y: padding };
    case 'top-center':
      return { x: (pageW - itemW) / 2, y: pageH - padding - itemH };
    case 'bottom-center':
      return { x: (pageW - itemW) / 2, y: padding };
    case 'left-center':
      return { x: padding, y: (pageH - itemH) / 2 };
    case 'right-center':
      return { x: pageW - padding - itemW, y: (pageH - itemH) / 2 };
    default:
      return { x: (pageW - itemW) / 2, y: (pageH - itemH) / 2 };
  }
};

const getPositionClass = (pos: string) => {
  switch (pos) {
    case 'center': return 'inset-0 flex items-center justify-center';
    case 'top-left': return 'top-6 left-6 absolute';
    case 'top-right': return 'top-6 right-6 absolute';
    case 'bottom-left': return 'bottom-6 left-6 absolute';
    case 'bottom-right': return 'bottom-6 right-6 absolute';
    case 'top-center': return 'top-6 left-1/2 -translate-x-1/2 absolute';
    case 'bottom-center': return 'bottom-6 left-1/2 -translate-x-1/2 absolute';
    case 'left-center': return 'left-6 top-1/2 -translate-y-1/2 absolute';
    case 'right-center': return 'right-6 top-1/2 -translate-y-1/2 absolute';
    case 'tile': return 'absolute inset-0 grid grid-cols-3 grid-rows-4 p-4 gap-2 items-center justify-items-center pointer-events-none';
    default: return 'inset-0 flex items-center justify-center';
  }
};

// Converts image files (PNG, JPG, JPEG, WEBP) to raw PNG Uint8Array bytes using an offline browser canvas
const convertImageToPngBytes = async (imageFile: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas 2d context.'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to generate canvas blob.'));
            return;
          }
          const blobReader = new FileReader();
          blobReader.onload = () => {
            if (blobReader.result instanceof ArrayBuffer) {
              resolve(new Uint8Array(blobReader.result));
            } else {
              reject(new Error('Failed to read canvas blob as ArrayBuffer.'));
            }
          };
          blobReader.onerror = () => reject(blobReader.error);
          blobReader.readAsArrayBuffer(blob);
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image structure.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(imageFile);
  });
};

export default function WatermarkPdfTool({ onClose }: WatermarkPdfToolProps) {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const checkMd = () => setIsMd(window.innerWidth >= 768);
    checkMd();
    window.addEventListener('resize', checkMd);
    return () => window.removeEventListener('resize', checkMd);
  }, []);

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [outputName, setOutputName] = useState<string>('watermarked_document.pdf');
  const [status, setStatus] = useState<'idle' | 'loading_pdf' | 'applying' | 'saving' | 'downloading' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Watermark configurations
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  
  // Text Watermark Config
  const [textText, setTextText] = useState<string>('CONFIDENTIAL');
  const [textFontSize, setTextFontSize] = useState<number>(48);
  const [textOpacity, setTextOpacity] = useState<number>(50);
  const [textRotation, setTextRotation] = useState<number>(45);
  const [textColor, setTextColor] = useState<string>('#ff0000');

  // Image Watermark Config
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState<number>(100);
  const [imageOpacity, setImageOpacity] = useState<number>(50);
  const [imageRotation, setImageRotation] = useState<number>(0);

  // Position and Placement options
  const [position, setPosition] = useState<string>('center');
  const [applyTo, setApplyTo] = useState<'all' | 'current' | 'odd' | 'even' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<string>('');

  // Focus and Escape listeners for accessibility
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Save active element to restore it on unmount
    const activeElement = document.activeElement as HTMLElement;

    // Focus workspace container
    workspaceRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (activeElement && typeof activeElement.focus === 'function') {
        activeElement.focus();
      }
    };
  }, []);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const clearState = () => {
    setFile(null);
    setPageCount(0);
    setError(null);
    setStatus('idle');
    setImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  const handleClose = () => {
    clearState();
    onClose();
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    const selectedFile = selectedFiles[0];

    const validation = validatePdfFile(selectedFile);
    if (!validation.isValid) {
      setError(validation.error || 'Only valid PDF documents are supported.');
      return;
    }

    setError(null);
    setStatus('loading_pdf');

    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const count = pdfDoc.getPageCount();

      setFile(selectedFile);
      setPageCount(count);
      
      const baseName = selectedFile.name.replace(/\.pdf$/i, '');
      setOutputName(`${baseName}_watermarked.pdf`);
      setStatus('idle');
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      const errStr = err.message || String(err);
      if (
        errStr.toLowerCase().includes('encrypt') || 
        errStr.toLowerCase().includes('password') ||
        err.name === 'EncryptedPDFError' ||
        errStr.includes('EncryptFilterNotDefinedError')
      ) {
        setError('This PDF is password-protected or encrypted. Please unlock it using the "Unlock PDF" tool first.');
      } else {
        setError('Failed to load PDF. The document may be corrupted or invalid.');
      }
      setStatus('idle');
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const imgFile = e.target.files[0];
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(imgFile.type) && !/\.(png|jpe?g|webp)$/i.test(imgFile.name)) {
        setError('Unsupported image format. Please select a PNG, JPG, JPEG, or WEBP image.');
        return;
      }

      setError(null);
      setImageFile(imgFile);

      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(URL.createObjectURL(imgFile));
    }
  };

  const handleApplyWatermark = async () => {
    if (!file) return;

    if (watermarkType === 'image' && !imageFile) {
      setError('Please upload an image to use as a watermark.');
      return;
    }

    if (watermarkType === 'text' && !textText.trim()) {
      setError('Watermark text cannot be empty.');
      return;
    }

    setError(null);
    setStatus('applying');

    try {
      const { PDFDocument, rgb, degrees, StandardFonts } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();

      // Parse and obtain page indices to apply to
      let targetPages: number[] = [];
      if (applyTo === 'all') {
        targetPages = pdfDoc.getPageIndices();
      } else if (applyTo === 'current') {
        targetPages = [0]; // Page 1
      } else if (applyTo === 'odd') {
        targetPages = pdfDoc.getPageIndices().filter((idx) => idx % 2 === 0);
      } else if (applyTo === 'even') {
        targetPages = pdfDoc.getPageIndices().filter((idx) => idx % 2 !== 0);
      } else if (applyTo === 'custom') {
        try {
          targetPages = parsePageRanges(customRange, totalPages);
        } catch (rangeErr: any) {
          setError(rangeErr.message || 'Invalid page range specified.');
          setStatus('idle');
          return;
        }
      }

      // Embed assets
      let helveticaFont;
      let embeddedImage;
      let imgW = 0;
      let imgH = 0;

      if (watermarkType === 'text') {
        helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      } else {
        if (!imageFile) throw new Error('Watermark image file is missing.');
        const imgBytes = await convertImageToPngBytes(imageFile);
        embeddedImage = await pdfDoc.embedPng(imgBytes);

        const originalScale = embeddedImage.scale(1);
        const scaleFactor = imageScale / 100;
        imgW = originalScale.width * scaleFactor;
        imgH = originalScale.height * scaleFactor;
      }

      // Convert hex color to rgb parameters
      const hexToRgb = (hex: string) => {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
        return { r, g, b };
      };
      const rgbColor = watermarkType === 'text' ? hexToRgb(textColor) : { r: 0, g: 0, b: 0 };

      // Apply watermark page-by-page
      for (const pageIdx of targetPages) {
        const page = pdfDoc.getPage(pageIdx);
        const { width: pageW, height: pageH } = page.getSize();

        if (watermarkType === 'text') {
          const textWidth = helveticaFont.widthOfTextAtSize(textText, textFontSize);
          const textHeight = textFontSize * 0.8;

          if (position === 'tile') {
            const cols = 3;
            const rows = 4;
            for (let c = 0; c < cols; c++) {
              for (let r = 0; r < rows; r++) {
                const gridX = (pageW / (cols + 1)) * (c + 1) - textWidth / 2;
                const gridY = (pageH / (rows + 1)) * (r + 1) - textHeight / 2;
                page.drawText(textText, {
                  x: gridX,
                  y: gridY,
                  size: textFontSize,
                  font: helveticaFont,
                  color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                  rotate: degrees(textRotation),
                  opacity: textOpacity / 100,
                });
              }
            }
          } else {
            const { x, y } = getCoordinates(position, pageW, pageH, textWidth, textHeight);
            page.drawText(textText, {
              x,
              y,
              size: textFontSize,
              font: helveticaFont,
              color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
              rotate: degrees(textRotation),
              opacity: textOpacity / 100,
            });
          }
        } else {
          if (!embeddedImage) throw new Error('Embedded image object is invalid.');

          if (position === 'tile') {
            const cols = 3;
            const rows = 4;
            for (let c = 0; c < cols; c++) {
              for (let r = 0; r < rows; r++) {
                const gridX = (pageW / (cols + 1)) * (c + 1) - imgW / 2;
                const gridY = (pageH / (rows + 1)) * (r + 1) - imgH / 2;
                page.drawImage(embeddedImage, {
                  x: gridX,
                  y: gridY,
                  width: imgW,
                  height: imgH,
                  rotate: degrees(imageRotation),
                  opacity: imageOpacity / 100,
                });
              }
            }
          } else {
            const { x, y } = getCoordinates(position, pageW, pageH, imgW, imgH);
            page.drawImage(embeddedImage, {
              x,
              y,
              width: imgW,
              height: imgH,
              rotate: degrees(imageRotation),
              opacity: imageOpacity / 100,
            });
          }
        }
      }

      setStatus('saving');
      const pdfBytes = await pdfDoc.save();

      setStatus('downloading');
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadPdf(blob, outputName);

      setStatus('success');
    } catch (err: any) {
      console.error('Error applying watermark:', err);
      setError(err.message || 'An unexpected error occurred during processing.');
      setStatus('idle');
    }
  };

  const textPresetList = ['CONFIDENTIAL', 'DRAFT', 'COPY', 'PAID', 'PREVIEW', 'OFFICIAL'];
  const rotationPresets = [0, 45, -45, 90];

  const positionPresets = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'left-center', label: 'Left Center' },
    { id: 'center', label: 'Center' },
    { id: 'right-center', label: 'Right Center' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom Center' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto transition-all duration-300"
      style={{ 
        left: isMd ? 'var(--pdf-sidebar-width, 256px)' : '0px', 
        paddingLeft: '16px', 
        paddingRight: '16px' 
      }}
    >
      <div 
        ref={workspaceRef}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] my-4 md:my-8 animate-scale-in outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="watermark-title"
      >
        {/* Loading / Progress Overlays */}
        {status === 'loading_pdf' && <LoadingOverlay message="Loading PDF..." />}
        {status === 'applying' && <LoadingOverlay message="Applying watermark..." />}
        {status === 'saving' && <LoadingOverlay message="Saving PDF..." />}
        {status === 'downloading' && <LoadingOverlay message="Preparing download..." />}

        {/* Workspace Header */}
        <WorkspaceHeader
          title="Watermark PDF Workspace"
          subtitle="Local secure sandboxing: Customize and apply watermarks entirely client-side"
          icon={<Type size={18} />}
          onClose={handleClose}
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!file ? (
            <UploadZone
              onFilesSelected={handleFilesSelected}
              multiple={false}
              title={
                <>
                  Drag and drop your PDF here, or <span className="text-corporate dark:text-gold hover:underline">browse</span>
                </>
              }
              description="Supports one PDF file. Processed entirely client-side."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Config Forms (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* File overview card */}
                <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 id="watermark-title" className="text-xs font-bold text-navy dark:text-white truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                        {formatFileSize(file.size)} • {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearState}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Remove PDF File"
                    aria-label="Remove PDF File"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Tab selectors for Text vs Image Watermark */}
                <div className="bg-slate-100/60 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setWatermarkType('text')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      watermarkType === 'text'
                        ? 'bg-white dark:bg-slate-900 text-corporate dark:text-gold shadow-md'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-900/40 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <Type size={14} />
                    <span>Text Watermark</span>
                  </button>
                  <button
                    onClick={() => setWatermarkType('image')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      watermarkType === 'image'
                        ? 'bg-white dark:bg-slate-900 text-corporate dark:text-gold shadow-md'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-900/40 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <ImageIcon size={14} />
                    <span>Image Watermark</span>
                  </button>
                </div>

                {/* Conditional Form Controls */}
                <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-corporate dark:bg-gold rounded-full"></span>
                    <h4 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">
                      {watermarkType === 'text' ? 'Text Styling' : 'Image Configuration'}
                    </h4>
                  </div>

                  {watermarkType === 'text' ? (
                    <div className="space-y-4">
                      {/* Watermark text */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Watermark Text
                        </label>
                        <input
                          type="text"
                          value={textText}
                          onChange={(e) => setTextText(e.target.value)}
                          placeholder="CONFIDENTIAL"
                          className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors"
                        />
                        {/* Text presets */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {textPresetList.map((preset) => (
                            <button
                              key={preset}
                              onClick={() => setTextText(preset)}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                textText === preset
                                  ? 'bg-corporate/10 border-corporate text-corporate dark:bg-gold/10 dark:border-gold dark:text-gold'
                                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font Size & Opacity Slider Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              Font Size
                            </label>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{textFontSize}px</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="120"
                            value={textFontSize}
                            onChange={(e) => setTextFontSize(Number(e.target.value))}
                            className="w-full accent-corporate dark:accent-gold cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              Opacity
                            </label>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{textOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={textOpacity}
                            onChange={(e) => setTextOpacity(Number(e.target.value))}
                            className="w-full accent-corporate dark:accent-gold cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Rotation & Color Picker Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              Rotation Angle
                            </label>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{textRotation}°</span>
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min="-360"
                              max="360"
                              value={textRotation}
                              onChange={(e) => setTextRotation(Number(e.target.value))}
                              className="w-20 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-2 py-2 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors"
                            />
                            <div className="flex gap-1 flex-1">
                              {rotationPresets.map((deg) => (
                                <button
                                  key={deg}
                                  onClick={() => setTextRotation(deg)}
                                  className={`flex-1 py-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                                    textRotation === deg
                                      ? 'bg-corporate/10 border-corporate text-corporate dark:bg-gold/10 dark:border-gold dark:text-gold'
                                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                                  }`}
                                >
                                  {deg}°
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Watermark Color
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-250 dark:border-slate-850 shrink-0 shadow-sm">
                              <input
                                type="color"
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                              />
                            </div>
                            <input
                              type="text"
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              placeholder="#ff0000"
                              className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors font-mono uppercase"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Image Upload Row */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Watermark Image (PNG, JPG, JPEG, WEBP)
                        </label>
                        {!imageFile ? (
                          <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-950/10 hover:border-corporate dark:hover:border-gold hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-all duration-350">
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              onChange={handleImageFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <ImageIcon size={20} className="text-slate-450 dark:text-slate-500 mb-2" />
                            <p className="text-[11px] font-bold text-navy dark:text-white">
                              Click to select or drag image file
                            </p>
                            <p className="text-[9px] text-slate-450 dark:text-slate-500 mt-0.5">
                              Transparent PNGs are highly recommended
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-50 dark:bg-slate-950/30 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {imagePreviewUrl && (
                                <img
                                  src={imagePreviewUrl}
                                  alt="Preview"
                                  className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-navy dark:text-white truncate" title={imageFile.name}>
                                  {imageFile.name}
                                </p>
                                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">
                                  {formatFileSize(imageFile.size)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setImageFile(null);
                                if (imagePreviewUrl) {
                                  URL.revokeObjectURL(imagePreviewUrl);
                                  setImagePreviewUrl(null);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                              title="Remove image"
                              aria-label="Remove image"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Scale & Opacity Slider Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              Image Scale
                            </label>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{imageScale}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="200"
                            value={imageScale}
                            onChange={(e) => setImageScale(Number(e.target.value))}
                            className="w-full accent-corporate dark:accent-gold cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              Image Opacity
                            </label>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{imageOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={imageOpacity}
                            onChange={(e) => setImageOpacity(Number(e.target.value))}
                            className="w-full accent-corporate dark:accent-gold cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Image Rotation Preset row */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Image Rotation
                          </label>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{imageRotation}°</span>
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            min="-360"
                            max="360"
                            value={imageRotation}
                            onChange={(e) => setImageRotation(Number(e.target.value))}
                            className="w-20 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-2 py-2 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors"
                          />
                          <div className="flex gap-1 flex-1">
                            {rotationPresets.map((deg) => (
                              <button
                                key={deg}
                                onClick={() => setImageRotation(deg)}
                                className={`flex-1 py-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                                  imageRotation === deg
                                    ? 'bg-corporate/10 border-corporate text-corporate dark:bg-gold/10 dark:border-gold dark:text-gold'
                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                                }`}
                              >
                                {deg}°
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Position preset selectors */}
                <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-corporate dark:bg-gold rounded-full"></span>
                      <h4 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Positioning Preset</h4>
                    </div>
                    <button
                      onClick={() => setPosition('tile')}
                      className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        position === 'tile'
                          ? 'bg-corporate/10 border-corporate text-corporate dark:bg-gold/10 dark:border-gold dark:text-gold'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <Grid size={11} />
                      <span>Tile Across Grid</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-w-[360px] mx-auto">
                    {positionPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setPosition(preset.id)}
                        className={`py-2 px-1.5 text-[10px] font-bold rounded-xl border transition-all cursor-pointer text-center ${
                          position === preset.id
                            ? 'bg-corporate/10 border-corporate text-corporate dark:bg-gold/10 dark:border-gold dark:text-gold shadow-sm'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply To Pages list & custom text input */}
                <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-corporate dark:bg-gold rounded-full"></span>
                    <h4 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">Apply To Pages</h4>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'All Pages' },
                      { id: 'current', label: 'First Page Only' },
                      { id: 'odd', label: 'Odd Pages Only' },
                      { id: 'even', label: 'Even Pages Only' },
                      { id: 'custom', label: 'Custom Range' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setApplyTo(opt.id as any);
                          setError(null);
                        }}
                        className={`py-1.5 px-3 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                          applyTo === opt.id
                            ? 'bg-corporate/10 border-corporate text-corporate dark:bg-gold/10 dark:border-gold dark:text-gold shadow-sm'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {applyTo === 'custom' && (
                    <div className="space-y-1.5 animate-fade-in pt-1">
                      <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 flex justify-between">
                        <span>Page Range Expression</span>
                        <span className="text-[9px] text-slate-400">e.g. 1-3, 5, 8-10</span>
                      </label>
                      <input
                        type="text"
                        value={customRange}
                        onChange={(e) => {
                          setCustomRange(e.target.value);
                          setError(null);
                        }}
                        placeholder="1-3, 5, 8"
                        className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors"
                      />
                    </div>
                  )}
                </div>

                {/* Output configuration */}
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
                      placeholder="watermarked_document.pdf"
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors"
                    />
                  </div>
                </div>

              </div>

              {/* Right Column: Visual Live Preview (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full sticky top-0 space-y-4">
                  <div className="flex items-center gap-1.5 pl-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <h4 className="text-xs font-extrabold text-navy dark:text-white uppercase tracking-wider">Live Placement Preview</h4>
                  </div>

                  {/* Glassmorphic Sheet representation */}
                  <div className="w-full aspect-[1/1.414] bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-2xl relative shadow-xl overflow-hidden p-6 select-none flex flex-col justify-between max-w-[340px] mx-auto">
                    {/* Simulated Document content block templates */}
                    <div className="space-y-4 opacity-[0.15] dark:opacity-10 pointer-events-none">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-500"></div>
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 bg-slate-500 rounded w-1/2"></div>
                          <div className="h-2.5 bg-slate-500 rounded w-1/3"></div>
                        </div>
                      </div>
                      <div className="h-px bg-slate-300"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-500 rounded"></div>
                        <div className="h-3 bg-slate-500 rounded w-5/6"></div>
                        <div className="h-3 bg-slate-500 rounded w-2/3"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="h-16 bg-slate-500 rounded-lg"></div>
                        <div className="h-16 bg-slate-500 rounded-lg"></div>
                      </div>
                      <div className="space-y-2 pt-2">
                        <div className="h-3 bg-slate-500 rounded w-11/12"></div>
                        <div className="h-3 bg-slate-500 rounded"></div>
                        <div className="h-3 bg-slate-500 rounded w-3/4"></div>
                      </div>
                    </div>

                    {/* Watermark overlay rendering based on placement parameters */}
                    {position === 'tile' ? (
                      <div className={getPositionClass(position)}>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-center">
                            {watermarkType === 'text' ? (
                              <span 
                                className="font-extrabold select-none whitespace-nowrap text-center block"
                                style={{ 
                                  color: textColor, 
                                  opacity: textOpacity / 100,
                                  fontSize: `${Math.max(6, textFontSize * 0.16)}px`,
                                  transform: `rotate(${textRotation}deg)`,
                                  transition: 'all 0.2s ease-out'
                                }}
                              >
                                {textText || 'CONFIDENTIAL'}
                              </span>
                            ) : (
                              imagePreviewUrl ? (
                                <img 
                                  src={imagePreviewUrl} 
                                  alt="Watermark tile" 
                                  className="max-h-10 max-w-10 object-contain"
                                  referrerPolicy="no-referrer"
                                  style={{
                                    opacity: imageOpacity / 100,
                                    transform: `rotate(${imageRotation}deg) scale(${imageScale / 100 * 0.35})`,
                                    transition: 'all 0.2s ease-out'
                                  }}
                                />
                              ) : (
                                <span className="text-[7px] text-slate-300 dark:text-slate-800">No Image</span>
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={getPositionClass(position)}>
                        {watermarkType === 'text' ? (
                          <span 
                            className="font-extrabold select-none whitespace-nowrap text-center block"
                            style={{ 
                              color: textColor, 
                              opacity: textOpacity / 100,
                              fontSize: `${Math.max(10, textFontSize * 0.38)}px`,
                              transform: `rotate(${textRotation}deg)`,
                              transition: 'all 0.2s ease-out'
                            }}
                          >
                            {textText || 'CONFIDENTIAL'}
                          </span>
                        ) : (
                          imagePreviewUrl ? (
                            <img 
                              src={imagePreviewUrl} 
                              alt="Watermark central" 
                              className="max-h-24 max-w-24 object-contain"
                              referrerPolicy="no-referrer"
                              style={{
                                opacity: imageOpacity / 100,
                                transform: `rotate(${imageRotation}deg) scale(${imageScale / 100})`,
                                transition: 'all 0.2s ease-out'
                              }}
                            />
                          ) : (
                            <div className="border border-dashed border-slate-350 dark:border-slate-800 p-3 rounded-xl text-[9px] text-slate-400 font-semibold text-center bg-slate-50/50 dark:bg-slate-950/20 max-w-[140px] shadow-inner">
                              Please upload a watermark image
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Page Number representation */}
                    <div className="text-[8px] text-slate-400 font-bold self-center pt-2 select-none opacity-40">
                      Page 1 of {pageCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error & Success Alerts */}
          {error && <AlertBanner type="error" message={error} />}
          {status === 'success' && (
            <AlertBanner
              type="success"
              message="PDF Watermarked Successfully!"
              description="Your document has been compiled and downloaded with the specified watermark layers."
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
            onClick={handleApplyWatermark}
            disabled={!file || (watermarkType === 'image' && !imageFile) || (watermarkType === 'text' && !textText.trim()) || status !== 'idle'}
            className={`font-bold py-2.5 px-6 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 shadow-md cursor-pointer ${
              !file || (watermarkType === 'image' && !imageFile) || (watermarkType === 'text' && !textText.trim()) || status !== 'idle'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed shadow-none'
                : 'bg-corporate hover:bg-corporate/90 text-white dark:bg-gold dark:text-navy dark:hover:bg-amber-500'
            }`}
          >
            {status === 'idle' ? (
              <>
                <Download size={14} />
                <span>Apply & Download</span>
              </>
            ) : (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing PDF...</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
