import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import type { Book, ApiErrorDetail } from '../../api/types';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Spinner } from '../../components/Spinner';

export function SubmitQuery() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBookId = searchParams.get('bookId') || '';

  const [books, setBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  // Form states (preserved on submit error)
  const [selectedBookId, setSelectedBookId] = useState(initialBookId);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Submission & Validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    let isMounted = true;
    async function loadBooks() {
      try {
        const data = await api.books.list();
        if (isMounted) {
          setBooks(data);
          if (initialBookId && data.some((b) => b.id === initialBookId)) {
            setSelectedBookId(initialBookId);
          }
        }
      } catch (err) {
        console.error('Failed to load author books for dropdown:', err);
      } finally {
        if (isMounted) setIsLoadingBooks(false);
      }
    }
    loadBooks();
    return () => {
      isMounted = false;
    };
  }, [initialBookId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const names = Array.from(e.target.files).map((f) => f.name);
      setSelectedFiles(names);
    } else {
      setSelectedFiles([]);
    }
  };

  const validateClientSide = (): boolean => {
    const errors: { [key: string]: string } = {};
    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();

    if (!trimmedSubject) {
      errors.subject = 'Subject is required';
    } else if (trimmedSubject.length < 3) {
      errors.subject = 'Subject must be at least 3 characters';
    } else if (trimmedSubject.length > 150) {
      errors.subject = 'Subject cannot exceed 150 characters';
    }

    if (!trimmedDescription) {
      errors.description = 'Description is required';
    } else if (trimmedDescription.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (trimmedDescription.length > 5000) {
      errors.description = 'Description cannot exceed 5000 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Client-side validation mirroring backend zod limits
    const isValid = validateClientSide();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        bookId: selectedBookId.trim() ? selectedBookId.trim() : null,
        subject: subject.trim(),
        description: description.trim(),
      };

      const ticket = await api.tickets.create(payload);

      // On success navigate to /tickets/:id with state notice
      navigate(`/tickets/${ticket.id}`, {
        replace: true,
        state: {
          successMessage: `Your query has been submitted successfully! Ticket #${ticket.id}`,
        },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message || 'Submission failed');

        // Extract field-specific validation errors from backend details[]
        if (Array.isArray(err.details)) {
          const serverFieldErrors: { [key: string]: string } = {};
          (err.details as ApiErrorDetail[]).forEach((d) => {
            if (d.path) {
              serverFieldErrors[d.path] = d.message;
            }
          });
          setFieldErrors((prev) => ({ ...prev, ...serverFieldErrors }));
        }
      } else {
        setGeneralError((err as Error).message || 'Unable to submit your query');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Submit Support Query
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Have a question about your royalties, distribution, cover files, or copies? We are here to help.
        </p>
      </div>

      {generalError && (
        <ErrorBanner
          title="Could not submit query"
          message={generalError}
        />
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} noValidate className="bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-2xs space-y-6">
        {/* Book Association Selector */}
        <div>
          <label htmlFor="book-select" className="block text-sm font-semibold text-stone-800">
            Select Related Title (Optional)
          </label>
          <p className="text-xs text-stone-500 mt-0.5">
            Choose which of your titles this query relates to, or select General if account-level.
          </p>
          <div className="mt-2">
            <select
              id="book-select"
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              disabled={isLoadingBooks || isSubmitting}
              className="block w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-2xs focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:bg-stone-50"
            >
              <option value="">General / Account Level (No specific book)</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} {b.isInProduction ? '(in production)' : ''} &middot; [{b.id}]
                </option>
              ))}
            </select>
          </div>
          {fieldErrors.bookId && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">{fieldErrors.bookId}</p>
          )}
        </div>

        {/* Subject Field */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="subject" className="block text-sm font-semibold text-stone-800">
              Subject <span className="text-red-500">*</span>
            </label>
            <span className={`text-xs font-mono ${subject.length > 150 ? 'text-red-600 font-bold' : 'text-stone-400'}`}>
              {subject.length} / 150 chars (min 3)
            </span>
          </div>
          <div className="mt-2">
            <input
              id="subject"
              type="text"
              required
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (fieldErrors.subject) {
                  setFieldErrors((prev) => ({ ...prev, subject: '' }));
                }
              }}
              disabled={isSubmitting}
              maxLength={160}
              placeholder="e.g. Q3 Royalty calculation inquiry or Amazon listing update"
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-2xs focus:outline-none sm:text-sm disabled:bg-stone-50 ${
                fieldErrors.subject
                  ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20'
                  : 'border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
              }`}
            />
          </div>
          {fieldErrors.subject && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">{fieldErrors.subject}</p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="description" className="block text-sm font-semibold text-stone-800">
              Description / Query Details <span className="text-red-500">*</span>
            </label>
            <span className={`text-xs font-mono ${description.length > 5000 ? 'text-red-600 font-bold' : 'text-stone-400'}`}>
              {description.length} / 5000 chars (min 10)
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Please provide specific details, including any invoice numbers, dates, or ISBN references.
          </p>
          <div className="mt-2">
            <textarea
              id="description"
              rows={6}
              required
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) {
                  setFieldErrors((prev) => ({ ...prev, description: '' }));
                }
              }}
              disabled={isSubmitting}
              maxLength={5100}
              placeholder="Describe your question or issue in detail..."
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-2xs focus:outline-none sm:text-sm disabled:bg-stone-50 ${
                fieldErrors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20'
                  : 'border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
              }`}
            />
          </div>
          {fieldErrors.description && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">{fieldErrors.description}</p>
          )}
        </div>

        {/* Optional File Attachment Demo */}
        <div className="pt-2 border-t border-stone-100">
          <label htmlFor="attachments" className="block text-sm font-semibold text-stone-800">
            Attachments (Optional)
          </label>
          <p className="text-xs text-stone-500 mt-0.5">
            Upload sample cover images, royalty receipts, or manuscript snapshots.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            <input
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
            />
            <p className="text-[11px] text-amber-700 font-medium">
              Note: Attachments are not uploaded in this demo.
            </p>

            {selectedFiles.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {selectedFiles.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-stone-100 text-stone-700 border border-stone-200 font-mono"
                  >
                    📎 {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/books')}
            disabled={isSubmitting}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-2xs hover:bg-stone-50 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-lg bg-amber-700 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Submitting query...
              </span>
            ) : (
              'Submit Query'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
