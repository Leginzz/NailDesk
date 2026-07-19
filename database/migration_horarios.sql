-- ============================================================
-- Migración: Tabla de horarios del negocio
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS horario_negocio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dia_semana INT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_apertura TIME NOT NULL DEFAULT '09:00',
  hora_cierre TIME NOT NULL DEFAULT '19:00',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT horario_negocio_user_dia UNIQUE (user_id, dia_semana)
);

-- RLS
ALTER TABLE horario_negocio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "horario_negocio_select" ON horario_negocio
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "horario_negocio_insert" ON horario_negocio
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "horario_negocio_update" ON horario_negocio
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "horario_negocio_delete" ON horario_negocio
  FOR DELETE USING (auth.uid() = user_id);

-- Datos iniciales: lunes a viernes 9am-7pm, sábado 9am-5pm
-- Reemplaza 'TU_USER_ID_AQUI' con tu UUID
/*
INSERT INTO horario_negocio (user_id, dia_semana, hora_apertura, hora_cierre, activo) VALUES
  ('TU_USER_ID_AQUI', 1, '09:00', '19:00', true),
  ('TU_USER_ID_AQUI', 2, '09:00', '19:00', true),
  ('TU_USER_ID_AQUI', 3, '09:00', '19:00', true),
  ('TU_USER_ID_AQUI', 4, '09:00', '19:00', true),
  ('TU_USER_ID_AQUI', 5, '09:00', '19:00', true),
  ('TU_USER_ID_AQUI', 6, '09:00', '17:00', true),
  ('TU_USER_ID_AQUI', 0, '00:00', '00:00', false);
*/

COMMENT ON TABLE horario_negocio IS 'Horarios de apertura del salón por día de la semana';
