'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ProjectItem } from '../data/projects';
import { ProjectMockupPreview } from './ProjectMockupPreview';
import { ArrowUpRight } from 'lucide-react';

const CARD_TOP_COLORS = [
  '#E52521', // DUROZEN Red
  '#FACC15', // DUROZEN Yellow
  '#22C55E', // DUROZEN Green
  '#2563EB', // DUROZEN Blue
];

interface ProjectCardProps {
  project: ProjectItem;
  index: number;
  onOpenQuickView: (project: ProjectItem) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, onOpenQuickView }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const topColor = CARD_TOP_COLORS[index % CARD_TOP_COLORS.length];

  // 3D Magnetic tilt motion values based on cursor coordinates
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 180, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 180, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['4deg', '-4deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-4deg', '4deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.96 }}
      viewport={{ once: false, amount: 0.2, margin: '-20px 0px -20px 0px' }}
      transition={{
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1],
        delay: (index % 3) * 0.06,
      }}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? '0 14px 28px -6px rgba(15, 23, 42, 0.12)'
          : '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
      }}
      className="group relative flex flex-col h-full bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 focus:outline-none"
    >
      {/* Subtle, soft ambient tint on hover (gentle, not too bright) */}
      <div 
        className={`absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none -z-10 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `radial-gradient(circle at 50% 0%, ${topColor}10 0%, transparent 65%)`,
        }}
      />

      {/* Top Color Accent Strip (Above Only) */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: topColor }}
      />

      <div className="p-2.5 sm:p-4 md:p-5 flex flex-col flex-1">
      {/* 1. Project Thumbnail / Preview (Simulated Browser Screen) */}
      <div className="overflow-hidden rounded-lg sm:rounded-xl border border-slate-200/80 shadow-xs shrink-0">
        <ProjectMockupPreview project={project} />
      </div>

      {/* 2. Project Details Area */}
      <div className="pt-2.5 sm:pt-4 md:pt-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Category kicker badge & Year */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono mb-1.5 sm:mb-2">
            <span 
              className="font-semibold px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10.5px] tracking-wide uppercase transition-colors duration-200 border truncate max-w-[80px] sm:max-w-none"
              style={{
                backgroundColor: isHovered ? `${topColor}12` : '#F8FAFC',
                color: isHovered ? topColor : '#475569',
                borderColor: isHovered ? `${topColor}40` : '#E2E8F0',
              }}
            >
              {project.category}
            </span>
            <span className="font-medium text-[9px] sm:text-xs text-slate-400">{project.year}</span>
          </div>

          {/* Project Name */}
          <h3 
            onClick={() => onOpenQuickView(project)}
            className="text-xs sm:text-base md:text-xl font-bold text-slate-900 group-hover:text-slate-950 tracking-tight transition-colors cursor-pointer mb-1 sm:mb-2 leading-tight sm:leading-snug line-clamp-1 sm:line-clamp-none"
            style={{ fontFamily: 'var(--font-display)' }}
            title={project.name}
          >
            {project.name}
          </h3>

          {/* One-Line Description */}
          <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 line-clamp-2 leading-snug sm:leading-relaxed mb-2 sm:mb-4">
            {project.description}
          </p>

          {/* Feature Highlights */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] text-slate-500 mb-2.5 sm:mb-5">
            {project.tags
              .filter(t => !t.toLowerCase().includes('netlify'))
              .slice(0, 2)
              .map((tag, tIdx, arr) => (
                <span key={tag} className="text-slate-500 font-medium truncate max-w-[65px] sm:max-w-none">
                  {tag} {tIdx < arr.length - 1 && <span className="text-slate-300 mx-0.5 sm:mx-1">·</span>}
                </span>
            ))}
          </div>
        </div>

        {/* 3. Actions Row with "View Live Website" & "Quick View" */}
        <div className="pt-2 sm:pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
          {/* Live Website Link Button (Top on mobile for easy thumb click, right on desktop) */}
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="order-1 sm:order-2 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-semibold transition-all duration-200 shadow-xs group/btn hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            title={`Open live site: ${project.url}`}
          >
            <span className="truncate">
              <span className="inline sm:hidden">Live Site</span>
              <span className="hidden sm:inline">View Live Website</span>
            </span>
            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </a>

          {/* Quick View Modal Trigger */}
          <button
            onClick={() => onOpenQuickView(project)}
            className="order-2 sm:order-1 text-[10px] sm:text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer inline-flex items-center justify-center sm:justify-start gap-1 py-0.5 sm:py-0 w-full sm:w-auto"
          >
            <span>Quick View</span>
          </button>
        </div>
      </div>
      </div>
    </motion.div>
  );
};
