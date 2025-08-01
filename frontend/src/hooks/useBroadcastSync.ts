import { useEffect, useCallback, useRef } from 'react';

interface BroadcastMessage {
  type: string;
  data: any;
  timestamp: number;
  source: string;
}

interface BroadcastSyncOptions {
  channel: string;
  onMessage?: (message: BroadcastMessage) => void;
  enabled?: boolean;
}

export function useBroadcastSync({
  channel,
  onMessage,
  enabled = true
}: BroadcastSyncOptions) {
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const sourceIdRef = useRef(Math.random().toString(36).substr(2, 9));

  // Initialize broadcast channel
  useEffect(() => {
    if (!enabled || typeof BroadcastChannel === 'undefined') {
      return;
    }

    try {
      broadcastChannelRef.current = new BroadcastChannel(channel);
      
      const handleMessage = (event: MessageEvent<BroadcastMessage>) => {
        // Ignore messages from the same tab
        if (event.data.source === sourceIdRef.current) {
          return;
        }
        
        onMessage?.(event.data);
      };

      broadcastChannelRef.current.addEventListener('message', handleMessage);

      return () => {
        broadcastChannelRef.current?.close();
        broadcastChannelRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize BroadcastChannel:', error);
    }
  }, [channel, enabled, onMessage]);

  // Send message to other tabs
  const broadcast = useCallback((type: string, data: any) => {
    if (!broadcastChannelRef.current || !enabled) {
      return;
    }

    const message: BroadcastMessage = {
      type,
      data,
      timestamp: Date.now(),
      source: sourceIdRef.current
    };

    try {
      broadcastChannelRef.current.postMessage(message);
    } catch (error) {
      console.error('Failed to broadcast message:', error);
    }
  }, [enabled]);

  return {
    broadcast,
    isSupported: typeof BroadcastChannel !== 'undefined'
  };
}

// Specific hooks for different data types
export function useTeacherBroadcast() {
  return useBroadcastSync({
    channel: 'teachers-sync',
    onMessage: (message) => {
      switch (message.type) {
        case 'teacher-added':
        case 'teacher-updated':
        case 'teacher-deleted':
          // Trigger a page refresh or state update
          window.dispatchEvent(new CustomEvent('teachers-changed', { detail: message }));
          break;
      }
    }
  });
}

export function useAttendanceBroadcast() {
  return useBroadcastSync({
    channel: 'attendance-sync',
    onMessage: (message) => {
      switch (message.type) {
        case 'attendance-updated':
          // Trigger attendance refresh
          window.dispatchEvent(new CustomEvent('attendance-changed', { detail: message }));
          break;
      }
    }
  });
}