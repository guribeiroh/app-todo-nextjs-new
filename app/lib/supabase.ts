import { createClient } from '@supabase/supabase-js';

// Idealmente, essas variáveis viriam de variáveis de ambiente
// Para desenvolvimento, podemos usar valores temporários
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Inicializar o cliente Supabase com autoRefreshToken para manter a sessão
const supabase = createClient(
  supabaseUrl, 
  supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    // Configurações para melhorar a manipulação de erros e resposta da API
    global: {
      headers: {
        'X-Supabase-Postgrest-Select': 'return=representation',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    },
    db: {
      schema: 'public'
    },
    // Configurar retry para melhorar robustez em caso de falhas temporárias
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

export default supabase; 