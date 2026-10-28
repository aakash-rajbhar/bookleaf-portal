import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export function AdminPlaceholder() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans">
      <header className="border-b border-stone-800 bg-stone-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-600 text-white font-bold text-sm">
            🛡️
          </span>
          <span className="font-bold text-stone-100 text-lg">BookLeaf Admin Portal</span>
          <span className="text-xs bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full font-mono">
            T13 Reserved
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-stone-400">{user?.name} ({user?.email})</span>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded transition cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-8 flex flex-col justify-center items-center text-center">
        <div className="p-8 rounded-xl bg-stone-950 border border-stone-800 max-w-lg">
          <div className="text-4xl mb-4">⚙️</div>
          <h2 className="text-xl font-bold text-stone-100">Admin Ticket Queue & AI Studio</h2>
          <p className="mt-2 text-sm text-stone-400">
            This administration space is reserved for Task T13 (ticket queues, AI draft generation, override metadata, and internal notes).
          </p>
        </div>
      </main>
    </div>
  );
}
