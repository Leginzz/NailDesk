-- ============================================================
-- SaaS Salón de Uñas - Datos Iniciales (Seed Data)
-- Basado en: Costeo_y_Precios_Unas.xlsx
-- ============================================================
-- IMPORTANTE: Reemplaza 'TU_USER_ID_AQUI' con tu UUID de auth.users
-- Lo encuentras en: Supabase Dashboard > Authentication > Users
-- ============================================================

-- Descomentar y ejecutar DESPUÉS de crear el schema
-- Reemplazar el UUID por el tuyo

DO $$
DECLARE
  mi_user_id UUID := 'db2e26d5-fb11-4d7d-bfd4-829763bc84c8';
BEGIN

-- ============================================================
-- PERFIL DE NEGOCIO
-- ============================================================
INSERT INTO perfiles_negocio (user_id, nombre_salon, tarifa_mano_obra_hora, horas_trabajo_mes)
VALUES (mi_user_id, 'Mi Salón', 120, 144);

-- ============================================================
-- COSTOS FIJOS (de la hoja "Costos Fijos")
-- ============================================================
INSERT INTO costos_fijos (user_id, concepto, costo_mensual) VALUES
  (mi_user_id, 'Renta del local / espacio', 3000),
  (mi_user_id, 'Luz', 2000),
  (mi_user_id, 'Agua', 200),
  (mi_user_id, 'Internet / teléfono', 500),
  (mi_user_id, 'Publicidad', 0),
  (mi_user_id, 'Otros gastos fijos', 500);

-- ============================================================
-- EQUIPO Y HERRAMIENTAS (de la hoja "Equipo y Herramientas")
-- ============================================================
INSERT INTO equipo_herramientas (user_id, herramienta, costo_compra, vida_util_servicios) VALUES
  (mi_user_id, 'Micromotor', 600, 3000),
  (mi_user_id, 'Lámpara UV/LED', 500, 3000),
  (mi_user_id, 'Lámpara de campana (lupa)', 800, 3000),
  (mi_user_id, 'Mesa de manicura', 2800, 3000),
  (mi_user_id, 'Silla / banco', 1700, 2000),
  (mi_user_id, 'Extractor de polvo', 700, 3000),
  (mi_user_id, 'Reposabrazos', 450, 3000),
  (mi_user_id, 'Esterilizador', 350, 3000),
  (mi_user_id, 'Carrito', 400, 3000),
  (mi_user_id, 'Alicate', 100, 50),
  (mi_user_id, 'Empujador de cutícula', 400, 50);

-- ============================================================
-- INSUMOS (de la hoja "Insumos")
-- ============================================================
INSERT INTO insumos (user_id, producto, presentacion, costo_compra, rendimiento) VALUES
  (mi_user_id, 'Polvo acrílico (frasco)', '450 g', 850, 90),
  (mi_user_id, 'Líquido monómero', '90 ml', 220, 100),
  (mi_user_id, 'Gel de color (frasco)', '15 ml', 90, 40),
  (mi_user_id, 'Top coat', '15 ml', 120, 40),
  (mi_user_id, 'Tips / puntas (caja)', '550 pzas (70 sets)', 220, 70),
  (mi_user_id, 'Lima desechable', '1 pieza', 15, 5),
  (mi_user_id, 'Pats algodón', 'bolsa 100 g', 60, 100),
  (mi_user_id, 'Brocas', '4 pz', 10, 1),
  (mi_user_id, 'Acetona pura', '237 ml', 10, 1);

-- ============================================================
-- SERVICIOS (de la hoja "Servicios")
-- ============================================================
INSERT INTO servicios (user_id, nombre, tiempo_horas, costo_materiales, costo_total, porcentaje_ganancia, precio_sugerido, precio_redondeado) VALUES
  (mi_user_id, 'Uñas acrílicas (juego completo)', 3, 17.79, 520.00, 50, 780.01, 790),
  (mi_user_id, 'Manicure en gel', 2, 5.25, 344.41, 45, 499.40, 500),
  (mi_user_id, 'Retiro de uñas / Acrílico', 1, 0, 176.11, 50, 264.16, 270),
  (mi_user_id, 'Polygel', 0, 0, 13.05, 0, 13.05, 20),
  (mi_user_id, 'Gel semipermanente', 0, 0, 13.05, 0, 13.05, 20),
  (mi_user_id, 'Nail Art', 0, 0, 13.05, 0, 13.05, 20);

