'use client';

import { useDataTableSearch } from '@/ascendra-ui/providers/data-table/data-table.provider';

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface DataTableHighlightProps {
  text: string;
  item: unknown;
  itemKey: PropertyKey;
}

const markClass = 'bg-yellow-200/50 text-inherit dark:bg-yellow-400/30';

export function DataTableHighlight({ text, item, itemKey }: DataTableHighlightProps) {
  const { searchTerm, getRanges } = useDataTableSearch();

  const ranges = getRanges(item, itemKey);

  if (ranges?.length) {
    const parts: { text: string; highlight: boolean }[] = [];
    let cursor = 0;
    for (const [start, end] of ranges) {
      if (start > cursor) parts.push({ text: text.slice(cursor, start), highlight: false });
      parts.push({ text: text.slice(start, end + 1), highlight: true });
      cursor = end + 1;
    }
    if (cursor < text.length) parts.push({ text: text.slice(cursor), highlight: false });
    return (
      <>
        {parts.map((p, i) =>
          p.highlight ? (
            <mark key={i} className={markClass}>{p.text}</mark>
          ) : (
            p.text
          )
        )}
      </>
    );
  }

  // Each whitespace-separated word highlights independently, matching the
  // same word-by-word logic the plain (non-fuzzy) filter uses - "sep 2"
  // highlights "Sep" and "2" separately rather than requiring that literal
  // contiguous phrase to appear.
  const words = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return <>{text}</>;

  const regex = new RegExp(`(${words.map(escapeRegex).join('|')})`, 'i');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className={markClass}>{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}
