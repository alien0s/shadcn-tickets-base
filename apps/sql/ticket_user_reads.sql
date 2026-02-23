-- Tabela para rastrear última leitura de cada usuário por ticket
CREATE TABLE ticket_user_reads (
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_message_id UUID REFERENCES ticket_messages(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (ticket_id, user_id)
);

COMMENT ON TABLE ticket_user_reads IS 'Rastreia quando cada usuário leu um ticket pela última vez';
COMMENT ON COLUMN ticket_user_reads.last_read_at IS 'Timestamp da última vez que o usuário marcou o ticket como lido';
COMMENT ON COLUMN ticket_user_reads.last_read_message_id IS 'ID da última mensagem lida (opcional, para referência)';


-- Índices para performance nas queries ///////////////////////
CREATE INDEX idx_ticket_user_reads_user_id ON ticket_user_reads(user_id);
CREATE INDEX idx_ticket_user_reads_ticket_id ON ticket_user_reads(ticket_id);
CREATE INDEX idx_ticket_user_reads_last_read_at ON ticket_user_reads(last_read_at);


-- Função auxiliar para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_ticket_user_reads_updated_at
  BEFORE UPDATE ON ticket_user_reads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View que calcula mensagens não lidas por usuário/ticket
CREATE OR REPLACE VIEW ticket_unread_counts AS
SELECT
  t.id AS ticket_id,
  u.id AS user_id,
  COUNT(tm.id) FILTER (
    WHERE
      (tur.last_read_at IS NULL OR tm.created_at > tur.last_read_at)
      AND tm.sender_user_id IS DISTINCT FROM u.id
      AND tm.type IN ('text', 'image', 'file')
  ) AS unread_count
FROM users u
JOIN roles r ON r.id = u.role_id
JOIN tickets t
  ON (
    r.name = 'Admin'
    OR (r.name = 'Agent' AND t.entity_id = u.entity_id)
    OR (r.name = 'Client' AND (t.requester_user_id = u.id OR t.assigned_to_user_id = u.id))
  )
LEFT JOIN ticket_messages tm
  ON tm.ticket_id = t.id
LEFT JOIN ticket_user_reads tur
  ON tur.ticket_id = tm.ticket_id
  AND tur.user_id = u.id
GROUP BY t.id, u.id;

COMMENT ON VIEW ticket_unread_counts IS 'Calcula o número de mensagens não lidas por usuário em cada ticket';



-- Habilitar realtime nas tabelas necessárias
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_user_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

--------------------------------------------------- teste
-- Habilitar RLS
ALTER TABLE ticket_user_reads ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário vê só os próprios registros
CREATE POLICY "users_can_select_own_ticket_reads"
ON ticket_user_reads
FOR SELECT
USING (user_id = auth.uid());

-- INSERT: usuário só insere para si mesmo
CREATE POLICY "users_can_insert_own_ticket_reads"
ON ticket_user_reads
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: usuário só atualiza os próprios registros
CREATE POLICY "users_can_update_own_ticket_reads"
ON ticket_user_reads
FOR UPDATE
USING (user_id = auth.uid());
