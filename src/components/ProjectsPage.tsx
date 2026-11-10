'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LIVE_PROJECTS, ProjectItem } from '../data/projects';
import { api } from '../services/api';
import { Navbar } from './Navbar';
import { BackgroundEffects } from './BackgroundEffects';
import { ProjectCard } from './ProjectCard';
import { ProjectQuickViewModal } from './ProjectQuickViewModal';
import { Footer } from './Footer';
import { FolderKanban, Sparkles } from 'lucide-react';

interface ProjectsPageProps {
  onNavigate: (path: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<ProjectItem[]>(LIVE_PROJECTS);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [quickViewProject, setQuickViewProject] = useState<ProjectItem | null>(null);

  // Dynamic project fetch from backend API with fallback
  useEffect(() => {
    let isMounted = true;
    api.getProjects()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setProjects(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic projects, using defaults:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    'All',
    'Automotive',
    'Beauty',
    'Healthcare',
    'Lifestyle',
    'Hospitality'
  ];

  const filteredProjects = activeCategory === 'All'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  return (
    <div className="relative min-h-screen bg-white text-slate-900 selection:bg-slate-900 selection:text-white overflow-x-hidden flex flex-col justify-between">
      {/* Dynamic Background Effects */}
      <BackgroundEffects />

      {/* Shared Navbar */}
      <Navbar currentPath="/projects" onNavigate={onNavigate} />

      {/* Main Projects Section */}
      <main className="flex-1 py-12 sm:py-16 lg:py-20 px-3 sm:px-6 max-w-7xl mx-auto w-full relative z-10">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-100 text-xs font-mono text-red-600 mb-4 shadow-2xs font-semibold"
          >
            <FolderKanban className="w-3.5 h-3.5 text-red-600" />
            <span>DUROZEN CLIENT SHOWCASE ({projects.length} LIVE DEMO SITES)</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Our Creative Projects
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto"
          >
            Explore our curated portfolio of bespoke digital solutions, live client websites, and high-performance interactive web applications.
          </motion.p>
        </div>

        {/* Category Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 border-b border-slate-100 pb-4 sm:pb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              Showing {filteredProjects.length} {activeCategory === 'All' ? 'Total' : activeCategory} {filteredProjects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>

          {/* Segmented Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-slate-100/90 backdrop-blur-sm rounded-xl max-w-full overflow-x-auto border border-slate-200/50">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-white text-slate-950 shadow-sm font-bold text-red-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid: 2 columns on Mobile & Tablet, 3 columns on Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onOpenQuickView={(p) => setQuickViewProject(p)}
            />
          ))}
        </div>
      </main>

      {/* Shared Footer */}
      <Footer onNavigate={onNavigate} />

      {/* Quick View Modal */}
      <ProjectQuickViewModal
        project={quickViewProject}
        onClose={() => setQuickViewProject(null)}
      />
    </div>
  );
};

