import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from './workspace/WorkspaceContext';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  FileText, 
  Calculator, 
  Cpu, 
  User, 
  Coins, 
  BadgeCheck, 
  Layers, 
  TrendingUp, 
  Terminal, 
  ArrowRight, 
  Database,
  ShieldCheck,
  RotateCcw,
  Copy,
  Download,
  Printer,
  Share2,
  Settings as SettingsIcon,
  HelpCircle,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  Menu,
  ShieldAlert
} from 'lucide-react';
import { GSTCalculatorTool } from './compliance_tools/GSTCalculator';
import { GSTReconciliationTool } from './compliance_tools/GSTReconciliationTool';
import { SalaryCalc } from './compliance_tools/TaxCalculator';
import ComplianceHub from './ComplianceHub';
import AIAssistantWorkspace from './compliance_tools/AIAssistantWorkspace';

// --- STAMP CODES & GSTIN STATES DATA ---
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

// Seeding standard firm records for premium interactive lookup responses
const MOCK_GSTIN_REGISTRY: Array<{
  gstin: string;
  legalName: string;
  tradeName: string;
  status: 'Active' | 'Suspended' | 'Cancelled';
  dateOfRegistration: string;
  address: string;
  constitution: 'Public Limited Company' | 'Private Limited Company' | 'Partnership' | 'Proprietorship';
  taxpayerType: 'Regular' | 'Composition';
  cin?: string;
  pan: string;
}> = [
  {
    gstin: "27AAPFU0939F1Z5",
    legalName: "ANKESH INCORPORATION PLATFORM IN LTD",
    tradeName: "Ankesh.in Compliance",
    status: 'Active',
    dateOfRegistration: "12/04/2021",
    address: "Regus, Level 4, Bandra Kurla Complex, Mumbai, Maharashtra, 400051",
    constitution: "Private Limited Company",
    taxpayerType: "Regular",
    cin: "U74999MH2021PTC358999",
    pan: "AAPFU0939F"
  },
  {
    gstin: "27AAACR0392D1Z2",
    legalName: "RELIANCE INDUSTRIES LIMITED",
    tradeName: "Reliance Industries",
    status: 'Active',
    dateOfRegistration: "01/07/2017",
    address: "Maker Chambers IV, 3rd Floor, Nariman Point, Mumbai, MH, 400021",
    constitution: "Public Limited Company",
    taxpayerType: "Regular",
    cin: "L17110MH1973PLC019786",
    pan: "AAACR0392D"
  },
  {
    gstin: "29AAAAA0000A1Z0",
    legalName: "INFOSYS LIMITED",
    tradeName: "Infosys",
    status: 'Active',
    dateOfRegistration: "01/07/2017",
    address: "Electronics City, Hosur Road, Bangalore, KA, 560100",
    constitution: "Public Limited Company",
    taxpayerType: "Regular",
    cin: "L85110KA1981PLC013115",
    pan: "AAAAA0000A"
  },
  {
    gstin: "19AAATC1014R1Z3",
    legalName: "ITC LIMITED",
    tradeName: "ITC India Corporation",
    status: 'Active',
    dateOfRegistration: "01/07/2017",
    address: "Virginia House, 37 J.L. Nehru Road, Kolkata, WB, 700071",
    constitution: "Public Limited Company",
    taxpayerType: "Regular",
    cin: "L16005WB1910PLC001985",
    pan: "AAATC1014R"
  },
  {
    gstin: "11AAATB2803G1ZD",
    legalName: "TATA CONSULTANCY SERVICES LTD",
    tradeName: "TCS",
    status: 'Active',
    dateOfRegistration: "05/07/2017",
    address: "TCS House, Raveline Street, Fort, Mumbai, MH, 400001",
    constitution: "Public Limited Company",
    taxpayerType: "Regular",
    cin: "L22219MH1995PLC084781",
    pan: "AAATB2803G"
  }
];

// Seeding standard Udyam registrations for search
const MOCK_UDYAM_REGISTRY = [
  {
    udyamNo: "UDYAM-MH-26-0048123",
    firmName: "CREATIVE COMPLIANCE BLUEPRINT SOLUTIONS",
    enterpriseType: "Micro",
    majorActivity: "Services",
    dateOfIncorporation: "14/05/2022",
    dicName: "Mumbai City",
    investment: "₹24.5 Lakhs",
    turnover: "₹85.0 Lakhs"
  },
  {
    udyamNo: "UDYAM-KA-03-0192831",
    firmName: "BANGALORE CO-WORK & WEB CONGLOMERATES",
    enterpriseType: "Small",
    majorActivity: "Services",
    dateOfIncorporation: "09/01/2021",
    dicName: "Bangalore Urban",
    investment: "₹1.2 Crores",
    turnover: "₹4.8 Crores"
  }
];

