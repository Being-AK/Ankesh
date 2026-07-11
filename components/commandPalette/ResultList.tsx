import React from 'react';
import { SearchItem } from './searchIndex';
import { ResultItem } from './ResultItem';

interface ResultListProps {
  results: SearchItem[];
  selectedIndex: number;
  onMouseEnterItem: (idx: number) => void;
  onClickItem: (item: SearchItem) => void;
}

export const ResultList: React.FC<ResultListProps> = ({
  results,
  selectedIndex,
  onMouseEnterItem,
  onClickItem,
}) => {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center select-none">
        <div className="text-slate-400 dark:text-slate-600 mb-2.5">
          <span className="text-3xl">🔍</span>
        </div>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">No results found</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-normal font-medium">
          Try typing a different keyword or acronym like "gst", "pdf", "tax", "salary" or "ocr".
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[360px] overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
      <div className="px-3 py-1 text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 font-sans">
        Search Results ({results.length})
      </div>
      {results.map((item, idx) => (
        <ResultItem
          key={item.id}
          item={item}
          isActive={idx === selectedIndex}
          onMouseEnter={() => onMouseEnterItem(idx)}
          onClick={() => onClickItem(item)}
        />
      ))}
    </div>
  );
};
