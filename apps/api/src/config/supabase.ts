import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

if (env.supabase.tlsInsecure) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

// Cliente com service role (bypass RLS) - usar apenas no backend.
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

// Cliente com anon key (respeita RLS) - usar quando tiver contexto de usuario.
export const supabaseAnon = createClient(
  env.supabase.url,
  env.supabase.anonKey
)
