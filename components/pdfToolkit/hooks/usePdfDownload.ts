import { useState, useCallback } from 'react';
import { downloadPdf } from '../utils/fileHelpers';
import { workspaceStore } from '../../../utils/workspaceStore';

export function usePdfDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const executeDownload = useCallback(async (
    asyncBlobGenerator: () => Promise<Blob>,
    filename?: string
  ) => {
    setDownloading(true);
    setError(null);
    setSuccess(false);

    // Set workspace global processing state
    workspaceStore.setProcessing('processing', 35, `Processing ${filename || 'PDF'}...`);

    try {
      const blob = await asyncBlobGenerator();
      workspaceStore.setProcessing('processing', 85, `Compiling PDF binary...`);
      
      if (filename) {
        downloadPdf(blob, filename);
        
        // Format size label beautifully
        const sizeKb = Math.round(blob.size / 1024);
        const sizeLabel = sizeKb > 1024 
          ? `${(sizeKb / 1024).toFixed(1)} MB` 
          : `${sizeKb} KB`;
          
        // Log to dynamic history and notify
        workspaceStore.logDownload(filename, sizeLabel);
      } else {
        workspaceStore.notify('PDF process completed successfully!', 'success');
      }
      setSuccess(true);
    } catch (err: any) {
      console.error('Download processing error:', err);
      const errMsg = err.message || 'An unexpected error occurred. Please try again.';
      setError(errMsg);
      workspaceStore.notify(errMsg, 'error', 4500);
    } finally {
      setDownloading(false);
      workspaceStore.setProcessing('idle');
    }
  }, []);

  const clearDownloadStates = useCallback(() => {
    setError(null);
    setSuccess(false);
    setDownloading(false);
  }, []);

  return {
    downloading,
    error,
    success,
    setError,
    setSuccess,
    executeDownload,
    clearDownloadStates,
  };
}
