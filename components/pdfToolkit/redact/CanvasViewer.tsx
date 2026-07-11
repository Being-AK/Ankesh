import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

interface RedactionBox {
  id: string;
  pageIndex: number;
  x: number;      // percentage (0-100)
  y: number;      // percentage (0-100)
  width: number;  // percentage (0-100)
  height: number; // percentage (0-100)
}

interface CanvasViewerProps {
  pdfDoc: any;
  currentPageIndex: number;
  scale: number;
  activeMode: 'pointer' | 'draw' | 'pan';
  redactions: RedactionBox[];
  selectedBoxId: string | null;
  onSelectBox: (id: string | null) => void;
  onAddRedaction: (box: Omit<RedactionBox, 'id' | 'pageIndex'>) => void;
  onUpdateRedaction: (id: string, updates: Partial<RedactionBox>) => void;
  onDeleteRedaction: (id: string) => void;
  isPreviewMode: boolean;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCommitChanges: () => void;
}

export default function CanvasViewer({
  pdfDoc,
  currentPageIndex,
  scale,
  activeMode,
  redactions,
  selectedBoxId,
  onSelectBox,
  onAddRedaction,
  onUpdateRedaction,
  onDeleteRedaction,
  isPreviewMode,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onCommitChanges,
}: CanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [tempBox, setTempBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Drag & Resize state
  const [dragState, setDragState] = useState<{
    type: 'drag' | 'resize';
    boxId: string;
    handle?: string;
    startX: number;
    startY: number;
    boxStart: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // Filter redactions for current page
  const pageRedactions = redactions.filter((r) => r.pageIndex === currentPageIndex);

  // 1. Render PDF Page using PDF.js
  useEffect(() => {
    if (!pdfDoc) return;

    let active = true;
    let renderTask: any = null;

    const renderPage = async () => {
      try {
        setPageLoading(true);
        const page = await pdfDoc.getPage(currentPageIndex + 1);
        if (!active) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        if (!context) return;

        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
        if (active) {
          setPageLoading(false);
        }
      } catch (err) {
        console.error('Render error:', err);
        if (active) {
          setPageLoading(false);
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch (e) {}
      }
    };
  }, [pdfDoc, currentPageIndex, scale]);

  // 2. Mouse wheel zoom listener (Ctrl + Wheel)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          onZoomIn();
        } else {
          onZoomOut();
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [onZoomIn, onZoomOut]);

  // 3. Drag and Resize Global Event Tracking
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = pageContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const dxPct = (dx / rect.width) * 100;
      const dyPct = (dy / rect.height) * 100;

      if (dragState.type === 'drag') {
        const { boxStart, boxId } = dragState;
        const newX = Math.max(0, Math.min(100 - boxStart.width, boxStart.x + dxPct));
        const newY = Math.max(0, Math.min(100 - boxStart.height, boxStart.y + dyPct));
        onUpdateRedaction(boxId, { x: newX, y: newY });
      } else if (dragState.type === 'resize' && dragState.handle) {
        const { boxStart, boxId, handle } = dragState;
        let newX = boxStart.x;
        let newY = boxStart.y;
        let newW = boxStart.width;
        let newH = boxStart.height;

        const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

        if (handle.includes('l')) {
          newX = clamp(boxStart.x + dxPct, 0, boxStart.x + boxStart.width - 2);
          newW = boxStart.width + (boxStart.x - newX);
        }
        if (handle.includes('r')) {
          newW = clamp(boxStart.width + dxPct, 2, 100 - boxStart.x);
        }
        if (handle.includes('t')) {
          newY = clamp(boxStart.y + dyPct, 0, boxStart.y + boxStart.height - 2);
          newH = boxStart.height + (boxStart.y - newY);
        }
        if (handle.includes('b')) {
          newH = clamp(boxStart.height + dyPct, 2, 100 - boxStart.y);
        }

        onUpdateRedaction(boxId, { x: newX, y: newY, width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      onCommitChanges();
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, onUpdateRedaction, onCommitChanges]);

  // Keyboard Delete box handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedBoxId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        onDeleteRedaction(selectedBoxId);
        onSelectBox(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBoxId, onDeleteRedaction, onSelectBox]);

  // 4. Panning handlers
  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (activeMode !== 'pan') return;
    e.preventDefault();
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    });
  };

  const handlePanMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || activeMode !== 'pan') return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;

    container.scrollLeft = panStart.scrollLeft - dx;
    container.scrollTop = panStart.scrollTop - dy;
  };

  const handlePanMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  // 5. Drawing handlers
  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    if (activeMode === 'pan') return;

    // Check if clicked exactly on background container
    if (e.target !== e.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onSelectBox(null); // click blank clears selection
    setIsDrawing(true);
    setDrawStart({ x, y });
    setTempBox({ x, y, width: 0, height: 0 });
  };

  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !tempBox) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.max(0, Math.min(100, Math.min(drawStart.x, currentX)));
    const y = Math.max(0, Math.min(100, Math.min(drawStart.y, currentY)));
    const w = Math.max(0, Math.min(100 - x, Math.abs(drawStart.x - currentX)));
    const h = Math.max(0, Math.min(100 - y, Math.abs(drawStart.y - currentY)));

    setTempBox({ x, y, width: w, height: h });
  };

  const handleOverlayMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tempBox && tempBox.width > 1.2 && tempBox.height > 1.2) {
      onAddRedaction(tempBox);
      onCommitChanges();
    }
    setTempBox(null);
  };

  // Box drag click handler
  const handleBoxMouseDown = (e: React.MouseEvent, box: RedactionBox) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    e.preventDefault();
    onSelectBox(box.id);

    setDragState({
      type: 'drag',
      boxId: box.id,
      startX: e.clientX,
      startY: e.clientY,
      boxStart: { x: box.x, y: box.y, width: box.width, height: box.height },
    });
  };

  // Resize handles click handler
  const handleHandleMouseDown = (e: React.MouseEvent, box: RedactionBox, handle: string) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    e.preventDefault();
    onSelectBox(box.id);

    setDragState({
      type: 'resize',
      boxId: box.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      boxStart: { x: box.x, y: box.y, width: box.width, height: box.height },
    });
  };

  const resizeHandles = ['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'];

  const getHandlePositionClass = (handle: string) => {
    switch (handle) {
      case 'tl': return '-top-1.5 -left-1.5 cursor-nwse-resize';
      case 't': return '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize';
      case 'tr': return '-top-1.5 -right-1.5 cursor-nesw-resize';
      case 'r': return 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize';
      case 'br': return '-bottom-1.5 -right-1.5 cursor-nwse-resize';
      case 'b': return '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize';
      case 'bl': return '-bottom-1.5 -left-1.5 cursor-nesw-resize';
      case 'l': return 'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize';
      default: return '';
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      onMouseDown={handlePanMouseDown}
      onMouseMove={handlePanMouseMove}
      onMouseUp={handlePanMouseUpOrLeave}
      onMouseLeave={handlePanMouseUpOrLeave}
      className={`flex-grow h-full bg-slate-100 dark:bg-slate-950/80 overflow-auto relative p-6 focus:outline-none flex justify-center items-start custom-scrollbar ${
        activeMode === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
      }`}
      role="document"
      aria-label="PDF Document Canvas Viewer"
    >
      {/* Container holding Canvas + Overlay Layer */}
      <div
        ref={pageContainerRef}
        className="relative mx-auto bg-white shadow-xl rounded-sm border border-slate-200 dark:border-slate-800 transition-shadow duration-300"
        style={{
          width: canvasRef.current ? `${canvasRef.current.width}px` : 'auto',
          height: canvasRef.current ? `${canvasRef.current.height}px` : 'auto',
        }}
      >
        {/* Actual PDF Page Canvas */}
        <canvas ref={canvasRef} className="block max-w-none" />

        {/* Loading spinner */}
        {pageLoading && (
          <div className="absolute inset-0 bg-white/45 dark:bg-slate-950/45 flex items-center justify-center backdrop-blur-[1px]">
            <Loader2 className="animate-spin text-corporate dark:text-gold w-8 h-8" />
          </div>
        )}

        {/* Interactive Drawing & Manipulation Overlay */}
        <div
          onMouseDown={handleOverlayMouseDown}
          onMouseMove={handleOverlayMouseMove}
          onMouseUp={handleOverlayMouseUp}
          className={`absolute inset-0 z-10 select-none ${
            activeMode === 'draw' ? 'cursor-crosshair' : activeMode === 'pointer' ? 'cursor-default' : ''
          }`}
        >
          {/* Render Saved Redaction Boxes */}
          {pageRedactions.map((box) => {
            const isSelected = selectedBoxId === box.id;

            return (
              <div
                key={box.id}
                onMouseDown={(e) => handleBoxMouseDown(e, box)}
                className={`absolute transition-colors border group ${
                  isPreviewMode
                    ? 'bg-black border-black text-transparent select-none pointer-events-none'
                    : isSelected
                    ? 'bg-red-500/25 border-red-500 ring-2 ring-red-500/20 shadow-lg cursor-move z-20'
                    : 'bg-red-500/15 hover:bg-red-500/20 border-red-400/80 hover:border-red-500 cursor-pointer z-10'
                }`}
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                }}
              >
                {/* Visual "REDACT" label centered inside box */}
                {!isPreviewMode && (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <span className="text-[10px] sm:text-xs font-black text-red-600/90 tracking-widest uppercase select-none">
                      REDACT
                    </span>
                  </div>
                )}

                {/* Corner Resize Handles */}
                {isSelected && !isPreviewMode && (
                  <>
                    {resizeHandles.map((handle) => (
                      <div
                        key={handle}
                        onMouseDown={(e) => handleHandleMouseDown(e, box, handle)}
                        className={`absolute w-2.5 h-2.5 bg-red-600 border border-white rounded-full z-30 transition-transform hover:scale-125 ${getHandlePositionClass(
                          handle
                        )}`}
                      />
                    ))}

                    {/* Quick Delete Mobile Cross Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteRedaction(box.id);
                        onSelectBox(null);
                      }}
                      className="absolute -top-7 right-0 p-1 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md hover:scale-105 transition-all z-30 cursor-pointer"
                      title="Delete redaction"
                    >
                      <Trash2 size={11} />
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {/* Render Temporary Box as User is Dragging to Draw */}
          {tempBox && (
            <div
              className="absolute border border-dashed border-red-500 bg-red-500/10 pointer-events-none z-30"
              style={{
                left: `${tempBox.x}%`,
                top: `${tempBox.y}%`,
                width: `${tempBox.width}%`,
                height: `${tempBox.height}%`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-black text-red-500 tracking-wider">DRAWING</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
