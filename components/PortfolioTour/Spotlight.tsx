import React from 'react';
import { motion } from 'motion/react';

interface SpotlightProps {
  rect: DOMRect | null;
}

export default function Spotlight({ rect }: SpotlightProps) {
  if (!rect) return null;

  return (
    <>
      {/* 
        Captures pointer events on the rest of the page during the tour 
        to keep focus strictly on the tour highlights.
      */}
      <div className="fixed inset-0 z-[75] bg-slate-950/20 dark:bg-slate-950/45 backdrop-blur-[0.5px] pointer-events-auto" />

      {/* 
        Spotlight highlighted region with a massive border shadow trick 
        to dark-out the rest of the background.
      */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed pointer-events-none z-[80] border-2 border-gold/45 rounded-3xl transition-all duration-500 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] dark:shadow-[0_0_0_9999px_rgba(2,6,23,0.85)]"
        style={{
          top: rect.top - 12,
          left: rect.left - 12,
          width: rect.width + 24,
          height: rect.height + 24,
        }}
      />
    </>
  );
}
