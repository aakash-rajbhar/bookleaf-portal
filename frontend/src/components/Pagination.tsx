interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
  disabled?: boolean;
}

export function Pagination({
  total,
  limit,
  offset,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(total, offset + limit);

  const canPrev = offset > 0 && !disabled;
  const canNext = offset + limit < total && !disabled;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-stone-200 sm:px-6">
      <div className="text-xs text-stone-500">
        Showing <span className="font-semibold text-stone-800">{start}</span> to{' '}
        <span className="font-semibold text-stone-800">{end}</span> of{' '}
        <span className="font-semibold text-stone-800">{total}</span> tickets
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={!canPrev}
          className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          &larr; Previous
        </button>

        <button
          type="button"
          onClick={() => onPageChange(offset + limit)}
          disabled={!canNext}
          className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
