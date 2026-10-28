import { useState, type ChangeEvent } from 'react';
import {
  type AdminTicketDetail,
  type PatchTicketInput,
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from '../../api/types';
import { AiSourceBadge } from './AiSourceBadge';
import { Spinner } from '../Spinner';

interface TicketControlsProps {
  ticket: AdminTicketDetail;
  currentUserId?: string;
  onPatch: (updates: PatchTicketInput) => Promise<void>;
}

export function TicketControls({ ticket, currentUserId, onPatch }: TicketControlsProps) {
  const [savingField, setSavingField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFieldChange = async (updates: PatchTicketInput, fieldName: string) => {
    setSavingField(fieldName);
    setErrorMessage(null);
    try {
      await onPatch(updates);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to update ticket');
    } finally {
      setSavingField(null);
    }
  };

  const isAssignedToMe = Boolean(currentUserId && ticket.assignedTo?.id === currentUserId);
  const isClosed = ticket.status === 'Closed';

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
          <span>⚙️</span> Ticket Controls
        </h3>
        {savingField && (
          <span className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <Spinner size="sm" />
            Saving...
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Closed banner */}
      {isClosed && (
        <div className="rounded-lg bg-stone-100 border border-stone-200 p-2.5 text-xs text-stone-700 font-medium">
          🔒 This ticket is closed. Reopen by changing status to Open or In Progress.
        </div>
      )}

      {/* Status control */}
      <div>
        <label htmlFor="status-select" className="block text-xs font-semibold text-stone-700 mb-1">
          Status
        </label>
        <select
          id="status-select"
          value={ticket.status}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            handleFieldChange({ status: e.target.value as TicketStatus }, 'status')
          }
          disabled={savingField !== null}
          className="block w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-50"
        >
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Priority control with source badge */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="priority-select" className="block text-xs font-semibold text-stone-700">
            Priority
          </label>
          <AiSourceBadge aiStatus={ticket.aiStatus} source={ticket.prioritySource} />
        </div>
        <select
          id="priority-select"
          value={ticket.priority || ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            handleFieldChange({ priority: e.target.value as TicketPriority }, 'priority')
          }
          disabled={savingField !== null}
          className="block w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-50"
        >
          <option value="" disabled>
            Select Priority
          </option>
          {TICKET_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Category control with source badge */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="category-select" className="block text-xs font-semibold text-stone-700">
            Category
          </label>
          <AiSourceBadge aiStatus={ticket.aiStatus} source={ticket.categorySource} />
        </div>
        <select
          id="category-select"
          value={ticket.category || ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            handleFieldChange({ category: e.target.value as TicketCategory }, 'category')
          }
          disabled={savingField !== null}
          className="block w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-50"
        >
          <option value="" disabled>
            Select Category
          </option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* AI reason explanation */}
        {ticket.aiReason && (
          <p className="mt-1 text-[11px] text-stone-500 italic bg-stone-50 p-1.5 rounded border border-stone-100">
            &ldquo;{ticket.aiReason}&rdquo;
          </p>
        )}
      </div>

      {/* Assignment control */}
      <div className="pt-2 border-t border-stone-100">
        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
          Assignment
        </label>
        <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-lg border border-stone-200">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center">
              {ticket.assignedTo?.name ? ticket.assignedTo.name.charAt(0) : '?'}
            </span>
            <div className="text-xs">
              <span className="font-semibold text-stone-900 block leading-tight">
                {ticket.assignedTo?.name ? (
                  isAssignedToMe ? (
                    'Assigned to You'
                  ) : (
                    ticket.assignedTo.name
                  )
                ) : (
                  <span className="text-stone-400 italic">Unassigned</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!isAssignedToMe && (
              <button
                type="button"
                onClick={() => handleFieldChange({ assignedTo: 'me' }, 'assignment')}
                disabled={savingField !== null}
                className="px-2 py-1 text-xs font-medium rounded bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 transition cursor-pointer disabled:opacity-50"
              >
                Assign to me
              </button>
            )}

            {ticket.assignedTo && (
              <button
                type="button"
                onClick={() => handleFieldChange({ assignedTo: null }, 'assignment')}
                disabled={savingField !== null}
                className="px-2 py-1 text-xs font-medium rounded bg-white border border-stone-300 hover:bg-red-50 hover:text-red-700 text-stone-600 transition cursor-pointer disabled:opacity-50"
              >
                Unassign
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
