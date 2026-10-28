import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type {
  AdminTicketItem,
  AdminTicketsQuery,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../api/types';
import { FilterBar, type FilterValues } from '../../components/admin/FilterBar';
import { TicketRow } from '../../components/admin/TicketRow';
import { Pagination } from '../../components/Pagination';
import { Spinner } from '../../components/Spinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { EmptyState } from '../../components/EmptyState';
import { useTicketStream, type TicketStreamEvent } from '../../hooks/useTicketStream';
import { StreamStatusIndicator } from '../../components/StreamStatusIndicator';

const LIMIT = 25;

export function Queue() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const filterValues: FilterValues = useMemo(
    () => ({
      status: (searchParams.get('status') as TicketStatus) || '',
      category: (searchParams.get('category') as TicketCategory) || '',
      priority: (searchParams.get('priority') as TicketPriority) || '',
      assignedTo: (searchParams.get('assignedTo') as 'me' | 'unassigned') || '',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
      q: searchParams.get('q') || '',
      sort: (searchParams.get('sort') as 'urgency' | 'newest' | 'oldest') || 'urgency',
    }),
    [searchParams]
  );

  const offset = Number(searchParams.get('offset')) || 0;

  const [items, setItems] = useState<AdminTicketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const latestReqIdRef = useRef(0);

  const fetchQueue = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setIsLoading(true);
        setError(null);
      }

      const reqId = ++latestReqIdRef.current;

      const queryParams: AdminTicketsQuery = {
        limit: LIMIT,
        offset,
        sort: filterValues.sort || 'urgency',
      };

      if (filterValues.status) queryParams.status = filterValues.status;
      if (filterValues.category) queryParams.category = filterValues.category;
      if (filterValues.priority) queryParams.priority = filterValues.priority;
      if (filterValues.assignedTo) queryParams.assignedTo = filterValues.assignedTo;
      if (filterValues.from) queryParams.from = filterValues.from;
      if (filterValues.to) queryParams.to = filterValues.to;
      if (filterValues.q) queryParams.q = filterValues.q;

      try {
        const res = await api.admin.tickets.list(queryParams);
        if (reqId === latestReqIdRef.current) {
          setItems(res.items);
          setTotal(res.total);
        }
      } catch (err) {
        if (reqId === latestReqIdRef.current && !isBackground) {
          if (err instanceof ApiError) {
            setError(err.message || 'Failed to load ticket queue');
          } else {
            setError((err as Error).message || 'Unable to connect to BookLeaf server');
          }
        }
      } finally {
        if (reqId === latestReqIdRef.current && !isBackground) {
          setIsLoading(false);
        }
      }
    },
    [filterValues, offset]
  );

  useEffect(() => {
    fetchQueue(false);
  }, [fetchQueue]);

  // Live real-time updates: any ticket event refetches the current filtered view in place
  const handleStreamEvent = useCallback(
    (_event: TicketStreamEvent) => {
      fetchQueue(true);
    },
    [fetchQueue]
  );

  const { status: streamStatus } = useTicketStream(handleStreamEvent);

  // Update URL search parameters when filters change and reset offset to 0
  const handleFilterChange = useCallback(
    (newValues: FilterValues) => {
      const nextParams = new URLSearchParams();
      if (newValues.status) nextParams.set('status', newValues.status);
      if (newValues.category) nextParams.set('category', newValues.category);
      if (newValues.priority) nextParams.set('priority', newValues.priority);
      if (newValues.assignedTo) nextParams.set('assignedTo', newValues.assignedTo);
      if (newValues.from) nextParams.set('from', newValues.from);
      if (newValues.to) nextParams.set('to', newValues.to);
      if (newValues.q) nextParams.set('q', newValues.q);
      if (newValues.sort && newValues.sort !== 'urgency') nextParams.set('sort', newValues.sort);

      // Reset pagination on filter change
      nextParams.set('offset', '0');
      setSearchParams(nextParams);
    },
    [setSearchParams]
  );

  const handleResetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (newOffset: number) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('offset', String(newOffset));
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  const hasActiveFilters = Boolean(
    filterValues.status ||
      filterValues.category ||
      filterValues.priority ||
      filterValues.assignedTo ||
      filterValues.from ||
      filterValues.to ||
      filterValues.q ||
      (filterValues.sort && filterValues.sort !== 'urgency')
  );

  // Stats computed from current page items
  const openCount = items.filter((i) => i.status === 'Open').length;
  const overdueCount = items.filter((i) => i.isOverdue).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Support Ticket Queue
            </h1>
            <StreamStatusIndicator status={streamStatus} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Triage, prioritize, and manage author support inquiries across BookLeaf.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchQueue(false)}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 disabled:opacity-50 transition cursor-pointer"
            title="Refresh queue"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        isLoading={isLoading}
      />

      {/* Summary Strip */}
      <div className="flex items-center justify-between text-xs text-stone-600 px-1">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-stone-900">
            {total} {total === 1 ? 'ticket' : 'tickets'} total
          </span>
          {openCount > 0 && (
            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
              {openCount} Open on page
            </span>
          )}
          {overdueCount > 0 && (
            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-semibold">
              ⚠️ {overdueCount} Overdue on page
            </span>
          )}
        </div>
        <div className="text-stone-400 font-mono text-[11px]">
          Sorted by: {filterValues.sort === 'urgency' ? 'Urgency' : filterValues.sort}
        </div>
      </div>

      {/* Loading state (initial load only) */}
      {isLoading && (
        <div className="py-24 flex justify-center items-center">
          <Spinner size="lg" label="Loading support ticket queue..." />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorBanner
          title="Could not load ticket queue"
          message={error}
          onRetry={() => fetchQueue(false)}
        />
      )}

      {/* Empty states */}
      {!isLoading && !error && items.length === 0 && (
        <EmptyState
          title={hasActiveFilters ? 'No tickets match these filters' : 'No tickets in queue yet'}
          description={
            hasActiveFilters
              ? 'Try widening your search terms or clearing specific status, priority, or date filters.'
              : 'There are currently no tickets submitted by authors.'
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 transition cursor-pointer"
              >
                Reset All Filters
              </button>
            ) : undefined
          }
        />
      )}

      {/* Data Table */}
      {!isLoading && !error && items.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <th scope="col" className="px-3.5 py-3">Priority</th>
                  <th scope="col" className="px-3.5 py-3">Subject</th>
                  <th scope="col" className="px-3.5 py-3">Author</th>
                  <th scope="col" className="px-3.5 py-3">Book</th>
                  <th scope="col" className="px-3.5 py-3">Category</th>
                  <th scope="col" className="px-3.5 py-3">Status</th>
                  <th scope="col" className="px-3.5 py-3">Assignee</th>
                  <th scope="col" className="px-3.5 py-3 text-right">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            total={total}
            limit={LIMIT}
            offset={offset}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
