-- Status de Tickets
CREATE TABLE ticket_statuses (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prioridades de Tickets
CREATE TABLE ticket_priorities (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tipos de Tickets
CREATE TABLE ticket_types (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);



-- =====================================================
-- 3. TICKETS
-- =====================================================

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  subject TEXT NOT NULL,
  status_id INTEGER NOT NULL REFERENCES ticket_statuses(id) ON DELETE RESTRICT,
  priority_id INTEGER NOT NULL REFERENCES ticket_priorities(id) ON DELETE RESTRICT,
  type_id INTEGER NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  os_id INTEGER REFERENCES operating_systems(id) ON DELETE SET NULL,
  browser VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_tickets_status_id ON tickets(status_id);
CREATE INDEX idx_tickets_priority_id ON tickets(priority_id);
CREATE INDEX idx_tickets_type_id ON tickets(type_id);
CREATE INDEX idx_tickets_requester_user_id ON tickets(requester_user_id);
CREATE INDEX idx_tickets_entity_id ON tickets(entity_id);
CREATE INDEX idx_tickets_assigned_to_user_id ON tickets(assigned_to_user_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_status_entity ON tickets(status_id, entity_id);

-- =====================================================
-- 4. ARQUIVOS
-- =====================================================

-- Arquivos de Tickets
CREATE TABLE ticket_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(100) NOT NULL,
  preview_url TEXT,
  file_size BIGINT,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_files_uploaded_by ON ticket_files(uploaded_by_user_id);

-- Relacionamento Ticket <-> Arquivos
CREATE TABLE ticket_files_relation (
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES ticket_files(id) ON DELETE CASCADE,
  attached_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (ticket_id, file_id)
);

CREATE INDEX idx_ticket_files_relation_ticket ON ticket_files_relation(ticket_id);
CREATE INDEX idx_ticket_files_relation_file ON ticket_files_relation(file_id);

-- =====================================================
-- 5. MENSAGENS DO CHAT
-- =====================================================

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'text',
  sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_type VARCHAR(50) NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  CONSTRAINT valid_type CHECK (type IN ('text', 'file', 'image', 'system')),
  CONSTRAINT valid_sender_type CHECK (sender_type IN ('agent', 'customer', 'system'))
);

CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_sender_user_id ON ticket_messages(sender_user_id);
CREATE INDEX idx_ticket_messages_created_at ON ticket_messages(ticket_id, created_at);

-- Relacionamento Mensagem <-> Arquivos
CREATE TABLE message_files_relation (
  message_id UUID NOT NULL REFERENCES ticket_messages(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES ticket_files(id) ON DELETE CASCADE,
  attached_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (message_id, file_id)
);

CREATE INDEX idx_message_files_relation_message ON message_files_relation(message_id);
CREATE INDEX idx_message_files_relation_file ON message_files_relation(file_id);

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para tickets
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


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

COMMENT ON TABLE tickets IS 'Tickets de suporte criados pelos usuários';
COMMENT ON COLUMN tickets.title IS 'Título resumido do ticket';
COMMENT ON COLUMN tickets.subject IS 'Descrição detalhada do problema/solicitação';
COMMENT ON COLUMN tickets.browser IS 'Navegador do usuário (ex: Chrome 120.0, Firefox 115)';
///////////////////////
COMMENT ON TABLE ticket_messages IS 'Mensagens trocadas dentro de cada ticket';
COMMENT ON COLUMN ticket_messages.sender_type IS 'Tipo do remetente: agent (agente), customer (cliente), system (sistema)';
COMMENT ON COLUMN ticket_messages.delivered_at IS 'Quando a mensagem foi entregue';
COMMENT ON COLUMN ticket_messages.read_at IS 'Quando a mensagem foi lida';

COMMENT ON TABLE ticket_files IS 'Arquivos anexados aos tickets ou mensagens';
COMMENT ON COLUMN ticket_files.file_size IS 'Tamanho do arquivo em bytes';



-- Habilitar RLS nas tabelas principais
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_files ENABLE ROW LEVEL SECURITY;

-- Exemplo de política: usuários só veem tickets da própria entidade
CREATE POLICY "Users can view tickets from their entity"
  ON tickets FOR SELECT
  USING (
    entity_id IN (
      SELECT entity_id FROM users WHERE id = auth.uid()
    )
  );

-- Exemplo de política: usuários só podem enviar mensagens nos tickets da própria entidade
CREATE POLICY "Users can insert messages in their entity tickets"
  ON chat_messages FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT t.id FROM tickets t
      JOIN users u ON t.entity_id = u.entity_id
      WHERE u.id = auth.uid()
    )
  );

  -- RLS na tabela tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_tickets" ON tickets
  FOR SELECT
  USING (
    -- Admin vê tudo
    (current_setting('app.user_role', true) = 'admin')
    OR
    -- Customer vê seus tickets
    (customer_id::text = current_setting('app.user_id', true))
    OR
    -- Agent vê tickets atribuídos
    (assigned_agent_id::text = current_setting('app.user_id', true))
  );