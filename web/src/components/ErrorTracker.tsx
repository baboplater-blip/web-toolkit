'use client';

import { useEffect } from 'react';
import { initErrorTracking } from '@/lib/error-tracking';

/**
 * Installs privacy-first global error tracking (see lib/error-tracking.ts).
 * Redacted error signatures are kept in localStorage only — nothing is sent
 * off-device. The /admin page surfaces the aggregate so the operator can catch
 * real-user crashes that synthetic checks miss.
 */
export function ErrorTracker() {
  useEffect(() => {
    const teardown = initErrorTracking();
    return teardown;
  }, []);

  return null;
}
