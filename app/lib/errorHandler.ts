/**
 * Utilitário para manipulação de erros do Supabase
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Formata uma mensagem de erro baseada no tipo de erro
 */
export function handleError(error: unknown): string {
  // Erros do Postgrest (Supabase)
  if (isPostgrestError(error)) {
    return formatPostgrestError(error);
  }
  
  // Erro padrão de JavaScript
  if (error instanceof Error) {
    return error.message;
  }
  
  // Fallback para outros tipos de erro
  return String(error);
}

/**
 * Verifica se o erro é um PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' && 
    error !== null && 
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

/**
 * Formata uma mensagem de erro do Postgrest para ser mais amigável
 */
function formatPostgrestError(error: PostgrestError): string {
  const { code, message, details } = error;
  
  switch (code) {
    case '23505': // Unique violation
      return 'Já existe um registro com este valor. Duplicação não permitida.';
    
    case '23503': // Foreign key violation
      return 'Esta operação não é permitida pois referencia dados que não existem.';
    
    case 'PGRST116': // No rows returned
      return 'Nenhum registro encontrado.';
    
    case '42P01': // Undefined table
      return 'Tabela não encontrada. Entre em contato com o suporte.';
    
    case '42501': // Insufficient privilege
      return 'Permissão negada para realizar esta operação.';
    
    case '22P02': // Invalid text representation
      return 'Formato de dados inválido.';
      
    // Adicione mais casos conforme necessário
    
    default:
      // Se temos detalhes adicionais, incluí-los na mensagem
      if (details) {
        return `Erro: ${message}. Detalhes: ${details}`;
      }
      return `Erro: ${message}`;
  }
}

/**
 * Registra um erro no console com informações detalhadas
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}] Erro:`, error);
  
  if (error instanceof Error && error.stack) {
    console.debug(`[${context}] Stack:`, error.stack);
  }
} 