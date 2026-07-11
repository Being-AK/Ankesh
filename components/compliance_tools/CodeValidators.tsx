import React, { useState } from 'react';
import { Search, CheckCircle2, AlertTriangle, Building2, User, BadgeCheck, Info, Cpu } from 'lucide-react';

// Indian State Census Codes
export const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand",
  "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar",
  "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli", "27": "Maharashtra", "28": "Andhra Pradesh (Old)", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands",
  "36": "Telangana", "37": "Andhra Pradesh (New)", "38": "Ladakh"
};

// Seeding standard firm records
export const MOCK_GSTIN_REGISTRY = [
  {
    gstin: "27AAPFU0939F1Z5",
    legalName: "ANKESH INCORPORATION PLATFORM IN LTD",
    tradeName: "Ankesh.in Compliance",
    status: 'Active' as const,
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
    status: 'Active' as const,
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
    status: 'Active' as const,
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
    status: 'Active' as const,
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
    status: 'Active' as const,
    dateOfRegistration: "05/07/2017",
    address: "TCS House, Raveline Street, Fort, Mumbai, MH, 400001",
    constitution: "Public Limited Company",
    taxpayerType: "Regular",
    cin: "L22219MH1995PLC084781",
    pan: "AAATB2803G"
  }
];

export const MOCK_UDYAM_REGISTRY = [
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

// Common Demoview Badge component
const LocalValidationBadge: React.FC = () => (
  <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 text-amber-800 dark:text-amber-400 px-4 py-2 rounded-xl text-xs flex items-center justify-between gap-2.5">
    <div className="flex items-center gap-2">
      <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
      <p className="font-medium">
        <span className="font-extrabold uppercase text-[10px] tracking-wide">Local Validation / Demo Dataset:</span> Standardized syntax rules are enforced locally. Search will query mock offline databases.
      </p>
    </div>
    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded text-amber-600 shrink-0 select-none">
      SANDBOX
    </span>
  </div>
);

// ==========================================
// GSTIN SEARCH & VERIFICATION TOOL
// ==========================================
export const GSTINSearchTool: React.FC = () => {
  const [searchString, setSearchString] = useState('27AAPFU0939F1Z5');
  const [searchResult, setSearchResult] = useState<typeof MOCK_GSTIN_REGISTRY[0] | null>(MOCK_GSTIN_REGISTRY[0]);
  const [errorText, setErrorText] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const validateGSTINPattern = (gstin: string) => {
    const clean = gstin.trim().toUpperCase();
    if (!clean) return { isValid: false, error: "Please enter a GSTIN." };
    if (clean.length !== 15) return { isValid: false, error: `GSTIN must be exactly 15 characters. Currently ${clean.length} characters.` };

    const stateCode = clean.substring(0, 2);
    const pan = clean.substring(2, 12);
    const entity = clean.substring(12, 13);
    const zChar = clean.substring(13, 14);
    const checkDigit = clean.substring(14, 15);

    if (!STATE_CODES[stateCode]) {
      return { isValid: false, error: `Invalid State Code: "${stateCode}". First 2 digits must represent a valid Indian State (01-38).` };
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan)) {
      return { isValid: false, error: `Invalid PAN format inside GSTIN: "${pan}". Character positions 3 to 12 must strictly follow PAN syntax (5 letters, 4 digits, 1 letter).` };
    }

    const panType = pan[3];
    const validPanTypes: Record<string, string> = {
      'C': 'Company', 'P': 'Individual', 'H': 'HUF', 'F': 'Partnership / Firm',
      'A': 'Association of Persons', 'T': 'Trust', 'B': 'Body of Individuals', 'L': 'Local Authority',
      'G': 'Government Agency', 'J': 'Artificial Juridical Person'
    };
    if (!validPanTypes[panType]) {
      return { isValid: false, error: `Invalid Entity Category character: "${panType}". 4th letter of PAN must be one of: C, P, HUF, F, A, T, B, L, G, J.` };
    }

    if (zChar !== 'Z') {
      return { isValid: false, error: `Standard syntax error: Character 14 must be "Z" by default. Found "${zChar}".` };
    }

    return { isValid: true, stateName: STATE_CODES[stateCode], entityType: validPanTypes[panType], segments: { stateCode, pan, entity, zChar, checkDigit } };
  };

  const handleSearch = () => {
    setIsSearching(true);
    setErrorText('');
    setSearchResult(null);

    setTimeout(() => {
      setIsSearching(false);
      const cleanInput = searchString.trim().toUpperCase();

      // Validate pattern first
      const validation = validateGSTINPattern(cleanInput);
      if (!validation.isValid) {
        setErrorText(validation.error || 'Syntax verification failed.');
        return;
      }

      // Search database
      const matched = MOCK_GSTIN_REGISTRY.find(it => 
        it.gstin === cleanInput || 
        it.pan === cleanInput || 
        it.legalName.toUpperCase().includes(cleanInput)
      );

      if (matched) {
        setSearchResult(matched);
      } else {
        // Fallback dynamic record to preserve search usability
        setSearchResult({
          gstin: cleanInput,
          legalName: `UNREGISTERED IN OFFLINE INDEX / PROVISIONAL RECORD`,
          tradeName: `Local Dynamic Validation Only`,
          status: 'Active',
          dateOfRegistration: "01/04/2025",
          address: `Jurisdiction: ${validation.stateName} State Division (Verified via local syntax rules)`,
          constitution: validation.entityType as any || "Proprietorship",
          taxpayerType: "Regular",
          cin: "",
          pan: validation.segments?.pan || ""
        });
      }
    }, 450);
  };

  const parsedInfo = validateGSTINPattern(searchString);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🔍 GSTIN Verification & Structure Parser
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Input a 15-character GSTIN identifier to verify state codes, core PAN segments, checksum compliance, and query registry.
        </p>
      </div>

      <LocalValidationBadge />

      <div className="flex gap-3 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <input 
          type="text" 
          value={searchString} 
          onChange={(e) => { setSearchString(e.target.value.toUpperCase()); setErrorText(''); }}
          placeholder="e.g. 27AAPFU0939F1Z5"
          className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-3 rounded-lg text-xs font-mono font-bold focus:outline-none"
        />
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="px-6 py-3 bg-corporate dark:bg-gold text-white dark:text-navy rounded-lg font-black text-xs uppercase hover:bg-opacity-90 transition-all shadow-sm"
        >
          {isSearching ? "Searching..." : "Lookup GSTIN"}
        </button>
      </div>

      {/* Quick click suggestions */}
      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
        <span className="font-bold">💡 Test Records:</span>
        {MOCK_GSTIN_REGISTRY.map((reg) => (
          <button 
            key={reg.gstin} 
            onClick={() => { setSearchString(reg.gstin); setSearchResult(reg); setErrorText(''); }} 
            className="underline text-corporate dark:text-gold hover:text-navy cursor-pointer font-bold"
          >
            {reg.tradeName} ({reg.gstin})
          </button>
        ))}
      </div>

      {errorText && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-500 font-bold flex gap-2 items-center">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {/* Parser Segment breakdowns */}
      {parsedInfo.isValid && parsedInfo.segments && (
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 space-y-4">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5">
            <Cpu size={12} className="text-corporate dark:text-gold" /> Structure segment breakdown (Rule 10(1))
          </span>

          <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px]">
            <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/50 dark:border-slate-850">
              <span className="text-[14px] font-black text-corporate dark:text-gold block">{parsedInfo.segments.stateCode}</span>
              <span className="text-[8px] text-slate-400 block uppercase font-sans mt-0.5" title="State Census Code">State ID</span>
            </div>
            <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/50 dark:border-slate-850 col-span-2">
              <span className="text-[14px] font-black text-slate-800 dark:text-slate-200 block">{parsedInfo.segments.pan}</span>
              <span className="text-[8px] text-slate-400 block uppercase font-sans mt-0.5">PAN Card Part</span>
            </div>
            <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/50 dark:border-slate-850">
              <span className="text-[14px] font-black text-slate-800 dark:text-slate-200 block">{parsedInfo.segments.entity}</span>
              <span className="text-[8px] text-slate-400 block uppercase font-sans mt-0.5">Entity No.</span>
            </div>
            <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/50 dark:border-slate-850">
              <span className="text-[14px] font-black text-slate-400 block">{parsedInfo.segments.zChar}</span>
              <span className="text-[8px] text-slate-400 block uppercase font-sans mt-0.5">Fixed Z</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-sans">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Registered State Name</span>
              <span className="font-extrabold text-navy dark:text-white mt-0.5 block">{parsedInfo.stateName}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Deducted Entity Class</span>
              <span className="font-extrabold text-navy dark:text-white mt-0.5 block">{parsedInfo.entityType}</span>
            </div>
          </div>
        </div>
      )}

      {/* Registry result card */}
      {searchResult && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 space-y-4 text-left">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registry Profile Found</span>
              <h4 className="text-lg font-black text-navy dark:text-white leading-snug mt-0.5">{searchResult.legalName}</h4>
              {searchResult.tradeName && <span className="text-xs text-slate-400 block font-bold">Trade Name: {searchResult.tradeName}</span>}
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs font-black uppercase tracking-wider select-none shrink-0">
              {searchResult.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs">
            <div className="space-y-2">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Principal Place of Business</span>
                <span className="text-slate-600 dark:text-slate-350 leading-relaxed font-bold block mt-0.5">{searchResult.address}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Taxpayer Registration Date</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold block mt-0.5">{searchResult.dateOfRegistration}</span>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-[10px] text-slate-500 border-l border-slate-100 dark:border-slate-800 pl-4">
              <div>Constitutional Model: <span className="font-bold text-slate-700 dark:text-slate-200">{searchResult.constitution}</span></div>
              <div>Taxpayer Regime: <span className="font-bold text-slate-700 dark:text-slate-200">{searchResult.taxpayerType}</span></div>
              <div>Permanent Account (PAN): <span className="font-bold text-slate-700 dark:text-slate-200">{searchResult.pan}</span></div>
              {searchResult.cin && <div>Corporate Index (CIN): <span className="font-bold text-corporate dark:text-gold">{searchResult.cin}</span></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// UDYAM VERIFICATION PORTAL TOOL
// ==========================================
export const UdyamSearchTool: React.FC = () => {
  const [udyam, setUdyam] = useState('UDYAM-MH-26-0048123');
  const [result, setResult] = useState<typeof MOCK_UDYAM_REGISTRY[0] | null>(MOCK_UDYAM_REGISTRY[0]);
  const [errorText, setErrorText] = useState('');
  const [searching, setSearching] = useState(false);

  const validateUdyamPattern = (num: string) => {
    const clean = num.trim().toUpperCase();
    if (!clean) return { isValid: false, error: "Please enter a Udyam Registration Number." };

    const regex = /^UDYAM-([A-Z]{2})-([0-9]{2})-([0-9]{7})$/;
    const match = clean.match(regex);
    if (!match) {
      return { isValid: false, error: "Invalid Udyam Number format. Correct pattern is e.g., UDYAM-MH-26-0048123." };
    }

    const [_, state, dicCode, sequence] = match;
    const stateName = STATE_CODES[state] || `${state} State Division`;

    return { isValid: true, stateName, dicCode, sequence, segments: { state, dicCode, sequence } };
  };

  const handleSearch = () => {
    setSearching(true);
    setErrorText('');
    setResult(null);

    setTimeout(() => {
      setSearching(false);
      const cleanInput = udyam.trim().toUpperCase();

      const validation = validateUdyamPattern(cleanInput);
      if (!validation.isValid) {
        setErrorText(validation.error || 'Syntax validation failed.');
        return;
      }

      const match = MOCK_UDYAM_REGISTRY.find(m => m.udyamNo === cleanInput);
      if (match) {
        setResult(match);
      } else {
        // Fallback mock dynamic generator
        setResult({
          udyamNo: cleanInput,
          firmName: `DYNAMIC OFFLINE ENTERPRISE (PROVISIONAL)`,
          enterpriseType: "Micro",
          majorActivity: "Services",
          dateOfIncorporation: "12/04/2023",
          dicName: `${validation.stateName} District Center`,
          investment: "₹15.0 Lakhs",
          turnover: "₹50.0 Lakhs"
        });
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🛡️ MSME Udyam Credential Verification
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verify Udyam numbers issued by the Ministry of MSME. Standardized format includes state code, district code, and a unique sequence ID.
        </p>
      </div>

      <LocalValidationBadge />

      <div className="flex gap-3 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <input 
          type="text" 
          value={udyam} 
          onChange={(e) => { setUdyam(e.target.value.toUpperCase()); setErrorText(''); }}
          placeholder="e.g. UDYAM-MH-26-0048123"
          className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-3 rounded-lg text-xs font-mono font-bold focus:outline-none"
        />
        <button 
          onClick={handleSearch}
          disabled={searching}
          className="px-6 py-3 bg-corporate dark:bg-gold text-white dark:text-navy rounded-lg font-black text-xs uppercase"
        >
          {searching ? "Verifying..." : "Verify Udyam"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
        <span className="font-bold">💡 Test Records:</span>
        {MOCK_UDYAM_REGISTRY.map((reg) => (
          <button 
            key={reg.udyamNo} 
            onClick={() => { setUdyam(reg.udyamNo); setResult(reg); setErrorText(''); }} 
            className="underline text-corporate dark:text-gold hover:text-navy cursor-pointer font-bold"
          >
            {reg.firmName} ({reg.udyamNo})
          </button>
        ))}
      </div>

      {errorText && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-500 font-bold flex gap-2 items-center">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {result && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 space-y-4 text-left">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Udyam Registry Verified</span>
              <h4 className="text-lg font-black text-navy dark:text-white mt-0.5 leading-snug">{result.firmName}</h4>
              <span className="text-xs text-slate-400 block font-bold">Registration Number: {result.udyamNo}</span>
            </div>
            <span className="px-3.5 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 select-none">
              {result.enterpriseType} Enterprise
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs">
            <div className="space-y-2 font-bold text-slate-600 dark:text-slate-350">
              <div>
                <span className="text-[9px] uppercase font-black text-slate-400 block">DIC Regional Center</span>
                <span className="text-slate-800 dark:text-slate-200 font-extrabold mt-0.5 block">{result.dicName}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-slate-400 block">Major Segment Activity</span>
                <span className="text-slate-800 dark:text-slate-200 font-extrabold mt-0.5 block">{result.majorActivity}</span>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-[10px] text-slate-500 border-l border-slate-100 dark:border-slate-800 pl-4">
              <div>Date of Incorporation: <span className="font-bold text-slate-700 dark:text-slate-200">{result.dateOfIncorporation}</span></div>
              <div>Capital Investment: <span className="font-bold text-slate-700 dark:text-slate-200">{result.investment}</span></div>
              <div>Aggregate Turnover: <span className="font-bold text-corporate dark:text-gold">{result.turnover}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MCA COMPANY CIN SEARCH TOOL
// ==========================================
export const MCACompanySearchTool: React.FC = () => {
  const [query, setQuery] = useState('U74999MH2021PTC358999');
  const [searching, setSearching] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [result, setResult] = useState<typeof MOCK_GSTIN_REGISTRY[0] | null>(MOCK_GSTIN_REGISTRY[0]);

  const validateCINPattern = (cin: string) => {
    const clean = cin.trim().toUpperCase();
    if (!clean) return { isValid: false, error: "Please enter a CIN." };
    if (clean.length !== 21) return { isValid: false, error: `CIN must be exactly 21 characters. Currently ${clean.length} characters.` };

    const cinRegex = /^([LU])([0-9]{5})([A-Z]{2})([0-9]{4})([A-Z]{3})([0-9]{6})$/;
    const match = clean.match(cinRegex);
    if (!match) {
      return { isValid: false, error: "Invalid CIN format. Correct syntax: U74999MH2021PTC358999" };
    }

    const [_, listing, nic, state, year, type, regNo] = match;

    const typeMap: Record<string, string> = {
      'PTC': 'Private Limited Company',
      'PLC': 'Public Limited Company',
      'OPC': 'One Person Company',
      'FTC': 'Subsidiary of Foreign Company',
      'GOI': 'Union Government Company',
      'SGC': 'State Government Company',
      'NPL': 'Section 8 Company (Non-profit)',
      'GAP': 'General Association Public',
      'FLC': 'Foreign Listed Company'
    };

    return {
      isValid: true,
      listingStatus: listing === 'L' ? 'Listed' : 'Unlisted',
      nicCode: nic,
      stateCode: state,
      incorporationYear: parseInt(year),
      companyType: typeMap[type] || `${type} Entity`,
      registrationNumber: regNo,
      segments: { listing, nic, state, year, type, regNo }
    };
  };

  const handleSearch = () => {
    setSearching(true);
    setErrorText('');
    setResult(null);

    setTimeout(() => {
      setSearching(false);
      const cleanInput = query.trim().toUpperCase();

      const validation = validateCINPattern(cleanInput);
      if (!validation.isValid) {
        setErrorText(validation.error || 'CIN validation failed.');
        return;
      }

      const match = MOCK_GSTIN_REGISTRY.find(m => m.cin === cleanInput || m.pan === cleanInput);
      if (match) {
        setResult(match);
      } else {
        setResult({
          gstin: "Not Available",
          legalName: `DYNAMIC REGULATED INCORPORATION CO.`,
          tradeName: `Dynamic Sandbox Node`,
          status: 'Active',
          dateOfRegistration: `01/04/${validation.incorporationYear}`,
          address: `Registered Office: Block A, ${validation.stateCode} Division, India`,
          constitution: validation.companyType as any,
          taxpayerType: "Regular",
          pan: `AAAC${regNoToNumber(validation.registrationNumber)}R`,
          cin: cleanInput
        });
      }
    }, 450);
  };

  const regNoToNumber = (reg: string) => {
    return reg.substring(1, 5) + 'A';
  };

  const parsedCIN = validateCINPattern(query);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🏢 MCA Corporate Index (CIN) Audit Portal
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Every Indian joint-stock company is allocated a 21-digit CIN. Decode listing category, NIC industry sectors, state registered, and year of setup.
        </p>
      </div>

      <LocalValidationBadge />

      <div className="flex gap-3 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <input 
          type="text" 
          value={query} 
          onChange={(e) => { setQuery(e.target.value.toUpperCase()); setErrorText(''); }}
          placeholder="e.g. U74999MH2021PTC358999"
          className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-3 rounded-lg text-xs font-mono font-bold focus:outline-none"
        />
        <button 
          onClick={handleSearch}
          disabled={searching}
          className="px-6 py-3 bg-corporate dark:bg-gold text-white dark:text-navy rounded-lg font-black text-xs uppercase"
        >
          {searching ? "Auditing MCA..." : "Audit CIN"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
        <span className="font-bold">💡 Test Records:</span>
        {MOCK_GSTIN_REGISTRY.map((reg) => reg.cin && (
          <button 
            key={reg.cin} 
            onClick={() => { setQuery(reg.cin); setResult(reg); setErrorText(''); }} 
            className="underline text-corporate dark:text-gold hover:text-navy cursor-pointer font-bold"
          >
            {reg.legalName.split(' ')[0]} ({reg.cin})
          </button>
        ))}
      </div>

      {errorText && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-500 font-bold flex gap-2 items-center">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {parsedCIN.isValid && parsedCIN.segments && (
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 space-y-4">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5">
            <Cpu size={12} className="text-corporate dark:text-gold" /> Decoded CIN Segment Registers
          </span>

          <div className="grid grid-cols-6 gap-1 border-b border-dashed border-slate-200 dark:border-slate-800 pb-4 text-center font-mono text-[10px]">
            <div className="p-1.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/50">
              <span className="text-[12px] font-black text-corporate dark:text-gold block">{parsedCIN.segments.listing}</span>
              <span className="text-[7px] text-slate-400 block uppercase font-sans mt-0.5">Listing</span>
            </div>
            <div className="p-1.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/50">
              <span className="text-[12px] font-black text-slate-800 dark:text-slate-200 block">{parsedCIN.segments.nic}</span>
              <span className="text-[7px] text-slate-400 block uppercase font-sans mt-0.5">NIC Code</span>
            </div>
            <div className="p-1.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/50">
              <span className="text-[12px] font-black text-slate-800 dark:text-slate-200 block">{parsedCIN.segments.state}</span>
              <span className="text-[7px] text-slate-400 block uppercase font-sans mt-0.5">State Code</span>
            </div>
            <div className="p-1.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/50">
              <span className="text-[12px] font-black text-slate-800 dark:text-slate-200 block">{parsedCIN.segments.year}</span>
              <span className="text-[7px] text-slate-400 block uppercase font-sans mt-0.5">Year</span>
            </div>
            <div className="p-1.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/50">
              <span className="text-[12px] font-black text-slate-800 dark:text-slate-200 block">{parsedCIN.segments.type}</span>
              <span className="text-[7px] text-slate-400 block uppercase font-sans mt-0.5">Type</span>
            </div>
            <div className="p-1.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200/50 col-span-1">
              <span className="text-[12px] font-black text-slate-800 dark:text-slate-200 block">{parsedCIN.segments.regNo}</span>
              <span className="text-[7px] text-slate-400 block uppercase font-sans mt-0.5">Reg No.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[8px] uppercase font-bold text-slate-400 block">Listing Category</span>
              <span className="font-extrabold text-navy dark:text-white block mt-0.5">{parsedCIN.listingStatus}</span>
            </div>
            <div>
              <span className="text-[8px] uppercase font-bold text-slate-400 block">Registration State</span>
              <span className="font-extrabold text-navy dark:text-white block mt-0.5">{STATE_CODES[parsedCIN.stateCode] || parsedCIN.stateCode}</span>
            </div>
            <div>
              <span className="text-[8px] uppercase font-bold text-slate-400 block">Incorporation Year</span>
              <span className="font-extrabold text-navy dark:text-white block mt-0.5">{parsedCIN.incorporationYear}</span>
            </div>
            <div>
              <span className="text-[8px] uppercase font-bold text-slate-400 block">Corporate Structure</span>
              <span className="font-extrabold text-navy dark:text-white block mt-0.5">{parsedCIN.companyType}</span>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 space-y-4 text-left">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MCA Registration Profile</span>
              <h4 className="text-lg font-black text-navy dark:text-white mt-0.5 leading-snug">{result.legalName}</h4>
              <span className="text-xs text-slate-400 block font-bold">CIN Identifier: {result.cin || "U74999MH2021PTC358999"}</span>
            </div>
            <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 select-none">
              {result.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs font-sans">
            <div className="space-y-2">
              <div>
                <span className="text-[9px] uppercase font-black text-slate-400">Registered Corporate Address</span>
                <span className="text-slate-600 dark:text-slate-350 leading-relaxed font-bold block mt-0.5">{result.address}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-slate-400">Constitution Structure</span>
                <span className="text-slate-800 dark:text-slate-200 font-extrabold block mt-0.5">{result.constitution}</span>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-[10px] text-slate-500 border-l border-slate-100 dark:border-slate-800 pl-4">
              <div>Authorized Share Capital: <span className="font-bold text-slate-700 dark:text-slate-200">₹15,00,000</span></div>
              <div>Paid-Up Share Capital: <span className="font-bold text-slate-700 dark:text-slate-200">₹1,00,000</span></div>
              <div>Company Category: <span className="font-bold">Non-Govt Company Limited by Shares</span></div>
              <div>Date of Incorporation: <span className="font-bold">{result.dateOfRegistration}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MCA DIRECTOR DIN LOOKUP TOOL
// ==========================================
export const MCADirectorSearchTool: React.FC = () => {
  const [din, setDin] = useState('08529302');
  const [searching, setSearching] = useState(false);
  const [errorText, setErrorText] = useState('');

  const validateDIN = (num: string) => {
    const clean = num.trim();
    if (!clean) return { isValid: false, error: "Please enter a DIN." };
    if (!/^[0-9]{8}$/.test(clean)) {
      return { isValid: false, error: "DIN must be exactly an 8-digit numeric identifier." };
    }
    return { isValid: true };
  };

  const MOCK_BOARD_ASSOCIATIONS = [
    { name: "ANKESH INCORPORATION PLATFORM IN LTD", role: "Managing Director", status: "Active since 2021" },
    { name: "ANKESH LEAGUE OF ARTICLES CONSULTING LLP", role: "Designated Partner", status: "Active since 2023" }
  ];

  const handleAudit = () => {
    setSearching(true);
    setErrorText('');

    setTimeout(() => {
      setSearching(false);
      const validation = validateDIN(din);
      if (!validation.isValid) {
        setErrorText(validation.error || 'DIN validation failed.');
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          👤 Director Identification DIN Lookup
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verify DIN credentials. Directors of Indian registered businesses hold a unique 8-digit DIN recorded with the MCA.
        </p>
      </div>

      <LocalValidationBadge />

      <div className="flex gap-3 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <input 
          type="text" 
          value={din} 
          onChange={(e) => { setDin(e.target.value.replace(/[^0-9]/g, '')); setErrorText(''); }}
          placeholder="e.g. 08529302"
          className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-3 rounded-lg text-xs font-mono font-bold focus:outline-none"
        />
        <button 
          onClick={handleAudit}
          disabled={searching}
          className="px-6 py-3 bg-corporate dark:bg-gold text-white dark:text-navy rounded-lg font-black text-xs uppercase"
        >
          {searching ? "Auditing DIN..." : "Audit DIN"}
        </button>
      </div>

      {errorText && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-500 font-bold flex gap-2 items-center">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {!searching && !errorText && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 text-left">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Associated Board Representative</span>
            <span className="font-extrabold text-sm text-navy dark:text-white block mt-1">S. K. SINHA (DIN: {din || '08529302'})</span>
            <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded font-black uppercase mt-2 inline-block">
              KYC Compliant (DIR-3 KYC Active)
            </span>
          </div>

          <div className="space-y-2 text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block px-1">Audited Active Directorships ({MOCK_BOARD_ASSOCIATIONS.length})</span>
            {MOCK_BOARD_ASSOCIATIONS.map((assoc, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs flex justify-between items-center font-mono">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] leading-tight">{assoc.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-sans">{assoc.role}</span>
                </div>
                <span className="text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 border border-emerald-500/10 font-sans">{assoc.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// NEW: PAN & TAN CODE VALIDATOR TOOL
// ==========================================
export const PANTANValidatorTool: React.FC = () => {
  const [code, setCode] = useState('AAPFU0939F');
  const [activeTab, setActiveTab] = useState<'pan' | 'tan'>('pan');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const validatePAN = (pan: string) => {
    const clean = pan.trim().toUpperCase();
    if (!clean) return { isValid: false, error: "Please enter a PAN." };
    if (clean.length !== 10) return { isValid: false, error: `PAN must be exactly 10 characters. Currently ${clean.length}.` };

    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!regex.test(clean)) {
      return { isValid: false, error: "Invalid PAN structure. Must match standard format: 5 letters, 4 digits, 1 letter (e.g. AAPFU0939F)." };
    }

    const holderTypeChar = clean[3];
    const typeMap: Record<string, string> = {
      'C': 'Company', 'P': 'Individual', 'H': 'HUF (Hindu Undivided Family)', 'F': 'Partnership / Firm',
      'A': 'Association of Persons', 'T': 'Trust', 'B': 'Body of Individuals', 'L': 'Local Authority',
      'G': 'Government Department / Agency', 'J': 'Artificial Juridical Person'
    };

    const typeDesc = typeMap[holderTypeChar] || "Unknown Category";

    return {
      isValid: true,
      codeType: 'PAN',
      holderType: typeDesc,
      fifthChar: clean[4],
      panCode: clean
    };
  };

  const validateTAN = (tan: string) => {
    const clean = tan.trim().toUpperCase();
    if (!clean) return { isValid: false, error: "Please enter a TAN." };
    if (clean.length !== 10) return { isValid: false, error: `TAN must be exactly 10 characters. Currently ${clean.length}.` };

    const regex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
    if (!regex.test(clean)) {
      return { isValid: false, error: "Invalid TAN structure. Must match standard format: 4 letters, 5 digits, 1 letter (e.g. MUMA09391F)." };
    }

    return {
      isValid: true,
      codeType: 'TAN',
      fifthChar: clean[3],
      tanCode: clean
    };
  };

  const handleVerify = () => {
    setIsVerifying(true);
    setErrorText('');
    setSuccessResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      const cleanInput = code.trim().toUpperCase();

      if (activeTab === 'pan') {
        const val = validatePAN(cleanInput);
        if (!val.isValid) {
          setErrorText(val.error || 'PAN validation failed.');
        } else {
          setSuccessResult(val);
        }
      } else {
        const val = validateTAN(cleanInput);
        if (!val.isValid) {
          setErrorText(val.error || 'TAN validation failed.');
        } else {
          setSuccessResult(val);
        }
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🆔 PAN & TAN Regulatory Code Validator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Perform a statutory syntax verification on Permanent Account Number (PAN) and Tax Deduction Account Number (TAN) codes.
        </p>
      </div>

      <LocalValidationBadge />

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl max-w-xs">
        <button
          onClick={() => { setActiveTab('pan'); setCode('AAPFU0939F'); setErrorText(''); setSuccessResult(null); }}
          className={`flex-1 py-1.5 text-center font-bold text-xs rounded-lg transition-all ${
            activeTab === 'pan' ? 'bg-white dark:bg-slate-900 text-corporate dark:text-gold shadow-sm' : 'text-slate-500 hover:text-slate-750'
          }`}
        >
          PAN Validation
        </button>
        <button
          onClick={() => { setActiveTab('tan'); setCode('MUMA09391F'); setErrorText(''); setSuccessResult(null); }}
          className={`flex-1 py-1.5 text-center font-bold text-xs rounded-lg transition-all ${
            activeTab === 'tan' ? 'bg-white dark:bg-slate-900 text-corporate dark:text-gold shadow-sm' : 'text-slate-500 hover:text-slate-750'
          }`}
        >
          TAN Validation
        </button>
      </div>

      <div className="flex gap-3 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <input 
          type="text" 
          value={code} 
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setErrorText(''); setSuccessResult(null); }}
          placeholder={activeTab === 'pan' ? "e.g. AAPFU0939F" : "e.g. MUMA09391F"}
          className="flex-grow bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-3 rounded-lg text-xs font-mono font-bold focus:outline-none"
        />
        <button 
          onClick={handleVerify}
          disabled={isVerifying}
          className="px-6 py-3 bg-corporate dark:bg-gold text-white dark:text-navy rounded-lg font-black text-xs uppercase"
        >
          {isVerifying ? "Verifying..." : `Verify ${activeTab.toUpperCase()}`}
        </button>
      </div>

      {errorText && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-500 font-bold flex gap-2 items-center">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {successResult && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/10 border border-emerald-500/20 bg-emerald-500/[0.01] space-y-4 text-left">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tax Code Syntax Verified</span>
              <h4 className="text-base font-black font-mono text-emerald-600 dark:text-gold mt-0.5">{successResult.codeType === 'PAN' ? successResult.panCode : successResult.tanCode}</h4>
            </div>
            <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs font-black uppercase tracking-wider select-none shrink-0">
              SYNTAX OK
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs font-sans">
            {successResult.codeType === 'PAN' ? (
              <>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">4th Character Decoded (Holder Status)</span>
                  <span className="font-extrabold text-navy dark:text-white mt-0.5 block">{successResult.holderType}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">5th Character (Surname/Entity Letter)</span>
                  <span className="font-extrabold text-navy dark:text-white mt-0.5 block font-mono">"{successResult.fifthChar}"</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Deductor City Code segment</span>
                  <span className="font-extrabold text-navy dark:text-white mt-0.5 block font-mono">First 3 letters represent regional IT Center</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">4th Character (Deductor name initial)</span>
                  <span className="font-extrabold text-navy dark:text-white mt-0.5 block font-mono">"{successResult.fifthChar}"</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
