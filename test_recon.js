import * as XLSX from 'xlsx';

const STATE_CODES = {
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

const HEADER_ALIASES = {
  supplierGSTIN: [
    'suppliergstin', 'gstin', 'vendorgstin', 'gstinofsupplier', 'gstinofsupplieruin', 
    'suppliergstinuin', 'gstinuinofsupplier', 'gstinuin', 'gstinrecipient', 'recipientsgstin',
    'suppliergstinid', 'gstinid', 'vendor'
  ],
  supplierName: [
    'suppliername', 'vendorname', 'partyname', 'legalname', 'tradename', 'legalnameofthesupplier', 
    'tradenameofthesupplier', 'supplierlegalname', 'nameofthesupplier', 'vendor', 'party'
  ],
  invoiceNumber: [
    'invoicenumber', 'invoiceno', 'invno', 'invoicenum', 'billno', 'billnumber', 'docno', 'documentnumber', 'invoiceno'
  ],
  invoiceDate: [
    'invoicedate', 'invdate', 'date', 'billdate', 'docdate', 'documentdate', 'invoiceodt', 'invdate'
  ],
  taxableValue: [
    'taxablevalue', 'taxableamount', 'taxableval', 'taxableamt', 'basicval', 'basicvalue', 'basicamount', 'taxableval'
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

function cleanHeader(header) {
  if (header === null || header === undefined) return '';
  return header.toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const GENERIC_FALLBACKS = new Set(['vendor', 'party', 'date', 'gst', 'month', 'period']);

function getHeaderMapping(row, sheetType) {
  const mapping = {};
  const activeAliases = {};
  for (const [key, list] of Object.entries(HEADER_ALIASES)) {
    activeAliases[key] = [...list];
  }

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
    if (GENERIC_FALLBACKS.has(cleanCell)) return; // Skip in Pass 1

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

    // Only map if this cell is a generic fallback or if the property is still unmapped
    for (const [propName, aliases] of Object.entries(activeAliases)) {
      if (mapping[propName] === undefined && aliases.includes(cleanCell)) {
        // Ensure this column index isn't already used by another mapped property
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

function findHeaderRowIndex(rows, sheetType) {
  let bestRowIndex = -1;
  let bestMapping = {};
  let maxMatchedCount = 0;

  const limit = Math.min(rows.length, 30);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;

    const mapping = getHeaderMapping(row, sheetType);
    
    const primaryProps = ['supplierGSTIN', 'invoiceNumber', 'invoiceDate', 'taxableValue'];
    let matchedRequiredCount = 0;
    primaryProps.forEach(prop => {
      if (mapping[prop] !== undefined) {
        matchedRequiredCount++;
      }
    });

    if (matchedRequiredCount > maxMatchedCount) {
      maxMatchedCount = matchedRequiredCount;
      bestRowIndex = i;
      bestMapping = mapping;
    }
  }

  if (bestRowIndex === -1 && rows.length > 0) {
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

// --- SIMULATED USER EXCEL FILE WITH VENDOR AS SERIAL NUMBER ---
function runTest() {
  const wb = XLSX.utils.book_new();

  const booksData = [
    ["Vendor", "Vendor Name", "GSTIN", "Invoice Number", "Invoice Date", "Taxable Value", "IGST", "CGST", "SGST", "Total GST", "Books Month"],
    [1, "ABC Traders", "29ABCDE1234F1Z5", "INV001", "05/04/2025", 100000, 0, 9000, 9000, 18000, "Apr-2025"],
    [2, "Ankesh Incorporation", "27AAPFU0939F1Z5", "INV-2026-001", "10/04/2026", 100000, 0, 9000, 9000, 18000, "April 2026"]
  ];

  const wsBooks = XLSX.utils.aoa_to_sheet(booksData);
  XLSX.utils.book_append_sheet(wb, wsBooks, "Purchase Register");

  const booksRows = XLSX.utils.sheet_to_json(wsBooks, { header: 1, defval: "" });
  
  console.log("--- BEFORE REMOVING 'vendor' FROM supplierGSTIN ALIASES ---");
  const { mapping: booksMappingBefore } = findHeaderRowIndex(booksRows, 'Books');
  console.log("Books Mapping Before:", booksMappingBefore);

  // Apply the fix in the test runner
  const fixedSupplierGstinAliases = HEADER_ALIASES.supplierGSTIN.filter(a => a !== 'vendor');
  HEADER_ALIASES.supplierGSTIN = fixedSupplierGstinAliases;

  console.log("\n--- AFTER REMOVING 'vendor' FROM supplierGSTIN ALIASES ---");
  const { mapping: booksMappingAfter } = findHeaderRowIndex(booksRows, 'Books');
  console.log("Books Mapping After:", booksMappingAfter);

  const getCell = (row, mapping, prop) => {
    const colIdx = mapping[prop];
    if (colIdx === undefined) return '';
    const val = row[colIdx];
    return val !== undefined && val !== null ? val.toString().trim() : '';
  };

  const row = booksRows[1];
  const parsedRecord = {
    supplierGSTIN: getCell(row, booksMappingAfter, 'supplierGSTIN'),
    supplierName: getCell(row, booksMappingAfter, 'supplierName'),
    invoiceNumber: getCell(row, booksMappingAfter, 'invoiceNumber'),
    invoiceDate: getCell(row, booksMappingAfter, 'invoiceDate'),
  };

  console.log("\nParsed First Row Object with fixed mapping:", parsedRecord);
}

runTest();
