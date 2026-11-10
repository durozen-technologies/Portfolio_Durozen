'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { BackgroundEffects } from './BackgroundEffects';
import { ContactSection } from './ContactSection';
import { Footer } from './Footer';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  return (
    <div className="relative min-h-screen bg-white text-slate-900 selection:bg-slate-900 selection:text-white overflow-x-hidden flex flex-col justify-between">
      {/* Dynamic Background Effects */}
      <BackgroundEffects />

      {/* Shared Navbar */}
      <Navbar currentPath="/contact" onNavigate={onNavigate} />

      {/* Dedicated Contact Page Content */}
      <main className="flex-1 py-12 sm:py-20 relative z-10">
        <ContactSection />
      </main>

      {/* Shared Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

