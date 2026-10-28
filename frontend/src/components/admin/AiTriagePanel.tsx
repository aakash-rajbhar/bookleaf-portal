import { useState } from 'react';
import { api } from '../../api/client';
import { Spinner } from '../Spinner';

interface AiTriagePanelProps {
  ticketId: string;
  aiStatus: 'pending' | 'done' | 'failed';
  onTriageRetried?: () => void;
}

export function AiTriagePanel({ ticketId, aiStatus, onTriageRetried }: AiTriagePanelProps) {
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    try {
      await api.admin.tickets.retryTriage(ticketId);
      // Wait a moment before refetching so backend has a moment to start / process
      setTimeout(() => {
        onTriageRetried?.();
      }, 500);
    } catch (err) {
      setError((err as Error).message || 'Failed to retry AI triage');
    } finally {
      setRetrying(false);
    }
  };

  if (aiStatus === 'pending') {
    return (
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-xs text-sky-900 font-medium">
          <Spinner size="sm" />
          <span>AI is classifying...</span>
        </div>
        <span className="text-[11px] text-sky-700 font-mono">Status: Pending</span>
      </div>
    );
  }

  if (aiStatus === 'failed') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
            <span className="text-amber-600 font-bold">⚠️</span>
            <span>AI triage unavailable, rule-based fallback used</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {retrying && <Spinner size="sm" />}
            {retrying ? 'Retrying...' : 'Retry AI triage'}
          </button>
        </div>
        {error && <p className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
      </div>
    );
  }

  return null;
}
