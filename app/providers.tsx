"use client";

import type { ReactNode } from 'react';

import { Web3Provider } from '@/providers/Web3Provider';

export function Providers({ children }: { children: ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}

