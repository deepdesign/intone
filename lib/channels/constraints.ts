// Channel constraint utilities

export function validateLength(text: string, maxLength?: number): boolean {
  if (maxLength === undefined) {
    return true;
  }
  return text.length <= maxLength;
}

export function trimToFit(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  // Trim to fit, adding ellipsis if needed
  return text.slice(0, maxLength - 3) + "...";
}



