-- =====================================================
-- ROLES (Perfis de Acesso)
-- =====================================================

INSERT INTO roles (id, name, scope, created_at) VALUES
(
  '650e8400-e29b-41d4-a716-446655440000',
  'Admin',
  'global', -- ✅ CORRETO: scope global
  NOW()
),
(
  '650e8400-e29b-41d4-a716-446655440001',
  'Agent',
  'entity', -- ✅ CORRETO: scope entity
  NOW()
),
(
  '650e8400-e29b-41d4-a716-446655440002',
  'Client',
  'entity', -- ✅ CORRETO: scope entity
  NOW()
);
