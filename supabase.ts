import { createClient } from '@supabase/supabase-js';

// No Vite (usado pelo Vercel), as variáveis devem começar com VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Configuração do Supabase ausente. Verifique as Environment Variables no Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);