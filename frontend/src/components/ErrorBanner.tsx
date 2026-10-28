import type { ReactNode } from "react";

interface ErrorBannerProps {
  title?: string;
  message: string;
  details?: Array<{ path: string; message: string }> | unknown;
  onRetry?: () => void;
  className?: string;
  action?: ReactNode;
}

export function ErrorBanner({
  title = "Something went wrong",
  message,
  details,
  onRetry,
  className = "",
  action,
}: ErrorBannerProps) {
  const isValidationDetails =
    Array.isArray(details) &&
    details.length > 0 &&
    typeof details[0] === "object" &&
    "message" in details[0];

  return (
    <div
      role="alert"
      className={`rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 shadow-xs ${className}`}
    >
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-red-600 mt-0.5 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>

        <div className="flex-1 text-sm">
          {title && <h3 className="font-semibold text-red-800">{title}</h3>}
          <div className="mt-1 text-red-700">{message}</div>

          {isValidationDetails && (
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-red-600 font-mono bg-white/60 p-2 rounded border border-red-100">
              {(details as Array<{ path: string; message: string }>).map(
                (d, i) => (
                  <li key={i}>
                    <span className="font-semibold">
                      {d.path ? `${d.path}: ` : ""}
                    </span>
                    {d.message}
                  </li>
                ),
              )}
            </ul>
          )}

          {(onRetry || action) && (
            <div className="mt-3 flex items-center gap-3">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition shadow-xs cursor-pointer"
                >
                  Try Again
                </button>
              )}
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
