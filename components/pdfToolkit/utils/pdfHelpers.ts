/**
 * Helper: Parse page range string to an array of 0-indexed page indices.
 */
export const parsePageRanges = (rangeStr: string, totalPages: number): number[] => {
  const pages: Set<number> = new Set();
  const parts = rangeStr.split(',');
  
  for (let part of parts) {
    part = part.trim();
    if (!part) continue;
    
    if (part.includes('-')) {
      const subparts = part.split('-');
      if (subparts.length !== 2) {
        throw new Error(`Invalid range format: "${part}". Please use format like "1-3"`);
      }
      const start = parseInt(subparts[0].trim(), 10);
      const end = parseInt(subparts[1].trim(), 10);
      
      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid numbers in range: "${part}"`);
      }
      if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
        throw new Error(`Page numbers must be between 1 and ${totalPages}. Found range: "${part}"`);
      }
      
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      for (let i = min; i <= max; i++) {
        pages.add(i - 1); // 0-indexed page indices for pdf-lib
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum)) {
        throw new Error(`Invalid page number: "${part}"`);
      }
      if (pageNum < 1 || pageNum > totalPages) {
        throw new Error(`Page number must be between 1 and ${totalPages}. Found: "${part}"`);
      }
      pages.add(pageNum - 1); // 0-indexed page indices for pdf-lib
    }
  }
  
  if (pages.size === 0) {
    throw new Error("No pages specified to extract.");
  }
  
  return Array.from(pages).sort((a, b) => a - b);
};

/**
 * Loads a PDF file and returns the PDFDocument instance using dynamic import.
 */
export const readPdfDocument = async (file: File, options?: any) => {
  const { PDFDocument } = await import('pdf-lib');
  const arrayBuffer = await file.arrayBuffer();
  return await PDFDocument.load(arrayBuffer, options);
};
