'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { OpeningScreen } from '../components/OpeningScreen';
import { PortfolioHome } from '../components/PortfolioHome';

export default function HomePage() {
  const router = useRouter();

  const [hasEnteredPortfolio, setHasEnteredPortfolio] = useState<boolean>(false);
  const [showOpeningScreen, setShowOpeningScreen] = useState<boolean>(true);
  const [openingKey, setOpeningKey] = useState<number>(0);

  const handleExplore = () => {
    setHasEnteredPortfolio(true);
    setShowOpeningScreen(false);
  };

  const handleReplayIntro = () => {
    setShowOpeningScreen(true);
    setHasEnteredPortfolio(false);
    setOpeningKey(prev => prev + 1);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <main className="relative min-h-screen bg-white font-sans antialiased">
      {/* 1. The Active Page View */}
      <div 
        className={`transition-opacity duration-200 ${
          hasEnteredPortfolio ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <PortfolioHome 
          isActive={hasEnteredPortfolio}
          onNavigate={handleNavigate}
          onReplayIntro={handleReplayIntro} 
          onOpenAdmin={() => handleNavigate('/admin')}
        />
      </div>

      {/* 2. Original DUROZEN Logo Physics Drop Opening Screen (Home entrance) */}
      <AnimatePresence mode="wait">
        {showOpeningScreen && (
          <motion.div
            key={openingKey}
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              scale: 1.02,
              transition: { duration: 0.18, ease: 'easeOut' } 
            }}
            className="fixed inset-0 z-50 overflow-hidden"
          >
            <OpeningScreen onExplore={handleExplore} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

