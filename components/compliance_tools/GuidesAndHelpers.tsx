import React from 'react';
import { FileText, Layers, BadgeCheck, Coins, CheckCircle2, Info } from 'lucide-react';

// ==========================================
// GSTIN REGISTRATION GUIDE
// ==========================================
export const GSTINRegGuide: React.FC = () => {
  return (
    <div className="space-y-6" id="gst-registration-guide">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          📝 GST Registration Process Roadmap (FY 2025–26)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Learn how to apply for a new GSTIN, key mandatory document files, and state-wise threshold registration rules.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 text-xs text-slate-700 dark:text-slate-350 space-y-2">
          <strong className="text-navy dark:text-white flex items-center gap-1">
            <Info size={14} className="text-amber-500" /> Statutory Registration Thresholds:
          </strong>
          <ul className="list-disc list-inside space-y-1.5 text-[11px] font-bold">
            <li><span className="text-corporate dark:text-gold">Supply of Goods:</span> Mandatory registration if aggregate annual turnover exceeds ₹40 Lakhs (₹20 Lakhs for Special Category Hill/North-East states).</li>
            <li><span className="text-corporate dark:text-gold">Supply of Services:</span> Mandatory registration if aggregate annual turnover exceeds ₹20 Lakhs (₹10 Lakhs for Special Category Hill/North-East states).</li>
            <li><span className="text-red-500">No Limit Thresholds:</span> Mandatory registration regardless of turnover for Inter-State outward suppliers, Casual Taxable Persons, Non-Resident Taxable Persons, and e-commerce suppliers.</li>
          </ul>
        </div>

        <div className="border-l-2 border-corporate dark:border-gold pl-4 space-y-4">
          <div className="relative text-left">
            <span className="font-extrabold text-xs text-navy dark:text-white block">Step 1: Temp Reg (TRN) Generation</span>
            <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Submit PAN, State/UT, Mobile number, and Email authentication on the Central GST portal to generate a Temporary Reference Number (TRN).</p>
          </div>
          <div className="relative text-left">
            <span className="font-extrabold text-xs text-navy dark:text-white block">Step 2: Upload Documents & Address Proofs</span>
            <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Upload utility bills, registered lease deed / commercial rent agreements, owner NOC for address validation, promoter/director photos, and bank authorization.</p>
          </div>
          <div className="relative text-left">
            <span className="font-extrabold text-xs text-navy dark:text-white block">Step 3: ARN Generation & Officer Approval</span>
            <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Upon submission, an Application Reference Number (ARN) is issued. Tax officers review within 7 working days, either approving the registration or raising a Show Cause Notice (SCN) for queries.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// UDYAM REGISTRATION HANDBOOK
// ==========================================
export const UdyamRegHandbook: React.FC = () => {
  return (
    <div className="space-y-6" id="udyam-registration-guide">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🎖 Udyam MSME Registration Process Handbook
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          A technical primer on obtaining a lifetime Udyam registration ID for micro, small, or medium enterprises under statutory criteria.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 space-y-3 text-left">
        <span className="font-extrabold text-xs text-navy dark:text-white block">Key Benefits of Udyam MSME Certificate</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-550 dark:text-slate-400">
          <div className="flex gap-2 items-start font-medium">
            <span className="text-emerald-500 font-bold shrink-0">✔</span>
            <span>Priority Sector Lending (PSL) eligibility with collateral-free loans up to ₹2 Crores.</span>
          </div>
          <div className="flex gap-2 items-start font-medium">
            <span className="text-emerald-500 font-bold shrink-0">✔</span>
            <span>Exclusive 50% statutory fee waiver on Patent, Design, and Trademark filings.</span>
          </div>
          <div className="flex gap-2 items-start font-medium">
            <span className="text-emerald-500 font-bold shrink-0">✔</span>
            <span>Unmatched legal safety against delayed payments. Under MSME Dev Act, buyers must pay within 45 days, subject to 3x bank rate compound interest penalties (MSME Samadhaan board).</span>
          </div>
          <div className="flex gap-2 items-start font-medium">
            <span className="text-emerald-500 font-bold shrink-0">✔</span>
            <span>Electricity cost concession and credit rating charge subsidies.</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1.5 text-left">
        <strong className="text-navy dark:text-white block">Udyam Classification Criteria (FY 2025–26)</strong>
        <p>• **Micro**: Investment &lt;= ₹1 Crore AND Turnover &lt;= ₹5 Crores</p>
        <p>• **Small**: Investment &lt;= ₹10 Crores AND Turnover &lt;= ₹50 Crores</p>
        <p>• **Medium**: Investment &lt;= ₹50 Crores AND Turnover &lt;= ₹250 Crores</p>
      </div>
    </div>
  );
};

// ==========================================
// LEI REGISTRATION GUIDE
// ==========================================
export const LEIRegistrationGuide: React.FC = () => {
  return (
    <div className="space-y-6" id="lei-registration-guide">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🌐 LEI (Legal Entity Identifier) Onboarding
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          A globally standardized alpha-numeric identifier required for large business transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900/10">
          <span className="font-extrabold text-xs text-navy dark:text-white block">What is LEI?</span>
          <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
            The Legal Entity Identifier is a 20-character identifier established to standardize financial data across global central banks.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900/10">
          <span className="font-extrabold text-xs text-navy dark:text-white block">RBI Mandatory Timelines</span>
          <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
            Mandatory for all non-individual entities executing transaction values of ₹50 Crores or more via RTGS or NEFT, or holding large bank borrowings.
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// DEMATERIALIZATION HELPER
// ==========================================
export const DematHelper: React.FC = () => {
  return (
    <div className="space-y-6" id="dematerialization-helper">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          📈 Dematerialization of Share Certificates (MCA Rules)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Convert archaic physical paper share sheets into electronic dematerialized security format under CDSL / NSDL depositories.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 text-xs text-slate-700 dark:text-slate-350 text-left">
        <strong className="text-navy dark:text-white flex items-center gap-1.5 mb-1">
          <Info size={14} className="text-blue-500" /> MCA Compliance Mandate:
        </strong>
        Under current MCA notifications, **all non-small Private Limited Companies** are legally required to dematerialize their securities and issue new share allotments exclusively in dematerialized form before initiating corporate buybacks, transfers, or equity allocations.
      </div>

      <div className="space-y-3.5 text-[11px] text-slate-500 dark:text-slate-400 text-left font-bold pl-1 border-l-2 border-slate-300">
        <p>1. <span className="text-corporate dark:text-gold font-black uppercase">DP Onboarding:</span> Onboard with a registered Depository Participant (DP) affiliated with NSDL or CDSL.</p>
        <p>2. <span className="text-corporate dark:text-gold font-black uppercase">DRF Submission:</span> Submit a physical Demat Request Form (DRF) along with original paper share certificates explicitly marked as "SURRENDERED FOR DEMATERIALIZATION".</p>
        <p>3. <span className="text-corporate dark:text-gold font-black uppercase">Digital Credit:</span> DP processes and matches records with corporate registrar systems, resulting in digital share credits in the client Demat ledger within 10-15 business days.</p>
      </div>
    </div>
  );
};
