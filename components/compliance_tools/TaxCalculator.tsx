import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Calculator, 
  CheckCircle2, 
  FileText, 
  TrendingUp, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Percent,
  Coins,
  Settings,
  ShieldCheck,
  Check,
  BookOpen
} from 'lucide-react';

// Slabs for New Tax Regime (FY 2025-26 / AY 2026-27)
// 0 - 4L: Nil
// 4L - 8L: 5%
// 8L - 12L: 10%
// 12L - 16L: 15%
// 16L - 20L: 20%
// Above 20L: 30%
export const calculateSlabsNew = (income: number) => {
  const slabs = [
    { name: '₹0 - ₹4 Lakhs', rate: 0, range: [0, 400000], tax: 0, taxableAmount: 0 },
    { name: '₹4 Lakhs - ₹8 Lakhs', rate: 5, range: [400000, 800000], tax: 0, taxableAmount: 0 },
    { name: '₹8 Lakhs - ₹12 Lakhs', rate: 10, range: [800000, 1200000], tax: 0, taxableAmount: 0 },
    { name: '₹12 Lakhs - ₹16 Lakhs', rate: 15, range: [1200000, 1600000], tax: 0, taxableAmount: 0 },
    { name: '₹16 Lakhs - ₹20 Lakhs', rate: 20, range: [1600000, 2000000], tax: 0, taxableAmount: 0 },
    { name: 'Above ₹20 Lakhs', rate: 30, range: [2000000, Infinity], tax: 0, taxableAmount: 0 },
  ];

  let totalTax = 0;
  for (const slab of slabs) {
    const [min, max] = slab.range;
    if (income > min) {
      const taxable = Math.min(income, max) - min;
      slab.taxableAmount = taxable;
      slab.tax = taxable * (slab.rate / 100);
      totalTax += slab.tax;
    }
  }

  return { totalTax, slabs };
};

// Slabs for Old Tax Regime (FY 2025-26 / AY 2026-27)
// 0 - 2.5L: Nil
// 2.5L - 5L: 5%
// 5L - 10L: 20%
// Above 10L: 30%
export const calculateSlabsOld = (income: number) => {
  const slabs = [
    { name: '₹0 - ₹2.5 Lakhs', rate: 0, range: [0, 250000], tax: 0, taxableAmount: 0 },
    { name: '₹2.5 Lakhs - ₹5 Lakhs', rate: 5, range: [250000, 500000], tax: 0, taxableAmount: 0 },
    { name: '₹5 Lakhs - ₹10 Lakhs', rate: 20, range: [500000, 1000000], tax: 0, taxableAmount: 0 },
    { name: 'Above ₹10 Lakhs', rate: 30, range: [1000000, Infinity], tax: 0, taxableAmount: 0 },
  ];

  let totalTax = 0;
  for (const slab of slabs) {
    const [min, max] = slab.range;
    if (income > min) {
      const taxable = Math.min(income, max) - min;
      slab.taxableAmount = taxable;
      slab.tax = taxable * (slab.rate / 100);
      totalTax += slab.tax;
    }
  }

  return { totalTax, slabs };
};

// Calculate surcharge rates, thresholds, and apply Surcharge Marginal Relief
export const calculateSurcharge = (taxAfterRebate: number, taxableIncome: number, isNewRegime: boolean) => {
  let surchargeRate = 0;
  let threshold = 0;
  let prevSurchargeRate = 0;

  if (isNewRegime) {
    if (taxableIncome > 20000000) { // 2 Crore
      surchargeRate = 0.25; // Capped at 25% under New Regime
      threshold = 20000000;
      prevSurchargeRate = 0.15;
    } else if (taxableIncome > 10000000) { // 1 Crore
      surchargeRate = 0.15;
      threshold = 10000000;
      prevSurchargeRate = 0.10;
    } else if (taxableIncome > 5000000) { // 50 Lakh
      surchargeRate = 0.10;
      threshold = 5000000;
      prevSurchargeRate = 0.00;
    }
  } else {
    if (taxableIncome > 50000000) { // 5 Crore
      surchargeRate = 0.37;
      threshold = 50000000;
      prevSurchargeRate = 0.25;
    } else if (taxableIncome > 20000000) { // 2 Crore
      surchargeRate = 0.25;
      threshold = 20000000;
      prevSurchargeRate = 0.15;
    } else if (taxableIncome > 10000000) { // 1 Crore
      surchargeRate = 0.15;
      threshold = 10000000;
      prevSurchargeRate = 0.10;
    } else if (taxableIncome > 5000000) { // 50 Lakh
      surchargeRate = 0.10;
      threshold = 5000000;
      prevSurchargeRate = 0.00;
    }
  }

  let surcharge = taxAfterRebate * surchargeRate;
  let totalTaxAndSurcharge = taxAfterRebate + surcharge;
  let marginalReliefApplied = false;
  let marginalReliefAmount = 0;

  if (threshold > 0) {
    const taxAtThreshold = isNewRegime 
      ? calculateSlabsNew(threshold).totalTax 
      : calculateSlabsOld(threshold).totalTax;
    
    let taxAfterRebateAtThreshold = taxAtThreshold;
    if (isNewRegime && threshold <= 1200000) {
      taxAfterRebateAtThreshold = 0;
    } else if (!isNewRegime && threshold <= 500000) {
      taxAfterRebateAtThreshold = 0;
    }

    const surchargeAtThreshold = taxAfterRebateAtThreshold * prevSurchargeRate;
    const totalAtThreshold = taxAfterRebateAtThreshold + surchargeAtThreshold;
    const excessIncomeOverThreshold = taxableIncome - threshold;
    const cappedTotal = totalAtThreshold + excessIncomeOverThreshold;

    if (totalTaxAndSurcharge > cappedTotal) {
      marginalReliefAmount = totalTaxAndSurcharge - cappedTotal;
      totalTaxAndSurcharge = cappedTotal;
      surcharge = totalTaxAndSurcharge - taxAfterRebate;
      marginalReliefApplied = true;
    }
  }

  return {
    surchargeRate,
    surcharge,
    totalTaxAndSurcharge,
    marginalReliefApplied,
    marginalReliefAmount
  };
};

export const calculateTaxAndSurcharge = (income: number, isNewRegime: boolean) => {
  // 1. Calculate Base Tax from slabs
  const slabsRes = isNewRegime ? calculateSlabsNew(income) : calculateSlabsOld(income);
  const baseTax = slabsRes.totalTax;
  let taxAfterRebate = baseTax;
  let rebateApplied = 0;

  // 2. Apply Section 87A rebate with Marginal Relief
  if (isNewRegime) {
    if (income <= 1200000) {
      taxAfterRebate = 0;
      rebateApplied = baseTax;
    } else {
      // Section 87A marginal relief under New Tax Regime:
      // Tax payable cannot exceed the amount by which taxable income exceeds 12 Lakhs
      const excess = income - 1200000;
      if (baseTax > excess) {
        taxAfterRebate = excess;
        rebateApplied = baseTax - excess;
      }
    }
  } else {
    // Old Regime rebate is flat 100% of tax up to ₹12,500 if taxable income is <= 5L
    if (income <= 500000) {
      taxAfterRebate = 0;
      rebateApplied = baseTax;
    }
  }

  // 3. Surcharge & Surcharge Marginal Relief
  const surchargeRes = calculateSurcharge(taxAfterRebate, income, isNewRegime);

  // 4. Calculate Cess (Health and Education Cess @ 4% on Tax + Surcharge)
  const cess = surchargeRes.totalTaxAndSurcharge * 0.04;
  const finalTax = surchargeRes.totalTaxAndSurcharge + cess;

  return {
    taxableIncome: income,
    baseTax,
    taxAfterRebate,
    rebateApplied,
    surchargeRate: surchargeRes.surchargeRate,
    surcharge: surchargeRes.surcharge,
    totalTaxAndSurcharge: surchargeRes.totalTaxAndSurcharge,
    cess,
    finalTax,
    marginalReliefApplied: surchargeRes.marginalReliefApplied,
    marginalReliefAmount: surchargeRes.marginalReliefAmount,
    slabs: slabsRes.slabs
  };
};

