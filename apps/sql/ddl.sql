-- =====================================================
-- SISTEMA DE SUPORTE - TICKETS
-- DDL para Supabase (PostgreSQL)
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELAS CORE - Entidades e Permissões
-- =====================================================

-- Entidades (empresas/organizações)
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departamentos/funções da empresa
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles (perfis de acesso)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  scope VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  last_name VARCHAR(50),
  email VARCHAR(255) NOT NULL UNIQUE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  phone VARCHAR(13) CHECK (phone ~ '^\+55\d{10,11}$'),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Campos de Autenticação
  password_hash VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  password_reset_token VARCHAR(255),
  password_reset_expires_at TIMESTAMPTZ,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_entity_id ON users(entity_id);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX idx_users_department ON users(department_id);
-- Índice (se precisar buscar por telefone)
CREATE INDEX idx_users_phone ON users(phone);
-- =====================================================
-- 2. LOOKUPS - Tabelas de Referência
-- =====================================================

-- Sistemas Operacionais
CREATE TABLE operating_systems (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  version VARCHAR(50),
  family VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. SEED DATA - Dados Iniciais
-- =====================================================

-- Sistemas Operacionais
INSERT INTO operating_systems (name, version, family) VALUES
  ('Windows 11', '11', 'Windows'),
  ('Windows 10', '10', 'Windows'),
  ('macOS Sonoma', '14', 'macOS'),
  ('macOS Ventura', '13', 'macOS'),
  ('Ubuntu', '22.04', 'Linux'),
  ('Ubuntu', '24.04', 'Linux'),
  ('Android', '14', 'Android'),
  ('Android', '13', 'Android'),
  ('iOS', '17', 'iOS'),
  ('iOS', '16', 'iOS'),
  ('Outro', NULL, 'Other');

-- Status de Tickets
INSERT INTO ticket_statuses (key, label, "order") VALUES
  ('open', 'Aberto', 1),
  ('pending', 'Pendente', 2),
  ('closed', 'Fechado', 3);

-- Prioridades
INSERT INTO ticket_priorities (key, label, "order") VALUES
  ('low', 'Baixa', 1),
  ('normal', 'Normal', 2),
  ('high', 'Alta', 3);

-- Tipos de Tickets
INSERT INTO ticket_types (key, label) VALUES
  ('error', 'Erro'),
  ('suggestion', 'Sugestão'),
  ('question', 'Dúvida');

-- =====================================================
-- 8. COMENTÁRIOS (Documentação)
-- =====================================================
COMMENT ON TABLE users IS 'Usuários do sistema com autenticação';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt da senha do usuário';
COMMENT ON COLUMN users.two_factor_enabled IS 'Se o usuário tem 2FA ativado';
COMMENT ON COLUMN users.last_login_at IS 'Data/hora do último login';
COMMENT ON COLUMN users.is_active IS 'Se o usuário está ativo no sistema';
COMMENT ON COLUMN users.password_reset_token IS 'Token temporário para reset de senha';
COMMENT ON COLUMN users.password_reset_expires_at IS 'Expiração do token de reset';
COMMENT ON COLUMN users.phone IS 'Telefone no formato E.164 brasileiro: +5511999999999';



-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) - Opcional
-- =====================================================



-- =====================================================
-- 10. VIEWS ÚTEIS (Opcional)
-- =====================================================

-- View para dashboard com métricas agregadas
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT
  e.id as entity_id,
  e.name as entity_name,
  COUNT(t.id) as total_tickets,
  COUNT(CASE WHEN ts.key = 'open' THEN 1 END) as open_tickets,
  COUNT(CASE WHEN ts.key = 'in_progress' THEN 1 END) as in_progress_tickets,
  COUNT(CASE WHEN ts.key = 'resolved' THEN 1 END) as resolved_tickets,
  COUNT(CASE WHEN tp.key = 'urgent' THEN 1 END) as urgent_tickets,
  AVG(EXTRACT(EPOCH FROM (COALESCE(t.resolved_at, NOW()) - t.created_at))/3600) as avg_resolution_hours
FROM entities e
LEFT JOIN tickets t ON e.id = t.entity_id
LEFT JOIN ticket_statuses ts ON t.status_id = ts.id
LEFT JOIN ticket_priorities tp ON t.priority_id = tp.id
WHERE t.created_at >= NOW() - INTERVAL '30 days'
GROUP BY e.id, e.name;

COMMENT ON VIEW dashboard_metrics IS 'Métricas agregadas dos últimos 30 dias por entidade';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================