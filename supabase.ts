import { createClient } from '@supabase/supabase-js';

/**
 * Acessa as variáveis de ambiente de forma segura.
 * Em ambientes Vite, import.meta.env é injetado durante o build/dev.
 * Se por algum motivo o objeto for undefined, evitamos o crash do app.
 */
const getEnv = () => {
  try {
    return (import.meta as any).env || {};
  } catch {
    return {};
  }
};

const env = getEnv();

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    "Atenção: Supabase não configurado ou chaves ausentes em import.meta.env. " +
    "O aplicativo funcionará em modo offline salvando dados localmente."
  );
}