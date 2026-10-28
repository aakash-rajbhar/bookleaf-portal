import { useParams, useLocation, NavLink } from 'react-router-dom';

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage;

  return (
    <div className="space-y-6">
      {successMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 text-sm shadow-2xs flex items-start gap-3"
        >
          <span className="text-emerald-600 text-lg leading-none mt-0.5">✓</span>
          <div>
            <h4 className="font-semibold text-emerald-900">Query Submitted</h4>
            <p className="text-emerald-800 mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-sm text-stone-500">
        <NavLink to="/tickets" className="hover:text-stone-900 transition">
          &larr; Back to all tickets
        </NavLink>
        <span>&middot;</span>
        <span className="font-mono text-xs text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
          Ticket ID: {id}
        </span>
      </div>

      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
        <div className="text-3xl mb-2">📬</div>
        <h3 className="text-base font-semibold text-stone-900">Ticket Conversation</h3>
        <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
          Thread view with live support message delivery (scaffolded in T12a, full thread in T12c).
        </p>
      </div>
    </div>
  );
}
