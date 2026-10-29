import type { TicketCategory } from '../../api/types';

interface CategoryBadgeProps {
  category: TicketCategory | null | undefined;
  aiStatus?: string;
  className?: string;
}

export function CategoryBadge({ category, aiStatus, className = '' }: CategoryBadgeProps) {
  if (aiStatus === 'pending') {
    return <span className="text-stone-400 font-mono">—</span>;
  }

  if (!category) {
    return <span className="text-stone-400 font-mono">—</span>;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200 truncate max-w-[220px] ${className}`}
      title={category}
    >
      {category}
    </span>
  );
}
