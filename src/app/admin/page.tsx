'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPortal } from '../../components/AdminPortal';
import { ProjectQuickViewModal } from '../../components/ProjectQuickViewModal';
import { ProjectItem } from '../../data/projects';

export default function AdminRoute() {
  const router = useRouter();
  const [adminPreviewProject, setAdminPreviewProject] = useState<ProjectItem | null>(null);

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased">
      <AdminPortal 
        onBackToPortfolio={() => router.push('/')}
        onPreviewProject={(project) => setAdminPreviewProject(project)}
      />

      {/* Quick View Modal for Admin Preview */}
      <ProjectQuickViewModal
        project={adminPreviewProject}
        onClose={() => setAdminPreviewProject(null)}
      />
    </main>
  );
}

