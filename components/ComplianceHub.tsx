import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  UserCheck, 
  Calculator, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  Calendar, 
  ClipboardCheck, 
  Clock, 
  MapPin, 
  Users, 
  Info,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

interface StructureInfo {
  name: string;
  tagline: string;
  minDirectors: number;
  maxDirectors: number;
  complianceLevel: 'High' | 'Medium' | 'Low';
  baseGovtFee: number;
  baseProfessionalFee: number;
  pros: string[];
  cons: string[];
  description: string;
}

const STRUCTURE_DATA: Record<string, StructureInfo> = {
  pvtltd: {
    name: "Private Limited Company (Pvt Ltd)",
    tagline: "Gold standard for venture-backed startups asking for funding.",
    minDirectors: 2,
    maxDirectors: 15,
    complianceLevel: "High",
    baseGovtFee: 2500,
    baseProfessionalFee: 5999,
    pros: ["Limited Liability protection", "Separate Legal Entity", "Attracts VC funding easily", "Transferable shares"],
    cons: ["Higher mandatory compliance costs", "Requires annual audits", "Stricter regulatory norms by ROC"],
    description: "Most preferred form for startups aiming for rapid growth and equity fundraising. Requires a minimum of 2 directors and shareholders."
  },
  llp: {
    name: "Limited Liability Partnership (LLP)",
    tagline: "Ideal for professional firms, consultancies, and family businesses.",
    minDirectors: 2,
    maxDirectors: 999,
    complianceLevel: "Medium",
    baseGovtFee: 1500,
    baseProfessionalFee: 4999,
    pros: ["Lower compliance than Pvt Ltd", "No minimum audit threshold up to ₹40L capital", "Limited liability", "Partnership flexibility"],
    cons: ["Cannot raise VC / equity funding", "Slightly harder to transfer ownership", "Unfavorable for stock option plans"],
    description: "Perfect blend of partnership flexibility and corporate limited liability. High operational ease with minimal compliance burdens if turnover is low."
  },
  opc: {
    name: "One Person Company (OPC)",
    tagline: "Solo founders who want corporate credibility without partners.",
    minDirectors: 1,
    maxDirectors: 15,
    complianceLevel: "Medium",
    baseGovtFee: 2000,
    baseProfessionalFee: 4499,
    pros: ["Single-director control", "Limited liability", "Separate legal identity", "Builds better profile than proprietorship"],
    cons: ["Higher tax rate (30% vs lower tax bracket of proprietorship)", "Sole shareholder must be Indian resident", "Harder to scale"],
    description: "Enables a single flat owner to operate like a Private Limited. Highly credible, though less fluid than a full Pvt Ltd when bringing on external stakeholders."
  },
  proprietor: {
    name: "Sole Proprietorship / Partnership",
    tagline: "Fastest run, lowest barrier to entry for local, low-risk retailers.",
    minDirectors: 1,
    maxDirectors: 2, // Partnership
    complianceLevel: "Low",
    baseGovtFee: 500,
    baseProfessionalFee: 2499,
    pros: ["Absolute easiest & cheapest to establish", "No mandatory annual filing with ROC", "Taxes filed under personal income structure", "Quick closure"],
    cons: ["Unlimited personal liability", "No separate legal entity status", "Cannot issue equity to employees", "Low investor trust"],
    description: "Simplest business model run by an individual or tiny partner group. Highly flexible but risky due to direct personal liability for all liabilities."
  }
};

const STATE_STAMP_MULTIPLIERS: Record<string, number> = {
  "Maharashtra": 1.5,
  "Karnataka": 1.2,
  "Delhi": 1.0,
  "Tamil Nadu": 1.1,
  "Uttar Pradesh": 1.3,
  "Telangana": 1.2,
  "West Bengal": 1.4,
  "Gujarat": 1.1,
  "Haryana": 1.0,
  "Other Indian States": 1.1
};

interface AddOnInfo {
  id: string;
  name: string;
  description: string;
  fee: number;
}

