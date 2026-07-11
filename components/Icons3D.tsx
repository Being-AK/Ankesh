import React from 'react';
import { 
  Calculator, Coins, PieChart, TrendingUp, DollarSign, Percent, 
  Building2, Factory, Cpu, Briefcase, ShoppingBag, Quote, Shield, 
  FileText, Users, Globe, Landmark, Zap, Lock, BarChart3, CheckCircle2,
  MapPin, Mail, Linkedin, ArrowRight, Menu, X, Download, Sun, Moon,
  Calendar, ClipboardCheck, ClipboardList, ShoppingCart, FileCheck
} from 'lucide-react';

export const Icons3D = {
  // ==========================================
  // Finance
  // ==========================================
  // Icons representing numeric values, currency rates, and calculations
  Calculator, 
  Coins, 
  Dollar: DollarSign, 
  Graph: TrendingUp, 
  Percent,

  // ==========================================
  // Accounting & Compliance
  // ==========================================
  // Core business regulations, compliance systems, and domain-specific semantic mappings
  Approved: ClipboardCheck,
  Audit: FileText,
  Compliance: Shield,
  FinancialReport: PieChart,
  GST: Coins,
  ROC: Building2,
  Taxation: Percent,
  "Transfer Pricing": Globe,
  TransferPricing: Globe,
  Verification: ClipboardCheck,

  // ==========================================
  // PDF Toolkit
  // ==========================================
  // Local document operations and portable document format handlers
  PDF: FileText,

  // ==========================================
  // Verification & Security
  // ==========================================
  // Secure environments, locks, and local privacy metrics
  AI: Cpu,
  OCR: Cpu,
  Security: Lock,

  // ==========================================
  // Analytics
  // ==========================================
  // Charts, progression logs, and metadata analysis tracks
  Analytics: BarChart3,
  Chart: PieChart,

  // ==========================================
  // Industries
  // ==========================================
  // Industry-specific business domains and organizational layouts
  Briefcase,
  Building: Building2, 
  Cart: ShoppingBag, 
  Cpu, 
  Factory, 

  // ==========================================
  // Navigation
  // ==========================================
  // Interactive navigation rails, sliders, menus, and controls
  ArrowRight,
  Download, 
  Menu, 
  Moon,
  Sun, 
  X,

  // ==========================================
  // Contact
  // ==========================================
  // Communication routes and professional networking hooks
  Linkedin, 
  Mail, 
  MapPin, 

  // ==========================================
  // General UI
  // ==========================================
  // Common reusable interface elements
  BarChart: BarChart3, 
  CheckCircle: CheckCircle2,
  FileText, 
  Globe, 
  Landmark, 
  Lock, 
  Quote, 
  Shield, 
  Users, 
  Zap,

  // ==========================================
  // Miscellaneous
  // ==========================================
  // Scheduling components, calendars, and checklists
  Calendar, 
  ClipboardCheck, 
  ClipboardList
};

interface Icon3DProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ElementType;
  theme?: 'gold' | 'corporate' | 'emerald' | 'purple' | 'blue' | 'navy' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Icon3D: React.FC<Icon3DProps> = ({ 
  icon: Icon, 
  theme = 'gold', 
  size = 'md', 
  className = '',
  title,
  'aria-label': ariaLabel,
  ...props
}) => {
  
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-12 h-12 p-2.5',
    lg: 'w-16 h-16 p-3.5',
    xl: 'w-20 h-20 p-4'
  };

  const themeClasses = {
    gold: 'from-amber-300 to-amber-500 shadow-amber-600/20 text-white',
    corporate: 'from-blue-400 to-blue-600 shadow-blue-700/20 text-white',
    emerald: 'from-emerald-400 to-emerald-600 shadow-emerald-700/20 text-white',
    purple: 'from-purple-400 to-purple-600 shadow-purple-700/20 text-white',
    blue: 'from-sky-400 to-sky-600 shadow-sky-700/20 text-white',
    navy: 'from-slate-700 to-slate-900 shadow-slate-900/20 text-white',
    white: 'from-white to-slate-100 shadow-slate-300/40 text-slate-800 border border-slate-200/50',
  };

  const isDecorative = !ariaLabel && !title;

  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${themeClasses[theme]} shadow-[0_4px_0_rgba(0,0,0,0.15)] ${sizeClasses[size]} ${className} select-none`}
      role={isDecorative ? undefined : 'img'}
      aria-label={ariaLabel || title}
      aria-hidden={isDecorative ? 'true' : undefined}
      title={title}
      {...props}
    >
      {/* 3D Glossy Light Highlight */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-xl pointer-events-none"></div>
      
      {/* Icon rendering with visual floating depth */}
      <Icon className="relative z-10 w-full h-full drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.25)]" />
    </div>
  );
};