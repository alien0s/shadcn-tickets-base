-- teachers fica assim
CREATE TABLE teachers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, -- RLS
  school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE, -- filtro real
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  avatar_url TEXT,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 
-- DISCIPLINAS
-- 
CREATE TABLE subjects (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               VARCHAR(100) NOT NULL,  -- Ex: "História", "Matemática"
  icon               VARCHAR(50), -- nome lucide do ícone da disciplina
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

