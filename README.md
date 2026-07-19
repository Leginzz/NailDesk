# NailDesk — SaaS para Salones de Uñas

Sistema multi-tenant de gestión financiera, inventario y costeo avanzado para salones de uñas. Construido con JavaScript vanilla, Tailwind CSS y Supabase.

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-181717?style=flat&logo=github)](https://leginzz.github.io/NailDesk/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3FCF8E?style=flat&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-Propietaria-red)](LICENSE)

---

## Funcionalidades

### Módulos Principales

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Resumen financiero, KPIs, gráficas de ventas y costos |
| **Cotizador** | Generador de cotizaciones PDF con costeo automático |
| **Servicios** | Catálogo con cálculo de costo por servicio |
| **Insumos** | Control de inventario con rendimiento y costo por uso |
| **Costos Fijos** | Registro de renta, luz, agua, internet, etc. |
| **Equipo/Herramientas** | Depreciación por vida útil y costo por servicio |
| **Extras** | Productos y servicios adicionales |
| **Ventas** | Registro con cálculo automático de ganancia |
| **Reportes** | Análisis de rentabilidad por servicio y período |

### Sistema Admin (SaaS)

| Función | Descripción |
|---------|-------------|
| **Gestión de Salones** | Ver todos los salones registrados |
| **Planes** | Free ($0), Básico ($299), Premium ($599) |
| **Suscripciones** | Asignar y controlar planes por salón |
| **Módulos** | Asignación granular de funcionalidades |
| **Ingresos SaaS** | Dashboard de MRR, ARR, churn y ARPU |
| **Banner** | Configurar mensaje de upgrade + WhatsApp |

---

## Arquitectura

```
naildesk/
├── index.html              # SPA shell (router hash-based)
├── css/
│   └── styles.css          # Paleta Nude Minimal
├── js/
│   ├── supabase.js         # Conexión a Supabase
│   ├── auth.js             # Autenticación
│   ├── app.js              # Router principal + block screen
│   ├── services/
│   │   ├── app-state.js    # Estado global (rol, suscripción, módulos)
│   │   └── supabase-service.js
│   ├── components/
│   │   ├── sidebar.js      # Navegación dinámica por módulos
│   │   ├── modal.js        # Modal reutilizable
│   │   ├── toast.js        # Notificaciones toast
│   │   ├── notifications.js # Campana admin con badge
│   │   └── upgrade-banner.js # Banner Free → upgrade
│   └── views/
│       ├── dashboard.js
│       ├── cotizador.js
│       ├── servicios.js
│       ├── insumos.js
│       ├── costos-fijos.js
│       ├── equipo.js
│       ├── extras.js
│       ├── ventas.js
│       ├── reportes.js
│       ├── config.js
│       └── admin/
│           ├── admin-salones.js
│           ├── admin-planes.js
│           ├── admin-suscripciones.js
│           ├── admin-ingresos.js
│           └── admin-banner.js
└── database/
    ├── schema.sql
    ├── seed_data.sql
    ├── migration_admin.sql
    ├── migration_horarios.sql
    ├── migration_cotizaciones.sql
    ├── migration_notificaciones.sql
    └── migration_banner.sql
```

---

## Stack Tecnológico

- **Frontend:** JavaScript vanilla, Tailwind CSS (CDN), Chart.js
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **UI:** Lucide Icons, Google Fonts (Playfair Display + Inter)
- **PDF:** jsPDF para cotizaciones
- **Deploy:** GitHub Pages

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Leginzz/NailDesk.git
cd NailDesk
```

### 2. Configurar Supabase

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar en orden:
   - `database/schema.sql`
   - `database/seed_data.sql` (reemplazar `TU_USER_ID_AQUI`)
   - `database/migration_admin.sql`
   - `database/migration_horarios.sql`
   - `database/migration_cotizaciones.sql`
   - `database/migration_notificaciones.sql`
   - `database/migration_banner.sql`

### 3. Configurar variables

En `js/supabase.js`, actualizar:

```javascript
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU-ANON-KEY';
```

### 4. Ejecutar en local

```bash
# Con Python
python -m http.server 8080

# O con Node.js
npx serve .
```

Abrir `http://localhost:8080`

---

## Deploy a GitHub Pages

1. Push a la rama `main`
2. Ir a **Settings → Pages**
3. Seleccionar **Deploy from a branch** → `main` → `/ (root)`
4. La app estará en: `https://leginzz.github.io/NailDesk/`

### Configurar Supabase Auth

En **Authentication → URL Configuration**:
- **Site URL:** `https://leginzz.github.io/NailDesk`

---

## Modelo de Datos

### Multi-Tenant (RLS)

Todas las tablas tienen:
- Columna `user_id UUID NOT NULL`
- Row Level Security (RLS) habilitado
- Políticas por tabla: SELECT, INSERT, UPDATE, DELETE
- Filtro: `auth.uid() = user_id`

Un usuario **nunca** puede ver o modificar datos de otro salón.

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `perfiles_negocio` | Datos del salón |
| `servicios` | Catálogo de servicios |
| `insumos` | Materiales e inventario |
| `costos_fijos` | Gastos fijos mensuales |
| `equipo_herramientas` | Herramientas con depreciación |
| `extras` | Productos/servicios adicionales |
| `ventas` | Registro de ventas |
| `venta_extras` | Detalle de extras por venta |
| `servicio_insumos` | Relación servicio ↔ insumos |
| `suscripciones` | Planes y estados de suscripción |
| `notificaciones` | Notificaciones admin |
| `banner_config` | Configuración del banner de upgrade |

### Columnas Calculadas

| Columna | Cálculo |
|---------|---------|
| `equipo_herramientas.costo_por_servicio` | `costo_compra / vida_util_servicios` |
| `insumos.costo_por_uso` | `costo_compra / rendimiento` |
| `ventas.ganancia` | `precio_cobrado - costo_estimado` |
| `venta_extras.subtotal` | `cantidad * precio_unitario` |

---

## Planes

| Plan | Precio | Módulos |
|------|--------|---------|
| **Free** | $0/mes | Dashboard, Servicios, Insumos, Configuración |
| **Básico** | $299/mes | + Costos Fijos, Equipo, Extras, Ventas, Reportes |
| **Premium** | $599/mes | + Cotizador + Soporte prioritario |

---

## Documentación

- [Manual de Usuario](docs/manual-usuario.md) — Guía completa de uso
- [Manual PDF](docs/manual-naildesk.pdf) — Versión para imprimir (436KB)

---

## Autor

**Luis Garcia** — [Leginzz](https://github.com/Leginzz)

---

## Licencia

Propietaria. Todos los derechos reservados.
