CREATE TABLE tenants (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      VARCHAR(255) NOT NULL,
  slug      VARCHAR(100) UNIQUE NOT NULL, -- "empresa1"
  plan      VARCHAR(50) DEFAULT 'basic',
  active    BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cnpj         VARCHAR(18) UNIQUE,          -- 00.000.000/0001-00
  phone        VARCHAR(11),                 -- só dígitos
  email        VARCHAR(255),                -- email comercial
  address      VARCHAR(255),
  city         VARCHAR(100),
  state        VARCHAR(2),
  zip_code     VARCHAR(8),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE tenant_billing (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id            UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Cartão (só exibição)
  card_last_four       VARCHAR(4),
  card_brand           VARCHAR(50),
  card_holder_name     VARCHAR(255),
  card_expiry_month    SMALLINT,
  card_expiry_year     SMALLINT,

  -- Asaas
  asaas_customer_id    VARCHAR(255),   -- id do cliente no Asaas
  asaas_subscription_id VARCHAR(255),  -- id da assinatura no Asaas

  -- Preferência de pagamento
  payment_method       VARCHAR(50) DEFAULT 'credit_card', -- credit_card, boleto, pix

  billing_email        VARCHAR(255),

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

--rls
ALTER TABLE users ADD CONSTRAINT fk_users_tenant_id 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;