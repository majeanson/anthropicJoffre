/**
 * Response Time Monitoring Utility
 *
 * Tracks response times for REST endpoints and Socket.io events with percentile calculations.
 * Provides performance insights for Sprint 2 optimization goals.
 */

import { Request, Response, NextFunction } from 'express';

export interface ResponseTimeMetric {
  name: string; // Endpoint or event name
  count: number; // Total number of calls
  min: number; // Minimum response time (ms)
  max: number; // Maximum response time (ms)
  avg: number; // Average response time (ms)
  p50: number; // 50th percentile (median)
  p95: number; // 95th percentile
  p99: number; // 99th percentile
  totalTime: number; // Total time spent (ms)
  lastUpdated: number; // Timestamp of last update
}

interface TimeSeries {
  times: number[]; // Individual response times
  maxSize: number; // Maximum samples to keep
}

export class ResponseTimeTracker {
  private metrics: Map<string, TimeSeries> = new Map();
  private readonly maxSamples: number;

  constructor(maxSamples: number = 1000) {
    this.maxSamples = maxSamples;
  }

  /**
   * Record a response time for an endpoint or event
   */
  record(name: string, durationMs: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        times: [],
        maxSize: this.maxSamples,
      });
    }

    const series = this.metrics.get(name)!;
    series.times.push(durationMs);

    // Keep only the most recent samples (rolling window)
    if (series.times.length > series.maxSize) {
      series.times.shift();
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedTimes: number[], percentile: number): number {
    if (sortedTimes.length === 0) return 0;
    if (sortedTimes.length === 1) return sortedTimes[0];

    const index = (percentile / 100) * (sortedTimes.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sortedTimes[lower] * (1 - weight) + sortedTimes[upper] * weight;
  }

  /**
   * Get metrics for a specific endpoint/event
   */
  getMetric(name: string): ResponseTimeMetric | null {
    const series = this.metrics.get(name);
    if (!series || series.times.length === 0) {
      return null;
    }

    const sortedTimes = [...series.times].sort((a, b) => a - b);
    const count = sortedTimes.length;
    const totalTime = sortedTimes.reduce((sum, time) => sum + time, 0);

    return {
      name,
      count,
      min: sortedTimes[0],
      max: sortedTimes[count - 1],
      avg: totalTime / count,
      p50: this.calculatePercentile(sortedTimes, 50),
      p95: this.calculatePercentile(sortedTimes, 95),
      p99: this.calculatePercentile(sortedTimes, 99),
      totalTime,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): ResponseTimeMetric[] {
    const metrics: ResponseTimeMetric[] = [];

    for (const name of this.metrics.keys()) {
      const metric = this.getMetric(name);
      if (metric) {
        metrics.push(metric);
      }
    }

    // Sort by average response time (slowest first)
    return metrics.sort((a, b) => b.avg - a.avg);
  }

  /**
   * Get metrics summary with alerting
   */
  getSummary(): {
    totalEndpoints: number;
    totalRequests: number;
    slowEndpoints: ResponseTimeMetric[]; // p95 > 100ms
    fastEndpoints: ResponseTimeMetric[]; // p95 < 50ms
    avgResponseTime: number;
  } {
    const allMetrics = this.getAllMetrics();
    const totalRequests = allMetrics.reduce((sum, m) => sum + m.count, 0);
    const totalTime = allMetrics.reduce((sum, m) => sum + m.totalTime, 0);

    return {
      totalEndpoints: allMetrics.length,
      totalRequests,
      slowEndpoints: allMetrics.filter(m => m.p95 > 100),
      fastEndpoints: allMetrics.filter(m => m.p95 < 50),
      avgResponseTime: totalRequests > 0 ? totalTime / totalRequests : 0,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Clear metrics for a specific endpoint
   */
  clearMetric(name: string): void {
    this.metrics.delete(name);
  }
}

// Singleton instance for global use
export const responseTimeTracker = new ResponseTimeTracker(1000);

/**
 * Express middleware for tracking REST endpoint response times
 */
export function responseTimeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const route = `${req.method} ${req.route?.path || req.path}`;

  // Track response time when request completes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    responseTimeTracker.record(route, duration);

    // Log slow requests (>200ms)
    if (duration > 200) {
      console.warn(`⚠️ Slow request: ${route} took ${duration}ms`);
    }
  });

  next();
}

/**
 * Wrapper for Socket.io event handlers to track response times
 */
export function trackSocketEvent<T extends unknown[]>(
  eventName: string,
  handler: (...args: T) => void | Promise<void>
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    const startTime = Date.now();

    try {
      await handler(...args);
    } finally {
      const duration = Date.now() - startTime;
      responseTimeTracker.record(`socket:${eventName}`, duration);

      // Log slow socket events (>100ms)
      if (duration > 100) {
        console.warn(`⚠️ Slow socket event: ${eventName} took ${duration}ms`);
      }
    }
  };
}
