CREATE TABLE subject_workloads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

  series_id        UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE, -- 🔥 série (1º, 2º, 3º ano)
  subject_id      UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,

  weekly_classes  SMALLINT NOT NULL, -- 🔥 principal (ex: 4 aulas por semana)
  annual_hours    SMALLINT,          -- opcional (pode ser calculado)

  is_mandatory    BOOLEAN DEFAULT true,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (school_id, series_id, subject_id)
);
