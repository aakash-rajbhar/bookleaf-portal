import type { TicketStatus } from '../api/types';

interface TicketStatusBadgeProps {
  status: TicketStatus | string;
  className?: string;
}

export function TicketStatusBadge({ status, className = '' }: TicketStatusBadgeProps) {
  let colorClasses = 'bg-stone-100 text-stone-600 border-stone-200';
  let dotColor = 'bg-stone-400';

  switch (status) {
    case 'Open':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500';
      break;
    case 'In Progress':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500';
      break;
    case 'Resolved':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;
    case 'Closed':
      colorClasses = 'bg-stone-100 text-stone-600 border-stone-200';
      dotColor = 'bg-stone-400';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {status || '—'}
    </span>
  );
}
