-- ============================================================
-- SaaS Salón de Uñas - Schema Completo
-- Multi-tenant con RLS en Supabase
-- ============================================================
-- Ejecutar este script completo en el SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- 1. PERFILES DE NEGOCIO
-- Reemplaza: hoja "Lista de Precios" (encabezado del salón)
-- Cada usuario puede tener UN solo perfil de negocio
-- ============================================================
CREATE TABLE IF NOT EXISTS perfiles_negocio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_salon TEXT NOT NULL DEFAULT 'Mi Salón',
  telefono TEXT,
  email_contacto TEXT,
  direccion TEXT,
  moneda TEXT NOT NULL DEFAULT 'MXN',
  tarifa_mano_obra_hora NUMERIC(10,2) NOT NULL DEFAULT 120.00,
  horas_trabajo_mes INT NOT NULL DEFAULT 144,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT perfiles_negocio_user_id_key UNIQUE (user_id)
);

-- ============================================================
-- 2. COSTOS FIJOS
-- Reemplaza: hoja "Costos Fijos"
-- Cada fila es un concepto de gasto fijo mensual
-- ============================================================
CREATE TABLE IF NOT EXISTS costos_fijos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  costo_mensual NUMERIC(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. EQUIPO Y HERRAMIENTAS
-- Reemplaza: hoja "Equipo y Herramientas"
-- Depreciación amortizada por servicio
-- ============================================================
CREATE TABLE IF NOT EXISTS equipo_herramientas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  herramienta TEXT NOT NULL,
  costo_compra NUMERIC(10,2) NOT NULL DEFAULT 0,
  vida_util_servicios INT NOT NULL DEFAULT 3000,
  costo_por_servicio NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN vida_util_servicios > 0
      THEN ROUND(costo_compra / vida_util_servicios, 2)
      ELSE 0
    END
  ) STORED,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. INSUMOS / PRODUCTOS
