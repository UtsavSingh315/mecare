"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, expiry?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: expiry || this.DEFAULT_EXPIRY,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.expiry;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const globalCache = new DataCache();

interface UseFetchOptions {
  cacheKey?: string;
  cacheExpiry?: number;
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useFetch<T>(
  url: string | (() => string),
  options: UseFetchOptions = {}
) {
  const { user } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    cacheKey,
    cacheExpiry,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const fetchData = useCallback(async () => {
    if (!enabled || !user) return;

    const finalUrl = typeof url === "function" ? url() : url;
    const key = cacheKey || finalUrl;

    // Check cache first
    const cachedData = globalCache.get<T>(key);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      onSuccess?.(cachedData);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(finalUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache the result
      globalCache.set(key, result, cacheExpiry);
      
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);
        onError?.(err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, user, enabled, cacheKey, cacheExpiry, onSuccess, onError]);

  const refetch = useCallback(() => {
    const key = cacheKey || (typeof url === "function" ? url() : url);
    globalCache.delete(key);
    fetchData();
  }, [fetchData, cacheKey, url]);

  const clearCache = useCallback(() => {
    globalCache.clear();
  }, []);

  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch, clearCache };
}

// Optimized mutation hook
export function useMutation<T, V = any>(
  mutationFn: (variables: V) => Promise<T>,
  options: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: Error, variables: V) => void;
    invalidateCache?: string[];
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: V) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      
      // Invalidate cache keys
      options.invalidateCache?.forEach(key => globalCache.delete(key));
      
      options.onSuccess?.(result, variables);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      options.onError?.(error, variables);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  return { mutate, loading, error };
}
