-- ============================================================
-- SaaS Salón de Uñas - Migración: Sistema de Admin
-- Ejecutar en SQL Editor de Supabase DESPUÉS del schema.sql
-- ============================================================

-- ============================================================
-- 1. TABLAS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modulos_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planes_suscripcion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  precio_mensual NUMERIC(10,2) NOT NULL DEFAULT 0,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plan_modulos (
  plan_id UUID NOT NULL REFERENCES planes_suscripcion(id) ON DELETE CASCADE,
  modulo_id UUID NOT NULL REFERENCES modulos_sistema(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, modulo_id)
);

CREATE TABLE IF NOT EXISTS suscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES planes_suscripcion(id),
  estado TEXT NOT NULL DEFAULT 'trial'
    CHECK (estado IN ('activo', 'suspendido', 'cancelado', 'trial')),
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT suscripciones_user_id_key UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS salon_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modulo_id UUID NOT NULL REFERENCES modulos_sistema(id) ON DELETE CASCADE,
  habilitado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT salon_modulos_user_modulo_key UNIQUE (user_id, modulo_id)
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_user ON suscripciones(user_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX IF NOT EXISTS idx_salon_modulos_user ON salon_modulos(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_modulos_plan ON plan_modulos(plan_id);

-- ============================================================
-- 3. TRIGGERS de updated_at
-- ============================================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON planes_suscripcion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON suscripciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. FUNCIÓN: is_admin() — SECURITY DEFINER
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.user_roles WHERE user_id = auth.uid()),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 5. SEED: Módulos del sistema
-- ============================================================
INSERT INTO modulos_sistema (clave, nombre, descripcion, icono, orden) VALUES
  ('dashboard',    'Dashboard',    'Resumen general del salón',         'layout-dashboard', 1),
  ('cotizador',    'Cotizador',    'Cotización de precios de servicios','calculator',       2),
  ('servicios',    'Servicios',    'Catálogo de servicios',             'scissors',         3),
  ('insumos',      'Insumos',      'Control de insumos y stock',        'package',          4),
  ('costos-fijos', 'Costos Fijos', 'Gastos fijos mensuales',            'receipt',          5),
  ('equipo',       'Equipo',       'Herramientas y depreciación',       'wrench',           6),
  ('extras',       'Extras',       'Servicios adicionales',             'plus-circle',      7),
  ('ventas',       'Ventas',       'Registro de ventas',                'shopping-cart',    8)
ON CONFLICT (clave) DO NOTHING;

-- ============================================================
-- 6. SEED: Planes de suscripción
-- ============================================================
INSERT INTO planes_suscripcion (nombre, slug, precio_mensual, descripcion) VALUES
  ('Gratuito', 'free',    0,    'Para empezar. Dashboard y configuración básica.'),
  ('Básico',   'basico',  299,  'Herramientas esenciales para tu salón.'),
  ('Premium',  'premium', 599,  'Acceso completo a todas las funcionalidades.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 7. SEED: Asignar módulos a cada plan
-- ============================================================
-- Free: solo dashboard + configuración
INSERT INTO plan_modulos (plan_id, modulo_id)
SELECT p.id, m.id
FROM planes_suscripcion p, modulos_sistema m
WHERE p.slug = 'free' AND m.clave IN ('dashboard', 'configuracion')
ON CONFLICT DO NOTHING;

-- Básico: dashboard + servicios + insumos + costos + extras + config
INSERT INTO plan_modulos (plan_id, modulo_id)
SELECT p.id, m.id
FROM planes_suscripcion p, modulos_sistema m
WHERE p.slug = 'basico' AND m.clave IN ('dashboard', 'servicios', 'insumos', 'costos-fijos', 'extras', 'configuracion')
ON CONFLICT DO NOTHING;

-- Premium: todo
INSERT INTO plan_modulos (plan_id, modulo_id)
SELECT p.id, m.id
FROM planes_suscripcion p, modulos_sistema m
WHERE p.slug = 'premium'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. TRIGGER: Auto-admin primer usuario registrado
-- ============================================================
CREATE OR REPLACE FUNCTION auto_admin_first_user()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_admin_first_user();

-- ============================================================
-- 9. TRIGGER: Auto-asignar plan Free a nuevos salones
-- ============================================================
CREATE OR REPLACE FUNCTION auto_free_subscription()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM public.planes_suscripcion WHERE slug = 'free' LIMIT 1;
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.suscripciones (user_id, plan_id, estado)
    VALUES (NEW.user_id, free_plan_id, 'trial')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_perfil_created
  AFTER INSERT ON perfiles_negocio
  FOR EACH ROW EXECUTE FUNCTION auto_free_subscription();

-- ============================================================
-- 10. RLS: Nuevas tablas
-- ============================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes_suscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_modulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_select_all" ON user_roles FOR SELECT USING (is_admin());
CREATE POLICY "user_roles_admin_insert" ON user_roles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "user_roles_admin_update" ON user_roles FOR UPDATE USING (is_admin());

CREATE POLICY "modulos_select_all" ON modulos_sistema FOR SELECT USING (true);
CREATE POLICY "modulos_admin_manage" ON modulos_sistema FOR ALL USING (is_admin());

CREATE POLICY "planes_select_all" ON planes_suscripcion FOR SELECT USING (true);
CREATE POLICY "planes_admin_manage" ON planes_suscripcion FOR ALL USING (is_admin());

CREATE POLICY "plan_modulos_select_all" ON plan_modulos FOR SELECT USING (true);
CREATE POLICY "plan_modulos_admin_manage" ON plan_modulos FOR ALL USING (is_admin());

CREATE POLICY "suscripciones_select_own" ON suscripciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "suscripciones_admin_select_all" ON suscripciones FOR SELECT USING (is_admin());
CREATE POLICY "suscripciones_admin_manage" ON suscripciones FOR ALL USING (is_admin());

CREATE POLICY "salon_modulos_select_own" ON salon_modulos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "salon_modulos_admin_select_all" ON salon_modulos FOR SELECT USING (is_admin());
CREATE POLICY "salon_modulos_admin_manage" ON salon_modulos FOR ALL USING (is_admin());

-- ============================================================
-- 11. ACTUALIZAR RLS: Tablas existentes con admin bypass
-- ============================================================
DROP POLICY IF EXISTS "perfiles_negocio_select" ON perfiles_negocio;
CREATE POLICY "perfiles_negocio_select" ON perfiles_negocio FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "perfiles_negocio_update" ON perfiles_negocio;
CREATE POLICY "perfiles_negocio_update" ON perfiles_negocio FOR UPDATE USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "perfiles_negocio_delete" ON perfiles_negocio;
CREATE POLICY "perfiles_negocio_delete" ON perfiles_negocio FOR DELETE USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "costos_fijos_select" ON costos_fijos;
CREATE POLICY "costos_fijos_select" ON costos_fijos FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "costos_fijos_update" ON costos_fijos;
CREATE POLICY "costos_fijos_update" ON costos_fijos FOR UPDATE USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "costos_fijos_delete" ON costos_fijos;
CREATE POLICY "costos_fijos_delete" ON costos_fijos FOR DELETE USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "equipo_herramientas_select" ON equipo_herramientas;
CREATE POLICY "equipo_herramientas_select" ON equipo_herramientas FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "equipo_herramientas_update" ON equipo_herramientas;
CREATE POLICY "equipo_herramientas_update" ON equipo_herramientas FOR UPDATE USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "equipo_herramientas_delete" ON equipo_herramientas;
CREATE POLICY "equipo_herramientas_delete" ON equipo_herramientas FOR DELETE USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insumos_select" ON insumos;
CREATE POLICY "insumos_select" ON insumos FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "insumos_update" ON insumos;
CREATE POLICY "insumos_update" ON insumos FOR UPDATE USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "insumos_delete" ON insumos;
CREATE POLICY "insumos_delete" ON insumos FOR DELETE USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "servicios_select" ON servicios;
CREATE POLICY "servicios_select" ON servicios FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "servicios_update" ON servicios;
CREATE POLICY "servicios_update" ON servicios FOR UPDATE USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "servicios_delete" ON servicios;
CREATE POLICY "servicios_delete" ON servicios FOR DELETE USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "servicio_insumos_select" ON servicio_insumos;
CREATE POLICY "servicio_insumos_select" ON servicio_insumos FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "servicio_insumos_update" ON servicio_insumos;
CREATE POLICY "servicio_insumos_update" ON servicio_insumos FOR UPDATE USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "servicio_insumos_delete" ON servicio_insumos;
CREATE POLICY "servicio_insumos_delete" ON servicio_insumos FOR DELETE USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "extras_select" ON extras;
CREATE POLICY "extras_select" ON extras FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "extras_update" ON extras;
CREATE POLICY "extras_update" ON extras FOR UPDATE USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "extras_delete" ON extras;
CREATE POLICY "extras_delete" ON extras FOR DELETE USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "ventas_select" ON ventas;
CREATE POLICY "ventas_select" ON ventas FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "ventas_update" ON ventas;
CREATE POLICY "ventas_update" ON ventas FOR UPDATE USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "ventas_delete" ON ventas;
CREATE POLICY "ventas_delete" ON ventas FOR DELETE USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "venta_extras_select" ON venta_extras;
CREATE POLICY "venta_extras_select" ON venta_extras FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "venta_extras_update" ON venta_extras;
CREATE POLICY "venta_extras_update" ON venta_extras FOR UPDATE USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "venta_extras_delete" ON venta_extras;
CREATE POLICY "venta_extras_delete" ON venta_extras FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- ============================================================
-- 12. HACER AL USUARIO ACTUAL COMO ADMIN
-- ============================================================
INSERT INTO user_roles (user_id, role)
VALUES ('db2e26d5-fb11-4d7d-bfd4-829763bc84c8', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
