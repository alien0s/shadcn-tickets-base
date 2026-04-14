-- 
-- NÍVEIS DE ENSINO
-- Exemplos: Ensino Infantil, Ensino Fundamental I,
--           Ensino Fundamental II, Ensino Médio
-- 
CREATE TABLE education_levels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,         -- Ex: "Ensino Médio"
  abbreviation VARCHAR(10),                  -- Ex: "EM", "EF1", "EF2", "EI"
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


insert into education_levels (name,abbreviation) values 
('Ensino Médio','EM'),
('Ensino Fundamental I','EF1'),
('Ensino Fundamental II','EF2'),
('Educação Infantil','EI')

-- 
-- HORÁRIOS (slots de aula)
-- Define cada bloco de aula dentro de um turno
-- Ex: 07:00–07:50, 07:50–08:40...
-- 
CREATE TABLE time_slots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, -- RLS
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE, -- filtro
  shift       SMALLINT NOT NULL CHECK (shift IN (1, 2, 3)),--turno 1=manhã, 2=tarde, 3=noite
  order_index SMALLINT NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_break    BOOLEAN DEFAULT false,--indica se é um intervalo
  break_label VARCHAR(50),--ex: "Recreio", "Almoço"
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, shift, order_index)
);

-- 
-- GRADE HORÁRIA
-- Liga turma + professor + disciplina + dia + horário
-- É o coração do sistema
-- 
CREATE TABLE schedules (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,  -- RLS
  school_id    UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,  -- filtro
  class_id     UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id   UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id   UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ DEFAULT NOW(),

  -- Evita professor em dois lugares ao mesmo tempo na mesma escola
  CONSTRAINT uq_schedules_teacher_slot_day_school
    UNIQUE (school_id, teacher_id, time_slot_id, day_of_week),

  -- Evita turma com duas aulas no mesmo horário na mesma escola
  CONSTRAINT uq_schedules_class_slot_day_school
    UNIQUE (school_id, class_id, time_slot_id, day_of_week)
);