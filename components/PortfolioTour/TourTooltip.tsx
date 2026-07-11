import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { TourStep, TOUR_STEPS } from './PortfolioTour';

interface TourTooltipProps {
  stepIndex: number;
  step: TourStep;
  rect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export default function TourTooltip({
  stepIndex,
  step,
  rect,
  onNext,
  onPrev,
  onSkip,
}: TourTooltipProps) {
  // Compute floating tooltip coordinates based on highlighted element rect
  const { style, placement } = useMemo<{ style: React.CSSProperties; placement: 'above' | 'below' | 'left' | 'right' | 'fixed' }>(() => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const tooltipWidth = 320;
    const tooltipHeight = 185;
    const spacing = 24; // Keep at least 24px spacing from the highlighted target

    // If on mobile, override with fixed bottom center for a clean and native feel
    if (viewportWidth < 640) {
      return {
        style: {
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
          zIndex: 90,
        },
        placement: 'fixed' as const,
      };
    }

    if (!rect || rect.width === 0 || rect.height === 0) {
      return {
        style: {
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: `${tooltipWidth}px`,
          zIndex: 90,
        },
        placement: 'fixed' as const,
      };
    }

    // Check if the highlighted element is full-screen or extremely tall (e.g., active workspaces)
    const isVeryTall = rect.height > viewportHeight - 140;

    if (isVeryTall) {
      // Dock beautifully as a floating assistant in the bottom-right corner of the viewport
      // to avoid blocking important content on high-height sections.
      return {
        style: {
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: `${tooltipWidth}px`,
          zIndex: 90,
        },
        placement: 'fixed' as const,
      };
    }

    // Calculate available space on each side
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;

    // Determine fitting potential on each axis
    const canFitBelow = spaceBelow >= tooltipHeight + spacing;
    const canFitAbove = spaceAbove >= tooltipHeight + spacing + 96; // 96px safe margin to avoid overlapping header
    const canFitRight = spaceRight >= tooltipWidth + spacing;
    const canFitLeft = spaceLeft >= tooltipWidth + spacing;

    let top = rect.bottom + spacing;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let placement: 'above' | 'below' | 'left' | 'right' | 'fixed' = 'below';

    if (canFitBelow) {
      top = rect.bottom + spacing;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      left = Math.max(16, Math.min(viewportWidth - tooltipWidth - 16, left));
      placement = 'below';
    } else if (canFitAbove) {
      top = rect.top - tooltipHeight - spacing;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      left = Math.max(16, Math.min(viewportWidth - tooltipWidth - 16, left));
      placement = 'above';
    } else if (canFitRight) {
      left = rect.right + spacing;
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      top = Math.max(100, Math.min(viewportHeight - tooltipHeight - 16, top)); // >= 100 ensures we never overlap navbar
      placement = 'right';
    } else if (canFitLeft) {
      left = rect.left - tooltipWidth - spacing;
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      top = Math.max(100, Math.min(viewportHeight - tooltipHeight - 16, top)); // >= 100 ensures we never overlap navbar
      placement = 'left';
    } else {
      // Ultimate fallback: place below or above based on which has more space, clamping aggressively
      if (spaceBelow > spaceAbove) {
        top = Math.max(100, Math.min(viewportHeight - tooltipHeight - 16, rect.bottom + spacing));
        left = Math.max(16, Math.min(viewportWidth - tooltipWidth - 16, rect.left + rect.width / 2 - tooltipWidth / 2));
        placement = 'below';
      } else {
        top = Math.max(100, Math.min(viewportHeight - tooltipHeight - 16, rect.top - tooltipHeight - spacing));
        left = Math.max(16, Math.min(viewportWidth - tooltipWidth - 16, rect.left + rect.width / 2 - tooltipWidth / 2));
        placement = 'above';
      }
    }

    return {
      style: {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${tooltipWidth}px`,
        zIndex: 90,
      },
      placement,
    };
  }, [rect]);

  const arrowStyle = useMemo<React.CSSProperties | null>(() => {
    if (!rect || placement === 'fixed') return null;

    const styleLeft = parseFloat(style.left as string) || 0;
    const styleTop = parseFloat(style.top as string) || 0;

    if (placement === 'below') {
      const x = Math.max(16, Math.min(288, rect.left + rect.width / 2 - styleLeft));
      return {
        left: `${x}px`,
        top: '-5px',
        transform: 'translateX(-50%) rotate(45deg)',
      };
    }
    if (placement === 'above') {
      const x = Math.max(16, Math.min(288, rect.left + rect.width / 2 - styleLeft));
      return {
        left: `${x}px`,
        bottom: '-5px',
        transform: 'translateX(-50%) rotate(45deg)',
      };
    }
    if (placement === 'right') {
      const y = Math.max(16, Math.min(150, rect.top + rect.height / 2 - styleTop));
      return {
        top: `${y}px`,
        left: '-5px',
        transform: 'translateY(-50%) rotate(45deg)',
      };
    }
    if (placement === 'left') {
      const y = Math.max(16, Math.min(150, rect.top + rect.height / 2 - styleTop));
      return {
        top: `${y}px`,
        right: '-5px',
        transform: 'translateY(-50%) rotate(45deg)',
      };
    }
    return null;
  }, [rect, placement, style]);

  const getArrowClasses = () => {
    const base = "absolute w-2.5 h-2.5 bg-white dark:bg-slate-950 border-slate-200/65 dark:border-slate-800/85 z-[101]";
    if (placement === 'below') return `${base} border-t border-l`;
    if (placement === 'above') return `${base} border-b border-r`;
    if (placement === 'right') return `${base} border-b border-l`;
    if (placement === 'left') return `${base} border-t border-r`;
    return "";
  };

  return (
    <div style={style} className="pointer-events-auto select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', damping: 28, stiffness: 140 }}
        className="w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/85 rounded-2xl p-6 shadow-2xl relative flex flex-col text-left text-navy dark:text-white"
      >
        {/* Subtle Arrow Pointer */}
        {arrowStyle && <div style={arrowStyle} className={getArrowClasses()} />}

        {/* Decorative Top Line */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold/45 to-transparent rounded-t-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100/50 dark:border-slate-900/30">
          <span className="text-[9px] font-black text-gold uppercase tracking-[0.2em]">
            Digital Guide
          </span>
          <button
            onClick={onSkip}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            title="Skip Tour"
          >
            <X size={13} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-5 min-h-[52px] space-y-1">
          <h4 className="text-xs font-black text-navy dark:text-white uppercase tracking-wider">
            {step.title}
          </h4>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
            {step.description}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-100/50 dark:border-slate-900/30 pt-4">
          {/* Back Button */}
          <button
            onClick={onPrev}
            disabled={stepIndex === 0}
            className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-850 text-[10px] font-bold text-slate-500 hover:text-navy dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft size={12} />
            <span>Back</span>
          </button>

          {/* Step Counter & Animated Progress Bar */}
          <div className="flex flex-col gap-1 items-start flex-1 max-w-[100px]">
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              Step {stepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-900/50 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                className="absolute inset-y-0 left-0 bg-gold rounded-full"
              />
            </div>
          </div>

          {/* Next / Finish Button */}
          <button
            onClick={onNext}
            className="flex items-center gap-0.5 px-3 py-1.5 rounded-lg bg-corporate dark:bg-gold text-white dark:text-navy text-[10px] font-extrabold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>{stepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
