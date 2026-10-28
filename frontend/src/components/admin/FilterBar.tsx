import { useState, useEffect, type ChangeEvent } from 'react';
import {
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../../api/types';

export interface FilterValues {
  status?: TicketStatus | '';
  category?: TicketCategory | '';
  priority?: TicketPriority | '';
  assignedTo?: 'me' | 'unassigned' | '';
  from?: string;
  to?: string;
  q?: string;
  sort?: 'urgency' | 'newest' | 'oldest';
}

interface FilterBarProps {
  values: FilterValues;
  onChange: (newValues: FilterValues) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function FilterBar({ values, onChange, onReset, isLoading }: FilterBarProps) {
  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState(values.q || '');

  // Keep search input in sync if URL changes
  useEffect(() => {
    setSearchInput(values.q || '');
  }, [values.q]);

  // Debounce search by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((values.q || '') !== searchInput.trim()) {
        onChange({ ...values, q: searchInput.trim() });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onChange, values]);

  const handleSelectChange = (key: keyof FilterValues) => (e: ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...values, [key]: e.target.value });
  };

  const handleDateChange = (key: 'from' | 'to') => (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...values, [key]: e.target.value });
  };

  const hasActiveFilters = Boolean(
    values.status ||
      values.category ||
      values.priority ||
      values.assignedTo ||
      values.from ||
      values.to ||
      values.q ||
      (values.sort && values.sort !== 'urgency')
  );

  return (
    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
      {/* Search and primary filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search subject..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={isLoading}
            className="block w-full rounded-lg border border-stone-300 pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
          />
          <span className="absolute left-2.5 top-2 text-xs text-stone-400">🔍</span>
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                onChange({ ...values, q: '' });
              }}
              className="absolute right-2.5 top-1.5 text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status */}
        <div>
          <select
            value={values.status || ''}
            onChange={handleSelectChange('status')}
            disabled={isLoading}
            className="block w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
          >
            <option value="">Status: All</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <select
            value={values.priority || ''}
            onChange={handleSelectChange('priority')}
            disabled={isLoading}
            className="block w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
          >
            <option value="">Priority: All</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <select
            value={values.category || ''}
            onChange={handleSelectChange('category')}
            disabled={isLoading}
            className="block w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
          >
            <option value="">Category: All</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Secondary filters (Assignment, Sort, Dates, Reset) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Assignment */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-medium">Assigned:</span>
            <select
              value={values.assignedTo || ''}
              onChange={handleSelectChange('assignedTo')}
              disabled={isLoading}
              className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 focus:border-amber-600 focus:outline-none"
            >
              <option value="">All Assignees</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-medium">Sort:</span>
            <select
              value={values.sort || 'urgency'}
              onChange={handleSelectChange('sort')}
              disabled={isLoading}
              className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 focus:border-amber-600 focus:outline-none font-medium"
            >
              <option value="urgency">Urgency (Default)</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-stone-500">
            <span>Date:</span>
            <input
              type="date"
              value={values.from || ''}
              onChange={handleDateChange('from')}
              disabled={isLoading}
              className="rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-800 focus:border-amber-600 focus:outline-none"
              title="From date"
            />
            <span>to</span>
            <input
              type="date"
              value={values.to || ''}
              onChange={handleDateChange('to')}
              disabled={isLoading}
              className="rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-800 focus:border-amber-600 focus:outline-none"
              title="To date"
            />
          </div>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="text-stone-500 hover:text-stone-800 underline font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
