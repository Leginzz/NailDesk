# NailDesk — Manual de Usuario

**SaaS de Gestión para Salones de Uñas**

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Primeros Pasos](#2-primeros-pasos)
3. [Dashboard](#3-dashboard)
4. [Cotizador](#4-cotizador)
5. [Servicios](#5-servicios)
6. [Insumos](#6-insumos)
7. [Costos Fijos](#7-costos-fijos)
8. [Equipo y Herramientas](#8-equipo-y-herramientas)
9. [Extras](#9-extras)
10. [Registro de Ventas](#10-registro-de-ventas)
11. [Configuración](#11-configuración)
12. [Planes de Suscripción](#12-planes-de-suscripción)
13. [Panel de Administración](#13-panel-de-administración)
14. [Preguntas Frecuentes](#14-preguntas-frecuentes)

---

## 1. Introducción

**NailDesk** es una plataforma de gestión financiera diseñada específicamente para salones de uñas. Te permite controlar costos, inventario, precios, servicios y ventas desde un solo lugar, optimizando la rentabilidad de tu negocio.

### Módulos disponibles

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Resumen general con métricas financieras |
| **Cotizador** | Calculadora de costos y precios de servicios |
| **Servicios** | Catálogo de servicios offered por tu salón |
| **Insumos** | Control de inventario y stock |
| **Costos Fijos** | Registro de gastos fijos mensuales |
| **Equipo** | Control de herramientas y su depreciación |
| **Extras** | Servicios adicionales |
| **Ventas** | Registro y análisis de ventas |

---

## 2. Primeros Pasos

### Crear tu cuenta

1. Ve a la página de NailDesk
2. Haz clic en **Crear Cuenta**
3. Ingresa el nombre de tu salón
4. Ingresa tu correo electrónico y contraseña
5. Haz clic en **Crear Cuenta**

Tu cuenta se creará automáticamente en el **plan gratuito**, que incluye acceso al Dashboard y Configuración.

### Iniciar sesión

1. Ingresa tu correo electrónico
2. Ingresa tu contraseña
3. Haz clic en **Entrar**

### Navegación

- **En computadora**: El menú lateral izquierdo contiene todos los módulos
- **En celular**: Toca el ícono de menú (☰) para abrir el menú lateral
- **Cerrar sesión**: Haz clic en el ícono de salir (🚪) en la parte inferior del menú

---

## 3. Dashboard

El Dashboard es tu pantalla principal con un resumen completo de tu negocio.

### Tarjeta de bienvenida

Muestra la fecha actual, hora y un saludo personalizado con el nombre de tu salón. También muestra el número total de servicios e insumos en tu catálogo.

### Tarjetas de estadísticas

- **Ingresos**: Total de dinero cobrado en ventas
- **Ganancia**: Ingresos menos costos estimados (margen de ganancia)
- **Costos Fijos**: Total de gastos fijos mensuales
- **Catálogo**: Número de servicios e insumos registrados

### Gráfica de ventas recientes

Muestra una gráfica de barras con los ingresos y ganancias de los últimos 7 días. Los colores representan:
- **Rosa**: Ingresos
- **Verde**: Ganancia

### Lista de servicios

Muestra los primeros 6 servicios activos con sus precios. Haz clic en "Ver todos" para ir al módulo de Servicios.

### Alerta de stock bajo

Se muestra automáticamente cuando tienes insumos con 3 o menos usos disponibles. Te ayuda a reabastecer a tiempo.

---

## 4. Cotizador

El Cotizador te permite calcular el costo real de cada servicio y establecer precios justos y rentables.

### Agregar un servicio

1. Haz clic en **+ Nuevo Servicio**
2. Completa los campos:
   - **Nombre del servicio**: Ej. "Manicura Francesa"
   - **Tiempo estimado**: En horas (ej. 1.5 = 1 hora y 30 minutos)
3. Haz clic en **Guardar**

### Agregar insumos al servicio

En cada servicio, puedes agregar los insumos que utiliza:

1. Haz clic en **+ Agregar insumo**
2. Selecciona el insumo de tu catálogo
3. Ingresa la **cantidad por servicio** (cuántas veces se usa ese insumo en cada servicio)

### Agregar extras al servicio

Los extras son servicios adicionales que el cliente puede elegir:

1. Haz clic en **+ Agregar extra**
2. Selecciona el extra de tu catálogo

### Calcular precio

El sistema calcula automáticamente:

- **Costo total de insumos**: Suma del costo de cada insumo × cantidad
- **Costo fijo por hora**: Tus costos fijos divididos entre las horas que trabajas al mes
- **Costo total del servicio**: Costo de insumos + (horas del servicio × costo fijo por hora)
- **Precio sugerido**: Costo total + margen de ganancia deseado

### Generar PDF de cotización

Haz clic en **Generar PDF** para descargar una cotización profesional con:
- Datos de tu salón
- Desglose detallado del servicio
- Lista de insumos utilizados
- Precio final

---

## 5. Servicios

Gestiona el catálogo completo de servicios que ofrece tu salón.

### Agregar un servicio

1. Haz clic en **+ Nuevo Servicio**
2. Completa:
   - **Nombre**: Nombre del servicio
   - **Precio**: Precio de venta al cliente
   - **Tiempo estimado**: Duración en horas
3. Haz clic en **Guardar**

### Editar o eliminar un servicio

- Haz clic en el ícono de **editar** (pencil) para modificar
- Haz clic en el ícono de **eliminar** (trash) para borrar

### Gestionar insumos del servicio

Haz clic en **Insumos** junto a cada servicio para:
- Agregar insumos que utiliza
- Especificar la cantidad usada por servicio
- Ver el costo total de insumos

---

## 6. Insumos

Controla todo el inventario de productos que utilizas en tus servicios.

### Agregar un insumo

1. Haz clic en **+ Nuevo Insumo**
2. Completa:
   - **Producto**: Nombre del insumo (ej. "Esmalte rojo")
   - **Unidad**: Medida (pieza, ml, gr, etc.)
   - **Stock total**: Cantidad total disponible
   - **Costo por unidad**: Precio de compra por unidad
3. Haz clic en **Guardar**

### Calcular costo por uso

El sistema calcula automáticamente cuánto cuesta cada uso del insumo:

**Costo por uso = Costo por unidad / Usos totales**

### Control de stock

- **Stock actual**: Usos restantes disponibles
- **Stock total**: Usos totales que tenía originalmente
- **Alerta**: Se marca en rojo cuando el stock llega a 3 o menos

### Reabastecer

Cuando un insumo se agota, puedes:
1. Actualizar el stock total con la nueva cantidad
2. El sistema recalculará el costo por uso automáticamente

---

## 7. Costos Fijos

Registra todos los gastos fijos mensuales de tu salón.

### Ejemplos de costos fijos

- Renta del local
- Servicio de luz
- Servicio de agua
- Internet
- Salarios
- Seguro
- Limpieza

### Agregar un costo fijo

1. Haz clic en **+ Nuevo Costo**
2. Completa:
   - **Concepto**: Descripción del gasto
   - **Monto mensual**: Costo por mes
   - **Periodicidad**: Mensual, quincenal, etc.
3. Haz clic en **Guardar**

### Cómo se usan

Los costos fijos se dividen entre las horas de trabajo al mes para calcular el **costo fijo por hora**. Este costo se incluye automáticamente en el cálculo de precios del Cotizador.

**Fórmula**: Costo fijo por hora = Total costos fijos / Horas de trabajo al mes

---

## 8. Equipo y Herramientas

Registra las herramientas y equipo de tu salón para controlar su depreciación.

### Agregar equipo

1. Haz clic en **+ Nuevo Equipo**
2. Completa:
   - **Nombre**: Herramienta o equipo
   - **Precio de compra**: Cuánto costó
   - **Fecha de compra**: Cuándo lo compraste
   - **Vida útil estimada**: Cuántos meses durará
3. Haz clic en **Guardar**

### Depreciación mensual

El sistema calcula automáticamente cuánto pierde de valor cada herramienta por mes:

**Depreciación mensual = Precio de compra / Vida útil en meses**

Esto te ayuda a planificar cuándo necesitarás reemplazar equipo.

---

## 9. Extras

Registra servicios adicionales que puedes ofrecer junto con tus servicios principales.

### Ejemplos de extras

- Uñas acrílicas adicionales
- Diseño especial
- Arte Nail
- Cambio de color
- Baño de gel

### Agregar un extra

1. Haz clic en **+ Nuevo Extra**
2. Completa:
   - **Nombre**: Nombre del extra
   - **Precio**: Costo adicional
3. Haz clic en **Guardar**

### Uso

Los extras se pueden agregar a cualquier servicio desde el Cotizador para calcular el precio total.

---

## 10. Registro de Ventas

Registra cada venta que realizas para tener un control financiero completo.

### Registrar una venta

1. Haz clic en **+ Nueva Venta**
2. Completa:
   - **Fecha**: Día de la venta
   - **Cliente**: Nombre del cliente
   - **Servicio**: Selecciona el servicio realizado
   - **Precio cobrado**: Cuánto cobraste (puede ser diferente al precio de lista)
   - **Método de pago**: Efectivo, tarjeta, transferencia, etc.
   - **Extras**: Servicios adicionales incluidos
3. Haz clic en **Guardar**

### Análisis de ventas

El sistema muestra automáticamente:
- **Ingresos totales**: Suma de todo lo cobrado
- **Costos totales**: Suma de costos estimados
- **Ganancia neta**: Diferencia entre ingresos y costos
- **Margen de ganancia**: Porcentaje de ganancia
- **Ventas por método de pago**: Distribución de cobros

### Filtros y búsqueda

Puedes filtrar ventas por:
- Rango de fechas
- Método de pago
- Nombre de cliente

### Exportar

Haz clic en **Exportar CSV** para descargar un archivo con todas tus ventas.

---

## 11. Configuración

Personaliza tu cuenta y configuración general.

### Datos del salón

- **Nombre del salón**: Nombre que aparece en tu cuenta y en los PDFs de cotización
- **Logo del salón**: Imagen que aparece en las cotizaciones

### Horario de negocio

Configura los días y horas en que trabajas. Esta información se usa para calcular el costo fijo por hora.

- Selecciona los días que abres
- Establece hora de apertura y cierre

### Exportar datos

Puedes exportar tu información como archivo PDF o CSV.

---

## 12. Planes de Suscripción

NailDesk ofrece diferentes planes según las necesidades de tu salón.

### Plan Gratuito (Trial)

**Precio: Gratis**

Acceso a:
- Dashboard con estadísticas básicas
- Configuración del salón

### Plan Básico — $299/mes

Incluye todo lo del Gratuito más:
- Cotizador completo
- Servicios
- Insumos
- Costos Fijos
- Extras

### Plan Premium — $599/mes

Acceso completo a todas las funcionalidades:
- Todos los módulos del Básico
- Equipo y Herramientas
- Registro de Ventas avanzado
- Análisis financiero completo

### Cambiar de plan

Para mejorar tu plan, contacta al administrador por WhatsApp directamente desde el banner de upgrade que aparece en tu Dashboard.

---

## 13. Panel de Administración

*Accesible solo para administradores del sistema*

### Gestión de Salones

Visualiza y administra todos los salones registrados:
- Ver lista de salones con su plan y estado
- Activar o suspender salones
- Cambiar el plan de un salón
- Ver detalles de cada salón

### Gestión de Suscripciones

Administra las suscripciones:
- Ver todas las suscripciones con su estado
- Cambiar el plan de un usuario
- Activar, suspender o cancelar suscripciones
- Editar fechas de inicio y fin

### Planes de Suscripción

Crea y administra los planes:
- Crear nuevos planes
- Editar nombre, precio y descripción
- Asignar módulos a cada plan (activar/desactivar)

### Ingresos SaaS

Dashboard de métricas del negocio SaaS:
- **MRR** (Ingresos Recurrentes Mensuales)
- **ARR** (Ingresos Recurrentes Anuales)
- **Tasa de conversión** (Trial → Pago activo)
- Gráficas de ingresos por plan y distribución por estado

### Config Banner

Configura el banner de upgrade que ven los usuarios del plan gratuito:
- Activar/desactivar el banner
- Editar título, mensaje y texto del botón
- Configurar número de WhatsApp
- Vista previa en tiempo real

### Notificaciones

La campana 🔔 en el header muestra notificaciones cuando:
- Se registra un nuevo salón
- Otros eventos importantes del sistema

---

## 14. Preguntas Frecuentes

### ¿Qué pasa cuando me registro?

1. Se crea tu cuenta automáticamente
2. Se te asigna el plan Gratuito (trial)
3. Tienes acceso al Dashboard y Configuración
4. Para desbloquear más módulos, mejora tu plan

### ¿Cómo calcula el sistema los precios?

El Cotizador suma:
1. Costo de todos los insumos que utiliza el servicio
2. Porción de costos fijos mensuales proporcional al tiempo del servicio
3. Agrega el margen de ganancia que tú definas

### ¿Puedo usar la app en celular?

Sí. NailDesk es 100% responsive y funciona en cualquier navegador del celular.

### ¿Mis datos están seguros?

Sí. Cada salón tiene sus propios datos aislados. Solo tú puedes ver tu información (y los administradores del sistema en caso de soporte).

### ¿Cómo contacto soporte?

Usa el botón de WhatsApp que aparece en el banner de upgrade, o contacta directamente al administrador del sistema.

### ¿Puedo exportar mis datos?

Sí. Desde Configuración puedes exportar tu información en formato PDF o CSV.

---

**NailDesk** — Gestión inteligente para salones de uñas.
