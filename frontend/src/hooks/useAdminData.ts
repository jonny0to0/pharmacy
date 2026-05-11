import React, { useState, useCallback, useEffect, useMemo } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface AdminResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const MAX_RETRIES = 3;

/**
 * Enterprise-grade hook for fetching and managing admin data with robust state handling
 */
export function useAdminData<T>(url: string, autoFetch: boolean = true) {
  const isFetchingRef = React.useRef(false);
  const hasFetchedRef = React.useRef(false);
  const retryCountRef = React.useRef(0);
  const lastParamsRef = React.useRef<string>('');
  
  const [data, setDataState] = useState<T | undefined>(undefined);
  const dataRef = React.useRef<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);

  // Sync ref with state & support functional updates
  const setData = useCallback((val: React.SetStateAction<T | undefined>) => {
    setDataState(prev => {
      const result = typeof val === 'function' ? (val as any)(prev) : val;
      dataRef.current = result;
      return result;
    });
  }, []);

  // Helper to ensure lists are always arrays even on API failure
  const normalizeData = useCallback((incomingData: any): T => {
    if (incomingData === null || incomingData === undefined) return incomingData;
    
    // If we have an existing non-null data of type array, ensure incoming is also array
    if (Array.isArray(dataRef.current) && !Array.isArray(incomingData)) {
      console.warn(`[useAdminData] Data contract violation for ${url}: Expected Array, got ${typeof incomingData}`);
      return [] as unknown as T;
    }
    return incomingData;
  }, [url]);

  const fetchData = useCallback(async (params?: any, force: boolean = false) => {
    // Stringify params to check for deep changes
    const paramsKey = JSON.stringify(params || {});
    const isNewParams = paramsKey !== lastParamsRef.current;
    
    // 1. Double-fetch guard (Single-flight)
    if (isFetchingRef.current) return;
    
    // 2. Prevent redundant fetches if already has data (unless forced or params change)
    if (hasFetchedRef.current && !force && !isNewParams) return;

    // 3. Retry guard (Prevent infinite loops on error)
    if (retryCountRef.current >= MAX_RETRIES && !force) {
      console.warn(`[useAdminData] Max retries reached for ${url}. Manual intervention required.`);
      return;
    }

    isFetchingRef.current = true;
    lastParamsRef.current = paramsKey;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<AdminResponse<T>>(url, { params });
      
      hasFetchedRef.current = true;
      
      // Standardize response check
      if (response.data && response.data.success) {
        const result = normalizeData(response.data.data);
        setData(result);
        retryCountRef.current = 0; // Reset on success
        if (response.data.meta) {
          setMeta(response.data.meta);
        }
      } else {
        retryCountRef.current++;
        // Handle malformed success responses (e.g. data is missing)
        const msg = response.data?.error || response.data?.message || 'Failed to fetch data';
        setError(msg);
        if (!autoFetch) toast.error(msg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'An error occurred';
      setError(msg);
      retryCountRef.current++;
      // Only toast on manual fetch or mutations. Background errors handle via UI state.
      if (!autoFetch) toast.error(msg);
    } finally {
      setLoading(false);
      // Wait a tiny bit before releasing the lock to prevent immediate re-triggering from state updates
      setTimeout(() => { isFetchingRef.current = false; }, 100);
    }
  }, [url, autoFetch, normalizeData, setData]);

  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  const mutate = useCallback(async (method: 'post' | 'patch' | 'put' | 'delete', subPath: string = '', payload?: any) => {
    setLoading(true);
    try {
      const fullUrl = subPath ? `${url}${subPath}` : url;
      const response = await api[method]<AdminResponse<any>>(fullUrl, payload);
      
      if (response.data && response.data.success) {
        if (response.data.message) toast.success(response.data.message);
        return { success: true, data: response.data.data };
      } else {
        const msg = response.data?.error || response.data?.message || 'Operation failed';
        toast.error(msg);
        return { success: false, error: msg };
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Operation failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [url]);

  // Memoize the return object to prevent unnecessary re-renders in consumer components
  return useMemo(() => ({ 
    data, 
    loading, 
    error, 
    meta, 
    fetchData, 
    mutate, 
    setData 
  }), [data, loading, error, meta, fetchData, mutate, setData]);
}

