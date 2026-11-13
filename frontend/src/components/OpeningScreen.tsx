'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OpeningScreenProps {
  onExplore: () => void;
}

export const OpeningScreen: React.FC<OpeningScreenProps> = ({ onExplore }) => {
  const [hasSettled, setHasSettled] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showColorGlow, setShowColorGlow] = useState(false);

  useEffect(() => {
    // Logo falls and settles after physics bounce (~1.55s)
    const timer = setTimeout(() => {
      setHasSettled(true);
    }, 1550);
    return () => clearTimeout(timer);
  }, []);

  const handleInteraction = () => {
    if (isTransitioning) return;
    setIsPressed(true);
    setShowColorGlow(true);
    setIsTransitioning(true);

    // Instant, ultra-fast reveal of portfolio website on touch
    setTimeout(() => {
      onExplore();
    }, 60);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden select-none transition-colors duration-300 h-[100dvh] w-screen ${
        isTransitioning ? 'pointer-events-none' : 'cursor-pointer'
      }`}
      onClick={handleInteraction}
      role="button"
      tabIndex={0}
      aria-label="Touch to explore DUROZEN projects"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleInteraction();
        }
      }}
    >
      {/* 1. COLOURFUL CIRCULAR BURST TRANSITION (Fast & Snappy on touch) */}
      <AnimatePresence>
        {isTransitioning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-20">
            {/* Red Circle Burst */}
            <motion.div
              initial={{ scale: 0.1, x: -90, opacity: 0.9 }}
              animate={{ scale: 35, x: -160, opacity: 0 }}
              transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-36 h-36 rounded-full bg-[#EF4444]/45 blur-xl"
            />

            {/* Yellow Circle Burst */}
            <motion.div
              initial={{ scale: 0.1, x: -30, opacity: 0.9 }}
              animate={{ scale: 38, x: -50, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-36 h-36 rounded-full bg-[#EAB308]/45 blur-xl"
            />

            {/* Green Circle Burst */}
            <motion.div
              initial={{ scale: 0.1, x: 30, opacity: 0.9 }}
              animate={{ scale: 40, x: 60, opacity: 0 }}
              transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-36 h-36 rounded-full bg-[#22C55E]/45 blur-xl"
            />

            {/* Blue Circle Burst */}
            <motion.div
              initial={{ scale: 0.1, x: 90, opacity: 0.9 }}
              animate={{ scale: 42, x: 170, opacity: 0 }}
              transition={{ duration: 0.54, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-36 h-36 rounded-full bg-[#3B82F6]/45 blur-xl"
            />

            {/* Clean White/Luminous Radial Aperture that gracefully reveals portfolio */}
            <motion.div
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: 35, opacity: 1 }}
              transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
              className="absolute w-40 h-40 rounded-full bg-radial from-white via-white/95 to-slate-50/80"
            />
          </div>
        )}
      </AnimatePresence>

      {/* 2. MAIN LOGO STAGE */}
      <div className="relative flex flex-col items-center justify-center p-6 sm:p-10 z-10">
        
        {/* Dynamic Floor Shadow beneath logo */}
        <motion.div
          initial={{ scale: 0.1, opacity: 0, y: 110 }}
          animate={
            isTransitioning
              ? { scale: 0, opacity: 0, transition: { duration: 0.3 } }
              : hasSettled
              ? {
                  scale: [1, 1.05, 1],
                  opacity: [0.16, 0.22, 0.16],
                  y: 110,
                }
              : {
                  scale: [0.1, 1.08, 0.52, 1.05, 0.78, 1.01, 0.95, 1],
                  opacity: [0.02, 0.26, 0.09, 0.22, 0.13, 0.2, 0.16, 0.18],
                  y: 110,
                }
          }
          transition={
            hasSettled
              ? {
                  scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                  opacity: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                }
              : {
                  duration: 1.55,
                  times: [0, 0.44, 0.63, 0.77, 0.87, 0.94, 0.98, 1],
                  ease: 'easeOut',
                }
          }
          className="absolute w-64 sm:w-84 md:w-96 h-7 rounded-full bg-slate-900/25 blur-lg pointer-events-none"
        />

        {/* GENTLE RIPPLE EFFECT AROUND LOGO (Signaling it can be touched) */}
        {hasSettled && !isTransitioning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-2">
            {/* Ripple Wave 1 */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0.5 }}
              animate={{ scale: [0.85, 1.35], opacity: [0.4, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
              className="absolute w-72 sm:w-96 md:w-[440px] h-40 sm:h-52 rounded-full border border-slate-300/80"
            />
            {/* Ripple Wave 2 (delayed) */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0.5 }}
              animate={{ scale: [0.85, 1.45], opacity: [0.3, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: 1.4 }}
              className="absolute w-72 sm:w-96 md:w-[440px] h-40 sm:h-52 rounded-full border border-slate-300/60"
            />
          </div>
        )}

        {/* MULTI-COLOUR CIRCLE GLOW (Triggered on touch) */}
        <AnimatePresence>
          {showColorGlow && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.85, scale: 1.25 }}
              exit={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              {/* 4 Brand Colors Glow Halos corresponding to D-UR-OZ-EN */}
              <div className="relative w-80 h-32 flex items-center justify-center">
                <span className="absolute -left-12 w-28 h-28 rounded-full bg-[#EF4444]/60 blur-2xl" />
                <span className="absolute -left-2 w-28 h-28 rounded-full bg-[#EAB308]/60 blur-2xl" />
                <span className="absolute right-4 w-28 h-28 rounded-full bg-[#22C55E]/60 blur-2xl" />
                <span className="absolute -right-8 w-28 h-28 rounded-full bg-[#3B82F6]/60 blur-2xl" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ANIMATED DUROZEN LOGO CONTAINER */}
        <motion.div
          initial={{ y: '-80vh', scale: 0.9, opacity: 0, rotate: -2 }}
          animate={
            isTransitioning
              ? {
                  scale: [1, 0.94, 1.15, 3.8],
                  y: [0, 8, -12, -30],
                  rotate: [0, -2, 2, 0],
                  opacity: [1, 1, 0.9, 0],
                  filter: ['blur(0px)', 'blur(0px)', 'blur(2px)', 'blur(8px)'],
                  transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                }
              : isPressed
              ? {
                  scale: 0.94,
                  y: 8,
                  transition: { duration: 0.1 },
                }
              : hasSettled
              ? {
                  y: [0, -6, 0],
                  scale: 1,
                  opacity: 1,
                  rotate: 0,
                  transition: {
                    y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                  },
                }
              : {
                  // Realistic gravity fall with smooth multi-bounce physics and settling
                  y: ['-80vh', 0, -56, 0, -18, 0, -5, 0],
                  scaleY: [1.12, 0.90, 1.05, 0.95, 1.02, 0.98, 1.01, 1],
                  scaleX: [0.90, 1.12, 0.96, 1.05, 0.99, 1.02, 1, 1],
                  opacity: [0, 1, 1, 1, 1, 1, 1, 1],
                  rotate: [-3, 0, 1.2, 0, -0.6, 0, 0, 0],
                }
          }
          transition={
            hasSettled || isTransitioning || isPressed
              ? undefined
              : {
                  duration: 1.55,
                  times: [0, 0.44, 0.63, 0.77, 0.87, 0.94, 0.98, 1],
                  ease: 'easeOut',
                }
          }
          whileHover={
            hasSettled && !isTransitioning
              ? {
                  scale: 1.05,
                  y: -8,
                  filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.08))',
                  transition: { duration: 0.25, ease: 'easeOut' },
                }
              : undefined
          }
          whileTap={
            hasSettled && !isTransitioning
              ? {
                  scale: 0.95,
                  transition: { duration: 0.1 },
                }
              : undefined
          }
          className="relative flex items-center justify-center cursor-pointer"
        >
          {/* EXACT ORIGINAL DUROZEN LOGO (Untouched colours, typography & overlapping circles) */}
          <img
            src="/assets/aistudio/Durozen_500x500.jpg-removebg-preview__1__8c1ed3e1.png"
            alt="DUROZEN"
            className="w-72 sm:w-96 md:w-[420px] max-w-[85vw] h-auto object-contain pointer-events-none select-none transition-all duration-300"
            draggable={false}
          />
        </motion.div>

        {/* 3. "Touch to Explore" (size 22) & "our Project" (size 40) - close to logo with colorful shift animation */}
        <AnimatePresence>
          {hasSettled && !isTransitioning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="-mt-3 sm:-mt-6 md:-mt-8 flex flex-col items-center cursor-pointer relative z-20"
            >
              {/* Line 1: Touch to Explore - Size 22px with Word Shift Animation */}
              <motion.span
                animate={{
                  x: [-2.5, 2.5, -2.5],
                  y: [0, -2.5, 0],
                }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-[20px] sm:text-[22px] font-semibold leading-none animate-color-shift-text select-none text-center px-4"
                style={{
                  fontFamily: "var(--font-script), cursive",
                }}
              >
                Touch to Explore
              </motion.span>

              {/* Line 2: our Project - Size 40px with Counter-Shift Animation */}
              <motion.span
                animate={{
                  x: [2.5, -2.5, 2.5],
                  y: [0, -3.5, 0],
                  rotate: [-0.8, 0.8, -0.8],
                }}
                transition={{
                  duration: 4.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.15,
                }}
                className="text-[34px] sm:text-[40px] font-bold leading-tight -mt-0.5 animate-color-shift-text select-none text-center px-4 tracking-normal"
                style={{
                  fontFamily: "var(--font-script), cursive",
                }}
              >
                our Project
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
