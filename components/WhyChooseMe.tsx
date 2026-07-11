import React, { useRef, useEffect, useState } from 'react';
import { Icon3D, Icons3D } from './Icons3D';

const WhyChooseMe: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.disconnect();
    };
  }, []);

  const reasons = [
    {
      title: "Domain-Driven Design",
      desc: "Because I have hands-on experience in auditing and taxation, I build financial software that actually understands compliance constraints. I design tools that fit a practitioner's workflow perfectly.",
      icon: Icons3D.Verification,
      theme: 'gold' as const
    },
    {
      title: "Zero-Trust Data Security",
      desc: "With a deep understanding of professional audit confidentiality, I develop my applications to process data entirely client-side. Your sensitive financial ledgers and client files never touch a remote server.",
      icon: Icons3D.Zap,
      theme: 'emerald' as const
    },
    {
      title: "Bridges Tech & Finance",
      desc: "I serve as the perfect translator between technical development teams and regulatory compliance structures. I write code that aligns perfectly with Indian accounting standards and tax acts.",
      icon: Icons3D.Compliance,
      theme: 'blue' as const
    },
    {
      title: "Audit-Ready Calculations",
      desc: "My dual competence ensures that all computed outputs, salary models, and GST logic adhere strictly to actual statutory limits and schedules, guaranteeing reliable and verified results.",
      icon: Icons3D.FinancialReport,
      theme: 'purple' as const
    }
  ];

  return (
    <section ref={sectionRef} id="why-choose-me" className="py-20 bg-white dark:bg-darkBg border-t border-slate-100 dark:border-slate-800 overflow-hidden relative" aria-labelledby="approach-heading">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-12">
            <div className={`w-full md:w-1/3 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                <div className="flex items-center gap-1 mb-2">
                  <span className="w-3.5 h-1 bg-orange-500 rounded-full"></span>
                  <span className="w-3.5 h-1 bg-slate-300 dark:bg-slate-400 rounded-full"></span>
                  <span className="w-3.5 h-1 bg-emerald-500 rounded-full"></span>
                </div>
                <h2 className="text-sm font-bold text-gold uppercase tracking-widest mb-2">Why Work With Me</h2>
                <h3 id="approach-heading" className="text-3xl font-extrabold text-navy dark:text-white mb-6">
                  The <span className="text-orange-500">Intersection</span> of Finance &amp; <span className="text-emerald-500">Engineering</span>
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  I don't just write code, and I don't just compile accounts. I bridge both domains to create reliable, compliant, and privacy-first digital tools that solve actual operational problems.
                </p>
            </div>
            <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
                {reasons.map((item, idx) => (
                    <div 
                        key={idx} 
                        tabIndex={0}
                        className={`flex gap-4 p-4 rounded-xl transition-all duration-700 group hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gold ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                        style={{ transitionDelay: `${(idx * 150) + 300}ms` }}
                    >
                        <div className="mt-1 shrink-0">
                          <Icon3D 
                            icon={item.icon} 
                            theme={item.theme} 
                            size="sm" 
                            title={item.title}
                            className="transform group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div>
                            <h4 className="font-bold text-navy dark:text-white text-lg mb-2 group-hover:text-corporate dark:group-hover:text-gold transition-colors">{item.title}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseMe;