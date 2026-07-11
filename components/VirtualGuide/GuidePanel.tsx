import React, { useCallback } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Compass,
  User,
  Briefcase,
  Landmark,
  FileText,
  Cpu,
  Mail,
  ChevronRight,
} from 'lucide-react';

interface GuidePanelProps {
  onClose: () => void;
}

interface NavItem {
  name: string;
  shortName: string;
  hash: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'About', shortName: 'About', hash: '#about', icon: User },
  { name: 'Experience', shortName: 'Experience', hash: '#experience', icon: Briefcase },
  { name: 'Compliance Hub', shortName: 'Compliance', hash: '#compliance-hub', icon: Landmark },
  { name: 'PDF Toolkit', shortName: 'PDF Toolkit', hash: '#pdf-toolkit', icon: FileText },
  { name: 'AI Workspace', shortName: 'AI Workspace', hash: '#tech-compliance-desk', icon: Cpu },
  { name: 'Contact', shortName: 'Contact', hash: '#contact', icon: Mail },
];

export default function GuidePanel({ onClose }: GuidePanelProps) {
  // Handles scrolling smoothly with header offset compensation
  const handleNavigate = useCallback(
    (hash: string) => {
      onClose();

      // Update URL hash
      window.location.hash = hash;

      setTimeout(() => {
        const id = hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          const offset = 100;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition >= 0 ? offsetPosition : 0,
            behavior: 'smooth',
          });
        }
      }, 150);
    },
    [onClose]
  );

  const handleStartTour = () => {
    onClose();
    // Dispatch global event that PortfolioTour will listen to!
    window.dispatchEvent(new CustomEvent('start-portfolio-tour'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(4px)' }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="pointer-events-auto w-full max-w-[310px] sm:max-w-[340px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-850/80 rounded-[24px] p-5 shadow-2xl mb-3 relative flex flex-col text-left text-navy dark:text-white"
    >
      {/* Decorative top gold gradient accent line */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100/60 dark:border-slate-900/40 pb-2.5 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 shadow-sm">
            <img
              src="/Hero.webp"
              alt="Ankesh"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://i.postimg.cc/LXJD8Xrg/Portfolio.png';
              }}
              className="w-full h-full object-cover object-top scale-125"
            />
          </div>
          <div>
            <h3 className="text-xs font-bold text-navy dark:text-white leading-none">
              Digital Ankesh
            </h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Interactive Assistant
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          title="Close panel"
        >
          <X size={13} />
        </button>
      </div>

      {/* Welcome Message */}
      <div className="mb-3.5 space-y-0.5">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
          👋 Hi, I'm Ankesh.
        </p>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-normal">
          Welcome to my interactive workspace.
        </p>
      </div>

      {/* Primary Action: Take a Quick Tour */}
      <button
        onClick={handleStartTour}
        className="w-full flex items-center justify-center gap-1.5 mb-3.5 py-2 px-3 rounded-xl bg-corporate dark:bg-gold text-white dark:text-navy text-[11px] font-bold hover:opacity-95 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
      >
        <Compass size={13} />
        <span>Take a Quick Tour</span>
      </button>

      {/* Section Divider */}
      <div className="h-[1px] bg-slate-100 dark:bg-slate-900/50 mb-3" />

      {/* Direct Module Navigation Grid - Two Column layout */}
      <div className="flex flex-col">
        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest pl-0.5 mb-1.5">
          Quick Jump
        </p>
        
        <div className="grid grid-cols-2 gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.hash}
                onClick={() => handleNavigate(item.hash)}
                className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg border border-slate-100 dark:border-slate-900/40 hover:border-gold/30 dark:hover:border-gold/30 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/70 transition-all text-left text-slate-600 dark:text-slate-350 hover:text-navy dark:hover:text-gold cursor-pointer group"
              >
                <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 group-hover:text-gold group-hover:bg-gold/10 transition-colors shrink-0">
                  <Icon size={12} />
                </div>
                <span className="text-[11px] font-semibold truncate leading-none">
                  {item.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
