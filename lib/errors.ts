type MaybeSupabaseError = {
  message?: string;
  code?: string;
} | null;

export function toUserMessage(error: MaybeSupabaseError): string {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const message = error.message ?? "";

  if (
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("fetch failed")
  ) {
    return "Could not reach the database. Check your connection and try again.";
  }

  if (error.code === "42501") {
    return "You don't have permission to do that.";
  }

  if (error.code === "23503") {
    return "This document is no longer available.";
  }

  if (error.code === "23505") {
    return "This person already has access.";
  }

  return "Something went wrong. Please try again.";
}
