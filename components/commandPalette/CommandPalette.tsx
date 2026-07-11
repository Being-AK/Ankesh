import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCommandPalette } from './useCommandPalette';
import { SearchBar } from './SearchBar';
import { ResultList } from './ResultList';
import { RecentSearches } from './RecentSearches';
import { QuickActions } from './QuickActions';
import { Terminal } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const {
    isOpen,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    recentSearches,
    clearRecent,
    executeAction,
    close,
    open
  } = useCommandPalette();

  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus and trap focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle clicking outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      close();
    }
  };

  // Keyboard Navigation inside Command Palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        executeAction(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  // Safe handler to launch a workspace via hash
  const handleOpenWorkspace = (hash: string) => {
    close();
    window.location.hash = hash;
  };

  // Listen to a custom trigger from header search button clicks
  useEffect(() => {
    const handleOpenTrigger = () => {
      open();
    };
    window.addEventListener('open-command-palette', handleOpenTrigger);
    return () => window.removeEventListener('open-command-palette', handleOpenTrigger);
  }, [open]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center pt-[10vh] sm:pt-[14vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Global Command Palette"
        >
          {/* Backdrop Blur Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-md"
            onClick={handleOverlayClick}
          />

          {/* Centered Dark Glass Panel */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-2xl bg-white/95 dark:bg-[#0d1324]/95 border border-slate-200/80 dark:border-slate-850/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)] rounded-3xl overflow-hidden flex flex-col transition-colors duration-300"
          >
            {/* Search Bar Input */}
            <SearchBar
              value={query}
              onChange={setQuery}
              onKeyDown={handleKeyDown}
              onClose={close}
            />

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto max-h-[460px] pb-4">
              {query.trim() ? (
                /* Search Results List */
                <ResultList
                  results={results}
                  selectedIndex={selectedIndex}
                  onMouseEnterItem={setSelectedIndex}
                  onClickItem={executeAction}
                />
              ) : (
                /* Initial Quick Actions & Recents Panel */
                <div className="space-y-4 divide-y divide-slate-100/40 dark:divide-slate-800/20">
                  <QuickActions
                    onSelectAction={executeAction}
                    onOpenWorkspace={handleOpenWorkspace}
                  />
                  <div className="pt-4">
                    <RecentSearches
                      items={recentSearches}
                      onSelect={executeAction}
                      onClear={clearRecent}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Help Utility Footer Bar */}
            <div className="border-t border-slate-200/20 dark:border-slate-850/40 bg-slate-50/50 dark:bg-slate-950/20 px-5 py-3 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 font-sans select-none">
              <div className="flex items-center gap-1.5 uppercase tracking-widest">
                <Terminal size={11} className="text-slate-400" />
                <span>Command Menu</span>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/50 font-sans">↑↓</span>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/50 font-sans">Enter ↵</span>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/50 font-sans">ESC</span>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
