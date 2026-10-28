import { NavLink } from 'react-router-dom';
import type { Book } from '../api/types';
import { formatCurrency, formatDate, formatNumber, formatText } from '../lib/format';
import { StatusBadge } from './StatusBadge';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const isNeverPaid = !book.lastPayoutDate;
  const isPendingPositive = (book.royaltyPending ?? 0) > 0;
  const isPendingZero = (book.royaltyPending ?? 0) === 0;

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden flex flex-col transition hover:shadow-xs">
      {/* Card Header */}
      <div className="p-5 border-b border-stone-100 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-stone-900 tracking-tight leading-snug">
              {book.title}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              {formatText(book.genre)} &middot; ISBN: <span className="font-mono">{formatText(book.isbn)}</span>
            </p>
          </div>
          <StatusBadge status={book.status} isInProduction={book.isInProduction} />
        </div>

        {/* In production banner */}
        {book.isInProduction && (
          <div className="mt-1 rounded-lg bg-amber-50 border border-amber-200/80 px-3.5 py-2.5 text-xs text-amber-900 flex items-center gap-2">
            <span className="text-base leading-none">⏳</span>
            <div>
              <span className="font-semibold">In production:</span> {book.status}
              <span className="block text-[11px] text-amber-700/90 mt-0.5">
                Sales and royalty data will become active once printing and distribution go live.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
        {/* Royalty and Sales Block (Only rendered for published books, completely hidden if in production) */}
        {!book.isInProduction && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block">
                  Copies Sold
                </span>
                <span className="text-base font-bold text-stone-800 mt-0.5 block">
                  {formatNumber(book.copiesSold)}
                </span>
              </div>

              <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block">
                  Royalty Earned
                </span>
                <span className="text-base font-bold text-stone-800 mt-0.5 block">
                  {formatCurrency(book.royaltyEarned)}
                </span>
              </div>

              <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block">
                  Royalty Paid
                </span>
                <span className="text-base font-bold text-emerald-700 mt-0.5 block">
                  {formatCurrency(book.royaltyPaid)}
                </span>
              </div>

              <div className="bg-amber-50/60 rounded-lg p-2.5 border border-amber-200/60">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-700 block">
                  Pending Payout
                </span>
                <span className="text-base font-bold text-amber-900 mt-0.5 block">
                  {formatCurrency(book.royaltyPending)}
                </span>
              </div>
            </div>

            {/* Payout status notice */}
            {isPendingPositive && isNeverPaid && (
              <div className="text-xs text-amber-800 bg-amber-50/80 rounded-md p-2.5 border border-amber-100 flex items-start gap-1.5">
                <span className="text-amber-600 mt-0.5">ℹ️</span>
                <span>
                  No payout yet. Royalties are calculated quarterly and paid within 45 days of quarter end.
                </span>
              </div>
            )}

            {isPendingZero && (
              <div className="text-xs text-emerald-800 bg-emerald-50/80 rounded-md p-2 border border-emerald-100 flex items-center gap-1.5">
                <span className="text-emerald-600">✓</span>
                <span>All royalties paid</span>
              </div>
            )}
          </div>
        )}

        {/* Metadata section */}
        <div className="pt-2 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-stone-400 block text-[11px]">Publication Date</span>
            <span className="text-stone-800 font-medium">
              {formatDate(book.publicationDate)}
            </span>
          </div>

          {!book.isInProduction && (
            <div>
              <span className="text-stone-400 block text-[11px]">List Price (MRP)</span>
              <span className="text-stone-800 font-medium">
                {formatCurrency(book.mrp)}
              </span>
            </div>
          )}

          {!book.isInProduction && (
            <div>
              <span className="text-stone-400 block text-[11px]">Last Payout</span>
              <span className="text-stone-800 font-medium">
                {formatDate(book.lastPayoutDate)}
              </span>
            </div>
          )}

          <div>
            <span className="text-stone-400 block text-[11px]">Print Partner</span>
            <span className="text-stone-800 font-medium">
              {formatText(book.printPartner)}
            </span>
          </div>

          <div className="col-span-2">
            <span className="text-stone-400 block text-[11px] mb-1">Available On</span>
            {book.availableOn && book.availableOn.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {book.availableOn.map((platform, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-stone-500">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Action */}
      <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
        <span className="text-xs text-stone-400 font-mono">ID: {book.id}</span>
        <NavLink
          to={`/tickets/new?bookId=${encodeURIComponent(book.id)}`}
          className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-1"
        >
          Submit Query for this Book &rarr;
        </NavLink>
      </div>
    </div>
  );
}
