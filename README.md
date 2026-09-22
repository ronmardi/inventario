# 📦 Sistema de Inventario TI - Plataforma Multi-Tenant

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript)

Una plataforma SaaS moderna y segura para la gestión de activos tecnológicos, asignaciones de equipos y control de mantenimiento. Construida con arquitectura Server-Side Rendering (SSR), diseño *Liquid Glassmorphism* y bases de datos relacionales con transacciones atómicas.

## ✨ Características Principales

- **Arquitectura Multi-Tenant:** Aislamiento total de datos por cliente/empresa (`client_id`) forzado a nivel de base de datos usando **Row Level Security (RLS)** de PostgreSQL.
- **Escáner Integrado:** Detección de Códigos QR y Códigos de Barras nativa en el navegador mediante `BarcodeDetector API` para auditorías de inventario ultrarrápidas.
- **Transacciones Atómicas (RPC):** Lógica compleja (como registrar un mantenimiento y actualizar el estado del activo simultáneamente) ejecutada directamente en PostgreSQL vía Remote Procedure Calls (RPC) para garantizar 100% de consistencia en los datos.
- **Seguridad Activa:** 
  - Prevención de **CSV Injection** en exportación de reportes.
  - Protección contra inyecciones NoSQL/PostgREST en la sanitización de URLs.
  - Middlewares y validaciones Server-Side para bloqueo de rutas según roles.
- **UI/UX Premium:** Interfaz unificada con patrón *Liquid Glass* (cristal esmerilado 3D), soporte nativo nativo para Modo Oscuro/Claro y tipografías auto-hospedadas (sin dependencia externa de Google Fonts).

---

## 🔐 Roles y Permisos (RBAC)

El sistema soporta Control de Acceso Basado en Roles (Role-Based Access Control) con 3 niveles:

| Rol | Nivel de Acceso | Capacidad |
| :--- | :--- | :--- |
| **`superadmin`** | Acceso Total | Gestiona la empresa, configuración, ubicaciones, categorías, usuarios y todos los activos. |
| **`it_technician`** | Operativo Avanzado | Puede registrar, modificar, asignar y dar de baja equipos, además de gestionar mantenimientos. No tiene acceso a la facturación o perfil root de la empresa. |
| **`employee`** | Sólo Lectura / Básico | Solo puede visualizar el inventario y someterse a asignaciones. No tiene acceso a la Configuración ni al Perfil de Empresa (menús ocultos dinámicamente y bloqueados por SSR 403). |

---

## 🗄️ Esquema de Base de Datos (Supabase / Postgres)

El sistema se compone de tablas interconectadas diseñadas para integridad referencial estricta:

1. **`clients`**: Tabla Tenant (Empresas). Almacena logo, moneda, nombre.
2. **`profiles`**: Extensión de Supabase Auth. Vincula un `auth.uid()` con un `client_id` y su `role`.
3. **`categories` & `locations`**: Catálogos dinámicos por empresa.
4. **`assets`**: Tabla central del inventario (Hardware, licencias, periféricos).
5. **`asset_assignments`**: Historial inmutable (Log) de a quién se le asignó un equipo, en qué condición se entregó y cuándo se devolvió.
6. **`maintenance_logs`**: Bitácora financiera y técnica de las fallas, reparaciones y costos asociados a los activos.

*Todas las tablas cuentan con políticas RLS (Row Level Security) estrictas garantizando que `auth.uid() -> profiles.client_id == table.client_id`.*

---

## 🚀 Instalación y Despliegue Local

### 1. Clonar el repositorio
```bash
git clone [https://github.com/ronmardi/inventario.git](https://github.com/ronmardi/inventario.git)
cd tu-repo