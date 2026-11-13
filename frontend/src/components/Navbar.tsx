'use client';

import React, { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Our Projects', path: '/projects' },
    { label: 'About Us', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(path);
  };

  const isItemActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/' || currentPath === '';
    }
    return currentPath === path || currentPath.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-6 h-16 sm:h-18 flex items-center justify-between gap-6">
        {/* Brand Wordmark Logo */}
        <a 
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none py-1"
          title="DUROZEN - Return to Home"
        >
          <img 
            src="/assets/aistudio/Durozen_500x500.jpg-removebg-preview__1__8c1ed3e1.png"
            alt="DUROZEN"
            className="h-9 sm:h-11 w-auto max-h-[46px] object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-medium">
          {navItems.map((item) => {
            const active = isItemActive(item.path);
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleLinkClick(e, item.path)}
                className={`transition-all whitespace-nowrap py-1 relative cursor-pointer ${
                  active
                    ? 'text-slate-950 font-bold after:absolute after:-bottom-5 sm:after:-bottom-6 after:left-0 after:w-full after:h-0.5 after:bg-red-600'
                    : 'text-slate-600 hover:text-slate-950 font-medium'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Header Action: Get in Touch (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/contact"
            onClick={(e) => handleLinkClick(e, '/contact')}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span>Get in Touch</span>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const active = isItemActive(item.path);
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleLinkClick(e, item.path)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-red-50 text-red-600 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
              </a>
            );
          })}

          <div className="pt-2 border-t border-slate-100">
            <a
              href="/contact"
              onClick={(e) => handleLinkClick(e, '/contact')}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <span>Get in Touch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

