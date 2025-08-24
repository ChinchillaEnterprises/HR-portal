/**
 * Simple in-memory cache service with TTL support
 * In production, consider using Redis or similar
 */
export class CacheService {
  private static cache = new Map<string, { value: any; expiry: number }>();
  private static defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get value from cache
   */
  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  /**
   * Set value in cache
   */
  static set<T>(key: string, value: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  /**
   * Delete from cache
   */
  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  static size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  static cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Cache with automatic refresh
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;
    
    const value = await fetcher();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Batch get multiple keys
   */
  static getMany<T>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }
    
    return results;
  }

  /**
   * Batch set multiple values
   */
  static setMany<T>(entries: Array<{ key: string; value: T; ttl?: number }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value, entry.ttl);
    }
  }
}

// Auto cleanup every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    CacheService.cleanup();
  }, 60 * 1000);
}