import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para exibição
 * @param date Data a ser formatada
 * @param formatStr Formato da data (padrão: 'dd/MM/yyyy')
 * @returns String formatada ou string vazia se a data for inválida
 */
export function formatDate(date: Date | string | undefined, formatStr: string = 'dd/MM/yyyy'): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
} 