import React, { useState } from 'react';
import { AlertTriangle, Terminal } from 'lucide-react';

export const DeveloperSandboxTool: React.FC = () => {
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
      } else if (selectedEndpoint === 'verify-mca') {
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
      } else if (selectedEndpoint === 'verify-pan') {
        setResponseLog(JSON.stringify({
          status: "SUCCESS",
          apiVersion: "v1.4",
          data: {
            pan: "AAPFU0939F",
            holderName: "ANKESH KUMAR SINGH",
            category: "Individual",
            seedingAadhaarStatus: "Linked",
            activeTaxpayerStatus: "Yes"
          }
        }, null, 2));
      }
    }, 750);
  };

  return (
    <div className="space-y-6" id="developer-sandbox-tool">
      <div>
        <h3 className="text-2xl font-extrabold text-navy dark:text-white flex items-center gap-2">
          💻 Indian Compliance Developers Sandbox
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Perform live GET / POST actions directly onto our verified compliance endpoint schemas. Perfect for ERP developers and SaaS onboarding teams.
        </p>
      </div>

      <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 text-amber-800 dark:text-amber-400 px-4 py-3 rounded-xl text-xs flex items-start sm:items-center gap-2.5">
        <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed font-medium">
          <span className="font-extrabold text-amber-700 dark:text-amber-300 mr-1.5 uppercase tracking-wide">Demo Sandbox:</span>
          This endpoint utilizes sandbox mock data protocols to mimic regulatory API returns.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Input Parameters Box */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-950/20 text-left">
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block">Configure API Payload headers</span>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Endpoint Service Route</label>
            <select 
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono rounded-lg px-2 py-2 focus:outline-none"
            >
              <option value="verify-gst">GET /api/v1/gstin/verify (GSTIN Validator)</option>
              <option value="verify-mca">GET /api/v1/mca/company (CIN MCA Audits)</option>
              <option value="verify-pan">GET /api/v1/pan/verify (PAN Card Status)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Bearer Token Header</label>
            <input 
              type="text" 
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono rounded-lg px-2 py-2 focus:outline-none"
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
          <Terminal size={14} className="absolute top-2 right-2 text-slate-650 pointer-events-none" />
          <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed text-left">
            {responseLog}
          </pre>
        </div>

      </div>
    </div>
  );
};
