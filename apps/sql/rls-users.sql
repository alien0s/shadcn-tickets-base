-- 1) Garantir RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2) Limpar policy anterior (se existir)
DROP POLICY IF EXISTS "users_select_for_realtime_profiles" ON users;

-- 3) Policy de SELECT para realtime de perfil (nome/avatar)
CREATE POLICY "users_select_for_realtime_profiles"
ON users
FOR SELECT
USING (
  -- próprio usuário
  id = auth.uid()

  OR

  -- Admin vê todos
  EXISTS (
    SELECT 1
    FROM users me
    JOIN roles r ON r.id = me.role_id
    WHERE me.id = auth.uid()
      AND r.name = 'Admin'
  )

  OR

  -- Agent vê usuários da mesma entidade
  EXISTS (
    SELECT 1
    FROM users me
    JOIN roles r ON r.id = me.role_id
    WHERE me.id = auth.uid()
      AND r.name = 'Agent'
      AND me.entity_id = users.entity_id
  )

  OR

  -- Client/participante vê perfis envolvidos nos seus tickets
  EXISTS (
    SELECT 1
    FROM tickets t
    WHERE (t.requester_user_id = auth.uid() OR t.assigned_to_user_id = auth.uid())
      AND (t.requester_user_id = users.id OR t.assigned_to_user_id = users.id)
  )
);
