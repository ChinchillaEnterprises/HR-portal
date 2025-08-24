"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { CacheService } from '@/lib/performance/cacheService';
import { PerformanceMonitor } from '@/lib/performance/performanceMonitor';

const client = generateClient<Schema>();

interface UseOptimizedDataOptions {
  cache?: boolean;
  cacheTTL?: number;
  pollInterval?: number;
  batchSize?: number;
  debounceMs?: number;
}

/**
 * Optimized hook for fetching paginated data with caching
 */
export function usePaginatedData<T>(
  modelName: keyof Schema['models'],
  options: UseOptimizedDataOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  const { cache = true, cacheTTL, batchSize = 20 } = options;
  const loadingRef = useRef(false);

  const loadData = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    
    const cacheKey = `${modelName}_page_${reset ? 0 : page}`;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      // Check cache first
      if (cache && !reset) {
        const cached = CacheService.get<T[]>(cacheKey);
        if (cached) {
          setData(prev => reset ? cached : [...prev, ...cached]);
          setHasMore(cached.length === batchSize);
          setLoading(false);
          return;
        }
      }
      
      // Fetch from API with performance monitoring
      const result = await PerformanceMonitor.measure(
        `fetch.${String(modelName)}`,
        async () => {
          const model = client.models[modelName] as any;
          return model.list({
            limit: batchSize,
            offset: reset ? 0 : page * batchSize,
          });
        },
        { page: reset ? 0 : page, batchSize }
      );
      
      const items = result.data || [];
      
      // Cache the results
      if (cache) {
        CacheService.set(cacheKey, items, cacheTTL);
      }
      
      setData(prev => reset ? items : [...prev, ...items]);
      setHasMore(items.length === batchSize);
      if (reset) setPage(0);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [modelName, page, cache, cacheTTL, batchSize]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const refresh = useCallback(() => {
    setPage(0);
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [page]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

/**
 * Optimized hook for real-time data with efficient updates
 */
export function useRealtimeData<T>(
  modelName: keyof Schema['models'],
  filter?: any,
  options: UseOptimizedDataOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { pollInterval } = options;
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    let pollTimer: NodeJS.Timeout;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        const model = client.models[modelName] as any;
        const result = await model.list(filter ? { filter } : {});
        
        if (mounted) {
          setData(result.data || []);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load data'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up subscription
    const setupSubscription = () => {
      const model = client.models[modelName] as any;
      
      // Subscribe to creates
      const createSub = model.onCreate().subscribe({
        next: (item: any) => {
          if (mounted) {
            setData(prev => [item, ...prev]);
          }
        },
      });

      // Subscribe to updates
      const updateSub = model.onUpdate().subscribe({
        next: (item: any) => {
          if (mounted) {
            setData(prev => prev.map(d => 
              (d as any).id === item.id ? item : d
            ));
          }
        },
      });

      // Subscribe to deletes
      const deleteSub = model.onDelete().subscribe({
        next: (item: any) => {
          if (mounted) {
            setData(prev => prev.filter(d => (d as any).id !== item.id));
          }
        },
      });

      subscriptionRef.current = {
        unsubscribe: () => {
          createSub.unsubscribe();
          updateSub.unsubscribe();
          deleteSub.unsubscribe();
        },
      };
    };

    loadInitialData();
    setupSubscription();

    // Optional polling for environments where subscriptions are unreliable
    if (pollInterval) {
      pollTimer = setInterval(loadInitialData, pollInterval);
    }

    return () => {
      mounted = false;
      subscriptionRef.current?.unsubscribe();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [modelName, filter, pollInterval]);

  return { data, loading, error };
}

/**
 * Debounced search hook
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const searchTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Set new timer
    searchTimerRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        setError(null);
        
        const searchResults = await PerformanceMonitor.measure(
          'search.debounced',
          () => searchFn(query),
          { query }
        );
        
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, debounceMs);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [query, searchFn, debounceMs]);

  return {
    query,
    setQuery,
    results,
    searching,
    error,
  };
}

/**
 * Batch operations hook
 */
export function useBatchOperations<T>(
  modelName: keyof Schema['models']
) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  const batchCreate = useCallback(async (
    items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[],
    batchSize: number = 10
  ) => {
    setProcessing(true);
    setProgress({ current: 0, total: items.length });
    
    const results: T[] = [];
    const errors: Error[] = [];
    
    try {
      const model = client.models[modelName] as any;
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(item => model.create(item))
        );
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.data) {
            results.push(result.value.data);
          } else if (result.status === 'rejected') {
            errors.push(new Error(`Item ${i + index}: ${result.reason}`));
          }
        });
        
        setProgress({ current: i + batch.length, total: items.length });
      }
      
      return { results, errors };
    } finally {
      setProcessing(false);
    }
  }, [modelName]);

  const batchUpdate = useCallback(async (
    updates: Array<{ id: string; data: Partial<T> }>,
    batchSize: number = 10
  ) => {
    setProcessing(true);
    setProgress({ current: 0, total: updates.length });
    
    const results: T[] = [];
    const errors: Error[] = [];
    
    try {
      const model = client.models[modelName] as any;
      
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(({ id, data }) => model.update({ id, ...data }))
        );
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.data) {
            results.push(result.value.data);
          } else if (result.status === 'rejected') {
            errors.push(new Error(`Item ${updates[i + index].id}: ${result.reason}`));
          }
        });
        
        setProgress({ current: i + batch.length, total: updates.length });
      }
      
      return { results, errors };
    } finally {
      setProcessing(false);
    }
  }, [modelName]);

  const batchDelete = useCallback(async (
    ids: string[],
    batchSize: number = 10
  ) => {
    setProcessing(true);
    setProgress({ current: 0, total: ids.length });
    
    const successes: string[] = [];
    const errors: Error[] = [];
    
    try {
      const model = client.models[modelName] as any;
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(id => model.delete({ id }))
        );
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successes.push(ids[i + index]);
          } else if (result.status === 'rejected') {
            errors.push(new Error(`Item ${ids[i + index]}: ${result.reason}`));
          }
        });
        
        setProgress({ current: i + batch.length, total: ids.length });
      }
      
      return { successes, errors };
    } finally {
      setProcessing(false);
    }
  }, [modelName]);

  return {
    batchCreate,
    batchUpdate,
    batchDelete,
    processing,
    progress,
  };
}