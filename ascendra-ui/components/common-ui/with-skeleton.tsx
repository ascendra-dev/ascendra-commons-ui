import * as React from 'react';

export function WithSkeleton({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SkeletonState({
  if: condition,
  children,
}: {
  if: boolean;
  children: React.ReactNode;
}) {
  if (!condition) return null;
  return <>{children}</>;
}
