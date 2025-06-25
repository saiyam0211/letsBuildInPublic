import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string;
  };
  mozConnection?: {
    effectiveType?: string;
  };
  webkitConnection?: {
    effectiveType?: string;
  };
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Check connection speed
    const nav = navigator as NavigatorWithConnection;
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection) {
      setIsSlowConnection(
        connection.effectiveType === 'slow-2g' ||
          connection.effectiveType === '2g'
      );
    }

    // Monitor performance metrics
    const measurePerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');

        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        const domContentLoaded =
          navigation.domContentLoadedEventEnd - navigation.fetchStart;

        let firstContentfulPaint = 0;
        let largestContentfulPaint = 0;

        paint.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            firstContentfulPaint = entry.startTime;
          }
        });

        // LCP observer
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver(list => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            largestContentfulPaint = lastEntry.startTime;
          });

          try {
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch (e) {
            // LCP not supported
          }
        }

        setMetrics({
          loadTime,
          domContentLoaded,
          firstContentfulPaint,
          largestContentfulPaint,
        });

        // Performance warnings removed to avoid console linting errors
      }
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  return {
    metrics,
    isSlowConnection,
    isPerformant: metrics ? metrics.loadTime <= 2000 : null,
  };
};
