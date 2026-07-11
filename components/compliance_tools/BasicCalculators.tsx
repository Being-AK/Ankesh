import React, { useState } from 'react';
import { Calculator, TrendingUp, Coins, Info } from 'lucide-react';

// ==========================================
// 1. HOME LOAN EMI CALCULATOR
// ==========================================
export const HomeLoanEMICalc: React.FC = () => {
  const [principal, setPrincipal] = useState(5000000); // 50 Lakhs
  const [rate, setRate] = useState(8.5); // 8.5%
  const [tenure, setTenure] = useState(20); // 20 years

  const r = rate / 12 / 100;
  const n = tenure * 12;
  const emi = Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) || 0;
  const totalPayment = emi * n;
  const totalInterest = totalPayment - principal;

  return (
    <div className="space-y-6" id="home-loan-emi-calculator">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🧮 Interactive Home Loan EMI Calculator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Calculate monthly loan repayments (EMI), principal components, and aggregate debt interest schedules instantly.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Principal Amount</span>
            <span className="font-mono text-corporate dark:text-gold font-black">₹{principal.toLocaleString('en-IN')}</span>
          </div>
          <input 
            type="range" 
            min={100000} 
            max={20000000} 
            step={100000} 
            value={principal} 
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Interest Rate (p.a. %)</span>
            <span className="font-mono text-corporate dark:text-gold font-black">{rate}%</span>
          </div>
          <input 
            type="range" 
            min={5} 
            max={20} 
            step={0.1} 
            value={rate} 
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Loan Tenure</span>
            <span className="font-mono text-corporate dark:text-gold font-black">{tenure} Years</span>
          </div>
          <input 
            type="range" 
            min={1} 
            max={30} 
            value={tenure} 
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold cursor-pointer"
          />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center font-mono">
        <div className="p-3 border-r border-slate-200 dark:border-slate-800 sm:last:border-0 last:border-0">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-sans">Monthly EMI Outflow</span>
          <span className="text-lg font-black text-corporate dark:text-gold block mt-2">₹{emi.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3 border-r border-slate-200 dark:border-slate-800 sm:last:border-0 last:border-0">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-sans">Aggregate Interest Outgo</span>
          <span className="text-lg font-black text-rose-500 block mt-2">₹{totalInterest.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-sans">Aggregate Payment</span>
          <span className="text-base font-black text-slate-800 dark:text-slate-200 block mt-2">₹{totalPayment.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. ROI & CAGR SIMULATOR
// ==========================================
export const ROICalc: React.FC = () => {
  const [initAmt, setInitAmt] = useState(100000);
  const [finAmt, setFinAmt] = useState(180000);
  const [years, setYears] = useState(5);

  const absoluteReturn = Math.round(((finAmt - initAmt) / initAmt) * 100);
  const cagr = Number((Math.pow(finAmt / initAmt, 1 / years) - 1) * 100).toFixed(2);

  return (
    <div className="space-y-6" id="roi-cagr-calculator">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          📈 Return on Investment (ROI) & CAGR Simulator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Analyse compounded annual growth rate (CAGR) profiles across asset holding horizons.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Initial Principal Outlay</span>
            <span className="font-mono text-corporate dark:text-gold font-black">₹{initAmt.toLocaleString('en-IN')}</span>
          </div>
          <input 
            type="range" 
            min={10000} 
            max={5000000} 
            step={10000} 
            value={initAmt} 
            onChange={(e) => setInitAmt(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Estimated Maturity Valuation</span>
            <span className="font-mono text-corporate dark:text-gold font-black">₹{finAmt.toLocaleString('en-IN')}</span>
          </div>
          <input 
            type="range" 
            min={10000} 
            max={10000000} 
            step={20000} 
            value={finAmt} 
            onChange={(e) => setFinAmt(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Investment Duration (Years)</span>
            <span className="font-mono text-corporate dark:text-gold font-black">{years} Years</span>
          </div>
          <input 
            type="range" 
            min={1} 
            max={30} 
            value={years} 
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold cursor-pointer"
          />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4 text-center font-mono">
        <div className="p-3 border-r border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-sans">Absolute Yield</span>
          <span className="text-xl font-black text-emerald-500 block mt-2">{absoluteReturn}%</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-sans">Compounded CAGR</span>
          <span className="text-xl font-black text-corporate dark:text-gold block mt-2">{cagr}%</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. RECURRING SIP SAVINGS CALCULATOR
// ==========================================
export const SavingsCalc: React.FC = () => {
  const [monthly, setMonthly] = useState(10000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const r = rate / 12 / 100;
  const n = years * 12;
  const futureValue = Math.round(monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  const principalAmount = monthly * n;
  const earnings = futureValue - principalAmount;

  return (
    <div className="space-y-6" id="sip-savings-calculator">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          💰 Recurring SIP Savings Goal Calculator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Project future compounded maturity values on routine monthly equity/mutual fund SIPs.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Monthly SIP Contribution</span>
            <span className="font-mono text-corporate dark:text-gold font-black">₹{monthly.toLocaleString('en-IN')}</span>
          </div>
          <input 
            type="range" 
            min={500} 
            max={200000} 
            step={500} 
            value={monthly} 
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Expected Growth Rate (p.a. %)</span>
            <span className="font-mono text-corporate dark:text-gold font-black">{rate}%</span>
          </div>
          <input 
            type="range" 
            min={4} 
            max={30} 
            step={0.5} 
            value={rate} 
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Duration (Years)</span>
            <span className="font-mono text-corporate dark:text-gold font-black">{years} Years</span>
          </div>
          <input 
            type="range" 
            min={1} 
            max={40} 
            value={years} 
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold cursor-pointer"
          />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center font-mono">
        <div className="p-3 border-r border-slate-200 dark:border-slate-800 sm:last:border-0 last:border-0">
          <span className="text-[10px] text-slate-405 block font-bold uppercase tracking-wider font-sans">Invested Principal</span>
          <span className="text-sm font-black text-slate-850 dark:text-slate-200 block mt-2">₹{principalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3 border-r border-slate-200 dark:border-slate-800 sm:last:border-0 last:border-0">
          <span className="text-[10px] text-slate-405 block font-bold uppercase tracking-wider font-sans">Compounded Yield</span>
          <span className="text-sm font-black text-emerald-500 block mt-2">₹{earnings.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-405 block font-bold uppercase tracking-wider font-sans">Aggregate Wealth</span>
          <span className="text-xl font-black text-corporate dark:text-gold block mt-2">₹{futureValue.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. COMPOUND INTEREST CALCULATOR
// ==========================================
export const CompoundInterestCalc: React.FC = () => {
  const [init, setInit] = useState(100000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(10);
  const [frequency, setFrequency] = useState(12); // Compounded Monthly

  const total = Math.round(init * Math.pow(1 + (rate / 100 / frequency), frequency * years));
  const interest = total - init;

  return (
    <div className="space-y-6" id="compound-interest-calculator">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          🧮 Pure Compound Interest Calculator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Explore the compounding growth curve. Simulate quarterly, monthly, or annual compounding frequency splits.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Base Capital Outlay</span>
            <span className="font-mono text-corporate dark:text-gold font-black">₹{init.toLocaleString('en-IN')}</span>
          </div>
          <input 
            type="range" 
            min={5000} 
            max={2000000} 
            step={5000} 
            value={init} 
            onChange={(e) => setInit(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Rate of Interest (%)</span>
            <span className="font-mono text-corporate dark:text-gold font-black">{rate}%</span>
          </div>
          <input 
            type="range" 
            min={4} 
            max={30} 
            step={0.5} 
            value={rate} 
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-corporate dark:accent-gold cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-605 dark:text-slate-300">
            <span>Compounding Frequency</span>
            <select 
              value={frequency} 
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="bg-white dark:bg-slate-950 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 focus:outline-none"
            >
              <option value={12}>Compounded Monthly</option>
              <option value={4}>Compounded Quarterly</option>
              <option value={1}>Compounded Annually</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4 text-center font-mono">
        <div className="p-3 border-r border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-sans">Compounded Interest</span>
          <span className="text-lg font-black text-navy dark:text-white block mt-2">₹{interest.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-sans">Total Maturity Wealth</span>
          <span className="text-xl font-black text-corporate dark:text-gold block mt-2">₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};
