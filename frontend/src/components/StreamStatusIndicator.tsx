import type { StreamStatus } from '../hooks/useTicketStream';

interface StreamStatusIndicatorProps {
  status: StreamStatus;
}

export function StreamStatusIndicator({ status }: StreamStatusIndicatorProps) {
  if (status === 'live') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
        title="Connected to real-time events"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Live</span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
        title="Reconnecting to real-time stream with exponential backoff..."
      >
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200"
      title="Stream disconnected. Polling every 30 seconds."
    >
      <span className="h-2 w-2 rounded-full bg-stone-400" />
      <span>Offline (refreshing every 30s)</span>
    </div>
  );
}
