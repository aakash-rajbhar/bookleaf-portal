import { useNavigate } from 'react-router-dom';
import type { AdminTicketItem } from '../../api/types';
import { PriorityBadge } from './PriorityBadge';
import { CategoryBadge } from './CategoryBadge';
import { AiSourceBadge } from './AiSourceBadge';
import { TicketStatusBadge } from '../TicketStatusBadge';
import { formatDateTime } from '../../lib/format';

interface TicketRowProps {
  ticket: AdminTicketItem;
}

function formatAge(ageHours: number): string {
  if (ageHours === null || ageHours === undefined || isNaN(ageHours)) return '—';
  const totalHours = Math.round(ageHours);
  if (totalHours < 1) {
    return '<1h';
  }
  if (totalHours < 24) {
    return `${totalHours}h`;
  }
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function TicketRow({ ticket }: TicketRowProps) {
  const navigate = useNavigate();

  const isResolvedOrClosed = ticket.status === 'Resolved' || ticket.status === 'Closed';
  const isOverdue = ticket.isOverdue;

  return (
    <tr
      onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
      className={`cursor-pointer transition hover:bg-amber-50/50 ${
        isOverdue
          ? 'border-l-4 border-l-red-500 bg-red-50/20'
          : 'border-l-4 border-l-transparent'
      } ${isResolvedOrClosed ? 'opacity-65 bg-stone-50/40' : 'bg-white'}`}
    >
      {/* Priority & Overdue indicator */}
      <td className="px-3.5 py-3 text-xs whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={ticket.priority} aiStatus={ticket.aiStatus} />
          {isOverdue && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-2xs"
              title="SLA limit exceeded"
            >
              Overdue
            </span>
          )}
        </div>
      </td>

      {/* Subject */}
      <td className="px-3.5 py-3 text-xs max-w-[280px]">
        <div className="font-semibold text-stone-900 truncate" title={ticket.subject}>
          {ticket.subject}
        </div>
        <div className="text-[11px] text-stone-400 font-mono mt-0.5">
          {ticket.id.slice(0, 8)}
        </div>
      </td>

      {/* Author */}
      <td className="px-3.5 py-3 text-xs whitespace-nowrap">
        <div className="font-medium text-stone-800">{ticket.authorName}</div>
      </td>

      {/* Book or General */}
      <td className="px-3.5 py-3 text-xs max-w-[180px]">
        {ticket.bookTitle ? (
          <div className="truncate text-stone-700" title={ticket.bookTitle}>
            📖 {ticket.bookTitle}
          </div>
        ) : (
          <span className="text-stone-400">General</span>
        )}
      </td>

      {/* Category + Source */}
      <td className="px-3.5 py-3 text-xs whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <CategoryBadge category={ticket.category} aiStatus={ticket.aiStatus} />
          <AiSourceBadge aiStatus={ticket.aiStatus} source={ticket.categorySource} />
        </div>
      </td>

      {/* Status */}
      <td className="px-3.5 py-3 text-xs whitespace-nowrap">
        <TicketStatusBadge status={ticket.status} />
      </td>

      {/* Assignee */}
      <td className="px-3.5 py-3 text-xs whitespace-nowrap text-stone-600">
        {ticket.assignedTo?.name ? (
          <span className="inline-flex items-center gap-1 text-stone-800 font-medium">
            <span className="h-5 w-5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center justify-center">
              {ticket.assignedTo.name.charAt(0)}
            </span>
            {ticket.assignedTo.name}
          </span>
        ) : (
          <span className="text-stone-400 italic">Unassigned</span>
        )}
      </td>

      {/* Age */}
      <td
        className="px-3.5 py-3 text-xs whitespace-nowrap font-mono text-stone-500 text-right cursor-help"
        title={`Created: ${formatDateTime(ticket.createdAt)}`}
      >
        {formatAge(ticket.ageHours)}
      </td>
    </tr>
  );
}
