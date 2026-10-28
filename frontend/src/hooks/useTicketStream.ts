import { useEffect, useRef, useState } from 'react';
import { api, API_BASE_URL, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export type StreamStatus = 'live' | 'reconnecting' | 'offline';

export interface TicketStreamEvent {
  type: string;
  ticketId: string;
}

export function useTicketStream(
  onEvent: (e: TicketStreamEvent) => void
): { status: StreamStatus } {
  const { user } = useAuth();
  const [status, setStatus] = useState<StreamStatus>('reconnecting');

  // Keep latest onEvent callback in a ref to avoid recreating the stream on re-renders
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    // If no user is authenticated, do not open stream
    if (!user) {
      setStatus('offline');
      return;
    }

    let isCancelled = false;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let retryDelay = 1000;
    let consecutiveFailures = 0;

    // Start 30s fallback polling while stream is not 'live'
    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        if (!isCancelled) {
          onEventRef.current({ type: 'poll', ticketId: '' });
        }
      }, 30000);
    };

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const cleanupCurrentConnection = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const scheduleReconnect = () => {
      cleanupCurrentConnection();
      if (isCancelled) return;

      consecutiveFailures += 1;
      // After multiple failed attempts or high backoff, indicate offline mode
      if (consecutiveFailures >= 3 || retryDelay >= 16000) {
        setStatus('offline');
      } else {
        setStatus('reconnecting');
      }

      startPolling();

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s... up to 30s + small jitter
      const jitter = Math.random() * 500;
      const delay = Math.min(30000, retryDelay) + jitter;
      retryDelay = Math.min(30000, retryDelay * 2);

      reconnectTimer = setTimeout(() => {
        if (!isCancelled) {
          connect();
        }
      }, delay);
    };

    async function connect() {
      if (isCancelled) return;

      cleanupCurrentConnection();

      try {
        // Step 1: Request short-lived single-use stream token (60s validity)
        const tokenRes = await api.events.createToken();
        if (isCancelled) return;

        const streamToken = tokenRes.streamToken;
        const streamUrl = `${API_BASE_URL}/events?token=${encodeURIComponent(streamToken)}`;

        // Step 2: Open single EventSource instance
        const es = new EventSource(streamUrl);
        eventSource = es;

        // Step 3: Handle stream open & ready events
        const handleReady = () => {
          if (isCancelled || eventSource !== es) return;
          setStatus('live');
          stopPolling();
          retryDelay = 1000;
          consecutiveFailures = 0;
        };

        es.addEventListener('ready', handleReady);
        es.onopen = handleReady;

        // Message handler for specific ticket events
        const handleTicketEvent = (ev: MessageEvent) => {
          if (isCancelled) return;
          try {
            const data = JSON.parse(ev.data);
            onEventRef.current({
              type: ev.type,
              ticketId: data.ticketId || '',
            });
          } catch {
            // Unparseable frame
          }
        };

        es.addEventListener('ticket.reply', handleTicketEvent);
        es.addEventListener('ticket.updated', handleTicketEvent);
        es.addEventListener('ticket.created', handleTicketEvent);

        // Step 4: Handle disconnect / error
        // Note: EventSource auto-reconnect would reuse the expired token, so close immediately
        es.onerror = () => {
          if (isCancelled || eventSource !== es) return;
          scheduleReconnect();
        };
      } catch (err) {
        if (isCancelled) return;

        // 401 unauthenticated means auth session expired; stop stream
        if (err instanceof ApiError && err.status === 401) {
          setStatus('offline');
          cleanupCurrentConnection();
          stopPolling();
          return;
        }

        scheduleReconnect();
      }
    }

    // Connect immediately
    connect();

    // Step 7: Handle document visibility changes (refetch on tab refocus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isCancelled) {
        onEventRef.current({ type: 'poll', ticketId: '' });
        // If connection is dropped or offline, attempt reconnection
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Step 6: Full cleanup on unmount (guarantees exactly 1 stream during StrictMode)
    return () => {
      isCancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanupCurrentConnection();
      stopPolling();
    };
  }, [user]);

  return { status };
}
