import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface NotificationItem {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}

export interface WorkspaceHistoryItem {
  workspace: string | null;
  tool: string | null;
}

export interface RecentItem {
  id: string;
  title: string;
  category: string;
  timestamp: number;
}

export interface ProcessingState {
  status: 'idle' | 'processing';
  progress: number;
  message: string;
}

interface WorkspaceContextProps {
  workspace: string | null;
  tool: string | null;
  processing: ProcessingState;
  pinnedTools: string[];
  recentWorkspaces: RecentItem[];
  notifications: NotificationItem[];
  history: WorkspaceHistoryItem[];
  historyIndex: number;
  isOffline: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  
  setWorkspace: (ws: string | null) => void;
  setTool: (t: string | null) => void;
  setProcessing: (status: 'idle' | 'processing', progress?: number, message?: string) => void;
  pinTool: (toolId: string) => void;
  unpinTool: (toolId: string) => void;
  isToolPinned: (toolId: string) => boolean;
  addNotification: (message: string, type?: 'success' | 'warning' | 'error' | 'info', duration?: number) => void;
  dismissNotification: (id: string) => void;
  goBack: () => void;
  goForward: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

const STORAGE_PINNED = 'ankesh_pinned_tools_v1';
const STORAGE_RECENTS = 'ankesh_recent_workspaces_v1';
const STORAGE_HISTORY = 'ankesh_navigation_history_v1';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspaceState] = useState<string | null>(null);
  const [tool, setToolState] = useState<string | null>(null);
  const [processing, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const [pinnedTools, setPinnedTools] = useState<string[]>([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // History tracking state
  const [navigationState, setNavigationState] = useState<{
    history: WorkspaceHistoryItem[];
    index: number;
  }>({
    history: [{ workspace: null, tool: null }],
    index: 0
  });
  const history = navigationState.history;
  const historyIndex = navigationState.index;
  const isInternalNavigation = useRef(false);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Sync offline state
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync pinnedTools ref
  const pinnedToolsRef = useRef<string[]>([]);
  useEffect(() => {
    pinnedToolsRef.current = pinnedTools;
  }, [pinnedTools]);

  // Load Pinned Tools
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PINNED);
      if (stored) {
        setPinnedTools(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading pinned tools:', e);
    }
  }, []);

  // Load Recent Workspaces
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_RECENTS);
      if (stored) {
        setRecentWorkspaces(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading recent workspaces:', e);
    }
  }, []);

  // Load Navigation History if exists (for restore session)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.history && parsed.history.length > 0) {
          setNavigationState({
            history: parsed.history,
            index: parsed.historyIndex || 0
          });
          
          // Re-open last active workspace
          const lastItem = parsed.history[parsed.historyIndex];
          if (lastItem) {
            isInternalNavigation.current = true;
            setWorkspaceState(lastItem.workspace);
            setToolState(lastItem.tool);
            isInternalNavigation.current = false;
          }
        }
      }
    } catch (e) {
      console.error('Error loading navigation history:', e);
    }
  }, []);

  // Dedicated effect to persist history state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY, JSON.stringify({ 
        history: navigationState.history, 
        historyIndex: navigationState.index 
      }));
    } catch (e) {
      console.error('Error saving navigation history:', e);
    }
  }, [navigationState]);

  // Set Workspace Wrapper
  const setWorkspace = useCallback((ws: string | null) => {
    setWorkspaceState(ws);
    if (!ws) {
      setToolState(null);
    }
  }, []);

  // Set Tool Wrapper
  const setTool = useCallback((t: string | null) => {
    setToolState(t);
  }, []);

  // Sync to history stack when workspace/tool changes (if not internal back/forward)
  useEffect(() => {
    if (isInternalNavigation.current) return;

    setNavigationState(prev => {
      const currentItem = prev.history[prev.index];
      // Avoid duplicate history entries
      if (currentItem && currentItem.workspace === workspace && currentItem.tool === tool) {
        return prev;
      }

      // Slice up to current index and append new entry
      const updatedHistory = [...prev.history.slice(0, prev.index + 1), { workspace, tool }];
      const newIndex = updatedHistory.length - 1;
      
      return {
        history: updatedHistory,
        index: newIndex
      };
    });

    // Save active tool/workspace to recent list
    if (tool || workspace) {
      const title = tool || workspace || '';
      const category = workspace === 'pdf-toolkit' ? 'PDF Toolkit' : workspace === 'compliance-suite' ? 'Compliance Suite' : 'Portfolio';
      const id = tool || workspace || '';

      setRecentWorkspaces(prev => {
        const filtered = prev.filter(item => item.id !== id);
        const updated = [{ id, title, category, timestamp: Date.now() }, ...filtered].slice(0, 5);
        try {
          localStorage.setItem(STORAGE_RECENTS, JSON.stringify(updated));
        } catch (e) {
          console.error('Error saving recent workspaces:', e);
        }
        return updated;
      });
    }
  }, [workspace, tool]);

  // Reset internal navigation flag after history sync effect has evaluated
  useEffect(() => {
    if (isInternalNavigation.current) {
      isInternalNavigation.current = false;
    }
  }, [workspace, tool]);

  // Set Processing State
  const setProcessing = useCallback((status: 'idle' | 'processing', progress = 0, message = '') => {
    setProcessingState({ status, progress, message });
  }, []);

  // Pin / Unpin Tools
  const pinTool = useCallback((toolId: string) => {
    setPinnedTools(prev => {
      if (prev.includes(toolId)) return prev;
      const updated = [...prev, toolId];
      try {
        localStorage.setItem(STORAGE_PINNED, JSON.stringify(updated));
      } catch (e) {
        console.error('Error pinning tool:', e);
      }
      return updated;
    });
  }, []);

  const unpinTool = useCallback((toolId: string) => {
    setPinnedTools(prev => {
      const updated = prev.filter(id => id !== toolId);
      try {
        localStorage.setItem(STORAGE_PINNED, JSON.stringify(updated));
      } catch (e) {
        console.error('Error unpinning tool:', e);
      }
      return updated;
    });
  }, []);

  const isToolPinned = useCallback((toolId: string) => {
    return pinnedTools.includes(toolId);
  }, [pinnedTools]);

  // Notifications Stack
  const addNotification = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const item: NotificationItem = { id, message, type, duration };
    setNotifications(prev => [...prev, item]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Back / Forward History Actions
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const target = history[newIndex];
      if (target) {
        isInternalNavigation.current = true;
        setNavigationState(prev => ({ ...prev, index: newIndex }));
        setWorkspaceState(target.workspace);
        setToolState(target.tool);
        
        // Sync hash / events
        if (target.workspace === 'pdf-toolkit') {
          window.location.hash = '#pdf-toolkit';
          if (target.tool) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('select-pdf-tool', { detail: { id: target.tool } }));
            }, 50);
          }
        } else if (target.workspace === 'compliance-suite') {
          if (target.tool) {
            window.dispatchEvent(new CustomEvent('select-compliance-tool', { detail: { id: target.tool } }));
          } else {
            window.location.hash = '#compliance-suite';
          }
        } else {
          window.location.hash = '';
        }
      }
    }
  }, [history, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const target = history[newIndex];
      if (target) {
        isInternalNavigation.current = true;
        setNavigationState(prev => ({ ...prev, index: newIndex }));
        setWorkspaceState(target.workspace);
        setToolState(target.tool);
        
        // Sync hash / events
        if (target.workspace === 'pdf-toolkit') {
          window.location.hash = '#pdf-toolkit';
          if (target.tool) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('select-pdf-tool', { detail: { id: target.tool } }));
            }, 50);
          }
        } else if (target.workspace === 'compliance-suite') {
          if (target.tool) {
            window.dispatchEvent(new CustomEvent('select-compliance-tool', { detail: { id: target.tool } }));
          } else {
            window.location.hash = '#compliance-suite';
          }
        } else {
          window.location.hash = '';
        }
      }
    }
  }, [history, historyIndex]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  // Listen to Global Window Custom Events for Interoperability
  useEffect(() => {
    const handleGlobalNotification = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.message) {
        addNotification(detail.message, detail.type || 'info', detail.duration || 3000);
      }
    };

    const handleGlobalProcessing = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setProcessing(detail.status || 'idle', detail.progress || 0, detail.message || '');
      }
    };

    const handleGlobalPinToggle = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.toolId) {
        if (pinnedToolsRef.current.includes(detail.toolId)) {
          unpinTool(detail.toolId);
          addNotification(`${detail.toolName || detail.toolId} unpinned from workspace`, 'info', 2000);
        } else {
          pinTool(detail.toolId);
          addNotification(`${detail.toolName || detail.toolId} pinned to workspace`, 'success', 2000);
        }
      }
    };

    window.addEventListener('workspace-notification', handleGlobalNotification);
    window.addEventListener('workspace-processing', handleGlobalProcessing);
    window.addEventListener('workspace-pin-toggle', handleGlobalPinToggle);

    return () => {
      window.removeEventListener('workspace-notification', handleGlobalNotification);
      window.removeEventListener('workspace-processing', handleGlobalProcessing);
      window.removeEventListener('workspace-pin-toggle', handleGlobalPinToggle);
    };
  }, [addNotification, pinTool, unpinTool]);

  return (
    <WorkspaceContext.Provider value={{
      workspace,
      tool,
      processing,
      pinnedTools,
      recentWorkspaces,
      notifications,
      history,
      historyIndex,
      isOffline,
      canGoBack,
      canGoForward,
      setWorkspace,
      setTool,
      setProcessing,
      pinTool,
      unpinTool,
      isToolPinned,
      addNotification,
      dismissNotification,
      goBack,
      goForward
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
