import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Avatar from './Avatar';
import GuidePanel from './GuidePanel';

export default function DigitalAnkesh() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);

  // Monitor screen layout responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to Portfolio Tour state to hide guide completely during walk-through
  useEffect(() => {
    const handleTourState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isActive: boolean }>;
      setIsTourActive(!!customEvent.detail?.isActive);
      if (customEvent.detail?.isActive) {
        setIsOpen(false);
      }
    };
    window.addEventListener('portfolio-tour-state', handleTourState);
    return () => window.removeEventListener('portfolio-tour-state', handleTourState);
  }, []);

  // Listen to Chat Widget state to shift positions dynamically and prevent collisions
  useEffect(() => {
    const handleChatState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      const open = customEvent.detail?.isOpen;
      setIsChatOpen(!!open);
      if (open) {
        setIsOpen(false); // Cleanly close navigation panel when chat is opened
      }
    };
    window.addEventListener('chat-widget-state', handleChatState);
    return () => window.removeEventListener('chat-widget-state', handleChatState);
  }, []);

  // Calculate coordinates to never collide with the ChatWidget and stack perfectly
  const position = useMemo(() => {
    if (isMobile) {
      if (isChatOpen) {
        // Chat window is open, move avatar to top right out of the way
        return { top: 16, right: 16, bottom: 'auto' };
      }
      // Stacked vertically above the chat launcher
      // Chat launcher is at bottom: 16px, height: 48px -> top is 64px.
      // 32px spacing -> bottom is 96px.
      return { bottom: 96, right: 16, top: 'auto' };
    }

    // Desktop Layouts
    if (isChatOpen) {
      // Chat window is open. Chat window is at right: 24px, width: 380px.
      // Left edge of chat window is at 404px.
      // Shift Digital Ankesh horizontally to the left of the chat window with 24px spacing.
      return { bottom: 24, right: 428, top: 'auto' };
    }

    // Chat window is closed (only chat launcher is visible at bottom: 24px, right: 24px)
    // Chat launcher is 48px tall -> top is 72px.
    // To maintain 32px spacing, we stack Digital Ankesh above it at bottom: 104px.
    return { bottom: 104, right: 24, top: 'auto' };
  }, [isOpen, isChatOpen, isMobile]);

  if (isTourActive) {
    return null;
  }

  return (
    <motion.div
      id="digital-ankesh-assistant"
      className="fixed z-[95] flex flex-col items-center sm:items-end pointer-events-none"
      animate={{
        bottom: position.bottom !== undefined ? position.bottom : 'auto',
        right: position.right !== undefined ? position.right : 'auto',
        top: position.top !== undefined ? position.top : 'auto',
      }}
      transition={{
        type: 'spring',
        stiffness: 240,
        damping: 28,
      }}
    >
      <div className="relative flex flex-col items-center sm:items-end w-full max-w-[310px] sm:max-w-[340px]">
        {/* Navigation/Helper Panel */}
        <AnimatePresence>
          {isOpen && <GuidePanel onClose={() => setIsOpen(false)} />}
        </AnimatePresence>

        {/* Floating Quiet Portrait Avatar */}
        <AnimatePresence mode="wait">
          {!isOpen && (
            <Avatar onClick={() => setIsOpen(true)} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
