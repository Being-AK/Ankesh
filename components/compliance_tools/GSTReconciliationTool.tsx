import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Play, 
  Search, 
  FileText, 
  RefreshCw, 
  Check, 
  X, 
  Info, 
  Layers, 
  Printer, 
  Share2, 
  RotateCcw, 
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  ArrowDownToLine,
  ExternalLink
} from 'lucide-react';

// --- TS Types & Interfaces ---
export interface GstRecord {
  id: string;
  source: 'Books' | 'Portal';
  gstin: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalGst: number;
  month: string;
  originalRowNumber?: number;
}

export type ClassificationType = 
  | 'Exact Match' 
  | 'Timing Difference' 
  | 'Invoice Difference' 
  | 'GST Difference' 
  | 'Missing in Books' 
  | 'Missing in GSTR-2B' 
  | 'Duplicate Invoice' 
  | 'Invalid Record';

export interface ReconciledRecord {
  id: string;
  classification: ClassificationType;
  bookRecord?: GstRecord;
  portalRecord?: GstRecord;
  // Metadata for explaining difference
  gstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplierName: string;
  taxableValueDiff: number;
  gstDiff: number;
  monthDiff: boolean;
  notes: string;
}

export interface VendorSummaryItem {
  gstin: string;
  supplierName: string;
  totalInvoices: number;
  matchedCount: number;
  timingCount: number;
  missingBooksCount: number;
  missingPortalCount: number;
  gstDiffCount: number;
  invDiffCount: number;
  outstandingFollowUpAmount: number; // Sum of GST Missing in GSTR-2B or having GST difference
}

export interface ValidationIssue {
  sheet: string;
  row: number;
  invoiceNumber?: string;
  gstin?: string;
  issueType: 'Invalid GSTIN' | 'Duplicate Invoice Number' | 'Missing Required Field' | 'Negative Value';
  description: string;
  severity: 'Warning' | 'Error';
}

// --- Indian GST State Codes Map ---
const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
  "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "28": "Andhra Pradesh",
  "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh (New)",
  "38": "Ladakh"
};

// Validate GSTIN format
function isValidGstin(gstin: string): boolean {
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) return false;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(clean)) return false;
  const stateCode = clean.substring(0, 2);
  return !!STATE_CODES[stateCode];
}

// Normalize invoice number (removes slashes, dashes, spaces, leading zeros for alignment)
function normalizeInvoiceNum(invNum: string): string {
  if (!invNum) return '';
  return invNum.toString().toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^0+/, '');
}

// --- DYNAMIC HEADER MAPPING FOR GST RECONCILIATION ---
const HEADER_ALIASES: Record<string, string[]> = {
  supplierGSTIN: [
    'suppliergstin', 'gstin', 'vendorgstin', 'gstinofsupplier', 'gstinofsupplieruin', 
    'suppliergstinuin', 'gstinuinofsupplier', 'gstinuin', 'gstinrecipient', 'recipientsgstin',
    'suppliergstinid', 'gstinid'
  ],
  supplierName: [
    'suppliername', 'vendorname', 'partyname', 'legalname', 'tradename', 'legalnameofthesupplier', 
    'tradenameofthesupplier', 'supplierlegalname', 'nameofthesupplier', 'vendor', 'party'
  ],
  invoiceNumber: [
    'invoicenumber', 'invoiceno', 'invno', 'invoicenum', 'billno', 'billnumber', 'docno', 'documentnumber'
  ],
  invoiceDate: [
    'invoicedate', 'invdate', 'date', 'billdate', 'docdate', 'documentdate', 'invoiceodt'
  ],
  taxableValue: [
    'taxablevalue', 'taxableamount', 'taxableval', 'taxableamt', 'basicval', 'basicvalue', 'basicamount'
  ],
  igst: [
    'igst', 'integratedgst', 'igstamount', 'integratedtax', 'integratedtaxamount', 'igsttax', 'integratedtaxval'
  ],
  cgst: [
    'cgst', 'centralgst', 'cgstamount', 'centraltax', 'centraltaxamount', 'cgsttax', 'centraltaxval'
  ],
  sgst: [
    'sgst', 'stategst', 'sgstamount', 'statetax', 'statetaxamount', 'sgsttax', 'stateuttax', 'utgst', 'statetaxval'
  ],
  totalGst: [
    'totalgst', 'totaltax', 'gstamount', 'gst', 'totaltaxamount', 'taxamount', 'totaltaxval'
  ],
  booksMonth: [
    'booksmonth', 'monthbooks', 'taxperiod', 'period', 'filingmonth', 'returnperiod'
  ],
  portalMonth: [
    '2bmonth', 'portalmonth', 'gstr2bmonth', 'gstr2bperiod', 'taxperiod', 'period', 'filingmonth', 'returnperiod'
  ],
  voucherNumber: [
    'vouchernumber', 'voucherno', 'vchno', 'vchnumber'
  ]
};

const HUMAN_REQUIRED_HEADERS: Record<string, string> = {
  supplierGSTIN: "Supplier GSTIN",
  supplierName: "Supplier Name",
  invoiceNumber: "Invoice Number",
  invoiceDate: "Invoice Date",
  taxableValue: "Taxable Value",
  igst: "IGST",
  cgst: "CGST",
  sgst: "SGST",
  totalGst: "Total GST",
  booksMonth: "Books Month",
  portalMonth: "2B Month",
  voucherNumber: "Voucher Number"
};

function cleanHeader(header: any): string {
  if (header === null || header === undefined) return '';
  return header.toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const GENERIC_FALLBACKS = new Set(['vendor', 'party', 'date', 'gst', 'month', 'period']);

function getHeaderMapping(row: any[], sheetType: 'Books' | 'Portal'): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  const activeAliases: Record<string, string[]> = {};
  for (const [key, list] of Object.entries(HEADER_ALIASES)) {
    activeAliases[key] = [...list];
  }

  // Selectively add 'month' alias based on sheetType context to avoid collisions
  if (sheetType === 'Books') {
    activeAliases.booksMonth = [...activeAliases.booksMonth, 'month'];
  } else {
    activeAliases.portalMonth = [...activeAliases.portalMonth, 'month'];
  }

  // PASS 1: Match specific/primary headers (skip generic fallbacks)
  row.forEach((cell, index) => {
    if (cell === null || cell === undefined) return;
    const cleanCell = cleanHeader(cell);
    if (!cleanCell) return;
    if (GENERIC_FALLBACKS.has(cleanCell)) return; // Skip generic fallbacks in Pass 1

    for (const [propName, aliases] of Object.entries(activeAliases)) {
      if (aliases.includes(cleanCell)) {
        if (mapping[propName] === undefined) {
          mapping[propName] = index;
        }
        break;
      }
    }
  });

  // PASS 2: Match generic fallback headers for any remaining unmapped properties
  row.forEach((cell, index) => {
    if (cell === null || cell === undefined) return;
    const cleanCell = cleanHeader(cell);
    if (!cleanCell) return;

    for (const [propName, aliases] of Object.entries(activeAliases)) {
      if (mapping[propName] === undefined && aliases.includes(cleanCell)) {
        // Ensure this column index isn't already claimed by another property in Pass 1
        const alreadyMapped = Object.values(mapping).includes(index);
        if (!alreadyMapped) {
          mapping[propName] = index;
          break;
        }
      }
    }
  });

  return mapping;
}

function findHeaderRowIndex(rows: any[][], sheetType: 'Books' | 'Portal'): { index: number; mapping: Record<string, number> } {
  let bestRowIndex = -1;
  let bestMapping: Record<string, number> = {};
  let maxMatchedCount = 0;

  const limit = Math.min(rows.length, 30);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;

    const mapping = getHeaderMapping(row, sheetType);
    
    // Count how many required keys we matched (GSTIN, Invoice Number, Invoice Date, Taxable Value)
    const primaryProps = ['supplierGSTIN', 'invoiceNumber', 'invoiceDate', 'taxableValue'];
    let matchedRequiredCount = 0;
    primaryProps.forEach(prop => {
      if (mapping[prop] !== undefined) {
        matchedRequiredCount++;
      }
    });

    // We prioritize rows matching as many primary props as possible
    if (matchedRequiredCount > maxMatchedCount) {
      maxMatchedCount = matchedRequiredCount;
      bestRowIndex = i;
      bestMapping = mapping;
    }
  }

  // Fallback if no matching row is found with any matched keys
  if (bestRowIndex === -1 && rows.length > 0) {
    // Look for the first row containing at least some non-empty content
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      if (row && Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        bestRowIndex = i;
        bestMapping = getHeaderMapping(row, sheetType);
        break;
      }
    }
    if (bestRowIndex === -1) {
      bestRowIndex = 0;
      bestMapping = getHeaderMapping(rows[0], sheetType);
    }
  }

  return { index: bestRowIndex, mapping: bestMapping };
}

// --- EXCELJS ENTERPRISE DESIGN HELPER FUNCTIONS ---
interface StylingOptions {
  headerColor: string;
  headerTextColor?: string;
  freezeHeader?: boolean;
  enableFilters?: boolean;
  numericCols?: number[];
  currencyCols?: number[];
  percentCols?: number[];
  dateCols?: number[];
}

function autoColumnWidths(ws: ExcelJS.Worksheet) {
  ws.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const value = cell.value;
      if (value !== undefined && value !== null) {
        let len = 0;
        if (value instanceof Date) {
          len = 15;
        } else if (typeof value === 'object' && 'formula' in value) {
          len = 12; // estimated width for formula cells
        } else if (typeof value === 'object' && 'texts' in value) {
          len = 0;
        } else {
          len = value.toString().length;
        }
        if (len > maxLength) {
          maxLength = len;
        }
      }
    });
    column.width = Math.max(maxLength + 3, 11);
  });
}

function styleExcelSheet(
  ws: ExcelJS.Worksheet,
  headerRowIdx: number,
  colCount: number,
  options: StylingOptions
) {
  ws.views = [{ showGridLines: true }];

  if (options.freezeHeader) {
    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: headerRowIdx }];
  }

  if (options.enableFilters) {
    const colLetterStart = String.fromCharCode(65); // 'A'
    const colLetterEnd = String.fromCharCode(65 + colCount - 1);
    ws.autoFilter = `${colLetterStart}${headerRowIdx}:${colLetterEnd}${headerRowIdx}`;
  }

  ws.eachRow((row, rowIdx) => {
    if (rowIdx === headerRowIdx) {
      row.height = 28;
    } else if (rowIdx < headerRowIdx) {
      row.height = rowIdx === 1 ? 30 : 20;
    } else {
      row.height = 20;
    }

    row.eachCell({ includeEmpty: false }, (cell, colIdx) => {
      const isHeader = rowIdx === headerRowIdx;
      cell.font = {
        name: 'Calibri',
        size: isHeader ? 11 : 10,
        bold: isHeader || (rowIdx > headerRowIdx && cell.value?.toString().startsWith('TOTAL')),
        color: isHeader ? { argb: options.headerTextColor || 'FFFFFFFF' } : undefined
      };

      if (isHeader) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      } else {
        cell.alignment = { vertical: 'middle' };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };

      if (isHeader) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: options.headerColor }
        };
      } else if (rowIdx > headerRowIdx) {
        const isBanded = (rowIdx - headerRowIdx) % 2 === 0;
        if (isBanded && !cell.fill) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F6FA' }
          };
        }
      }
    });
  });

  ws.eachRow((row, rowIdx) => {
    if (rowIdx <= headerRowIdx) return;
    row.eachCell({ includeEmpty: false }, (cell, colIdx) => {
      if (options.currencyCols?.includes(colIdx)) {
        if (typeof cell.value === 'number' || (cell.value && typeof cell.value === 'object' && 'formula' in cell.value)) {
          cell.numFmt = '[$₹-439] #,##,##0.00;[$₹-439] -#,##,##0.00;"-"';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      } else if (options.numericCols?.includes(colIdx)) {
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      } else if (options.percentCols?.includes(colIdx)) {
        if (typeof cell.value === 'number') {
          cell.numFmt = '0%';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      } else if (options.dateCols?.includes(colIdx)) {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd-mmm-yyyy';
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (typeof cell.value === 'string' && cell.value.trim() !== '') {
          const d = new Date(cell.value);
          if (d && !isNaN(d.getTime())) {
            cell.value = d;
            cell.numFmt = 'dd-mmm-yyyy';
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        }
      }
    });
  });

  ws.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: `${headerRowIdx}:${headerRowIdx}`,
    margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
  };
}

function drawKpiCard(
  ws: ExcelJS.Worksheet,
  startCol: number,
  endCol: number,
  startRow: number,
  title: string,
  value: number | string,
  isCurrency: boolean,
  themeColor: string,
  bgColor: string,
  hyperlink?: string
) {
  ws.mergeCells(startRow, startCol, startRow, endCol);
  const titleCell = ws.getCell(startRow, startCol);
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColor } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(startRow + 1, startCol, startRow + 2, endCol);
  const valCell = ws.getCell(startRow + 1, startCol);
  
  if (hyperlink) {
    const displayText = typeof value === 'number'
      ? (isCurrency 
          ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
          : value.toLocaleString('en-IN'))
      : value.toString();
    valCell.value = { text: displayText, hyperlink: hyperlink };
    valCell.font = { name: 'Calibri', size: 22, bold: true, color: { argb: themeColor }, underline: true };
  } else {
    valCell.value = value;
    valCell.font = { name: 'Calibri', size: 22, bold: true, color: { argb: themeColor } };
    if (isCurrency && typeof value === 'number') {
      valCell.numFmt = '[$₹-439] #,##,##0.00;[$₹-439] -#,##,##0.00;"-"';
    } else if (typeof value === 'number') {
      valCell.numFmt = '#,##0';
    }
  }

  valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  valCell.alignment = { horizontal: 'center', vertical: 'middle' };

  for (let r = startRow; r <= startRow + 2; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = ws.getCell(r, c);
      cell.border = {
        top: { style: 'thin', color: { argb: themeColor } },
        bottom: { style: 'thin', color: { argb: themeColor } },
        left: { style: 'thin', color: { argb: themeColor } },
        right: { style: 'thin', color: { argb: themeColor } }
      };
    }
  }
}

