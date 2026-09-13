'use client';

import { TabsContext } from '@/ascendra-ui/providers/tabs/tabs.provider';
import { useState } from 'react';

export function Tabs({
  defaultValue,
  children,
}: { defaultValue: string; children: React.ReactNode }) {
  const [active, setActive] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      {children}
    </TabsContext.Provider>
  );
}
