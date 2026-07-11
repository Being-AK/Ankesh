import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calculator, CheckCircle2, Info, HelpCircle } from 'lucide-react';

export const GSTCalculatorTool: React.FC = () => {
  const [supplyType, setSupplyType] = useState<'goods' | 'services'>('goods');
  const [calculationMode, setCalculationMode] = useState<'exclusive' | 'inclusive'>('exclusive');
  const [amount, setAmount] = useState<number>(100000);
  const [gstRate, setGstRate] = useState<number>(18); // Default 18%
  const [locationMode, setLocationMode] = useState<'intra' | 'inter'>('intra'); // intra-state or inter-state
  
  // Late filing controls
  const [isDelayed, setIsDelayed] = useState<boolean>(false);
  const [delayDays, setDelayDays] = useState<number>(15);
  const [gstrType, setGstrType] = useState<'gstr3b' | 'gstr1'>('gstr3b');
  const [isNilReturn, setIsNilReturn] = useState<boolean>(false);
  const [turnoverBracket, setTurnoverBracket] = useState<'micro' | 'small' | 'large'>('micro'); // <1.5Cr, 1.5Cr-5Cr, >5Cr
  const [cashTaxLiability, setCashTaxLiability] = useState<number>(18000); // Portion paid in cash (subject to Section 50 interest)
  const [rcmApplicable, setRcmApplicable] = useState<boolean>(false);



  // Math Calculations
  let baseAmount = amount;
  let gstAmount = 0;
  let totalInvoice = amount;

  if (calculationMode === 'exclusive') {
    gstAmount = (amount * gstRate) / 100;
    totalInvoice = amount + gstAmount;
  } else {
    baseAmount = (amount * 100) / (100 + gstRate);
    gstAmount = amount - baseAmount;
    totalInvoice = amount;
  }

  // Split taxes
  const cgst = locationMode === 'intra' ? gstAmount / 2 : 0;
  const sgst = locationMode === 'intra' ? gstAmount / 2 : 0;
  const igst = locationMode === 'inter' ? gstAmount : 0;

  // Late Fee Calculation
  // Standard late fees per day (divided equally between CGST and SGST for intra, or IGST equivalent)
  // Standard late fee under GST: Rs. 50 per day (Rs. 25 CGST + Rs. 25 SGST)
  // For NIL Return: Rs. 20 per day (Rs. 10 CGST + Rs. 10 SGST)
  let lateFee = 0;
  let lateFeeCap = 10000; // Default max cap is Rs 10,000 (Rs 5,000 each)

  if (isDelayed) {
    const dailyRate = isNilReturn ? 20 : 50;
    lateFee = delayDays * dailyRate;

    if (isNilReturn) {
      lateFeeCap = 500; // Capped at Rs 500 (Rs 250 each) for Nil returns
    } else {
      if (turnoverBracket === 'micro') {
        lateFeeCap = 2000; // Capped at Rs 2,000 (Rs 1,000 each) for turnover up to 1.5 Cr
      } else if (turnoverBracket === 'small') {
        lateFeeCap = 5000; // Capped at Rs 5,000 (Rs 2,500 each) for turnover 1.5 Cr to 5 Cr
      } else {
        lateFeeCap = 10000; // Capped at Rs 10,000 (Rs 5,000 each) for turnover above 5 Cr
      }
    }
    lateFee = Math.min(lateFee, lateFeeCap);
  }

  // Section 50 Net Cash Interest Calculation
  // Interest under Section 50(1) is 18% per annum calculated ONLY on the Net Cash Tax Liability
  // (the tax paid by debiting the Electronic Cash Ledger, not through Input Tax Credit)
  let interestOwed = 0;
  if (isDelayed && !isNilReturn && cashTaxLiability > 0) {
    interestOwed = (cashTaxLiability * 0.18 * delayDays) / 365;
  }

  // Unified Workspace Listeners for Reset, Copy & Download
  useEffect(() => {
    const handleReset = (e: Event) => {
      const customEvent = e as CustomEvent<{ toolId: string }>;
      if (customEvent.detail?.toolId === 'calc-gst' || customEvent.detail?.toolId === 'calc-gst-interest' || customEvent.detail?.toolId === 'calc-gst-penalty') {
        setSupplyType('goods');
        setCalculationMode('exclusive');
        setAmount(100000);
        setGstRate(18);
        setLocationMode('intra');
        setIsDelayed(false);
        setDelayDays(15);
        setGstrType('gstr3b');
        setIsNilReturn(false);
        setTurnoverBracket('micro');
        setCashTaxLiability(18000);
        setRcmApplicable(false);
      }
    };

    const handleCopy = (e: Event) => {
      const customEvent = e as CustomEvent<{ toolId: string }>;
      const tId = customEvent.detail?.toolId;
      if (tId === 'calc-gst' || tId === 'calc-gst-interest' || tId === 'calc-gst-penalty') {
        const text = `--- ANKESH COMPLIANCE WORKSPACE REPORT ---
Tool: GST & Penalty Calculator
Supply Type: ${supplyType.toUpperCase()}
Calculation Mode: ${calculationMode.toUpperCase()}
Base Taxable Amount: \u20B9${Math.round(baseAmount).toLocaleString('en-IN')}
GST Rate: ${gstRate}%
CGST Split: \u20B9${Math.round(cgst).toLocaleString('en-IN')}
SGST Split: \u20B9${Math.round(sgst).toLocaleString('en-IN')}
IGST Split: \u20B9${Math.round(igst).toLocaleString('en-IN')}
Total Invoice Value: \u20B9${Math.round(rcmApplicable ? baseAmount : totalInvoice).toLocaleString('en-IN')}
RCM Applicable: ${rcmApplicable ? 'YES' : 'NO'}
Filing Delay: ${isDelayed ? `${delayDays} days` : 'No delay'}
${isDelayed ? `Late Filing Fee: \u20B9${lateFee.toLocaleString('en-IN')}\nSec 50 Cash Interest: \u20B9${Math.round(interestOwed).toLocaleString('en-IN')}\nAggregate Penalty: \u20B9${Math.round(lateFee + interestOwed).toLocaleString('en-IN')}` : ''}
-----------------------------------------`;
        navigator.clipboard.writeText(text);
        window.dispatchEvent(new CustomEvent('workspace-toast', { detail: { message: 'GST calculations copied to clipboard!' } }));
      }
    };

    const handleDownload = (e: Event) => {
      const customEvent = e as CustomEvent<{ toolId: string }>;
      const tId = customEvent.detail?.toolId;
      if (tId === 'calc-gst' || tId === 'calc-gst-interest' || tId === 'calc-gst-penalty') {
        const reportData = {
          tool: "GST & Penalty Calculator",
          supplyType,
          calculationMode,
          baseAmount: Math.round(baseAmount),
          gstRate,
          cgst: Math.round(cgst),
          sgst: Math.round(sgst),
          igst: Math.round(igst),
          totalInvoice: Math.round(rcmApplicable ? baseAmount : totalInvoice),
          rcmApplicable,
          isDelayed,
          delayDays: isDelayed ? delayDays : 0,
          lateFee: isDelayed ? lateFee : 0,
          interestOwed: isDelayed ? Math.round(interestOwed) : 0,
          aggregatePenalty: isDelayed ? Math.round(lateFee + interestOwed) : 0,
          timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gst-compliance-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.dispatchEvent(new CustomEvent('workspace-toast', { detail: { message: 'Report JSON file downloaded successfully!' } }));
      }
    };

    window.addEventListener('workspace-reset', handleReset);
    window.addEventListener('workspace-copy', handleCopy);
    window.addEventListener('workspace-download', handleDownload);
    return () => {
      window.removeEventListener('workspace-reset', handleReset);
      window.removeEventListener('workspace-copy', handleCopy);
      window.removeEventListener('workspace-download', handleDownload);
    };
  }, [supplyType, calculationMode, amount, gstRate, locationMode, isDelayed, delayDays, gstrType, isNilReturn, turnoverBracket, cashTaxLiability, rcmApplicable, baseAmount, cgst, sgst, igst, totalInvoice, lateFee, interestOwed]);

  return (
    <div className="space-y-6" id="gst-calculator-component">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🧮 GST, Penalty & Cash Interest Calculator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Calculate SGST, CGST, IGST splits and perform statutory Section 50 cash-ledger interest auditing alongside GSTR delay late fee schedules.
        </p>
      </div>

      <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 text-amber-800 dark:text-amber-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
        <Info size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="font-medium">
          <span className="font-bold">CA Insight:</span> Under Section 50 of the CGST Act, 18% interest is retrospectively levied ONLY on the **Net Cash Tax Liability** (the part paid after utilising GSTR-2B Input Tax Credit).
        </p>
      </div>

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Left Input Column */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Supply Type</label>
              <div className="flex bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setSupplyType('goods')}
                  className={`flex-1 py-1.5 text-center font-bold text-[11px] rounded-md transition-all ${
                    supplyType === 'goods' 
                      ? 'bg-corporate text-white dark:bg-gold dark:text-navy shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Goods
                </button>
                <button
                  type="button"
                  onClick={() => setSupplyType('services')}
                  className={`flex-1 py-1.5 text-center font-bold text-[11px] rounded-md transition-all ${
                    supplyType === 'services' 
                      ? 'bg-corporate text-white dark:bg-gold dark:text-navy shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Services
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Calculation Mode</label>
              <div className="flex bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setCalculationMode('exclusive')}
                  className={`flex-1 py-1.5 text-center font-bold text-[11px] rounded-md transition-all ${
                    calculationMode === 'exclusive' 
                      ? 'bg-corporate text-white dark:bg-gold dark:text-navy shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Exclusive
                </button>
                <button
                  type="button"
                  onClick={() => setCalculationMode('inclusive')}
                  className={`flex-1 py-1.5 text-center font-bold text-[11px] rounded-md transition-all ${
                    calculationMode === 'inclusive' 
                      ? 'bg-corporate text-white dark:bg-gold dark:text-navy shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Inclusive
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Transaction Amount (INR)</label>
              <span className="text-xs font-mono font-black text-navy dark:text-white">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-2 rounded-lg text-xs font-bold focus:outline-none"
              placeholder="e.g. 100000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">GST Rate (%)</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(parseInt(e.target.value))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-2 focus:outline-none"
              >
                <option value={5}>5% (Basic Items)</option>
                <option value={12}>12% (Processed Goods)</option>
                <option value={18}>18% (Standard Services/Goods)</option>
                <option value={28}>28% (Luxury / Sin Goods)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Supply Jurisdiction</label>
              <div className="flex bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setLocationMode('intra')}
                  className={`flex-1 py-1.5 text-center font-bold text-[10px] rounded-md transition-all ${
                    locationMode === 'intra' 
                      ? 'bg-corporate text-white dark:bg-gold dark:text-navy shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Intra-State (CGST+SGST)
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode('inter')}
                  className={`flex-1 py-1.5 text-center font-bold text-[10px] rounded-md transition-all ${
                    locationMode === 'inter' 
                      ? 'bg-corporate text-white dark:bg-gold dark:text-navy shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Inter-State (IGST)
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            <input 
              type="checkbox"
              id="rcm-applicability-cb"
              checked={rcmApplicable}
              onChange={(e) => setRcmApplicable(e.target.checked)}
              className="accent-corporate dark:accent-gold"
            />
            <label htmlFor="rcm-applicability-cb" className="text-xs text-slate-600 dark:text-slate-350 cursor-pointer font-bold select-none">
              Is Reverse Charge Mechanism (RCM) Applicable?
            </label>
          </div>
        </div>

        {/* Right Delay / Penalty Column */}
        <div className="space-y-4 border-l-0 md:border-l border-slate-200 dark:border-slate-800 pl-0 md:pl-6 pt-4 md:pt-0">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="is-delayed-filing-cb"
              checked={isDelayed}
              onChange={(e) => setIsDelayed(e.target.checked)}
              className="accent-corporate dark:accent-gold"
            />
            <label htmlFor="is-delayed-filing-cb" className="text-xs text-navy dark:text-white cursor-pointer font-black select-none">
              ⚠️ GSTR Filing Delayed? (Calculate Late Fee & Interest)
            </label>
          </div>

          {isDelayed && (
            <div className="space-y-3.5 pt-2 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">Filing Type</label>
                  <select
                    value={gstrType}
                    onChange={(e) => setGstrType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    <option value="gstr3b">GSTR-3B (Tax Return)</option>
                    <option value="gstr1">GSTR-1 (Sales Statement)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">Delay (Days)</label>
                  <input 
                    type="number"
                    value={delayDays}
                    onChange={(e) => setDelayDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="is-nil-return-cb"
                  checked={isNilReturn}
                  onChange={(e) => setIsNilReturn(e.target.checked)}
                  className="accent-corporate dark:accent-gold"
                />
                <label htmlFor="is-nil-return-cb" className="text-[11px] text-slate-600 dark:text-slate-350 cursor-pointer select-none">
                  Is GSTR a Nil Return?
                </label>
              </div>

              {!isNilReturn && (
                <>
                  <div>
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Taxpayer Aggregate Turnover Bracket</label>
                    <select
                      value={turnoverBracket}
                      onChange={(e) => setTurnoverBracket(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none"
                    >
                      <option value="micro">Micro (Turnover up to ₹1.5 Crore)</option>
                      <option value="small">Small (Turnover ₹1.5 Crore to ₹5 Crore)</option>
                      <option value="large">Large (Turnover above ₹5 Crore)</option>
                    </select>
                  </div>

                  {gstrType === 'gstr3b' && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Net Cash Tax Liability (INR)</label>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">₹{cashTaxLiability.toLocaleString('en-IN')}</span>
                      </div>
                      <input 
                        type="number"
                        value={cashTaxLiability}
                        onChange={(e) => setCashTaxLiability(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-mono"
                        placeholder="Portion paid via cash ledger"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RCM Alert Banner */}
      {rcmApplicable && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-slate-700 dark:text-slate-300 leading-normal space-y-1">
          <p className="font-extrabold text-navy dark:text-white">ℹ Reverse Charge Mechanism (RCM) Note</p>
          <p>
            For RCM transactions, the supplier does not charge GST on the invoice. Instead, the recipient is legally required to pay 100% of the tax directly to the government cash ledger. Recipient can claim Input Tax Credit of this RCM tax paid in the same month.
          </p>
        </div>
      )}

      {/* Math Results Splits */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono">
        <div className="p-2 border-r border-slate-200 dark:border-slate-800/80 last:border-0">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Base Taxable</span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-200 block mt-1.5">₹{Math.round(baseAmount).toLocaleString('en-IN')}</span>
        </div>
        
        <div className="p-2 border-r border-slate-200 dark:border-slate-800/80 last:border-0">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">
            {locationMode === 'intra' ? 'CGST Split (9%)' : 'IGST Split'}
          </span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-200 block mt-1.5">
            ₹{Math.round(locationMode === 'intra' ? cgst : igst).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-2 border-r border-slate-200 dark:border-slate-800/80 last:border-0">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">
            {locationMode === 'intra' ? 'SGST Split (9%)' : 'IGST Split'}
          </span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-200 block mt-1.5">
            ₹{Math.round(locationMode === 'intra' ? sgst : 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-2">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Total Invoice</span>
          <span className="text-base font-black text-corporate dark:text-gold block mt-1.5">
            ₹{Math.round(rcmApplicable ? baseAmount : totalInvoice).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Penalty Audit Board */}
      {isDelayed && (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-red-500/10">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-red-700 dark:text-red-400">Delay Penalties & Cash Ledger Interest (Section 50)</span>
            <span className="text-[9px] bg-red-500/10 text-red-600 px-2.5 py-0.5 rounded font-black uppercase">Delayed {delayDays} Days</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
            <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850">
              <span className="text-[9px] text-slate-400 block font-sans">Late Fees (CGST+SGST)</span>
              <span className="text-base font-bold text-rose-500 block mt-1">₹{lateFee.toLocaleString('en-IN')}</span>
              <span className="text-[8px] text-slate-400 block font-sans mt-0.5">Capped limit: ₹{lateFeeCap.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850">
              <span className="text-[9px] text-slate-400 block font-sans">Sec 50 Cash Interest (18% pa)</span>
              <span className="text-base font-bold text-rose-500 block mt-1">₹{Math.round(interestOwed).toLocaleString('en-IN')}</span>
              <span className="text-[8px] text-slate-400 block font-sans mt-0.5">On net cash ledger part only</span>
            </div>

            <div className="p-3 bg-corporate/5 dark:bg-gold/5 rounded-xl border border-corporate/20 dark:border-gold/30">
              <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-sans">Aggregate Fine/Interest</span>
              <span className="text-lg font-black text-rose-600 dark:text-red-400 block mt-1">₹{Math.round(lateFee + interestOwed).toLocaleString('en-IN')}</span>
              <span className="text-[8px] text-slate-400 block font-sans mt-0.5">Additional cash payable</span>
            </div>
          </div>
        </div>
      )}

      {/* GST Knowledge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-5">
        <div className="p-4 rounded-xl border border-slate-200/50 bg-slate-50/50 dark:bg-slate-900/10 space-y-1 text-xs">
          <h5 className="font-extrabold text-navy dark:text-white uppercase text-[10px] flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-500" /> Abolished Provisional ITC Buffer
          </h5>
          <p className="text-slate-500 dark:text-slate-400 leading-normal text-[11px]">
            Provisional ITC claim of 5% or 10% under Rule 36(4) is fully repealed. Taxpayers can only claim ITC that matches with the vendor's filing and is fully populated in GSTR-2B.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/50 bg-slate-50/50 dark:bg-slate-900/10 space-y-1 text-xs">
          <h5 className="font-extrabold text-navy dark:text-white uppercase text-[10px] flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-500" /> QRMP Scheme Eligibility
          </h5>
          <p className="text-slate-500 dark:text-slate-400 leading-normal text-[11px]">
            Taxpayers having an aggregate turnover up to ₹5 Crores in the preceding FY are eligible for the QRMP scheme, enabling quarterly GSTR-1 & 3B filing with monthly PMT-06 cash taxes.
          </p>
        </div>
      </div>
    </div>
  );
};
