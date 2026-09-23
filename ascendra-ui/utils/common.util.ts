export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAmount(amount: number, currency = 'PKR'): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatCount(value: number, compactThreshold = 10_000): string {
  if (value >= compactThreshold) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return value.toLocaleString('en-US');
}

export function formatSignedPercent(value: number, decimals = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateRange(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return '';
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  return `${fmt(startIso)} – ${fmt(endIso)}`;
}
