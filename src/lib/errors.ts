// Supabase hands back plain objects with a message rather than Error instances,
// so String(error) would show "[object Object]".
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return String(error);
}
