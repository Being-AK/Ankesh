import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { FloatingIcon, FinanceIcons } from './FinanceElements';
import { Icon3D, Icons3D } from './Icons3D';
import { ClipboardCheck, Receipt, FileSpreadsheet, Scale, TrendingUp, Cpu } from 'lucide-react';

const BADGES = [
  {
    name: "Statutory Audit",
    icon: ClipboardCheck,
    colorClass: "text-corporate dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-blue-500/5",
  },
  {
    name: "Direct & Indirect Taxation",
    icon: Receipt,
    colorClass: "text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 hover:border-orange-400 dark:hover:border-orange-700 hover:shadow-orange-500/5",
  },
  {
    name: "Financial Reporting",
    icon: FileSpreadsheet,
    colorClass: "text-corporate dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-blue-500/5",
  },
  {
    name: "Corporate Compliance",
    icon: Scale,
    colorClass: "text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 hover:border-orange-400 dark:hover:border-orange-700 hover:shadow-orange-500/5",
  },
  {
    name: "Transfer Pricing",
    icon: TrendingUp,
    colorClass: "text-corporate dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-blue-500/5",
  },
  {
    name: "Compliance Technology",
    icon: Cpu,
    colorClass: "text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 hover:border-orange-400 dark:hover:border-orange-700 hover:shadow-orange-500/5",
  },
];