export const SalaryCalc: React.FC = () => {
  // Config States
  const [inputMode, setInputMode] = useState<'ctc' | 'gross'>('gross');
  const [ctc, setCtc] = useState(1500000); // 15 LPA CTC default
  const [gross, setGross] = useState(1500000); // 15 LPA Gross default
  
  // Salary Breakup Configurations (CTC Mode)
  const [basicPercent, setBasicPercent] = useState(50); // standard 50% Basic
  const [epfMode, setEpfMode] = useState<'capped' | 'actual' | 'none'>('capped');
  const [includeGratuity, setIncludeGratuity] = useState(true);
  const [deductPT, setDeductPT] = useState(true);
  const [ptAmount, setPtAmount] = useState(2400); // user-editable PT defaulting to ₹2,400
  const [ptInput, setPtInput] = useState("2,400"); // formatted string input for PT


  const handlePtInputChange = (val: string) => {
    const cleanNum = parseIndianNumber(val);
    const cappedNum = Math.min(cleanNum, 2500); // statutory upper limit is ₹2,500/year under Art. 276(2) of the Indian Constitution
    setPtAmount(cappedNum);
    setPtInput(val === '' ? '' : cappedNum.toLocaleString('en-IN'));
  };

  // Exemption States (Old Regime Plan)
  const [deduction80C, setDeduction80C] = useState(150000); // 80C
  const [deduction80D, setDeduction80D] = useState(25000); // Health insurance
  const [deduction24b, setDeduction24b] = useState(0); // Home loan interest
  const [deduction80CCD, setDeduction80CCD] = useState(0); // NPS
  const [otherExemptions, setOtherExemptions] = useState(0); // Other Eligible Deductions (Manual Entry)

  // UI Control States
  const [isPlanningExpanded, setIsPlanningExpanded] = useState(false);
  const [isAuditExpanded, setIsAuditExpanded] = useState(false);

  // Local raw text input values to allow smooth typing and formatting
  const [ctcInput, setCtcInput] = useState("15,00,000");
  const [grossInput, setGrossInput] = useState("15,00,000");
  
  // Granular deduction text inputs
  const [ded80CInput, setDed80CInput] = useState("1,50,000");
  const [ded80DInput, setDed80DInput] = useState("25,000");
  const [ded24bInput, setDed24bInput] = useState("0");
  const [ded80CCDInput, setDed80CCDInput] = useState("0");
  const [otherExemptInput, setOtherExemptInput] = useState("0");

  const parseIndianNumber = (str: string): number => {
    const clean = str.replace(/[^0-9]/g, '');
    return clean ? parseInt(clean, 10) : 0;
  };

  // Standard Deductions for FY 2025-26
  const ST_DED_NEW = 75000; // corrected statutory New Regime standard deduction
  const ST_DED_OLD = 50000;
  const PT_AMOUNT = deductPT ? ptAmount : 0; // PT is user-editable with standard ₹2,500 default

  // Calculate salary breakup components based on inputs
  const basicSalary = inputMode === 'ctc' ? ctc * (basicPercent / 100) : gross * (basicPercent / 100);
  
  // EPF Math
  let employerEPF = 0;
  if (epfMode === 'capped') {
    employerEPF = Math.min(basicSalary * 0.12, 21600); // Standard ceiling of ₹1,800/month
  } else if (epfMode === 'actual') {
    employerEPF = basicSalary * 0.12;
  }

  const gratuity = (includeGratuity && inputMode === 'ctc') ? Math.round(basicSalary * 0.0481) : 0;
  const employeeEPF = employerEPF; // Employee EPF contribution usually matches employer's

  // Synchronize CTC and Gross calculations
  useEffect(() => {
    if (inputMode === 'ctc') {
      const calculatedGross = Math.max(0, ctc - employerEPF - gratuity);
      setGross(Math.round(calculatedGross));
      setGrossInput(Math.round(calculatedGross).toLocaleString('en-IN'));
    }
  }, [ctc, basicPercent, epfMode, includeGratuity, inputMode, employerEPF, gratuity]);

  // Synchronize raw inputs when states change
  useEffect(() => {
    const currentParsed = parseIndianNumber(ctcInput);
    if (currentParsed !== ctc) {
      setCtcInput(ctc.toLocaleString('en-IN'));
    }
  }, [ctc, ctcInput]);

  useEffect(() => {
    const currentParsed = parseIndianNumber(grossInput);
    if (currentParsed !== gross && inputMode === 'gross') {
      setGrossInput(gross.toLocaleString('en-IN'));
    }
  }, [gross, grossInput, inputMode]);

  // Event handlers for inputs
  const handleCtcInputChange = (val: string) => {
    const cleanNum = parseIndianNumber(val);
    const cappedNum = Math.min(cleanNum, 100000000); // 10 Crores limit
    setCtc(cappedNum);
    setCtcInput(val === '' ? '' : cappedNum.toLocaleString('en-IN'));
  };

  const handleGrossInputChange = (val: string) => {
    const cleanNum = parseIndianNumber(val);
    const cappedNum = Math.min(cleanNum, 100000000);
    setGross(cappedNum);
    setGrossInput(val === '' ? '' : cappedNum.toLocaleString('en-IN'));
  };

  const handleCtcSliderChange = (val: number) => {
    setCtc(val);
    setCtcInput(val.toLocaleString('en-IN'));
  };

  const handleGrossSliderChange = (val: number) => {
    setGross(val);
    setGrossInput(val.toLocaleString('en-IN'));
  };

  // Exemption handlers
  const handleDed80CChange = (val: string) => {
    const num = Math.min(parseIndianNumber(val), 150000);
    setDeduction80C(num);
    setDed80CInput(val === '' ? '' : num.toLocaleString('en-IN'));
  };

  const handleDed80DChange = (val: string) => {
    const num = Math.min(parseIndianNumber(val), 75000);
    setDeduction80D(num);
    setDed80DInput(val === '' ? '' : num.toLocaleString('en-IN'));
  };

  const handleDed24bChange = (val: string) => {
    const num = Math.min(parseIndianNumber(val), 200000);
    setDeduction24b(num);
    setDed24bInput(val === '' ? '' : num.toLocaleString('en-IN'));
  };

  const handleDed80CCDChange = (val: string) => {
    const num = Math.min(parseIndianNumber(val), 50000);
    setDeduction80CCD(num);
    setDed80CCDInput(val === '' ? '' : num.toLocaleString('en-IN'));
  };

  const handleOtherExemptChange = (val: string) => {
    const num = Math.min(parseIndianNumber(val), gross);
    setOtherExemptions(num);
    setOtherExemptInput(val === '' ? '' : num.toLocaleString('en-IN'));
  };

  // Taxable Income Computations
  // New Regime: only standard deduction (75,000) is allowed. Professional Tax is not deductible under the New Tax Regime.
  const taxableNew = Math.max(0, gross - ST_DED_NEW);

  // Old Regime: standard deduction (50,000) + PT (2,500) + Employee EPF (automatically added to 80C) + manually declared exemptions
  const total80C = Math.min(deduction80C + employeeEPF, 150000);
  const totalDeductionsOld = total80C + deduction80D + deduction24b + deduction80CCD + otherExemptions;
  const taxableOld = Math.max(0, gross - ST_DED_OLD - PT_AMOUNT - totalDeductionsOld);

  // Compute final taxes
  const newRegimeRes = calculateTaxAndSurcharge(taxableNew, true);
  const oldRegimeRes = calculateTaxAndSurcharge(taxableOld, false);

  // Monthly and Annual take-home calculations (Gross Salary - Employee PF - PT - Income Tax)
  const annualTakeHomeNew = Math.max(0, gross - employeeEPF - PT_AMOUNT - newRegimeRes.finalTax);
  const monthlyTakeHomeNew = Math.round(annualTakeHomeNew / 12);

  const annualTakeHomeOld = Math.max(0, gross - employeeEPF - PT_AMOUNT - oldRegimeRes.finalTax);
  const monthlyTakeHomeOld = Math.round(annualTakeHomeOld / 12);

  // Comparative analysis
  const savings = Math.abs(newRegimeRes.finalTax - oldRegimeRes.finalTax);
  const preferredRegime = newRegimeRes.finalTax < oldRegimeRes.finalTax ? 'New Tax Regime' : 'Old Tax Regime';
  const effectiveRateNew = gross > 0 ? ((newRegimeRes.finalTax / (inputMode === 'ctc' ? ctc : gross)) * 100).toFixed(2) : '0.00';
  const effectiveRateOld = gross > 0 ? ((oldRegimeRes.finalTax / (inputMode === 'ctc' ? ctc : gross)) * 100).toFixed(2) : '0.00';

  // Helper to format as LPA/Lakh text for premium visual design
  const formatAsLakhs = (num: number): string => {
    if (num === 0) return '₹0';
    const lakhs = num / 100000;
    if (lakhs >= 100) {
      const crores = lakhs / 100;
      return `₹${crores.toFixed(2).replace(/\.00$/, '')} Cr`;
    }
    return `₹${lakhs.toFixed(2).replace(/\.00$/, '')} Lakh`;
  };

  // Unified Workspace Listeners for Reset, Copy & Download
  useEffect(() => {
    const handleReset = (e: Event) => {
      const customEvent = e as CustomEvent<{ toolId: string }>;
      const tId = customEvent.detail?.toolId;
      if (tId === 'calc-salary' || tId === 'calc-salary-tds' || tId === 'calc-salary-direct' || tId === 'income-tax' || tId === 'salary') {
        setInputMode('gross');
        setCtc(1500000);
        setGross(1500000);
        setBasicPercent(50);
        setEpfMode('capped');
        setIncludeGratuity(true);
        setDeductPT(true);
        setPtAmount(2400);
        setPtInput("2,400");
        setDeduction80C(150000);
        setDeduction80D(25000);
        setDeduction24b(0);
        setDeduction80CCD(0);
        setOtherExemptions(0);
        setCtcInput("15,00,000");
        setGrossInput("15,00,000");
        setDed80CInput("1,50,000");
        setDed80DInput("25,000");
        setDed24bInput("0");
        setDed80CCDInput("0");
        setOtherExemptInput("0");
      }
    };

    const handleCopy = (e: Event) => {
      const customEvent = e as CustomEvent<{ toolId: string }>;
      const tId = customEvent.detail?.toolId;
      if (tId === 'calc-salary' || tId === 'calc-salary-tds' || tId === 'calc-salary-direct' || tId === 'income-tax' || tId === 'salary') {
        const text = `--- ANKESH COMPLIANCE WORKSPACE REPORT ---
Tool: Indian Take-Home Salary & Tax Planner
Income Mode: ${inputMode.toUpperCase()}
Gross Income: \u20B9${gross.toLocaleString('en-IN')}
CTC Declared: \u20B9${ctc.toLocaleString('en-IN')}
Basic Salary: \u20B9${Math.round(basicSalary).toLocaleString('en-IN')}
Employer EPF: \u20B9${employerEPF.toLocaleString('en-IN')}
Professional Tax: \u20B9${PT_AMOUNT.toLocaleString('en-IN')}

TAX COMPUTATIONS (FY 2025-26):
[NEW TAX REGIME]
Taxable Income: \u20B9${taxableNew.toLocaleString('en-IN')}
Computed Tax: \u20B9${Math.round(newRegimeRes.finalTax).toLocaleString('en-IN')}
Take-Home Salary (In-Hand): \u20B9${annualTakeHomeNew.toLocaleString('en-IN')} per year (\u20B9${monthlyTakeHomeNew.toLocaleString('en-IN')}/month)

[OLD TAX REGIME]
Taxable Income: \u20B9${taxableOld.toLocaleString('en-IN')}
Deductions Allowed: \u20B9${totalDeductionsOld.toLocaleString('en-IN')}
Computed Tax: \u20B9${Math.round(oldRegimeRes.finalTax).toLocaleString('en-IN')}
Take-Home Salary (In-Hand): \u20B9${annualTakeHomeOld.toLocaleString('en-IN')} per year (\u20B9${monthlyTakeHomeOld.toLocaleString('en-IN')}/month)

Optimal Choice: ${preferredRegime} (Saves \u20B9${savings.toLocaleString('en-IN')}/year)
-----------------------------------------`;
        navigator.clipboard.writeText(text);
        window.dispatchEvent(new CustomEvent('workspace-toast', { detail: { message: 'Salary & tax calculation copied to clipboard!' } }));
      }
    };

    const handleDownload = (e: Event) => {
      const customEvent = e as CustomEvent<{ toolId: string }>;
      const tId = customEvent.detail?.toolId;
      if (tId === 'calc-salary' || tId === 'calc-salary-tds' || tId === 'calc-salary-direct' || tId === 'income-tax' || tId === 'salary') {
        const reportData = {
          tool: "Indian Take-Home Salary & Tax Planner",
          inputMode,
          ctc,
          gross,
          basicSalary: Math.round(basicSalary),
          employerEPF,
          employeeEPF,
          ptAmount: PT_AMOUNT,
          deductionsOld: {
            ded80C: total80C,
            ded80D: deduction80D,
            ded24b: deduction24b,
            ded80CCD: deduction80CCD,
            otherExemptions,
            totalDeductionsOld
          },
          taxNewRegime: {
            taxableIncome: taxableNew,
            baseTax: Math.round(newRegimeRes.baseTax),
            finalTax: Math.round(newRegimeRes.finalTax),
            annualTakeHome: annualTakeHomeNew,
            monthlyTakeHome: monthlyTakeHomeNew
          },
          taxOldRegime: {
            taxableIncome: taxableOld,
            baseTax: Math.round(oldRegimeRes.baseTax),
            finalTax: Math.round(oldRegimeRes.finalTax),
            annualTakeHome: annualTakeHomeOld,
            monthlyTakeHome: monthlyTakeHomeOld
          },
          preferredRegime,
          savings,
          timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `salary-tax-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.dispatchEvent(new CustomEvent('workspace-toast', { detail: { message: 'Tax report JSON downloaded successfully!' } }));
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
  }, [inputMode, ctc, gross, basicPercent, epfMode, includeGratuity, deductPT, ptAmount, deduction80C, deduction80D, deduction24b, deduction80CCD, otherExemptions, basicSalary, employerEPF, employeeEPF, PT_AMOUNT, taxableNew, taxableOld, totalDeductionsOld, newRegimeRes, oldRegimeRes, annualTakeHomeNew, monthlyTakeHomeNew, annualTakeHomeOld, monthlyTakeHomeOld, preferredRegime, savings, total80C]);

  return (
    <div className="space-y-6" id="salary-calculator-tool">
      {/* Visual Header */}
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          <Calculator className="text-corporate dark:text-gold shrink-0" size={24} />
          🇮🇳 Indian Take-Home Salary & Tax Planner (FY 2025–26)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Perform a Chartered Accountant-grade tax audit and dual-regime comparative analysis for **Assessment Year 2026–27** with exact statutory deductions, Section 87A rebate marginal relief, surcharges, and education cess.
        </p>
      </div>

      {/* Statutory News Box */}
      <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10 text-emerald-800 dark:text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5">
        <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
        <div>
          <p className="font-bold uppercase tracking-wider text-[10px] text-emerald-700 dark:text-emerald-400">
            Statutory Audit Status: Fully Verified for AY 2026-27
          </p>
          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-600 dark:text-slate-300 font-medium">
            <li>Standard Deduction under New Regime is **₹75,000** (Section 16(ia)).</li>
            <li>Section 87A rebate limit is raised to **₹12,00,000** for New Regime with complete marginal relief.</li>
            <li>Professional Tax is deductible under Section 16(iii) in the Old Regime only (user-editable, defaulting to ₹2,400/year, with a statutory maximum of ₹2,500/year). It is not deductible under the New Regime.</li>
            <li>Surcharge capped at **25%** under the New Tax Regime (highest rate).</li>
          </ul>
        </div>
      </div>

      {/* Primary Input Panel */}
      <div className="space-y-6 bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Toggle Mode Button */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Select Calculation Mode:
          </span>
          <div className="flex bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setInputMode('ctc')}
              className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                inputMode === 'ctc'
                  ? 'bg-corporate dark:bg-gold text-white dark:text-navy shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Cost to Company (CTC)
            </button>
            <button
              type="button"
              onClick={() => setInputMode('gross')}
              className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                inputMode === 'gross'
                  ? 'bg-corporate dark:bg-gold text-white dark:text-navy shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Gross Annual Salary
            </button>
          </div>
        </div>

        {/* Dynamic Inputs (CTC vs Gross) */}
        {inputMode === 'ctc' ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label htmlFor="ctc-numeric-input" className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Annual Cost to Company (CTC)
              </label>
              <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
                Equivalent: <strong className="text-corporate dark:text-gold font-bold">{formatAsLakhs(ctc)}</strong>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans font-semibold text-slate-400 dark:text-slate-500 text-base" aria-hidden="true">
                  ₹
                </span>
                <input
                  id="ctc-numeric-input"
                  type="text"
                  value={ctcInput}
                  onChange={(e) => handleCtcInputChange(e.target.value)}
                  placeholder="Enter annual CTC (e.g. 15,00,000)"
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-100 text-base focus:outline-none focus:border-corporate dark:focus:border-gold focus:ring-1 focus:ring-corporate dark:focus:ring-gold transition-colors"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0" role="group" aria-label="Quick CTC presets">
                {[800000, 1200000, 1500000, 2500000, 5000000].map((preset) => (
                  <button
                    key={`ctc-preset-${preset}`}
                    type="button"
                    onClick={() => handleCtcSliderChange(preset)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                      ctc === preset
                        ? 'bg-corporate dark:bg-gold border-corporate dark:border-gold text-white dark:text-navy shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-100 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {preset / 100000} LPA
                  </button>
                ))}
              </div>
            </div>

            {/* Range Slider */}
            <div className="pt-2">
              <input 
                type="range" 
                min={300000} 
                max={6000000} 
                step={50000} 
                value={ctc} 
                onChange={(e) => handleCtcSliderChange(Number(e.target.value))}
                className="w-full accent-corporate dark:accent-gold cursor-pointer"
                id="ctc-range-slider"
                aria-label="Gross annual CTC range slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 select-none">
                <span>3 LPA</span>
                <span>15 LPA</span>
                <span>30 LPA</span>
                <span>60 LPA</span>
              </div>
            </div>

            {/* CTC Breakdown Panel */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-3.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Settings size={14} className="text-corporate dark:text-gold" />
                  Cost-to-Company (CTC) Breakdown Configurations:
                </span>
                <span className="font-mono text-slate-500">Gross Salary is computed from CTC</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1 text-xs">
                {/* Basic Pay Slider */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Basic Salary:</span>
                    <span className="font-mono text-corporate dark:text-gold font-black">{basicPercent}% of CTC</span>
                  </span>
                  <input
                    type="range"
                    min={30}
                    max={60}
                    step={5}
                    value={basicPercent}
                    onChange={(e) => setBasicPercent(Number(e.target.value))}
                    className="w-full accent-corporate dark:accent-gold cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block font-mono">₹{Math.round(basicSalary).toLocaleString('en-IN')}/year</span>
                </div>

                {/* Employer EPF Toggle */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    Employer EPF Contribution
                    <span className="group relative cursor-pointer" aria-label="EPF Information">
                      <Info size={12} className="text-slate-400" />
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-56 z-10 font-normal leading-normal">
                        **Capped**: Limits EPF basis to ₹15,000/mo statutory ceiling (₹21,600/yr). **Actual**: Computes a full 12% of your actual Basic Salary without ceiling limit.
                      </span>
                    </span>
                  </span>
                  <select
                    value={epfMode}
                    onChange={(e: any) => setEpfMode(e.target.value)}
                    className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-corporate focus:border-corporate cursor-pointer"
                  >
                    <option value="capped">Capped (₹21,600/yr - Standard Statutory Ceiling)</option>
                    <option value="actual">Actual (12% of actual Basic Salary)</option>
                    <option value="none">No EPF Contribution</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block leading-normal">
                    {epfMode === 'capped' && "Statutory limit on ₹15,000/mo salary ceiling."}
                    {epfMode === 'actual' && "Computed on 100% of your actual Basic pay."}
                    {epfMode === 'none' && "EPF contribution excluded."}
                    <span className="font-mono block font-bold text-slate-500 mt-0.5">Value: ₹{Math.round(employerEPF).toLocaleString('en-IN')}/year</span>
                  </span>
                </div>

                {/* Gratuity Checkbox */}
                <div className="space-y-1.5 flex flex-col justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Gratuity Included in CTC</span>
                  <label className="flex items-center gap-2 cursor-pointer py-1 select-none">
                    <input
                      type="checkbox"
                      checked={includeGratuity}
                      onChange={(e) => setIncludeGratuity(e.target.checked)}
                      className="accent-corporate dark:accent-gold rounded h-4 w-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">4.81% of Basic</span>
                  </label>
                  <span className="text-[10px] text-slate-400 block font-mono">Value: ₹{Math.round(gratuity).toLocaleString('en-IN')}/year</span>
                </div>

                {/* Professional Tax Checkbox */}
                <div className="space-y-1.5 flex flex-col justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    Professional Tax (PT)
                    <span className="group relative cursor-pointer" aria-label="PT Information">
                      <Info size={12} className="text-slate-400" />
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-48 z-10 font-normal leading-normal">
                        PT is a state-wise tax (capped constitutionally at ₹2,500/year). Delhi, Haryana, and UP do not charge PT, while MH, KA, WB, TN deduct up to ₹2,500/yr.
                      </span>
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="pt-checkbox"
                      checked={deductPT}
                      onChange={(e) => setDeductPT(e.target.checked)}
                      className="accent-corporate dark:accent-gold rounded h-4 w-4 cursor-pointer"
                    />
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">₹</span>
                      <input
                        type="text"
                        disabled={!deductPT}
                        value={ptInput}
                        onChange={(e) => handlePtInputChange(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-5 pr-1.5 py-1 font-mono font-bold text-xs focus:outline-none focus:border-corporate disabled:opacity-50"
                        placeholder="2,500"
                        aria-label="Annual Professional Tax amount"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    {deductPT ? `Annual: ₹${ptAmount.toLocaleString('en-IN')}` : 'Not Deducted'}
                  </span>
                </div>
              </div>

              {/* Computed Gross Result */}
              <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500 font-bold">Computed Gross Salary (CTC - Employer EPF - Gratuity):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ₹{ctc.toLocaleString('en-IN')} - ₹{employerEPF.toLocaleString('en-IN')} {gratuity > 0 && `- ₹${gratuity.toLocaleString('en-IN')}`} = <strong className="text-emerald-500 font-extrabold font-sans text-sm">₹{gross.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label htmlFor="gross-numeric-input" className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Gross Annual Salary
              </label>
              <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
                Equivalent: <strong className="text-corporate dark:text-gold font-bold">{formatAsLakhs(gross)}</strong>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans font-semibold text-slate-400 dark:text-slate-500 text-base" aria-hidden="true">
                  ₹
                </span>
                <input
                  id="gross-numeric-input"
                  type="text"
                  value={grossInput}
                  onChange={(e) => handleGrossInputChange(e.target.value)}
                  placeholder="Enter gross annual salary (e.g. 12,00,000)"
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-100 text-base focus:outline-none focus:border-corporate dark:focus:border-gold focus:ring-1 focus:ring-corporate dark:focus:ring-gold transition-colors"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0" role="group" aria-label="Quick gross presets">
                {[600000, 1100000, 1400000, 2400000, 4800000].map((preset) => (
                  <button
                    key={`gross-preset-${preset}`}
                    type="button"
                    onClick={() => handleGrossSliderChange(preset)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                      gross === preset
                        ? 'bg-corporate dark:bg-gold border-corporate dark:border-gold text-white dark:text-navy shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-100 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {preset / 100000} LPA
                  </button>
                ))}
              </div>
            </div>

            {/* Slider */}
            <div className="pt-2">
              <input 
                type="range" 
                min={300000} 
                max={6000000} 
                step={50000} 
                value={gross} 
                onChange={(e) => handleGrossSliderChange(Number(e.target.value))}
                className="w-full accent-corporate dark:accent-gold cursor-pointer"
                id="gross-range-slider"
                aria-label="Gross annual salary range slider"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 select-none">
                <span>3 LPA</span>
                <span>15 LPA</span>
                <span>30 LPA</span>
                <span>60 LPA</span>
              </div>
            </div>

            {/* Gross configuration options */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  Employee EPF Deduction
                  <span className="group relative cursor-pointer" aria-label="EPF Information">
                    <Info size={12} className="text-slate-400" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-56 z-10 font-normal leading-normal">
                      **Capped**: Limits EPF basis to ₹15,000/mo statutory ceiling (₹21,600/yr). **Actual**: Computes a full 12% of your actual Basic Salary without ceiling limit.
                    </span>
                  </span>
                </span>
                <select
                  value={epfMode}
                  onChange={(e: any) => setEpfMode(e.target.value)}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-corporate focus:border-corporate cursor-pointer"
                >
                  <option value="capped">Capped (₹21,600/yr - Standard Statutory Ceiling)</option>
                  <option value="actual">Actual (12% of actual Basic Salary)</option>
                  <option value="none">No EPF Contribution</option>
                </select>
                <span className="text-[10px] text-slate-400 block leading-normal font-normal">
                  {epfMode === 'capped' && "Statutory limit on ₹15,000/mo salary ceiling."}
                  {epfMode === 'actual' && "Computed on 100% of your actual Basic pay."}
                  {epfMode === 'none' && "EPF contribution excluded."}
                  <span className="font-mono block font-bold text-slate-500 mt-0.5">Value: ₹{Math.round(employerEPF).toLocaleString('en-IN')}/year</span>
                </span>
              </div>

              <div className="space-y-1.5">
                <span>Basic Pay Portion (% of Gross)</span>
                <select
                  value={basicPercent}
                  onChange={(e) => setBasicPercent(Number(e.target.value))}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-corporate focus:border-corporate cursor-pointer"
                >
                  <option value={40}>40% of Gross</option>
                  <option value={50}>50% of Gross</option>
                  <option value={60}>60% of Gross</option>
                </select>
                <span className="text-[10px] text-slate-400 block font-mono font-normal">
                  Basic: ₹{Math.round(basicSalary).toLocaleString('en-IN')}/year
                </span>
              </div>

              {/* Professional Tax Input (Gross Mode) */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  Professional Tax (PT)
                  <span className="group relative cursor-pointer" aria-label="PT Information">
                    <Info size={12} className="text-slate-400" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-48 z-10 font-normal leading-normal">
                      PT is a state-wise tax (capped constitutionally at ₹2,500/year). Delhi, Haryana, and UP do not charge PT, while MH, KA, WB, TN deduct up to ₹2,500/yr.
                    </span>
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={deductPT}
                    onChange={(e) => setDeductPT(e.target.checked)}
                    className="accent-corporate dark:accent-gold rounded h-4 w-4 cursor-pointer"
                  />
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">₹</span>
                    <input
                      type="text"
                      disabled={!deductPT}
                      value={ptInput}
                      onChange={(e) => handlePtInputChange(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-5 pr-1.5 py-1 font-mono font-bold text-xs focus:outline-none focus:border-corporate disabled:opacity-50"
                      placeholder="2,500"
                      aria-label="Annual Professional Tax amount"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 block font-sans font-normal">
                  {deductPT ? `Annual: ₹${ptAmount.toLocaleString('en-IN')}` : 'Not Deducted'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Deductions & Exemptions Accordion (Old Regime Plan) */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setIsPlanningExpanded(!isPlanningExpanded)}
            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-950/60 flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200">
              <Coins className="text-corporate dark:text-gold shrink-0" size={18} />
              Tax Saving Deductions & Exemptions (Custom Old Regime Planner)
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-400 font-mono">
              Total Planned: <strong className="text-corporate dark:text-gold font-bold">₹{totalDeductionsOld.toLocaleString('en-IN')}</strong>
              {isPlanningExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {isPlanningExpanded && (
            <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Adjust your tax-saving exemptions under the **Old Regime**. These values do not affect the New Regime calculations, as the New Regime restricts most exemptions in favor of lower base slabs.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 text-xs">
                {/* 80C */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      Section 80C (PPF, ELSS, Insurance)
                      <span className="group relative cursor-pointer" aria-label="Section 80C Information">
                        <Info size={12} className="text-slate-400" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-56 z-20 font-normal leading-normal text-left">
                          Deduction under Section 80C of the Income-tax Act allows a rebate up to ₹1,50,000/yr for investments in PPF, ELSS, Employee Provident Fund (EPF), Life Insurance Premium, and housing loan principal repayment.
                        </span>
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Limit: ₹1,50,000</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₹</span>
                      <input
                        type="text"
                        value={ded80CInput}
                        onChange={(e) => handleDed80CChange(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-6 pr-2 py-1.5 font-mono font-bold focus:outline-none focus:border-corporate focus:ring-1 focus:ring-corporate"
                      />
                    </div>
                  </div>
                  {employeeEPF > 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono block">
                      ✔ Employee EPF of ₹{Math.round(employeeEPF).toLocaleString('en-IN')} auto-included in 80C total
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Net 80C Considered: ₹{total80C.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 80D */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      Section 80D (Health Insurance)
                      <span className="group relative cursor-pointer" aria-label="Section 80D Information">
                        <Info size={12} className="text-slate-400" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-56 z-20 font-normal leading-normal text-left">
                          Under Section 80D, deduction up to ₹25,000 is allowed for health premiums of self/family, plus up to ₹25,000 for parents (rising to ₹50,000 if parents are senior citizens).
                        </span>
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Limit: ₹75,000</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₹</span>
                    <input
                      type="text"
                      value={ded80DInput}
                      onChange={(e) => handleDed80DChange(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-6 pr-2 py-1.5 font-mono font-bold focus:outline-none focus:border-corporate focus:ring-1 focus:ring-corporate"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Deduction for medical premiums paid for self, family, and senior parents.</span>
                </div>

                {/* Sec 24b */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      Section 24(b) (Home Loan Interest)
                      <span className="group relative cursor-pointer" aria-label="Section 24(b) Information">
                        <Info size={12} className="text-slate-400" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-56 z-20 font-normal leading-normal text-left">
                          Interest paid on home loans. Capped at ₹2,00,000/yr for self-occupied properties under Section 24(b) of the Income-tax Act. Maximum net loss set-off from house property is capped at ₹2 Lakhs.
                        </span>
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Limit: ₹2,00,000 (Self-Occupied)</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₹</span>
                    <input
                      type="text"
                      value={ded24bInput}
                      onChange={(e) => handleDed24bChange(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-6 pr-2 py-1.5 font-mono font-bold focus:outline-none focus:border-corporate focus:ring-1 focus:ring-corporate"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block leading-normal">
                    Interest portion of EMI paid on home loans. Standard limit of ₹2,00,000 applies to self-occupied house properties only.
                  </span>
                </div>

                {/* Sec 80CCD */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      Section 80CCD(1B) (Voluntary NPS)
                      <span className="group relative cursor-pointer" aria-label="Section 80CCD(1B) Information">
                        <Info size={12} className="text-slate-400" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-56 z-20 font-normal leading-normal text-left">
                          Section 80CCD(1B) allows an additional exclusive deduction of up to ₹50,000/yr for voluntary contributions made to the National Pension System (NPS Tier-1), over and above the Section 80C limit.
                        </span>
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Limit: ₹50,000</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₹</span>
                    <input
                      type="text"
                      value={ded80CCDInput}
                      onChange={(e) => handleDed80CCDChange(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-6 pr-2 py-1.5 font-mono font-bold focus:outline-none focus:border-corporate focus:ring-1 focus:ring-corporate"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Exemptions over and above the Section 80C limit for NPS deposits.</span>
                </div>

                {/* Other Eligible Deductions (Manual Entry) */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80 md:col-span-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-700 dark:text-slate-300">
                      Other Eligible Deductions (Manual Entry)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">Cap: Gross Salary</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₹</span>
                    <input
                      type="text"
                      value={otherExemptInput}
                      onChange={(e) => handleOtherExemptChange(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-6 pr-2 py-1.5 font-mono font-bold focus:outline-none focus:border-corporate focus:ring-1 focus:ring-corporate"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block leading-normal">
                    Manually enter pre-calculated eligible deductions under Section 10 or 16. Note that HRA (House Rent Allowance under Sec 10(13A)), LTA (Leave Travel Allowance), and similar statutory exemptions must be calculated separately beforehand based on rent paid, City class, and basic pay, and then entered here.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Dual Regime Audit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* NEW REGIME CARD */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border-2 border-corporate/30 dark:border-gold/30 space-y-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 bg-corporate dark:bg-gold text-white dark:text-navy px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-bl-xl">
            New Tax Regime (FY 2025-26)
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Tax Audit Computation</span>
              <h4 className="font-extrabold text-base text-navy dark:text-white mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="text-corporate dark:text-gold shrink-0" size={18} />
                AY 2026-27 Slabs (FM Proposed)
              </h4>
            </div>

            <div className="space-y-2 font-mono text-xs border-t border-slate-200 dark:border-slate-800 pt-3">
              <div className="flex justify-between text-slate-500">
                <span>Gross Income:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">₹{gross.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span className="flex items-center gap-1">
                  (-) Standard Deduction (Sec 16(ia)):
                  <span className="group relative cursor-pointer" aria-label="Standard Deduction Info">
                    <Info size={12} className="text-slate-400" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-56 z-20 font-normal leading-normal text-left font-sans">
                      A flat standard deduction of ₹75,000 is allowed under Section 16(ia) of the Income-tax Act to all salaried employees under the New Regime starting FY 2025-26.
                    </span>
                  </span>
                </span>
                <span className="text-red-500 font-bold">-₹{ST_DED_NEW.toLocaleString('en-IN')}</span>
              </div>
              {PT_AMOUNT > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>(-) Professional Tax (Sec 16(iii)):</span>
                  <span className="text-slate-400 text-xs italic">Not deductible under the New Tax Regime</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>(-) Other Eligible Deductions:</span>
                <span className="text-slate-400 text-xs italic">Not deductible under the New Tax Regime</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-2 font-sans font-bold text-slate-800 dark:text-slate-200">
                <span>Net Taxable Income:</span>
                <span className="font-mono text-corporate dark:text-gold">₹{taxableNew.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-500 pt-1">
                <span>Cumulative Slab Tax:</span>
                <span>₹{newRegimeRes.baseTax.toLocaleString('en-IN')}</span>
              </div>
              
              {newRegimeRes.rebateApplied > 0 && (
                <div className="flex justify-between items-center text-emerald-500">
                  <span className="flex items-center gap-1">
                    (-) Section 87A Rebate / Relief:
                    <span className="group relative cursor-pointer" aria-label="Section 87A Information">
                      <Info size={12} className="text-emerald-500" />
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-56 z-20 font-normal leading-normal text-left font-sans">
                        Under Section 87A, individuals with taxable income up to ₹12,00,000 get a full rebate. Marginal relief is also provided if income slightly exceeds ₹12 Lakhs, capping the tax liability.
                      </span>
                    </span>
                  </span>
                  <span className="font-bold">-₹{newRegimeRes.rebateApplied.toLocaleString('en-IN')}</span>
                </div>
              )}

              {newRegimeRes.surcharge > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>(+) Surcharge:</span>
                  <span>
                    ₹{newRegimeRes.surcharge.toLocaleString('en-IN')}
                    {newRegimeRes.marginalReliefApplied && <span className="text-[9px] block text-emerald-500">(Marginal Relief Applied)</span>}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>(+) Cess @ 4% on (Tax + Surchg):</span>
                <span>₹{newRegimeRes.cess.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-sans font-black text-sm text-rose-500">
                <span>Total Annual Tax Outflow:</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">₹{newRegimeRes.finalTax.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            {/* Effective tax rate badge */}
            <div className="flex items-center justify-between text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 text-rose-600 dark:text-rose-400 font-mono">
              <span>Effective Tax Rate:</span>
              <span className="flex items-center gap-1">
                <Percent size={14} />
                {effectiveRateNew}%
              </span>
            </div>

            {/* In-Hand Monthly Breakdown */}
            <div className="bg-corporate/5 dark:bg-gold/5 p-4 rounded-xl space-y-3 border border-corporate/10 dark:border-gold/10">
              <div className="flex justify-between items-center font-mono">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Monthly Net Take-Home</span>
                  <span className="text-lg font-black text-corporate dark:text-gold">
                    ₹{monthlyTakeHomeNew.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Annual Net Take-Home</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    ₹{annualTakeHomeNew.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Take-home deductions breakdown list */}
              <div className="border-t border-corporate/10 dark:border-gold/10 pt-2 text-[10px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Gross Salary / Month:</span>
                  <span>₹{Math.round(gross / 12).toLocaleString('en-IN')}</span>
                </div>
                {employeeEPF > 0 && (
                  <div className="flex justify-between">
                    <span>(-) Employee EPF / Month:</span>
                    <span>₹{Math.round(employeeEPF / 12).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {PT_AMOUNT > 0 && (
                  <div className="flex justify-between">
                    <span>(-) Professional Tax / Month:</span>
                    <span>₹{Math.round(PT_AMOUNT / 12).toLocaleString('en-IN')} (₹{PT_AMOUNT.toLocaleString('en-IN')}/yr)</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>(-) Income Tax / Month:</span>
                  <span className="text-rose-500">₹{Math.round(newRegimeRes.finalTax / 12).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight italic mt-1.5 font-sans">
                *Estimates depend on standard statutory rules. Employer-specific deductions (e.g., meal cards, voluntary PF, or company insurance policies) will vary actual take-home.
              </p>
            </div>
          </div>
        </div>

        {/* OLD REGIME CARD */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Alternative Option</span>
                <h4 className="font-extrabold text-base text-navy dark:text-white mt-0.5 flex items-center gap-1.5">
                  <FileText className="text-slate-500 shrink-0" size={18} />
                  Old Slabs (Traditional)
                </h4>
              </div>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                Traditional
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex justify-between text-slate-500">
                <span>Gross Income:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">₹{gross.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span className="flex items-center gap-1">
                  (-) Standard Deduction (Sec 16(ia)):
                  <span className="group relative cursor-pointer" aria-label="Standard Deduction Info">
                    <Info size={12} className="text-slate-400" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-56 z-20 font-normal leading-normal text-left font-sans">
                      A standard deduction of ₹50,000 is allowed under Section 16(ia) of the Income-tax Act to all salaried employees under the Old Tax Regime.
                    </span>
                  </span>
                </span>
                <span className="text-red-500 font-bold">-₹{ST_DED_OLD.toLocaleString('en-IN')}</span>
              </div>
              {PT_AMOUNT > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>(-) Professional Tax (Sec 16(iii)):</span>
                  <span className="text-red-500 font-bold">-₹{PT_AMOUNT.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>(-) Planned Eligible Deductions & Exemptions:</span>
                <span className="text-red-500 font-bold">-₹{totalDeductionsOld.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-2 font-sans font-bold text-slate-800 dark:text-slate-200">
                <span>Net Taxable Income:</span>
                <span className="font-mono text-corporate dark:text-gold">₹{taxableOld.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-500 pt-1">
                <span>Cumulative Slab Tax:</span>
                <span>₹{oldRegimeRes.baseTax.toLocaleString('en-IN')}</span>
              </div>

              {oldRegimeRes.rebateApplied > 0 && (
                <div className="flex justify-between items-center text-emerald-500">
                  <span className="flex items-center gap-1">
                    (-) Section 87A Rebate (Max ₹12,500):
                    <span className="group relative cursor-pointer" aria-label="Section 87A Information">
                      <Info size={12} className="text-emerald-500" />
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded shadow-md w-56 z-20 font-normal leading-normal text-left font-sans">
                        Under Section 87A under the Old Regime, a full rebate up to ₹12,500 is allowed on taxable income not exceeding ₹5,00,000. No rebate is available if taxable income exceeds ₹5,00,000.
                      </span>
                    </span>
                  </span>
                  <span className="font-bold">-₹{oldRegimeRes.rebateApplied.toLocaleString('en-IN')}</span>
                </div>
              )}

              {oldRegimeRes.surcharge > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>(+) Surcharge:</span>
                  <span>
                    ₹{oldRegimeRes.surcharge.toLocaleString('en-IN')}
                    {oldRegimeRes.marginalReliefApplied && <span className="text-[9px] block text-emerald-500">(Marginal Relief Applied)</span>}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>(+) Cess @ 4% on (Tax + Surchg):</span>
                <span>₹{oldRegimeRes.cess.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 font-sans font-black text-sm text-rose-500">
                <span>Total Annual Tax Outflow:</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">₹{oldRegimeRes.finalTax.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            {/* Effective tax rate badge */}
            <div className="flex items-center justify-between text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 text-rose-600 dark:text-rose-400 font-mono">
              <span>Effective Tax Rate:</span>
              <span className="flex items-center gap-1">
                <Percent size={14} />
                {effectiveRateOld}%
              </span>
            </div>

            {/* In-Hand Monthly Breakdown */}
            <div className="bg-slate-100/50 dark:bg-slate-800/10 p-4 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center font-mono">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Monthly Net Take-Home</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                    ₹{monthlyTakeHomeOld.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Annual Net Take-Home</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    ₹{annualTakeHomeOld.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Take-home deductions breakdown list */}
              <div className="border-t border-slate-200 dark:border-slate-800/80 pt-2 text-[10px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Gross Salary / Month:</span>
                  <span>₹{Math.round(gross / 12).toLocaleString('en-IN')}</span>
                </div>
                {employeeEPF > 0 && (
                  <div className="flex justify-between">
                    <span>(-) Employee EPF / Month:</span>
                    <span>₹{Math.round(employeeEPF / 12).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {PT_AMOUNT > 0 && (
                  <div className="flex justify-between">
                    <span>(-) Professional Tax / Month:</span>
                    <span>₹{Math.round(PT_AMOUNT / 12).toLocaleString('en-IN')} (₹{PT_AMOUNT.toLocaleString('en-IN')}/yr)</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>(-) Income Tax / Month:</span>
                  <span className="text-rose-500">₹{Math.round(oldRegimeRes.finalTax / 12).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight italic mt-1.5 font-sans">
                *Estimates depend on standard statutory rules. Employer-specific deductions (e.g., meal cards, voluntary PF, or company insurance policies) will vary actual take-home.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Recommended Regime Banner */}
      <div className="p-5 rounded-2xl bg-corporate/5 dark:bg-gold/5 border border-corporate/20 dark:border-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-3 items-start text-left">
          <TrendingUp className="text-corporate dark:text-gold shrink-0 mt-0.5" size={20} />
          <div>
            <h5 className="font-black text-sm text-navy dark:text-white flex items-center gap-1.5">
              <Check size={16} className="text-emerald-500" />
              Comparative Audit Conclusion & Recommendation
            </h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 font-medium">
              Filing your income tax under the <strong className="text-corporate dark:text-gold">{preferredRegime}</strong> will optimize your outflows, saving you approximately <strong className="text-emerald-500">₹{savings.toLocaleString('en-IN')}</strong> per year in net taxes and boosting your in-hand take-home salary.
            </p>
          </div>
        </div>
        <div className="shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest block font-sans leading-none">Net Tax Saved / Yr</span>
          <span className="text-lg font-black font-mono block mt-1">₹{savings.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Collapsible Slab Audit Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsAuditExpanded(!isAuditExpanded)}
          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-950/60 flex items-center justify-between text-left transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200">
            <FileText className="text-corporate dark:text-gold shrink-0" size={18} />
            Slab-by-Slab Cumulative Tax Audit Report (Detailed Breakdown)
          </span>
          <span className="text-xs font-semibold text-slate-400 font-mono">
            {isAuditExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        {isAuditExpanded && (
          <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New Regime Slabs Audit */}
              <div className="space-y-2">
                <h5 className="text-xs font-black text-corporate dark:text-gold uppercase tracking-wider font-sans">
                  New Regime Slab Allocation (Taxable: ₹{taxableNew.toLocaleString('en-IN')})
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full font-mono text-left text-[11px] border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-sans">
                        <th className="p-2 font-bold">Tax Slab</th>
                        <th className="p-2 font-bold text-center">Rate</th>
                        <th className="p-2 font-bold text-right">Income in Slab</th>
                        <th className="p-2 font-bold text-right">Tax Computed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {newRegimeRes.slabs.map((slab, idx) => (
                        <tr key={`slab-new-row-${idx}`} className={slab.taxableAmount > 0 ? "bg-corporate/5 dark:bg-gold/5 font-bold" : ""}>
                          <td className="p-2 font-sans text-slate-700 dark:text-slate-300">{slab.name}</td>
                          <td className="p-2 text-center text-slate-500">{slab.rate}%</td>
                          <td className="p-2 text-right">₹{slab.taxableAmount.toLocaleString('en-IN')}</td>
                          <td className="p-2 text-right text-rose-500">₹{slab.tax.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 dark:bg-slate-950 font-bold border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        <td className="p-2 font-sans" colSpan={2}>Slab Tax Total:</td>
                        <td className="p-2 text-right">₹{taxableNew.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right text-rose-500">₹{newRegimeRes.baseTax.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Old Regime Slabs Audit */}
              <div className="space-y-2">
                <h5 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider font-sans">
                  Old Regime Slab Allocation (Taxable: ₹{taxableOld.toLocaleString('en-IN')})
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full font-mono text-left text-[11px] border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-sans">
                        <th className="p-2 font-bold">Tax Slab</th>
                        <th className="p-2 font-bold text-center">Rate</th>
                        <th className="p-2 font-bold text-right">Income in Slab</th>
                        <th className="p-2 font-bold text-right">Tax Computed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {oldRegimeRes.slabs.map((slab, idx) => (
                        <tr key={`slab-old-row-${idx}`} className={slab.taxableAmount > 0 ? "bg-slate-100/50 dark:bg-slate-800/10 font-bold" : ""}>
                          <td className="p-2 font-sans text-slate-700 dark:text-slate-300">{slab.name}</td>
                          <td className="p-2 text-center text-slate-500">{slab.rate}%</td>
                          <td className="p-2 text-right">₹{slab.taxableAmount.toLocaleString('en-IN')}</td>
                          <td className="p-2 text-right text-rose-500">₹{slab.tax.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 dark:bg-slate-950 font-bold border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        <td className="p-2 font-sans" colSpan={2}>Slab Tax Total:</td>
                        <td className="p-2 text-right">₹{taxableOld.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right text-rose-500">₹{oldRegimeRes.baseTax.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Surcharge Marginal Relief Technical Detail */}
            {(newRegimeRes.marginalReliefApplied || oldRegimeRes.marginalReliefApplied) && (
              <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={16} />
                  Surcharge Marginal Relief Technical Audit Note:
                </p>
                <p className="mt-1 font-medium font-sans">
                  Surcharge Marginal Relief is calculated to ensure that any increment in tax liability (including surcharge) due to a higher income tier does not exceed the absolute amount of income exceeding the threshold (₹50L, ₹1Cr, ₹2Cr, or ₹5Cr).
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-0.5 font-mono text-[11px]">
                  {newRegimeRes.marginalReliefApplied && (
                    <li>New Regime Marginal Relief: Saved <strong className="text-emerald-500 font-sans">₹{Math.round(newRegimeRes.marginalReliefAmount).toLocaleString('en-IN')}</strong> by capping total liability at threshold tax plus excess income.</li>
                  )}
                  {oldRegimeRes.marginalReliefApplied && (
                    <li>Old Regime Marginal Relief: Saved <strong className="text-emerald-500 font-sans">₹{Math.round(oldRegimeRes.marginalReliefAmount).toLocaleString('en-IN')}</strong> by capping total liability at threshold tax plus excess income.</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Statutory Assumptions Section */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/60 text-[10.5px] text-slate-600 dark:text-slate-400 font-sans space-y-2 mt-6">
        <p className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <BookOpen size={12} className="text-corporate dark:text-gold" />
          Statutory Assumptions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 leading-normal">
          <div className="flex items-start gap-1.5">
            <span className="text-corporate dark:text-gold font-bold select-none">•</span>
            <span><strong>Assessment Year:</strong> FY 2025–26 (AY 2026–27).</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-corporate dark:text-gold font-bold select-none">•</span>
            <span><strong>Standard Deduction:</strong> Applied automatically (₹75,000 for New Regime, ₹50,000 for Old Regime).</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-corporate dark:text-gold font-bold select-none">•</span>
            <span><strong>Professional Tax:</strong> Fully user-editable based on regional/state criteria.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-corporate dark:text-gold font-bold select-none">•</span>
            <span><strong>HRA / LTA Exemptions:</strong> Must be calculated separately using rent, basic pay, and city class before entry.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-corporate dark:text-gold font-bold select-none">•</span>
            <span><strong>Take-Home Salary:</strong> Illustrative estimate based on inputs, standard EPF, and direct statutory deductions.</span>
          </div>
        </div>
      </div>

      {/* Professional Legal Disclaimer Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-5 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-sans space-y-1 select-none">
        <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <AlertTriangle size={12} className="text-amber-500" />
          Statutory Legal & Professional Disclaimer
        </p>
        <p>
          This calculator is designed solely for preliminary comparative auditing and general financial planning based on the provisions of the Finance Act 2025 and applicable Indian Income Tax Act, 1961 regulations for Assessment Year (AY) 2026-27.
        </p>
        <p>
          Calculations are subject to employer payroll schedules, individual investment declarations, verified Section 80C/80D/24(b) proofs, state-level Professional Tax criteria, and official assessment findings. Users are strongly advised to verify final calculations against official utility filings of the Income Tax Department or consult a certified **Chartered Accountant (CA)** before submitting forms or completing tax declarations.
        </p>
      </div>
    </div>
  );
};
