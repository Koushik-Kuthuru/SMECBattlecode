
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is a client component to perform a redirect.
// It's a fallback in case the next.config.js redirect doesn't work in some development environments.
export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null; // This page will not render anything.
}