const About: React.FC = () => {
  const ABOUT_IMAGE_URL = "https://i.postimg.cc/LXJD8Xrg/Portfolio.png";
  
  const [auditCount, setAuditCount] = useState(0);
  const [turnoverCount, setTurnoverCount] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const hasAnimated = useRef(false);
  const animFrameIds = useRef<number[]>([]);

  useEffect(() => {
    const currentSection = sectionRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateValue(setAuditCount, 0, 30, 2000);
          animateValue(setTurnoverCount, 0, 300, 2500);
          if (currentSection) {
            observer.unobserve(currentSection);
          }
        }
      },
      { threshold: 0.3 }
    );

    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
      observer.disconnect();
      animFrameIds.current.forEach(id => window.cancelAnimationFrame(id));
      animFrameIds.current = [];
    };
  }, []);

  const animateValue = (setter: React.Dispatch<React.SetStateAction<number>>, start: number, end: number, duration: number) => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setter(Math.floor(easeOutQuart * (end - start) + start));
      if (progress < 1) {
        const id = window.requestAnimationFrame(step);
        animFrameIds.current.push(id);
      }
    };
    const id = window.requestAnimationFrame(step);
    animFrameIds.current.push(id);
  };

  // Track mouse tilt coordinates on the visual block
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // [-0.5, 0.5]
    const y = (e.clientY - rect.top) / rect.height - 0.5; // [-0.5, 0.5]
    setTilt({ x: x * 15, y: -y * 15 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 100, damping: 16 }
    }
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.85, y: 15 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 140, damping: 14 }
    }
  };

  return (
    <section id="about" ref={sectionRef} className="py-24 bg-white dark:bg-darkBg transition-colors duration-300 relative overflow-hidden" aria-labelledby="about-heading">
      {/* Decorative Floating Elements using 3D Icons */}
      <FloatingIcon icon={<Icon3D icon={Icons3D.Coins} theme="gold" size="md" />} className="top-10 right-10" delay="1s" />
      <FloatingIcon icon={<Icon3D icon={Icons3D.Dollar} theme="emerald" size="md" />} className="bottom-10 left-10" delay="2s" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-center">
          
          {/* Visual Portrait with dynamic 3D Mouse Tilt and reflections */}
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full md:w-[42%] lg:w-[38%] relative group shrink-0 cursor-pointer select-none"
            style={{ perspective: '1000px' }}
          >
            <motion.div 
              style={{
                rotateY: tilt.x,
                rotateX: tilt.y,
                transformStyle: 'preserve-3d'
              }}
              animate={{
                y: [0, -3, 0],
              }}
              transition={{
                y: { repeat: Infinity, duration: 5, ease: "easeInOut" },
                type: 'spring',
                stiffness: 120,
                damping: 18
              }}
              className="aspect-[4/5] bg-navy dark:bg-slate-800 rounded-2xl overflow-hidden relative shadow-2xl border-8 border-white dark:border-slate-800"
            >
              <img 
                src={ABOUT_IMAGE_URL}
                alt="Ankesh Kumar - Professional Portrait" 
                className="w-full h-full object-cover object-[50%_34%] opacity-90 group-hover:opacity-100 transition-opacity duration-500 scale-102 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop";
                }}
              />
              
              {/* Premium Lens Sweep Glare */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                <motion.div
                  animate={{ left: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, repeatDelay: 6, duration: 1.8, ease: "easeInOut" }}
                  className="absolute top-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white" style={{ transform: 'translateZ(30px)' }}>
                <div className="inline-block px-3 py-1 mb-2 bg-gold text-white text-xs font-bold uppercase tracking-wider rounded-sm">Based in</div>
                <p className="text-2xl font-bold">Hyderabad, India</p>
              </div>
            </motion.div>
            
            {/* Ambient Background Glow matching mouse tilt in inverse direction */}
            <motion.div 
              style={{
                x: tilt.x * -0.5,
                y: tilt.y * -0.5,
                z: -10
              }}
              className="absolute -top-4 -left-4 w-full h-full border-2 border-gold/30 rounded-2xl -z-10 group-hover:border-gold/50 transition-colors"
            />
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="w-full md:w-[58%] lg:w-[62%]"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-1 mb-2">
              <span className="w-3.5 h-1 bg-orange-500 rounded-full"></span>
              <span className="w-3.5 h-1 bg-slate-300 dark:bg-slate-400 rounded-full"></span>
              <span className="w-3.5 h-1 bg-emerald-500 rounded-full"></span>
            </motion.div>
            
            <motion.h2 variants={itemVariants} className="text-sm font-bold text-gold uppercase tracking-widest mb-2">Professional Profile</motion.h2>
            <motion.h3 variants={itemVariants} id="about-heading" className="text-3xl md:text-4xl font-bold text-navy dark:text-white mb-6">
              About <span className="text-orange-500">Me</span>
            </motion.h3>
            
            <div className="space-y-6 text-slate-600 dark:text-slate-300 text-lg md:text-[19px] leading-[1.75] md:leading-[1.8]">
              <motion.p variants={itemVariants}>
                I chose Chartered Accountancy because of my passion for understanding how businesses function, analyzing complex regulatory structures, and mastering the financial logic that keeps enterprises compliant.
              </motion.p>
              
              <motion.p variants={itemVariants}>
                During my B.Com (Computer Applications) studies and articleship fieldwork at <strong className="text-corporate dark:text-gold">GPHK & Associates</strong>, I realized how much time finance professionals lose to manual data entry, PDF parsing, and tedious ledger reconciliation mismatches.
              </motion.p>
              
              <motion.p variants={itemVariants}>
                This inspired me to combine my financial training with modern software development. I build lightweight, secure, client-side tools that automate regulatory computations and audit tasks, allowing practitioners to operate with complete efficiency and zero data privacy risk.
              </motion.p>

              {/* Professional Skill Badges */}
              <div className="pt-4 pb-2" id="about-competencies">
                <motion.h4 variants={itemVariants} className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  Core Competencies
                </motion.h4>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-3">
                  {BADGES.map((badge, idx) => {
                    const IconComponent = badge.icon;
                    return (
                      <motion.div
                        key={idx}
                        id={`about-badge-${idx}`}
                        variants={badgeVariants}
                        whileHover={{ scale: 1.03, y: -2 }}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-sm backdrop-blur-md transition-all duration-300 cursor-default select-none group/badge ${badge.colorClass}`}
                      >
                        <IconComponent size={16} className="shrink-0 transition-transform duration-300 group-hover/badge:scale-110" />
                        <span className="text-xs md:text-sm font-semibold tracking-wide">{badge.name}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              
              <div className="pt-6 grid grid-cols-2 gap-6 relative">
                {/* Stat Card 1 */}
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  className="bg-slate-50 dark:bg-darkCard p-5 rounded-lg border-l-4 border-gold shadow-sm border border-slate-100 dark:border-slate-700 transition-all relative group/card"
                >
                  <span className="block text-3xl font-bold text-navy dark:text-white tabular-nums mb-1 group-hover/card:scale-103 transition-transform origin-left">{auditCount}+</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wide">Audits Assisted</span>
                  {/* Orbiting Coin */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity animate-bounce-gentle">
                    <Icon3D icon={Icons3D.Coins} theme="gold" size="sm" />
                  </div>
                </motion.div>
                
                {/* Stat Card 2 */}
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  className="bg-slate-50 dark:bg-darkCard p-5 rounded-lg border-l-4 border-corporate shadow-sm border border-slate-100 dark:border-slate-700 transition-all relative group/card"
                >
                  <span className="block text-3xl font-bold text-navy dark:text-white tabular-nums mb-1 group-hover/card:scale-103 transition-transform origin-left">₹{turnoverCount} Cr+</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wide">Client Turnover Exposure</span>
                  {/* Orbiting Graph */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity animate-bounce-gentle" style={{ animationDelay: '0.2s' }}>
                    <Icon3D icon={Icons3D.Graph} theme="corporate" size="sm" />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;