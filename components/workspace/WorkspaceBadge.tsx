import React from 'react';
import { Shield, WifiOff, Cpu, Layers, BadgeCheck } from 'lucide-react';

interface WorkspaceBadgeProps {
  clientSide?: boolean;
  privateSecure?: boolean;
  offlineReady?: boolean;
  enterpriseGrade?: boolean;
  aiPowered?: boolean;
  className?: string;
}

export const WorkspaceBadge: React.FC<WorkspaceBadgeProps> = ({
  clientSide = true,
  privateSecure = true,
  offlineReady = true,
  enterpriseGrade = false,
  aiPowered = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 select-none font-mono text-[9px] font-black uppercase tracking-wider ${className}`}>
      {clientSide && (
        <span 
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15"
          title="All code executes exclusively on your machine"
        >
          <Layers size={10} />
          Client Side
        </span>
      )}
      
      {privateSecure && (
        <span 
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15"
          title="No data is uploaded, stored, or analyzed externally"
        >
          <Shield size={10} />
          Private Sandbox
        </span>
      )}

      {offlineReady && (
        <span 
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15"
          title="Fully operational without internet connectivity"
        >
          <WifiOff size={10} />
          Offline Ready
        </span>
      )}

      {enterpriseGrade && (
        <span 
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15"
          title="Engineered to meet statutory verification standard"
        >
          <BadgeCheck size={10} />
          Enterprise Grade
        </span>
      )}

      {aiPowered && (
        <span 
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/15 animate-pulse"
          title="Leveraging client-safe generative intelligence models"
        >
          <Cpu size={10} />
          AI Powered
        </span>
      )}
    </div>
  );
};
