import { useState, type FormEvent } from 'react';
import type { AdminInternalNote } from '../../api/types';
import { api } from '../../api/client';
import { formatRelativeTime, formatDateTime } from '../../lib/format';
import { Spinner } from '../Spinner';

interface InternalNotesProps {
  ticketId: string;
  notes: AdminInternalNote[];
  onNoteAdded: () => void;
}

const MAX_NOTE_LENGTH = 2000;

export function InternalNotes({ ticketId, notes, onNoteAdded }: InternalNotesProps) {
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await api.admin.tickets.addNote(ticketId, { body: trimmed });
      setBody('');
      onNoteAdded();
    } catch (err) {
      setError((err as Error).message || 'Failed to add internal note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-amber-50/70 rounded-xl border border-amber-200/90 shadow-2xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
        <div>
          <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
            <span>🔒</span> Internal Notes
          </h3>
          <span className="text-[11px] font-semibold text-amber-800 tracking-tight block mt-0.5">
            Internal: never visible to the author
          </span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>
      </div>

      {/* Note listing */}
      {notes.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white/90 border border-amber-200 rounded-lg p-3 text-xs space-y-1.5 shadow-2xs"
            >
              <div className="flex items-center justify-between text-[11px] text-amber-900 border-b border-amber-100 pb-1">
                <span className="font-bold flex items-center gap-1">
                  <span>👤</span> {note.adminName}
                </span>
                <time
                  dateTime={note.createdAt}
                  title={formatDateTime(note.createdAt)}
                  className="text-stone-400 hover:text-stone-600 cursor-help"
                >
                  {formatRelativeTime(note.createdAt)}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-stone-800 font-sans leading-relaxed">
                {note.body}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-amber-800/80 italic bg-amber-100/40 p-2.5 rounded border border-amber-200/40 text-center">
          No internal notes yet. Notes added here are visible to support staff only.
        </p>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Add note form */}
      <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-amber-200/60">
        <label htmlFor="internal-note-body" className="block text-xs font-bold text-amber-950">
          Add an internal note
        </label>
        <textarea
          id="internal-note-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_NOTE_LENGTH))}
          rows={3}
          placeholder="Jot down notes about phone calls, special author requests, or investigation details..."
          disabled={isSubmitting}
          className="block w-full rounded-lg border border-amber-300 bg-white p-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:opacity-50 resize-y"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            {body.length} / {MAX_NOTE_LENGTH}
          </span>
          <button
            type="submit"
            disabled={!body.trim() || isSubmitting}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-800 hover:bg-amber-900 text-white transition shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {isSubmitting && <Spinner size="sm" />}
            {isSubmitting ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>
    </div>
  );
}
