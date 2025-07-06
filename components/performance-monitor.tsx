"use client";

import { useEffect } from "react";
import { useWebVitals } from "@/hooks/use-performance";

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function PerformanceMonitor({ enabled = false }: { enabled?: boolean }) {
  useWebVitals();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Monitor long tasks
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`Long task detected: ${entry.duration}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
      });
    }

    return () => observer.disconnect();
  }, [enabled]);

  // Don't render anything in production unless specifically enabled
  if (process.env.NODE_ENV === 'production' && !enabled) {
    return null;
  }

  return null;
}

// Performance debugging component for development
export function PerformanceDebugger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const logPerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        console.group('🚀 Performance Metrics');
        console.log('DNS lookup:', navigation.domainLookupEnd - navigation.domainLookupStart + 'ms');
        console.log('TCP connection:', navigation.connectEnd - navigation.connectStart + 'ms');
        console.log('TLS handshake:', navigation.requestStart - navigation.secureConnectionStart + 'ms');
        console.log('Request + Response:', navigation.responseEnd - navigation.requestStart + 'ms');
        console.log('DOM parsing:', navigation.domInteractive - navigation.responseEnd + 'ms');
        console.log('Resource loading:', navigation.loadEventStart - navigation.domContentLoadedEventEnd + 'ms');
        console.log('Total load time:', navigation.loadEventEnd - navigation.fetchStart + 'ms');
        console.groupEnd();
      }

      // Resource timing
      const resources = performance.getEntriesByType('resource');
      const slowResources = resources.filter((resource: PerformanceEntry) => resource.duration > 1000);
      
      if (slowResources.length > 0) {
        console.group('⚠️ Slow Resources (>1s)');
        slowResources.forEach(resource => {
          console.log(`${resource.name}: ${Math.round(resource.duration)}ms`);
        });
        console.groupEnd();
      }
    };

    // Log performance after page load
    if (document.readyState === 'complete') {
      logPerformance();
    } else {
      window.addEventListener('load', logPerformance);
    }

    return () => window.removeEventListener('load', logPerformance);
  }, []);

  return null;
}
