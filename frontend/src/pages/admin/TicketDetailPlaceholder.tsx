import { useParams, NavLink } from 'react-router-dom';

export function TicketDetailPlaceholder() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-stone-500">
        <NavLink to="/admin" className="hover:text-stone-900 transition flex items-center gap-1 font-medium">
          &larr; Back to queue
        </NavLink>
        <span>&middot;</span>
        <span className="font-mono text-xs text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
          Ticket ID: {id}
        </span>
      </div>

      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-2xs space-y-3">
        <div className="text-4xl mb-2">⚡</div>
        <h2 className="text-xl font-bold text-stone-900">Admin Ticket Workspace</h2>
        <p className="text-sm text-stone-500 max-w-md mx-auto">
          AI draft generation, triage overrides, and internal notes workspace (scaffolded in T13a, full workspace in T13b).
        </p>
        <div className="pt-2">
          <NavLink
            to="/admin"
            className="inline-flex items-center rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 transition"
          >
            Return to Queue
          </NavLink>
        </div>
      </div>
    </div>
  );
}
