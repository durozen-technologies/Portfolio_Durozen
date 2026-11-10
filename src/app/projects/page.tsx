'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProjectsPage } from '../../components/ProjectsPage';

export default function ProjectsRoute() {
  const router = useRouter();

  return <ProjectsPage onNavigate={(path) => router.push(path)} />;
}

