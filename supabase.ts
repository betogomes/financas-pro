import { createClient } from '@supabase/supabase-js';

// Tenta pegar as variáveis com os nomes padrão do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Inicialização segura para evitar que o app trave na tela branca por erro de exportação
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn("Atenção: Supabase não configurado corretamente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
}