-- Reemplaza: hoja "Insumos"
-- Cada fila es un producto consumible del salón
-- ============================================================
CREATE TABLE IF NOT EXISTS insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producto TEXT NOT NULL,
  presentacion TEXT,
  costo_compra NUMERIC(10,2) NOT NULL DEFAULT 0,
  rendimiento INT NOT NULL DEFAULT 1,
  costo_por_uso NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN rendimiento > 0
      THEN ROUND(costo_compra / rendimiento, 2)
      ELSE 0
    END
  ) STORED,
  stock_actual NUMERIC(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. SERVICIOS
-- Reemplaza: hoja "Servicios"
-- Catálogo de servicios que ofrece el salón
-- ============================================================
CREATE TABLE IF NOT EXISTS servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tiempo_horas NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  costo_materiales NUMERIC(10,2) NOT NULL DEFAULT 0,
  costo_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  porcentaje_ganancia NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  precio_sugerido NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_redondeado NUMERIC(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. DETALLE SERVICIO ↔ INSUMO (Many-to-Many)
-- Reemplaza: hoja "Detalle por Servicio"
-- Relaciona qué insumos consume cada servicio y en qué cantidad
-- ============================================================
CREATE TABLE IF NOT EXISTS servicio_insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  servicio_id UUID NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  insumo_id UUID NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  usos_gastados NUMERIC(10,2) NOT NULL DEFAULT 1,
  costo_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT servicio_insumos_servicio_insumo_key UNIQUE (servicio_id, insumo_id)
);

-- ============================================================
-- 7. EXTRAS / ADICIONALES
-- Reemplaza: hoja "Extras y Adicionales"
-- Servicios adicionales que se agregan a un servicio base
-- ============================================================
CREATE TABLE IF NOT EXISTS extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  costo_aprox NUMERIC(10,2) NOT NULL DEFAULT 0,
  porcentaje_ganancia NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  precio_sugerido NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_redondeado NUMERIC(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. REGISTRO DE VENTAS
-- Reemplaza: hoja "Registro de Ventas"
-- Cada fila es una venta/consulta realizada
-- ============================================================
CREATE TABLE IF NOT EXISTS ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente_nombre TEXT,
  servicio_id UUID REFERENCES servicios(id) ON DELETE SET NULL,
  servicio_nombre TEXT,
  precio_sugerido NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_cobrado NUMERIC(10,2) NOT NULL DEFAULT 0,
  costo_estimado NUMERIC(10,2) NOT NULL DEFAULT 0,
  ganancia NUMERIC(10,2) GENERATED ALWAYS AS (
    precio_cobrado - costo_estimado
  ) STORED,
  metodo_pago TEXT NOT NULL DEFAULT 'Efectivo',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. DETALLE DE VENTA (extras aplicados)
-- Relaciona una venta con los extras que se le aplicaron
-- ============================================================
CREATE TABLE IF NOT EXISTS venta_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES extras(id) ON DELETE CASCADE,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (
    cantidad * precio_unitario
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_costos_fijos_user ON costos_fijos(user_id);
CREATE INDEX IF NOT EXISTS idx_equipo_user ON equipo_herramientas(user_id);
CREATE INDEX IF NOT EXISTS idx_insumos_user ON insumos(user_id);
CREATE INDEX IF NOT EXISTS idx_servicios_user ON servicios(user_id);
CREATE INDEX IF NOT EXISTS idx_servicio_insumos_user ON servicio_insumos(user_id);
CREATE INDEX IF NOT EXISTS idx_servicio_insumos_servicio ON servicio_insumos(servicio_id);
CREATE INDEX IF NOT EXISTS idx_extras_user ON extras(user_id);
CREATE INDEX IF NOT EXISTS idx_ventas_user ON ventas(user_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_venta_extras_user ON venta_extras(user_id);
CREATE INDEX IF NOT EXISTS idx_venta_extras_venta ON venta_extras(venta_id);

-- ============================================================
-- FUNCIÓN para auto-actualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para tablas con columna updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON perfiles_negocio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON costos_fijos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON equipo_herramientas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON insumos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON servicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON extras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON ventas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Asegura que cada usuario solo vea/modifique SUS datos
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE perfiles_negocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE costos_fijos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipo_herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_extras ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------
-- POLÍTICAS: perfiles_negocio
-- -----------------------------------------------------------
CREATE POLICY "perfiles_negocio_select" ON perfiles_negocio
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "perfiles_negocio_insert" ON perfiles_negocio
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "perfiles_negocio_update" ON perfiles_negocio
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "perfiles_negocio_delete" ON perfiles_negocio
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------
-- POLÍTICAS: costos_fijos
-- -----------------------------------------------------------
CREATE POLICY "costos_fijos_select" ON costos_fijos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "costos_fijos_insert" ON costos_fijos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "costos_fijos_update" ON costos_fijos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "costos_fijos_delete" ON costos_fijos
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------
-- POLÍTICAS: equipo_herramientas
-- -----------------------------------------------------------
CREATE POLICY "equipo_herramientas_select" ON equipo_herramientas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "equipo_herramientas_insert" ON equipo_herramientas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "equipo_herramientas_update" ON equipo_herramientas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "equipo_herramientas_delete" ON equipo_herramientas
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------
-- POLÍTICAS: insumos
-- -----------------------------------------------------------
CREATE POLICY "insumos_select" ON insumos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insumos_insert" ON insumos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insumos_update" ON insumos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "insumos_delete" ON insumos
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------
-- POLÍTICAS: servicios
-- -----------------------------------------------------------
CREATE POLICY "servicios_select" ON servicios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "servicios_insert" ON servicios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "servicios_update" ON servicios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "servicios_delete" ON servicios
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------
-- POLÍTICAS: servicio_insumos
-- -----------------------------------------------------------
CREATE POLICY "servicio_insumos_select" ON servicio_insumos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "servicio_insumos_insert" ON servicio_insumos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "servicio_insumos_update" ON servicio_insumos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "servicio_insumos_delete" ON servicio_insumos
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------
-- POLÍTICAS: extras
-- -----------------------------------------------------------
CREATE POLICY "extras_select" ON extras
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "extras_insert" ON extras
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "extras_update" ON extras
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "extras_delete" ON extras
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------
-- POLÍTICAS: ventas
-- -----------------------------------------------------------
CREATE POLICY "ventas_select" ON ventas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ventas_insert" ON ventas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ventas_update" ON ventas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ventas_delete" ON ventas
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------
-- POLÍTICAS: venta_extras
-- -----------------------------------------------------------
CREATE POLICY "venta_extras_select" ON venta_extras
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "venta_extras_insert" ON venta_extras
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "venta_extras_update" ON venta_extras
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "venta_extras_delete" ON venta_extras
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- VISTA: Resumen del perfil de negocio (costo fijo por hora)
-- Útil para el frontend: obtener el perfil + métricas calculadas
-- ============================================================
CREATE OR REPLACE VIEW vista_resumen_negocio
WITH (security_invoker = true) AS
SELECT
  p.id AS perfil_id,
  p.user_id,
  p.nombre_salon,
  p.tarifa_mano_obra_hora,
  p.horas_trabajo_mes,
  COALESCE(SUM(cf.costo_mensual), 0) AS total_costos_fijos,
  CASE
    WHEN p.horas_trabajo_mes > 0
    THEN ROUND(COALESCE(SUM(cf.costo_mensual), 0) / p.horas_trabajo_mes, 2)
    ELSE 0
  END AS costo_fijo_por_hora,
  (SELECT COUNT(*) FROM servicios s WHERE s.user_id = p.user_id AND s.activo = true) AS total_servicios,
  (SELECT COUNT(*) FROM insumos i WHERE i.user_id = p.user_id AND i.activo = true) AS total_insumos
FROM perfiles_negocio p
LEFT JOIN costos_fijos cf ON cf.user_id = p.user_id AND cf.activo = true
GROUP BY p.id, p.user_id, p.nombre_salon, p.tarifa_mano_obra_hora, p.horas_trabajo_mes;

-- ============================================================
-- COMENTARIOS DE TABLAS (documentación en la DB)
-- ============================================================
COMMENT ON TABLE perfiles_negocio IS 'Datos generales del salón de uñas (multi-tenant)';
COMMENT ON TABLE costos_fijos IS 'Gastos fijos mensuales del salón (renta, luz, etc.)';
COMMENT ON TABLE equipo_herramientas IS 'Herramientas y equipo con depreciación amortizada';
COMMENT ON TABLE insumos IS 'Productos consumibles del salón';
COMMENT ON TABLE servicios IS 'Catálogo de servicios offered por el salón';
COMMENT ON TABLE servicio_insumos IS 'Relación many-to-many: qué insumos consume cada servicio';
COMMENT ON TABLE extras IS 'Servicios adicionales / extras (diseño, gemas, etc.)';
COMMENT ON TABLE ventas IS 'Registro de ventas y consultas realizadas';
COMMENT ON TABLE venta_extras IS 'Extras aplicados en cada venta';
COMMENT ON VIEW vista_resumen_negocio IS 'Vista consolidada: perfil + costos fijos totales + costo por hora';

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
