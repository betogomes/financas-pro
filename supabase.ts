import { createClient } from '@supabase/supabase-js';

// No Supabase, vá em: Project Settings -> API
// Substitua os valores abaixo pelas informações do seu painel
const supabaseUrl = 'https://hrkolcjaekmjhpqdolvp.supabase.co';
const supabaseAnonKey = 'sb_publishable_purb3KB2hDfBR3ECnCvgXw_gTFgL-ny';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);