-- 1. Reabilitar RLS
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;



-- 3. Criar política INSERT
CREATE POLICY "Users can insert messages in tickets they participate in"
ON ticket_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_messages.ticket_id
    AND (
      t.requester_user_id = auth.uid()
      OR t.assigned_to_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.entity_id = t.entity_id
      )
    )
  )
);

-- 4. Criar política UPDATE (para read receipts)
CREATE POLICY "Users can update messages in tickets they participate in"
ON ticket_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_messages.ticket_id
    AND (
      t.requester_user_id = auth.uid()
      OR t.assigned_to_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.entity_id = t.entity_id
      )
    )
  )
);

-- Criar política autenticada
CREATE POLICY "authenticated_users_can_select"
ON ticket_messages
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);

-- Remover política permissiva ///////////////
DROP POLICY IF EXISTS "realtime_select_policy" ON ticket_messages;