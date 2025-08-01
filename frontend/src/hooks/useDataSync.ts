import { useState, useEffect, useCallback, useRef } from 'react';

interface SyncOptions {
  url: string;
  interval?: number; // in milliseconds, default 10 seconds
  enabled?: boolean;
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface SyncState {
  data: any;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  isOnline: boolean;
}

export function useDataSync({
  url,
  interval = 10000,
  enabled = true,
  onData,
  onError
}: SyncOptions) {
  const [state, setState] = useState<SyncState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    isOnline: true
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTabActiveRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Get auth token
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  // Fetch data function
  const fetchData = useCallback(async (showLoading = true) => {
    if (!enabled || !url) return;

    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const token = getAuthToken();
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isOnline: true
      }));

      retryCountRef.current = 0; // Reset retry count on success
      onData?.(data);

    } catch (error) {
      const err = error as Error;
      console.error('Data sync error:', err);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
        isOnline: false
      }));

      retryCountRef.current++;
      onError?.(err);

      // Exponential backoff for retries
      if (retryCountRef.current <= maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        setTimeout(() => fetchData(false), retryDelay);
      }
    }
  }, [url, enabled, getAuthToken, onData, onError]);

  // Manual refresh function
  const refresh = useCallback(() => {
    retryCountRef.current = 0;
    fetchData(true);
  }, [fetchData]);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabActiveRef.current = !document.hidden;
      
      if (isTabActiveRef.current) {
        // Tab became active, refresh data immediately
        fetchData(false);
        startPolling();
      } else {
        // Tab became inactive, stop polling
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchData]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      if (isTabActiveRef.current) {
        fetchData(false);
        startPolling();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      stopPolling();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (enabled && isTabActiveRef.current && navigator.onLine) {
      intervalRef.current = setInterval(() => {
        fetchData(false);
      }, interval);
    }
  }, [enabled, interval, fetchData]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Initialize and cleanup
  useEffect(() => {
    if (enabled) {
      fetchData(true); // Initial fetch
      startPolling(); // Start polling
    }

    return () => {
      stopPolling();
    };
  }, [enabled, fetchData, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...state,
    refresh,
    startPolling,
    stopPolling
  };
}

// Hook for syncing multiple endpoints
export function useMultiDataSync(configs: SyncOptions[]) {
  const results = configs.map(config => useDataSync(config));
  
  const combinedState = {
    loading: results.some(r => r.loading),
    error: results.find(r => r.error)?.error || null,
    isOnline: results.every(r => r.isOnline),
    lastUpdated: results.reduce((latest, r) => {
      if (!r.lastUpdated) return latest;
      if (!latest) return r.lastUpdated;
      return r.lastUpdated > latest ? r.lastUpdated : latest;
    }, null as Date | null)
  };

  const refreshAll = useCallback(() => {
    results.forEach(r => r.refresh());
  }, [results]);

  return {
    results,
    combinedState,
    refreshAll
  };
}