'use client';

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Building2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  return (
    <section 
      id="about" 
      ref={containerRef}
      className="py-20 sm:py-28 px-6 max-w-7xl mx-auto border-t border-slate-100 relative z-10 scroll-mt-20 overflow-hidden"
    >
      {/* Clean ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-blue-50/25 via-slate-50/20 to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      {/* ======================================================== */}
      {/* ABOUT US - COMPANY HEADER & IDENTITY */}
      {/* ======================================================== */}
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Headquarters Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs font-mono text-slate-700 mb-6 shadow-xs"
        >
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-slate-900">DUROZEN TECHNOLOGIES PVT. LTD.</span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1 text-slate-600">
            <MapPin className="w-3 h-3 text-red-500" />
            Namakkal, Tamil Nadu, India
          </span>
        </motion.div>

        {/* Main Section Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-950 tracking-tight leading-[1.12] mb-6 text-depth-3d"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Crafting High-Performance Technology with Human Ingenuity.
        </motion.h2>

        {/* Official Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="space-y-3 text-base sm:text-xl font-light text-slate-600 leading-relaxed max-w-3xl mx-auto"
        >
          <p>
            <strong className="font-semibold text-slate-900">Durozen Technologies Pvt. Ltd.</strong> is an engineering-first technology partner headquartered in Namakkal, Tamil Nadu, India.
          </p>
          <p className="text-slate-500 text-sm sm:text-lg">
            We collaborate with growing enterprises and institutions to build custom software, cloud infrastructure and intelligent automation systems.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
