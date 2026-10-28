interface StatusBadgeProps {
  status: string;
  isInProduction?: boolean;
  className?: string;
}

export function StatusBadge({ status, isInProduction, className = '' }: StatusBadgeProps) {
  const isProduction = isInProduction ?? (typeof status === 'string' && status.startsWith('In Production'));
  const isPublished = typeof status === 'string' && status.toLowerCase().includes('published');

  let colorClasses = 'bg-stone-100 text-stone-700 border-stone-200';
  let dotColor = 'bg-stone-400';

  if (isProduction) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (isPublished) {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
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
