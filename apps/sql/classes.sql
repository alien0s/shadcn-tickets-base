-- 
-- SÉRIES (Anos letivos fixos — universais, não por tenant)
-- Ex: Maternal, Pré I, Pré II, 1º Ano, 2º Ano... (governo define)
-- 
CREATE TABLE series (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  education_level_id UUID NOT NULL REFERENCES education_levels(id) ON DELETE RESTRICT,
  name               VARCHAR(50) NOT NULL,             -- Ex: "Maternal", "1º Ano", "2º Ano"
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (education_level_id, name)   -- Uma série por nível de ensino
);


-- 
-- TURMAS/CLASSES (Criadas pela escola com base em uma série)
-- Ex: 1º Ano A, 1º Ano B (mesma série, turmas diferentes)
-- 
CREATE TABLE classes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  series_id   UUID NOT NULL REFERENCES series(id) ON DELETE RESTRICT,
   shift       SMALLINT NOT NULL CHECK (shift IN (1, 2, 3)),
              -- 1 = Matutino | 2 = Vespertino | 3 = Noturno
  suffix      VARCHAR(2) NOT NULL,                   -- Ex: "A", "B", "C"
  year        SMALLINT NOT NULL,                      -- Ex: 2026
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (school_id, series_id, suffix, shift, year)  -- Evita 1º A duplicado na mesma escola/ano
);



insert into series (education_level_id,name) values
('db94ccc7-8d99-4b21-9df2-4e6e9d8488e1','Maternal'),
('db94ccc7-8d99-4b21-9df2-4e6e9d8488e1','Pré I'),
('db94ccc7-8d99-4b21-9df2-4e6e9d8488e1','Pré II'),
('a34b7090-e5af-45bf-8c09-23fa08da8424','1º ano'),
('a34b7090-e5af-45bf-8c09-23fa08da8424','2º ano'),
('a34b7090-e5af-45bf-8c09-23fa08da8424','3º ano'),
('a34b7090-e5af-45bf-8c09-23fa08da8424','4º ano'),
('a34b7090-e5af-45bf-8c09-23fa08da8424','5º ano'),
('6b756763-af0f-4d96-bb9d-f43b9939754f','6º ano'),
('6b756763-af0f-4d96-bb9d-f43b9939754f','7º ano'),
('6b756763-af0f-4d96-bb9d-f43b9939754f','8º ano'),
('6b756763-af0f-4d96-bb9d-f43b9939754f','9º ano'),
('b53961e7-61e8-47e0-b460-5f5747be99fc','1º ano'),
('b53961e7-61e8-47e0-b460-5f5747be99fc','2º ano'),
('b53961e7-61e8-47e0-b460-5f5747be99fc','3º ano')