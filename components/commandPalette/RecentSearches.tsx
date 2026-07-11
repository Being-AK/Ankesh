import React from 'react';
import { SearchItem } from './searchIndex';
import { getSearchItemIcon } from './ResultItem';
import { Clock, Trash2 } from 'lucide-react';

interface RecentSearchesProps {
  items: SearchItem[];
  onSelect: (item: SearchItem) => void;
  onClear: () => void;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({ items, onSelect, onClear }) => {
  if (items.length === 0) return null;

  return (
    <div className="px-3 py-2 space-y-1 select-none">
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 font-sans flex items-center gap-1.5">
          <Clock size={12} />
          Recent Searches
        </span>
        <button
          onClick={onClear}
          className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 px-1.5 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
          title="Clear recent history"
        >
          <Trash2 size={10} />
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-colors w-full group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800/40"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-corporate dark:group-hover:text-gold shrink-0 flex items-center justify-center transition-colors">
              {getSearchItemIcon(item.id, item.category)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate tracking-tight">{item.title}</div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase">{item.category}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
