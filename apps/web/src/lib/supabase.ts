import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase envs ausentes: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY"
  );
} else {
  console.log("✅ Supabase configurado corretamente!");
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
      auth: {
        persistSession: false,
        autoRefreshToken: false, // Você gerencia tokens manualmente
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// ✅ NOVO: Função para setar token de autenticação
export function setSupabaseAuth(accessToken: string) {
  if (!supabase) return;
  
  // Setar token no Realtime
  supabase.realtime.setAuth(accessToken);
  
  console.log("✅ Token JWT setado no Supabase Realtime");
}