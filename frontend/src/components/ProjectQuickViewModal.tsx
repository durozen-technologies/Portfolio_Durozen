'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectItem } from '../data/projects';
import { ProjectMockupPreview } from './ProjectMockupPreview';
import { X, ArrowUpRight, ExternalLink, Globe, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProjectQuickViewModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export const ProjectQuickViewModal: React.FC<ProjectQuickViewModalProps> = ({
  project,
  onClose,
}) => {
  if (!project) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-900 shadow-md backdrop-blur-sm transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Browser Preview Hero */}
          <div className="p-4 sm:p-6 bg-slate-100/60 border-b border-slate-100">
            <ProjectMockupPreview project={project} />
          </div>

          {/* Content Details */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
                  <span>{project.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{project.client}</span>
                  <span aria-hidden="true">·</span>
                  <span>{project.year}</span>
                </div>
                <h2 
                  className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {project.name}
                </h2>
              </div>

              {/* Primary View Live Project Button */}
              <div className="flex items-center gap-3">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-md group cursor-pointer"
                >
                  <span>Launch Live Site</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
              {project.description}
            </p>

            {/* Highlights Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
              {project.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-slate-400">STACK:</span>
                {project.tags
                  .filter((tag) => !tag.toLowerCase().includes('netlify'))
                  .map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                      {tag}
                    </span>
                ))}
              </div>
              <div className="font-mono text-[11px] text-slate-400 mt-2 sm:mt-0">
                URL: {project.url}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
