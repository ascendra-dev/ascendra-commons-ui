export interface WithEmptyValueProps {
  /** Tested for emptiness — null, undefined, and an empty string all count as empty. */
  value: unknown;
  /** Rendered when value is empty. Defaults to an em dash. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function WithEmptyValue({
  value,
  fallback = '—',
  children,
}: WithEmptyValueProps) {
  const isEmpty = value === null || value === undefined || value === '';
  if (isEmpty) return <>{fallback}</>;
  return <>{children}</>;
}
