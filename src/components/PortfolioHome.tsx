'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LIVE_PROJECTS, ProjectItem } from '../data/projects';
import { api } from '../services/api';
import { Navbar } from './Navbar';
import { ProjectCard } from './ProjectCard';
import { BackgroundEffects } from './BackgroundEffects';
import { AboutSection } from './AboutSection';
import { ContactSection } from './ContactSection';
import { Footer } from './Footer';
import { ProjectQuickViewModal } from './ProjectQuickViewModal';

interface PortfolioHomeProps {
  onNavigate?: (path: string) => void;
  onReplayIntro?: () => void;
  onOpenAdmin?: () => void;
}

export const PortfolioHome: React.FC<PortfolioHomeProps> = ({ onNavigate, onReplayIntro, onOpenAdmin }) => {
  // Use projects fetched dynamically from FastAPI / PostgreSQL with fallback
  const [projects, setProjects] = useState<ProjectItem[]>(LIVE_PROJECTS);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [quickViewProject, setQuickViewProject] = useState<ProjectItem | null>(null);

  // Dynamic project fetch from backend API
  useEffect(() => {
    let isMounted = true;
    api.getProjects()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setProjects(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic projects:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Background Hero Video ref
  const videoRef = useRef<HTMLVideoElement>(null);

  // Guarantee continuous crisp autoplay without browser mute blocks
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Video autoplay was prevented:', err);
        });
      }
    }
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

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-slate-900 selection:bg-slate-900 selection:text-white overflow-x-hidden">
      {/* 1. Dynamic Background Effects (Floating 3D Objects & Moving Gradients) */}
      <BackgroundEffects />

      {/* 2. Top Bar Navigation (Sleek, Compact Navbar) */}
      <Navbar currentPath="/" onNavigate={handleNav} />

      {/* 3. HERO SECTION WITH CRYSTAL-CLEAR CINEMATIC BACKGROUND VIDEO */}
      <section className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-center items-center text-center px-6 py-20 z-10 overflow-hidden">
        {/* Full-Screen Cinematic Background Video Layer (100% Crystal-Clear, Bright & Natural White Theme) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video
            ref={videoRef}
            src="/assets/aistudio/durozen_hero_video.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-center"
          />

          {/* Clean White Top and Bottom Gradient Blends for Seamless Integration */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white via-white/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none" />
        </div>

        {/* Seamless Hero Content (Directly over the crystal-clear video) */}
        <div className="w-full max-w-7xl mx-auto flex justify-center md:justify-end relative z-10">
          <div className="max-w-4xl flex flex-col items-center text-center relative z-10 px-4 sm:px-6">

          {/* Animated DUROZEN Brand Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.05, y: -3, transition: { duration: 0.2 } }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-3"
          >
            <img
              src="/assets/aistudio/Durozen_500x500.jpg-removebg-preview__1__8c1ed3e1.png"
              alt="DUROZEN"
              className="h-24 sm:h-28 md:h-32 w-auto -my-5 sm:-my-6 object-contain drop-shadow-md select-none pointer-events-none"
              draggable={false}
            />
          </motion.div>

          {/* Animated Tagline: "Explore. Experience. Create." */}
          <motion.div
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '0.24em' }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="text-xs sm:text-sm font-mono uppercase text-slate-700 mb-6 font-semibold tracking-widest drop-shadow-xs"
          >
            Explore · Experience · Create
          </motion.div>

          {/* Main Heading: "OUR CREATIVE PROJECTS" in solid dark navy/black matching PROJECTS */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.2,
                  delayChildren: 0.3,
                },
              },
            }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-[#0b172a] uppercase leading-none mb-6 text-depth-3d"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5">
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 35, rotateX: 30, filter: 'blur(5px)' },
                  visible: {
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    filter: 'blur(0px)',
                    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                className="inline-block text-[#0b172a] tracking-tight drop-shadow-md"
              >
                OUR
              </motion.span>
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 35, rotateX: 30, filter: 'blur(5px)' },
                  visible: {
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    filter: 'blur(0px)',
                    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                className="inline-block text-[#0b172a] tracking-tight drop-shadow-md"
              >
                CREATIVE
              </motion.span>
            </div>
            <div className="block mt-1 sm:mt-2">
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 40, scale: 0.95 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                className="inline-block text-[#0b172a] tracking-tight drop-shadow-md"
              >
                PROJECTS
              </motion.span>
            </div>
          </motion.h1>

          {/* Subtitle: "Ideas transformed into digital experiences." with smooth fade-up */}
          <motion.p
            initial={{ opacity: 0, y: 22, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg sm:text-2xl font-medium text-slate-800 max-w-2xl leading-relaxed mb-8 text-pretty drop-shadow-xs"
          >
            Ideas transformed into digital experiences.
          </motion.p>

          {/* Hero Action Button: Explore Projects only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="flex items-center justify-center mb-10 z-20"
          >
            <a
              href="#projects"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-2xl bg-slate-950 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-950/15 cursor-pointer active:scale-95"
            >
              <span>Explore Projects</span>
            </a>
          </motion.div>
          </div>
        </div>
      </section>

      {/* 3. PROJECT PORTFOLIO CARDS GRID WITH ADVANCED SCROLL-TRIGGERED ANIMATIONS */}
      <section id="projects" className="py-12 sm:py-20 lg:py-24 px-3 sm:px-6 max-w-7xl mx-auto relative z-10 scroll-mt-20">
        
        {/* Category Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 border-b border-slate-100 pb-4 sm:pb-6">
          <div>
            <div className="text-[11px] sm:text-xs font-mono text-slate-400 uppercase tracking-widest mb-1 sm:mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dedicated Portfolio ({filteredProjects.length} Live Projects)</span>
            </div>
            <h2 
              className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Our Projects & Portfolio
            </h2>
          </div>

          {/* Segmented Filter Buttons: Automotive, Beauty, Healthcare, Lifestyle, Hospitality */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-slate-100/90 backdrop-blur-sm rounded-xl max-w-full overflow-x-auto border border-slate-200/50">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-white text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* The Project Cards Grid: Exactly 2 columns on Mobile & Tablet, 3 columns on Desktop */}
        {filteredProjects.length > 0 ? (
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
        ) : (
          <div className="py-16 text-center rounded-3xl bg-slate-50 border border-slate-200/60 p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <span className="text-xl">📁</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">No Projects Added Yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5">
              Your portfolio is clean and ready. Log in to the Admin Portal to add your client showcase projects.
            </p>
            <a
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm"
            >
              Open Admin Portal
            </a>
          </div>
        )}
      </section>

      {/* 5. ABOUT US SECTION (Official Company Information) */}
      <AboutSection />

      {/* 6. CONTACT SECTION (Interactive Enquiry Form, Channels & Map) */}
      <ContactSection />

      {/* 7. PREMIUM DIGITAL AGENCY FOOTER */}
      <Footer onNavigate={handleNav} />

      {/* 8. Quick View Modal */}
      <ProjectQuickViewModal
        project={quickViewProject}
        onClose={() => setQuickViewProject(null)}
      />
    </div>
  );
};
