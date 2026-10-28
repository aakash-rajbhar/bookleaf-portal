import { useEffect, useState, useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { AuthorTicket } from '../../api/types';
import { TicketStatusBadge } from '../../components/TicketStatusBadge';
import { Spinner } from '../../components/Spinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { EmptyState } from '../../components/EmptyState';
import { formatRelativeTime, formatDateTime } from '../../lib/format';
import { useTicketStream, type TicketStreamEvent } from '../../hooks/useTicketStream';
import { StreamStatusIndicator } from '../../components/StreamStatusIndicator';

const STORAGE_LAST_VIEWED_KEY = 'bookleaf_tickets_last_viewed';

function getLastViewedMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_LAST_VIEWED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function checkIsUnread(ticket: AuthorTicket, map: Record<string, string>): boolean {
  try {
    const lastViewedISO = map[ticket.id];
    if (!lastViewedISO) {
      // If never viewed: check if there's an admin reply or activity after creation
      const hasSupportReply = ticket.messages?.some((m) => m.senderRole === 'admin');
      const hasActivity = new Date(ticket.updatedAt).getTime() > new Date(ticket.createdAt).getTime();
      return Boolean(hasSupportReply || hasActivity);
    }
    return new Date(ticket.updatedAt).getTime() > new Date(lastViewedISO).getTime();
  } catch {
    return false;
  }
}

export function Tickets() {
  const [tickets, setTickets] = useState<AuthorTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastViewedMap, setLastViewedMap] = useState<Record<string, string>>({});

  const latestReqIdRef = useRef(0);

  // Sync last viewed map on mount and tab focus
  const reloadLastViewed = useCallback(() => {
    setLastViewedMap(getLastViewedMap());
  }, []);

  const fetchTickets = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setIsLoading(true);
      setError(null);
    }

    const reqId = ++latestReqIdRef.current;

    try {
      const data = await api.tickets.list(100, 0);
      // Ignore out-of-order responses
      if (reqId === latestReqIdRef.current) {
        setTickets(data);
        reloadLastViewed();
      }
    } catch (err) {
      if (reqId === latestReqIdRef.current && !isBackground) {
        if (err instanceof ApiError) {
          setError(err.message || 'Failed to load tickets');
        } else {
          setError((err as Error).message || 'Unable to connect to BookLeaf server');
        }
      }
    } finally {
      if (reqId === latestReqIdRef.current && !isBackground) {
        setIsLoading(false);
      }
    }
  }, [reloadLastViewed]);

  useEffect(() => {
    fetchTickets(false);
  }, [fetchTickets]);

  // Handle realtime events without flashing loading spinner
  const handleStreamEvent = useCallback(
    (_event: TicketStreamEvent) => {
      // Any ticket event (created, updated, reply, poll) triggers in-place refresh
      fetchTickets(true);
    },
    [fetchTickets]
  );

  const { status: streamStatus } = useTicketStream(handleStreamEvent);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              My Support Tickets
            </h1>
            <StreamStatusIndicator status={streamStatus} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Real-time feed of all your queries and communications with BookLeaf Support.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchTickets(false)}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 disabled:opacity-50 transition cursor-pointer"
            title="Refresh tickets"
          >
            ↻ Refresh
          </button>
          <NavLink
            to="/tickets/new"
            className="inline-flex items-center justify-center rounded-lg bg-amber-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-amber-800 transition"
          >
            Submit New Query
          </NavLink>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex justify-center items-center">
          <Spinner size="lg" label="Loading support tickets..." />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorBanner
          title="Could not load tickets"
          message={error}
          onRetry={() => fetchTickets(false)}
        />
      )}

      {/* Empty state */}
      {!isLoading && !error && tickets.length === 0 && (
        <EmptyState
          title="No support tickets yet"
          description="You haven't submitted any queries yet. Whenever you have questions about royalties, book distribution, or cover design, reach out to us here."
          action={
            <NavLink
              to="/tickets/new"
              className="inline-flex items-center rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-amber-800 transition"
            >
              Submit Query
            </NavLink>
          }
        />
      )}

      {/* Tickets List */}
      {!isLoading && !error && tickets.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden divide-y divide-stone-100">
          {tickets.map((ticket) => {
            const isUnread = checkIsUnread(ticket, lastViewedMap);

            return (
              <NavLink
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="block p-4 sm:p-5 hover:bg-stone-50/80 transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <span
                          className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 shrink-0"
                          title="Unread activity"
                          aria-label="Unread activity"
                        />
                      )}
                      <h3 className="text-base font-semibold text-stone-900 group-hover:text-amber-800 transition truncate">
                        {ticket.subject}
                      </h3>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                      <span className="font-medium text-stone-700">
                        {ticket.bookTitle ? (
                          <>📖 {ticket.bookTitle}</>
                        ) : (
                          <span className="text-stone-500">General / Account Level</span>
                        )}
                      </span>
                      <span>&middot;</span>
                      <span className="font-mono text-stone-400">ID: {ticket.id.slice(0, 8)}...</span>
                      <span>&middot;</span>
                      <time
                        dateTime={ticket.createdAt}
                        title={`Created: ${formatDateTime(ticket.createdAt)}`}
                        className="cursor-help"
                      >
                        Opened {formatRelativeTime(ticket.createdAt)}
                      </time>
                      <span>&middot;</span>
                      <time
                        dateTime={ticket.updatedAt}
                        title={`Last Activity: ${formatDateTime(ticket.updatedAt)}`}
                        className="cursor-help text-stone-400"
                      >
                        Updated {formatRelativeTime(ticket.updatedAt)}
                      </time>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <TicketStatusBadge status={ticket.status} />
                    <span className="text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition hidden sm:inline-block">
                      &rarr;
                    </span>
                  </div>
                </div>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