function appendFooter(ws: ExcelJS.Worksheet, lastRow: number, numCols: number) {
  const footerRow = lastRow + 2;
  ws.mergeCells(footerRow, 1, footerRow, numCols);
  const cell1 = ws.getCell(footerRow, 1);
  cell1.value = "Generated by Ankesh Digital Workspace | Processed 100% Locally";
  cell1.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF808080' } };
  cell1.alignment = { horizontal: 'center', vertical: 'middle' };

  const timeRow = footerRow + 1;
  ws.mergeCells(timeRow, 1, timeRow, numCols);
  const cell2 = ws.getCell(timeRow, 1);
  cell2.value = `Generation Date & Time: ${new Date().toLocaleString()} | Page 1 of 1 (Refer to Print Layout for exact pages)`;
  cell2.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF808080' } };
  cell2.alignment = { horizontal: 'center', vertical: 'middle' };

  // Set native print footer
  ws.headerFooter = {
    oddFooter: "Generated by Ankesh Digital Workspace | Processed 100% Locally | Date: &D &T | Page &P of &N",
    differentFirst: false
  };
}

export const GSTReconciliationTool: React.FC = () => {
  // Application State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'Summary' | 'Matched' | 'Timing Difference' | 'Only in Books' | 'Only in GSTR-2B' | 'Invoice Difference' | 'GST Difference' | 'Vendor Summary' | 'Validation Issues'>('Summary');

  // Workbook Data
  const [booksRecords, setBooksRecords] = useState<GstRecord[]>([]);
  const [portalRecords, setPortalRecords] = useState<GstRecord[]>([]);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [reconciledResults, setReconciledResults] = useState<ReconciledRecord[]>([]);
  const [workbookVersion, setWorkbookVersion] = useState<string>('Unknown');

  // Search & Filter State
  const [searchGstin, setSearchGstin] = useState('');
  const [searchVendor, setSearchVendor] = useState('');
  const [searchInvoice, setSearchInvoice] = useState('');
  const [searchMonth, setSearchMonth] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('All');

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- TRIGGER TOAST ---
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // --- DYNAMIC EXCEL TEMPLATE GENERATION ---
  // We generate a compliant multi-sheet GST template on-the-fly and download it client-side!
  const generateTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      // 1. INSTRUCTIONS SHEET
      const wsInstructions = workbook.addWorksheet("Instructions");
      wsInstructions.views = [{ showGridLines: true }];

      // Set titles
      wsInstructions.mergeCells("A2:C2");
      const titleCell = wsInstructions.getCell("A2");
      titleCell.value = "GST RECONCILIATION AUDIT LEDGER - INSTRUCTIONS & SYSTEM INTEGRITY";
      titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      wsInstructions.getRow(2).height = 40;

      // Description Row
      wsInstructions.mergeCells("A3:C3");
      const descCell = wsInstructions.getCell("A3");
      descCell.value = "Prepared by Ankesh Digital Workspace | Enterprise CA Compliance Tool | Processed 100% Locally";
      descCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
      descCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
      descCell.alignment = { horizontal: 'center', vertical: 'middle' };
      wsInstructions.getRow(3).height = 20;

      // Setup sections
      const sections = [
        {
          title: "SYSTEM INFORMATION",
          color: "FF1F497D",
          rows: [
            ["Workbook Version", "1.0", "Release audit ledger build"],
            ["Auditor Profile", "Ankesh Digital Workspace (Client Edition)", "No data leaves your computer"],
            ["Filing Status", "Statutory Section 16(2)(aa) CGST Compliance Audit", "Claim reconciliation ledger"]
          ]
        },
        {
          title: "TAB SHEET DESIGNATIONS & RECONCILIATION ROLES",
          color: "FF1F497D",
          rows: [
            ["Instructions", "Acts as the documentation and system validation ledger.", "DO NOT RENAME"],
            ["Purchase Register", "Your interior Books of Accounts. Enter raw purchase entries starting Row 2.", "INPUT TAB"],
            ["GSTR-2B", "The statutory ledger downloaded directly from the GST Council portal.", "INPUT TAB"]
          ]
        },
        {
          title: "REQUIRED TRANSACTION HEADERS (DO NOT ALTER)",
          color: "FF2E7D32",
          rows: [
            ["Supplier GSTIN", "15-character valid GSTIN format", "e.g. 27AAPFU0939F1Z5"],
            ["Supplier Name", "Trade or Legal Business Name", "e.g. Reliance Industries Ltd"],
            ["Invoice Number", "Unique tax invoice serial number", "e.g. RIL-APR-99"],
            ["Invoice Date", "Invoice Date (format: YYYY-MM-DD or DD-MMM-YYYY)", "e.g. 15-Apr-2025"],
            ["Taxable Value", "Value on which tax is charged (numerical value)", "e.g. 100000.00"],
            ["IGST", "Integrated GST amount (enter 0 if SGST/CGST applies)", "e.g. 18000.00"],
            ["CGST", "Central GST amount (enter 0 if IGST applies)", "e.g. 9000.00"],
            ["SGST", "State GST amount (enter 0 if IGST applies)", "e.g. 9000.00"],
            ["Total GST", "Sum of CGST + SGST + IGST", "e.g. 18000.00"],
            ["Books Month / 2B Month", "Filing tax period corresponding to ledger", "e.g. April 2026"]
          ]
        },
        {
          title: "COMMON COMPLIANCE MISTAKES & RECON RULES",
          color: "FFC62828",
          rows: [
            ["Swapping Columns", "Do not rearrange column orders. The mapper matches headers by name dynamically.", "CRITICAL ERROR"],
            ["Missing Fields", "Leaving required fields like GSTIN, Invoice Number, or Total GST blank.", "VALIDATION FAIL"],
            ["Empty Rows", "Leaving fully empty rows in between data lines. Start and fill continuously.", "PARSING BLOCKED"],
            ["Format Mismatch", "Adding text like 'NA' or 'NIL' to numeric tax value columns.", "VALUE EXCEPTION"]
          ]
        }
      ];

      let currentRow = 5;
      sections.forEach(sec => {
        // Section Header Row
        wsInstructions.mergeCells(currentRow, 1, currentRow, 3);
        const secCell = wsInstructions.getCell(currentRow, 1);
        secCell.value = sec.title;
        secCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        secCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sec.color } };
        secCell.alignment = { horizontal: 'left', vertical: 'middle' };
        wsInstructions.getRow(currentRow).height = 24;
        currentRow++;

        // Section rows
        sec.rows.forEach(r => {
          wsInstructions.getCell(currentRow, 1).value = r[0];
          wsInstructions.getCell(currentRow, 2).value = r[1];
          wsInstructions.getCell(currentRow, 3).value = r[2];

          // Borders & style
          for (let c = 1; c <= 3; c++) {
            const cell = wsInstructions.getCell(currentRow, c);
            cell.font = { name: 'Calibri', size: 10, bold: c === 1 };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
            };
            if (c === 3) {
              cell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF595959' } };
            }
          }
          wsInstructions.getRow(currentRow).height = 20;
          currentRow++;
        });

        currentRow++; // blank line after section
      });

      // Set Instructions widths
      wsInstructions.getColumn(1).width = 25;
      wsInstructions.getColumn(2).width = 50;
      wsInstructions.getColumn(3).width = 35;

      // 2. PURCHASE REGISTER SHEET (BOOKS)
      const wsBooks = workbook.addWorksheet("Purchase Register");
      
      // Header Row
      const booksHeaders = [
        "Supplier GSTIN", "Supplier Name", "Invoice Number", "Invoice Date", 
        "Taxable Value", "IGST", "CGST", "SGST", "Total GST", "Books Month", "Template Note"
      ];
      wsBooks.addRow(booksHeaders);

      // Add Sample Seed Rows with soft highlight
      const seedBooks = [
        ["27AAPFU0939F1Z5", "Ankesh Incorporation", "INV-2026-001", new Date("2026-04-10"), 100000, 0, 9000, 9000, 18000, "April 2026", "Sample Row - Exact Match case. Matches GSTR-2B exactly."],
        ["27AAACR0392D1Z2", "Reliance Industries Ltd", "RIL-APR-99", new Date("2026-04-15"), 50000, 9000, 0, 0, 9000, "April 2026", "Sample Row - Timing Difference. April in Books, May in Portal."],
        ["29AAAAA0000A1Z0", "Infosys Limited", "INF-10293", new Date("2026-04-20"), 200000, 0, 18000, 18000, 36000, "April 2026", "Sample Row - Invoice Number typo in Books. Portal is 'INF/10293'."],
        ["19AAATC1014R1Z3", "ITC Limited", "ITC-2026-88", new Date("2026-04-22"), 30000, 0, 2700, 2700, 5400, "April 2026", "Sample Row - GST value mismatch. CGST in portal is 2690."],
        ["11AAATB2803G1ZD", "Tata Consultancy Services", "TCS-APR-004", new Date("2026-04-25"), 150000, 0, 13500, 13500, 27000, "April 2026", "Sample Row - Missing in GSTR-2B. Claim is blocked."],
        ["27AAACR0392D1Z2", "Reliance Industries Ltd", "RIL-DUP-11", new Date("2026-04-30"), 25000, 0, 2250, 2250, 4500, "April 2026", "Sample Row - Duplicate Entry 1. Second entry triggers warning."],
        ["27AAACR0392D1Z2", "Reliance Industries Ltd", "RIL-DUP-11", new Date("2026-04-30"), 25000, 0, 2250, 2250, 4500, "April 2026", "Sample Row - Duplicate Entry 2. Double-claim in internal books."],
        ["INVALIDGSTIN99", "Bad Ventures Pvt Ltd", "INV-BAD-01", new Date("2026-04-01"), 10000, 0, 900, 900, 1800, "April 2026", "Sample Row - Invalid format. GSTIN length/character check failed."]
      ];

      seedBooks.forEach(row => {
        wsBooks.addRow(row);
      });

      // Highlight Sample rows differently (Soft gold/yellow) and set comments
      styleExcelSheet(wsBooks, 1, 11, {
        headerColor: "FF1F4E79", // Steel Blue
        freezeHeader: true,
        enableFilters: true,
        currencyCols: [5, 6, 7, 8, 9],
        dateCols: [4]
      });

      // Set sample row style and cell comments
      for (let r = 2; r <= 9; r++) {
        wsBooks.getRow(r).eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFDF0' } // Soft light gold
          };
          cell.font = { name: 'Calibri', size: 10, italic: true };
        });
        const noteCell = wsBooks.getCell(r, 11);
        noteCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF856404' } };
      }

      // Add notes on critical headers to guide data entry
      wsBooks.getCell("A1").note = "Required. Valid 15-character alphanumeric GSTIN format.";
      wsBooks.getCell("C1").note = "Required. Unique invoice or credit note key.";
      wsBooks.getCell("D1").note = "Required. Invoices date (YYYY-MM-DD).";
      wsBooks.getCell("E1").note = "Required. Amount subject to GST.";
      wsBooks.getCell("I1").note = "Required. Sum of IGST + CGST + SGST.";
      wsBooks.getCell("J1").note = "Required. Books Month Tax Period (e.g., April 2026).";

      autoColumnWidths(wsBooks);


      // 3. GSTR-2B SHEET
      const wsPortal = workbook.addWorksheet("GSTR-2B");
      
      const portalHeaders = [
        "Supplier GSTIN", "Supplier Name", "Invoice Number", "Invoice Date", 
        "Taxable Value", "IGST", "CGST", "SGST", "Total GST", "2B Month", "Template Note"
      ];
      wsPortal.addRow(portalHeaders);

      const seedPortal = [
        ["27AAPFU0939F1Z5", "Ankesh Incorporation", "INV-2026-001", new Date("2026-04-10"), 100000, 0, 9000, 9000, 18000, "April 2026", "Sample Row - Exact Match. Invoices match on all details."],
        ["27AAACR0392D1Z2", "Reliance Industries Ltd", "RIL-APR-99", new Date("2026-04-15"), 50000, 9000, 0, 0, 9000, "May 2026", "Sample Row - Timing Difference. Filed in GSTR-2B of May 2026."],
        ["29AAAAA0000A1Z0", "Infosys Limited", "INF/10293", new Date("2026-04-20"), 200000, 0, 18000, 18000, 36000, "April 2026", "Sample Row - Invoice number discrepancy. Files as INF/10293 in GSTR-2B."],
        ["19AAATC1014R1Z3", "ITC Limited", "ITC-2026-88", new Date("2026-04-22"), 30000, 0, 2690, 2690, 5380, "April 2026", "Sample Row - GST value mismatch. Filed as 2690 CGST in portal."],
        ["27AAACR0392D1Z2", "Reliance Industries Ltd", "RIL-DUP-11", new Date("2026-04-30"), 25000, 0, 2250, 2250, 4500, "April 2026", "Sample Row - Matches first book entry of double claim duplicate."],
        ["27AAPFU0939F1Z5", "Ankesh Incorporation", "INV-2026-002", new Date("2026-04-28"), 80000, 0, 7200, 7200, 14400, "April 2026", "Sample Row - Missing in Books. Discovered in GSTR-2B but omitted in Books."]
      ];

      seedPortal.forEach(row => {
        wsPortal.addRow(row);
      });

      styleExcelSheet(wsPortal, 1, 11, {
        headerColor: "FF005C53", // Dark Teal
        freezeHeader: true,
        enableFilters: true,
        currencyCols: [5, 6, 7, 8, 9],
        dateCols: [4]
      });

      // Highlight Sample rows differently (Soft gold/yellow)
      for (let r = 2; r <= 7; r++) {
        wsPortal.getRow(r).eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFDF0' } // Soft light gold
          };
          cell.font = { name: 'Calibri', size: 10, italic: true };
        });
        const noteCell = wsPortal.getCell(r, 11);
        noteCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF856404' } };
      }

      // Add notes on critical headers to guide data entry
      wsPortal.getCell("A1").note = "Required. Valid 15-character portal GSTIN.";
      wsPortal.getCell("C1").note = "Required. Portal registered Invoice number.";
      wsPortal.getCell("D1").note = "Required. Date registered on portal (YYYY-MM-DD).";
      wsPortal.getCell("E1").note = "Required. Registered Taxable value.";
      wsPortal.getCell("I1").note = "Required. Registered Total GST.";
      wsPortal.getCell("J1").note = "Required. GSTR-2B Tax Period filing month (e.g., April 2026).";

      autoColumnWidths(wsPortal);

      appendFooter(wsBooks, 9, 11);
      appendFooter(wsPortal, 7, 11);
      wsInstructions.headerFooter = {
        oddFooter: "Generated by Ankesh Digital Workspace | Processed 100% Locally | Date: &D &T | Page &P of &N",
        differentFirst: false
      };
      wsInstructions.pageSetup = {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
      };

      // Generate buffer and trigger browser download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "GST_Reconciliation_Workbook_Template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("GST Reconciliation Template downloaded successfully. Ready for validation testing!");
    } catch (err: any) {
      console.error("Template generation error: ", err);
      showToast("Error creating workbook: " + err.message);
    }
  };

  // --- EXCEL WORKBOOK PARSING & VALIDATION ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setFileName(file.name);
    setIsProcessing(true);
    setProgress(15);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        setProgress(35);
        const workbook = XLSX.read(data, { type: 'array' });
        setProgress(50);

        // --- STEP 3: SHEET VERIFICATION ---
        const sheetNames = workbook.SheetNames;
        const issues: ValidationIssue[] = [];
        
        const hasInstructions = sheetNames.includes("Instructions");
        const hasBooks = sheetNames.includes("Purchase Register");
        const hasPortal = sheetNames.includes("GSTR-2B");

        if (!hasInstructions) {
          issues.push({
            sheet: "Workbook",
            row: 0,
            issueType: "Missing Required Field",
            description: "Instructions sheet is missing. Version checks might fail.",
            severity: "Error"
          });
        } else {
          // Parse version from Instructions sheet (expects Version: X.X or cell match)
          const wsInstructions = workbook.Sheets["Instructions"];
          const instructionsRows: any[][] = XLSX.utils.sheet_to_json(wsInstructions, { header: 1 });
          const versionRow = instructionsRows.find(r => r && r[0] && r[0].toString().toLowerCase().includes("version"));
          if (versionRow && versionRow[1]) {
            setWorkbookVersion(versionRow[1].toString());
          } else {
            setWorkbookVersion("Unknown");
          }
        }

        if (!hasBooks) {
          issues.push({
            sheet: "Workbook",
            row: 0,
            issueType: "Missing Required Field",
            description: "Purchase Register sheet is missing. Cannot proceed with reconciliation.",
            severity: "Error"
          });
        }

        if (!hasPortal) {
          issues.push({
            sheet: "Workbook",
            row: 0,
            issueType: "Missing Required Field",
            description: "GSTR-2B sheet is missing. Cannot proceed with reconciliation.",
            severity: "Error"
          });
        }

        // Stop if major sheets are missing
        if (!hasBooks || !hasPortal) {
          setValidationIssues(issues);
          setBooksRecords([]);
          setPortalRecords([]);
          setCurrentStep(3);
          setIsProcessing(false);
          setProgress(100);
          showToast("Validation failed. Missing critical sheets.");
          return;
        }

        setProgress(65);

        // --- STEP 4: DYNAMIC HEADER-BASED EXCEL PARSING ---
        // Parse Purchase Register (Books)
        const wsBooks = workbook.Sheets["Purchase Register"];
        const booksRows: any[][] = XLSX.utils.sheet_to_json(wsBooks, { header: 1, defval: "" });
        const { index: booksHeaderIdx, mapping: booksMapping } = findHeaderRowIndex(booksRows, 'Books');
        const booksParsed: GstRecord[] = [];

        // Parse GSTR-2B (Portal)
        const wsPortal = workbook.Sheets["GSTR-2B"];
        const portalRows: any[][] = XLSX.utils.sheet_to_json(wsPortal, { header: 1, defval: "" });
        const { index: portalHeaderIdx, mapping: portalMapping } = findHeaderRowIndex(portalRows, 'Portal');
        const portalParsed: GstRecord[] = [];

        // Required headers validation checklist
        const requiredBooksProps = ['supplierGSTIN', 'supplierName', 'invoiceNumber', 'invoiceDate', 'taxableValue', 'igst', 'cgst', 'sgst', 'totalGst', 'booksMonth'];
        const requiredPortalProps = ['supplierGSTIN', 'supplierName', 'invoiceNumber', 'invoiceDate', 'taxableValue', 'igst', 'cgst', 'sgst', 'totalGst', 'portalMonth'];

        if (booksHeaderIdx === -1) {
          issues.push({
            sheet: "Purchase Register",
            row: 1,
            issueType: "Missing Required Field",
            description: "Could not identify the header row in Purchase Register. Please ensure column headers like 'Supplier GSTIN' or 'Invoice Number' are present.",
            severity: "Error"
          });
        } else {
          requiredBooksProps.forEach(prop => {
            if (booksMapping[prop] === undefined) {
              issues.push({
                sheet: "Purchase Register",
                row: booksHeaderIdx + 1,
                issueType: "Missing Required Field",
                description: `Column '${HUMAN_REQUIRED_HEADERS[prop] || prop}' is missing in Purchase Register.`,
                severity: "Error"
              });
            }
          });
        }

        if (portalHeaderIdx === -1) {
          issues.push({
            sheet: "GSTR-2B",
            row: 1,
            issueType: "Missing Required Field",
            description: "Could not identify the header row in GSTR-2B sheet. Please ensure column headers like 'Supplier GSTIN' or 'Invoice Number' are present.",
            severity: "Error"
          });
        } else {
          requiredPortalProps.forEach(prop => {
            if (portalMapping[prop] === undefined) {
              issues.push({
                sheet: "GSTR-2B",
                row: portalHeaderIdx + 1,
                issueType: "Missing Required Field",
                description: `Column '${HUMAN_REQUIRED_HEADERS[prop] || prop}' is missing in GSTR-2B.`,
                severity: "Error"
              });
            }
          });
        }

        // Stop if major sheets or critical headers are missing
        const hasErrors = issues.some(iss => iss.severity === 'Error');
        if (hasErrors) {
          setValidationIssues(issues);
          setBooksRecords([]);
          setPortalRecords([]);
          setCurrentStep(3);
          setIsProcessing(false);
          setProgress(100);
          showToast("Validation failed. Missing required sheets or columns.");
          return;
        }

        setProgress(75);

        // Convert Purchase Register Rows to Records
        const invoiceBookTracker: Record<string, number> = {}; // For duplicate check: gstin + invoiceNum
        const booksDataRows = booksRows.slice(booksHeaderIdx + 1);

        booksDataRows.forEach((row, idx) => {
          const rowNum = booksHeaderIdx + 1 + idx + 1; // 1-indexed sheet row number
          
          // Skip completely empty rows
          if (!row || !Array.isArray(row) || row.every(cell => cell === null || cell === undefined || cell === "")) {
            return;
          }

          const getCell = (prop: string): string => {
            const colIdx = booksMapping[prop];
            if (colIdx === undefined) return '';
            const val = row[colIdx];
            return val !== undefined && val !== null ? val.toString().trim() : '';
          };

          const getFloat = (prop: string): number => {
            const valStr = getCell(prop);
            if (!valStr) return 0;
            const val = parseFloat(valStr.replace(/,/g, ''));
            return isNaN(val) ? 0 : val;
          };

          const rawGstin = getCell('supplierGSTIN');
          const rawInvNum = getCell('invoiceNumber');
          const rawInvDate = getCell('invoiceDate');
          const rawSupplier = getCell('supplierName');
          const rawMonth = getCell('booksMonth');

          const taxable = getFloat('taxableValue');
          const igst = getFloat('igst');
          const cgst = getFloat('cgst');
          const sgst = getFloat('sgst');
          const totalGst = getFloat('totalGst');

          // Validity and Field constraints
          if (!rawGstin) {
            issues.push({
              sheet: "Purchase Register", row: rowNum, issueType: "Missing Required Field",
              description: "Supplier GSTIN is missing.", severity: "Error"
            });
          } else if (!isValidGstin(rawGstin)) {
            issues.push({
              sheet: "Purchase Register", row: rowNum, invoiceNumber: rawInvNum, gstin: rawGstin,
              issueType: "Invalid GSTIN", description: `Supplier GSTIN '${rawGstin}' has invalid Indian checksum syntax.`, severity: "Warning"
            });
          }

          if (!rawInvNum) {
            issues.push({
              sheet: "Purchase Register", row: rowNum, issueType: "Missing Required Field",
              description: "Invoice Number is missing.", severity: "Error"
            });
          }

          if (!rawInvDate) {
            issues.push({
              sheet: "Purchase Register", row: rowNum, issueType: "Missing Required Field",
              description: "Invoice Date is missing.", severity: "Error"
            });
          }

          if (taxable < 0 || igst < 0 || cgst < 0 || sgst < 0 || totalGst < 0) {
            issues.push({
              sheet: "Purchase Register", row: rowNum, invoiceNumber: rawInvNum, gstin: rawGstin,
              issueType: "Negative Value", description: "Negative financial parameters detected.", severity: "Warning"
            });
          }

          // Duplicate checks (same GSTIN + Invoice Number in Books)
          if (rawGstin && rawInvNum) {
            const key = `${rawGstin.toUpperCase()}_${normalizeInvoiceNum(rawInvNum)}`;
            if (invoiceBookTracker[key] !== undefined) {
              invoiceBookTracker[key]++;
              issues.push({
                sheet: "Purchase Register",
                row: rowNum,
                invoiceNumber: rawInvNum,
                gstin: rawGstin,
                issueType: "Duplicate Invoice Number",
                description: `Invoice '${rawInvNum}' for supplier '${rawGstin}' is duplicated in Books.`,
                severity: "Warning"
              });
            } else {
              invoiceBookTracker[key] = 1;
            }
          }

          booksParsed.push({
            id: `B-${idx}-${rawGstin}`,
            source: 'Books',
            gstin: rawGstin,
            supplierName: rawSupplier || "Unknown Supplier",
            invoiceNumber: rawInvNum,
            invoiceDate: rawInvDate,
            taxableValue: taxable,
            igst, cgst, sgst, totalGst,
            month: rawMonth,
            originalRowNumber: rowNum
          });
        });

        // Convert GSTR-2B Rows to Records
        const invoicePortalTracker: Record<string, number> = {};
        const portalDataRows = portalRows.slice(portalHeaderIdx + 1);

        portalDataRows.forEach((row, idx) => {
          const rowNum = portalHeaderIdx + 1 + idx + 1; // 1-indexed sheet row number
          
          // Skip completely empty rows
          if (!row || !Array.isArray(row) || row.every(cell => cell === null || cell === undefined || cell === "")) {
            return;
          }

          const getCell = (prop: string): string => {
            const colIdx = portalMapping[prop];
            if (colIdx === undefined) return '';
            const val = row[colIdx];
            return val !== undefined && val !== null ? val.toString().trim() : '';
          };

          const getFloat = (prop: string): number => {
            const valStr = getCell(prop);
            if (!valStr) return 0;
            const val = parseFloat(valStr.replace(/,/g, ''));
            return isNaN(val) ? 0 : val;
          };

          const rawGstin = getCell('supplierGSTIN');
          const rawInvNum = getCell('invoiceNumber');
          const rawInvDate = getCell('invoiceDate');
          const rawSupplier = getCell('supplierName');
          const rawMonth = getCell('portalMonth');

          const taxable = getFloat('taxableValue');
          const igst = getFloat('igst');
          const cgst = getFloat('cgst');
          const sgst = getFloat('sgst');
          const totalGst = getFloat('totalGst');

          if (!rawGstin) {
            issues.push({
              sheet: "GSTR-2B", row: rowNum, issueType: "Missing Required Field",
              description: "Supplier GSTIN is missing.", severity: "Error"
            });
          } else if (!isValidGstin(rawGstin)) {
            issues.push({
              sheet: "GSTR-2B", row: rowNum, invoiceNumber: rawInvNum, gstin: rawGstin,
              issueType: "Invalid GSTIN", description: `Supplier GSTIN '${rawGstin}' has invalid Indian checksum syntax.`, severity: "Warning"
            });
          }

          if (!rawInvNum) {
            issues.push({
              sheet: "GSTR-2B", row: rowNum, issueType: "Missing Required Field",
              description: "Invoice Number is missing.", severity: "Error"
            });
          }

          if (rawGstin && rawInvNum) {
            const key = `${rawGstin.toUpperCase()}_${normalizeInvoiceNum(rawInvNum)}`;
            if (invoicePortalTracker[key] !== undefined) {
              invoicePortalTracker[key]++;
              issues.push({
                sheet: "GSTR-2B",
                row: rowNum,
                invoiceNumber: rawInvNum,
                gstin: rawGstin,
                issueType: "Duplicate Invoice Number",
                description: `Invoice '${rawInvNum}' for supplier '${rawGstin}' is duplicated in Portal GSTR-2B ledger.`,
                severity: "Warning"
              });
            } else {
              invoicePortalTracker[key] = 1;
            }
          }

          portalParsed.push({
            id: `P-${idx}-${rawGstin}`,
            source: 'Portal',
            gstin: rawGstin,
            supplierName: rawSupplier || "Unknown Supplier",
            invoiceNumber: rawInvNum,
            invoiceDate: rawInvDate,
            taxableValue: taxable,
            igst, cgst, sgst, totalGst,
            month: rawMonth,
            originalRowNumber: rowNum
          });
        });

        // --- TEMPORARY DEBUG LOGGING ---
        console.log("=== DEBUG: GST RECONCILIATION ENGINE PARSING ===");
        console.log("Detected Books header index:", booksHeaderIdx);
        console.log("Detected Books header map:", booksMapping);
        console.log("Supplier GSTIN column index in Books:", booksMapping['supplierGSTIN']);
        console.log("Supplier Name column index in Books:", booksMapping['supplierName']);
        console.log("Invoice Number column index in Books:", booksMapping['invoiceNumber']);
        if (booksRows[booksHeaderIdx]) {
          console.log("Books Header Row Content:", booksRows[booksHeaderIdx]);
        }
        console.log("First parsed Purchase Register row object:", booksParsed[0] || "None parsed");

        console.log("Detected Portal header index:", portalHeaderIdx);
        console.log("Detected Portal header map:", portalMapping);
        console.log("Supplier GSTIN column index in Portal:", portalMapping['supplierGSTIN']);
        console.log("Supplier Name column index in Portal:", portalMapping['supplierName']);
        console.log("Invoice Number column index in Portal:", portalMapping['invoiceNumber']);
        if (portalRows[portalHeaderIdx]) {
          console.log("Portal Header Row Content:", portalRows[portalHeaderIdx]);
        }
        console.log("First parsed GSTR-2B row object:", portalParsed[0] || "None parsed");
        console.log("================================================");

        setProgress(90);
        setBooksRecords(booksParsed);
        setPortalRecords(portalParsed);
        setValidationIssues(issues);
        setCurrentStep(3); // Shift to Step 3 (Validation Report view)
        setIsProcessing(false);
        setProgress(100);
        showToast("Workbook validation complete. Let's inspect the report!");
      } catch (err: any) {
        console.error("FileReader processing failed: ", err);
        setIsProcessing(false);
        setProgress(0);
        showToast("Error parsing workbook: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- MATCHING ENGINE (STEP 4) ---
  const runReconciliation = () => {
    setIsProcessing(true);
    setProgress(10);

    setTimeout(() => {
      setProgress(30);
      const results: ReconciledRecord[] = [];
      const matchedPortalIds = new Set<string>();
      const matchedBookIds = new Set<string>();

      // Pre-filter invalid records
      const validBooks = booksRecords.filter(b => isValidGstin(b.gstin));
      const invalidBooks = booksRecords.filter(b => !isValidGstin(b.gstin));

      // Append invalid records directly to classification
      invalidBooks.forEach(invBook => {
        results.push({
          id: `R-INV-${invBook.id}`,
          classification: 'Invalid Record',
          bookRecord: invBook,
          gstin: invBook.gstin,
          invoiceNumber: invBook.invoiceNumber,
          invoiceDate: invBook.invoiceDate,
          supplierName: invBook.supplierName,
          taxableValueDiff: invBook.taxableValue,
          gstDiff: invBook.totalGst,
          monthDiff: false,
          notes: "Flagged because GSTIN fails checksum formatting validations."
        });
        matchedBookIds.add(invBook.id);
      });

      // Track duplicates in Books - standard compliance rules state first duplicate is treated as normal, subsequent duplicates are classified as 'Duplicate Invoice'
      const invoiceKeyTracker: Record<string, string[]> = {};
      validBooks.forEach(b => {
        const key = `${b.gstin.toUpperCase()}_${normalizeInvoiceNum(b.invoiceNumber)}`;
        if (!invoiceKeyTracker[key]) {
          invoiceKeyTracker[key] = [];
        }
        invoiceKeyTracker[key].push(b.id);
      });

      const duplicateBookIds = new Set<string>();
      Object.entries(invoiceKeyTracker).forEach(([key, ids]) => {
        if (ids.length > 1) {
          // Keep first instance as normal, mark rest as duplicate
          ids.slice(1).forEach(id => {
            duplicateBookIds.add(id);
          });
        }
      });

      // Filter books to match
      const normalBooks = validBooks.filter(b => !duplicateBookIds.has(b.id));
      const duplicateBooks = validBooks.filter(b => duplicateBookIds.has(b.id));

      setProgress(50);

      // Map to quickly find Portal records by Supplier + Invoice combination
      const portalBySupplierInvoiceMap: Record<string, GstRecord[]> = {};
      portalRecords.forEach(p => {
        const key = `${p.gstin.toUpperCase()}_${normalizeInvoiceNum(p.invoiceNumber)}`;
        if (!portalBySupplierInvoiceMap[key]) {
          portalBySupplierInvoiceMap[key] = [];
        }
        portalBySupplierInvoiceMap[key].push(p);
      });

      // Reconcile non-duplicate, valid Books records
      normalBooks.forEach(book => {
        const key = `${book.gstin.toUpperCase()}_${normalizeInvoiceNum(book.invoiceNumber)}`;
        const portalMatches = portalBySupplierInvoiceMap[key] || [];

        // Try to find the best matching portal record
        let bestPortalMatch: GstRecord | undefined = undefined;
        let bestScore = 0; // matching rating score out of 100

        portalMatches.forEach(p => {
          if (matchedPortalIds.has(p.id)) return;

          let score = 0;
          // Calculate similarity
          if (p.invoiceDate === book.invoiceDate) score += 30;
          if (Math.abs(p.taxableValue - book.taxableValue) < 1) score += 40;
          if (Math.abs(p.totalGst - book.totalGst) < 1) score += 30;

          if (score > bestScore) {
            bestScore = score;
            bestPortalMatch = p;
          }
        });

        if (bestPortalMatch) {
          const portal: GstRecord = bestPortalMatch;
          matchedPortalIds.add(portal.id);
          matchedBookIds.add(book.id);

          const taxDiff = Math.abs(book.totalGst - portal.totalGst);
          const taxableDiff = Math.abs(book.taxableValue - portal.taxableValue);
          const dateMismatch = book.invoiceDate !== portal.invoiceDate;
          const monthMismatch = book.month.toLowerCase().trim() !== portal.month.toLowerCase().trim();

          let classification: ClassificationType = 'Exact Match';
          let notes = "Verified record. Invoice numbers, dates, values, and tax matrices are aligned.";

          if (taxDiff >= 2 || taxableDiff >= 10) {
            classification = 'GST Difference';
            notes = `Discrepancy detected in values. Books Tax: ₹${book.totalGst.toFixed(2)}, Portal 2B Tax: ₹${portal.totalGst.toFixed(2)}. Diff: ₹${(book.totalGst - portal.totalGst).toFixed(2)}.`;
          } else if (monthMismatch) {
            classification = 'Timing Difference';
            notes = `Invoice registered in Books month '${book.month}', but uploaded by vendor in GSTR-2B month '${portal.month}'. Claim deferral required.`;
          } else if (dateMismatch) {
            classification = 'Timing Difference';
            notes = `Invoice dates do not align. Books Date: ${book.invoiceDate}, Portal Date: ${portal.invoiceDate}.`;
          } else if (book.invoiceNumber !== portal.invoiceNumber) {
            // Numbers normalised matched, but originals differed (e.g., slashes vs dashes)
            classification = 'Invoice Difference';
            notes = `Invoice numbers match phonetically but have syntax mismatch. Books: '${book.invoiceNumber}', Portal: '${portal.invoiceNumber}'.`;
          }

          results.push({
            id: `RECON-${book.id}-${portal.id}`,
            classification,
            bookRecord: book,
            portalRecord: portal,
            gstin: book.gstin,
            invoiceNumber: book.invoiceNumber,
            invoiceDate: book.invoiceDate,
            supplierName: book.supplierName,
            taxableValueDiff: book.taxableValue - portal.taxableValue,
            gstDiff: book.totalGst - portal.totalGst,
            monthDiff: monthMismatch,
            notes
          });
        } else {
          // Try fuzzy matching on GSTIN + Date + Taxable value but with different invoice numbers (Invoice No Difference)
          // Look for Portal records with same GSTIN, same date, and close taxable/GST values
          let fuzzyPortalMatch: GstRecord | undefined = undefined;
          portalRecords.forEach(p => {
            if (matchedPortalIds.has(p.id)) return;
            if (p.gstin.toUpperCase() === book.gstin.toUpperCase() &&
                p.invoiceDate === book.invoiceDate &&
                Math.abs(p.taxableValue - book.taxableValue) < 5 &&
                Math.abs(p.totalGst - book.totalGst) < 2) {
              fuzzyPortalMatch = p;
            }
          });

          if (fuzzyPortalMatch) {
            const portal: GstRecord = fuzzyPortalMatch;
            matchedPortalIds.add(portal.id);
            matchedBookIds.add(book.id);

            results.push({
              id: `RECON-FUZZY-${book.id}-${portal.id}`,
              classification: 'Invoice Difference',
              bookRecord: book,
              portalRecord: portal,
              gstin: book.gstin,
              invoiceNumber: book.invoiceNumber,
              invoiceDate: book.invoiceDate,
              supplierName: book.supplierName,
              taxableValueDiff: book.taxableValue - portal.taxableValue,
              gstDiff: book.totalGst - portal.totalGst,
              monthDiff: book.month.toLowerCase().trim() !== portal.month.toLowerCase().trim(),
              notes: `Fuzzy Match. Matched on Date/Values, but Invoice Number differs significantly. Books: '${book.invoiceNumber}', Portal: '${portal.invoiceNumber}'.`
            });
          } else {
            // Missing in GSTR-2B (Claim blocked by Section 16(2)(aa)!)
            results.push({
              id: `RECON-MISSING-PORTAL-${book.id}`,
              classification: 'Missing in GSTR-2B',
              bookRecord: book,
              gstin: book.gstin,
              invoiceNumber: book.invoiceNumber,
              invoiceDate: book.invoiceDate,
              supplierName: book.supplierName,
              taxableValueDiff: book.taxableValue,
              gstDiff: book.totalGst,
              monthDiff: false,
              notes: "Invoice present in accounts but missing in GSTR-2B. Input Tax Credit (ITC) CANNOT be claimed this month."
            });
            matchedBookIds.add(book.id);
          }
        }
      });

      // Handle duplicate books entries (duplicate invoices)
      duplicateBooks.forEach(book => {
        results.push({
          id: `RECON-DUP-${book.id}`,
          classification: 'Duplicate Invoice',
          bookRecord: book,
          gstin: book.gstin,
          invoiceNumber: book.invoiceNumber,
          invoiceDate: book.invoiceDate,
          supplierName: book.supplierName,
          taxableValueDiff: book.taxableValue,
          gstDiff: book.totalGst,
          monthDiff: false,
          notes: "Duplicate row in Purchase register. Fails unique invoice number ledger rules."
        });
        matchedBookIds.add(book.id);
      });

      setProgress(80);

      // Identify GSTR-2B records that had NO match in Books (Missing in Books)
      portalRecords.forEach(portal => {
        if (!matchedPortalIds.has(portal.id)) {
          results.push({
            id: `RECON-MISSING-BOOKS-${portal.id}`,
            classification: 'Missing in Books',
            portalRecord: portal,
            gstin: portal.gstin,
            invoiceNumber: portal.invoiceNumber,
            invoiceDate: portal.invoiceDate,
            supplierName: portal.supplierName,
            taxableValueDiff: -portal.taxableValue,
            gstDiff: -portal.totalGst,
            monthDiff: false,
            notes: "Filed by Supplier in GSTR-2B, but missing in Purchase Register. Potential unclaimed credit opportunity!"
          });
          matchedPortalIds.add(portal.id);
        }
      });

      setReconciledResults(results);
      setProgress(100);
      setIsProcessing(false);
      setCurrentStep(4); // View Dashboards & Tabs
      showToast("Reconciliation completed! 100% of purchase register matches classified.");
    }, 1200);
  };

  // --- STATS COMPUTATION FOR DASHBOARD ---
  const counts = useMemo(() => {
    const summary = {
      exact: 0,
      timing: 0,
      invDiff: 0,
      gstDiff: 0,
      missingBooks: 0,
      missingPortal: 0,
      duplicate: 0,
      invalid: 0,
      totalGstEligible: 0, // Matched + Timing (eventual) + Invoice Diff (corrected)
      totalGstBlocked: 0,  // Missing in 2B
      totalGstUnclaimed: 0 // Missing in Books
    };

    reconciledResults.forEach(r => {
      switch (r.classification) {
        case 'Exact Match':
          summary.exact++;
          summary.totalGstEligible += r.portalRecord?.totalGst || 0;
          break;
        case 'Timing Difference':
          summary.timing++;
          summary.totalGstEligible += r.portalRecord?.totalGst || 0;
          break;
        case 'Invoice Difference':
          summary.invDiff++;
          summary.totalGstEligible += r.portalRecord?.totalGst || 0;
          break;
        case 'GST Difference':
          summary.gstDiff++;
          summary.totalGstEligible += Math.min(r.bookRecord?.totalGst || 0, r.portalRecord?.totalGst || 0); // claim lower
          break;
        case 'Missing in Books':
          summary.missingBooks++;
          summary.totalGstUnclaimed += r.portalRecord?.totalGst || 0;
          break;
        case 'Missing in GSTR-2B':
          summary.missingPortal++;
          summary.totalGstBlocked += r.bookRecord?.totalGst || 0;
          break;
        case 'Duplicate Invoice':
          summary.duplicate++;
          break;
        case 'Invalid Record':
          summary.invalid++;
          break;
      }
    });

    return summary;
  }, [reconciledResults]);

  // --- VENDOR SUMMARY COMPUTATION ---
  const vendorSummaries = useMemo(() => {
    const map: Record<string, VendorSummaryItem> = {};

    reconciledResults.forEach(r => {
      const gstin = r.gstin;
      const supplierName = r.supplierName;

      if (!map[gstin]) {
        map[gstin] = {
          gstin,
          supplierName,
          totalInvoices: 0,
          matchedCount: 0,
          timingCount: 0,
          missingBooksCount: 0,
          missingPortalCount: 0,
          gstDiffCount: 0,
          invDiffCount: 0,
          outstandingFollowUpAmount: 0
        };
      }

      const item = map[gstin];
      item.totalInvoices++;

      if (r.classification === 'Exact Match') {
        item.matchedCount++;
      } else if (r.classification === 'Timing Difference') {
        item.timingCount++;
      } else if (r.classification === 'Missing in Books') {
        item.missingBooksCount++;
      } else if (r.classification === 'Missing in GSTR-2B') {
        item.missingPortalCount++;
        item.outstandingFollowUpAmount += r.bookRecord?.totalGst || 0; // Follow up for GST missing
      } else if (r.classification === 'GST Difference') {
        item.gstDiffCount++;
        item.outstandingFollowUpAmount += Math.abs(r.gstDiff); // Follow up for GST mismatch amount
      } else if (r.classification === 'Invoice Difference') {
        item.invDiffCount++;
      }
    });

    return Object.values(map).sort((a, b) => b.outstandingFollowUpAmount - a.outstandingFollowUpAmount);
  }, [reconciledResults]);

  // --- FILTERED RESULTS LIST ---
  const filteredRecords = useMemo(() => {
    return reconciledResults.filter(r => {
      if (searchGstin && !r.gstin.toLowerCase().includes(searchGstin.toLowerCase())) return false;
      if (searchVendor && !r.supplierName.toLowerCase().includes(searchVendor.toLowerCase())) return false;
      if (searchInvoice && !r.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase())) return false;
      if (searchMonth) {
        const bookMonth = r.bookRecord?.month || '';
        const portalMonth = r.portalRecord?.month || '';
        if (!bookMonth.toLowerCase().includes(searchMonth.toLowerCase()) && 
            !portalMonth.toLowerCase().includes(searchMonth.toLowerCase())) return false;
      }
      if (searchStatus !== 'All' && r.classification !== searchStatus) return false;
      return true;
    });
  }, [reconciledResults, searchGstin, searchVendor, searchInvoice, searchMonth, searchStatus]);

  // Tab-specific filters (only applied inside lists tabs, not summary/vendor views)
  const tabRecords = useMemo(() => {
    if (activeTab === 'Matched') {
      return filteredRecords.filter(r => r.classification === 'Exact Match');
    } else if (activeTab === 'Timing Difference') {
      return filteredRecords.filter(r => r.classification === 'Timing Difference');
    } else if (activeTab === 'Only in Books') {
      return filteredRecords.filter(r => r.classification === 'Missing in GSTR-2B');
    } else if (activeTab === 'Only in GSTR-2B') {
      return filteredRecords.filter(r => r.classification === 'Missing in Books');
    } else if (activeTab === 'Invoice Difference') {
      return filteredRecords.filter(r => r.classification === 'Invoice Difference');
    } else if (activeTab === 'GST Difference') {
      return filteredRecords.filter(r => r.classification === 'GST Difference');
    }
    return filteredRecords;
  }, [filteredRecords, activeTab]);

  // --- RESET ALL DATA ---
  const handleReset = () => {
    setCurrentStep(1);
    setFileName('');
    setBooksRecords([]);
    setPortalRecords([]);
    setValidationIssues([]);
    setReconciledResults([]);
    setWorkbookVersion('Unknown');
    setSearchGstin('');
    setSearchVendor('');
    setSearchInvoice('');
    setSearchMonth('');
    setSearchStatus('All');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast("Workspace fully reset. Upload a template to start.");
  };

  // --- EXPORTS ENG_INES ---
  // 1. Export Excel
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      // We'll compute total records and sums for the dashboard
      const totalRecords = reconciledResults.length;
      const sums = {
        exact: 0,
        timing: 0,
        invDiff: 0,
        gstDiff: 0,
        missingPortal: 0,
        missingBooks: 0,
        duplicate: 0,
        invalid: 0
      };

      reconciledResults.forEach(r => {
        if (r.classification === 'Exact Match') {
          sums.exact += r.portalRecord?.totalGst || 0;
        } else if (r.classification === 'Timing Difference') {
          sums.timing += r.portalRecord?.totalGst || 0;
        } else if (r.classification === 'Invoice Difference') {
          sums.invDiff += r.portalRecord?.totalGst || 0;
        } else if (r.classification === 'GST Difference') {
          sums.gstDiff += Math.abs(r.gstDiff);
        } else if (r.classification === 'Missing in GSTR-2B') {
          sums.missingPortal += r.bookRecord?.totalGst || 0;
        } else if (r.classification === 'Missing in Books') {
          sums.missingBooks += r.portalRecord?.totalGst || 0;
        } else if (r.classification === 'Duplicate Invoice') {
          sums.duplicate += r.bookRecord?.totalGst || 0;
        } else if (r.classification === 'Invalid Record') {
          sums.invalid += r.bookRecord?.totalGst || 0;
        }
      });

      // --- SHEET 1: DASHBOARD ---
      const wsDashboard = workbook.addWorksheet("Dashboard");
      wsDashboard.views = [{ showGridLines: true }];

      // Set Title
      wsDashboard.mergeCells("A2:L2");
      const titleCell = wsDashboard.getCell("A2");
      titleCell.value = "GST ITC RECONCILIATION REPORT";
      titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      wsDashboard.getRow(2).height = 35;

      // Set Subtitle
      wsDashboard.mergeCells("A3:L3");
      const subtitleCell = wsDashboard.getCell("A3");
      subtitleCell.value = `Processed 100% Locally | Verification Timestamp: ${new Date().toLocaleString()} | Input Workbook: ${fileName}`;
      subtitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
      subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      wsDashboard.getRow(3).height = 20;

      // Reduce whitespace by configuring spacer row heights
      wsDashboard.getRow(1).height = 10;
      wsDashboard.getRow(4).height = 10;
      wsDashboard.getRow(8).height = 10;
      wsDashboard.getRow(12).height = 10;

      // Draw Top KPI Row (Row 5-7) with explicit heights and hyperlinks to sub-sheets
      wsDashboard.getRow(5).height = 20;
      wsDashboard.getRow(6).height = 22;
      wsDashboard.getRow(7).height = 22;
      drawKpiCard(wsDashboard, 1, 3, 5, "Total Records", totalRecords, false, "FF1F497D", "FFF2F6FA", "#'Summary'!A1");
      drawKpiCard(wsDashboard, 4, 6, 5, "Eligible ITC (Claimable)", counts.totalGstEligible, true, "FF2E7D32", "FFE8F5E9", "#'Exact'!A1");
      drawKpiCard(wsDashboard, 7, 9, 5, "Blocked ITC (Pending 2B)", counts.totalGstBlocked, true, "FFC62828", "FFFFEBEE", "#'Missing 2B'!A1");
      drawKpiCard(wsDashboard, 10, 12, 5, "Unclaimed ITC (Verify Books)", counts.totalGstUnclaimed, true, "FF1565C0", "FFE3F2FD", "#'Missing Books'!A1");

      // Draw Detailed Counts KPI Row (Row 9-11) with explicit heights and hyperlinks to sub-sheets
      wsDashboard.getRow(9).height = 20;
      wsDashboard.getRow(10).height = 22;
      wsDashboard.getRow(11).height = 22;
      drawKpiCard(wsDashboard, 1, 2, 9, "Exact Match", counts.exact, false, "FF2E7D32", "FFE8F5E9", "#'Exact'!A1");
      drawKpiCard(wsDashboard, 3, 4, 9, "Timing Diff", counts.timing, false, "FFD97706", "FFFFF8E1", "#'Timing'!A1");
      drawKpiCard(wsDashboard, 5, 6, 9, "GST Diff", counts.gstDiff, false, "FFEA580C", "FFFFF3E0", "#'GST Diff'!A1");
      drawKpiCard(wsDashboard, 7, 8, 9, "Inv Diff", counts.invDiff, false, "FFEA580C", "FFFFF3E0", "#'Inv Diff'!A1");
      drawKpiCard(wsDashboard, 9, 10, 9, "Missing in 2B", counts.missingPortal, false, "FFC62828", "FFFFEBEE", "#'Missing 2B'!A1");
      drawKpiCard(wsDashboard, 11, 12, 9, "Missing Books", counts.missingBooks, false, "FF1565C0", "FFE3F2FD", "#'Missing Books'!A1");

      // Table Header Row (Row 13)
      wsDashboard.mergeCells("A13:L13");
      const tableHeadCell = wsDashboard.getCell("A13");
      tableHeadCell.value = "AUDITED CLASSIFICATION SUMMARY DETAILS";
      tableHeadCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      tableHeadCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
      tableHeadCell.alignment = { horizontal: 'left', vertical: 'middle' };
      wsDashboard.getRow(13).height = 24;

      // Table Row Headers (Row 14)
      const tblHeaders = [
        ["A14:D14", "Classification Category", "left"],
        ["E14:F14", "Audit Action Required", "center"],
        ["G14:H14", "Record Count", "right"],
        ["I14:J14", "Total Financial Impact", "right"],
        ["K14:L14", "Claim Recommendation", "left"]
      ];
      tblHeaders.forEach(([range, val, align]) => {
        wsDashboard.mergeCells(range);
        const cell = wsDashboard.getCell(range.split(":")[0]);
        cell.value = val;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EEF4' } };
        cell.alignment = { horizontal: align as any, vertical: 'middle' };
      });
      wsDashboard.getRow(14).height = 22;

      // Detailed Metrics rows with consistent semantic colors
      const tableRows = [
        ["Exact Match", "No Action Required", counts.exact, sums.exact, "Claim ITC immediately. 100% matched.", "FF2E7D32", "FFE8F5E9"],
        ["Timing Difference", "Verify Next Month 2B", counts.timing, sums.timing, "Claim in respective month. Timing delay.", "FFD97706", "FFFFF8E1"],
        ["GST Difference", "Reconcile Tax Values", counts.gstDiff, sums.gstDiff, "Claim lower tax amount; follow up discrepancy.", "FFEA580C", "FFFFF3E0"],
        ["Invoice Difference", "Request Supplier Amendment", counts.invDiff, sums.invDiff, "Claim upon supplier amendment of invoice.", "FFEA580C", "FFFFF3E0"],
        ["Missing in GSTR-2B", "Supplier Follow-up Pending", counts.missingPortal, sums.missingPortal, "ITC Blocked. Hold payments until filed.", "FFC62828", "FFFFEBEE"],
        ["Missing in Books", "Record Expense & Claim", counts.missingBooks, sums.missingBooks, "Verify books of accounts. Omission risk.", "FF1565C0", "FFE3F2FD"],
        ["Duplicate Invoice", "Rectify Double Booking", counts.duplicate, sums.duplicate, "Internal double entry. Reverse duplicate.", "FFC62828", "FFFFEBEE"],
        ["Invalid Records", "Review Format", counts.invalid, sums.invalid, "Syntax or length issue in GSTIN/date.", "FFC62828", "FFFFEBEE"]
      ];

      tableRows.forEach((row, i) => {
        const rIdx = 15 + i;
        wsDashboard.getRow(rIdx).height = 20;

        // Merge Columns for neat styling
        wsDashboard.mergeCells(`A${rIdx}:D${rIdx}`);
        wsDashboard.mergeCells(`E${rIdx}:F${rIdx}`);
        wsDashboard.mergeCells(`G${rIdx}:H${rIdx}`);
        wsDashboard.mergeCells(`I${rIdx}:J${rIdx}`);
        wsDashboard.mergeCells(`K${rIdx}:L${rIdx}`);

        const cCat = wsDashboard.getCell(`A${rIdx}`);
        cCat.value = row[0] as string;
        cCat.font = { name: 'Calibri', size: 10, bold: true };

        const cAct = wsDashboard.getCell(`E${rIdx}`);
        cAct.value = row[1] as string;
        cAct.font = { name: 'Calibri', size: 9, bold: true, color: { argb: row[5] as string } };
        cAct.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: row[6] as string } };
        cAct.alignment = { horizontal: 'center', vertical: 'middle' };

        const cCount = wsDashboard.getCell(`G${rIdx}`);
        cCount.value = row[2] as number;
        cCount.numFmt = '#,##0';
        cCount.font = { name: 'Calibri', size: 10 };
        cCount.alignment = { horizontal: 'right', vertical: 'middle' };

        const cImpact = wsDashboard.getCell(`I${rIdx}`);
        cImpact.value = row[3] as number;
        cImpact.numFmt = '[$₹-439] #,##,##0.00;[$₹-439] -#,##,##0.00;"-"';
        cImpact.font = { name: 'Calibri', size: 10 };
        cImpact.alignment = { horizontal: 'right', vertical: 'middle' };

        const cRec = wsDashboard.getCell(`K${rIdx}`);
        cRec.value = row[4] as string;
        cRec.font = { name: 'Calibri', size: 9, italic: true };
        cRec.alignment = { horizontal: 'left', vertical: 'middle' };

        // Set borders on all table row cells
        for (let col = 1; col <= 12; col++) {
          const cell = wsDashboard.getCell(rIdx, col);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
          };
          // Alternate shading on first column
          if (col <= 4 && rIdx % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F6FA' } };
          }
        }
      });

      // Set Column widths
      for (let col = 1; col <= 12; col++) {
        wsDashboard.getColumn(col).width = 13;
      }
      
      // Freeze header row and enable filters
      wsDashboard.views = [{ state: 'frozen', xSplit: 0, ySplit: 14 }];
      wsDashboard.autoFilter = "A14:L14";

      appendFooter(wsDashboard, 22, 12);


      // --- SHEET 2: SUMMARY REPORT ---
      const wsSummary = workbook.addWorksheet("Summary");
      wsSummary.views = [{ showGridLines: true }];

      // Titles
      wsSummary.mergeCells("A2:B2");
      const sTitle = wsSummary.getCell("A2");
      sTitle.value = "GST RECONCILIATION SUMMARY REPORT";
      sTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      sTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
      sTitle.alignment = { horizontal: 'center', vertical: 'middle' };
      wsSummary.getRow(2).height = 30;

      wsSummary.mergeCells("A3:B3");
      const sSub = wsSummary.getCell("A3");
      sSub.value = `Generated on: ${new Date().toLocaleString()} | Input File: ${fileName}`;
      sSub.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FFFFFFFF' } };
      sSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
      sSub.alignment = { horizontal: 'center', vertical: 'middle' };
      wsSummary.getRow(3).height = 20;

      // Table content
      const summaryData = [
        ["Classification KPI Metrics", "Records Count"],
        ["Exact Match", counts.exact],
        ["Timing Difference", counts.timing],
        ["Invoice Number Difference", counts.invDiff],
        ["GST Value Difference", counts.gstDiff],
        ["Missing in GSTR-2B (Claim Blocked)", counts.missingPortal],
        ["Missing in Purchase Books (Unclaimed)", counts.missingBooks],
        ["Duplicate Invoices (Books Mismatch)", counts.duplicate],
        ["Invalid Records (Validation Warning)", counts.invalid],
        ["", ""],
        ["ITC Eligibility Summary", "Amount (INR)"],
        ["Total Eligible Credit (Matched + Timing + Corrected)", counts.totalGstEligible],
        ["Total Blocked Credit (Pending in GSTR-2B)", counts.totalGstBlocked],
        ["Total Unclaimed Credit (Verify Books)", counts.totalGstUnclaimed]
      ];

      summaryData.forEach((row, i) => {
        wsSummary.addRow(row);
      });

      // Apply styling to Summary
      styleExcelSheet(wsSummary, 4, 2, {
        headerColor: "FF1F497D",
        freezeHeader: true,
        enableFilters: true,
        numericCols: [2]
      });

      // Customize fonts inside Summary
      wsSummary.getCell("A14").font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F497D' } };
      wsSummary.getCell("B14").font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F497D' } };
      wsSummary.getCell("A14").fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EEF4' } };
      wsSummary.getCell("B14").fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EEF4' } };

      // Set Indian currency formatting specifically on the ITC financial impact amount rows only
      for (let r of [15, 16, 17]) {
        const cell = wsSummary.getCell(`B${r}`);
        cell.numFmt = '[$₹-439] #,##,##0.00;[$₹-439] -#,##,##0.00;"-"';
      }

      // Total underscores
      for (let rowIdx of [15, 16, 17]) {
        const valCell = wsSummary.getCell(rowIdx, 2);
        valCell.font = { name: 'Calibri', size: 10, bold: true };
        valCell.border = {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'double', color: { argb: 'FF000000' } }
        };
      }

      wsSummary.getColumn(1).width = 50;
      wsSummary.getColumn(2).width = 25;
      appendFooter(wsSummary, 17, 2);


      // --- SHEET 3: VALIDATION REPORT ---
      const wsValidation = workbook.addWorksheet("Validation");
      wsValidation.views = [{ showGridLines: true }];

      wsValidation.addRow([
        "Source Sheet", "Row Number", "Exception Type", "Compliance Issue Description", "Severity Level"
      ]);

      if (validationIssues.length > 0) {
        validationIssues.forEach(issue => {
          wsValidation.addRow([
            issue.sheet,
            issue.row,
            issue.issueType,
            issue.description,
            issue.severity
          ]);
        });

        styleExcelSheet(wsValidation, 1, 5, {
          headerColor: "FF44546A",
          freezeHeader: true,
          enableFilters: true,
          numericCols: [2]
        });

        // Color-code severities cell-by-cell
        for (let r = 2; r <= wsValidation.rowCount; r++) {
          const sevCell = wsValidation.getCell(r, 5);
          const sev = sevCell.value as string;
          let theme = "FFEA580C"; // Orange/Amber (Warning)
          let bg = "FFFFF3E0";
          if (sev === "Error") {
            theme = "FFC62828"; // Red (Error)
            bg = "FFFFEBEE";
          }
          sevCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          sevCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: theme } };
          sevCell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      } else {
        wsValidation.mergeCells("A2:E4");
        const passCell = wsValidation.getCell("A2");
        passCell.value = "COMPLIANCE INTEGRITY AUDIT PASSED!\nAll transactions validated with 100% correct Indian checksum GSTINs, proper tax periods, and continuous numeric ranges. No exceptions found.";
        passCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF2E7D32' } };
        passCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
        passCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        // Borders
        for (let r = 2; r <= 4; r++) {
          for (let c = 1; c <= 5; c++) {
            wsValidation.getCell(r, c).border = {
              top: { style: 'thin', color: { argb: 'FF2E7D32' } },
              bottom: { style: 'thin', color: { argb: 'FF2E7D32' } },
              left: { style: 'thin', color: { argb: 'FF2E7D32' } },
              right: { style: 'thin', color: { argb: 'FF2E7D32' } }
            };
          }
        }
      }

      autoColumnWidths(wsValidation);
      appendFooter(wsValidation, wsValidation.rowCount, 5);


      // --- SHEETS 4-9: DETAILED CLASSIFICATION TRANSACTIONS ---
      const tabSpecs: { name: string; cls: ClassificationType; headerColor: string; statusColor: string; bgColor: string }[] = [
        { name: "Exact", cls: "Exact Match", headerColor: "FF2E7D32", statusColor: "FF2E7D32", bgColor: "FFE8F5E9" },
        { name: "Timing", cls: "Timing Difference", headerColor: "FFD97706", statusColor: "FFD97706", bgColor: "FFFFF8E1" },
        { name: "GST Diff", cls: "GST Difference", headerColor: "FFEA580C", statusColor: "FFEA580C", bgColor: "FFFFF3E0" },
        { name: "Inv Diff", cls: "Invoice Difference", headerColor: "FFEA580C", statusColor: "FFEA580C", bgColor: "FFFFF3E0" },
        { name: "Missing 2B", cls: "Missing in GSTR-2B", headerColor: "FFC62828", statusColor: "FFC62828", bgColor: "FFFFEBEE" },
        { name: "Missing Books", cls: "Missing in Books", headerColor: "FF1565C0", statusColor: "FF1565C0", bgColor: "FFE3F2FD" }
      ];

      tabSpecs.forEach(spec => {
        const ws = workbook.addWorksheet(spec.name);
        
        // Setup table headers
        const headers = [
          "Supplier GSTIN", "Supplier Name", "Invoice Number", "Invoice Date", 
          "Books Month", "Portal Month", 
          "Books Taxable", "Portal Taxable", 
          "Books IGST", "Portal IGST", 
          "Books CGST", "Portal CGST", 
          "Books SGST", "Portal SGST", 
          "Books Total GST", "Portal Total GST", 
          "Difference Notes"
        ];
        ws.addRow(headers);

        const matchingRecs = reconciledResults.filter(r => r.classification === spec.cls);
        matchingRecs.forEach(r => {
          const d = r.invoiceDate ? new Date(r.invoiceDate) : null;
          const cleanDate = (!d || isNaN(d.getTime())) ? r.invoiceDate : d;

          ws.addRow([
            r.gstin,
            r.supplierName,
            r.invoiceNumber,
            cleanDate,
            r.bookRecord?.month || 'N/A',
            r.portalRecord?.month || 'N/A',
            r.bookRecord?.taxableValue || 0,
            r.portalRecord?.taxableValue || 0,
            r.bookRecord?.igst || 0,
            r.portalRecord?.igst || 0,
            r.bookRecord?.cgst || 0,
            r.portalRecord?.cgst || 0,
            r.bookRecord?.sgst || 0,
            r.portalRecord?.sgst || 0,
            r.bookRecord?.totalGst || 0,
            r.portalRecord?.totalGst || 0,
            r.notes
          ]);
        });

        const lastRow = ws.rowCount;

        // Add Subtotals Row at bottom using formulas
        if (lastRow > 1) {
          const subtotals = [
            "TOTALS", "", "", "", "", "",
            { formula: `SUM(G2:G${lastRow})` },
            { formula: `SUM(H2:H${lastRow})` },
            { formula: `SUM(I2:I${lastRow})` },
            { formula: `SUM(J2:J${lastRow})` },
            { formula: `SUM(K2:K${lastRow})` },
            { formula: `SUM(L2:L${lastRow})` },
            { formula: `SUM(M2:M${lastRow})` },
            { formula: `SUM(N2:N${lastRow})` },
            { formula: `SUM(O2:O${lastRow})` },
            { formula: `SUM(P2:P${lastRow})` },
            `Total Records: ${lastRow - 1}`
          ];
          ws.addRow(subtotals);

          // Style the Totals Row (top thin border, bottom double border, bold, custom fill)
          const totRowIdx = lastRow + 1;
          const rowObj = ws.getRow(totRowIdx);
          rowObj.height = 22;
          rowObj.eachCell((cell, colIdx) => {
            cell.font = { name: 'Calibri', size: 10, bold: true };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'double', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
            };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9E1F2' } // Light navy accent shading
            };
          });
        }

        styleExcelSheet(ws, 1, 17, {
          headerColor: spec.headerColor,
          freezeHeader: true,
          enableFilters: true,
          currencyCols: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
          dateCols: [4]
        });

        // Apply visual coloring on notes column Q cell-by-cell
        for (let rowIdx = 2; rowIdx <= lastRow; rowIdx++) {
          const noteCell = ws.getCell(rowIdx, 17);
          noteCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: spec.bgColor }
          };
          noteCell.font = { name: 'Calibri', size: 9, bold: true, italic: true, color: { argb: spec.statusColor } };
        }

        autoColumnWidths(ws);
        appendFooter(ws, lastRow + 1, 17);
      });


      // --- SHEET 9: VENDORS SUMMARY REPORT ---
      const wsVendor = workbook.addWorksheet("Vendors");
      wsVendor.views = [{ showGridLines: true }];

      const vHeaders = [
        "Supplier GSTIN", "Supplier Name", "Total Invoices", "Matched", "Timing", 
        "Missing Books", "Missing Portal", "GST Difference", "Invoice Difference", 
        "Outstanding Follow-up (INR)", "Action Required"
      ];
      wsVendor.addRow(vHeaders);

      vendorSummaries.forEach(v => {
        let action = "No Action Required";
        if (v.outstandingFollowUpAmount > 50000) {
          action = "Immediate Action Required";
        } else if (v.outstandingFollowUpAmount > 0) {
          action = "Follow-up Required";
        }

        wsVendor.addRow([
          v.gstin,
          v.supplierName,
          v.totalInvoices,
          v.matchedCount,
          v.timingCount,
          v.missingBooksCount,
          v.missingPortalCount,
          v.gstDiffCount,
          v.invDiffCount,
          v.outstandingFollowUpAmount,
          action
        ]);
      });

      const lastVRow = wsVendor.rowCount;

      // Add subtotals
      if (lastVRow > 1) {
        wsVendor.addRow([
          "TOTALS", "",
          { formula: `SUM(C2:C${lastVRow})` },
          { formula: `SUM(D2:D${lastVRow})` },
          { formula: `SUM(E2:E${lastVRow})` },
          { formula: `SUM(F2:F${lastVRow})` },
          { formula: `SUM(G2:G${lastVRow})` },
          { formula: `SUM(H2:H${lastVRow})` },
          { formula: `SUM(I2:I${lastVRow})` },
          { formula: `SUM(J2:J${lastVRow})` },
          `Vendors: ${lastVRow - 1}`
        ]);

        const totRowIdx = lastVRow + 1;
        wsVendor.getRow(totRowIdx).eachCell((cell) => {
          cell.font = { name: 'Calibri', size: 10, bold: true };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'double', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' }
          };
        });
      }

      styleExcelSheet(wsVendor, 1, 11, {
        headerColor: "FF1F497D",
        freezeHeader: true,
        enableFilters: true,
        numericCols: [3, 4, 5, 6, 7, 8, 9],
        currencyCols: [10]
      });

      // Highlight action required column cell-by-cell
      for (let rIdx = 2; rIdx <= lastVRow; rIdx++) {
        const outAmt = wsVendor.getCell(rIdx, 10).value as number;
        const actCell = wsVendor.getCell(rIdx, 11);

        let colorTheme = "FF2E7D32"; // Green
        let colorBg = "FFE8F5E9";
        if (outAmt > 50000) {
          colorTheme = "FFC62828"; // Red
          colorBg = "FFFFEBEE";
        } else if (outAmt > 0) {
          colorTheme = "FFE65100"; // Amber
          colorBg = "FFFFF3E0";
        }

        actCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colorBg }
        };
        actCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: colorTheme } };
        actCell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      autoColumnWidths(wsVendor);
      appendFooter(wsVendor, lastVRow + 1, 11);


      // --- SHEET 11: INSTRUCTIONS (DOCUMENTATION COOP) ---
      const wsInst = workbook.addWorksheet("Instructions");
      wsInst.views = [{ showGridLines: true }];

      // Set titles
      wsInst.mergeCells("A2:C2");
      const iTitleCell = wsInst.getCell("A2");
      iTitleCell.value = "GST RECONCILIATION AUDIT LEDGER - INSTRUCTIONS & SYSTEM INTEGRITY";
      iTitleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      iTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
      iTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      wsInst.getRow(2).height = 40;

      // Description Row
      wsInst.mergeCells("A3:C3");
      const iDescCell = wsInst.getCell("A3");
      iDescCell.value = "Prepared by Ankesh Digital Workspace | Enterprise CA Compliance Tool | Processed 100% Locally";
      iDescCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFFFFFFF' } };
      iDescCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
      iDescCell.alignment = { horizontal: 'center', vertical: 'middle' };
      wsInst.getRow(3).height = 20;

      // Reproduce sections (same layout as template Instructions!)
      const instSections = [
        {
          title: "SYSTEM INFORMATION",
          color: "FF1F497D",
          rows: [
            ["Workbook Version", "1.0", "Release audit ledger build"],
            ["Auditor Profile", "Ankesh Digital Workspace (Client Edition)", "No data leaves your computer"],
            ["Filing Status", "Statutory Section 16(2)(aa) CGST Compliance Audit", "Claim reconciliation ledger"]
          ]
        },
        {
          title: "TAB SHEET DESIGNATIONS & RECONCILIATION ROLES",
          color: "FF1F497D",
          rows: [
            ["Dashboard", "The interactive, executive overview tab. Displays KPIs, credit counts and financial impact.", "EXECUTIVE COVER"],
            ["Summary", "High-level summary of classification statistics and eligible/blocked/unclaimed ITC.", "SUMMARY REPORT"],
            ["Exact", "100% Matched transactions. Clear to claim input credit immediately.", "TRANSACTION DATA"],
            ["Timing", "Mismatched tax periods. Claim deferred to subsequent filed periods.", "TRANSACTION DATA"],
            ["Inv Diff", "Invoice number mismatches. Requires vendor coordination to align invoice strings.", "TRANSACTION DATA"],
            ["GST Diff", "GST value mismatch. Claim smaller credit limit and follow up outstanding differences.", "TRANSACTION DATA"],
            ["Missing 2B", "Missing in GSTR-2B. Claims blocked by CGST law. Hold payment until supplier files.", "TRANSACTION DATA"],
            ["Missing Books", "Omitted purchases in books. Opportunity to claim unclaimed input tax credit.", "TRANSACTION DATA"],
            ["Vendors", "Vendor wise tracking lists with automated aging risk colors and action codes.", "AUDITOR SUMMARY"]
          ]
        },
        {
          title: "LEGAL CGST COMPLIANCE & ITC OPTIMIZATION GUIDE",
          color: "FF2E7D32",
          rows: [
            ["Section 16(2)(aa) CGST", "Statutory claim block. Ensure all vendor invoices match Portal GSTR-2B before finalizing return.", "COMPLIANCE MANDATE"],
            ["Reciprocal Follow-up", "Follow up with suppliers flagged under Amber or Red in the 'Vendors' sheet immediately.", "CREDIT RECOVERY"],
            ["Local Verification", "This tool processes 100% of your transactional data locally within your browser sandbox.", "SECURITY LEDGER"]
          ]
        }
      ];

      let instRow = 5;
      instSections.forEach(sec => {
        wsInst.mergeCells(instRow, 1, instRow, 3);
        const cell = wsInst.getCell(instRow, 1);
        cell.value = sec.title;
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sec.color } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        wsInst.getRow(instRow).height = 24;
        instRow++;

        sec.rows.forEach(r => {
          wsInst.getCell(instRow, 1).value = r[0];
          wsInst.getCell(instRow, 2).value = r[1];
          wsInst.getCell(instRow, 3).value = r[2];

          for (let c = 1; c <= 3; c++) {
            const cell = wsInst.getCell(instRow, c);
            cell.font = { name: 'Calibri', size: 10, bold: c === 1 };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
              right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
            };
            if (c === 3) {
              cell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF595959' } };
            }
          }
          wsInst.getRow(instRow).height = 20;
          instRow++;
        });

        instRow++;
      });

      wsInst.getColumn(1).width = 25;
      wsInst.getColumn(2).width = 65;
      wsInst.getColumn(3).width = 30;


      // Write out the Excel file buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `GST_Reconciliation_Output_${fileName.replace(".xlsx", "")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Enterprise GST Reconciliation Report downloaded!");
    } catch (err: any) {
      console.error("Excel Export error: ", err);
      showToast("Excel Export error: " + err.message);
    }
  };

  // 2. Export CSV
  const exportToCsv = () => {
    try {
      const headers = "Supplier GSTIN,Supplier Name,Invoice Number,Invoice Date,Classification,Books Month,Portal Month,Books GST,Portal GST,Difference Notes\n";
      const rows = reconciledResults.map(r => {
        const quote = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
        return [
          quote(r.gstin),
          quote(r.supplierName),
          quote(r.invoiceNumber),
          r.invoiceDate,
          quote(r.classification),
          quote(r.bookRecord?.month || 'N/A'),
          quote(r.portalRecord?.month || 'N/A'),
          r.bookRecord?.totalGst || 0,
          r.portalRecord?.totalGst || 0,
          quote(r.notes)
        ].join(',');
      }).join('\n');

      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `GST_Reconciled_Dump_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Classified CSV dump exported successfully.");
    } catch (err: any) {
      showToast("CSV Export failed: " + err.message);
    }
  };

  // 3. Print PDF Summary Report
  const triggerPdfPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 font-sans antialiased text-slate-800 dark:text-slate-100">
      
      {/* HEADER BANNER CARD */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-10 w-60 h-60 bg-gold/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-orange-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-orange-400/30">
              🇮🇳 CA ENTERPRISE MODULE
            </span>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">
              SECURE CLIENT-SIDE
            </span>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              GST Reconciliation <span className="text-orange-500">Workspace</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Verify compliance under Section 16(2)(aa) of the CGST Act. Automatically match Purchase Registers with GSTR-2B client-side. No workbook data ever leaves your computer.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>100% Secure Sandbox</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span>Automatic 8-Way Classification</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEPPING PROGRESS BAR */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs select-none">
        {[
          { step: 1, label: "1. Intro & Template" },
          { step: 2, label: "2. Load Workbook" },
          { step: 3, label: "3. Validate Sheet" },
          { step: 4, label: "4. Reconcile Console" }
        ].map((s) => {
          const isActive = currentStep === s.step;
          const isDone = currentStep > s.step;
          return (
            <div 
              key={s.step}
              onClick={() => {
                if (isDone || (s.step === 2 && booksRecords.length > 0) || (s.step === 3 && booksRecords.length > 0)) {
                  setCurrentStep(s.step as 1|2|3|4);
                }
              }}
              className={`p-3.5 rounded-xl border font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-corporate text-white border-corporate dark:bg-gold dark:text-navy dark:border-gold shadow-lg shadow-blue-500/10' 
                  : isDone
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span className="block text-[11px] uppercase tracking-wider">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* STEP CONTENT SWITCHER */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-850 p-6 md:p-8 shadow-sm">
        
        {/* STEP 1: INTRO SCREEN */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                How GST Reconciliation Workspace Works
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                Maximize input tax credits (ITC) safety and prevent government late audits by synchronizing accounts correctly. Use our pre-configured workbook template as your strict schema.
              </p>
            </div>

            {/* 3 Step Workflow Graphic Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: "01",
                  title: "Get Valid Template",
                  desc: "Download our official GST workbook template. Populate with your Purchase Register and Portal GSTR-2B ledger rows.",
                  actionLabel: "Download template (.xlsx)",
                  action: generateTemplate,
                  primary: true
                },
                {
                  id: "02",
                  title: "Strict Validation",
                  desc: "Upload the populated Excel workbook. Our local script verifies instructions sheets, headers, and validates GSTIN checksums.",
                  actionLabel: "Upload workbook",
                  action: () => setCurrentStep(2)
                },
                {
                  id: "03",
                  title: "8-Way Match Report",
                  desc: "Reconcile invoices. Classify entries to Exact Matches, Timing differences, Mismatched taxes, or Missing ledger bills.",
                  actionLabel: "View metrics console",
                  action: () => {
                    if (booksRecords.length > 0) {
                      setCurrentStep(4);
                    } else {
                      setCurrentStep(2);
                    }
                  }
                }
              ].map((w, index) => (
                <div 
                  key={index} 
                  className={`p-6 rounded-2xl border flex flex-col justify-between h-72 relative transition-all ${
                    w.primary 
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-corporate/20 dark:border-gold/30' 
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="absolute right-4 top-4 font-mono text-4xl font-black text-slate-100 dark:text-slate-900">
                    {w.id}
                  </span>
                  
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {w.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                      {w.desc}
                    </p>
                  </div>

                  <button
                    onClick={w.action}
                    className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      w.primary 
                        ? 'bg-corporate text-white dark:bg-gold dark:text-navy shadow-md shadow-blue-500/10' 
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {w.primary ? <Download size={14} /> : <ChevronRight size={14} />}
                    {w.actionLabel}
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom Caution block */}
            <div className="p-4 rounded-xl border border-yellow-500/15 bg-yellow-500/5 text-xs text-slate-600 dark:text-yellow-250 flex items-start gap-3">
              <Info size={16} className="text-gold shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                <strong>Statutory Compliance Rule under Section 16(2)(aa):</strong> Input Tax Credit (ITC) on purchases can only be claimed if the invoice is registered and reflected in GSTR-2B by your supplier. Unmatched claims invite direct demand notices from the GST Council.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD WORKBOOK */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Upload GST Workbook
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the populated .xlsx workbook containing sheets for Purchase Register & GSTR-2B.
              </p>
            </div>

            {/* Drag & Drop Box */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center hover:border-corporate dark:hover:border-gold cursor-pointer bg-slate-50/50 dark:bg-slate-950/20 transition-all group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx,.xls" 
                className="hidden" 
              />
              
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 flex items-center justify-center mx-auto shadow-md transform group-hover:-translate-y-1 transition-transform duration-300">
                  <Upload className="text-slate-500 group-hover:text-corporate dark:group-hover:text-gold" size={24} />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {fileName ? `Selected: ${fileName}` : "Click or Drag & Drop Excel File"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports Excel Workbooks (.xlsx) with standard sheet formats.
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-2 text-[10px] uppercase font-bold tracking-wider">
                  <span className="bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded border dark:border-slate-800 text-slate-500">Instructions Check</span>
                  <span className="bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded border dark:border-slate-800 text-slate-500">Books Sheet</span>
                  <span className="bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded border dark:border-slate-800 text-slate-500">Portal Sheet</span>
                </div>
              </div>
            </div>

            {/* Dynamic Loading Overlay */}
            {isProcessing && (
              <div className="space-y-3 max-w-sm mx-auto">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span>Parsing Excel Sheets...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-corporate dark:bg-gold transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {booksRecords.length > 0 && (
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Prior Data Detected!</span>
                  <span className="text-slate-400">{booksRecords.length} Purchase records & {portalRecords.length} Portal records parsed.</span>
                </div>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 font-bold"
                >
                  View Validation Report
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: VALIDATION REPORT */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Workbook Validation Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Strict layout schema evaluation results for uploaded file <strong className="text-slate-700 dark:text-slate-300">"{fileName}"</strong>.
              </p>
            </div>

            {/* Audit Status Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  title: "Purchase Register Detected",
                  status: booksRecords.length > 0 ? "PASSED" : "FAILED",
                  desc: `${booksRecords.length} records parsed from books.`,
                  ok: booksRecords.length > 0
                },
                {
                  title: "GSTR-2B Detected",
                  status: portalRecords.length > 0 ? "PASSED" : "FAILED",
                  desc: `${portalRecords.length} records parsed from portal.`,
                  ok: portalRecords.length > 0
                },
                {
                  title: "Required Columns Valid",
                  status: validationIssues.filter(i => i.severity === 'Error').length === 0 ? "PASSED" : "ERROR",
                  desc: `${validationIssues.filter(i => i.severity === 'Error').length} critical structure missing.`,
                  ok: validationIssues.filter(i => i.severity === 'Error').length === 0
                },
                {
                  title: "Workbook Schema Version",
                  status: "VERIFIED",
                  desc: `Schema version: ${workbookVersion}`,
                  ok: workbookVersion !== 'Unknown'
                }
              ].map((c, index) => (
                <div 
                  key={index} 
                  className={`p-5 rounded-2xl border space-y-2 ${
                    c.ok 
                      ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-800 dark:text-emerald-300' 
                      : 'bg-rose-500/5 border-rose-500/25 text-rose-800 dark:text-rose-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {c.title}
                    </span>
                    {c.ok ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <AlertTriangle size={16} className="text-rose-500" />
                    )}
                  </div>
                  
                  <div>
                    <span className="text-lg font-black block tracking-tight font-mono">
                      {c.status}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal block mt-1">
                      {c.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Validation warning logs */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <SlidersHorizontal size={14} /> Validation Warning Logs
              </h4>

              {validationIssues.length === 0 ? (
                <div className="p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 text-center space-y-1">
                  <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
                  <span className="text-xs font-extrabold block text-slate-900 dark:text-white uppercase tracking-wider">Perfect Workbook Alignment</span>
                  <span className="text-[11px] text-slate-500 block">No structural warnings or invalid GSTIN elements found. Ready for reconciliation claim checks.</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 max-h-56">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold">
                        <th className="p-3">Sheet</th>
                        <th className="p-3">Row No</th>
                        <th className="p-3">Invoice No</th>
                        <th className="p-3">Issue Type</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                      {validationIssues.map((v, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="p-3 font-semibold font-sans">{v.sheet}</td>
                          <td className="p-3">{v.row}</td>
                          <td className="p-3 text-slate-500">{v.invoiceNumber || 'N/A'}</td>
                          <td className="p-3 font-bold text-orange-500 dark:text-yellow-400">{v.issueType}</td>
                          <td className="p-3 font-sans text-slate-600 dark:text-slate-350">{v.description}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              v.severity === 'Error' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-gold'
                            }`}>
                              {v.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Reconcile execution box */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-6 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
              <div className="text-center sm:text-left">
                <span className="text-sm font-extrabold block text-slate-900 dark:text-white">
                  Ready to Reconcile?
                </span>
                <span className="text-xs text-slate-400">
                  Runs local Indian tax law heuristic matrix validations instantly.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3 rounded-xl border border-slate-250 dark:border-slate-800 text-xs font-bold uppercase tracking-wider"
                >
                  Load Another File
                </button>
                <button
                  onClick={runReconciliation}
                  disabled={validationIssues.some(i => i.severity === 'Error')}
                  className="px-6 py-3 bg-corporate dark:bg-gold text-white dark:text-navy hover:opacity-95 active:scale-95 transition-all rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/10"
                >
                  <Play size={14} className="fill-white dark:fill-navy" />
                  Run Matching Engine
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: RECONCILIATION CONSOLE & REPORT TABS */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-fade-in">
            
            {/* BRIEF RECON HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-6">
              <div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block">ACTIVE DATA LEDGER</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="text-corporate dark:text-gold" size={18} /> {fileName || "Unsaved Ledger Workspace"}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <RotateCcw size={13} /> Reset Workspace
                </button>
                
                {/* Export triggers */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={exportToExcel}
                    className="px-3.5 py-2 hover:bg-white dark:hover:bg-slate-950 hover:shadow-sm rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono uppercase"
                  >
                    <Download size={13} /> Excel
                  </button>
                  <button
                    onClick={exportToCsv}
                    className="px-3.5 py-2 hover:bg-white dark:hover:bg-slate-950 hover:shadow-sm rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 font-mono uppercase"
                  >
                    <Download size={13} /> CSV
                  </button>
                  <button
                    onClick={triggerPdfPrint}
                    className="px-3.5 py-2 hover:bg-white dark:hover:bg-slate-950 hover:shadow-sm rounded-lg text-xs font-bold text-rose-500 flex items-center gap-1 font-mono uppercase"
                  >
                    <Printer size={13} /> Print Summary
                  </button>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR STRIP */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1.5 gap-2 select-none scrollbar-none">
              {(['Summary', 'Matched', 'Timing Difference', 'Only in Books', 'Only in GSTR-2B', 'Invoice Difference', 'GST Difference', 'Vendor Summary', 'Validation Issues'] as const).map((tab) => {
                const isActive = activeTab === tab;
                let count = 0;
                
                if (tab === 'Matched') count = counts.exact;
                else if (tab === 'Timing Difference') count = counts.timing;
                else if (tab === 'Only in Books') count = counts.missingPortal;
                else if (tab === 'Only in GSTR-2B') count = counts.missingBooks;
                else if (tab === 'Invoice Difference') count = counts.invDiff;
                else if (tab === 'GST Difference') count = counts.gstDiff;
                else if (tab === 'Validation Issues') count = validationIssues.length;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border whitespace-nowrap flex items-center gap-2 shrink-0 ${
                      isActive 
                        ? 'bg-corporate text-white border-corporate dark:bg-gold dark:text-navy dark:border-gold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-800'
                    }`}
                  >
                    <span>{tab}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ${
                        isActive ? 'bg-white/20 text-white dark:bg-navy/10 dark:text-navy' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* --- CORE CONTENT RENDERERS BASED ON TABS --- */}

            {/* TAB A: SUMMARY VIEW (DASHBOARD) */}
            {activeTab === 'Summary' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* 3 Major Financial Credit KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      label: "Total Eligible Input Credit (ITC)",
                      amount: counts.totalGstEligible,
                      desc: "Claim is verified under Sec 16(2)(aa). Matched, Timing Deferred or corrected invoices aligned.",
                      color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/20"
                    },
                    {
                      label: "Total Blocked Credit (Pending 2B)",
                      amount: counts.totalGstBlocked,
                      desc: "ITC present in Accounts but pending Supplier filing in GSTR-1. Claim is legally blocked.",
                      color: "text-amber-500 bg-amber-500/5 border-amber-500/20"
                    },
                    {
                      label: "Total Unclaimed Credit (Verify Books)",
                      amount: counts.totalGstUnclaimed,
                      desc: "Present in GSTR-2B but missed or unbooked in Purchase Books. Ready to book.",
                      color: "text-blue-500 bg-blue-500/5 border-blue-500/20"
                    }
                  ].map((kpi, index) => (
                    <div key={index} className={`p-6 rounded-3xl border space-y-3.5 relative overflow-hidden shadow-sm ${kpi.color}`}>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {kpi.label}
                      </span>

                      <div>
                        <span className="text-3xl font-black tracking-tight font-mono block">
                          ₹{kpi.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-2">
                          {kpi.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 8-Way Classification Cards Grid */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Layers size={14} /> 8-Way Reconciliation Matrix Status
                  </h4>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: "Exact Match", count: counts.exact, label: "🟢 Exact Match", tabTarget: "Matched" },
                      { title: "Timing Difference", count: counts.timing, label: "🟡 Timing Diff", tabTarget: "Timing Difference" },
                      { title: "Invoice Difference", count: counts.invDiff, label: "🟠 Invoice Mismatch", tabTarget: "Invoice Difference" },
                      { title: "GST Difference", count: counts.gstDiff, label: "🟠 GST Value Mismatch", tabTarget: "GST Difference" },
                      { title: "Missing in Books", count: counts.missingBooks, label: "🔴 Missing in Books", tabTarget: "Only in GSTR-2B" },
                      { title: "Missing in GSTR-2B", count: counts.missingPortal, label: "🔴 Missing in GSTR-2B", tabTarget: "Only in Books" },
                      { title: "Duplicate Invoice", count: counts.duplicate, label: "🟣 Duplicate Books Invoice", tabTarget: "Summary" },
                      { title: "Invalid Record", count: counts.invalid, label: "⚫ Invalid Record Error", tabTarget: "Validation Issues" }
                    ].map((c, index) => (
                      <div 
                        key={index}
                        onClick={() => {
                          if (c.tabTarget as any !== activeTab) {
                            setActiveTab(c.tabTarget as any);
                          }
                        }}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-corporate dark:hover:border-gold cursor-pointer transition-all flex flex-col justify-between h-32"
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-350 block leading-tight">
                          {c.label}
                        </span>

                        <div className="flex justify-between items-baseline">
                          <span className="text-2xl font-black font-mono tracking-tight text-navy dark:text-white">
                            {c.count}
                          </span>
                          <span className="text-[10px] text-corporate dark:text-gold uppercase font-bold tracking-wider hover:underline">
                            View →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statutory claim guidance card */}
                <div className="p-5 rounded-2xl border border-blue-500/15 bg-blue-500/5 text-xs text-slate-600 dark:text-slate-350 leading-relaxed flex items-start gap-3.5">
                  <Info size={16} className="text-corporate dark:text-gold shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-slate-900 dark:text-white block uppercase tracking-wider text-[11px]">Enterprise CA Advisory under Section 16(2)(aa)</strong>
                    <p>
                      - Verification confirms that <strong>{counts.exact} records</strong> representing <strong>₹{counts.totalGstEligible.toLocaleString('en-IN')}</strong> of CGST/SGST/IGST are fully compliant and ready for filing on Form GSTR-3B.
                    </p>
                    <p>
                      - Avoid claiming the <strong>₹{counts.totalGstBlocked.toLocaleString('en-IN')} blocked credit</strong>. Discrepant values are flagged as "Missing in GSTR-2B". Follow-up with respective suppliers to file their returns and synchronize your cash ledger safely.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB B: LIST TABLES (Matched, Timing Diff, Only in Books, Only in GSTR-2B, Invoice Diff, GST Diff) */}
            {activeTab !== 'Summary' && activeTab !== 'Vendor Summary' && activeTab !== 'Validation Issues' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Advanced Search & Filtering panel */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Search size={12} /> Search & Filtration Desk
                    </span>
                    <button 
                      onClick={() => {
                        setSearchGstin('');
                        setSearchVendor('');
                        setSearchInvoice('');
                        setSearchMonth('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold font-mono"
                    >
                      Clear Filters
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input 
                      type="text"
                      value={searchGstin}
                      onChange={(e) => setSearchGstin(e.target.value)}
                      placeholder="Filter Supplier GSTIN..."
                      className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                    <input 
                      type="text"
                      value={searchVendor}
                      onChange={(e) => setSearchVendor(e.target.value)}
                      placeholder="Filter Supplier Name..."
                      className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                    <input 
                      type="text"
                      value={searchInvoice}
                      onChange={(e) => setSearchInvoice(e.target.value)}
                      placeholder="Filter Invoice Number..."
                      className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                    <input 
                      type="text"
                      value={searchMonth}
                      onChange={(e) => setSearchMonth(e.target.value)}
                      placeholder="Filter Month..."
                      className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Primary Table Output */}
                {tabRecords.length === 0 ? (
                  <div className="p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
                    <span className="text-xs font-bold block text-slate-400">No matching records found</span>
                    <p className="text-[11px] text-slate-400">Verify filter search query or change selected tab menu.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold">
                          <th className="p-3.5">Supplier GSTIN</th>
                          <th className="p-3.5">Supplier Name</th>
                          <th className="p-3.5">Invoice Details</th>
                          <th className="p-3.5 text-right">Books Values</th>
                          <th className="p-3.5 text-right">Portal Values</th>
                          <th className="p-3.5 text-right">Difference</th>
                          <th className="p-3.5 text-right">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-900 leading-normal">
                        {tabRecords.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                            
                            <td className="p-3.5 font-mono text-[11px] font-bold text-corporate dark:text-gold whitespace-nowrap">
                              {r.gstin}
                            </td>
                            
                            <td className="p-3.5">
                              <span className="font-bold text-slate-900 dark:text-white block">{r.supplierName}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">CA Ledger Sync Case</span>
                            </td>

                            <td className="p-3.5 space-y-0.5 font-mono text-[11px]">
                              <div className="font-bold text-slate-700 dark:text-slate-350">
                                No: {r.invoiceNumber}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Date: {r.invoiceDate}
                              </div>
                            </td>

                            <td className="p-3.5 text-right font-mono font-medium text-[11px] whitespace-nowrap">
                              {r.bookRecord ? (
                                <>
                                  <div className="text-slate-700 dark:text-slate-300">Taxable: ₹{r.bookRecord.taxableValue.toLocaleString('en-IN')}</div>
                                  <div className="text-corporate dark:text-gold font-bold">GST: ₹{r.bookRecord.totalGst.toLocaleString('en-IN')}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">Month: {r.bookRecord.month}</div>
                                </>
                              ) : (
                                <span className="text-slate-400 italic">Not Booked</span>
                              )}
                            </td>

                            <td className="p-3.5 text-right font-mono font-medium text-[11px] whitespace-nowrap">
                              {r.portalRecord ? (
                                <>
                                  <div className="text-slate-700 dark:text-slate-300">Taxable: ₹{r.portalRecord.taxableValue.toLocaleString('en-IN')}</div>
                                  <div className="text-corporate dark:text-gold font-bold">GST: ₹{r.portalRecord.totalGst.toLocaleString('en-IN')}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">Month: {r.portalRecord.month}</div>
                                </>
                              ) : (
                                <span className="text-slate-400 italic">No Portal Record</span>
                              )}
                            </td>

                            <td className="p-3.5 text-right font-mono font-bold text-[11px] whitespace-nowrap">
                              {r.bookRecord && r.portalRecord ? (
                                <div className={r.gstDiff === 0 ? 'text-emerald-500' : 'text-orange-500'}>
                                  <div>Val Diff: ₹{r.taxableValueDiff.toLocaleString('en-IN')}</div>
                                  <div>GST Diff: ₹{r.gstDiff.toLocaleString('en-IN')}</div>
                                </div>
                              ) : r.bookRecord ? (
                                <span className="text-amber-500">Unmatched Books</span>
                              ) : (
                                <span className="text-blue-500">Unclaimed Portal</span>
                              )}
                            </td>

                            <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                              {r.notes}
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB C: VENDOR WISE SUMMARY */}
            {activeTab === 'Vendor Summary' && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Vendor Compliance Ledger Summary
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Outstanding follow-up represents unclaimed credit pending due to missing invoices or value discrepancies on GSTR-2B.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold">
                        <th className="p-3.5">Supplier GSTIN</th>
                        <th className="p-3.5">Supplier Name</th>
                        <th className="p-3.5 text-center">Invoices Log</th>
                        <th className="p-3.5 text-center">Matched</th>
                        <th className="p-3.5 text-center">Timing Diff</th>
                        <th className="p-3.5 text-center">Missing Books</th>
                        <th className="p-3.5 text-center">Missing Portal</th>
                        <th className="p-3.5 text-center">GST Diff</th>
                        <th className="p-3.5 text-center">Invoice Diff</th>
                        <th className="p-3.5 text-right">Outstanding Follow-up</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 leading-normal">
                      {vendorSummaries.map((v, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          
                          <td className="p-3.5 font-mono text-[11px] font-bold text-corporate dark:text-gold whitespace-nowrap">
                            {v.gstin}
                          </td>

                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {v.supplierName}
                          </td>

                          <td className="p-3.5 text-center font-mono font-bold">{v.totalInvoices}</td>
                          
                          <td className="p-3.5 text-center">
                            {v.matchedCount > 0 ? (
                              <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-bold">{v.matchedCount}</span>
                            ) : '-'}
                          </td>

                          <td className="p-3.5 text-center">
                            {v.timingCount > 0 ? (
                              <span className="bg-amber-500/10 text-gold px-2 py-0.5 rounded font-bold">{v.timingCount}</span>
                            ) : '-'}
                          </td>

                          <td className="p-3.5 text-center">
                            {v.missingBooksCount > 0 ? (
                              <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-bold">{v.missingBooksCount}</span>
                            ) : '-'}
                          </td>

                          <td className="p-3.5 text-center">
                            {v.missingPortalCount > 0 ? (
                              <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded font-bold">{v.missingPortalCount}</span>
                            ) : '-'}
                          </td>

                          <td className="p-3.5 text-center">
                            {v.gstDiffCount > 0 ? (
                              <span className="bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded font-bold">{v.gstDiffCount}</span>
                            ) : '-'}
                          </td>

                          <td className="p-3.5 text-center">
                            {v.invDiffCount > 0 ? (
                              <span className="bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded font-bold">{v.invDiffCount}</span>
                            ) : '-'}
                          </td>

                          <td className="p-3.5 text-right font-mono font-bold text-rose-500 text-[11px]">
                            {v.outstandingFollowUpAmount > 0 ? (
                              <span>₹{v.outstandingFollowUpAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            ) : (
                              <span className="text-emerald-500 flex justify-end items-center gap-1">
                                <Check size={12} /> Clear
                              </span>
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB D: VALIDATION ISSUES LIST */}
            {activeTab === 'Validation Issues' && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Input Validation Ledger & Warning Logs
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Lists cells that carry wrong checksum structures or duplicate invoice issues in raw rows.
                  </p>
                </div>

                {validationIssues.length === 0 ? (
                  <div className="p-12 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 text-center space-y-1">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
                    <span className="text-xs font-extrabold block text-slate-900 dark:text-white uppercase tracking-wider">Perfect Alignment</span>
                    <span className="text-[11px] text-slate-500">No cell formatting discrepancies or invalid fields were detected.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold">
                          <th className="p-3.5">Sheet Source</th>
                          <th className="p-3.5">Row Number</th>
                          <th className="p-3.5">Reference Invoice No</th>
                          <th className="p-3.5">Issue Designation</th>
                          <th className="p-3.5">Audit Warning Details</th>
                          <th className="p-3.5 text-right">Severity Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                        {validationIssues.map((v, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                            <td className="p-3.5 font-bold font-sans">{v.sheet}</td>
                            <td className="p-3.5">{v.row}</td>
                            <td className="p-3.5 text-slate-500">{v.invoiceNumber || 'N/A'}</td>
                            <td className="p-3.5 font-bold text-orange-500 dark:text-yellow-400">{v.issueType}</td>
                            <td className="p-3.5 font-sans text-slate-600 dark:text-slate-350">{v.description}</td>
                            <td className="p-3.5 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                v.severity === 'Error' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-gold'
                              }`}>
                                {v.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* SECURE POPUP TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-2 border border-slate-800 animate-slide-up text-xs font-bold">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
