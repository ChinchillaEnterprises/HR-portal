export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalDuration: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    operationCount: number;
  };
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static maxMetrics = 1000;
  private static timers = new Map<string, number>();

  /**
   * Start timing an operation
   */
  static startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing and record metric
   */
  static endTimer(name: string, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`No timer found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    return duration;
  }

  /**
   * Measure async function performance
   */
  static async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, success: true },
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      throw error;
    }
  }

  /**
   * Record a metric
   */
  static recordMetric(metric: PerformanceMetric): void {
    this.metrics.unshift(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics);
    }

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }
  }

  /**
   * Get metrics by name
   */
  static getMetrics(name?: string): PerformanceMetric[] {
    if (!name) return [...this.metrics];
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get performance report
   */
  static getReport(name?: string, timeWindowMs?: number): PerformanceReport {
    let metrics = this.getMetrics(name);
    
    // Apply time window filter
    if (timeWindowMs) {
      const cutoff = Date.now() - timeWindowMs;
      metrics = metrics.filter(m => m.timestamp > cutoff);
    }

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = metrics.length > 0 ? totalDuration / metrics.length : 0;
    const slowestOperation = metrics.reduce((slowest, m) => 
      !slowest || m.duration > slowest.duration ? m : slowest, null as PerformanceMetric | null
    );

    return {
      metrics,
      summary: {
        totalDuration,
        averageDuration,
        slowestOperation,
        operationCount: metrics.length,
      },
    };
  }

  /**
   * Clear metrics
   */
  static clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Get slow operations
   */
  static getSlowOperations(thresholdMs: number = 1000): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > thresholdMs);
  }

  /**
   * Export metrics
   */
  static exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Performance decorator for methods
   */
  static measureMethod() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const className = target.constructor.name;
        const metricName = `${className}.${propertyKey}`;
        
        return PerformanceMonitor.measure(
          metricName,
          () => originalMethod.apply(this, args),
          { className, method: propertyKey }
        );
      };

      return descriptor;
    };
  }
}

// Browser Performance API integration
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  // Observe navigation timing
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;
        PerformanceMonitor.recordMetric({
          name: 'page.load',
          duration: navEntry.loadEventEnd - navEntry.fetchStart,
          timestamp: Date.now(),
          metadata: {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            domInteractive: navEntry.domInteractive - navEntry.fetchStart,
          },
        });
      }
    }
  });

  observer.observe({ entryTypes: ['navigation'] });
}