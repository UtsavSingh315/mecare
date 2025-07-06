// React 18 Concurrent Features for Performance
"use client";

import React, { startTransition, useDeferredValue, useMemo, useCallback } from "react";

// Hook for optimizing expensive operations
export function useDeferredSearch(searchTerm: string) {
  const deferredSearchTerm = useDeferredValue(searchTerm);
  return deferredSearchTerm;
}

// Hook for batching state updates
export function useBatchedUpdates() {
  const batchUpdate = useCallback((updateFn: () => void) => {
    startTransition(() => {
      updateFn();
    });
  }, []);
  
  return batchUpdate;
}

// Memoized components wrapper
export function createMemoComponent<T extends object>(
  Component: React.ComponentType<T>,
  propsAreEqual?: (prevProps: T, nextProps: T) => boolean
) {
  return React.memo(Component, propsAreEqual);
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string) {
  const startTime = useMemo(() => performance.now(), []);
  
  return useCallback(() => {
    const endTime = performance.now();
    console.log(`${name} took ${endTime - startTime} milliseconds`);
  }, [name, startTime]);
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
}

// Resource preloader hook
export function useResourcePreloader() {
  const preloadResource = useCallback((href: string, as: string) => {
    if (typeof window === 'undefined') return;
    
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }, []);

  const prefetchResource = useCallback((href: string) => {
    if (typeof window === 'undefined') return;
    
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }, []);

  return { preloadResource, prefetchResource };
}

// Web Vitals monitoring
export function useWebVitals() {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(console.log);
      onINP(console.log);
      onFCP(console.log);
      onLCP(console.log);
      onTTFB(console.log);
    });
  }, []);
}
