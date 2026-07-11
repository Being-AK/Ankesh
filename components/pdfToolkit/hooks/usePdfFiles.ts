import { useState, useCallback } from 'react';
import { validatePdfFile } from '../utils/validation';

export function usePdfFiles() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((files: File[]) => {
    setError(null);
    const validFiles: File[] = [];
    let validationError: string | null = null;

    for (const file of files) {
      const validation = validatePdfFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        validationError = validation.error;
      }
    }

    if (validFiles.length > 0) {
      setPdfFiles((prev) => [...prev, ...validFiles]);
    }

    if (validationError && validFiles.length === 0) {
      setError(validationError);
    } else if (validationError) {
      setError(`Some files were skipped: ${validationError}`);
    }
  }, []);

  const moveFileUp = useCallback((index: number) => {
    if (index === 0) return;
    setPdfFiles((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  }, []);

  const moveFileDown = useCallback((index: number) => {
    setPdfFiles((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllFiles = useCallback(() => {
    setPdfFiles([]);
    setError(null);
  }, []);

  return {
    pdfFiles,
    error,
    setError,
    addFiles,
    moveFileUp,
    moveFileDown,
    removeFile,
    clearAllFiles,
    setPdfFiles,
  };
}
