interface AiSourceBadgeProps {
  aiStatus: string;
  source?: string | null;
  className?: string;
}

export function AiSourceBadge({ aiStatus, source, className = '' }: AiSourceBadgeProps) {
  if (aiStatus === 'pending') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse ${className}`}
        title="AI classification in progress"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Classifying...
      </span>
    );
  }

  if (source === 'admin') {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${className}`}
        title="Manually edited by admin"
      >
        edited
      </span>
    );
  }

  if (aiStatus === 'failed' || source === 'fallback' || source === 'rule') {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 cursor-help ${className}`}
        title="AI unavailable, rule-based fallback"
      >
        Rule-based
      </span>
    );
  }

  if (source === 'ai' || aiStatus === 'success') {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
        title="Classified by Google Gemini"
      >
        AI
      </span>
    );
  }

  return null;
}
