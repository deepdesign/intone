"use client";

interface CopySuggestionProps {
  suggestion: string;
  onAccept?: () => void;
  onReject?: () => void;
}

export function CopySuggestion({ suggestion, onAccept, onReject }: CopySuggestionProps) {
  return (
    <div className="p-3 border rounded-md">
      <p className="text-sm">{suggestion}</p>
      {onAccept && (
        <button onClick={onAccept} className="text-xs text-[var(--semantic-success)] mt-2">
          Accept
        </button>
      )}
      {onReject && (
        <button onClick={onReject} className="text-xs text-destructive mt-2 ml-2">
          Reject
        </button>
      )}
    </div>
  );
}



