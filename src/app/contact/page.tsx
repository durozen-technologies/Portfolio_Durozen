'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ContactPage } from '../../components/ContactPage';

export default function ContactRoute() {
  const router = useRouter();

  return <ContactPage onNavigate={(path) => router.push(path)} />;
}

