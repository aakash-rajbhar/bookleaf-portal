const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

/**
 * Formats a numeric money amount in Indian Rupees (₹).
 * Null or undefined values return an em dash ('—').
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '—';
  }
  return currencyFormatter.format(amount);
}

/**
 * Formats counts or integers using Indian number grouping.
 * Null or undefined values return an em dash ('—').
 */
export function formatNumber(count: number | null | undefined): string {
  if (count === null || count === undefined) {
    return '—';
  }
  return numberFormatter.format(count);
}

/**
 * Formats ISO or YYYY-MM-DD date strings into a readable format (e.g. '15 Oct 2025').
 * Null, undefined, empty, or invalid dates return an em dash ('—').
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return '—';
  }

  try {
    // If date string is simple YYYY-MM-DD, parse year/month/day explicitly to prevent UTC timezone shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      if (isNaN(localDate.getTime())) return '—';
      return dateFormatter.format(localDate);
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return '—';
    }
    return dateFormatter.format(d);
  } catch {
    return '—';
  }
}

/**
 * Formats date and time into a full readable timestamp (e.g. '15 Oct 2025, 04:30 PM') for tooltips.
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return '—';
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return dateTimeFormatter.format(d);
  } catch {
    return '—';
  }
}

/**
 * Formats a timestamp into human-readable relative time (e.g. 'just now', '5 minutes ago', '2 hours ago', 'yesterday').
 * Returns an em dash ('—') for invalid or empty inputs.
 */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return '—';
  }

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';

    const now = Date.now();
    const diffMs = now - d.getTime();

    // Future timestamp safeguard
    if (diffMs < 0) {
      return 'just now';
    }

    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 45) {
      return 'just now';
    }
    if (diffMinutes < 2) {
      return '1 minute ago';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    }
    if (diffHours < 2) {
      return '1 hour ago';
    }
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) {
      return 'yesterday';
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    if (diffDays < 30) {
      const weeks = Math.round(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }

    return formatDate(dateStr);
  } catch {
    return '—';
  }
}

/**
 * Fallback helper for text strings. Returns em dash if null, undefined, or empty.
 */
export function formatText(value: string | null | undefined): string {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return '—';
  }
  return value.trim();
}
