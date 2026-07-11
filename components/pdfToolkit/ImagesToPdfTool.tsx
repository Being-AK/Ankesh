import React, { useState, useRef, useEffect } from 'react';
import { 
  FileImage, 
  RotateCw, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Loader2,
  Settings,
  Sliders,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { usePdfDownload } from './hooks/usePdfDownload';
import { useDragDrop } from './hooks/useDragDrop';
import { formatFileSize } from './utils/fileHelpers';
import WorkspaceHeader from './ui/WorkspaceHeader';
import AlertBanner from './ui/AlertBanner';
import LoadingOverlay from './ui/LoadingOverlay';

interface ImagesToPdfToolProps {
  onClose: () => void;
}

interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  src: string; // Preview URL
}

type PageSizeOption = 'a4' | 'letter' | 'original';
type OrientationOption = 'portrait' | 'landscape';
type ScalingOption = 'fit' | 'fill';
type MarginOption = 'none' | 'small' | 'large';

export default function ImagesToPdfTool({ onClose }: ImagesToPdfToolProps) {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const checkMd = () => setIsMd(window.innerWidth >= 768);
    checkMd();
    window.addEventListener('resize', checkMd);
    return () => window.removeEventListener('resize', checkMd);
  }, []);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [outputName, setOutputName] = useState<string>('images_converted.pdf');
  const [validationError, setValidationError] = useState<string | null>(null);
  // Track all created Object URLs to guarantee no memory leaks
  const activeUrlsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Revoke any remaining active URLs on unmount
      activeUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      activeUrlsRef.current.clear();
    };
  }, []);

  const revokeAndTrack = (url: string) => {
    if (activeUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      activeUrlsRef.current.delete(url);
    }
  };

  // PDF Options
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<OrientationOption>('portrait');
  const [imageScaling, setImageScaling] = useState<ScalingOption>('fit');
  const [marginType, setMarginType] = useState<MarginOption>('none');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    downloading: processing,
    error: downloadError,
    success: convertSuccess,
    setError: setConvertError,
    executeDownload,
    clearDownloadStates,
  } = usePdfDownload();

  const error = downloadError || validationError;

  const handleFilesSelected = (files: File[]) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newItems: ImageItem[] = [];

    const promises = files.map((file) => {
      return new Promise<void>((resolve) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const isAllowedExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
        const isAllowedType = allowedTypes.includes(file.type);

        if (!isAllowedType && !isAllowedExt) {
          setValidationError(`Unsupported format for "${file.name}". Only JPG, PNG, and WEBP formats are supported.`);
          resolve();
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const url = URL.createObjectURL(file);
            if (!isMountedRef.current) {
              URL.revokeObjectURL(url);
              resolve();
              return;
            }
            activeUrlsRef.current.add(url);
            newItems.push({
              id: Math.random().toString(36).substring(2, 9),
              file,
              name: file.name,
              size: file.size,
              width: img.naturalWidth,
              height: img.naturalHeight,
              rotation: 0,
              src: url,
            });
            resolve();
          };
          img.onerror = () => {
            setValidationError(`Unable to read image: "${file.name}". It might be corrupted.`);
            resolve();
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(() => {
      if (!isMountedRef.current) {
        // Unmounted during reading; revoke newly created ones immediately
        newItems.forEach((item) => {
          URL.revokeObjectURL(item.src);
        });
        return;
      }
      if (newItems.length > 0) {
        setImages((prev) => [...prev, ...newItems]);
        setValidationError(null);
        clearDownloadStates();
      }
    });
  };

  const {
    dragActive,
    handleDrag,
    handleDrop,
  } = useDragDrop(handleFilesSelected);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) {
        revokeAndTrack(target.src);
      }
      return prev.filter((img) => img.id !== id);
    });
    setValidationError(null);
    clearDownloadStates();
  };

  const rotateImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img;
        return {
          ...img,
          rotation: (img.rotation + 90) % 360,
        };
      })
    );
    clearDownloadStates();
  };

  const moveImageUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
    clearDownloadStates();
  };

  const moveImageDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
    clearDownloadStates();
  };

  const clearState = () => {
    images.forEach((img) => revokeAndTrack(img.src));
    setImages([]);
    setValidationError(null);
    clearDownloadStates();
  };

  const handleClose = () => {
    clearState();
    onClose();
  };

  // Convert canvas to JPG Bytes
  const processImageToJpgBytes = (imageItem: ImageItem): Promise<{ bytes: Uint8Array; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be acquired'));
          return;
        }

        const angleRad = (imageItem.rotation * Math.PI) / 180;
        const is90or270 = imageItem.rotation === 90 || imageItem.rotation === 270;
        
        const targetWidth = is90or270 ? img.naturalHeight : img.naturalWidth;
        const targetHeight = is90or270 ? img.naturalWidth : img.naturalHeight;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw rotated on canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angleRad);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to generate image blob'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result instanceof ArrayBuffer) {
              resolve({
                bytes: new Uint8Array(reader.result),
                width: targetWidth,
                height: targetHeight,
              });
            } else {
              reject(new Error('FileReader returned empty result'));
            }
          };
          reader.readAsArrayBuffer(blob);
        }, 'image/jpeg', 0.95);
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image file "${imageItem.name}"`));
      };
      img.src = imageItem.src;
    });
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) {
      setValidationError('Please select at least one image to convert.');
      return;
    }

    setValidationError(null);

    await executeDownload(async () => {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      const failedFiles: string[] = [];

      for (const item of images) {
        try {
          // Process rotation and format through canvas
          const { bytes, width: imgWidth, height: imgHeight } = await processImageToJpgBytes(item);

          let pageWidth = 595.27; // default A4
          let pageHeight = 841.89;

          if (pageSize === 'letter') {
            pageWidth = 612;
            pageHeight = 792;
          } else if (pageSize === 'original') {
            // Use 1 px = 0.75 points ratio to prevent extremely oversized/undersized pages
            pageWidth = Math.max(100, imgWidth * 0.75);
            pageHeight = Math.max(100, imgHeight * 0.75);
          }

          // Swap for landscape
          if (pageSize !== 'original' && orientation === 'landscape') {
            const temp = pageWidth;
            pageWidth = pageHeight;
            pageHeight = temp;
          }

          const marginMap = {
            none: 0,
            small: 20,
            large: 50,
          };
          const margin = marginMap[marginType];

          const printableWidth = Math.max(50, pageWidth - (margin * 2));
          const printableHeight = Math.max(50, pageHeight - (margin * 2));

          let drawWidth = printableWidth;
          let drawHeight = printableHeight;
          let drawX = margin;
          let drawY = margin;

          if (imageScaling === 'fit') {
            const imgRatio = imgWidth / imgHeight;
            const printableRatio = printableWidth / printableHeight;

            if (imgRatio > printableRatio) {
              drawWidth = printableWidth;
              drawHeight = printableWidth / imgRatio;
            } else {
              drawHeight = printableHeight;
              drawWidth = printableHeight * imgRatio;
            }

            drawX = margin + (printableWidth - drawWidth) / 2;
            drawY = margin + (printableHeight - drawHeight) / 2;
          }

          const page = pdfDoc.addPage([pageWidth, pageHeight]);
          const embeddedImg = await pdfDoc.embedJpg(bytes);

          page.drawImage(embeddedImg, {
            x: drawX,
            y: drawY,
            width: drawWidth,
            height: drawHeight,
          });

        } catch (err: any) {
          console.error(`Error processing image "${item.name}":`, err);
          failedFiles.push(item.name);
        }
      }

      if (failedFiles.length === images.length) {
        throw new Error('All uploaded images failed to process. Please check if files are corrupted.');
      }

      if (failedFiles.length > 0) {
        setValidationError(`Warning: The following files could not be converted: ${failedFiles.join(', ')}`);
      }

      const pdfBytes = await pdfDoc.save();
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] my-4 md:my-8 animate-scale-in relative">
        
        {processing && <LoadingOverlay message="Processing images and compiling your PDF..." />}

        {/* Workspace Header */}
        <WorkspaceHeader
          title="Convert Images to PDF"
          subtitle="Instant image compiler: Combine JPG, PNG, WEBP files entirely in your browser"
          icon={<FileImage size={18} />}
          onClose={handleClose}
        />

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: Options & Config Column */}
            <div className="lg:col-span-4 space-y-5">
              
              <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/60 p-4 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-navy dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <Sliders size={14} className="text-corporate dark:text-gold" />
                  <h4 className="text-xs font-black uppercase tracking-wider">Page Settings</h4>
                </div>

                {/* Page Size Option */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Page Size</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['a4', 'letter', 'original'] as PageSizeOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPageSize(opt)}
                        className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          pageSize === opt
                            ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {opt === 'original' ? 'Original' : opt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orientation (disabled for original) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Orientation</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['portrait', 'landscape'] as OrientationOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        disabled={pageSize === 'original'}
                        onClick={() => setOrientation(opt)}
                        className={`py-2 px-2 text-[10px] font-bold rounded-lg border transition-all ${
                          pageSize === 'original'
                            ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-950/50 text-slate-400 border-slate-200 dark:border-slate-850'
                            : orientation === opt
                            ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy shadow-sm cursor-pointer'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        {opt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Scaling option */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Image Scaling</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['fit', 'fill'] as ScalingOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setImageScaling(opt)}
                        className={`py-2 px-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          imageScaling === opt
                            ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {opt === 'fit' ? 'Fit (Aspect)' : 'Fill (Stretch)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Margins */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Page Margins</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['none', 'small', 'large'] as MarginOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setMarginType(opt)}
                        className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          marginType === opt
                            ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {opt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Output filename setup */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/60 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-navy dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <Settings size={14} className="text-corporate dark:text-gold" />
                  <h4 className="text-xs font-black uppercase tracking-wider">Output File Setup</h4>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    placeholder="images_converted.pdf"
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3 py-2 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-corporate dark:focus:border-gold transition-colors shadow-sm"
                  />
                </div>
              </div>

            </div>

            {/* RIGHT: Image list / Drag & Drop Column */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Custom Image Drag Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload image files"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group ${
                  dragActive 
                    ? 'border-corporate dark:border-gold bg-corporate/5 dark:bg-gold/5 shadow-inner' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 hover:border-corporate dark:hover:border-gold hover:bg-slate-50 dark:hover:bg-slate-950/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={true}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => e.target.files && handleFilesSelected(Array.from(e.target.files))}
                  className="hidden"
                />
                
                <div className="w-10 h-10 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center justify-center mb-2.5 group-hover:text-corporate group-hover:bg-corporate/5 dark:group-hover:text-gold dark:group-hover:bg-gold/5 transition-colors shadow-sm">
                  <Plus size={18} className={dragActive ? "animate-bounce" : ""} />
                </div>
                
                <p className="text-xs font-bold text-navy dark:text-white mb-0.5">
                  Drag & drop image files here, or{' '}
                  <span className="text-corporate dark:text-gold hover:underline">browse</span>
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Supports JPG, JPEG, PNG, WEBP. Combine as many images as you need.
                </p>
              </div>

              {/* Uploaded Images List Header & Count */}
              {images.length > 0 && (
                <div className="space-y-3">
                  
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-md">
                        {images.length} {images.length === 1 ? 'Image' : 'Images'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        Drag to reorder or use arrows. Real-time rotation fully rendered.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearState}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-450 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Thumbnail Cards Grid */}
                  <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 bg-slate-50/10 dark:bg-slate-950/5 max-h-[42vh] overflow-y-auto space-y-3">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl hover:border-slate-250 dark:hover:border-slate-800 transition-all shadow-sm"
                      >
                        {/* Thumbnail View Container */}
                        <div className="flex items-center gap-3 min-w-0">
                          
                          {/* Small Index number */}
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 w-4 text-center">
                            {idx + 1}
                          </span>

                          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0 relative">
                            <img
                              src={img.src}
                              alt={img.name}
                              referrerPolicy="no-referrer"
                              style={{ transform: `rotate(${img.rotation}deg)` }}
                              className="max-w-full max-h-full object-contain transition-transform duration-350"
                            />
                            {img.rotation > 0 && (
                              <div className="absolute top-1 right-1 bg-corporate dark:bg-gold text-white dark:text-navy text-[8px] px-1 font-black rounded scale-90">
                                {img.rotation}°
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-750 dark:text-slate-200 truncate pr-2">
                              {img.name}
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 flex flex-wrap gap-x-2 items-center">
                              <span>{formatFileSize(img.size)}</span>
                              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                              <span>{img.width} × {img.height} px</span>
                            </p>
                          </div>
                        </div>

                        {/* Control Actions Row */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          
                          {/* Reorder Up */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveImageUp(idx)}
                            className="p-1.5 rounded-lg border border-slate-150 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Up"
                            aria-label="Move image up"
                          >
                            <ChevronUp size={12} />
                          </button>

                          {/* Reorder Down */}
                          <button
                            type="button"
                            disabled={idx === images.length - 1}
                            onClick={() => moveImageDown(idx)}
                            className="p-1.5 rounded-lg border border-slate-150 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Down"
                            aria-label="Move image down"
                          >
                            <ChevronDown size={12} />
                          </button>

                          {/* Rotate +90 */}
                          <button
                            type="button"
                            onClick={() => rotateImage(img.id)}
                            className="p-1.5 rounded-lg border border-slate-150 dark:border-slate-800 text-slate-500 hover:text-corporate dark:hover:text-gold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                            title="Rotate +90°"
                            aria-label="Rotate image 90 degrees clockwise"
                          >
                            <RotateCw size={12} />
                          </button>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => removeImage(img.id)}
                            className="p-1.5 rounded-lg border border-slate-150 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-500/5 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                            title="Remove"
                            aria-label="Remove image from list"
                          >
                            <Trash2 size={12} />
                          </button>

                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              )}

            </div>

          </div>

          {/* Status Banners */}
          {error && (
            <AlertBanner type="error" message={error} />
          )}

          {convertSuccess && (
            <AlertBanner 
              type="success" 
              message="PDF Compiled Successfully!" 
              description="Your image deck has been converted to a clean PDF and downloaded automatically." 
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
            onClick={handleGeneratePdf}
            disabled={images.length === 0 || processing}
            className={`font-bold py-2.5 px-6 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 shadow-md cursor-pointer ${
              images.length === 0 || processing
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed shadow-none'
                : 'bg-corporate hover:bg-corporate/90 text-white dark:bg-gold dark:text-navy dark:hover:bg-amber-500'
            }`}
          >
            {processing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Compiling PDF...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Convert & Download</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
