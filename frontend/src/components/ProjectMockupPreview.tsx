'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProjectItem } from '../data/projects';
import { ArrowUpRight, Globe, Sparkles, Car, Activity, Palmtree, Trees } from 'lucide-react';

interface ProjectMockupPreviewProps {
  project: ProjectItem;
  interactive?: boolean;
}

export const ProjectMockupPreview: React.FC<ProjectMockupPreviewProps> = ({ 
  project, 
  interactive = true 
}) => {
  const { name, url, category, domain, accentColor } = project;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  // Touch & hover interaction state
  const [isTouchActive, setIsTouchActive] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTouchTime = useRef<number>(0);
  const autoHideTimerRef = useRef<number | null>(null);

  // Normalize URL to always include protocol
  const normalizedUrl = (url && (url.startsWith('http://') || url.startsWith('https://')))
    ? url
    : `https://${url || ''}`;

  // Helper to validate that a string is a real image path/file, not a bare website link
  const isValidImagePath = (str?: string) => {
    if (!str || typeof str !== 'string') return false;
    const clean = str.trim().toLowerCase();
    if (clean === '' || clean === 'none' || clean === 'null') return false;
    // Reject plain website root URLs like 'https://carehosptial.netlify.app/' without image extensions
    if ((clean.startsWith('http://') || clean.startsWith('https://')) &&
        !clean.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i)) {
      return false;
    }
    return true;
  };

  // Build resilient multi-tier preview image candidates (local Playwright screenshots and custom uploads)
  const imageSources: string[] = [];

  // 1. Explicit Custom Uploaded / Set Screenshot from database
  if (isValidImagePath(project.imageUrl)) {
    imageSources.push(project.imageUrl!.trim());
  }

  // 2. Playwright Real Homepage Screenshot
  const localScreenshot = `/screenshots/${project.id}.jpg`;
  if (!imageSources.includes(localScreenshot)) {
    imageSources.push(localScreenshot);
  }

  const currentImageUrl = imageSources[sourceIndex] || '';

  const handleImageError = () => {
    if (sourceIndex + 1 < imageSources.length) {
      setImageLoaded(false);
      setSourceIndex(prev => prev + 1);
    } else {
      // All image sources exhausted, show branded fallback canvas
      setImageError(true);
    }
  };

  // Helper to open live website in a new tab safely
  const openLiveWebsite = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!normalizedUrl || normalizedUrl === 'https://') return;
    window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
  };

  // Record touchstart timestamp to accurately distinguish real touch taps from mouse events
  const handleTouchStart = () => {
    lastTouchTime.current = Date.now();
  };

  const isRecentTouch = () => {
    return Date.now() - lastTouchTime.current < 800;
  };

  // Handle clicking anywhere on the preview area
  const handlePreviewClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();

    // Check if triggered by a touch interaction (mobile/tablet)
    if (isRecentTouch()) {
      if (isTouchActive) {
        // Second tap on the active preview: open the live website
        openLiveWebsite(e);
        setIsTouchActive(false);
      } else {
        // First tap on touch screen: show the "Visit Live Website" overlay
        setIsTouchActive(true);
        if (autoHideTimerRef.current) {
          window.clearTimeout(autoHideTimerRef.current);
        }
        autoHideTimerRef.current = window.setTimeout(() => {
          setIsTouchActive(false);
        }, 4500);
      }
      return;
    }

    // Desktop mouse click anywhere on the preview area: immediately open the live website
    openLiveWebsite(e);
  };

  // Handle clicking the "Visit Live Website" button directly
  const handleButtonClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    openLiveWebsite(e);
    setIsTouchActive(false);
  };

  // Dismiss touch overlay when tapping outside the preview
  useEffect(() => {
    if (!isTouchActive) return;

    const handleOutsideInteraction = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsTouchActive(false);
      }
    };

    document.addEventListener('touchstart', handleOutsideInteraction);
    document.addEventListener('click', handleOutsideInteraction);

    return () => {
      document.removeEventListener('touchstart', handleOutsideInteraction);
      document.removeEventListener('click', handleOutsideInteraction);
    };
  }, [isTouchActive]);

  // Clean up auto-hide timer on unmount
  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) {
        window.clearTimeout(autoHideTimerRef.current);
      }
    };
  }, []);

  const getCategoryIcon = () => {
    switch (category) {
      case 'Automotive':
        return <Car className="w-4 h-4" />;
      case 'Beauty':
        return <Sparkles className="w-4 h-4" />;
      case 'Healthcare':
        return <Activity className="w-4 h-4" />;
      case 'Lifestyle':
        return <Trees className="w-4 h-4" />;
      case 'Hospitality':
        return <Palmtree className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onClick={handlePreviewClick}
      className={`relative w-full aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden flex flex-col shadow-inner select-none group/thumb ${
        interactive ? 'cursor-pointer' : ''
      }`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          openLiveWebsite(e);
        }
      }}
      aria-label={`Open live website for ${name}`}
    >
      {/* 1. Clean Minimal Browser Chrome Window Header (Three Window Dots Only) */}
      <div className="h-6 sm:h-7 bg-slate-950/90 border-b border-white/10 px-3 flex items-center shrink-0 z-10 pointer-events-none">
        {/* DUROZEN colored window control dots */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#E52521]" />
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FACC15]" />
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#22C55E]" />
        </div>
      </div>

      {/* 2. Real Screenshot Preview with Fallback */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-950">
        {/* Website Front Look Picture / Real Screenshot */}
        {!imageError && currentImageUrl && (
          <img
            key={currentImageUrl}
            src={currentImageUrl}
            alt={`${name} live preview`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover object-top transition-all duration-700 group-hover/thumb:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Loading State: Subtle Skeleton Shimmer */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-1.5 animate-pulse">
            <div className="w-5 h-5 rounded-full border-2 border-slate-700 border-t-emerald-400 animate-spin" />
            <span className="text-[9px] sm:text-[10px] font-mono text-slate-400">Loading website preview...</span>
          </div>
        )}

        {/* Elegant Branded Webpage Preview Canvas (Displays as resilient fallback when website is unavailable) */}
        {imageError && (
          <div className="absolute inset-0 flex flex-col justify-between p-2.5 sm:p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 transition-all duration-500">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono">
              <span 
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8.5px] sm:text-[10px] font-semibold flex items-center gap-1 sm:gap-1.5 text-white"
                style={{ backgroundColor: `${accentColor}33`, borderColor: `${accentColor}66`, borderWidth: 1 }}
              >
                {getCategoryIcon()}
                <span className="truncate max-w-[50px] sm:max-w-none">{category}</span>
              </span>
            </div>

            <div className="space-y-0.5 sm:space-y-1 my-auto">
              <div className="text-[8.5px] sm:text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Live Web Project
              </div>
              <div className="text-xs sm:text-lg md:text-xl font-bold text-white tracking-tight leading-tight line-clamp-1 sm:line-clamp-none">
                {name}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300/80 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                {project.tagline}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 sm:pt-2 border-t border-white/10 text-[9px] sm:text-[10px] text-slate-400 font-mono">
              <span className="truncate max-w-[80px] sm:max-w-[180px]">{domain}</span>
              <span className="text-white flex items-center gap-0.5 sm:gap-1 text-[8.5px] sm:text-[10px]">
                <span className="hidden sm:inline">View Site</span> <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
              </span>
            </div>
          </div>
        )}

        {/* Hover and Touch Interactive Launch Overlay */}
        {interactive && (
          <div 
            className={`absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300 ease-out ${
              isTouchActive 
                ? 'opacity-100 pointer-events-auto' 
                : 'opacity-0 pointer-events-none group-hover/thumb:opacity-100 group-hover/thumb:pointer-events-auto'
            }`}
          >
            <button
              type="button"
              onClick={handleButtonClick}
              className={`px-4 py-2 rounded-full bg-white text-slate-900 text-xs font-semibold shadow-xl flex items-center gap-1.5 transition-all duration-300 ease-out cursor-pointer hover:bg-slate-100 active:scale-95 transform ${
                isTouchActive 
                  ? 'scale-100 translate-y-0 opacity-100' 
                  : 'scale-95 translate-y-2 opacity-0 group-hover/thumb:scale-100 group-hover/thumb:translate-y-0 group-hover/thumb:opacity-100'
              }`}
            >
              <span>Visit Live Website</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-900" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
