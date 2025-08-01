import { useState, useEffect, useCallback, useRef } from 'react';
import { requestManager } from '@/utils/requestManager';

interface SyncOptions {
  url: string;
  interval?: number; // in milliseconds, default 30 seconds
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
  interval = 30000, // Not used for automatic polling anymore
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
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  }, []);

  // Fetch data function
  const fetchData = useCallback(async (showLoading = true) => {
    if (!enabled || !url) return;

    // Don't fetch if no auth token is available
    const token = getAuthToken();
    if (!token) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: new Error('Not authenticated'),
        isOnline: true 
      }));
      return;
    }

    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const response = await requestManager.makeRequest(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
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

      // Exponential backoff for retries, but stop polling on resource errors
      if (retryCountRef.current <= maxRetries && !err.message.includes('INSUFFICIENT_RESOURCES')) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 60000);
        setTimeout(() => fetchData(false), retryDelay);
      } else if (err.message.includes('INSUFFICIENT_RESOURCES')) {
        // Stop polling for 5 minutes on resource exhaustion
        console.warn('Resource exhaustion detected, pausing sync for 5 minutes');
        setTimeout(() => {
          retryCountRef.current = 0;
          fetchData(false);
        }, 300000); // 5 minutes
      }
    }
  }, [url, enabled, getAuthToken, onData, onError]);

  // Manual refresh function
  const refresh = useCallback(() => {
    retryCountRef.current = 0;
    fetchData(true);
  }, [fetchData]);

  // Handle tab visibility changes - DISABLED FOR MANUAL SYNC
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabActiveRef.current = !document.hidden;
      // No automatic syncing on tab changes - manual only
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Handle online/offline status - NO AUTO-SYNC
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // No automatic syncing when coming online - manual only
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      stopPolling(); // Stop any existing polling
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [stopPolling]);

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

  // Initialize and cleanup - MANUAL SYNC ONLY, NO AUTO-POLLING
  useEffect(() => {
    if (enabled) {
      fetchData(true); // Initial fetch only
      // NO automatic polling - manual refresh only
    }

    return () => {
      stopPolling(); // Clean up any existing polling
    };
  }, [enabled, fetchData, stopPolling]);

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