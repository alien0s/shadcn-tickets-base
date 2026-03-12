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
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 
-- PROFESSOR → DISCIPLINAS (N:N)
-- Um professor pode dar várias disciplinas
-- 
CREATE TABLE teacher_subjects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (teacher_id, subject_id)
);
-- 
-- CARGA HORÁRIA
-- Limite de horas de uma disciplina por nível de ensino
-- 
CREATE TABLE subject_workloads (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  school_id          UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_id         UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  education_level_id UUID NOT NULL REFERENCES education_levels(id) ON DELETE CASCADE,
  
  annual_hours       SMALLINT NOT NULL,     -- Ex: 200 horas/ano
  
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  
  -- Cada escola define carga horária por disciplina + nível
  UNIQUE (school_id, subject_id, education_level_id)
);