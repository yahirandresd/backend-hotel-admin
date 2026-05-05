# Rooma 🏨

**Rooma** es un SaaS de gestión hotelera desarrollado por [NetVuk Interactive](https://netvuk.com), diseñado para hoteles boutique, cabañas y operadores turísticos en Colombia. Permite gestionar reservaciones, huéspedes, habitaciones, actividades, planes y pagos desde una sola plataforma.

---

## ✨ Características

- 🔗 **Links de reserva únicos** — el admin genera un enlace personalizado y se lo envía al cliente para que registre sus datos
- 🏠 **Gestión de habitaciones** — tipos de habitación, estados y asignación por huésped
- 👥 **Gestión de huéspedes** — titular y acompañantes con requisitos (vacunas, declaraciones)
- 🎯 **Actividades y eventos** — pasadías, rafting, senderismo con control de cupos y gastos operativos
- 📦 **Planes todo incluido** — paquetes con hospedaje, actividades y servicios a precio fijo
- 💰 **Pagos** — registro de abonos con múltiples métodos de pago
- 📊 **Utilidad por actividad** — ingresos vs gastos por evento para saber cuánto se gana

---

## 🧱 Stack Tecnológico

### Backend
| Tecnología | Uso |
|---|---|
| [NestJS](https://nestjs.com) | Framework principal |
| [TypeORM](https://typeorm.io) | ORM para PostgreSQL |
| [PostgreSQL](https://www.postgresql.org) | Base de datos |
| [Supabase](https://supabase.com) | Autenticación y JWT |
| [class-validator](https://github.com/typestack/class-validator) | Validación de DTOs |
| [Helmet](https://helmetjs.github.io) | Headers de seguridad HTTP |
| [@nestjs/throttler](https://github.com/nestjs/throttler) | Rate limiting |

### Frontend
| Tecnología | Uso |
|---|---|
| [React](https://react.dev) | UI |
| [TypeScript](https://www.typescriptlang.org) | Tipado estático |
| [Tailwind CSS](https://tailwindcss.com) | Estilos |
| [Vite](https://vitejs.dev) | Build tool |

---

## 📁 Estructura del Proyecto (Backend)

```
src/
  auth/                        # Guard de Supabase y decorador @Public()
  common/
    filters/                   # HttpExceptionFilter global
  config/
    database.config.ts         # Configuración de TypeORM
  tipo-habitacion/             # Catálogo de tipos de habitación
  habitacion/                  # Habitaciones físicas del hotel
  servicios/                   # Extras del hotel (desayuno, spa, etc.)
  actividades/                 # Actividades, eventos y gastos operativos
  planes/                      # Paquetes todo incluido
  requisitos/                  # Vacunas y declaraciones de huéspedes
  guests/                      # Huéspedes de cada reservación
  reservations/                # Reservaciones principales
  reservation-links/           # Links únicos de reserva
  app.module.ts
  main.ts
```

---

## 🚀 Instalación y configuración

### Requisitos previos
- Node.js >= 18
- PostgreSQL >= 14
- Cuenta en [Supabase](https://supabase.com)

### 1. Clonar el repositorio

```bash
git clone https://github.com/netvuk/rooma-backend.git
cd rooma-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y completa los valores:

```bash
cp .env.example .env
```

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contrasena
DB_NAME=rooma

# Supabase
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key

# App
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 4. Levantar el servidor

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

El servidor corre en `http://localhost:3000/api`

---

## 📡 Endpoints principales

### Tipo de habitación
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/tipo-habitacion` | Crear tipo |
| `GET` | `/api/tipo-habitacion` | Listar tipos |
| `GET` | `/api/tipo-habitacion/:id` | Ver tipo |
| `PATCH` | `/api/tipo-habitacion/:id` | Actualizar |
| `DELETE` | `/api/tipo-habitacion/:id` | Eliminar |

### Habitaciones
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/habitacion` | Crear habitación |
| `GET` | `/api/habitacion` | Listar habitaciones |
| `GET` | `/api/habitacion/disponibles` | Solo disponibles |
| `GET` | `/api/habitacion/:id` | Ver habitación |
| `PATCH` | `/api/habitacion/:id` | Actualizar |
| `DELETE` | `/api/habitacion/:id` | Eliminar |

### Actividades
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/actividades` | Crear actividad |
| `GET` | `/api/actividades` | Listar actividades |
| `GET` | `/api/actividades/activas` | Solo activas |
| `POST` | `/api/actividades/eventos` | Crear evento |
| `GET` | `/api/actividades/:id/eventos` | Eventos de una actividad |
| `GET` | `/api/actividades/eventos/:id` | Ver evento |
| `PATCH` | `/api/actividades/eventos/:id` | Actualizar evento |
| `DELETE` | `/api/actividades/eventos/:id` | Eliminar evento |
| `GET` | `/api/actividades/eventos/:id/utilidad` | Utilidad del evento |

### Planes
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/planes` | Crear plan |
| `GET` | `/api/planes` | Listar planes |
| `GET` | `/api/planes/activos` | Solo activos |
| `GET` | `/api/planes/:id` | Ver plan |
| `PATCH` | `/api/planes/:id` | Actualizar |
| `DELETE` | `/api/planes/:id` | Eliminar |

### Reservaciones
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/reservations/:code` | Crear reservación con link |
| `GET` | `/api/reservations` | Listar reservaciones |
| `GET` | `/api/reservations/:id` | Ver reservación |
| `PATCH` | `/api/reservations/:id` | Actualizar |
| `DELETE` | `/api/reservations/:id` | Eliminar |

### Links de reserva
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/reservation-links` | Crear link (admin) |
| `GET` | `/api/reservation-links` | Listar links (admin) |
| `GET` | `/api/reservation-links/validate/:code` | Validar link (público) |

---

## 🔐 Seguridad

- Todas las rutas están protegidas por el **SupabaseGuard** por defecto
- Las rutas públicas se marcan con `@Public()` (formulario de reserva, validación de links)
- **Helmet** para headers de seguridad HTTP
- **Rate limiting** — máximo 30 requests por minuto por IP
- **ValidationPipe** global con `whitelist: true` y `forbidNonWhitelisted: true`
- **Response DTOs** — nunca se exponen entidades directamente al cliente
- Variables sensibles siempre en `.env`, nunca en el código

---

## 🏗️ Arquitectura

Rooma sigue una **arquitectura modular por dominio** en NestJS. Cada funcionalidad del negocio vive en su propio módulo con entidad, DTOs, service y controller. Los módulos se comunican exportando e importando servicios.

El precio de las reservaciones **siempre se calcula en el backend** consultando la base de datos — nunca se acepta un precio enviado desde el cliente.

---

## 📦 Paquetes disponibles

| Paquete | Módulos incluidos |
|---|---|
| **Básico** | Reservaciones, huéspedes, links de reserva |
| **Estándar** | Básico + habitaciones, tipos, servicios |
| **Completo** | Estándar + actividades, eventos, planes |
| **Premium** | Completo + dashboard, reportes exportables |

Cada cliente tiene su propio deploy y base de datos independiente.

---

## 👨‍💻 Desarrollado por

**NetVuk Interactive**  
Desarrollo de software a medida para negocios turísticos y hoteleros en Colombia.

---

## 📄 Licencia

Propietario — todos los derechos reservados © NetVuk Interactive