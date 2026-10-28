import { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { Book } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { BookCard } from '../../components/BookCard';
import { Spinner } from '../../components/Spinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency } from '../../lib/format';

export function Books() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.books.list();
      setBooks(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to load books');
      } else {
        setError((err as Error).message || 'Unable to connect to BookLeaf server');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const totalTitles = books.length;
  const inProductionCount = books.filter((b) => b.isInProduction).length;
  const totalEarned = books.reduce((sum, b) => sum + (b.royaltyEarned || 0), 0);
  const totalPending = books.reduce((sum, b) => sum + (b.royaltyPending || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Welcome, {user?.name || 'Author'}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage your published titles, track quarterly royalties, and check production statuses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchBooks}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 disabled:opacity-50 transition cursor-pointer"
            title="Refresh books list"
          >
            ↻ Refresh
          </button>
          <NavLink
            to="/tickets/new"
            className="inline-flex items-center justify-center rounded-lg bg-amber-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-amber-800 transition"
          >
            Submit Support Query
          </NavLink>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 flex justify-center items-center">
          <Spinner size="lg" label="Loading your published titles..." />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <ErrorBanner
          title="Could not load your books"
          message={error}
          onRetry={fetchBooks}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && books.length === 0 && (
        <EmptyState
          title="No books yet"
          description="You do not have any titles associated with this author account yet. If you have manuscripts in progress or published titles, contact BookLeaf Support."
          action={
            <NavLink
              to="/tickets/new"
              className="inline-flex items-center rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-amber-800 transition"
            >
              Submit a Query
            </NavLink>
          }
        />
      )}

      {/* Content State */}
      {!isLoading && !error && books.length > 0 && (
        <div className="space-y-6">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div>
              <span className="text-xs text-stone-500 block font-medium">Published Titles</span>
              <span className="text-lg font-bold text-stone-900 mt-0.5 block">
                {totalTitles} {inProductionCount > 0 ? `(${inProductionCount} in production)` : ''}
              </span>
            </div>
            <div>
              <span className="text-xs text-stone-500 block font-medium">Active In Print</span>
              <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                {totalTitles - inProductionCount}
              </span>
            </div>
            <div>
              <span className="text-xs text-stone-500 block font-medium">Lifetime Royalties</span>
              <span className="text-lg font-bold text-stone-900 mt-0.5 block">
                {formatCurrency(totalEarned)}
              </span>
            </div>
            <div>
              <span className="text-xs text-amber-800 block font-medium">Pending Payout</span>
              <span className="text-lg font-bold text-amber-900 mt-0.5 block">
                {formatCurrency(totalPending)}
              </span>
            </div>
          </div>

          {/* Books List Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
