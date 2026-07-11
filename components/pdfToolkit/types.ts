import React from 'react';

export interface PdfTool {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export interface FileValidationResult {
  isValid: boolean;
  error: string | null;
}