-- ============================================================
-- EXTRAS (de la hoja "Extras y Adicionales")
-- ============================================================
INSERT INTO extras (user_id, nombre, costo_aprox, porcentaje_ganancia, precio_sugerido, precio_redondeado) VALUES
  (mi_user_id, 'Diseño / decoración (por uña)', 6, 60, 9.60, 10),
  (mi_user_id, 'Gemas o pedrería (por uña)', 4, 100, 8.00, 10),
  (mi_user_id, 'Extensión de largo', 15, 50, 22.50, 25),
  (mi_user_id, 'Retiro de acrílico/gel de otra estética', 30, 40, 42.00, 45),
  (mi_user_id, 'Diseño 3D (por uña)', 12, 70, 20.40, 25),
  (mi_user_id, 'Francés (french)', 10, 50, 15.00, 15);

-- ============================================================
-- DETALLE SERVICIO ↔ INSUMO
-- (de la hoja "Detalle por Servicio")
-- Usa subqueries para obtener los IDs por nombre
-- ============================================================

-- Uñas acrílicas: Polvo acrílico
INSERT INTO servicio_insumos (user_id, servicio_id, insumo_id, usos_gastados, costo_total)
SELECT mi_user_id, s.id, i.id, 1, 9.44
FROM servicios s, insumos i
WHERE s.user_id = mi_user_id AND s.nombre = 'Uñas acrílicas (juego completo)'
  AND i.user_id = mi_user_id AND i.producto = 'Polvo acrílico (frasco)';

-- Uñas acrílicas: Líquido monómero
INSERT INTO servicio_insumos (user_id, servicio_id, insumo_id, usos_gastados, costo_total)
SELECT mi_user_id, s.id, i.id, 1, 2.20
FROM servicios s, insumos i
WHERE s.user_id = mi_user_id AND s.nombre = 'Uñas acrílicas (juego completo)'
  AND i.user_id = mi_user_id AND i.producto = 'Líquido monómero';

-- Uñas acrílicas: Tips / puntas
INSERT INTO servicio_insumos (user_id, servicio_id, insumo_id, usos_gastados, costo_total)
SELECT mi_user_id, s.id, i.id, 1, 3.14
FROM servicios s, insumos i
WHERE s.user_id = mi_user_id AND s.nombre = 'Uñas acrílicas (juego completo)'
  AND i.user_id = mi_user_id AND i.producto = 'Tips / puntas (caja)';

-- Uñas acrílicas: Top coat
INSERT INTO servicio_insumos (user_id, servicio_id, insumo_id, usos_gastados, costo_total)
SELECT mi_user_id, s.id, i.id, 1, 3.00
FROM servicios s, insumos i
WHERE s.user_id = mi_user_id AND s.nombre = 'Uñas acrílicas (juego completo)'
  AND i.user_id = mi_user_id AND i.producto = 'Top coat';

-- Manicure en gel: Gel de color
INSERT INTO servicio_insumos (user_id, servicio_id, insumo_id, usos_gastados, costo_total)
SELECT mi_user_id, s.id, i.id, 1, 2.25
FROM servicios s, insumos i
WHERE s.user_id = mi_user_id AND s.nombre = 'Manicure en gel'
  AND i.user_id = mi_user_id AND i.producto = 'Gel de color (frasco)';

-- Manicure en gel: Top coat
INSERT INTO servicio_insumos (user_id, servicio_id, insumo_id, usos_gastados, costo_total)
SELECT mi_user_id, s.id, i.id, 1, 3.00
FROM servicios s, insumos i
WHERE s.user_id = mi_user_id AND s.nombre = 'Manicure en gel'
  AND i.user_id = mi_user_id AND i.producto = 'Top coat';

-- Retiro de uñas: Brocas
INSERT INTO servicio_insumos (user_id, servicio_id, insumo_id, usos_gastados, costo_total)
SELECT mi_user_id, s.id, i.id, 1, 10.00
FROM servicios s, insumos i
WHERE s.user_id = mi_user_id AND s.nombre = 'Retiro de uñas / Acrílico'
  AND i.user_id = mi_user_id AND i.producto = 'Brocas';

-- Retiro de uñas: Pats algodón
INSERT INTO servicio_insumos (user_id, servicio_id, insumo_id, usos_gastados, costo_total)
SELECT mi_user_id, s.id, i.id, 3, 1.80
FROM servicios s, insumos i
WHERE s.user_id = mi_user_id AND s.nombre = 'Retiro de uñas / Acrílico'
  AND i.user_id = mi_user_id AND i.producto = 'Pats algodón';

END $$;
