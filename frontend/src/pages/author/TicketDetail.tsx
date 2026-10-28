import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useLocation, NavLink } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { AuthorTicket } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { TicketStatusBadge } from '../../components/TicketStatusBadge';
import { MessageThread } from '../../components/MessageThread';
import { Spinner } from '../../components/Spinner';
import { formatDateTime, formatRelativeTime } from '../../lib/format';
import { useTicketStream, type TicketStreamEvent } from '../../hooks/useTicketStream';
import { StreamStatusIndicator } from '../../components/StreamStatusIndicator';

const STORAGE_LAST_VIEWED_KEY = 'bookleaf_tickets_last_viewed';

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<AuthorTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);

  // Success notice passed from query submission form
  const [successNotice, setSuccessNotice] = useState<string | null>(() => {
    return (location.state as { successMessage?: string } | null)?.successMessage || null;
  });

  const latestReqIdRef = useRef(0);

  // Clear success notice from browser history so reload does not reshow it
  useEffect(() => {
    if (successNotice) {
      window.history.replaceState({}, document.title);
    }
  }, [successNotice]);

  const markTicketRead = useCallback((ticketId: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_LAST_VIEWED_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[ticketId] = new Date().toISOString();
      localStorage.setItem(STORAGE_LAST_VIEWED_KEY, JSON.stringify(map));
    } catch {
      // ignore storage limitations
    }
  }, []);

  const fetchTicket = useCallback(
    async (isBackground = false) => {
      if (!id) return;

      if (!isBackground) {
        setIsLoading(true);
        setError(null);
      }

      const reqId = ++latestReqIdRef.current;

      try {
        const data = await api.tickets.getById(id);
        if (reqId === latestReqIdRef.current) {
          setTicket(data);
          markTicketRead(id);
        }
      } catch (err) {
        if (reqId === latestReqIdRef.current && !isBackground) {
          if (err instanceof ApiError) {
            setError({
              status: err.status,
              message: err.message || 'Ticket not found',
            });
          } else {
            setError({
              status: 500,
              message: (err as Error).message || 'Unable to load ticket details',
            });
          }
        }
      } finally {
        if (reqId === latestReqIdRef.current && !isBackground) {
          setIsLoading(false);
        }
      }
    },
    [id, markTicketRead]
  );

  useEffect(() => {
    fetchTicket(false);
  }, [fetchTicket]);

  // Realtime stream handler: only refetch if the event relates to this ticket or is a background poll
  const handleStreamEvent = useCallback(
    (event: TicketStreamEvent) => {
      if (event.type === 'poll' || event.ticketId === id) {
        fetchTicket(true);
      }
    },
    [id, fetchTicket]
  );

  const { status: streamStatus } = useTicketStream(handleStreamEvent);

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <Spinner size="lg" label="Loading ticket conversation..." />
      </div>
    );
  }

  // 404 or missing ticket error state
  if (error || !ticket) {
    const isNotFound = error?.status === 404;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 text-sm text-stone-500">
          <NavLink to="/tickets" className="hover:text-stone-900 transition flex items-center gap-1">
            &larr; Back to all tickets
          </NavLink>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-2xs space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-600 text-2xl">
            🔍
          </div>
          <h2 className="text-xl font-bold text-stone-900">
            {isNotFound ? 'Ticket not found' : 'Unable to load ticket'}
          </h2>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            {isNotFound
              ? "We couldn't find the requested support ticket. It may have been removed or you may not have permission to view it."
              : error?.message || 'An unexpected error occurred while loading this ticket.'}
          </p>
          <div className="pt-2">
            <NavLink
              to="/tickets"
              className="inline-flex items-center rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-amber-800 transition"
            >
              Return to My Tickets
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success banner from submission */}
      {successNotice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 text-sm shadow-2xs flex items-start gap-3 transition"
        >
          <span className="text-emerald-600 text-lg leading-none mt-0.5">✓</span>
          <div className="flex-1">
            <h4 className="font-semibold text-emerald-900">Query Submitted Successfully</h4>
            <p className="text-emerald-800 mt-0.5">{successNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <NavLink to="/tickets" className="hover:text-stone-900 font-medium transition">
              &larr; My Tickets
            </NavLink>
            <span>&middot;</span>
            <span className="font-mono text-stone-400">ID: {ticket.id}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            {ticket.subject}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 pt-1">
            <span className="font-medium text-stone-700">
              {ticket.bookTitle ? (
                <>📖 {ticket.bookTitle}</>
              ) : (
                <span className="text-stone-500">General / Account Level</span>
              )}
            </span>
            <span>&middot;</span>
            <time
              dateTime={ticket.createdAt}
              title={`Submitted on ${formatDateTime(ticket.createdAt)}`}
              className="cursor-help"
            >
              Submitted {formatRelativeTime(ticket.createdAt)}
            </time>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <TicketStatusBadge status={ticket.status} />
          <StreamStatusIndicator status={streamStatus} />
        </div>
      </div>

      {/* Message Thread */}
      <MessageThread
        originalQuery={{
          body: ticket.description,
          createdAt: ticket.createdAt,
          authorName: user?.name,
        }}
        messages={ticket.messages}
      />
    </div>
  );
}
