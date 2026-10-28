import { useParams, NavLink } from 'react-router-dom';

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-stone-500">
        <NavLink to="/tickets" className="hover:text-stone-900 transition">
          &larr; Back to all tickets
        </NavLink>
        <span>&middot;</span>
        <span className="font-mono text-xs">{id}</span>
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
