import { useState, useEffect, useRef } from 'react';
import type { AdminDraft, DraftResponse } from '../../api/types';
import { api } from '../../api/client';
import { Spinner } from '../Spinner';

interface DraftEditorProps {
  ticketId: string;
  isClosed: boolean;
  latestDraft: AdminDraft | null;
  onReplySuccess: () => void;
}

interface DraftMeta {
  source: 'ai' | 'template';
  model: string | null;
  cached: boolean;
  reason?: string;
  originalText: string;
}

const MAX_REPLY_LENGTH = 5000;

export function DraftEditor({
  ticketId,
  isClosed,
  latestDraft,
  onReplySuccess,
}: DraftEditorProps) {
  const [body, setBody] = useState<string>('');
  const [currentDraftMeta, setCurrentDraftMeta] = useState<DraftMeta | null>(null);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [markResolved, setMarkResolved] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);

  // Guard against React StrictMode double-invocation in development
  const draftRequestedRef = useRef(false);

  useEffect(() => {
    // If ticket has a persisted latestDraft, load it immediately without API call
    if (latestDraft) {
      if (!draftRequestedRef.current) {
        draftRequestedRef.current = true;
        setBody(latestDraft.draftText);
        setCurrentDraftMeta({
          source: latestDraft.source,
          model: latestDraft.model,
          cached: true,
          originalText: latestDraft.draftText,
        });
      }
      return;
    }

    // Do not auto-generate drafts for closed tickets
    if (isClosed) return;

    // Trigger draft generation once
    if (!draftRequestedRef.current) {
      draftRequestedRef.current = true;
      setIsDrafting(true);
      setDraftError(null);

      api.admin.tickets
        .generateDraft(ticketId, { regenerate: false })
        .then((res: DraftResponse) => {
          setBody(res.text);
          setCurrentDraftMeta({
            source: res.source,
            model: res.model,
            cached: res.cached,
            reason: res.reason,
            originalText: res.text,
          });
        })
        .catch((err: Error) => {
          setDraftError(err.message || 'Failed to generate initial draft');
        })
        .finally(() => {
          setIsDrafting(false);
        });
    }
  }, [ticketId, isClosed, latestDraft]);

  const handleRegenerate = async () => {
    if (isClosed || isDrafting || isSending) return;

    const isEdited = currentDraftMeta && body !== currentDraftMeta.originalText;
    if (isEdited && body.trim().length > 0) {
      const confirmed = window.confirm(
        'Regenerating will replace your current edits with a freshly generated draft. Continue?'
      );
      if (!confirmed) return;
    }

    setIsDrafting(true);
    setDraftError(null);
    try {
      const res = await api.admin.tickets.generateDraft(ticketId, { regenerate: true });
      setBody(res.text);
      setCurrentDraftMeta({
        source: res.source,
        model: res.model,
        cached: res.cached,
        reason: res.reason,
        originalText: res.text,
      });
    } catch (err) {
      setDraftError((err as Error).message || 'Failed to regenerate draft');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleResetToDraft = () => {
    if (!currentDraftMeta) return;
    setBody(currentDraftMeta.originalText);
  };

  const handleSendReply = async () => {
    const trimmed = body.trim();
    if (!trimmed || isSending || isClosed) return;

    setIsSending(true);
    setSendError(null);
    setSendSuccessMessage(null);

    try {
      await api.admin.tickets.reply(ticketId, {
        body: trimmed,
        markResolved,
      });

      // Clear draft on successful reply
      setBody('');
      setCurrentDraftMeta(null);
      setSendSuccessMessage(
        markResolved
          ? 'Reply sent and ticket resolved!'
          : 'Reply sent successfully to the author.'
      );
      onReplySuccess();
    } catch (err) {
      // Keep user's text on failure
      setSendError((err as Error).message || 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const isUnedited = Boolean(
    currentDraftMeta && body.trim() === currentDraftMeta.originalText.trim()
  );
  const isTemplateDraft = currentDraftMeta?.source === 'template';
  const showReviewWarning = (isUnedited && body.length > 0) || isTemplateDraft;
  const canReset = Boolean(
    currentDraftMeta && body !== currentDraftMeta.originalText && currentDraftMeta.originalText.length > 0
  );

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
      {/* Header bar with draft metadata */}
      <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <span>✍️</span> Compose Reply
          </span>

          {currentDraftMeta && (
            <div className="flex items-center gap-1.5">
              {currentDraftMeta.source === 'ai' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  AI draft {currentDraftMeta.model && `(${currentDraftMeta.model})`}
                </span>
              ) : (
                <span
                  title={currentDraftMeta.reason || 'AI triage/drafting unavailable'}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 cursor-help"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Template draft (AI unavailable)
                </span>
              )}

              {currentDraftMeta.cached && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-stone-100 text-stone-600 border border-stone-200">
                  cached
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status hints & Draft controls */}
        <div className="flex items-center gap-2">
          {showReviewWarning && !isClosed && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              ⚠️ Review before sending
            </span>
          )}

          {!isClosed && (
            <div className="flex items-center gap-1.5">
              {canReset && (
                <button
                  type="button"
                  onClick={handleResetToDraft}
                  disabled={isDrafting || isSending}
                  className="px-2 py-1 text-xs font-medium rounded text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition cursor-pointer disabled:opacity-50"
                >
                  Reset to draft
                </button>
              )}
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isDrafting || isSending}
                className="px-2.5 py-1 text-xs font-medium rounded bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {isDrafting && <Spinner size="sm" />}
                <span>{isDrafting ? 'Drafting...' : 'Regenerate'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drafting loader indicator */}
      {isDrafting && (
        <div className="bg-amber-50/50 border-b border-amber-100 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-medium">
          <Spinner size="sm" />
          <span>Drafting a reply...</span>
        </div>
      )}

      {/* Draft error banner */}
      {draftError && (
        <div className="m-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
          <p className="font-semibold">⚠️ Draft generation issue: {draftError}</p>
          <p className="text-[11px] text-amber-700">
            You can compose and send your reply manually below.
          </p>
        </div>
      )}

      {/* Success banner */}
      {sendSuccessMessage && (
        <div className="m-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 font-semibold flex items-center justify-between">
          <span>✓ {sendSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setSendSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Send error banner */}
      {sendError && (
        <div className="m-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-900">
          <strong>Send failed:</strong> {sendError}
        </div>
      )}

      {/* Closed ticket banner */}
      {isClosed && (
        <div className="bg-stone-100 border-b border-stone-200 px-4 py-3 text-xs font-semibold text-stone-700 flex items-center gap-2">
          <span>🔒</span> This ticket is closed. Replies are disabled unless reopened.
        </div>
      )}

      {/* Editor text area */}
      <div className="p-4 space-y-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_REPLY_LENGTH))}
          disabled={isClosed || isSending}
          rows={7}
          placeholder={
            isClosed
              ? 'This ticket is closed'
              : isDrafting
              ? 'Drafting reply with BookLeaf guidelines and author details...'
              : 'Type your reply to the author...'
          }
          className="block w-full rounded-lg border border-stone-300 p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:bg-stone-50 disabled:text-stone-500 font-sans leading-relaxed resize-y"
        />

        {/* Footer controls: counter, resolve checkbox, send button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-400">
              {body.length} / {MAX_REPLY_LENGTH}
            </span>

            {!isClosed && (
              <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={markResolved}
                  onChange={(e) => setMarkResolved(e.target.checked)}
                  disabled={isSending}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>Mark as resolved after sending</span>
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={handleSendReply}
            disabled={!body.trim() || isSending || isClosed}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-700 hover:bg-amber-800 text-white transition shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isSending && <Spinner size="sm" />}
            <span>{isSending ? 'Sending reply...' : 'Send reply'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
