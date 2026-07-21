-- ============================================================
-- NailDesk — Migración: Configuración del Banner de Upgrade
-- Ejecutar en SQL Editor de Supabase DESPUÉS de migration_admin.sql
-- ============================================================

-- 1. TABLA
CREATE TABLE IF NOT EXISTS banner_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activo BOOLEAN NOT NULL DEFAULT true,
  titulo TEXT NOT NULL DEFAULT 'Desbloquea todo tu potencial',
  mensaje TEXT NOT NULL DEFAULT 'Estás en el plan gratuito. Con el plan Básico obtienes Servicios, Insumos, Costos Fijos, Equipo y más.',
  cta_texto TEXT NOT NULL DEFAULT 'Mejorar a Básico — $299/mes',
  whatsapp_numero TEXT NOT NULL DEFAULT '527831391020',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TRIGGER updated_at
CREATE TRIGGER IF NOT EXISTS set_updated_at BEFORE UPDATE ON banner_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. SEED: Insertar config por defecto (solo si no existe)
INSERT INTO banner_config (activo, titulo, mensaje, cta_texto, whatsapp_numero)
SELECT true,
  'Desbloquea todo tu potencial',
  'Estás en el plan gratuito. Con el plan Básico obtienes Servicios, Insumos, Costos Fijos, Equipo y más.',
  'Mejorar a Básico — $299/mes',
  '527831391020'
WHERE NOT EXISTS (SELECT 1 FROM banner_config LIMIT 1);

-- 4. RLS
ALTER TABLE banner_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banner_config_select_all" ON banner_config
  FOR SELECT USING (true);
CREATE POLICY "banner_config_admin_manage" ON banner_config
  FOR ALL USING (is_admin());

-- ============================================================
-- FIN
-- ============================================================
