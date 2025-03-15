/**
 * Formata uma mensagem de erro para exibição
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
} 