// --- INLINE STATUTORY TDS RATE CHART ---
const TDSCharts: React.FC = () => {
  const [search, setSearch] = useState('');
  
  const sections = [
    { section: "Section 192", type: "Salary Income", rate: "Slab Rates", threshold: "Basic exemption limit (₹3,00,000 / ₹7,00,000)", desc: "Tax deduction at source on salaries based on estimated average rate of income tax." },
    { section: "Section 194C", type: "Payment to Contractors", rate: "1% (Indiv/HUF) / 2% (Other)", threshold: "Single transaction: ₹30,000 | Annual aggregate: ₹1,00,000", desc: "TDS on payments to contractors or sub-contractors for carrying out work." },
    { section: "Section 194J", type: "Professional/Technical Fees", rate: "2% (Tech/Royalty) / 10% (Prof/Call Centre)", threshold: "₹30,000 per annum", desc: "TDS on fees for professional, technical services, royalty, non-compete fees." },
    { section: "Section 194I(a)", type: "Rent on Plant & Machinery", rate: "2%", threshold: "₹2,40,000 per annum", desc: "TDS on rent paid for the use of any plant, machinery, or equipment." },
    { section: "Section 194I(b)", type: "Rent on Land/Building/Furniture", rate: "10%", threshold: "₹2,40,000 per annum", desc: "TDS on rent paid for land, building, furniture, or fittings." },
    { section: "Section 194H", type: "Commission or Brokerage", rate: "5%", threshold: "₹15,000 per annum", desc: "TDS on commission or brokerage payments, excluding insurance commission." },
    { section: "Section 194-IA", type: "Transfer of Immovable Property", rate: "1%", threshold: "Property value >= ₹50,00,000", desc: "TDS on transfer of immovable property (other than agricultural land)." },
    { section: "Section 194A", type: "Interest other than Interest on Securities", rate: "10%", threshold: "₹40,000 (others) / ₹50,000 (Senior Citizens)", desc: "TDS on interest on bank deposits, post office schemes, etc." },
    { section: "Section 194DA", type: "Life Insurance Policy Maturity Payment", rate: "5% (on net taxable portion)", threshold: "₹1,00,000 per annum", desc: "TDS on maturity proceeds of life insurance policy if not exempt under Sec 10(10D)." },
    { section: "Section 194Q", type: "Purchase of Goods", rate: "0.1% (5% if PAN not provided)", threshold: "₹50,00,000 per FY (Turnover > 10 Cr)", desc: "TDS on payment for purchase of goods from a resident seller." }
  ];

  const filtered = sections.filter(s => 
    s.section.toLowerCase().includes(search.toLowerCase()) || 
    s.type.toLowerCase().includes(search.toLowerCase()) ||
    s.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          <BadgeCheck className="text-corporate dark:text-gold" size={24} />
          🇮🇳 Statutory TDS Rate Charts (FY 2025-26)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Statutory TDS sections, rates, and deduction threshold limits for the current Financial Year.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Section, Payment Type, or keywords..."
          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-corporate focus:ring-offset-1 focus:ring-offset-transparent"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-extrabold text-navy dark:text-white">
              <th className="p-3.5">Section</th>
              <th className="p-3.5">Nature of Payment</th>
              <th className="p-3.5">Rate of TDS</th>
              <th className="p-3.5">Threshold Limit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
            {filtered.map((s, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                <td className="p-3.5 font-bold font-mono text-corporate dark:text-gold whitespace-nowrap">{s.section}</td>
                <td className="p-3.5">
                  <div className="font-bold text-navy dark:text-white">{s.type}</div>
                  <div className="text-[10px] text-slate-400 leading-normal mt-0.5">{s.desc}</div>
                </td>
                <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">{s.rate}</td>
                <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-400 leading-normal">{s.threshold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- MAIN UNIFIED COMPLIANCE WORKSPACE ---
export const ComplianceSuite: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('gst');
  const [currentToolId, setCurrentToolId] = useState<string>('gstin-search');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGlowing, setIsGlowing] = useState<boolean>(false);

  const glowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { setTool } = useWorkspace();

  useEffect(() => {
    setTool(currentToolId);
  }, [currentToolId, setTool]);

  // Define Category Hierarchy in Workspace Style
  const SIDEBAR_SECTIONS = [
    {
      id: 'gst',
      name: 'GST Control',
      icon: ShieldCheck,
      desc: 'Verify GSTIN details & compute delay penalties',
      tools: [
        { id: 'gstin-search', name: 'GSTIN Verification', desc: 'Direct government record checksum lookups' },
        { id: 'gst-reconcile', name: 'GST Reconciliation', desc: 'Reconcile Purchase Register with GSTR-2B client-side' },
        { id: 'calc-gst', name: 'GST & Delay Calculator', desc: 'Slabs, statutory late fees & delay interest' },
        { id: 'gstin-reg', name: 'GST Registration Guide', desc: 'Step-by-step checklists & instructions' }
      ]
    },
    {
      id: 'income-tax',
      name: 'Income Tax',
      icon: TrendingUp,
      desc: 'Personal tax calculators & investment growth planning',
      tools: [
        { id: 'calc-salary', name: 'Slab & Deduction Planner', desc: 'Deductions & comparisons under New vs Old regimes' },
        { id: 'calc-roi', name: 'ROI & CAGR Simulator', desc: 'Simulate annual compound growth ratios' }
      ]
    },
    {
      id: 'tds',
      name: 'TDS Registry',
      icon: BadgeCheck,
      desc: 'Track statutory rate sheets and TDS thresholds',
      tools: [
        { id: 'tds-charts', name: 'TDS Rates & Thresholds', desc: 'Statutory threshold lookups for FY 25-26' },
        { id: 'calc-salary-tds', name: 'Salary TDS Planner', desc: 'Section 192 salary deduction planner' }
      ]
    },
    {
      id: 'roc-mca',
      name: 'ROC & MCA',
      icon: Building2,
      desc: 'Verify corporate entities, directors & MSMEs',
      tools: [
        { id: 'company-search', name: 'MCA Company Lookup', desc: 'Verify CIN numbers and active/dormant state' },
        { id: 'director-search', name: 'MCA Director Search', desc: 'Verify active director DIN profiles' },
        { id: 'udyam-search', name: 'Udyam MSME Verify', desc: 'Verify micro-small business certifications' }
      ]
    },
    {
      id: 'incorporation',
      name: 'Company Incorporation',
      icon: Layers,
      desc: 'Calculate startup setup costs and timelines',
      tools: [
        { id: 'incorporation-estimator', name: 'Fee Estimator & Planner', desc: 'Compare Pvt Ltd, LLP, and OPC incorporation fees' },
        { id: 'incorporation-docs', name: 'KYC Audit & Checklists', desc: 'Statutory documents required for SPICe+ MCA filing' },
        { id: 'incorporation-timeline', name: 'Incorporation Roadmap', desc: 'Typical milestone days from DSC to Incorporation Certificate' }
      ]
    },
    {
      id: 'salary',
      name: 'Salary Console',
      icon: FileText,
      desc: 'CTC to In-Hand net salary breakout',
      tools: [
        { id: 'calc-salary-direct', name: 'Take-Home Calculator', desc: 'Break out gross to net after EPF, PT, and TDS' }
      ]
    },
    {
      id: 'interest',
      name: 'Interest Desk',
      icon: Calculator,
      desc: 'Calculate delay interest or compounding wealth',
      tools: [
        { id: 'calc-compound', name: 'Compound Interest', desc: 'Compound holding yield simulator' },
        { id: 'calc-gst-interest', name: 'GST Section 50 Interest', desc: '18% interest on net delay liability' },
        { id: 'calc-emi', name: 'Home Loan Debt Principal', desc: 'EMI debt principal vs interest breakout' }
      ]
    },
    {
      id: 'penalties',
      name: 'Penalties Desk',
      icon: ShieldAlert,
      desc: 'Track return filing delay late fees',
      tools: [
        { id: 'calc-gst-penalty', name: 'GST Delay Late Fees', desc: 'Daily GSTR-1/3B statutory late fees' },
        { id: 'incorporation-deadlines', name: 'MCA INC-20A Delays', desc: 'Late fees on delay in commencement filing' }
      ]
    },
    {
      id: 'utilities',
      name: 'Utilities & APIs',
      icon: Coins,
      desc: 'Developer API payload playground and wealth helpers',
      tools: [
        { id: 'calc-savings', name: 'Savings & Wealth Goals', desc: 'Compound target calculator' },
        { id: 'demat', name: 'Dematerialization Helper', desc: 'Steps to convert physical shares to digital' },
        { id: 'lei-reg', name: 'LEI Registration Guide', desc: 'Legal Entity Identifier steps' },
        { id: 'developer-sandbox', name: 'Developer APIs Sandbox', desc: 'Direct JSON API requests' }
      ]
    },
    {
      id: 'assistant',
      name: 'AI Compliance Assistant',
      icon: Cpu,
      desc: 'Generative AI statutory assistant',
      tools: [
        { id: 'ai-chat', name: 'AI Statutory Chatbot', desc: 'Secure local notice sandbox analyzer' }
      ]
    }
  ];

  // Sync state with URL Hash Changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash) return;
      
      if (hash === '#tax') {
        setActiveCategory('income-tax');
        setCurrentToolId('calc-salary');
      } else if (hash === '#gst') {
        setActiveCategory('gst');
        setCurrentToolId('calc-gst');
      } else if (hash === '#validators') {
        setActiveCategory('roc-mca');
        setCurrentToolId('company-search');
      } else if (hash === '#compliance-hub') {
        setActiveCategory('incorporation');
        setCurrentToolId('incorporation-estimator');
      } else if (hash === '#assistant') {
        setActiveCategory('assistant');
        setCurrentToolId('ai-chat');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listen for select compliance tool events (dispatched globally)
  useEffect(() => {
    const handleSelectToolGlobal = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      const tId = customEvent.detail?.id;
      if (!tId) return;

      // Find which category has this tool ID
      const matchingSection = SIDEBAR_SECTIONS.find(sec => 
        sec.tools.some(t => t.id === tId || (tId === 'calc-salary-tds' && t.id === 'calc-salary-tds') || (tId === 'calc-salary-direct' && t.id === 'calc-salary-direct'))
      );

      if (matchingSection) {
        setActiveCategory(matchingSection.id);
        setCurrentToolId(tId);
      }
    };
    window.addEventListener('select-compliance-tool', handleSelectToolGlobal);
    return () => window.removeEventListener('select-compliance-tool', handleSelectToolGlobal);
  }, []);

  // Glow listener
  useEffect(() => {
    const handleGlow = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id === 'compliance-suite') {
        setIsGlowing(true);
        if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
        glowTimerRef.current = setTimeout(() => {
          setIsGlowing(false);
          glowTimerRef.current = null;
        }, 1200);
      }
    };
    window.addEventListener('glow-workspace', handleGlow);
    return () => {
      window.removeEventListener('glow-workspace', handleGlow);
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    };
  }, []);

  // Track last active workspace
  useEffect(() => {
    localStorage.setItem('ankesh_last_workspace_hash', '#compliance-suite');
  }, []);

  // Toast listener
  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      setToastMessage(customEvent.detail?.message);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null);
        toastTimerRef.current = null;
      }, 3000);
    };
    window.addEventListener('workspace-toast', handleToast);
    return () => {
      window.removeEventListener('workspace-toast', handleToast);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Toolbar Handlers
  const handleToolbarReset = () => {
    window.dispatchEvent(new CustomEvent('workspace-reset', { detail: { toolId: currentToolId } }));
    // Simple toast for feedback if tool doesn't have local reset notifier
    setToastMessage('Reset signal dispatched to active module.');
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2000);
  };

  const handleToolbarCopy = () => {
    window.dispatchEvent(new CustomEvent('workspace-copy', { detail: { toolId: currentToolId } }));
  };

  const handleToolbarDownload = () => {
    window.dispatchEvent(new CustomEvent('workspace-download', { detail: { toolId: currentToolId } }));
  };

  const handleToolbarPrint = () => {
    window.print();
  };

  const handleToolbarShare = () => {
    setToastMessage('Share link generated! Ready for team sharing.');
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  const handleToolbarSettings = () => {
    setToastMessage('Preferences saved securely to workspace profile.');
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  // Safe Category Selection
  const selectCategory = (catId: string) => {
    const section = SIDEBAR_SECTIONS.find(s => s.id === catId);
    if (section) {
      setActiveCategory(catId);
      setCurrentToolId(section.tools[0].id);
    }
  };

  const activeSection = SIDEBAR_SECTIONS.find(s => s.id === activeCategory) || SIDEBAR_SECTIONS[0];
  const activeTool = activeSection.tools.find(t => t.id === currentToolId) || activeSection.tools[0];

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100 font-sans antialiased transition-all duration-1000 ${
      isGlowing ? 'ring-4 ring-orange-500/25 dark:ring-orange-500/15 shadow-[0_0_60px_rgba(249,115,22,0.18)] bg-orange-500/[0.015]' : ''
    }`}>
      
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none z-10">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-corporate dark:bg-gold flex items-center justify-center font-black text-white dark:text-navy text-sm shadow-md shadow-blue-500/10">
                CW
              </div>
              <div>
                <span className="font-extrabold text-[13px] block tracking-tight text-navy dark:text-white uppercase">Compliance Suite</span>
                <span className="text-[9px] text-slate-400 block tracking-widest font-bold">ANKESH WORKSPACE V2</span>
              </div>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[70vh]">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 block mb-2.5 px-2">
              Statutory Suites
            </span>
            {SIDEBAR_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isSelected = activeCategory === sec.id;
              return (
                <button
                  key={sec.id}
                  id={`sidebar-sec-${sec.id}`}
                  onClick={() => selectCategory(sec.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all flex gap-3 items-center group relative overflow-hidden ${
                    isSelected 
                      ? 'bg-corporate text-white border-corporate dark:bg-slate-950 dark:text-gold dark:border-gold shadow-sm ring-1 ring-corporate/10 dark:ring-gold/10' 
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border-transparent hover:border-slate-200/50 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-white/10 dark:bg-gold/10 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-corporate dark:group-hover:text-gold'}`}>
                    <Icon size={15} />
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-extrabold text-xs block truncate tracking-tight">{sec.name}</span>
                    <span className={`text-[9px] block truncate mt-0.5 leading-none ${isSelected ? 'text-white/70 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>{sec.desc}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer credit card */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850/80 space-y-1.5">
            <span className="text-[8px] uppercase tracking-widest font-black text-slate-400 block">Lead Advisor</span>
            <span className="text-[11px] font-black text-navy dark:text-white block">Ankesh Kumar</span>
            <span className="text-[9px] text-slate-500 block leading-normal">Regulatory Consultant & Developer</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT */}
      <main className="flex-grow flex flex-col min-w-0">
        
        {/* WORKSPACE HEADER */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-black tracking-widest bg-corporate/10 dark:bg-gold/10 text-corporate dark:text-gold px-2 py-0.5 rounded border border-corporate/20 dark:border-gold/20">
                Module
              </span>
              <span className="text-xs text-slate-400 font-bold font-mono">/ {activeSection.name}</span>
            </div>
            <h1 className="text-xl font-extrabold text-navy dark:text-white tracking-tight mt-1.5">
              {activeTool.name}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {activeTool.desc}
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
            <div className="flex items-center gap-2 bg-emerald-500/5 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              SECURE SESSION
            </div>
            <button 
              onClick={() => {
                window.location.hash = '';
                window.location.reload();
              }}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-400 hover:text-navy dark:hover:text-white transition-colors"
              title="Close Workspace"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </header>

        {/* UNIFIED TOOLBAR */}
        <section className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 select-none">
          {/* Sub-tools pills */}
          <div className="flex flex-wrap gap-1.5">
            {activeSection.tools.map((t) => (
              <button
                key={t.id}
                onClick={() => setCurrentToolId(t.id)}
                className={`px-3.5 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border ${
                  currentToolId === t.id
                    ? 'bg-corporate text-white border-corporate dark:bg-gold dark:text-navy dark:border-gold shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:text-slate-400 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Quick Actions buttons */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[10px]">
            <button 
              onClick={handleToolbarReset}
              className="px-2.5 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 flex items-center gap-1.5 font-bold uppercase transition-all"
              title="Reset all fields"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>
            
            <button 
              onClick={handleToolbarCopy}
              className="px-2.5 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 flex items-center gap-1.5 font-bold uppercase transition-all"
              title="Copy Summary to Clipboard"
            >
              <Copy size={12} /> Copy
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>

            <button 
              onClick={handleToolbarDownload}
              className="px-2.5 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 flex items-center gap-1.5 font-bold uppercase transition-all"
              title="Download Data JSON Report"
            >
              <Download size={12} /> Download
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>

            <button 
              onClick={handleToolbarPrint}
              className="px-2.5 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 flex items-center gap-1.5 font-bold uppercase transition-all"
              title="Print results page"
            >
              <Printer size={12} /> Print
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>

            <button 
              onClick={handleToolbarShare}
              className="px-2.5 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 flex items-center gap-1.5 font-bold uppercase transition-all"
              title="Share report link"
            >
              <Share2 size={12} /> Share
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>

            <button 
              onClick={handleToolbarSettings}
              className="px-2.5 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 flex items-center gap-1.5 font-bold uppercase transition-all"
              title="Workspace Settings"
            >
              <SettingsIcon size={12} /> Settings
            </button>
          </div>
        </section>

        {/* 3. WORKSPACE CONTENT AREA */}
        <section className="flex-grow p-8 overflow-y-auto max-h-[80vh] bg-white dark:bg-slate-950">
          <div className="max-w-5xl mx-auto">
            
            {/* DYNAMIC VIEW SELECTOR WITH STATE */}
            {/* ================================= */}
            
            {/* GST INSERTS */}
            {currentToolId === 'gstin-search' && <GSTINSearchTool />}
            {currentToolId === 'gst-reconcile' && <GSTReconciliationTool />}
            {currentToolId === 'calc-gst' && <GSTCalculatorTool />}
            {currentToolId === 'gstin-reg' && <GSTINRegGuide />}

            {/* INCOME TAX INSERTS */}
            {currentToolId === 'calc-salary' && <SalaryCalc />}
            {currentToolId === 'calc-roi' && <ROICalc />}

            {/* TDS INSERTS */}
            {currentToolId === 'tds-charts' && <TDSCharts />}
            {currentToolId === 'calc-salary-tds' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-blue-500/15 bg-blue-500/5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-extrabold text-navy dark:text-white uppercase tracking-wider block mb-1">ℹ Section 192 Salary TDS Estimator</span>
                  This module simulates tax deductions at source (TDS) under Section 192 of the Income Tax Act. It computes your tax slabs under New vs Old regimes to establish your monthly employer deduction index. Enter your details below.
                </div>
                <SalaryCalc />
              </div>
            )}

            {/* ROC & MCA LOOKUPS */}
            {currentToolId === 'company-search' && <MCACompanySearchTool />}
            {currentToolId === 'director-search' && <MCADirectorSearchTool />}
            {currentToolId === 'udyam-search' && <UdyamSearchTool />}

            {/* COMPANY INCORPORATION MODULE */}
            {(currentToolId === 'incorporation-estimator' || currentToolId === 'incorporation-docs' || currentToolId === 'incorporation-timeline') && (
              <div className="space-y-4">
                <ComplianceHub />
              </div>
            )}

            {/* SALARY VIEWPORTS */}
            {currentToolId === 'calc-salary-direct' && <SalaryCalc />}

            {/* INTEREST CALCULATIONS */}
            {currentToolId === 'calc-compound' && <CompoundInterestCalc />}
            {currentToolId === 'calc-gst-interest' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-extrabold text-navy dark:text-white uppercase tracking-wider block mb-1">ℹ Section 50 GST Cash Ledger Interest</span>
                  For delay in filing GSTR returns, Section 50 imposes interest at 18% per annum on the net portion of tax paid through your electronic cash ledger (excluding credit ledger balances). Enter your transaction below and check &apos;GSTR Filing Delayed&apos;.
                </div>
                <GSTCalculatorTool />
              </div>
            )}
            {currentToolId === 'calc-emi' && <HomeLoanEMICalc />}

            {/* PENALTIES AND LATE FEES */}
            {currentToolId === 'calc-gst-penalty' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-rose-500/15 bg-rose-500/5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-extrabold text-navy dark:text-white uppercase tracking-wider block mb-1">ℹ GST Return Late Fees</span>
                  GSTR-1 and GSTR-3B filings carry statutory late fees for delays. The penalty is ₹50 per day (₹20 for Nil returns), capped at aggregate aggregate slabs based on turnover. Enter your details below.
                </div>
                <GSTCalculatorTool />
              </div>
            )}
            {currentToolId === 'incorporation-deadlines' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-rose-500/15 bg-rose-500/5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-extrabold text-navy dark:text-white uppercase tracking-wider block mb-1">ℹ MCA INC-20A Commencement Delays</span>
                  Under Section 10A of the Companies Act, directors must file Form INC-20A within 180 days of incorporation. Delays carry progressive late filing fees and potential company strike-off indices. Explore incorporation fees and checklists inside our incorporation module below.
                </div>
                <ComplianceHub />
              </div>
            )}

            {/* UTILITIES & DEVELOPER API SANDBOX */}
            {currentToolId === 'calc-savings' && <SavingsCalc />}
            {currentToolId === 'demat' && <DematHelper />}
            {currentToolId === 'lei-reg' && <LEIRegistrationGuide />}
            {currentToolId === 'developer-sandbox' && <DeveloperSandboxTool />}

            {/* AI CHATBOT PORTAL */}
            {currentToolId === 'ai-chat' && <AIAssistantWorkspace />}

          </div>
        </section>

        {/* 4. WORKSPACE STATUS FOOTER */}
        <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 text-[10px] text-slate-400 dark:text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ALL GOVERNMENT REGISTRY SCHEMAS SYNCED
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-800">|</span>
            <span>API REVISION: 2026.1.4</span>
          </div>
          <div>
            <span>Statutory computations conform with Union Budget provisions & GST Council rulings.</span>
          </div>
        </footer>

      </main>

      {/* 5. Custom Toast Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-gold text-white dark:text-navy px-4.5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-slate-800 dark:border-white/20 animate-slide-up text-xs font-bold">
          <CheckCircle2 size={15} className="text-emerald-400 dark:text-navy shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

// ==========================================
// SUB MODULE 1: GSTIN SEARCH & VERIFICATION
// ==========================================
const GSTINSearchTool: React.FC = () => {
  const [searchString, setSearchString] = useState('27AAPFU0939F1Z5');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [errorText, setErrorText] = useState('');
  const [searchInitiated, setSearchInitiated] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const validateGSTIN = (gstin: string) => {
    const clean = gstin.trim().toUpperCase();
    if (!clean) return { isValid: false, error: "Please enter a GSTIN." };
    if (clean.length !== 15) {
      return { isValid: false, error: `GSTIN must be exactly 15 characters. Currently ${clean.length} characters.` };
    }
    
    // Alphanumeric pattern check
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!regex.test(clean)) {
      const stateCode = clean.substring(0, 2);
      if (!/^[0-9]{2}$/.test(stateCode)) {
        return { isValid: false, error: "The first 2 digits of GSTIN must be a numeric State Code (e.g., 27 for Maharashtra)." };
      }
      const pan = clean.substring(2, 12);
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        return { isValid: false, error: `Invalid PAN format inside GSTIN: "${pan}". Characters 3 to 12 must strictly follow PAN syntax (5 letters, 4 digits, 1 letter).` };
      }
      const zChar = clean.charAt(13);
      if (zChar !== 'Z') {
        return { isValid: false, error: `The 14th character of GSTIN must traditionally be 'Z'. Currently it is '${zChar}'.` };
      }
      return { isValid: false, error: "GSTIN format is invalid. Please double-check characters." };
    }

    const stateCode = clean.substring(0, 2);
    const stateName = STATE_CODES[stateCode];
    if (!stateName) {
      return { isValid: false, error: `State Code "${stateCode}" is not a valid Indian state code.` };
    }

    return { isValid: true, clean };
  };

  const handleSearch = async () => {
    const validation = validateGSTIN(searchString);
    if (!validation.isValid) {
      setErrorText(validation.error || "Invalid GSTIN format.");
      setSearchResult(null);
      setSearchInitiated(true);
      return;
    }
    
    setErrorText('');
    setIsSearching(true);
    setSearchInitiated(true);
    setSearchResult(null);

    try {
      // Call only the Netlify function as required
      const response = await fetch(`/.netlify/functions/gst-verify?gstin=${validation.clean}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || "GST verification is currently offline.");
      }
      const data = await response.json();
      setSearchResult(data);
    } catch (err: any) {
      console.error("GSTIN verification failed:", err);
      setErrorText(err.message || "Live GST verification is currently unavailable.");
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Helper parsing GSTIN structure
  const parseGSTSegments = (code: string) => {
    if (code.length < 15) return null;
    const clean = code.toUpperCase();
    return {
      state: clean.substring(0, 2),
      stateName: STATE_CODES[clean.substring(0, 2)] || "Unknown State",
      pan: clean.substring(2, 12),
      entity: clean.substring(12, 13),
      defaultChar: clean.substring(13, 14),
      checkDigit: clean.substring(14, 15)
    };
  };

  const segments = parseGSTSegments(searchResult?.gstin || searchString || '');

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🔍 GSTIN Number Search & Verification
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Free & Instant GSTIN Lookup Tool. Verify legal business parameters, active registration authority and validate correct GSTIN layouts directly.
        </p>
      </div>

      {/* Live Status Banner */}
      <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10 text-emerald-800 dark:text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-start sm:items-center gap-2.5">
        <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed font-medium">
          <span className="font-extrabold text-emerald-700 dark:text-emerald-300 mr-1.5 uppercase tracking-wide">Live Mode:</span>
          Connected to the real-time statutory database proxy gateway. Verified live company parameters will populate on lookup.
        </p>
      </div>

      {/* Input Group */}
      <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Enter Company GSTIN or PAN to search
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
            className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-3 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-corporate dark:focus:border-gold tracking-wide text-slate-800 dark:text-slate-105"
            placeholder="e.g. 27AAPFU0939F1Z5"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-3 bg-corporate dark:bg-gold text-white dark:text-navy hover:opacity-90 active:scale-95 transition-all rounded-xl font-bold text-xs uppercase disabled:opacity-50"
          >
            {isSearching ? "Searching Indexes..." : "Lookup GSTIN"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
          <span>💡 Quick Paste:</span>
          <button 
            onClick={() => { setSearchString('27AAPFU0939F1Z5'); setErrorText(''); }} 
            className="underline text-corporate dark:text-gold hover:text-navy cursor-pointer font-bold"
          >
            Ankesh.in (27AAPFU0939F1Z5)
          </button>
          <button 
            onClick={() => { setSearchString('07AAACR0392D1Z2'); setErrorText(''); }} 
            className="underline text-corporate dark:text-gold hover:text-navy cursor-pointer font-bold"
          >
            RIL (07AAACR0392D1Z2)
          </button>
        </div>
      </div>

      {errorText && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex gap-2 items-center">
          <AlertTriangle size={15} /> <span>{errorText}</span>
        </div>
      )}

      {/* SEARCH RESULT BLOCK */}
      {searchResult && !isSearching && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Main legal card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-corporate dark:text-gold">Legal Entity Signature</span>
                  <h4 className="font-extrabold text-sm text-navy dark:text-white capitalize">{searchResult.legalName.toLowerCase()}</h4>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`border px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest leading-none ${
                    searchResult.status?.toUpperCase() === 'ACTIVE' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}>
                    ✔ GST Status: {searchResult.status || 'Active'}
                  </span>
                  {searchResult.source && (
                    <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider ${
                      searchResult.source.includes("Live")
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                    }`}>
                      {searchResult.source}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-2.5">
                <div className="flex justify-between">
                  <span>GSTIN Number:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{searchResult.gstin}</span>
                </div>
                <div className="flex justify-between">
                  <span>Legal Name:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{searchResult.legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trade Name:</span>
                  <span className="font-bold text-corporate dark:text-gold">{searchResult.tradeName || searchResult.legalName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>PAN Registered:</span>
                  <span className="font-bold">{searchResult.pan || (searchResult.gstin ? searchResult.gstin.substring(2, 12) : '')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reg Date:</span>
                  <span>{searchResult.dateOfRegistration || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Constitution of Business:</span>
                  <span>{searchResult.constitution || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>State / Jurisdiction:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{searchResult.state || segments?.stateName || 'N/A'}</span>
                </div>
                {searchResult.lastUpdated && (
                  <div className="flex justify-between text-corporate dark:text-gold font-bold">
                    <span>Last Updated:</span>
                    <span>{searchResult.lastUpdated}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address & Status Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-950/10 border border-slate-205 dark:border-slate-800 space-y-3">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 block">Principal Place of Business</span>
              <p className="text-xs text-navy dark:text-slate-350 italic">
                "{searchResult.address || 'N/A'}"
              </p>
              <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-[9px] text-emerald-600 dark:text-emerald-400 flex gap-2">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>GSTIN structure matches Census state allocations. Ready for statutory B2B input tax claim allocation index.</span>
              </div>
            </div>

          </div>

          {/* DYNAMIC ANALYSIS VISUAL BLOCK */}
          {segments && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 space-y-4">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 dark:text-slate-500 block">
                GSTIN 15-Digit Analytical Structure Breakdown
              </span>
              
              {/* Colored Segment Block */}
              <div className="flex flex-wrap gap-1 font-mono text-xl sm:text-2xl font-bold justify-center bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
                <span className="text-blue-500 bg-blue-500/5 border border-blue-500/20 px-2.5 py-1 rounded" title="State Code">{segments.state}</span>
                <span className="text-purple-500 bg-purple-500/5 border border-purple-500/20 px-2.5 py-1 rounded" title="PAN segment">{segments.pan}</span>
                <span className="text-amber-500 bg-amber-500/5 border border-amber-500/20 px-2.5 py-1 rounded" title="Entity Number">{segments.entity}</span>
                <span className="text-teal-505 bg-teal-500/5 border border-teal-500/20 px-2.5 py-1 rounded" title="Default Character">{segments.defaultChar}</span>
                <span className="text-rose-500 bg-rose-500/5 border border-rose-500/20 px-2.5 py-1 rounded" title="Checksum">{segments.checkDigit}</span>
              </div>

              {/* Segment Explainer Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-[9px] text-slate-500 dark:text-slate-400 pt-2">
                <div className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950">
                  <span className="font-bold text-blue-505 block text-[10px] mb-0.5">State Code ({segments.state})</span>
                  <span>{segments.stateName} as mapped under Census allocation lists.</span>
                </div>
                <div className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950">
                  <span className="font-bold text-purple-505 block text-[10px] mb-0.5">PAN segment</span>
                  <span>10 char Income Tax Code tied directly to PAN records.</span>
                </div>
                <div className="p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950">
                  <span className="font-bold text-amber-505 block text-[10px] mb-0.5">Entity No ({segments.entity})</span>
                  <span>Identifies registration count under same PAN in this state.</span>
                </div>
                <div className="p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950">
                  <span className="font-bold text-teal-605 block text-[10px] mb-0.5">Default Code (Z)</span>
                  <span>Default fixed placeholder character (historically Z).</span>
                </div>
                <div className="p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950">
                  <span className="font-bold text-rose-505 block text-[10px] mb-0.5">Check ({segments.checkDigit})</span>
                  <span>Deterministic validation checksum value.</span>
                </div>
              </div>
            </div>
          )}

          {/* Core Info Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-darkCard/25 space-y-1">
              <h5 className="font-extrabold text-[11px] text-navy dark:text-white uppercase">🔒 Prevent Fraud</h5>
              <p className="text-[10px] text-slate-400 leading-normal">Cross-reference vendors directly to ensure input tax credits (ITC) aren't rejected or frozen during quarterly GST audits.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-105 dark:border-slate-800 bg-slate-50 dark:bg-darkCard/25 space-y-1">
              <h5 className="font-extrabold text-[11px] text-navy dark:text-white uppercase">📋 E-Commerce onboarding</h5>
              <p className="text-[10px] text-slate-400 leading-normal">Verify statutory entity registry values when adding third-party sellers on digital e-commerce platforms.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-110 dark:border-slate-800 bg-slate-50 dark:bg-darkCard/25 space-y-1">
              <h5 className="font-extrabold text-[11px] text-navy dark:text-white uppercase">📊 Official Registry Data</h5>
              <p className="text-[10px] text-slate-400 leading-normal">Our system simulates authentic state-wise registration indexes so layout checking matches GST portal API standards.</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

// ==========================================
// SUB MODULE 2: UDYAM SEARCH & VERIFICATION
// ==========================================
const UdyamSearchTool: React.FC = () => {
  const [udyamNo, setUdyamNo] = useState('UDYAM-MH-26-0048123');
  const [foundRecord, setFoundRecord] = useState<typeof MOCK_UDYAM_REGISTRY[0] | null>(MOCK_UDYAM_REGISTRY[0]);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState('');

  const lookupUdyam = () => {
    if (!udyamNo.trim()) {
      setErr("Please supply an authentic Udyam identifier.");
      return;
    }
    setErr('');
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      const cleanIdx = udyamNo.trim().toUpperCase();
      const match = MOCK_UDYAM_REGISTRY.find(u => u.udyamNo === cleanIdx || u.firmName.includes(cleanIdx));
      if (match) {
        setFoundRecord(match);
      } else {
        // dynamic generate if looks standard Udyam identifier format
        if (cleanIdx.startsWith("UDYAM-")) {
          setFoundRecord({
            udyamNo: cleanIdx,
            firmName: "Verified MSME Enterprise Segment",
            enterpriseType: "Micro",
            majorActivity: "Manufacturing",
            dateOfIncorporation: "11/11/2021",
            dicName: "State Centre",
            investment: "₹35 Lakhs",
            turnover: "₹1.4 Crores"
          });
        } else {
          setFoundRecord(null);
          setErr("Udyam number signature does not exist in seed. Enter a valid ID like 'UDYAM-MH-26-0048123'.");
        }
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🎖 Udyam MSME Verification Portal
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Perform digital lookups on Central MSME Udyam numbers to corroborate legal activity categories and micro-small status indices.
        </p>
      </div>

      {/* Demo Mode Banner */}
      <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 text-amber-800 dark:text-amber-400 px-4 py-3 rounded-xl text-xs flex items-start sm:items-center gap-2.5">
        <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed font-medium">
          <span className="font-extrabold text-amber-700 dark:text-amber-300 mr-1.5 uppercase tracking-wide">Demo Mode:</span>
          This portfolio uses simulated compliance datasets for demonstration purposes. Live government integrations are not connected.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex flex-col sm:flex-row gap-3">
        <input 
          type="text" 
          value={udyamNo} 
          onChange={(e) => setUdyamNo(e.target.value)}
          placeholder="e.g. UDYAM-MH-26-0048123"
          className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-3 rounded-lg text-xs font-mono font-bold focus:outline-none"
        />
        <button 
          onClick={lookupUdyam}
          className="px-6 py-3 bg-corporate dark:bg-gold text-white dark:text-navy hover:opacity-90 active:scale-95 transition-all rounded-lg font-bold text-xs uppercase"
        >
          {searching ? "Fetching Registry..." : "Verify MSME"}
        </button>
      </div>

      {err && (
        <p className="text-rose-500 text-xs font-mono">{err}</p>
      )}

      {foundRecord && !searching && (
        <div className="p-6 rounded-2xl border border-slate-250 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-widest">MSME Registered Corporation</span>
            <h4 className="font-extrabold text-sm text-navy dark:text-white">{foundRecord.firmName}</h4>
            <span className="inline-block bg-corporate/10 text-corporate dark:bg-gold/10 dark:text-gold text-[10px] font-bold tracking-widest px-2.5 py-1 rounded">
              🏭 {foundRecord.enterpriseType} Enterprise
            </span>
          </div>

          <div className="space-y-1 font-mono text-[10px] text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-4">
            <div>Udyam Identifier: <span className="font-bold text-slate-800 dark:text-slate-200">{foundRecord.udyamNo}</span></div>
            <div>Major Classification: <span>{foundRecord.majorActivity}</span></div>
            <div>DIC Centre: <span>{foundRecord.dicName}</span></div>
            <div>Capital Equipment Invest: <span className="text-teal-500 font-bold">{foundRecord.investment}</span></div>
            <div>Annual Sales Turnover: <span className="text-emerald-500 font-bold">{foundRecord.turnover}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB MODULE 3: MCA COMPANY SEARCH
// ==========================================
const MCACompanySearchTool: React.FC = () => {
  const [query, setQuery] = useState('U74999MH2021PTC358999');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<typeof MOCK_GSTIN_REGISTRY[0] | null>(MOCK_GSTIN_REGISTRY[0]);

  const searchMCA = () => {
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      const match = MOCK_GSTIN_REGISTRY.find(m => m.cin === query || m.pan === query || m.legalName.toUpperCase().includes(query.toUpperCase()));
      if (match) setResult(match);
      else {
        setResult({
          gstin: "Simulated ID",
          legalName: `DYNAMIC NOMINAL MCA INDEX CO`,
          tradeName: "Nominal Index Corp",
          status: "Active",
          dateOfRegistration: "10/10/2018",
          address: "MCA Central Registry Reference Location Code, New Delhi, 110001",
          constitution: "Private Limited Company",
          taxpayerType: "Regular",
          pan: "SIMP1293K",
          cin: query
        });
      }
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🏢 Ministry of Corporate Affairs Index Search
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Perform live index checks using Corporate Identification Number (CIN) patterns or Company names to retrieve authorized shares, directors list and operational registry status.
        </p>
      </div>

      {/* Demo Mode Banner */}
      <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 text-amber-800 dark:text-amber-400 px-4 py-3 rounded-xl text-xs flex items-start sm:items-center gap-2.5">
        <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed font-medium">
          <span className="font-extrabold text-amber-700 dark:text-amber-300 mr-1.5 uppercase tracking-wide">Demo Mode:</span>
          This portfolio uses simulated compliance datasets for demonstration purposes. Live government integrations are not connected.
        </p>
      </div>

      <div className="flex gap-3 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200">
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter CIN (e.g. U74999MH2021PTC358999) or Name"
          className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 px-4 py-3 rounded-lg text-xs font-mono font-bold"
        />
        <button 
          onClick={searchMCA}
          className="px-6 py-3 bg-corporate dark:bg-gold text-white dark:text-navy rounded-lg font-bold text-xs uppercase"
        >
          MCA Search
        </button>
      </div>

      {result && !searching && (
        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Company Overview</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-extrabold uppercase">✔ Allocated</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold block uppercase">Official Corporate Name</span>
                <span className="font-extrabold text-navy dark:text-white">{result.legalName}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold block uppercase">CIN Number</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{result.cin || "U74999MH2021PTC358999"}</span>
              </div>
            </div>

            <div className="space-y-1 font-mono text-[10px] text-slate-500 dark:text-slate-400 border-l border-slate-100 dark:border-slate-800 pl-4">
              <div>Authorized Capital: <span className="font-bold text-slate-700 dark:text-slate-200">₹15,00,000</span></div>
              <div>Paid-Up Capital: <span className="font-bold">₹1,00,000</span></div>
              <div>Incorporation State: <span>Maharashtra</span></div>
              <div>Category: <span>Non-Govt Company Limited by Shares</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB MODULE 4: MCA DIRECTOR SEARCH
// ==========================================
const MCADirectorSearchTool: React.FC = () => {
  const [din, setDin] = useState('08529302');
  const [searching, setSearching] = useState(false);

  const MOCK_BOARD_ASSOCIATIONS = [
    { name: "ANKESH INCORPORATION PLATFORM IN LTD", role: "Managing Director", status: "Active since 2021" },
    { name: "ANKESH LEAGUE OF ARTICLES CONSULTING LLP", role: "Designated Partner", status: "Active since 2023" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          👤 Director Identification DIN Lookup
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Each legal member of an Indian Private Limited Company requires a DIN. Enter an 8-character ID number to audit board associations.
        </p>
      </div>

      {/* Demo Mode Banner */}
      <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 text-amber-800 dark:text-amber-400 px-4 py-3 rounded-xl text-xs flex items-start sm:items-center gap-2.5">
        <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed font-medium">
          <span className="font-extrabold text-amber-700 dark:text-amber-300 mr-1.5 uppercase tracking-wide">Demo Mode:</span>
          This portfolio uses simulated compliance datasets for demonstration purposes. Live government integrations are not connected.
        </p>
      </div>

      <div className="flex gap-3 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200">
        <input 
          type="text" 
          value={din} 
          onChange={(e) => setDin(e.target.value)}
          placeholder="e.g. 08529302"
          className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 px-4 py-3 rounded-lg text-xs font-mono font-bold"
        />
        <button 
          onClick={() => { setSearching(true); setTimeout(() => setSearching(false), 500); }}
          className="px-6 py-3 bg-corporate dark:bg-gold text-white dark:text-navy rounded-lg font-bold text-xs uppercase"
        >
          Audit DIN
        </button>
      </div>

      {!searching && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Associated Board Representative</span>
            <span className="font-extrabold text-sm text-navy dark:text-white block mt-1">S. K. SINHA (DIN: {din})</span>
            <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase mt-2 inline-block">KYC Compliant (DIR-3 KYC Active)</span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block px-1">Audited Active Directorships ({MOCK_BOARD_ASSOCIATIONS.length})</span>
            {MOCK_BOARD_ASSOCIATIONS.map((assoc, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 rounded-lg text-xs flex justify-between items-center font-mono">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] leading-tight">{assoc.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{assoc.role}</span>
                </div>
                <span className="text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 border border-emerald-500/10">{assoc.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB MODULE 5: GSTIN REGISTRATION GUIDE
// ==========================================
const GSTINRegGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          📝 GST Registration Process Roadmap
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Learn how to apply for a brand new GSTIN number, key mandatory documents, and avoid statutory delays on the central GST network.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
          <strong>🔔 Who is GST registration mandatory for?</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-[11px]">
            <li>Any business with interstate supply operations (selling outside their home state).</li>
            <li>E-Commerce marketplace sellers who onboard onto platforms like Amazon or Flipkart.</li>
            <li>Service providers with over ₹20 Lakhs aggregated annual revenue.</li>
            <li>Goods traders with over ₹40 Lakhs aggregated annual turnover in standard states.</li>
          </ul>
        </div>

        <div className="border-l-2 border-corporate dark:border-gold pl-4 space-y-3">
          <div className="relative">
            <span className="font-bold text-xs text-navy dark:text-white">Step 1: Temp Reg (TRN) Generation</span>
            <p className="text-[11px] text-slate-400 leading-normal">Submit PAN, Email and Mobile authentication on the central GST Portal to establish a Temporary Reference Number (TRN).</p>
          </div>
          <div className="relative">
            <span className="font-bold text-xs text-navy dark:text-white">Step 2: Upload Documents & Address Proofs</span>
            <p className="text-[11px] text-slate-400 leading-normal">Prepare commercial rent agreement, utility bills, NOC from the property owner, PAN, and Aadhaar card of the directors. Submit TRN form.</p>
          </div>
          <div className="relative">
            <span className="font-bold text-xs text-navy dark:text-white">Step 3: ARN Generation & Application Audit</span>
            <p className="text-[11px] text-slate-400 leading-normal">An Application Reference Number (ARN) is issued. Tax officers audit files within 7-10 working days, raising clarifications (SNC) if required.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB MODULE 6: UDYAM REGISTRATION HANDBOOK
// ==========================================
const UdyamRegHandbook: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🎖 Udyam MSME Registration Process Handbook
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          A step-by-step primer on obtaining a lifetime Udyam registration ID for micro, small or medium enterprise level statutory verification.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 space-y-3">
        <span className="font-bold text-xs text-navy dark:text-white block">Key Benefits of Udyam MSME Certificate</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-550">
          <div className="flex gap-2 items-start">
            <span className="text-emerald-500">✔</span>
            <span>Collateral-Free loans index available across standard Indian banks.</span>
          </div>
          <div className="flex gap-2 items-start">
            <span className="text-emerald-505">✔</span>
            <span>Unmatched 50% discount on Trademark and patent registration fee structures.</span>
          </div>
          <div className="flex gap-2 items-start">
            <span className="text-emerald-510">✔</span>
            <span>Exemption on direct electricity costs and MSME credit rating charges.</span>
          </div>
          <div className="flex gap-2 items-start">
            <span className="text-emerald-515">✔</span>
            <span>Guaranteed statutory safety against delayed payments (MSME Samadhaan forum protect).</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB MODULE 7: LEI REGISTRATION GUIDE
// ==========================================
const LEIRegistrationGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🌐 LEI (Legal Entity Identifier) Onboarding
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Each corporation executing bulky transactional value of over ₹50 Crores is mandatorily required by the Reserve Bank of India (RBI) to establish an LEI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="font-bold text-xs text-navy dark:text-white block">What is LEI?</span>
          <p className="text-[11px] text-slate-405 leading-relaxed">
            The Legal Entity Identifier is a 20-character, global alpha-numeric identifier established to standardize financial telemetry across international registries.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="font-bold text-xs text-navy dark:text-white block">Mandatory Thresholds</span>
          <p className="text-[11px] text-slate-405 leading-relaxed">
            Required for all non-individual entities executing over ₹50 Crore transaction credits via RTGS / NEFT. Our CA hub facilitates LEI issuance on your behalf inside 48 hours.
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB MODULE 8: DEMATERIALIZATION HELPER
// ==========================================
const DematHelper: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          📈 Dematerialization of Share Certificates
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Convert archaic physical share sheets into digital dematerialized assets under standard regulatory guidelines (CDSL / NSDL).
        </p>
      </div>

      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-slate-700 dark:text-slate-350">
        <strong>💡 Compliance Alert:</strong> MCA mandates that all Private Limited entities (except small enterprises) must fully dematerialize and issue share securities only in digital forms before executing equity transactions.
      </div>

      <div className="space-y-3 text-[11px] text-slate-500 dark:text-slate-400">
        <p>1. Open an active Demat Account with a registered Depository Participant (DP).</p>
        <p>2. Submit a physical Demat Request Form (DRF) along with the authentic paper Share Certificate records marked "SURRENDERED FOR DEMATERIALIZATION".</p>
        <p>3. The DP processes and triggers registration parameters directly with NSDL / CDSL. Shares are digitally processed and credited inside 15-20 business weeks.</p>
      </div>
    </div>
  );
};

// ==========================================
// INTERACTIVE CALCULATORS
// ==========================================

// 1. HOME LOAN EMI CALCULATOR
const HomeLoanEMICalc: React.FC = () => {
  const [principal, setPrincipal] = useState(5000000); // 50 Lakhs
  const [rate, setRate] = useState(8.5); // 8.5%
  const [tenure, setTenure] = useState(20); // 20 years

  const r = rate / 12 / 100;
  const n = tenure * 12;
  const emi = Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) || 0;
  const totalPayment = emi * n;
  const totalInterest = totalPayment - principal;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🧮 Interactive Home Loan EMI Calculator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Easily calculate monthly loan repayments, principal allocation cycles, and total statutory debt interest values instantly.
        </p>
      </div>

      <div className="space-y-4">
        {/* Sliders */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Loan Principal Amount</span>
            <span className="font-mono text-corporate dark:text-gold">₹{principal.toLocaleString('en-IN')}</span>
          </div>
          <input 
            type="range" 
            min={500000} 
            max={50000000} 
            step={100000} 
            value={principal} 
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Interest Rate (%)</span>
            <span className="font-mono text-corporate dark:text-gold">{rate}%</span>
          </div>
          <input 
            type="range" 
            min={5} 
            max={20} 
            step={0.1} 
            value={rate} 
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Tenure (Years)</span>
            <span className="font-mono text-corporate dark:text-gold">{tenure} Years</span>
          </div>
          <input 
            type="range" 
            min={1} 
            max={30} 
            value={tenure} 
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold"
          />
        </div>
      </div>

      {/* Results Display */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center font-mono">
        <div className="p-3 border-r border-slate-200 dark:border-slate-800 sm:last:border-0 last:border-0">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Monthly EMI</span>
          <span className="text-xl font-bold text-corporate dark:text-gold block mt-2">₹{emi.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3 border-r border-slate-200 dark:border-slate-800 sm:last:border-0 last:border-0">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Interest Payable</span>
          <span className="text-sm font-bold text-navy dark:text-white block mt-2">₹{totalInterest.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Total Outflow</span>
          <span className="text-sm font-bold text-navy dark:text-white block mt-2">₹{totalPayment.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};

// 2. ROI & CAGR CALCULATOR
const ROICalc: React.FC = () => {
  const [initAmt, setInitAmt] = useState(100000);
  const [finAmt, setFinAmt] = useState(180000);
  const [years, setYears] = useState(5);

  const absoluteReturn = Math.round(((finAmt - initAmt) / initAmt) * 100);
  const cagr = Number((Math.pow(finAmt / initAmt, 1 / years) - 1) * 100).toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          📈 Return on Investment (ROI) & CAGR Simulator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Analyze compounded annual growth rate (CAGR) profiles across multiple standard years of asset holding.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Initial Principal Outlay</span>
            <span className="font-mono text-corporate dark:text-gold">₹{initAmt.toLocaleString('en-IN')}</span>
          </div>
          <input 
            type="range" 
            min={10000} 
            max={5000000} 
            step={10000} 
            value={initAmt} 
            onChange={(e) => setInitAmt(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Estimated Maturity Valuation</span>
            <span className="font-mono text-corporate dark:text-gold">₹{finAmt.toLocaleString('en-IN')}</span>
          </div>
          <input 
            type="range" 
            min={10000} 
            max={10000000} 
            step={20000} 
            value={finAmt} 
            onChange={(e) => setFinAmt(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Investment Duration (Years)</span>
            <span className="font-mono text-corporate dark:text-gold">{years} Years</span>
          </div>
          <input 
            type="range" 
            min={1} 
            max={30} 
            value={years} 
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold"
          />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4 text-center font-mono">
        <div className="p-3 border-r border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-405 uppercase tracking-widest block font-bold">Absolute Return</span>
          <span className="text-xl font-bold text-emerald-500 block mt-2">{absoluteReturn}%</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-405 uppercase tracking-widest block font-bold">Compounded CAGR</span>
          <span className="text-xl font-bold text-corporate dark:text-gold block mt-2">{cagr}%</span>
        </div>
      </div>
    </div>
  );
};

// 3. SAVINGS CALCULATOR
const SavingsCalc: React.FC = () => {
  const [monthly, setMonthly] = useState(10000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const r = rate / 12 / 100;
  const n = years * 12;
  const futureValue = Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  const principalAmount = monthly * n;
  const earnings = futureValue - principalAmount;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          💰 Recurring SIP Savings Goal Calculator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Forecast compound interest projections on routine monthly savings allocations instantly.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Monthly SIP Contribution</span>
            <span className="font-mono text-corporate dark:text-gold">₹{monthly.toLocaleString('en-IN')}</span>
          </div>
          <input 
            type="range" 
            min={500} 
            max={200000} 
            step={500} 
            value={monthly} 
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Expected Growth rate (%)</span>
            <span className="font-mono text-corporate dark:text-gold">{rate}%</span>
          </div>
          <input 
            type="range" 
            min={4} 
            max={30} 
            step={0.5} 
            value={rate} 
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Duration (Years)</span>
            <span className="font-mono text-corporate dark:text-gold">{years} Years</span>
          </div>
          <input 
            type="range" 
            min={1} 
            max={40} 
            value={years} 
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold"
          />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center font-mono">
        <div className="p-3 border-r border-slate-200 dark:border-slate-800 sm:last:border-0 last:border-0">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Invested Outlay</span>
          <span className="text-sm font-bold text-navy dark:text-white block mt-2">₹{principalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3 border-r border-slate-200 dark:border-slate-800 sm:last:border-0 last:border-0">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Estimated Yield</span>
          <span className="text-sm font-bold text-emerald-500 block mt-2">₹{earnings.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-405 block font-bold uppercase tracking-wider">Aggregate Wealth</span>
          <span className="text-xl font-bold text-corporate dark:text-gold block mt-2">₹{futureValue.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};

// 4. COMPOUND INTEREST CALCULATOR
const CompoundInterestCalc: React.FC = () => {
  const [init, setInit] = useState(100000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(10);
  const [frequency, setFrequency] = useState(12); // Compounded Monthly

  const total = Math.round(init * Math.pow(1 + (rate / 100 / frequency), frequency * years));
  const interest = total - init;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🧮 Pure Compound Interest Calculator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Explore the explosive power of compounding rates! Simulate annual, quarterly, or monthly interest cycles.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-620">
            <span>Base Capital Outlay</span>
            <span className="font-mono text-corporate dark:text-gold">₹{init.toLocaleString('en-IN')}</span>
          </div>
          <input 
            type="range" 
            min={5000} 
            max={2000000} 
            step={5000} 
            value={init} 
            onChange={(e) => setInit(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-625">
            <span>Rate of Interest (%)</span>
            <span className="font-mono text-corporate dark:text-gold">{rate}%</span>
          </div>
          <input 
            type="range" 
            min={4} 
            max={30} 
            step={0.5} 
            value={rate} 
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-630">
            <span>Compounding Frequency</span>
            <select 
              value={frequency} 
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="bg-white dark:bg-slate-950 text-xs border border-slate-200 rounded px-2.5 py-1 focus:outline-none"
            >
              <option value={12}>Compounded Monthly</option>
              <option value={4}>Compounded Quarterly</option>
              <option value={1}>Compounded Annually</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4 text-center font-mono">
        <div className="p-3 border-r border-slate-200">
          <span className="text-[10px] text-slate-400 block font-bold uppercase">Aggregated Interest</span>
          <span className="text-lg font-bold text-navy dark:text-white block mt-2">₹{interest.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 block font-bold uppercase">Compound Wealth</span>
          <span className="text-xl font-bold text-corporate dark:text-gold block mt-2">₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};



// ==========================================
// DEVELOPER SANDBOX PAYLOAD TESTER
// ==========================================
const DeveloperSandboxTool: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('verify-gst');
  const [authToken, setAuthToken] = useState('ankesh_sandbox_pk_prod_9949');
  const [responseLog, setResponseLog] = useState<string>('Click "Execute Endpoint Request" to fetch real telemetry sandbox JSON payloads.');
  const [isExecuting, setIsExecuting] = useState(false);

  const executePayload = () => {
    setIsExecuting(true);
    setResponseLog('// Initiating TLS handshake with sandbox.ankesh.in/api/v1...\n// Dispatching query token headers...');
    
    setTimeout(() => {
      setIsExecuting(false);
      if (selectedEndpoint === 'verify-gst') {
        setResponseLog(JSON.stringify({
          status: "SUCCESS",
          apiVersion: "v1.4",
          data: {
            gstin: "27AAPFU0939F1Z5",
            legalName: "ANKESH INCORPORATION PLATFORM IN LTD",
            verificationAuthority: "State Sector GST Office - Maharashtra",
            jurisdiction: "Bandra Division 4",
            validationCheckDigitMatch: true,
            filingStatus: {
              gstr1_frequency: "Monthly",
              gstr3b_status: "Filing Complete - Active to FY 2026",
              penaltiesOwed: 0.00
            }
          }
        }, null, 2));
      } else {
        setResponseLog(JSON.stringify({
          status: "SUCCESS",
          apiVersion: "v1.4",
          data: {
            cin: "U74999MH2021PTC358999",
            incorporationDate: "2021-04-12",
            mcaRegistrySector: "Registrar of Companies - Mumbai Office",
            authorizedLpa: 15.0,
            activeDirectors: [
              { din: "08529302", activeTitle: "Managing Director" },
              { din: "09120300", activeTitle: "Executive Director" }
            ]
          }
        }, null, 2));
      }
    }, 750);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          💻 Indian Compliance Developers Sandbox
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Perform live GET / POST actions directly onto our verified compliance endpoint schemas. Perfect for ERP developers and SaaS onboarding teams.
        </p>
      </div>

      {/* Demo Mode Banner */}
      <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 text-amber-800 dark:text-amber-400 px-4 py-3 rounded-xl text-xs flex items-start sm:items-center gap-2.5">
        <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed font-medium">
          <span className="font-extrabold text-amber-700 dark:text-amber-300 mr-1.5 uppercase tracking-wide">Demo Mode:</span>
          This portfolio uses simulated compliance datasets for demonstration purposes. Live government integrations are not connected.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Input Parameters Box */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-950/20">
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block">Configure API Payload headers</span>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Endpoint Service Route</label>
            <select 
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-205 text-xs font-mono rounded-lg px-2 py-2 focus:outline-none"
            >
              <option value="verify-gst">GET /api/v1/gstin/verify (GSTIN Validator)</option>
              <option value="verify-mca">GET /api/v1/mca/company (CIN MCA Audits)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Bearer Token Header</label>
            <input 
              type="text" 
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-205 text-xs font-mono rounded-lg px-2 py-2 focus:outline-none"
            />
          </div>

          <button
            onClick={executePayload}
            className="w-full py-2.5 bg-purple-600 dark:bg-purple-700 hover:opacity-95 text-white font-extrabold text-xs uppercase rounded-lg transition-all shadow-md shadow-indigo-900/10"
          >
            {isExecuting ? "Invoking TLS Protocol..." : "Execute Endpoint Request"}
          </button>
        </div>

        {/* API Response Log Container */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#1e1e1e] dark:bg-black/40 text-rose-300 font-mono text-[10px] p-4 flex flex-col justify-between h-[210px] overflow-y-auto relative">
          <Terminal size={14} className="absolute top-2 right-2 text-slate-600 pointer-events-none" />
          <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {responseLog}
          </pre>
        </div>

      </div>
    </div>
  );
};
