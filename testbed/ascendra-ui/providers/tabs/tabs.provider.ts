'use client';

import { createContext, useContext } from 'react';
import type { TabsContextValue } from './tabs.types';

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used inside <Tabs>');
  }
  return context;
}
