-- =====================================================
-- ROLES (Perfis de Acesso)
-- =====================================================

INSERT INTO roles (id, name, scope, created_at) VALUES
(
  '650e8400-e29b-41d4-a716-446655440000',
  'root',
  'root',
  NOW()
),
(
  '056b9643-551e-4360-ac1d-411bf28477f0',
  'admin',
  'tenant',
  NOW()
),
(
  '650e8400-e29b-41d4-a716-446655440001',
  'Agent',
  'tenant', -- ✅ CORRETO: scope entity
  NOW()
),
(
  '650e8400-e29b-41d4-a716-446655440002',
  'Client',
  'tenant', -- ✅ CORRETO: scope entity
  NOW()
);
