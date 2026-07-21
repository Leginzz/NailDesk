-- ============================================================
-- NailDesk — Migración: Tabla de Notificaciones
-- Ejecutar en SQL Editor de Supabase DESPUÉS de migration_admin.sql
-- ============================================================

-- 1. TABLA
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'info',
  titulo TEXT NOT NULL,
  mensaje TEXT,
  leido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_notificaciones_user ON notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido ON notificaciones(leido);

-- 3. RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificaciones_select_own" ON notificaciones
  FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "notificaciones_update_own" ON notificaciones
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "notificaciones_insert_system" ON notificaciones
  FOR INSERT WITH CHECK (true);

-- 4. TRIGGER: Notificar admin cuando se registra un nuevo salón
CREATE OR REPLACE FUNCTION notify_admin_new_salon()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notificaciones (user_id, tipo, titulo, mensaje)
  SELECT
    ur.user_id,
    'nuevo_registro',
    'Nuevo salón registrado',
    'Se registró "' || NEW.nombre_salon || '" (' || NEW.user_id::text || '). Plan: Gratuito (trial).'
  FROM user_roles ur
  WHERE ur.role = 'admin';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER IF NOT EXISTS on_perfil_notify_admin
  AFTER INSERT ON perfiles_negocio
  FOR EACH ROW EXECUTE FUNCTION notify_admin_new_salon();

-- ============================================================
-- FIN
-- ============================================================
