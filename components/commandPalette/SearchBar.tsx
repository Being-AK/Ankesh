import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onKeyDown, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when command palette opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative flex items-center border-b border-slate-200/20 dark:border-slate-800/50 px-5 py-4 select-none">
      <Search className="w-5.5 h-5.5 text-slate-400 dark:text-slate-500 shrink-0 mr-4" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search tools, calculators, portfolios, or shortcuts..."
        className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base md:text-lg focus:outline-none focus:ring-0 font-sans font-medium"
        aria-label="Search command palette"
        autoComplete="off"
        spellCheck="false"
      />
      
      <div className="flex items-center gap-2.5 ml-4">
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/50 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 select-none">
          <span>ESC</span>
        </div>
      </div>
    </div>
  );
};
