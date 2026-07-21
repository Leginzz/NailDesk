-- ============================================================
-- Migración: Tablas de Cotizaciones
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_nombre TEXT,
  notas TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  iva NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  guardada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cotizacion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('servicio', 'extra')),
  item_id UUID,
  nombre TEXT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  costo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotizaciones_select" ON cotizaciones
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cotizaciones_insert" ON cotizaciones
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cotizaciones_update" ON cotizaciones
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cotizaciones_delete" ON cotizaciones
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "cotizacion_items_select" ON cotizacion_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cotizacion_items_insert" ON cotizacion_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cotizacion_items_update" ON cotizacion_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cotizacion_items_delete" ON cotizacion_items
  FOR DELETE USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cotizaciones_user ON cotizaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_user ON cotizacion_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_cotizacion ON cotizacion_items(cotizacion_id);

-- Trigger updated_at
CREATE TRIGGER IF NOT EXISTS set_updated_at BEFORE UPDATE ON cotizaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE cotizaciones IS 'Cotizaciones generadas por el cotizador';
COMMENT ON TABLE cotizacion_items IS 'Líneas de detalle de cada cotización (servicios y extras)';
