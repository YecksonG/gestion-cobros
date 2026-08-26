# 🏢 Gestión de Cobros & Arrendamientos — Plataforma ERP Inmobiliaria

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema integral de gestión de arrendamientos, control de cobros recurrentes, cálculo dinámico de mora, conciliación multimoneda (USD, EUR, VEF) y módulo legal extrajudicial para propiedades residenciales y comerciales.

---

## 🌟 Características Principales

- 📑 **Gestión de Contratos & Clientes:** Administración completa de inquilinos, cánones fijados en USD/EUR, días de corte, fondos de garantía y depósito en cuotas.
- ⚡ **Backend de Alta Velocidad (Supabase PostgreSQL):** Consultas indexadas y transacciones atómicas con latencia `<30ms`.
- 💵 **Control de Cobros & Mora Dinámica:** Registro de pagos en tiempo real con cálculo automático de mora ($3 USD por día de retraso tras 5 días de gracia).
- 📅 **Agenda Interactiva de Cobranza:** Calendario mensual interactivo con discriminación de estados (`Al Día`, `Pendiente`, `Moroso`, `Por Renovar`).
- 💱 **Monitor Financiero Multitasa:** Sincronización en vivo con tasas oficiales BCV y paralelo (USDT) con calculadora multidivisa.
- ⚖️ **Módulo Legal & Expedientes:** Seguimiento de casos de morosidad prolongada, registro de comunicaciones e historial de notificaciones.
- 📊 **Dashboard Administrativo con PIN:** Gráficas de recaudación, morosidad por inmueble, KPIs proyectados y acceso protegido por PIN de seguridad.
- 🛡️ **Seguridad & Auditoría Inmutable:** Row Level Security (RLS) en todas las tablas, control de sesiones, protección anti-fuerza bruta y log de cambios.

---

## 🏗️ Arquitectura del Sistema

```mermaid
graph TD
    User([👤 Gestor / Administrador]) -->|React 19 SPA| UI[Frontend Vite + Tailwind CSS 4]
    
    subgraph Frontend Architecture
        UI --> Router[React Router 7]
        Router --> Dashboard[Dashboard Financiero & KPIs]
        Router --> Inquilinos[Gestión de Contratos & Inquilinos]
        Router --> Cobros[Control de Cobros & Recibos]
        Router --> Agenda[Agenda Mensual Interactiva]
        Router --> Legal[Módulo de Cobranza Legal]
        Router --> Tasas[Monitor de Tasas BCV / USDT]
    end
    
    subgraph Data & API Layer
        UI --> Adapter[Supabase Backend Adapter / api.js]
        Adapter --> AuthGuard[Session & PIN Guard]
        Adapter --> SupaClient[@supabase/supabase-js]
    end
    
    subgraph Cloud Database
        SupaClient --> PG[(Supabase PostgreSQL 15)]
        PG --> RLS[Row Level Security]
        PG --> Tables[(contratos, pagos, auditoria, tasas, casos_legales, usuarios)]
    end
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 19.2, Vite 8.0, Tailwind CSS 4, React Router 7 |
| **Componentes & UI** | React Hot Toast, React Datepicker, React IMask, Speed Insights |
| **Backend & Base de Datos** | Supabase (PostgreSQL 15), Row Level Security (RLS), Stored Procedures PL/pgSQL |
| **Despliegue** | Vercel Serverless Platform |

---

## 🚀 Instalación y Configuración Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/YecksonG/gestion-cobros.git
cd gestion-cobros
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` basado en `.env.example`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

### 4. Inicializar base de datos
Ejecuta el script SQL ubicado en `supabase/schema_gestion_cobros.sql` en el SQL Editor de tu proyecto Supabase.

### 5. Iniciar entorno de desarrollo
```bash
npm run dev
```

---

## 🔐 Credenciales de Demostración

| Rol | Correo Electrónico | Contraseña | PIN de Seguridad |
|---|---|---|---|
| **Administrador** | `admin@gestioncobros.com` | `admin123` | `0905` |
| **Gestor** | `gestor@gestioncobros.com` | `gestor123` | `0905` |

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

Desarrollado con ❤️ por [Yeckson González](https://github.com/YecksonG).
