import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchItem } from './searchIndex';
import { searchEngine } from './searchEngine';

const RECENT_SEARCHES_KEY = 'ankesh_recent_searches_v1';

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<SearchItem[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading recent searches:', e);
    }
  }, []);

  // Update results when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const filtered = searchEngine(query);
    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Open/Close toggle
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
    setQuery('');
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
  }, []);

  // Global listener for Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  // Add search item to recents
  const addToRecent = useCallback((item: SearchItem) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(p => p.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5); // Max 5 recent searches
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving recent searches:', e);
      }
      return updated;
    });
  }, []);

  // Clear all recent searches
  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error('Error removing recent searches:', e);
    }
  }, []);

  // Action execution (Navigate and Glow)
  const executeAction = useCallback((item: SearchItem) => {
    addToRecent(item);
    close();

    if (item.actionType === 'hash') {
      // Portfolio section
      window.location.hash = item.target;
      const element = document.getElementById(item.target.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (item.actionType === 'pdf-tool') {
      // PDF tool
      window.location.hash = '#pdf-toolkit';
      
      // Allow some delay for workspace to mount
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('select-pdf-tool', { detail: { id: item.target } }));
        window.dispatchEvent(new CustomEvent('glow-workspace', { detail: { id: 'pdf-toolkit' } }));
      }, 150);
    } else if (item.actionType === 'compliance-tool') {
      // Compliance Suite / AI tool
      window.dispatchEvent(new CustomEvent('select-compliance-tool', { detail: { id: item.target } }));
      
      // Allow some delay for workspace to mount
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('glow-workspace', { detail: { id: 'compliance-suite' } }));
      }, 150);
    }
  }, [addToRecent, close]);

  return {
    isOpen,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    recentSearches,
    clearRecent,
    executeAction,
    toggle,
    open,
    close
  };
}
