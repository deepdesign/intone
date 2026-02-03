"use client";

interface ApproveCopyButtonProps {
  onApprove?: () => void;
  disabled?: boolean;
}

export function ApproveCopyButton({ onApprove, disabled }: ApproveCopyButtonProps) {
  return (
    <button
      onClick={onApprove}
      disabled={disabled}
      className="text-xs text-[var(--semantic-success)] disabled:opacity-50"
    >
      Approve
    </button>
  );
}