const ADD_ON_DATA: AddOnInfo[] = [
  { id: 'gst', name: 'GST Setup', description: 'Recommended for tax voicing, inter-state selling, or turnover exceeding ₹20L/₹40L.', fee: 1499 },
  { id: 'msme', name: 'MSME registration', description: 'Unlocks priority sector lending, bank concessions, and MSME interest protections.', fee: 799 },
  { id: 'pt', name: 'Professional Tax (PT)', description: 'Mandatory registration in specific states for corporate setups with potential payroll.', fee: 999 },
  { id: 'pf', name: 'Provident Fund (PF)', description: 'Mandatory registration on reaching or planning to employ 20+ workforce members.', fee: 1999 },
  { id: 'itr', name: 'Director ITR Filing', description: 'Personal tax services for management, individual income tax filings, and many more companion compliance options.', fee: 1199 }
];

export default function ComplianceHub() {
  const [selectedStructure, setSelectedStructure] = useState<string>('pvtltd');
  const [selectedState, setSelectedState] = useState<string>('Telangana');
  const [capital, setCapital] = useState<number>(100000); // 1 Lakh
  const [directors, setDirectors] = useState<number>(2);
  const [incorporationMonth, setIncorporationMonth] = useState<number>(6); // June
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isGlowing, setIsGlowing] = useState(false);
  const [addOns, setAddOns] = useState<Record<string, boolean>>({
    gst: false,
    msme: false,
    pt: false,
    pf: false,
    itr: false
  });

  useEffect(() => {
    const handleGlow = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id === 'compliance-hub') {
        setIsGlowing(true);
        setTimeout(() => setIsGlowing(false), 1200);
      }
    };
    window.addEventListener('glow-workspace', handleGlow);
    return () => window.removeEventListener('glow-workspace', handleGlow);
  }, []);

  const activeStructure = STRUCTURE_DATA[selectedStructure];

  // Auto-adjust directors to min limits when structure changes
  useEffect(() => {
    if (directors < activeStructure.minDirectors) {
      setDirectors(activeStructure.minDirectors);
    } else if (directors > activeStructure.maxDirectors) {
      setDirectors(activeStructure.maxDirectors);
    }
  }, [selectedStructure]);

  // Calculations
  const baseGovtFee = activeStructure.baseGovtFee;
  const stampDutyMultiplier = STATE_STAMP_MULTIPLIERS[selectedState] || 1.1;
  const capitalFactor = Math.max(1, capital / 100000);
  
  const estimatedStampDuty = Math.round(500 * stampDutyMultiplier * (selectedStructure === 'pvtltd' ? Math.min(3, capitalFactor) : 1));
  const dscFee = directors * 800; // Rs 800 per active DSC
  const totalGovtFee = baseGovtFee + estimatedStampDuty + dscFee;
  
  const professionalFee = activeStructure.baseProfessionalFee;
  const gstOnProfFee = Math.round(professionalFee * 0.18);
  const totalProfessionalFee = professionalFee + gstOnProfFee;

  // Add-on calculations
  const totalAddOnFeeBase = ADD_ON_DATA
    .filter(addon => addOns[addon.id])
    .reduce((sum, addon) => sum + addon.fee, 0);
  const gstOnAddOnFee = Math.round(totalAddOnFeeBase * 0.18);
  const totalAddOnFeeWithGst = totalAddOnFeeBase + gstOnAddOnFee;
  
  const grandTotal = totalGovtFee + totalProfessionalFee + totalAddOnFeeWithGst;

  // Documents checklist
  const getDocuments = () => {
    const list = [
      { id: 'pan', label: "PAN Card of all Directors / Partners", r: true },
      { id: 'aadhaar', label: "Aadhaar Card (linked with Mobile Number)", r: true },
      { id: 'photo', label: "Passport-size Photograph of Directors", r: true },
      { id: 'bank', label: "Recent Bank Statement with current address proof", r: true },
      { id: 'noc', label: "NOC from Owner of registered office premises", r: true },
      { id: 'utility', label: "Utility Bill (Electricity/Gas/Mobile) not older than 2 months", r: true }
    ];
    if (selectedStructure === 'pvtltd' || selectedStructure === 'opc') {
      list.push({ id: 'dir_proof', label: "Proof of residence of all Directors (Voter ID/Passport/DL)", r: true });
    }
    if (selectedStructure === 'llp') {
      list.push({ id: 'llp_agree', label: "Draft Partnership Terms (for LLP Agreement)", r: true });
    }
    return list;
  };

  const toggleDoc = (id: string) => {
    setCheckedDocs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const allDocsChecked = getDocuments().every(doc => checkedDocs[doc.id]);

  // Stepper Timeline
  const timelineSteps = [
    {
      title: "1. RUN (Name Approval)",
      duration: "1-2 Days",
      desc: "Apply to MCA for approving your corporate name. Must reflect the main industrial purpose and be totally unique.",
      tip: "Avoid generic words. Standard patterns involve [Unique Brand] + [Activity] + [Private Limited]. Example: 'Ankesh Compliance Services Private Limited'."
    },
    {
      title: "2. DSC Generation",
      duration: "1 Day",
      desc: "All proposed directors must procure Class 3 Digital Signatures with e-KYC video verification for portal filings.",
      tip: "We handle this digitally. You'll obtain a secure OTP on your Aadhaar-registered mobile and do a rapid 30-second webcam video."
    },
    {
      title: "3. SPICe+ (Form 32/33/34)",
      duration: "3-4 Days",
      desc: "We file the consolidated SPICe+ form with MCA, containing detail records of PAN, TAN, DIN, EPFO, ESIC, and Professional Tax setup.",
      tip: "Requires detailed attachments of office bills & signed director consents. Precision checks prevent ROC resubmission delays."
    },
    {
      title: "4. Incorporation Certificate",
      duration: "1-2 Days",
      desc: "ROC issues the official Certificate of Incorporation (COI) stating your unique CIN, PAN, and TAN numbers.",
      tip: "Congratulations, you are legally live! This is your official ID card to commence financial operations in India."
    },
    {
      title: "5. Bank Opening & GST",
      duration: "4-7 Days",
      desc: "Set up your zero-balance corporate bank account with local partners, transfer capital, and register for GST.",
      tip: "You must complete incorporation filings (INC-20A Commencement of Business) within 180 days before starting official trading."
    },
  ];

  // Filing Deadline list
  const getFilingDeadlines = () => {
    const incYear = 2026;
    const nextYear = incYear + 1;
    return [
      {
        name: "Commencement of Business (INC-20A)",
        timeline: "Within 180 Days of Incorporation",
        consequence: "Strict penalty: ₹50,000 to Company and ₹1,000/day.",
        priority: "Critical",
        authority: "MCA (Ministry of Corporate Affairs)"
      },
      {
        name: "Income Tax Audit & Return Filing (ITR-6)",
        timeline: `By 31st October, ${nextYear}`,
        consequence: "Interest on pending taxes (1% pm) & fine up to ₹10,000.",
        priority: "High",
        authority: "Income Tax Department"
      },
      {
        name: "ROC Annual Returns (Form AOC-4 & MGT-7)",
        timeline: "Within 30 & 60 Days of AGM each Year",
        consequence: "₹100/day penalty PER form automatically added.",
        priority: "High",
        authority: "MCA / ROC"
      },
      {
        name: "Monthly/Quarterly GST Compliance (GSTR-1 & 3B)",
        timeline: "11th & 20th of every succeeding month",
        consequence: "GST portal blocking, late fees of ₹50/day (₹20 for Nil returns).",
        priority: "Medium",
        authority: "GSTN (Goods & Services Tax Network)"
      },
    ];
  };

  const handleConsultClick = () => {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="compliance-hub" className={`py-24 bg-gradient-to-b from-white to-slate-50 dark:from-darkBg dark:to-darkCard transition-all duration-1000 ${isGlowing ? 'ring-4 ring-orange-500/20 dark:ring-orange-500/10 shadow-[0_0_60px_rgba(249,115,22,0.15)] bg-orange-500/[0.01]' : ''}`}>
      <div className="container mx-auto px-6">
        
        {/* Floating Heading Inspired by elegant modern design */}
        <div className="max-w-3xl mx-auto text-center mb-20 animate-fade-in">
          <div className="flex items-center justify-center gap-1 mb-3">
            <span className="w-3 h-1 bg-orange-500 rounded-full"></span>
            <span className="w-3 h-1 bg-slate-300 dark:bg-slate-400 rounded-full"></span>
            <span className="w-3 h-1 bg-emerald-500 rounded-full"></span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-gold dark:text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3 border border-amber-500/20">
            <Building2 size={12} /> Professional Compliance Tools
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-navy dark:text-white mb-4">
            Startup <span className="text-orange-500">Incorporation</span> & Compliance <span className="text-emerald-500">Console</span>
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed font-light">
            Find transparent illustrative cost estimates (Pvt Ltd, LLP, OPC), track the step-by-step incorporation roadmap, and audit your KYC document readiness with ease.
          </p>
        </div>

        {/* 1. Structure Selection Header - Slick Tab Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
          {Object.entries(STRUCTURE_DATA).map(([key, value]) => {
            const isSelected = selectedStructure === key;
            return (
              <button 
                key={key}
                onClick={() => setSelectedStructure(key)}
                className={`relative p-6 rounded-2xl border text-left transition-all duration-300 overflow-hidden flex flex-col justify-between h-40 ${
                  isSelected 
                    ? 'bg-corporate dark:bg-darkCard text-white border-corporate dark:border-gold shadow-lg shadow-blue-900/10 ring-2 ring-corporate/20 dark:ring-gold/30' 
                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-corporate dark:hover:border-slate-700 hover:shadow-md'
                }`}
              >
                {/* Decorative background glow for active */}
                {isSelected && (
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-gold/10 dark:bg-gold/5 rounded-full blur-xl"></div>
                )}
                
                <div className="flex justify-between items-start">
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/10 text-white dark:text-gold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    {key === 'pvtltd' && <Building2 size={20} />}
                    {key === 'llp' && <Layers size={20} />}
                    {key === 'opc' && <UserCheck size={20} />}
                    {key === 'proprietor' && <Users size={20} />}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isSelected 
                      ? 'border-white/20 bg-white/10 text-white' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500'
                  }`}>
                    Compliances: {value.complianceLevel}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm leading-tight mb-1">{value.name}</h4>
                  <p className={`text-[11px] leading-snug line-clamp-2 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                    {value.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Major Grid: Planner Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
          
          {/* LEFT: Estimator Controls & Pricing (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Interactive Fee Estimator Card */}
            <div className="bg-white dark:bg-darkCard p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden backdrop-blur-sm">
              <h3 className="text-xl font-bold text-navy dark:text-white mb-6 flex items-center gap-2">
                <Calculator className="text-corporate dark:text-gold" /> Illustrative Cost Estimator (Educational Demo)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {/* State dropdown (Affects Stamp Duty) */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 dark:text-gold-light" /> State of Registration
                  </label>
                  <select 
                    value={selectedState} 
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-corporate dark:focus:border-gold"
                  >
                    {Object.keys(STATE_STAMP_MULTIPLIERS).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Stamp duty & local government schedules are state-dependent.
                  </span>
                </div>

                {/* Director slider */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                    <span>Number of Directors / Partners</span>
                    <span className="text-corporate dark:text-gold font-bold">{directors}</span>
                  </label>
                  <input 
                    type="range" 
                    min={activeStructure.minDirectors} 
                    max={activeStructure.maxDirectors} 
                    value={directors} 
                    onChange={(e) => setDirectors(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-corporate dark:accent-gold"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>Min: {activeStructure.minDirectors}</span>
                    <span>Max: {activeStructure.maxDirectors}</span>
                  </div>
                </div>

                {/* Capital input */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                    <span>Authorized Capital (INR)</span>
                    <span className="text-navy dark:text-white font-bold font-mono">₹{capital.toLocaleString('en-IN')}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setCapital(100000)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                        capital === 100000 
                          ? 'bg-corporate text-white border-corporate' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      1 Lakh (Standard)
                    </button>
                    <button 
                      onClick={() => setCapital(500000)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                        capital === 500000 
                          ? 'bg-corporate text-white border-corporate' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      5 Lakhs
                    </button>
                    <button 
                      onClick={() => setCapital(1000000)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                        capital === 1000000 
                          ? 'bg-corporate text-white border-corporate' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      10 Lakhs
                    </button>
                    <input 
                      type="number" 
                      value={capital}
                      onChange={(e) => setCapital(Math.max(10000, parseInt(e.target.value) || 0))}
                      className="flex-grow bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-2 text-sm text-right font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Additional Registrations Options (GST, MSME, PT, PF, personal ITR) */}
                <div className="sm:col-span-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Other Optional Registrations & Personal Filings
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ADD_ON_DATA.map((addon) => {
                      const isChecked = addOns[addon.id];
                      return (
                        <button
                          key={addon.id}
                          onClick={() => setAddOns(prev => ({ ...prev, [addon.id]: !prev[addon.id] }))}
                          className={`w-full text-left p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                            isChecked 
                              ? 'bg-corporate/5 dark:bg-gold/10 border-corporate dark:border-gold text-slate-800 dark:text-slate-200 shadow-sm' 
                              : 'bg-slate-100/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-750/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isChecked 
                              ? 'bg-corporate dark:bg-gold text-white border-corporate dark:border-gold' 
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950'
                          }`}>
                            {isChecked && <span className="text-[10px] select-none font-bold">✓</span>}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-bold text-xs truncate text-navy dark:text-white">{addon.name}</span>
                              <span className="font-mono text-xs text-corporate dark:text-gold font-bold shrink-0">
                                +₹{addon.fee}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-300 leading-normal mt-0.5">
                              {addon.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Specialized other setups notice */}
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl text-[10px] text-slate-500 dark:text-slate-300 leading-relaxed flex items-center justify-between gap-2">
                    <span>
                      💼 Need <strong>Import Export Code (IEC)</strong>, <strong>Trademark</strong>, <strong>FSSAI Food License</strong>, or custom payroll setups? We customize anything!
                    </span>
                    <span className="text-corporate dark:text-gold font-bold shrink-0">And many more available</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown Display Table */}
              <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="space-y-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-400 text-[11px] uppercase tracking-wider">Illustrative Cost Breakdown (Demo)</span>
                    <span className="font-bold text-slate-700 dark:text-slate-400 text-[11px] uppercase tracking-wider">Estimated Amount</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1.5">
                    <span className="flex items-center gap-1">
                      Base State filing fee 
                      <span title="ROC stamp duty & dynamic registration fee based on state list.">
                        <Info size={11} className="text-slate-400 hover:text-corporate cursor-help" />
                      </span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹{baseGovtFee}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Estimated Stamp Duty ({selectedState})</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹{estimatedStampDuty}</span>
                  </div>

                  <div className="flex justify-between pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
                    <span>Director DSC Digital Signature ({directors} Class 3 tokens)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹{dscFee}</span>
                  </div>

                  <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold font-sans text-sm">
                    <span>A. Total Government Fees (Govt Treasury):</span>
                    <span className="text-navy dark:text-white font-mono">₹{totalGovtFee}</span>
                  </div>

                  <div className="flex justify-between pt-3 text-slate-600 dark:text-slate-300 text-xs">
                    <span>Illustrative Professional Cost Component (Drafting & Review)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹{professionalFee}</span>
                  </div>

                  <div className="flex justify-between pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
                    <span>Goods & Services Tax (GST @ 18%)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">₹{gstOnProfFee}</span>
                  </div>

                  <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold font-sans text-sm pb-1.5">
                    <span>B. Illustrative Compliance Cost Estimate (incl. GST):</span>
                    <span className="text-navy dark:text-white font-mono">₹{totalProfessionalFee}</span>
                  </div>

                  {totalAddOnFeeBase > 0 && (
                    <>
                      <div className="flex justify-between pt-3 text-slate-600 dark:text-slate-300 text-xs">
                        <span>Selected Add-on base registration charges (Sample)</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">₹{totalAddOnFeeBase}</span>
                      </div>

                      <div className="flex justify-between pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
                        <span>Add-ons GST (@ 18%)</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">₹{gstOnAddOnFee}</span>
                      </div>

                      <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold font-sans text-sm pb-1.5">
                        <span>C. Sample Documentation & Filing Cost (incl. GST):</span>
                        <span className="text-navy dark:text-white font-mono">₹{totalAddOnFeeWithGst}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Main Highlighted Net Price */}
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Complete Incorporation Price</span>
                    <span className="text-3xl font-black text-navy dark:text-gold font-mono">
                      ₹{grandTotal.toLocaleString('en-IN')}
                      <span className="text-xs text-slate-500 font-normal font-sans ml-1">all inclusive</span>
                    </span>
                  </div>
                  
                  <button 
                    onClick={handleConsultClick}
                    className="flex items-center justify-center gap-2 bg-corporate hover:bg-navy dark:bg-gold dark:hover:bg-amber-600 text-white font-bold px-6 py-3.5 rounded-xl text-sm shadow-lg hover:shadow-xl dark:shadow-none transition-all active:scale-95 group"
                  >
                    Explore Startup Compliance Framework 
                    <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Informative Disclaimer */}
              <div className="mt-4 flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200/50 dark:border-yellow-900/30 rounded-xl p-3 text-[11px] text-slate-600 dark:text-yellow-250 leading-relaxed">
                <Info size={14} className="text-gold shrink-0 mt-0.5" />
                <span>
                  <strong>Educational Disclaimer:</strong> This calculator is an educational demonstration. In practice, the illustrative professional cost component covers preparation of Name selection, DSC filing, SPICe forms, MOA/AOA drafts, PAN/TAN registration, and final incorporation docket. Actual government stamp duties are based dynamically on state laws and chosen share capital.
                </span>
              </div>
            </div>

            {/* Stepper Timeline Workflow View */}
            <div className="bg-white dark:bg-darkCard p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
              <h3 className="text-xl font-bold text-navy dark:text-white mb-6 flex items-center gap-2">
                <Clock className="text-corporate dark:text-gold" /> Step-by-Step Indian Incorporation Roadmap
              </h3>

              {/* Progress Slider buttons */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 mb-6 overflow-x-auto pb-1 gap-1.5">
                {timelineSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`text-xs font-bold px-3 py-2 rounded-t-lg transition-all shrink-0 whitespace-nowrap ${
                      activeStep === idx 
                        ? 'border-b-2 border-corporate dark:border-gold text-corporate dark:text-gold bg-slate-50 dark:bg-slate-950/50' 
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    Step {idx + 1}
                  </button>
                ))}
              </div>

              {/* Step info sheet */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <h4 className="font-extrabold text-navy dark:text-white text-lg">
                    {timelineSteps[activeStep].title}
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-gold dark:text-yellow-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <Clock size={11} /> Timeline: {timelineSteps[activeStep].duration}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                  {timelineSteps[activeStep].desc}
                </p>

                {/* Expert CA Tip box */}
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border-l-4 border-corporate dark:border-gold border border-slate-200 dark:border-slate-800 flex gap-3 text-xs">
                  <span className="text-lg shrink-0 select-none">💡</span>
                  <div>
                    <span className="font-bold text-navy dark:text-white block mb-0.5">Practical Compliance Insight:</span>
                    <span className="text-slate-600 dark:text-slate-300 leading-relaxed italic">{timelineSteps[activeStep].tip}</span>
                  </div>
                </div>

                {/* Timeline progress line bar */}
                <div className="mt-8 flex items-center justify-between gap-1.5 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
                  {timelineSteps.map((_, i_idx) => (
                    <button 
                      key={i_idx}
                      onClick={() => setActiveStep(i_idx)}
                      className={`relative z-10 w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center border transition-all ${
                        i_idx <= activeStep
                          ? 'bg-corporate border-corporate text-white dark:bg-gold dark:border-gold dark:text-navy shadow-md shadow-amber-500/10'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {i_idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Documents Checker & Upcoming Deadlines Tracker (5 Cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Dynamic Documents Required Box */}
            <div className="bg-white dark:bg-darkCard p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl font-sans">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-navy dark:text-white flex items-center gap-2">
                  <ClipboardCheck className="text-corporate dark:text-gold" /> KYC & Premises Docs Checklist
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Check off items you already hold to audit your incorporation readiness. Based on current Ministry of Corporate Affairs regulations.
              </p>

              <div className="space-y-3.5 mb-6">
                {getDocuments().map((doc) => {
                  const isChecked = checkedDocs[doc.id] || false;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => toggleDoc(doc.id)}
                      className={`w-full text-left p-4 rounded-xl border flex items-center gap-3.5 transition-all text-sm ${
                        isChecked 
                          ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/50 dark:border-emerald-500/30 text-slate-800 dark:text-slate-200 shadow-sm' 
                          : 'bg-white dark:bg-slate-950 border-slate-250 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isChecked 
                          ? 'bg-emerald-500 dark:bg-emerald-500 text-white border-emerald-500' 
                          : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        {isChecked && <CheckCircle2 size={13} className="text-white fill-white" />}
                      </div>
                      <span className="leading-snug">{doc.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Progress Summary bottom panel */}
              <div className={`rounded-2xl p-5 border text-center transition-all duration-300 ${
                allDocsChecked 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {allDocsChecked ? (
                  <div>
                    <span className="text-sm font-extrabold block mb-1">🎉 Audit Compliant & Ready!</span>
                    <span className="text-xs italic leading-relaxed block text-slate-600 dark:text-slate-300">
                      All basic documents are accounted for. We can submit the SPICe+ dossier immediately upon name approval!
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-bold block mb-1">KYC Audit Readiness Percentage</span>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-corporate dark:bg-gold transition-all duration-500"
                        style={{ width: `${Math.round((getDocuments().filter(d => checkedDocs[d.id]).length / getDocuments().length) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] mt-1.5 block font-mono text-slate-400 dark:text-slate-500">
                      {getDocuments().filter(d => checkedDocs[d.id]).length} of {getDocuments().length} items checked
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Simulated Mandatory Compliance Deadlines Card */}
            <div className="bg-white dark:bg-darkCard p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
              <h3 className="text-xl font-bold text-navy dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="text-corporate dark:text-gold" /> First-Year Compliance Deadlines
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Fulfilling post-incorporation filing guidelines avoids massive MCA penalty costs and director disqualification risks.
              </p>

              <div className="space-y-4">
                {getFilingDeadlines().map((filing, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-xs font-extrabold text-navy dark:text-white tracking-tight leading-snug">
                        {filing.name}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        filing.priority === 'Critical' 
                          ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20' 
                          : filing.priority === 'High'
                            ? 'bg-amber-500/10 text-gold dark:text-yellow-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-corporate dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {filing.priority}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                      <div className="flex justify-between">
                        <span>Filing Window:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{filing.timeline}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Governing Body:</span>
                        <span>{filing.authority}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60 pb-0.5 text-[10px] text-slate-600 dark:text-slate-300 flex gap-1.5 leading-snug">
                      <ShieldAlert size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-navy dark:text-white">Late filing penalty:</strong> {filing.consequence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
        
        {/* Live CTA Section Inspired by clean web design spacing */}
        <div className="mt-16 bg-gradient-to-r from-corporate to-navy dark:from-slate-900 dark:to-slate-950 border border-corporate/30 dark:border-slate-800/80 p-8 md:p-12 rounded-3xl max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-60 h-60 bg-gold/10 dark:bg-gold/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 text-center md:text-left">
            <h4 className="text-2xl font-extrabold text-white mb-2">
              Ready to incorporate correctly, the first time?
            </h4>
            <p className="text-slate-200 text-sm max-w-xl font-light">
              Don't risk hefty government penalties. Let's draft your SPICe+ MOA / AOA charters with professional precision and clear statutory timelines.
            </p>
          </div>
          
          <button 
            onClick={handleConsultClick}
            className="shrink-0 relative group inline-flex justify-center items-center gap-2 bg-gold hover:bg-amber-500 text-navy px-8 py-4 rounded-xl font-extrabold text-sm transition-all shadow-lg shadow-gold/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            Connect With Me <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </section>
  );
}
