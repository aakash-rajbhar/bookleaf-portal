import type { TicketPriority } from '../../api/types';

interface PriorityBadgeProps {
  priority: TicketPriority | null | undefined;
  aiStatus?: string;
  className?: string;
}

export function PriorityBadge({ priority, aiStatus, className = '' }: PriorityBadgeProps) {
  if (aiStatus === 'pending') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-500 border border-stone-200 ${className}`}
      >
        —
      </span>
    );
  }

  if (!priority) {
    return <span className="text-stone-400 font-mono">—</span>;
  }

  let colorClasses = 'bg-stone-100 text-stone-700 border-stone-200';
  let dotColor = 'bg-stone-400';

  switch (priority) {
    case 'Critical':
      colorClasses = 'bg-red-50 text-red-800 border-red-300 font-bold';
      dotColor = 'bg-red-600';
      break;
    case 'High':
      colorClasses = 'bg-orange-50 text-orange-800 border-orange-300 font-semibold';
      dotColor = 'bg-orange-500';
      break;
    case 'Medium':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
      dotColor = 'bg-amber-500';
      break;
    case 'Low':
      colorClasses = 'bg-stone-100 text-stone-600 border-stone-200 font-medium';
      dotColor = 'bg-stone-400';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border ${colorClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {priority}
    </span>
  );
}
