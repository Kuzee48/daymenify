'use client';

import { type ReactNode } from 'react';
import { Toaster } from 'sonner';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Combined providers wrapper.
 * This is a client component that wraps the entire app with
 * necessary context providers.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        duration={5000}
        toastOptions={{
          className: 'font-sans',
        }}
      />
    </>
  );
}
