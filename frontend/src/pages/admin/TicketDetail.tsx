import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { AdminTicketDetail, PatchTicketInput } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { TicketStatusBadge } from '../../components/TicketStatusBadge';
import { MessageThread } from '../../components/MessageThread';
import { Spinner } from '../../components/Spinner';
import { formatDateTime, formatRelativeTime } from '../../lib/format';
import { useTicketStream, type TicketStreamEvent } from '../../hooks/useTicketStream';
import { StreamStatusIndicator } from '../../components/StreamStatusIndicator';
import { TicketControls } from '../../components/admin/TicketControls';
import { AiTriagePanel } from '../../components/admin/AiTriagePanel';
import { AuthorBookPanel } from '../../components/admin/AuthorBookPanel';
import { InternalNotes } from '../../components/admin/InternalNotes';
import { DraftEditor } from '../../components/admin/DraftEditor';

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<AdminTicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);

  const latestReqIdRef = useRef(0);

  const fetchTicket = useCallback(
    async (isBackground = false) => {
      if (!id) return;

      if (!isBackground) {
        setIsLoading(true);
        setError(null);
      }

      const reqId = ++latestReqIdRef.current;

      try {
        const data = await api.admin.tickets.getById(id);
        if (reqId === latestReqIdRef.current) {
          setTicket(data);
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
    [id]
  );

  useEffect(() => {
    fetchTicket(false);
  }, [fetchTicket]);

  // Realtime stream handler: on events matching this ticket or background poll, refetch in place
  const handleStreamEvent = useCallback(
    (event: TicketStreamEvent) => {
      if (event.type === 'poll' || event.ticketId === id) {
        fetchTicket(true);
      }
    },
    [id, fetchTicket]
  );

  const { status: streamStatus } = useTicketStream(handleStreamEvent);

  const handlePatch = async (updates: PatchTicketInput) => {
    if (!id) return;
    const updated = await api.admin.tickets.patch(id, updates);
    setTicket(updated);
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <Spinner size="lg" label="Loading admin ticket details..." />
      </div>
    );
  }

  // 404 or missing ticket error state
  if (error || !ticket) {
    const isNotFound = error?.status === 404;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 text-sm text-stone-500">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="hover:text-stone-900 transition flex items-center gap-1 cursor-pointer font-medium"
          >
            &larr; Back to Queue
          </button>
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
              ? "We couldn't find the requested support ticket. It may have been deleted or the identifier is invalid."
              : error?.message || 'An unexpected error occurred while loading this ticket.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {!isNotFound && (
              <button
                type="button"
                onClick={() => fetchTicket(false)}
                className="inline-flex items-center rounded-lg bg-stone-200 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-300 transition cursor-pointer"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="inline-flex items-center rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-amber-800 transition cursor-pointer"
            >
              Return to Admin Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const shortId = ticket.id.length > 8 ? ticket.id.slice(0, 8) : ticket.id;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top navigation row */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 shadow-2xs hover:bg-stone-50"
        >
          <span>&larr;</span> Back to Queue
        </button>

        <div className="flex items-center gap-3">
          <StreamStatusIndicator status={streamStatus} />
        </div>
      </div>

      {/* Main two-column layout (Left: Thread + Reply | Right: Controls + Context) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Header, Message Thread, Draft Editor (7 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Ticket Header Card */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
                  <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-semibold">
                    #{shortId}
                  </span>
                  <span>&middot;</span>
                  <span className="font-sans text-stone-600 font-medium">
                    Author: {ticket.authorName}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                  {ticket.subject}
                </h1>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 pt-1">
                  <span>
                    Created{' '}
                    <time
                      dateTime={ticket.createdAt}
                      title={formatDateTime(ticket.createdAt)}
                      className="cursor-help font-medium text-stone-700"
                    >
                      {formatRelativeTime(ticket.createdAt)}
                    </time>
                  </span>
                  <span>&middot;</span>
                  <span>
                    Age: <strong className="text-stone-700">{ticket.ageHours}h</strong>
                  </span>
                  {ticket.isOverdue && (
                    <span className="px-1.5 py-0.2 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                      SLA Breached
                    </span>
                  )}
                </div>
              </div>

              <div>
                <TicketStatusBadge status={ticket.status} />
              </div>
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">
              Conversation Thread
            </h2>
            <MessageThread
              originalQuery={{
                body: ticket.description,
                createdAt: ticket.createdAt,
                authorName: ticket.authorName,
              }}
              messages={ticket.messages}
              viewerRole="admin"
              authorName={ticket.authorName}
              adminName={ticket.assignedTo?.name || 'BookLeaf Support'}
            />
          </div>

          {/* Draft & Reply Editor (isolated key per ticket) */}
          <div className="space-y-2 pt-2">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">
              Reply Section
            </h2>
            <DraftEditor
              key={ticket.id}
              ticketId={ticket.id}
              isClosed={ticket.status === 'Closed'}
              latestDraft={ticket.latestDraft}
              onReplySuccess={() => fetchTicket(true)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Ticket Controls, AI Triage, Author/Book facts, Internal notes (5 cols on lg) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Controls: Status, Priority, Category, Assignment */}
          <TicketControls
            ticket={ticket}
            currentUserId={user?.id}
            onPatch={handlePatch}
          />

          {/* AI Triage Banner / Retry */}
          <AiTriagePanel
            ticketId={ticket.id}
            aiStatus={ticket.aiStatus as 'pending' | 'done' | 'failed'}
            onTriageRetried={() => fetchTicket(true)}
          />

          {/* Author Profile & Book Facts */}
          <AuthorBookPanel author={ticket.author} book={ticket.book} />

          {/* Staff-Only Internal Notes */}
          <InternalNotes
            ticketId={ticket.id}
            notes={ticket.internalNotes}
            onNoteAdded={() => fetchTicket(true)}
          />
        </div>
      </div>
    </div>
  );
}
