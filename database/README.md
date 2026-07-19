# Arquitectura de Base de Datos - SaaS Salón de Uñas

## Archivos SQL

| Archivo | Descripción |
|---|---|
| `schema.sql` | Schema completo: tablas, índices, triggers, RLS, vistas |
| `seed_data.sql` | Datos iniciales basados en el Excel de costeo |

## Instrucciones de Ejecución

### Paso 1: Crear el schema
1. Abrir **Supabase Dashboard** → tu proyecto → **SQL Editor**
2. Copiar el contenido completo de `schema.sql`
3. Pegar en el editor y hacer clic en **Run**
4. Verificar que no hay errores en el log

### Paso 2: Insertar datos de prueba
1. En `seed_data.sql`, reemplazar `'TU_USER_ID_AQUI'` con tu UUID real
   - Lo encuentras en: **Authentication → Users → tu usuario → UUID**
2. Copiar el contenido (incluyendo el bloque `DO $$`)
3. Pegar en el SQL Editor y ejecutar

### Paso 3: Verificar
1. Ir a **Table Editor** en Supabase
2. Verificar que las tablas aparecen con datos
3. Probar una query:
```sql
SELECT * FROM vista_resumen_negocio;
```

## Modelo de Datos

### Relaciones

```
perfiles_negocio (1) ──── (N) costos_fijos
perfiles_negocio (1) ──── (N) equipo_herramientas
perfiles_negocio (1) ──── (N) insumos
perfiles_negocio (1) ──── (N) servicios
perfiles_negocio (1) ──── (N) extras
perfiles_negocio (1) ──── (N) ventas

servicios (1) ──── (N) servicio_insumos
insumos   (1) ──── (N) servicio_insumos

ventas (1) ──── (N) venta_extras
extras (1) ──── (N) venta_extras
```

### Multi-Tenant (RLS)

Todas las tablas tienen:
- Columna `user_id UUID NOT NULL` referenciando `auth.users`
- **Row Level Security (RLS)** habilitado
- 4 políticas (SELECT, INSERT, UPDATE, DELETE) por tabla
- Filtro: `auth.uid() = user_id`

Resultado: un usuario **nunca** puede ver o modificar datos de otro salón.

### Columnas Calculadas (Generated Always)

| Tabla | Columna | Cálculo |
|---|---|---|
| `equipo_herramientas` | `costo_por_servicio` | `costo_compra / vida_util_servicios` |
| `insumos` | `costo_por_uso` | `costo_compra / rendimiento` |
| `ventas` | `ganancia` | `precio_cobrado - costo_estimado` |
| `venta_extras` | `subtotal` | `cantidad * precio_unitario` |

### Vista: `vista_resumen_negocio`

Consolida:
- Datos del perfil del salón
- Suma de costos fijos mensuales
- Costo fijo por hora calculado
- Conteo de servicios e insumos activos
