/**
 * Web Vitals Tracking
 * Reports Core Web Vitals (LCP, INP, CLS, TTFB, FCP) to Sentry
 * Note: FID is deprecated, replaced by INP (Interaction to Next Paint)
 */

import * as Sentry from '@sentry/react';
import { onCLS, onLCP, onTTFB, onINP, onFCP, type Metric } from 'web-vitals';
import logger from './logger';

/**
 * Reports a web vital metric to Sentry and logs it
 */
function reportMetric(metric: Metric) {
  // Log locally in development
  logger.debug(`[Web Vitals] ${metric.name}:`, {
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
  });

  // Send to Sentry as a custom measurement
  Sentry.setMeasurement(metric.name, metric.value, 'millisecond');

  // Also add as breadcrumb for context
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
    level: 'info',
    data: {
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      delta: metric.delta,
    },
  });
}

/**
 * Initialize Web Vitals tracking
 * Call this once at app startup
 */
export function initWebVitals() {
  // Largest Contentful Paint - measures loading performance
  onLCP(reportMetric);

  // First Contentful Paint - measures initial render time
  onFCP(reportMetric);

  // Cumulative Layout Shift - measures visual stability
  onCLS(reportMetric);

  // Time to First Byte - measures server response time
  onTTFB(reportMetric);

  // Interaction to Next Paint - measures responsiveness (replaces FID)
  onINP(reportMetric);

  logger.info('[Web Vitals] Tracking initialized');
}
