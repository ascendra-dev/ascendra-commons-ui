'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { LuMoon, LuSun, LuMonitor } from 'react-icons/lu';

const CYCLE: Record<string, string> = { light: 'dark', dark: 'system', system: 'light' };

const ICONS: Record<string, React.ReactNode> = {
  light: <LuSun className="size-3.5 text-gray-400" />,
  dark: <LuMoon className="size-3.5 text-gray-400" />,
  system: <LuMonitor className="size-3.5 text-gray-400" />,
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true));
    return () => clearTimeout(id);
  }, []);

  if (!mounted) return <div className="min-h-7 min-w-7" />;

  const current = theme ?? 'system';

  return (
    <button
      data-slot="theme-toggle"
      type="button"
      title={`Theme: ${current}`}
      onClick={() => setTheme(CYCLE[current] ?? 'system')}
      className="focus-visible:outline-primary bg-background border-border flex min-h-7 min-w-7 cursor-pointer items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {ICONS[current]}
    </button>
  );
}
