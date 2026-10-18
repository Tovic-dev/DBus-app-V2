import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './client';

/** Wraps the app in a single QueryClientProvider. */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}