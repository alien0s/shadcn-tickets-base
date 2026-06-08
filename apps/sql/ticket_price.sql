CREATE TABLE ticket_price (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  school_id          UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_id         UUID REFERENCES subjects(id) ON DELETE CASCADE,          -- Pode ser NULL
  education_level_id UUID REFERENCES education_levels(id) ON DELETE CASCADE,  -- Pode ser NULL
  price_per_lesson   DECIMAL(10, 2) NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),

  -- Permite qualquer combinação, desde que não seja tudo NULL
  UNIQUE (school_id, subject_id, education_level_id),
  CHECK (subject_id IS NOT NULL OR education_level_id IS NOT NULL)
);
