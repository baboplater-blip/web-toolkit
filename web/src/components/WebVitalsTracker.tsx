'use client';

import { useEffect } from 'react';
import { recordSample, type CwvMetricName } from '@/lib/cwv';

/**
 * Measures Core Web Vitals for the current visitor and stores a rolling window
 * locally (see lib/cwv.ts). Nothing is sent off-device — this is privacy-first
 * RUM that the /admin page reads to compare real-user p75 against Lighthouse.
 *
 * web-vitals is dynamically imported so it never lands in the initial bundle.
 */
export function WebVitalsTracker() {
  useEffect(() => {
    let cancelled = false;
    const path =
      typeof window !== 'undefined' ? window.location.pathname : '/';

    import('web-vitals')
      .then(({ onLCP, onINP, onCLS, onFCP, onTTFB }) => {
        if (cancelled) return;
        const handler = (name: CwvMetricName) => (metric: { value: number; rating: string }) => {
          recordSample(name, {
            v: metric.value,
            r: metric.rating,
            p: path,
            t: Date.now(),
          });
        };
        onLCP(handler('LCP'));
        onINP(handler('INP'));
        onCLS(handler('CLS'));
        onFCP(handler('FCP'));
        onTTFB(handler('TTFB'));
      })
      .catch(() => {
        /* web-vitals unavailable — skip silently */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
