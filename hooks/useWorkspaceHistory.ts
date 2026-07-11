import { useWorkspace } from './useWorkspace';

export function useWorkspaceHistory() {
  const { history, historyIndex, canGoBack, canGoForward, goBack, goForward } = useWorkspace();
  
  return {
    history,
    currentIndex: historyIndex,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
  };
}
