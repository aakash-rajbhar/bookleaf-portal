import type { Book } from '../../api/types';
import { StatusBadge } from '../StatusBadge';
import { formatCurrency, formatNumber, formatDate, formatText } from '../../lib/format';

interface AuthorBookPanelProps {
  author: {
    id: string;
    name: string;
    email: string;
    city: string;
  };
  book: Book | null;
}

export function AuthorBookPanel({ author, book }: AuthorBookPanelProps) {
  const isNeverPaidWithPending =
    book && !book.isInProduction && book.royaltyPaid === 0 && book.royaltyPending > 0;

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5 space-y-5">
      {/* Author Section */}
      <div>
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>👤</span> Author Details
        </h3>
        <div className="bg-stone-50/70 border border-stone-100 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">Name</span>
            <span className="text-xs font-bold text-stone-900">{formatText(author.name)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">Email</span>
            <span className="text-xs font-mono text-stone-700">{formatText(author.email)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">City</span>
            <span className="text-xs text-stone-800">{formatText(author.city)}</span>
          </div>
        </div>
      </div>

      {/* Book Facts Section */}
      <div>
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>📖</span> Book Details
        </h3>

        {!book ? (
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold text-stone-700">
              General / Account Level, no book selected
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              This ticket is not tied to a specific title.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border-b border-stone-100 pb-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 leading-snug">
                    {book.title}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    ISBN: {formatText(book.isbn)} &middot; {formatText(book.genre)}
                  </p>
                </div>
                <StatusBadge status={book.status} isInProduction={book.isInProduction} />
              </div>
            </div>

            {/* In-Production Stage display */}
            {book.isInProduction ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-1 text-amber-950">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <span>🛠️</span> In-Production Stage
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Stage: <span className="font-semibold">{book.status}</span>
                </p>
                <p className="text-[11px] text-amber-700 mt-1 italic">
                  Sales and royalty reporting become available once publication completes.
                </p>
                <div className="pt-2 border-t border-amber-200/60 mt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-amber-800">Print Partner:</span>
                    <span className="font-medium text-amber-950">{formatText(book.printPartner)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-800">Platforms:</span>
                    <span className="font-medium text-amber-950">
                      {book.availableOn && book.availableOn.length > 0
                        ? book.availableOn.join(', ')
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Published Book Facts: Sales & Royalties */
              <div className="space-y-2">
                {isNeverPaidWithPending && (
                  <div className="bg-amber-100 border border-amber-300 rounded-md p-2 text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                    <span>⚠️</span> Pending royalty, never paid
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-400 block text-[11px]">MRP</span>
                    <span className="font-bold text-stone-800">{formatCurrency(book.mrp)}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-400 block text-[11px]">Copies Sold</span>
                    <span className="font-bold text-stone-800">{formatNumber(book.copiesSold)}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-400 block text-[11px]">Royalty Earned</span>
                    <span className="font-bold text-stone-800">{formatCurrency(book.royaltyEarned)}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-400 block text-[11px]">Royalty Paid</span>
                    <span className="font-bold text-stone-800">{formatCurrency(book.royaltyPaid)}</span>
                  </div>
                  <div className={`p-2 rounded border col-span-2 ${
                    isNeverPaidWithPending
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-stone-50 border-stone-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-stone-500 font-medium">Royalty Pending</span>
                      <span className="font-bold text-stone-900 text-sm">
                        {formatCurrency(book.royaltyPending)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50/70 border border-stone-100 rounded-lg p-2.5 text-xs space-y-1.5 text-stone-600">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 text-[11px]">Last Payout</span>
                    <span className="font-medium text-stone-800">{formatDate(book.lastPayoutDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 text-[11px]">Print Partner</span>
                    <span className="font-medium text-stone-800">{formatText(book.printPartner)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 text-[11px]">Platforms</span>
                    <span className="font-medium text-stone-800 text-right">
                      {book.availableOn && book.availableOn.length > 0
                        ? book.availableOn.join(', ')
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
