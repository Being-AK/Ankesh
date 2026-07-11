import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AvatarProps {
  onClick: () => void;
}

export default function Avatar({ onClick }: AvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatLabelVisible, setIsChatLabelVisible] = useState(false);

  useEffect(() => {
    const handleChatLabelState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isVisible: boolean }>;
      setIsChatLabelVisible(!!customEvent.detail?.isVisible);
    };
    window.addEventListener('chat-label-state', handleChatLabelState);
    return () => window.removeEventListener('chat-label-state', handleChatLabelState);
  }, []);

  return (
    <div
      className="pointer-events-auto cursor-pointer relative flex items-center justify-center select-none"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 
        Outer wrapper handling soft breathing & floating animation:
        We combine a very subtle breathing scale (1.0 to 1.02) and a gentle 
        sinusoidal-like up-down translation using keyframes.
      */}
      <motion.div
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        {/* Soft elegant outer glowing shell */}
        <div className={`absolute inset-0 rounded-full bg-gold/10 dark:bg-gold/15 blur-md transition-all duration-300 scale-105 ${isHovered ? 'blur-lg' : ''}`} />

        {/* Floating circular portrait */}
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-14 h-14 sm:w-15 sm:h-15 bg-white dark:bg-slate-950 p-0.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-800/80 hover:border-gold/50 dark:hover:border-gold/50 transition-all duration-300"
        >
          <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-50 dark:bg-slate-900">
            <img
              src="/Hero.webp"
              alt="Ankesh"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://i.postimg.cc/LXJD8Xrg/Portfolio.png';
              }}
              className="w-full h-full object-cover object-top scale-125"
            />

            {/* Small clean green online status indicator */}
            <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-950" />
          </div>
        </motion.div>
      </motion.div>

      {/* Modern, minimalist hover tooltip on the left side of the avatar */}
      <AnimatePresence>
        {isHovered && !isChatLabelVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, x: 4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.92, x: 4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-full mr-3 whitespace-nowrap bg-slate-950 dark:bg-slate-900 text-white dark:text-gold px-3.5 py-1.5 rounded-xl border border-slate-800 text-[11px] font-semibold tracking-wide shadow-md flex items-center select-none pointer-events-none"
          >
            <span>Hi, I'm Ankesh 👋</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
