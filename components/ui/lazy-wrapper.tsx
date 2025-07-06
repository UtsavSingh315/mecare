"use client";

import { memo, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading";

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const LazyWrapper = memo(({ children, fallback, className }: LazyWrapperProps) => {
  return (
    <Suspense 
      fallback={fallback || <LoadingSpinner size="sm" />}
    >
      <div className={className}>
        {children}
      </div>
    </Suspense>
  );
});

LazyWrapper.displayName = "LazyWrapper";

// Performance optimized card wrapper
interface OptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  loadingMessage?: string;
}

export const OptimizedCard = memo(({ 
  children, 
  className = "", 
  loading = false,
  loadingMessage = "Loading..." 
}: OptimizedCardProps) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <LoadingSpinner message={loadingMessage} size="sm" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {children}
    </div>
  );
});

OptimizedCard.displayName = "OptimizedCard";
