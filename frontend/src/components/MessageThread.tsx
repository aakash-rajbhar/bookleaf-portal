import type { TicketMessage } from '../api/types';
import { formatRelativeTime, formatDateTime } from '../lib/format';

interface MessageThreadProps {
  originalQuery: {
    body: string;
    createdAt: string;
    authorName?: string;
  };
  messages: TicketMessage[];
  viewerRole?: 'author' | 'admin';
  authorName?: string;
  adminName?: string;
}

export function MessageThread({
  originalQuery,
  messages,
  viewerRole = 'author',
  authorName,
  adminName,
}: MessageThreadProps) {
  const isAdmin = viewerRole === 'admin';
  const effectiveAuthorName = authorName || originalQuery.authorName || 'Author';
  const effectiveAdminName = adminName || 'Support Agent';

  return (
    <div className="space-y-6">
      {/* 1. Original author query (chronologically first message) */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
        <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-amber-100 text-amber-900 font-semibold text-xs flex items-center justify-center border border-amber-200">
              ✍️
            </div>
            <div>
              <span className="text-xs font-bold text-stone-800">
                {isAdmin ? effectiveAuthorName : originalQuery.authorName ? `${originalQuery.authorName} (You)` : 'You'}
              </span>
              <span className="text-[11px] text-stone-400 ml-2 font-medium">Original Query</span>
            </div>
          </div>
          <time
            dateTime={originalQuery.createdAt}
            title={formatDateTime(originalQuery.createdAt)}
            className="text-xs text-stone-400 hover:text-stone-600 cursor-help"
          >
            {formatRelativeTime(originalQuery.createdAt)}
          </time>
        </div>
        <div className="p-4 sm:p-5">
          <div className="whitespace-pre-wrap font-sans text-sm text-stone-800 leading-relaxed break-words">
            {originalQuery.body}
          </div>
        </div>
      </div>

      {/* 2. Chronological replies */}
      {messages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px bg-stone-200 flex-1" />
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Replies &middot; {messages.length}
            </span>
            <div className="h-px bg-stone-200 flex-1" />
          </div>

          {messages.map((msg) => {
            const isSupport = msg.senderRole === 'admin';

            return (
              <div
                key={msg.id}
                className={`rounded-xl border shadow-2xs overflow-hidden transition ${
                  isSupport
                    ? 'border-amber-200/80 bg-amber-50/20'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <div
                  className={`px-4 py-2.5 border-b flex items-center justify-between text-xs ${
                    isSupport
                      ? 'bg-amber-50/70 border-amber-200/60'
                      : 'bg-stone-50 border-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSupport
                          ? 'bg-amber-700 text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {isSupport ? '🍃' : '👤'}
                    </span>
                    <span className="font-bold text-stone-800">
                      {isSupport
                        ? isAdmin
                          ? effectiveAdminName
                          : 'BookLeaf Support'
                        : isAdmin
                          ? effectiveAuthorName
                          : 'You'}
                    </span>
                    {isSupport && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                        Official
                      </span>
                    )}
                  </div>
                  <time
                    dateTime={msg.createdAt}
                    title={formatDateTime(msg.createdAt)}
                    className="text-stone-400 hover:text-stone-600 cursor-help"
                  >
                    {formatRelativeTime(msg.createdAt)}
                  </time>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="whitespace-pre-wrap font-sans text-sm text-stone-800 leading-relaxed break-words">
                    {msg.body}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Empty replies state */}
      {messages.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/60 p-6 text-center text-sm text-stone-500">
          <span className="text-2xl block mb-2">⏳</span>
          <p className="font-semibold text-stone-800">
            {isAdmin
              ? 'No replies sent yet.'
              : 'We have received your query. Our team will reply here.'}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            {isAdmin
              ? 'Use the AI draft editor below to compose and send a reply.'
              : 'Responses appear automatically in real time without having to refresh the page.'}
          </p>
        </div>
      )}
    </div>
  );
}
