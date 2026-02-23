-- Habilitar RLS na tabela tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can view tickets based on role" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets based on role" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets based on role" ON tickets;

-- ========================================
-- POLICY 1: SELECT (visualizar tickets)
-- ========================================
CREATE POLICY "Users can view tickets based on role"
ON tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = auth.uid()
    AND (
      -- Admin (scope global) vê TUDO
      r.name = 'Admin'
      OR
      -- Agent (scope entity) vê TUDO
      r.name = 'Agent'
      OR
      -- Client (scope entity) vê APENAS seus tickets
      (r.name = 'Client' AND tickets.requester_user_id = auth.uid())
    )
  )
);

-- ========================================
-- POLICY 2: INSERT (criar tickets)
-- ========================================
CREATE POLICY "Users can create tickets based on role"
ON tickets
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = auth.uid()
    AND (
      -- Admin pode criar qualquer ticket
      r.name = 'Admin'
      OR
      -- Agent pode criar qualquer ticket
      r.name = 'Agent'
      OR
      -- Client pode criar ticket para si mesmo
      (r.name = 'Client' AND requester_user_id = auth.uid())
    )
  )
);

-- ========================================
-- POLICY 3: UPDATE (atualizar tickets)
-- ========================================
CREATE POLICY "Users can update tickets based on role"
ON tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = auth.uid()
    AND (
      -- Admin pode atualizar qualquer ticket
      r.name = 'Admin'
      OR
      -- Agent pode atualizar qualquer ticket
      r.name = 'Agent'
      OR
      -- Client pode atualizar apenas seus tickets
      (r.name = 'Client' AND tickets.requester_user_id = auth.uid())
    )
  )
);



-- Ver TODAS as policies da tabela tickets com detalhes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tickets'
ORDER BY policyname;