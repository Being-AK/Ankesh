import React, { useState, useEffect, useCallback } from 'react';
import TourModal from './TourModal';
import Spotlight from './Spotlight';
import TourTooltip from './TourTooltip';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  hash: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'home',
    title: 'Executive Entry',
    description: 'Welcome. Explore secure workspaces and core financial engineering products.',
    hash: '#home',
  },
  {
    id: 'about',
    title: 'Professional Bio',
    description: 'CA rigor combined with fully custom, client-side software engineering.',
    hash: '#about',
  },
  {
    id: 'experience',
    title: 'Articleship Practice',
    description: 'Statutory ledgers, audit assurance, GSTR reconciliations, and corporate filings.',
    hash: '#experience',
  },
  {
    id: 'compliance-hub',
    title: 'Incorporation Hub',
    description: 'Interactive statutory roadmaps, corporate timelines, and fee calculators.',
    hash: '#compliance-hub',
  },
  {
    id: 'pdf-toolkit',
    title: 'Private PDF Toolkit',
    description: 'Sandboxed document merges, splits, and local OCR processed entirely in-browser.',
    hash: '#pdf-toolkit',
  },
  {
    id: 'assistant',
    title: 'Digital Clone',
    description: 'Draft regulatory responses and query Indian taxation rules with my AI agent.',
    hash: '#assistant',
  },
  {
    id: 'contact',
    title: 'Secure Advisory',
    description: 'Direct channels for audit, legal tech dev, or software engineering inquiries.',
    hash: '#contact',
  },
];

export default function PortfolioTour() {
  const [activeStep, setActiveStep] = useState<'welcome' | number | 'finish' | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  // Dispatch active tour state to prevent visual collisions with other floating widgets
  useEffect(() => {
    const isActive = activeStep !== null;
    window.dispatchEvent(new CustomEvent('portfolio-tour-state', { detail: { isActive } }));
  }, [activeStep]);

  // First-visit check: wait 1 second
  useEffect(() => {
    const isCompleted = localStorage.getItem('ankesh_tour_completed');
    if (!isCompleted) {
      const timer = setTimeout(() => {
        setActiveStep('welcome');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen to custom global restart event
  useEffect(() => {
    const handleStartEvent = () => {
      goToStep(0);
    };
    window.addEventListener('start-portfolio-tour', handleStartEvent);
    return () => window.removeEventListener('start-portfolio-tour', handleStartEvent);
  }, []);

  // Set step and trigger smooth scrolling & hash change
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= TOUR_STEPS.length) return;

    const step = TOUR_STEPS[stepIndex];

    // Change location hash to activate section if needed
    window.location.hash = step.hash;

    // Wait slightly for DOM to settle/mount then scroll
    setTimeout(() => {
      const element = document.getElementById(step.id);
      if (element) {
        const offset = 140; // compensation for header height
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition >= 0 ? offsetPosition : 0,
          behavior: 'smooth',
        });
      }
    }, 120);

    setActiveStep(stepIndex);
  }, []);

  // Monitor target highlight element's bounding box
  useEffect(() => {
    if (typeof activeStep !== 'number') {
      setHighlightRect(null);
      return;
    }

    let active = true;
    const step = TOUR_STEPS[activeStep];

    const checkElement = () => {
      if (!active) return;
      const element = document.getElementById(step.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setHighlightRect(rect);
          return;
        }
      }
      setTimeout(checkElement, 100);
    };

    checkElement();

    const updatePosition = () => {
      if (!active) return;
      const element = document.getElementById(step.id);
      if (element) {
        setHighlightRect(element.getBoundingClientRect());
      }
    };

    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      active = false;
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [activeStep]);

  // Handle Keyboard shortcuts for desktop
  useEffect(() => {
    if (typeof activeStep !== 'number') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStep, goToStep]);

  const handleNext = () => {
    if (typeof activeStep === 'number') {
      if (activeStep === TOUR_STEPS.length - 1) {
        setActiveStep('finish');
      } else {
        goToStep(activeStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (typeof activeStep === 'number' && activeStep > 0) {
      goToStep(activeStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('ankesh_tour_completed', 'true');
    setActiveStep(null);
    window.location.hash = '#home';
  };

  const handleStart = () => {
    goToStep(0);
  };

  return (
    <>
      {/* 1. First-visit welcome modal & final finished screen */}
      <TourModal
        isOpen={activeStep === 'welcome'}
        type="welcome"
        onStartTour={handleStart}
        onExploreMyself={handleSkip}
      />

      <TourModal
        isOpen={activeStep === 'finish'}
        type="finish"
        onExploreMyself={handleSkip}
      />

      {/* 2. Dimming backdrop + spotlight highlight box */}
      {typeof activeStep === 'number' && <Spotlight rect={highlightRect} />}

      {/* 3. Floating tooltip info card with progress dots */}
      {typeof activeStep === 'number' && (
        <TourTooltip
          stepIndex={activeStep}
          step={TOUR_STEPS[activeStep]}
          rect={highlightRect}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
        />
      )}
    </>
  );
}
