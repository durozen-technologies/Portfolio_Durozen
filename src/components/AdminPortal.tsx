'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  api, 
  ApiProjectItem, 
  HealthResponse 
} from '../services/api';
import { 
  LayoutDashboard,
  FolderKanban,
  Tags,
  Menu,
  X,
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  User, 
  LogOut, 
  Search, 
  Sparkles, 
  Layers, 
  Globe, 
  Eye, 
  Upload,
  Image as ImageIcon,
  Database,
  Server,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';

interface AdminPortalProps {
  onBackToPortfolio: () => void;
  onPreviewProject?: (project: ApiProjectItem) => void;
}

const DUROZEN_BRAND_COLORS = [
  { name: 'DUROZEN Red', hex: '#E52521' },
  { name: 'DUROZEN Yellow', hex: '#FACC15' },
  { name: 'DUROZEN Green', hex: '#22C55E' },
  { name: 'DUROZEN Blue', hex: '#2563EB' },
  { name: 'Dark Slate', hex: '#0F172A' },
  { name: 'Purple Luxe', hex: '#9333EA' },
];

const PRESET_CATEGORIES = [
  'Automotive',
  'Beauty',
  'Healthcare',
  'Lifestyle',
  'Hospitality'
];

type AdminTab = 'dashboard' | 'projects' | 'categories';

// 1. High-Res Project Card Thumbnail for Admin Projects Grid
const AdminProjectCardThumbnail: React.FC<{ project: ApiProjectItem }> = ({ project }) => {
  const [imgError, setImgError] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Helper to validate that a string is a real image path/file, not a bare website link
  const isValidImagePath = (str?: string) => {
    if (!str || typeof str !== 'string') return false;
    const clean = str.trim().toLowerCase();
    if (clean === '' || clean === 'none' || clean === 'null') return false;
    if ((clean.startsWith('http://') || clean.startsWith('https://')) &&
        !clean.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i)) {
      return false;
    }
    return true;
  };

  // Ordered candidate image sources:
  // 1. Saved custom/uploaded image
  // 2. Verified local Playwright screenshot
  // 3. Asset fallbacks
  const sources: string[] = [];

  if (isValidImagePath(project.imageUrl)) {
    sources.push(project.imageUrl!.trim());
  }

  const localScreenshot = `/screenshots/${project.id}.jpg`;
  if (!sources.includes(localScreenshot)) {
    sources.push(localScreenshot);
  }

  const currentSource = sources[sourceIndex];

  const handleSourceError = () => {
    if (sourceIndex + 1 < sources.length) {
      setLoaded(false);
      setSourceIndex(prev => prev + 1);
    } else {
      setImgError(true);
    }
  };

  return (
    <div className="relative h-36 w-full bg-slate-950 overflow-hidden border-b border-slate-100 group/thumb select-none">
      {/* Real Website Screenshot or Uploaded Image */}
      {!imgError && currentSource ? (
        <>
          <img
            key={currentSource}
            src={currentSource}
            alt=""
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={handleSourceError}
            className={`w-full h-full object-cover object-top transition-all duration-300 group-hover:scale-105 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {!loaded && (
            <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
              <span className="text-[10px] font-mono text-slate-400">Loading website preview...</span>
            </div>
          )}
        </>
      ) : null}

      {/* Resilient Fallback Canvas (Zero Broken Images) */}
      {(imgError || !currentSource) && (
        <div 
          className="absolute inset-0 flex flex-col justify-between p-3.5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"
          style={{
            borderTop: `3px solid ${project.accentColor || '#E52521'}`
          }}
        >
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span 
              className="px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ backgroundColor: `${project.accentColor || '#E52521'}40` }}
            >
              <Globe className="w-3 h-3" />
              <span>{project.category}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Web Project</span>
          </div>

          <div className="my-auto">
            <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">
              {project.name}
            </h4>
            <p className="text-[11px] text-slate-300/80 font-mono line-clamp-1 mt-0.5">
              {project.domain || project.url}
            </p>
          </div>

          <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-white/10">
            <span>Live Portfolio</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
        </div>
      )}

      {/* Source Badge */}
      <div className="absolute bottom-2 right-2 z-10">
        {project.imageUrl ? (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-slate-900/85 text-white backdrop-blur-xs border border-white/10 shadow-xs flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>Custom Image</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-slate-900/80 text-slate-300 backdrop-blur-xs border border-white/10 shadow-xs flex items-center gap-1">
            <Globe className="w-2.5 h-2.5 text-emerald-400" />
            <span>Live Preview</span>
          </span>
        )}
      </div>
    </div>
  );
};

// 2. Compact Row Thumbnail for Dashboard Tab
const AdminProjectRowThumbnail: React.FC<{ project: ApiProjectItem }> = ({ project }) => {
  const [err, setErr] = useState(false);
  const rawUrl = project.url || '';
  const normalizedUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : (rawUrl ? `https://${rawUrl}` : '');

  const src = (project.imageUrl && project.imageUrl.trim() !== '')
    ? project.imageUrl.trim()
    : `/screenshots/${project.id}.jpg`;

  if (err || !src) {
    return (
      <div 
        className="w-12 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
        style={{ 
          backgroundColor: `${project.accentColor || '#E52521'}15`, 
          color: project.accentColor || '#E52521' 
        }}
      >
        {project.name.charAt(0)}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt="" 
      onError={() => setErr(true)}
      className="w-12 h-10 object-cover object-top rounded-lg border border-slate-200 shrink-0 bg-slate-100" 
    />
  );
};

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToPortfolio, onPreviewProject }) => {
  // Navigation State: ONLY 4 Menu Items
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    setIsAuthenticated(api.isAuthenticated());
    api.getAuthStatus().then((status) => {
      if (status.needsSetup) {
        setIsSetupMode(true);
      }
    }).catch(() => {});
  }, []);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSetupMode, setIsSetupMode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  // Projects & Data State
  const [projects, setProjects] = useState<ApiProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<ApiProjectItem | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryDesc, setNewCategoryDesc] = useState<string>('');
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('durozen_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Prevent background page from scrolling while any popup is open
  useEffect(() => {
    const isAnyModalOpen = isModalOpen || isCategoryModalOpen || Boolean(isDeletingId);
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen, isCategoryModalOpen, isDeletingId]);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Lifestyle');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formAccentColor, setFormAccentColor] = useState('#E52521');
  const [formClient, setFormClient] = useState('');
  const [formYear, setFormYear] = useState('2026');
  const [formTagsString, setFormTagsString] = useState('');
  const [formHighlightsString, setFormHighlightsString] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check health and load projects
  const checkHealthAndLoad = async () => {
    setIsLoading(true);
    try {
      const h = await api.checkHealth();
      setHealth(h);
      const data = await api.getProjects(undefined, true);
      setProjects(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkHealthAndLoad();
    }
  }, [isAuthenticated]);

  // Handle Login & Initial Setup
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);
    setAuthError(null);

    if (isSetupMode) {
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match');
        setIsSubmittingAuth(false);
        return;
      }
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters long');
        setIsSubmittingAuth(false);
        return;
      }
      try {
        await api.setupFirstAdmin(username, password);
        setIsAuthenticated(true);
        showToast('Admin account created successfully!');
      } catch (err: any) {
        setAuthError(err.message || 'Failed to create administrator account');
      } finally {
        setIsSubmittingAuth(false);
      }
      return;
    }

    try {
      await api.login(username, password);
      setIsAuthenticated(true);
      showToast('Logged in successfully!');
    } catch (err: any) {
      setAuthError(err.message || 'Invalid username or password');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    showToast('Logged out');
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormCategory('Lifestyle');
    setFormCustomCategory('');
    setFormTagline('');
    setFormDescription('');
    setFormUrl('');
    setFormImageUrl('');
    setFormAccentColor('#E52521');
    setFormClient('');
    setFormYear('2026');
    setFormTagsString('');
    setFormHighlightsString('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (project: ApiProjectItem) => {
    setEditingProject(project);
    setFormName(project.name);
    if (PRESET_CATEGORIES.includes(project.category)) {
      setFormCategory(project.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('Custom');
      setFormCustomCategory(project.category);
    }
    setFormTagline(project.tagline || '');
    setFormDescription(project.description || '');
    setFormUrl(project.url || '');
    setFormImageUrl(project.imageUrl || '');
    setFormAccentColor(project.accentColor || '#E52521');
    setFormClient(project.client || '');
    setFormYear(project.year || '2026');
    setFormTagsString(project.tags ? project.tags.join(', ') : '');
    setFormHighlightsString(project.highlights ? project.highlights.join(', ') : '');
    setIsModalOpen(true);
  };

  // Handle Image Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image file size must be less than 10MB', 'error');
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadedUrl = await api.uploadImage(file);
      setFormImageUrl(uploadedUrl);
      showToast('Picture uploaded successfully!');
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Save (Create or Update)
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) {
      showToast('Please provide a Project Name and Live URL', 'error');
      return;
    }

    const finalCategory = formCategory === 'Custom' 
      ? (formCustomCategory.trim() || 'General') 
      : formCategory;

    const tagsArray = formTagsString
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const highlightsArray = formHighlightsString
      .split(',')
      .map(h => h.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      if (editingProject) {
        // Update
        const updated = await api.updateProject(editingProject.id, {
          name: formName.trim(),
          category: finalCategory as any,
          tagline: formTagline.trim(),
          description: formDescription.trim(),
          url: formUrl.trim(),
          imageUrl: formImageUrl.trim(),
          accentColor: formAccentColor,
          accentBadge: finalCategory,
          year: formYear.trim(),
          client: formClient.trim(),
          tags: tagsArray,
          highlights: highlightsArray
        });
        setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...updated } : p));
        showToast(`Project "${updated.name}" updated successfully!`);
      } else {
        // Create
        const created = await api.createProject({
          name: formName.trim(),
          category: finalCategory as any,
          tagline: formTagline.trim(),
          description: formDescription.trim(),
          url: formUrl.trim(),
          imageUrl: formImageUrl.trim(),
          accentColor: formAccentColor,
          accentBadge: finalCategory,
          year: formYear.trim() || '2026',
          client: formClient.trim() || formName.trim(),
          tags: tagsArray,
          highlights: highlightsArray
        });
        setProjects(prev => [created, ...prev]);
        showToast(`Demo site "${created.name}" created successfully!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      showToast('Demo site deleted successfully');
      setIsDeletingId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete demo site', 'error');
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showToast('Category name cannot be empty', 'error');
      return;
    }
    if (allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Category "${trimmed}" already exists`, 'error');
      return;
    }
    const updated = [...customCategories, trimmed];
    setCustomCategories(updated);
    try {
      localStorage.setItem('durozen_custom_categories', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    showToast(`Category "${trimmed}" created successfully!`, 'success');
    setNewCategoryName('');
    setNewCategoryDesc('');
    setIsCategoryModalOpen(false);
  };

  // Filter projects for the Projects tab
  const filteredProjects = projects.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Derived list of all unique categories
  const allCategories = Array.from(
    new Set([...PRESET_CATEGORIES, ...customCategories, ...projects.map(p => p.category)])
  );

  // Sidebar Navigation Menu Items
  const sidebarItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects' as const, label: 'Projects', icon: FolderKanban },
    { id: 'categories' as const, label: 'Categories', icon: Tags },
  ];

  // Render Login View if unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/assets/aistudio/Durozen_500x500.jpg-removebg-preview__1__8c1ed3e1.png" 
                alt="DUROZEN" 
                className="h-12 w-auto object-contain drop-shadow-xs"
              />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2">
              {isSetupMode ? 'Setup Administrator Account' : 'Admin Portal'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isSetupMode
                ? 'Create your master administrator account to manage your portfolio'
                : 'Authenticate to manage live client demo sites and portfolio projects'}
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-8 shadow-xl shadow-slate-200/50">
            {authError && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-600 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition-all"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition-all"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {isSetupMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500 text-slate-900 placeholder-slate-400 text-sm outline-none transition-all"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAuth ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isSetupMode ? 'Create Admin Account' : 'Enter Admin Portal'}</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSetupMode(!isSetupMode);
                    setAuthError(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {isSetupMode ? 'Already have an account? Sign In' : 'First time setup? Create Admin Account'}
                </button>
              </div>
            </form>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={onBackToPortfolio}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              ← Return to Public Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row selection:bg-red-600 selection:text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-semibold border ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 1. DUROZEN ADMIN PORTAL SIDEBAR (Desktop) */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/90 flex-col justify-between shrink-0 sticky top-0 h-screen z-30">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <img 
              src="/assets/aistudio/Durozen_500x500.jpg-removebg-preview__1__8c1ed3e1.png" 
              alt="DUROZEN" 
              className="h-8 w-auto object-contain"
            />
            <div>
              <span className="text-sm font-extrabold tracking-tight text-slate-900 block leading-tight">
                Admin Portal
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-semibold tracking-wider uppercase block">
                DUROZEN
              </span>
            </div>
          </div>

          {/* EXACT 4 MENU ITEMS */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Navigation
            </div>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-50 text-red-600 border border-red-200/80 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.id === 'projects' && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {projects.length}
                    </span>
                  )}
                  {item.id === 'categories' && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {allCategories.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Profile & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {/* Quick Return to Public Website */}
          <button
            onClick={onBackToPortfolio}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Public Website</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          {/* Admin User Badge + Logout */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                A
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">admin</span>
                <span className="text-[10px] text-slate-400 block font-mono truncate">Administrator</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MOBILE / TABLET TOP HEADER */}
      {/* ======================================================== */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img 
            src="/assets/aistudio/Durozen_500x500.jpg-removebg-preview__1__8c1ed3e1.png" 
            alt="DUROZEN" 
            className="h-7 w-auto object-contain"
          />
          <span className="text-sm font-bold text-slate-900">Admin Portal</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="p-2 rounded-xl bg-red-600 text-white shadow-xs cursor-pointer"
            title="Add Demo Site"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onBackToPortfolio}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            title="View Public Site"
          >
            <Globe className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Slide-in Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col justify-between p-5 z-10 shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="/assets/aistudio/Durozen_500x500.jpg-removebg-preview__1__8c1ed3e1.png" 
                      alt="DUROZEN" 
                      className="h-8 w-auto object-contain"
                    />
                    <span className="font-bold text-sm text-slate-900">Admin Portal</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 4 MENU ITEMS IN MOBILE */}
                <nav className="space-y-1.5">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-red-50 text-red-600 border border-red-200 font-bold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                        <span className="flex-1 text-left">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer footer */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBackToPortfolio();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>View Public Website</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    <span>Logout (admin)</span>
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 3. MAIN CONTENT WORKSPACE (SWITCHES ACROSS THE 4 TABS) */}
      {/* ======================================================== */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        
        {/* -------------------------------------------------------- */}
        {/* TAB 1: DASHBOARD */}
        {/* -------------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Welcome back, Admin 👋
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Here is the current overview of your DUROZEN client demo sites and systems.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={openAddModal}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Demo Site</span>
                </button>
              </div>
            </div>

            {/* 3 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Demo Sites</span>
                  <FolderKanban className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-3xl font-black text-slate-900">{projects.length}</div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span>Live client showcases</span>
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Active Status</span>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-emerald-600">
                  {projects.filter(p => p.isActive !== false).length}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ready for live preview
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Categories</span>
                  <Tags className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-3xl font-black text-slate-900">{allCategories.length}</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Vertical market sectors
                </p>
              </div>
            </div>

            {/* Dashboard 2-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Recent Demo Sites (2 cols) */}
              <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Recent Demo Sites</h2>
                    <p className="text-xs text-slate-400">Quick view and management of latest projects</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <span>View all ({projects.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {projects.slice(0, 4).map((p) => (
                    <div 
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AdminProjectRowThumbnail project={p} />
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{p.name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{p.url}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span 
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase hidden sm:inline-block border"
                          style={{
                            backgroundColor: `${p.accentColor || '#E52521'}15`,
                            color: p.accentColor || '#E52521',
                            borderColor: `${p.accentColor || '#E52521'}30`,
                          }}
                        >
                          {p.category}
                        </span>
                        {onPreviewProject && (
                          <button
                            onClick={() => onPreviewProject(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 cursor-pointer"
                            title="Preview site"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Category Breakdown & Quick Actions (1 col) */}
              <div className="space-y-6">
                {/* Categories Distribution */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Category Breakdown</span>
                    <button 
                      onClick={() => setActiveTab('categories')}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Manage
                    </button>
                  </h3>

                  <div className="space-y-2.5">
                    {PRESET_CATEGORIES.map((cat) => {
                      const count = projects.filter(p => p.category === cat).length;
                      const pct = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700">{cat}</span>
                            <span className="font-mono text-slate-400">{count} sites ({pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-600 rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 2: PROJECTS */}
        {/* -------------------------------------------------------- */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Demo Sites & Projects
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Manage live client portfolio sites, add custom screenshots, and update URLs.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={checkHealthAndLoad}
                  className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  title="Refresh demo sites"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-600' : ''}`} />
                </button>

                <button
                  onClick={openAddModal}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Demo Site</span>
                </button>
              </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {['All', ...PRESET_CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px] sm:min-w-[280px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, tag, or client..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-xs text-slate-900 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Projects Cards Grid */}
            {isLoading ? (
              <div className="py-24 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-red-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">Loading demo sites...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-xs">
                <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 mb-1">No Demo Sites Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                  {searchQuery ? 'No demo sites match your search keyword.' : 'There are currently no demo sites in the database.'}
                </p>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-all cursor-pointer"
                >
                  Create New Demo Site
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    layout
                    className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* Accent Top Border */}
                      <div 
                        className="h-1.5 w-full"
                        style={{ backgroundColor: project.accentColor || '#E52521' }}
                      />

                      {/* Website Front Look Picture Thumbnail */}
                      <AdminProjectCardThumbnail project={project} />

                      <div className="p-4 sm:p-5">
                        {/* Header info */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span 
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-block mb-1.5 border"
                              style={{ 
                                backgroundColor: `${project.accentColor || '#E52521'}15`, 
                                color: project.accentColor || '#E52521',
                                borderColor: `${project.accentColor || '#E52521'}35`
                              }}
                            >
                              {project.category}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                              {project.name}
                            </h3>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {project.year || '2026'}
                          </span>
                        </div>

                        {/* Tagline */}
                        <p className="text-xs font-medium text-slate-600 mb-2 line-clamp-1">
                          {project.tagline || 'No tagline specified'}
                        </p>

                        {/* Description */}
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>

                        {/* Live URL Link */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-4">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-slate-600 text-[11px] font-mono truncate">
                              {project.url}
                            </span>
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-600 hover:text-red-700 shrink-0 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Open live URL"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Tags */}
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {project.tags.slice(0, 3).map((tag, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {project.tags.length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] text-slate-400">
                                +{project.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="px-4 sm:p-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500">
                        Client: <span className="text-slate-800 font-semibold">{project.client || 'DUROZEN'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onPreviewProject && (
                          <button
                            onClick={() => onPreviewProject(project)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-colors cursor-pointer"
                            title="Preview site modal"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(project)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit project"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setIsDeletingId(project.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 3: CATEGORIES */}
        {/* -------------------------------------------------------- */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Categories Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Organize client demo sites across targeted industry verticals.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 text-slate-500" />
                  <span>Add Demo Site</span>
                </button>
              </div>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allCategories.map((cat) => {
                const categoryProjects = projects.filter(p => p.category === cat);
                return (
                  <div 
                    key={cat}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                          {cat}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {categoryProjects.length} demo sites
                        </span>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                          Featured in this category:
                        </div>
                        {categoryProjects.length > 0 ? (
                          <ul className="space-y-1 text-xs text-slate-600">
                            {categoryProjects.slice(0, 3).map(cp => (
                              <li key={cp.id} className="flex items-center gap-1.5 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                <span className="truncate">{cp.name}</span>
                              </li>
                            ))}
                            {categoryProjects.length > 3 && (
                              <li className="text-[11px] text-slate-400 italic">
                                + {categoryProjects.length - 3} more
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No demo sites added yet</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCategory(cat);
                        setActiveTab('projects');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-semibold border border-slate-200 hover:border-red-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Filter Projects by {cat}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PROJECT (Responsive, Pinned Header & Footer, Internal Scroll) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsModalOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden text-slate-900"
            >
              {/* Pinned Header (Always visible at top) */}
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                    style={{ backgroundColor: formAccentColor }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                      {editingProject ? 'Edit Demo Site' : 'Add New Demo Site'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Fill in the demo site details to update your live client showcase
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  title="Close popup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form wrapping scrollable content and pinned footer */}
              <form onSubmit={handleSaveProject} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Scrollable Form Body (Internal Vertical Scroll) */}
                <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
                  {/* Site Name and Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Project / Site Name *
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Royal Makeover Studio"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Category
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none transition-all"
                      >
                        {allCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="Custom">+ Custom Category</option>
                      </select>
                    </div>
                  </div>

                  {formCategory === 'Custom' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Custom Category Name
                      </label>
                      <input
                        type="text"
                        value={formCustomCategory}
                        onChange={(e) => setFormCustomCategory(e.target.value)}
                        placeholder="e.g. Real Estate, Fintech"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none"
                      />
                    </div>
                  )}

                  {/* Live URL */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Live Demo URL (Netlify / Web Link) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formUrl}
                        onChange={(e) => setFormUrl(e.target.value)}
                        placeholder="https://yourproject.netlify.app"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none transition-all font-mono"
                      />
                      {formUrl && (
                        <a
                          href={formUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 shrink-0 border border-slate-200"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                          <span>Test</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Website Front Look Picture (Thumbnail / Mockup) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-red-600" />
                        <span>Website Front Look Picture (Screenshot / Thumbnail)</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">Recommended</span>
                    </div>

                    {/* Image Preview Box */}
                    {formImageUrl ? (
                      <div className="relative mb-3 rounded-xl overflow-hidden border border-slate-300 bg-white max-h-44 group shadow-xs">
                        <img 
                          src={formImageUrl} 
                          alt="Website Front Look Preview" 
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="w-full h-44 object-cover object-top"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-white text-xs text-slate-900 hover:bg-slate-100 font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Change Picture</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormImageUrl('')}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-xs text-white hover:bg-red-700 font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Action buttons & URL input */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-red-500 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-red-600 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-red-600" />
                        )}
                        <span>{isUploadingImage ? 'Uploading image...' : 'Upload Picture from PC'}</span>
                      </button>

                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          placeholder="Or paste direct image URL..."
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-red-500 text-slate-900 text-xs outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <p className="text-[11px] text-slate-500 mt-2">
                      Supports PNG, JPG, WEBP. If you don't upload a picture, DUROZEN will automatically capture a live screenshot of the URL.
                    </p>
                  </div>

                  {/* Tagline */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tagline (One-sentence hook)
                    </label>
                    <input
                      type="text"
                      value={formTagline}
                      onChange={(e) => setFormTagline(e.target.value)}
                      placeholder="e.g. Luxury bespoke bridal makeover and makeup artistry"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Description
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describe the website features, client deliverables, and technologies..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none resize-none"
                    />
                  </div>

                  {/* Color Accent Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      DUROZEN Brand Accent Color
                    </label>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {DUROZEN_BRAND_COLORS.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setFormAccentColor(c.hex)}
                          className={`h-7 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                            formAccentColor === c.hex 
                              ? 'border-slate-900 scale-105 shadow-xs' 
                              : 'border-transparent opacity-85 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex, color: c.hex === '#FACC15' ? '#000' : '#fff' }}
                        >
                          <span>{c.name}</span>
                        </button>
                      ))}
                      <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500">Hex:</span>
                        <input
                          type="text"
                          value={formAccentColor}
                          onChange={(e) => setFormAccentColor(e.target.value)}
                          className="w-20 bg-transparent text-slate-900 text-xs font-mono outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Client and Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={formClient}
                        onChange={(e) => setFormClient(e.target.value)}
                        placeholder="e.g. Apex Hospital Group"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Year
                      </label>
                      <input
                        type="text"
                        value={formYear}
                        onChange={(e) => setFormYear(e.target.value)}
                        placeholder="2026"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tags (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formTagsString}
                      onChange={(e) => setFormTagsString(e.target.value)}
                      placeholder="e.g. Hair & Spa, Booking System, Netlify Live"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none"
                    />
                  </div>

                  {/* Highlights */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Key Highlights (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formHighlightsString}
                      onChange={(e) => setFormHighlightsString(e.target.value)}
                      placeholder="e.g. Online Booking, Specialist Profiles, Virtual Tour"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Pinned Footer (Always accessible at bottom) */}
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0 z-10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{editingProject ? 'Save Changes' : 'Publish Demo Site'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: ADD CATEGORY (Responsive, Pinned Header & Footer, Internal Scroll) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCategoryModalOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden text-slate-900"
            >
              {/* Pinned Header */}
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white bg-red-600 shadow-xs shrink-0">
                    <Tags className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                      Add New Category
                    </h2>
                    <p className="text-xs text-slate-500">
                      Create a new industry vertical to group and filter client showcase projects
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  title="Close popup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form wrapping scrollable content and pinned footer */}
              <form onSubmit={handleSaveCategory} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Scrollable Form Body */}
                <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Real Estate, Fintech, E-Commerce"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none transition-all font-medium"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      This will appear on the portfolio category filter bar and project cards.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Description / Subtitle (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={newCategoryDesc}
                      onChange={(e) => setNewCategoryDesc(e.target.value)}
                      placeholder="Brief note describing the kinds of client websites in this category..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-900 text-xs outline-none resize-none"
                    />
                  </div>

                  {/* Existing Categories Preview */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="block text-[11px] font-mono text-slate-500 uppercase font-semibold mb-2">
                      Currently Active Categories ({allCategories.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {allCategories.map(c => (
                        <span key={c} className="px-2.5 py-1 rounded-lg text-[11px] bg-white border border-slate-200 text-slate-700 font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pinned Sticky Footer Actions */}
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0 z-10">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 sm:px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Category</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL: DELETE CONFIRMATION (Responsive & Visible) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isDeletingId && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsDeletingId(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-center text-slate-900 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Delete Demo Site?</h3>
              <p className="text-xs text-slate-500 mb-6">
                Are you sure you want to remove this demo site? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeletingId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(isDeletingId)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
