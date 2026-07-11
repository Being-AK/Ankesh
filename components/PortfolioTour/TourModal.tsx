import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

interface TourModalProps {
  isOpen: boolean;
  type: 'welcome' | 'finish';
  onStartTour?: () => void;
  onExploreMyself: () => void;
}

export default function TourModal({
  isOpen,
  type,
  onStartTour,
  onExploreMyself,
}: TourModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Elegant backdrop blur with safe close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/65 backdrop-blur-md"
            onClick={onExploreMyself}
          />

          {/* Clean, premium card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative w-full max-w-[440px] bg-white dark:bg-slate-950/95 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col text-left text-navy dark:text-white"
          >
            {/* Subtle premium light glow effect */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

            {type === 'welcome' ? (
              <>
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center border border-gold/20 shadow-inner">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-850 dark:text-white">
                    👋 Welcome
                  </h3>
                </div>

                <div className="space-y-4 mb-8 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-350">
                  <p>This tour takes less than one minute.</p>
                  <p>You'll discover:</p>
                  
                  <ul className="space-y-3.5 mt-2 pl-1">
                    <li className="flex items-center gap-3 text-slate-800 dark:text-slate-100 font-semibold">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      Professional Experience
                    </li>
                    <li className="flex items-center gap-3 text-slate-800 dark:text-slate-100 font-semibold">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      Compliance Hub
                    </li>
                    <li className="flex items-center gap-3 text-slate-800 dark:text-slate-100 font-semibold">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      Offline PDF Toolkit
                    </li>
                    <li className="flex items-center gap-3 text-slate-800 dark:text-slate-100 font-semibold">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      AI Workspace
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={onStartTour}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-corporate dark:bg-gold text-white dark:text-navy text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-corporate/10 dark:shadow-gold/5"
                  >
                    <span>Let's Begin</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={onExploreMyself}
                    className="flex-1 flex items-center justify-center py-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-navy dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold transition-all cursor-pointer"
                  >
                    Explore Myself
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <Check size={22} className="stroke-[2.5]" />
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-slate-850 dark:text-white mb-2">
                    🎉 You're all set!
                  </h3>
                  
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-[280px]">
                    Enjoy exploring my portfolio.
                  </p>

                  <button
                    onClick={onExploreMyself}
                    className="w-full py-3 px-5 rounded-2xl bg-corporate dark:bg-gold text-white dark:text-navy text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-corporate/10 dark:shadow-gold/5"
                  >
                    Explore Portfolio
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
