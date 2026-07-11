/**
 * Global utility helpers to interact with the Workspace Layer from non-React environments
 * (e.g. within processing workers, helpers, pdf calculators, plain TS scripts)
 */

export const workspaceStore = {
  /**
   * Push a global notification from anywhere
   */
  notify: (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info', duration = 3000) => {
    window.dispatchEvent(
      new CustomEvent('workspace-notification', {
        detail: { message, type, duration }
      })
    );
  },

  /**
   * Set global processing loading states and progress bars
   */
  setProcessing: (status: 'idle' | 'processing', progress = 0, message = '') => {
    window.dispatchEvent(
      new CustomEvent('workspace-processing', {
        detail: { status, progress, message }
      })
    );
  },

  /**
   * Toggle pinned status of any tool
   */
  togglePin: (toolId: string, toolName?: string) => {
    window.dispatchEvent(
      new CustomEvent('workspace-pin-toggle', {
        detail: { toolId, toolName }
      })
    );
  },

  /**
   * Trigger glowing effect for workspace
   */
  glowWorkspace: (workspaceId: 'pdf-toolkit' | 'compliance-suite') => {
    window.dispatchEvent(
      new CustomEvent('glow-workspace', {
        detail: { id: workspaceId }
      })
    );
  },

  /**
   * Log a downloaded file to persistent history (metadata only)
   */
  logDownload: (fileName: string, sizeLabel = '150 KB') => {
    try {
      const stored = localStorage.getItem('ankesh_download_log_v1');
      const downloads = stored ? JSON.parse(stored) : [];
      const updated = [{ name: fileName, size: sizeLabel, date: 'Just now' }, ...downloads].slice(0, 5);
      localStorage.setItem('ankesh_download_log_v1', JSON.stringify(updated));
      
      // Also automatically trigger notification!
      workspaceStore.notify(`Downloaded: ${fileName}`, 'success', 3500);
    } catch (e) {
      console.error('Error logging download:', e);
    }
  }
};
