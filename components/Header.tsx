import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, X, Sparkles, Search } from 'lucide-react';
import { Icon3D, Icons3D } from './Icons3D';

interface HeaderProps {
  darkMode: boolean;
  toggleTheme: () => void;
  onOpenMagic?: () => void;
  activeWorkspace?: string | null;
}

const NAV_LINKS = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Products', href: '#products' },
  { name: 'Experience', href: '#experience' },
  { name: 'Contact', href: '#contact' },
];

const RESUME_PATH = "/Sample_Resume.pdf";

const Header: React.FC<HeaderProps> = ({ darkMode, toggleTheme, onOpenMagic, activeWorkspace }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const isWorkspaceActive = !!activeWorkspace;
  const isScrolled = scrolled || isWorkspaceActive;
  const currentActiveSection = activeWorkspace 
    ? (activeWorkspace === 'compliance-suite' ? 'tech-compliance-desk' : activeWorkspace) 
    : activeSection;

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Optimized Scroll Listener (Scroll spy & Scrolled threshold)
  useEffect(() => {
    let tick = false;

    const handleScroll = () => {
      if (!tick) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrolled(currentScrollY > 20);

          // Active Section Spy logic
          // Use an offset so active section changes before reaching the top
          const scrollPosition = currentScrollY + 140; 
          let currentSection = 'home';

          for (const link of NAV_LINKS) {
            if (link.href.startsWith('#')) {
              const id = link.href.substring(1);
              const element = document.getElementById(id);
              if (element) {
                const top = element.offsetTop;
                const height = element.offsetHeight;
                if (scrollPosition >= top && scrollPosition < top + height) {
                  currentSection = id;
                }
              }
            }
          }
          setActiveSection(currentSection);
          tick = false;
        });
        tick = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once initially to set correct state
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard accessibility: Close mobile menu with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Mobile UX: Lock body scrolling while menu is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Mobile UX: Restore focus to menu button when drawer closes
  useEffect(() => {
    if (wasOpen.current && !isOpen) {
      menuButtonRef.current?.focus();
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Skip Navigation Link for Keyboard Users */}
      <a 
        href="#home" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-gold focus:text-navy focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-navy"
      >
        Skip to content
      </a>

      <header 
        className={`fixed w-full top-0 z-[100] transition-all duration-500 ease-in-out motion-reduce:transition-none ${
          isScrolled 
            ? 'bg-white/80 dark:bg-darkBg/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 py-3 shadow-sm' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center relative">
          
          {/* Logo Section */}
          <a 
            href="#home" 
            className="flex flex-col leading-tight group relative z-50 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none rounded-lg"
            aria-label="Ankesh Kumar Portfolio Home"
          >
              <div className="flex items-center gap-2">
                  <span className="font-extrabold text-2xl text-corporate dark:text-white tracking-tight transition-all duration-300 group-hover:tracking-normal motion-reduce:transition-none">
                    Ankesh
                    <span className="text-navy dark:text-gold ml-1">Kumar</span>
                  </span>
                  {/* Decorative 3D Icon appearing on hover */}
                  <div 
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-2 group-hover:translate-x-0 scale-75 motion-reduce:transition-none motion-reduce:transform-none"
                    aria-hidden="true"
                  >
                     <Icon3D icon={Icons3D.Briefcase} theme="gold" size="sm" className="w-8 h-8 p-1.5" />
                  </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase group-hover:text-corporate dark:group-hover:text-gold transition-colors duration-300 motion-reduce:transition-none">
                Finance Professional • Compliance Specialist • Software Builder
              </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 xl:gap-6">
            <nav className="flex gap-4 xl:gap-6" aria-label="Main navigation">
              {NAV_LINKS.map((link) => {
                const isActive = currentActiveSection === link.href.substring(1);
                return (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative text-sm font-bold uppercase tracking-wide transition-colors group py-1 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none rounded ${
                      isActive 
                        ? 'text-navy dark:text-white' 
                        : 'text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white'
                    }`}
                  >
                    {link.name}
                    {/* Sliding Underline Effect */}
                    <span 
                      className={`absolute bottom-0 left-0 h-0.5 bg-gold transition-all duration-300 ease-out motion-reduce:transition-none ${
                        isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                      }`}
                      aria-hidden="true"
                    ></span>
                  </a>
                );
              })}
            </nav>
            
            {/* Magic Button - Hand Gesture */}
            {onOpenMagic && (
                <button
                  onClick={onOpenMagic}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-500/30 text-xs font-bold text-purple-600 dark:text-purple-300 transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none"
                  aria-label="Launch interactive hand gesture experience"
                >
                   <Sparkles size={14} className="text-purple-500" aria-hidden="true" />
                   <span>Interactive Experience</span>
                </button>
            )}

            {/* Command Palette Search Trigger Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-navy dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              aria-label="Open command palette"
              title="Search command palette (Ctrl+K)"
            >
              <Search size={13} className="text-slate-400 dark:text-slate-500" />
              <span className="hidden lg:inline text-[11px]">Search...</span>
              <kbd className="hidden lg:inline text-[9px] px-1 py-0.5 rounded bg-slate-200/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 font-sans text-slate-400">Ctrl+K</kbd>
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" aria-hidden="true"></div>

            {/* Theme Toggle with Rotation Animation */}
            <button 
              onClick={toggleTheme} 
              className="group p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 transform hover:rotate-[30deg] hover:scale-110 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none"
              aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
            >
              <Icon3D 
                  icon={darkMode ? Icons3D.Sun : Icons3D.Moon} 
                  theme={darkMode ? 'gold' : 'navy'} 
                  size="sm" 
                  className="w-9 h-9 p-1.5 shadow-none ring-2 ring-transparent group-hover:ring-slate-200 dark:group-hover:ring-slate-700 rounded-xl" 
                  aria-hidden="true"
              />
            </button>

            {/* Resume Download Button with Lift & Glow */}
            <a 
              href={RESUME_PATH}
              download="Ankesh_Kumar_Resume.pdf"
              className="group relative flex items-center gap-3 bg-corporate dark:bg-white text-white dark:text-navy pl-5 pr-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 dark:shadow-none transition-all duration-300 transform hover:-translate-y-1 active:scale-95 overflow-hidden focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none"
              aria-label="Download Ankesh Kumar Resume"
            >
              {/* Shimmer Effect */}
              <div 
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite] motion-reduce:group-hover:animate-none"
                aria-hidden="true"
              ></div>
              
              <span className="relative z-10">Resume</span>
              <div 
                className="relative z-10 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
                aria-hidden="true"
              >
                  <Icon3D icon={Icons3D.Download} theme={darkMode ? 'navy' : 'gold'} size="sm" className="w-7 h-7 p-1.5 shadow-none bg-transparent" />
              </div>
            </a>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-3 md:hidden relative z-50">
               {/* Mobile Command Palette Trigger */}
               <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                  className="p-2 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                  aria-label="Open command palette"
               >
                  <Search size={18} aria-hidden="true" />
               </button>

               {/* Mobile Magic Button */}
               {onOpenMagic && (
                  <button 
                      onClick={onOpenMagic}
                      className="p-2 text-purple-500 bg-purple-100 dark:bg-purple-900/30 rounded-full focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
                      aria-label="Launch interactive hand gesture experience"
                  >
                      <Sparkles size={20} aria-hidden="true" />
                  </button>
               )}

               <button 
                  onClick={toggleTheme} 
                  className="transform active:scale-90 transition-transform focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none rounded-xl"
                  aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
              >
                  <Icon3D icon={darkMode ? Icons3D.Sun : Icons3D.Moon} theme={darkMode ? 'gold' : 'navy'} size="sm" className="w-10 h-10 p-2" aria-hidden="true" />
              </button>
              <button 
                  ref={menuButtonRef}
                  className="text-navy dark:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                  onClick={toggleMenu}
                  aria-label={isOpen ? "Close main menu" : "Open main menu"}
                  aria-expanded={isOpen}
                  aria-controls="mobile-menu-panel"
              >
                  {isOpen ? <X size={26} aria-hidden="true" /> : <Menu size={26} aria-hidden="true" />}
              </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div 
          className={`fixed inset-0 z-40 bg-navy/30 dark:bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
              isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
          }`} 
          onClick={closeMenu}
          aria-hidden="true"
        ></div>

        {/* Mobile Menu Panel (Slide-in from Right) */}
        <nav 
          id="mobile-menu-panel"
          aria-label="Mobile navigation"
          className={`fixed top-0 right-0 z-40 h-full w-[300px] bg-white dark:bg-darkCard shadow-2xl transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) md:hidden flex flex-col pt-28 px-8 border-l border-slate-100 dark:border-slate-800 motion-reduce:transition-none ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col space-y-3">
              {NAV_LINKS.map((link, idx) => {
                const isActive = currentActiveSection === link.href.substring(1);
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block px-5 py-3.5 text-lg font-bold rounded-xl transition-all duration-300 transform focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none motion-reduce:transform-none motion-reduce:transition-none ${
                        isOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
                    } ${
                      isActive 
                        ? 'text-corporate dark:text-gold bg-slate-50 dark:bg-slate-800/80' 
                        : 'text-slate-600 dark:text-slate-300 hover:text-corporate dark:hover:text-gold hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                    style={{ transitionDelay: isOpen ? `${idx * 75}ms` : '0ms' }}
                  >
                    {link.name}
                  </a>
                );
              })}
          </div>

          <div 
              className={`mt-auto mb-12 pt-8 border-t border-slate-100 dark:border-slate-700 transition-all duration-500 delay-300 motion-reduce:transition-none ${
                  isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
          >
               <a 
                  href={RESUME_PATH}
                  download="Ankesh_Kumar_Resume.pdf"
                  className="flex items-center justify-center gap-3 w-full bg-corporate dark:bg-gold text-white dark:text-navy px-4 py-4 rounded-xl font-bold shadow-lg shadow-corporate/20 active:scale-95 transition-transform group focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                  aria-label="Download Ankesh Kumar Resume"
              >
                  <span>Resume</span>
                  <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true">
                    <Icon3D icon={Icons3D.Download} theme={darkMode ? 'navy' : 'white'} size="sm" className="w-6 h-6 p-1 shadow-none bg-white/20 rounded-lg" />
                  </div>
              </a>
              
              <div className="mt-8 flex justify-center gap-6 opacity-60" aria-hidden="true">
                  {/* Decorative floating icons for mobile menu */}
                  <div className="animate-float" style={{ animationDelay: '0s' }}>
                      <Icon3D icon={Icons3D.Calculator} theme="blue" size="sm" />
                  </div>
                  <div className="animate-float" style={{ animationDelay: '1s' }}>
                      <Icon3D icon={Icons3D.Chart} theme="gold" size="sm" />
                  </div>
                  <div className="animate-float" style={{ animationDelay: '2s' }}>
                      <Icon3D icon={Icons3D.Coins} theme="purple" size="sm" />
                  </div>
              </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;