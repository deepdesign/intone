"use client";

interface RejectCopyButtonProps {
  onReject?: () => void;
  disabled?: boolean;
}

export function RejectCopyButton({ onReject, disabled }: RejectCopyButtonProps) {
  return (
    <button
      onClick={onReject}
      disabled={disabled}
      className="text-xs text-destructive disabled:opacity-50"
    >
      Reject
    </button>
  );
}



