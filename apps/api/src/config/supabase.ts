import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

// Cliente com service role (bypass RLS) - usar apenas no backend
export const supabase = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Cliente com anon key (respeita RLS) - usar quando tiver contexto de usuário
export const supabaseAnon = createClient(
  env.supabase.url,
  env.supabase.anonKey
)
