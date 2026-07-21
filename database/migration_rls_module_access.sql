-- ============================================================
-- NailDesk - Migración: Control de acceso por módulo en RLS
-- Ejecutar en SQL Editor de Supabase DESPUÉS de migration_admin.sql
-- ============================================================
-- Esto previene que un usuario Free acceda a datos de módulos
-- que no le corresponden, incluso si usa la consola del navegador.
-- ============================================================

-- 1. FUNCIÓN: Verificar si el usuario actual tiene acceso a un módulo
CREATE OR REPLACE FUNCTION public.user_has_module_access(module_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_plan_id UUID;
  has_access BOOLEAN := false;
  salon_enabled BOOLEAN := false;
BEGIN
  -- Admins have access to everything
  IF is_admin() THEN
    RETURN true;
  END IF;

  -- Get user's active plan
  SELECT s.plan_id INTO user_plan_id
  FROM suscripciones s
  WHERE s.user_id = auth.uid()
    AND s.estado IN ('activo', 'trial')
  LIMIT 1;

  -- No active subscription = no access to paid modules
  IF user_plan_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if plan includes the module
  SELECT EXISTS(
    SELECT 1 FROM plan_modulos pm
    JOIN modulos_sistema m ON m.id = pm.modulo_id
    WHERE pm.plan_id = user_plan_id
      AND m.clave = module_slug
      AND m.activo = true
  ) INTO has_access;

  -- Also check salon-level override
  SELECT EXISTS(
    SELECT 1 FROM salon_modulos sm
    JOIN modulos_sistema m ON m.id = sm.modulo_id
    WHERE sm.user_id = auth.uid()
      AND m.clave = module_slug
      AND sm.habilitado = true
      AND m.activo = true
  ) INTO salon_enabled;

  RETURN has_access OR salon_enabled;
END;
$$;

-- 2. POLÍTICAS ACTUALIZADAS: costos_fijos → requiere módulo 'costos-fijos'
ALTER POLICY "costos_fijos_insert" ON costos_fijos
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND user_has_module_access('costos-fijos')
  );

ALTER POLICY "costos_fijos_select" ON costos_fijos
  TO authenticated
  USING (
    auth.uid() = user_id OR is_admin()
  );

-- 3. POLÍTICAS ACTUALIZADAS: equipo_herramientas → requiere módulo 'equipo'
ALTER POLICY "equipo_herramientas_insert" ON equipo_herramientas
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND user_has_module_access('equipo')
  );

ALTER POLICY "equipo_herramientas_select" ON equipo_herramientas
  TO authenticated
  USING (
    auth.uid() = user_id OR is_admin()
  );

-- 4. POLÍTICAS ACTUALIZADAS: insumos → requiere módulo 'insumos'
ALTER POLICY "insumos_insert" ON insumos
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND user_has_module_access('insumos')
  );

ALTER POLICY "insumos_select" ON insumos
  TO authenticated
  USING (
    auth.uid() = user_id OR is_admin()
  );

-- 5. POLÍTICAS ACTUALIZADAS: servicios → requiere módulo 'servicios'
ALTER POLICY "servicios_insert" ON servicios
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND user_has_module_access('servicios')
  );

ALTER POLICY "servicios_select" ON servicios
  TO authenticated
  USING (
    auth.uid() = user_id OR is_admin()
  );

-- 6. POLÍTICAS ACTUALIZADAS: servicio_insumos → requiere módulo 'servicios'
ALTER POLICY "servicio_insumos_insert" ON servicio_insumos
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND user_has_module_access('servicios')
  );

ALTER POLICY "servicio_insumos_select" ON servicio_insumos
  TO authenticated
  USING (
    auth.uid() = user_id OR is_admin()
  );

-- 7. POLÍTICAS ACTUALIZADAS: extras → requiere módulo 'extras'
ALTER POLICY "extras_insert" ON extras
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND user_has_module_access('extras')
  );

ALTER POLICY "extras_select" ON extras
  TO authenticated
  USING (
    auth.uid() = user_id OR is_admin()
  );

-- 8. POLÍTICAS ACTUALIZADAS: ventas → requiere módulo 'ventas'
ALTER POLICY "ventas_insert" ON ventas
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND user_has_module_access('ventas')
  );

ALTER POLICY "ventas_select" ON ventas
  TO authenticated
  USING (
    auth.uid() = user_id OR is_admin()
  );

-- 9. POLÍTICAS ACTUALIZADAS: venta_extras → requiere módulo 'ventas'
ALTER POLICY "venta_extras_insert" ON venta_extras
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND user_has_module_access('ventas')
  );

ALTER POLICY "venta_extras_select" ON venta_extras
  TO authenticated
  USING (
    auth.uid() = user_id OR is_admin()
  );

-- ============================================================
-- RESUMEN:
-- INSERT requiere: auth.uid() = user_id AND module access
-- SELECT/UPDATE/DELETE: auth.uid() = user_id OR is_admin()
-- (sin cambio en UPDATE/DELETE — si ya tiene el registro, puede editarlo)
-- ============================================================
-- NOTA: Las tablas perfiles_negocio, cotizaciones, cotizacion_items,
-- y configuración NO se bloquean — son accesibles para todos los planes.
-- ============================================================
