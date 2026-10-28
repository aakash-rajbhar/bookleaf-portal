import { NavLink } from 'react-router-dom';

export function Tickets() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            My Support Tickets
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            View history and live responses for all your queries.
          </p>
        </div>
        <NavLink
          to="/tickets/new"
          className="inline-flex items-center justify-center rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-amber-800 transition"
        >
          New Query
        </NavLink>
      </div>

      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
        <div className="text-3xl mb-2">💬</div>
        <h3 className="text-base font-semibold text-stone-900">Support Tickets Feed</h3>
        <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
          Ticket list with SSE realtime update stream (scaffolded in T12a, full list in T12c).
        </p>
      </div>
    </div>
  );
}
