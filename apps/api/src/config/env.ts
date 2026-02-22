import 'dotenv/config'

/**
 * Configuração centralizada de variáveis de ambiente
 * Valida e exporta todas as configs necessárias
 */
export const env = {
  // Configurações do servidor
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    jwtSecret: process.env.SUPABASE_JWT_SECRET!
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiration: process.env.JWT_EXPIRATION || '7d'
  },
  
  // Email (SMTP)
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || 'noreply@ticketsystem.com'
  },
  
  // Microsoft Azure AD
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/auth/microsoft/callback'
  },
  
  // URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
}

// Validações obrigatórias
if (!env.supabase.url || !env.supabase.anonKey) {
  throw new Error('❌ Variáveis de ambiente do Supabase não configuradas')
}

if (!env.supabase.jwtSecret || env.supabase.jwtSecret.length < 32) {
  throw new Error('❌ SUPABASE_JWT_SECRET deve ter no mínimo 32 caracteres')
}

if (!env.jwt.secret || env.jwt.secret.length < 32) {
  throw new Error('❌ JWT_SECRET deve ter no mínimo 32 caracteres')
}

// Avisos para configurações opcionais
if (!env.email.user || !env.email.password) {
  console.warn('⚠️  Email não configurado - 2FA e recuperação de senha não funcionarão')
}

if (!env.microsoft.clientId || !env.microsoft.clientSecret) {
  console.warn('⚠️  Microsoft AD não configurado - login com Microsoft desabilitado')
}
