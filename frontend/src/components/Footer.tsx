'use client';

import React from 'react';
import { 
  ArrowUp, 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle 
} from 'lucide-react';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <footer id="footer" className="relative bg-slate-50 border-t border-slate-200/80 text-slate-700 z-10">
      {/* Sleek 4-Color DUROZEN Brand Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-[#E52521] via-[#FACC15] via-[#22C55E] to-[#2563EB]" />

      <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
        {/* Main Footer Row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-200/70">
          
          {/* Brand Info */}
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">
            <button
              onClick={scrollToTop}
              className="flex items-center group cursor-pointer focus:outline-none"
              title="DUROZEN - Return to top"
            >
              <img 
                src="/assets/aistudio/Durozen_500x500.jpg-removebg-preview__1__8c1ed3e1.png"
                alt="DUROZEN"
                className="h-10 sm:h-11 w-auto max-h-[46px] object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </button>

            <div className="hidden sm:block h-8 w-px bg-slate-200" />

            <div className="text-xs text-slate-500">
              <p className="font-medium text-slate-700">“Turning Ideas Into Digital Experiences.”</p>
              <p className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-red-500 inline shrink-0" />
                <span>Namakkal, Tamil Nadu, India</span>
              </p>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
            <a 
              href="/projects" 
              onClick={(e) => handleLinkClick(e, '/projects')}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              Our Projects
            </a>
            <a 
              href="/about" 
              onClick={(e) => handleLinkClick(e, '/about')}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              About Us
            </a>
            <a 
              href="/contact" 
              onClick={(e) => handleLinkClick(e, '/contact')}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              Contact Us
            </a>
            <a 
              href="https://wa.me/918122339694"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </nav>

          {/* Direct Communications & Back to Top */}
          <div className="flex items-center gap-3">
            <a 
              href="mailto:info@durozen.in"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-medium border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5"
              title="Email DUROZEN"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>info@durozen.in</span>
            </a>

            <button
              onClick={scrollToTop}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center justify-center group"
              title="Return to top"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

        </div>

        {/* Bottom Sub-bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} Durozen Technologies Private Limited. All rights reserved.
          </p>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E52521]" title="Red" />
            <span className="w-2 h-2 rounded-full bg-[#FACC15]" title="Yellow" />
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" title="Green" />
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" title="Blue" />
            <span className="text-[11px] font-mono text-slate-500 ml-1">
              Crafted in India
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
