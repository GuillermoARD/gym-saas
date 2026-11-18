# GymFlow — SaaS para administrar gimnasios

App multi-gimnasio para gimnasios pequeños en República Dominicana: clientes, planes, membresías con vencimiento, pagos manuales (efectivo / transferencia / tarjeta en POS), check-in por QR y dashboard.

> "GymFlow" es un nombre provisional, cámbialo cuando tengas la marca.

## Stack

| | |
|---|---|
| **Server** | Node + Express 5 + TypeScript, Zod, Sequelize + PostgreSQL, bcrypt, JWT, Jest + Supertest |
| **Client** | React 19 + TypeScript, Vite, Tailwind v4, React Router 7, Axios |

## Arrancar en local

### 1. Base de datos

Crea una base de datos vacía en tu Postgres (con TablePlus o psql):

```sql
CREATE DATABASE gym_saas;
```

### 2. Server

```bash
cd server
cp .env.example .env   # y completa DATABASE_URL, JWT_SECRET y SUPERADMIN_*
npm run seed -- --demo # crea las tablas, tu super admin y un gimnasio demo
npm run dev            # http://localhost:4000
```

Usuarios del demo: `guilledone@gmail.com` / `12345` (dueño) y `recepcion@demo.do` / `demo12345` (recepción).

### 3. Client

```bash
cd client
cp .env.example .env
npm run dev            # http://localhost:5173
```

### Tests

```bash
cd server
npm test
```

Los tests usan SQLite en memoria, así que no tocan tu Postgres.

## Roles

| Rol | Puede |
|---|---|
| `super_admin` | Ver todos los gimnasios y activarlos o desactivarlos (`/admin`) |
| `owner` (dueño) | Todo dentro de su gimnasio: planes, personal, cancelar membresías |
| `reception` | Registrar clientes, vender o renovar membresías, cobrar, check-in, ver pagos |
| `trainer` | Ver clientes, planes y dashboard (sin dinero) |

Todas las tablas llevan `gymId`. El `gymId` sale **siempre** del usuario autenticado y nunca del request, así que un gimnasio no puede ver datos de otro (hay un test para eso).

## Reglas de negocio

- **Renovación encadenada:** si un cliente renueva con días pendientes, la nueva membresía empieza el día después de que termine la actual. No pierde días.
- **Estados:** `active`, `expiring` (vence en 7 días o menos), `upcoming` (pagada pero todavía no empieza), `expired`, `none`.
- **Zona horaria:** todo "hoy" se calcula en hora de RD (UTC-4).
- **Planes y membresías no se borran:** se desactivan o cancelan, para no perder el historial ni los pagos.
- **Carnet:** en el detalle del cliente se ve su QR y hay un botón "Imprimir carnet" (tamaño tarjeta de crédito, 85.6 × 54 mm).
- **Check-in:** el código del QR es un UUID por cliente. Si pierde el carnet, se regenera y el viejo deja de servir. Los lectores QR USB funcionan como teclado, así que la pantalla de check-in siempre tiene el foco en el campo.

## API

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | público |
| GET | `/api/auth/me` | cualquiera |
| GET | `/api/dashboard` | staff |
| GET/POST/PATCH | `/api/staff` | owner |
| GET | `/api/plans` | staff |
| POST/PUT/DELETE | `/api/plans/:id` | owner |
| GET | `/api/clients?search=&state=` · `/api/clients/:id` | staff |
| POST/PUT | `/api/clients` · `/api/clients/:id` | owner, reception |
| POST | `/api/clients/:id/memberships` (vende y cobra) | owner, reception |
| POST | `/api/clients/:id/regenerate-qr` | owner, reception |
| PATCH | `/api/memberships/:id/cancel` | owner |
| GET | `/api/payments?from=&to=&method=` | owner, reception |
| POST/GET | `/api/checkins` | owner, reception |
| GET/PATCH | `/api/admin/gyms` | super_admin |

## Próximos pasos

- [ ] Escanear el QR con la cámara del celular o tablet
- [ ] Recordatorios de vencimiento por WhatsApp
- [ ] Pagos online (Azul / CardNET / PayPal; Stripe no opera en RD)
- [ ] Clases y horarios
- [ ] Migraciones de Sequelize en vez de `sync` antes de producción
- [ ] Rate limit en `/auth/login`
