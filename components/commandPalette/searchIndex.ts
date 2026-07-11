export interface SearchItem {
  id: string;
  title: string;
  desc: string;
  category: 'Portfolio' | 'PDF Toolkit' | 'Compliance Workspace' | 'AI';
  shortcut?: string;
  actionType: 'hash' | 'pdf-tool' | 'compliance-tool';
  target: string;
  keywords: string[];
}

export const searchIndex: SearchItem[] = [
  // --- Portfolio ---
  {
    id: 'portfolio-home',
    title: 'Home',
    desc: 'Go to the landing section and view hero presentation.',
    category: 'Portfolio',
    actionType: 'hash',
    target: '#home',
    keywords: ['home', 'hero', 'landing', 'start', 'ca', 'ankesh']
  },
  {
    id: 'portfolio-about',
    title: 'About Me',
    desc: 'Read professional background, dual credentials, and credentials summary.',
    category: 'Portfolio',
    actionType: 'hash',
    target: '#about',
    keywords: ['about', 'bio', 'profile', 'chartered accountant', 'developer', 'education']
  },
  {
    id: 'portfolio-experience',
    title: 'Work Experience',
    desc: 'Browse articleship timeline, corporate exposures, and responsibilities.',
    category: 'Portfolio',
    actionType: 'hash',
    target: '#experience',
    keywords: ['experience', 'work', 'jobs', 'timeline', 'articleship', 'gphk', 'resume']
  },
  {
    id: 'portfolio-highlights',
    title: 'Career Highlights',
    desc: 'Review verified audit, taxation, and fintech milestones.',
    category: 'Portfolio',
    actionType: 'hash',
    target: '#career-highlights',
    keywords: ['highlights', 'milestones', 'case studies', 'achievements', 'audits', 'reconciliation']
  },
  {
    id: 'portfolio-products',
    title: 'My Products',
    desc: 'Explore secure offline tools, web suites, and developer sandboxes.',
    category: 'Portfolio',
    actionType: 'hash',
    target: '#products',
    keywords: ['products', 'software', 'tools', 'suite', 'pdf', 'calculators', 'sandbox']
  },
  {
    id: 'portfolio-contact',
    title: 'Contact',
    desc: 'Get in touch for consultations, corporate audits, or inquiries.',
    category: 'Portfolio',
    actionType: 'hash',
    target: '#contact',
    keywords: ['contact', 'email', 'form', 'hire', 'consultation', 'phone', 'socials']
  },

  // --- PDF Toolkit ---
  {
    id: 'pdf-merge',
    title: 'Merge PDF',
    desc: 'Combine multiple PDF files locally in your preferred sequence.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'merge',
    keywords: ['merge', 'combine', 'join', 'concat', 'pdf tools', 'append']
  },
  {
    id: 'pdf-split',
    title: 'Split PDF',
    desc: 'Extract specific page ranges or split a PDF into separate files.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'split',
    keywords: ['split', 'cut', 'separate', 'divide', 'extract pages', 'pdf tools']
  },
  {
    id: 'pdf-compress',
    title: 'Compress PDF',
    desc: 'Reduce PDF file size while maintaining document quality.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'compress',
    keywords: ['compress', 'shrink', 'minimize', 'optimize', 'reduce size', 'pdf tools']
  },
  {
    id: 'pdf-protect',
    title: 'Protect PDF',
    desc: 'Secure your PDF with a strong password to prevent unauthorized access.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'protect',
    keywords: ['protect', 'encrypt', 'lock', 'password', 'security', 'pdf tools']
  },
  {
    id: 'pdf-unlock',
    title: 'Unlock PDF',
    desc: 'Remove password security to access or print encrypted PDFs.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'unlock',
    keywords: ['unlock', 'decrypt', 'remove password', 'open', 'security', 'pdf tools']
  },
  {
    id: 'pdf-watermark',
    title: 'Watermark PDF',
    desc: 'Add custom text or image watermarks with layout and opacity controls.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'watermark',
    keywords: ['watermark', 'stamp', 'sign', 'text overlay', 'image overlay', 'pdf tools']
  },
  {
    id: 'pdf-rotate',
    title: 'Rotate PDF',
    desc: 'Rotate individual pages or entire documents portrait or landscape.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'rotate',
    keywords: ['rotate', 'turn', 'spin', 'angle', 'orientation', 'pdf tools']
  },
  {
    id: 'pdf-delete',
    title: 'Delete Pages',
    desc: 'Remove unnecessary pages from your PDF file before sharing.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'delete',
    keywords: ['delete pages', 'remove pages', 'discard', 'clean', 'pdf tools']
  },
  {
    id: 'pdf-extract',
    title: 'Extract Pages',
    desc: 'Save only the specific pages you need into a new clean PDF document.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'extract',
    keywords: ['extract pages', 'save pages', 'subset', 'cut out', 'pdf tools']
  },
  {
    id: 'pdf-ocr',
    title: 'OCR PDF (Extract Text)',
    desc: 'Extract structured text blocks, tables, and paragraphs client-side.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'ocr',
    keywords: ['ocr', 'text recognition', 'extract text', 'scanner', 'tesseract', 'pdf tools']
  },
  {
    id: 'pdf-pdf2img',
    title: 'PDF to Images',
    desc: 'Extract all pages from a PDF and convert them to high-quality images.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'pdf2img',
    keywords: ['pdf to images', 'pdf2img', 'png', 'jpg', 'jpeg', 'extract images', 'pdf tools']
  },
  {
    id: 'pdf-img2pdf',
    title: 'Images to PDF',
    desc: 'Convert JPG, PNG, and WebP images into a single clean PDF file.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'img2pdf',
    keywords: ['images to pdf', 'img2pdf', 'png to pdf', 'jpg to pdf', 'convert images', 'pdf tools']
  },
  {
    id: 'pdf-organize',
    title: 'Organize PDF',
    desc: 'Rearrange, rotate, delete, and sort pages with drag-and-drop previews.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'organize-pdf',
    keywords: ['organize', 'reorder', 'sort', 'pages', 'preview', 'drag and drop', 'pdf tools']
  },
  {
    id: 'pdf-redact',
    title: 'Redact PDF',
    desc: 'Permanently blackout and sanitize sensitive text or vectors client-side.',
    category: 'PDF Toolkit',
    actionType: 'pdf-tool',
    target: 'redact',
    keywords: ['redact', 'blackout', 'sanitize', 'censor', 'privacy', 'hide details', 'pdf tools']
  },

  // --- Compliance Workspace ---
  {
    id: 'comp-gst-calc',
    title: 'GST Calculator',
    desc: 'Compute standard GST rates, base exclusions/inclusions, and CGST/SGST/IGST.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'calc-gst',
    keywords: ['gst', 'gst calculator', 'tax rates', 'cgst', 'sgst', 'igst', 'invoice', 'exclusive', 'inclusive']
  },
  {
    id: 'comp-gst-verify',
    title: 'GSTIN Verification',
    desc: 'Look up live active state, registration data, legal trade names and PAN details.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'gstin-search',
    keywords: ['gstin', 'verify gst', 'gst verification', 'taxpayer status', 'trade name', 'gst lookup']
  },
  {
    id: 'comp-gst-guide',
    title: 'GST Registration Guide',
    desc: 'Access eligibility checklists, mandatory documentation, and filing procedures.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'gstin-reg',
    keywords: ['gst registration', 'gst guide', 'gst checklist', 'incorporation checklist', 'mca checklist']
  },
  {
    id: 'comp-tax-calc',
    title: 'Income Tax Calculator',
    desc: 'Compare tax outlays under Old vs New Tax Regimes with full deduction planning.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'calc-salary',
    keywords: ['tax', 'income tax', 'old regime', 'new regime', 'tax comparison', 'deductions', '80c', '80d']
  },
  {
    id: 'comp-roi-calc',
    title: 'ROI & CAGR Simulator',
    desc: 'Calculate holding period yields and compound annual growth rates for investments.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'calc-roi',
    keywords: ['roi', 'cagr', 'yield', 'growth rate', 'investment growth', 'interest desk', 'compound']
  },
  {
    id: 'comp-tds-charts',
    title: 'TDS Rates & Thresholds',
    desc: 'Statutory threshold limits, TDS sections, and rate charts for FY 2025-26.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'tds-charts',
    keywords: ['tds', 'tds rates', 'tds sections', 'withholding tax', 'contractors', 'professional fees', 'thresholds']
  },
  {
    id: 'comp-salary-tds',
    title: 'Salary TDS Planner',
    desc: 'Section 192 TDS deduction planner based on standard monthly brackets.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'calc-salary-tds',
    keywords: ['salary tds', 'section 192', 'withholding salary', 'tax deduction source', 'tds planner']
  },
  {
    id: 'comp-company-search',
    title: 'MCA Company Lookup',
    desc: 'Verify registered CIN profile, active status, and MCA filing history.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'company-search',
    keywords: ['cin', 'mca', 'roc', 'company lookup', 'corporate search', 'registration status']
  },
  {
    id: 'comp-director-search',
    title: 'MCA Director Search',
    desc: 'Look up active DIN profiles, director associate list, and appointment details.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'director-search',
    keywords: ['din', 'director search', 'mca search', 'board profile', 'corporate advisors']
  },
  {
    id: 'comp-udyam-search',
    title: 'Udyam MSME Verify',
    desc: 'Verify MSME registrations, investment thresholds, and activity categories.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'udyam-search',
    keywords: ['udyam', 'msme', 'micro small medium', 'certificate verify', 'msme registration']
  },
  {
    id: 'comp-inc-estimator',
    title: 'Company Incorporation Fee Estimator',
    desc: 'Compare SpicE+ registration, DSC, and stamp duty costs for Pvt Ltd, OPC, and LLP.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'incorporation-estimator',
    keywords: ['incorporation', 'startup costs', 'stamp duty', 'dsc', 'private limited', 'llp', 'opc', 'mca fees']
  },
  {
    id: 'comp-inc-docs',
    title: 'Incorporation KYC Checklists',
    desc: 'Check state-wise SPICe+ MCA filing documents, MoA, AoA, and director declarations.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'incorporation-docs',
    keywords: ['kyc checklist', 'incorporation documents', 'moa', 'aoa', 'spice filing', 'director pan']
  },
  {
    id: 'comp-inc-timeline',
    title: 'Incorporation Roadmap',
    desc: 'Milestones tracking DSC approvals, name reservations, and final CoI issuance.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'incorporation-timeline',
    keywords: ['roadmap', 'milestones', 'timeline', 'coi', 'name approval', 'run portal']
  },
  {
    id: 'comp-takehome',
    title: 'Salary Take-Home Calculator',
    desc: 'Deconstruct CTC to net in-hand salary after accounting for EPF, PT, and tax outlays.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'calc-salary-direct',
    keywords: ['salary', 'take-home', 'ctc', 'in-hand', 'epf', 'provident fund', 'professional tax', 'pf deduction']
  },
  {
    id: 'comp-compound',
    title: 'Compound Interest Calculator',
    desc: 'Simulate annual, quarterly, or monthly compounding interest cycles on capital outlays.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'calc-compound',
    keywords: ['compound', 'compounding', 'interest desk', 'compound calculator', 'wealth simulator']
  },
  {
    id: 'comp-gst-interest',
    title: 'GST Section 50 Interest Calculator',
    desc: 'Compute statutory 18% delay interest specifically on net cash liability outlays.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'calc-gst-interest',
    keywords: ['section 50', 'gst interest', 'delay interest', 'cash tax liability', 'late interest', 'interest desk']
  },
  {
    id: 'comp-emi-calc',
    title: 'Home Loan EMI Debt Principal',
    desc: 'Break out debt principal payments vs compounding interest splits over loan tenures.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'calc-emi',
    keywords: ['emi', 'loan', 'home loan', 'principal breakout', 'amortization chart', 'debt simulator', 'interest desk']
  },
  {
    id: 'comp-gst-penalty',
    title: 'GST Delay Late Fees Calculator',
    desc: 'Track exact statutory late fees under GSTR-1 & GSTR-3B filings (₹20 vs ₹50/day slabs).',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'calc-gst-penalty',
    keywords: ['gst penalty', 'late fee', 'gstr1 penalty', 'gstr3b penalty', 'return delay', 'penalties desk']
  },
  {
    id: 'comp-inc-deadlines',
    title: 'MCA INC-20A Delays',
    desc: 'Calculate late fees on delays in filing Commencement of Business certificates.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'incorporation-deadlines',
    keywords: ['inc-20a', 'commencement business', 'mca delay', 'roc penalty', 'additional fees', 'penalties desk']
  },
  {
    id: 'comp-wealth-goals',
    title: 'Savings & Wealth Goals',
    desc: 'Simulate required monthly contributions to hit custom target corpus portfolios.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'calc-savings',
    keywords: ['savings', 'wealth goals', 'target corpus', 'sip', 'financial plan', 'utilities']
  },
  {
    id: 'comp-demat',
    title: 'Dematerialization Helper',
    desc: 'Step-by-step guidance on converting obsolete physical stock shares into demat registers.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'demat',
    keywords: ['demat', 'physical shares', 'dematerialization', 'nsdl', 'cdsl', 'drt form', 'utilities']
  },
  {
    id: 'comp-lei-reg',
    title: 'LEI Registration Guide',
    desc: 'Legal Entity Identifier steps required for high-volume transactions (> ₹50 Cr).',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'lei-reg',
    keywords: ['lei', 'legal entity identifier', 'rbi lei', 'lei cost', 'corporate rbi', 'utilities']
  },
  {
    id: 'comp-dev-sandbox',
    title: 'Developer APIs Sandbox',
    desc: 'Test and execute compliance endpoint telemetry requests with JSON payloads.',
    category: 'Compliance Workspace',
    actionType: 'compliance-tool',
    target: 'developer-sandbox',
    keywords: ['developer sandbox', 'api playground', 'json payload', 'gstin endpoint', 'mca telemetry', 'utilities']
  },

  // --- AI ---
  {
    id: 'ai-assistant',
    title: 'AI Compliance Assistant',
    desc: 'Leverage generative AI to analyze corporate tax notices, clauses, and filing queries.',
    category: 'AI',
    actionType: 'compliance-tool',
    target: 'ai-chat',
    keywords: ['ai assistant', 'ai chat', 'regulatory ai', 'chatbot', 'statutory intelligence', 'compliance assistant', 'clauses']
  },
  {
    id: 'ai-workspace',
    title: 'AI Workspace Chat',
    desc: 'Launch the full AI Statutory Chatbot console inside the compliance environment.',
    category: 'AI',
    actionType: 'compliance-tool',
    target: 'ai-chat',
    keywords: ['ai workspace', 'regulatory bot', 'compliance chat', 'tax ai', 'government notices']
  }
];
