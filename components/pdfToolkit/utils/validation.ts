import { FileValidationResult } from '../types';

/**
 * Validates whether a file is a valid PDF.
 */
export const validatePdfFile = (file: File): FileValidationResult => {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { isValid: false, error: 'Only valid PDF files (.pdf) are supported.' };
  }
  return { isValid: true, error: null };
};
