# SmokeSoft

Tienda y sistema de gestión de insumos para fumadores. Monorepo con dos
proyectos independientes:

- **`backend/`** — API REST con Node.js + Express + PostgreSQL/SQLite (sin ORM).
- **`frontend/`** — Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript.

Cada uno se instala y se arranca por separado, en **dos terminales distintas**.

---

## Arranque rápido

### Terminal 1 — Backend

```bash
cd backend
cp .env.example .env    # variables de entorno: ver más abajo
npm install
npm run seed     # crea las tablas y las llena con datos de prueba
npm run dev       # http://localhost:4000
```

> ⚠️ **No olvides `npm run seed`** la primera vez (o cuando quieras volver a un
> estado conocido). Si las tablas están vacías, el login no tiene con qué
> autenticar y el catálogo se ve vacío. `npm run seed` es idempotente: se puede
> correr las veces que haga falta, siempre deja el mismo set de datos.

No hace falta instalar Postgres ni Docker para esto: por defecto, en desarrollo,
el backend usa **SQLite** (ver [Base de datos](#base-de-datos-postgresql-o-sqlite)
más abajo).

### Terminal 2 — Frontend

```bash
cd frontend
cp .env.example .env.local    # variables de entorno: ver más abajo
npm install
npm run dev       # http://localhost:3000
```

Abre `http://localhost:3000` e inicia sesión. Para acceso rápido de tester,
el usuario administrador que deja `npm run seed` es:

> **Usuario:** `admin` &nbsp;·&nbsp; **Contraseña:** `admin123`

El resto de usuarios de prueba (Vendedor, Inventario, Cliente) están en
[Usuarios de prueba](#usuarios-de-prueba-tras-npm-run-seed).

> `.env` (backend) y `.env.local` (frontend) están en `.gitignore` — cada quien
> tiene el suyo local y no se sube al repositorio. `.env.example` en cada
> carpeta es la plantilla que sí se versiona.

---

## Variables de entorno

### `backend/.env` (copiado de `backend/.env.example`)

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `PORT` | No (por defecto `4000`) | Puerto donde escucha la API |
| `DB_CLIENT` | No | `sqlite` o `postgres`. Sin definir: SQLite salvo que `NODE_ENV=production` (ver [Base de datos](#base-de-datos-postgresql-o-sqlite)) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Solo con `DB_CLIENT=postgres` | Conexión a PostgreSQL. Coinciden con `docker-compose.yml` de la raíz |
| `JWT_SECRET` | **Sí** | Firma los tokens de sesión. Sin esto, el login y el registro fallan. Genera uno propio con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` — nunca uses el valor de ejemplo |
| `JWT_EXPIRES_IN` | No (por defecto `8h`) | Duración de la sesión |

`SQLITE_PATH` es opcional y no está en `.env.example`: solo hace falta si
quieres mover el archivo `.sqlite` a otra ruta distinta de
`backend/database/smokesoft.sqlite`.

### `frontend/.env.local` (copiado de `frontend/.env.example`)

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | No (por defecto `http://localhost:4000/api`) | URL del backend. Cámbiala si lo corres en otro puerto o lo despliegas aparte |
| `NEXT_PUBLIC_NOMBRE_APP` | No | Nombre mostrado en la interfaz |
| `NEXT_PUBLIC_LOCALE` | No (por defecto `es-CO`) | Formato de números y fechas |
| `NEXT_PUBLIC_MONEDA` | No (por defecto `COP`) | Solo informativa; el formato de precios lo define `NEXT_PUBLIC_LOCALE` |
| `NEXT_PUBLIC_IVA` | No (por defecto `0.19`) | Porcentaje de IVA usado al armar una venta en el panel |
| `NEXT_PUBLIC_PRODUCTOS_POR_PAGINA` | No (por defecto `20`) | Tamaño de página en las tablas del panel |

Todas empiezan con `NEXT_PUBLIC_` porque el mismo código corre en el navegador
y en el servidor de Next.js, y ninguna es secreta. **No pongas `JWT_SECRET` ni
ninguna credencial de base de datos en el frontend**: nunca verifica tokens,
solo los reenvía al backend.

---

## Base de datos: PostgreSQL o SQLite

El backend **no usa un ORM** — todos los servicios hablan SQL directo a través
de `pg`. Para poder desarrollar sin instalar nada más, hay dos motores
intercambiables, elegidos por la variable `DB_CLIENT`:

| | SQLite (por defecto en local) | PostgreSQL |
|---|---|---|
| Instalación | Ninguna — viene incluido en Node.js | `docker compose up -d` (o una instalación propia) |
| Archivo | `backend/database/smokesoft.sqlite` (se crea solo) | Contenedor de `docker-compose.yml` en la raíz |
| Uso previsto | Desarrollo local y pruebas | Igual que hoy: staging/producción, o si prefieres Postgres en local |
| Cómo se activa | `DB_CLIENT=sqlite`, o simplemente no definir `DB_CLIENT` fuera de producción | `DB_CLIENT=postgres` + variables `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` |

**Regla de resolución** (`backend/src/config/driver.js`):

1. Si `DB_CLIENT` está definido (`sqlite` o `postgres`), se usa ese.
2. Si no está definido: `sqlite` en cualquier entorno, **excepto** cuando
   `NODE_ENV=production`, donde se usa `postgres`.

En otras palabras: **clona el repo, corre `npm install` y `npm run seed`, y ya
tienes base de datos** — sin Docker, sin instalar Postgres, sin configurar
nada. Un despliegue real debe fijar `DB_CLIENT=postgres` explícitamente en su
`.env` (no confiar solo en `NODE_ENV`).

### ¿Por qué SQLite es seguro de usar aquí?

El adaptador (`backend/src/config/db.js` → `db.sqlite.js` / `db.postgres.js`)
expone exactamente la misma forma que ya usaban los servicios
(`pool.query(...)`, `pool.connect()`, `.release()`), así que **ningún archivo
de `src/modules/` cambió** para soportar esto. El adaptador de SQLite además:

- Traduce los placeholders `$1, $2...` de Postgres a `?` de SQLite.
- Quita construcciones exclusivas de Postgres que no aplican (`FOR UPDATE`,
  los casts `::text`/`::int`) y traduce `STRING_AGG` a su equivalente
  `GROUP_CONCAT`.
- Convierte 0/1 a `true`/`false` en las columnas booleanas (`activo`,
  `estado`), para que las respuestas se vean igual que con Postgres.
- Traduce los errores de restricción de SQLite (clave duplicada, campo
  obligatorio, llave foránea) a los mismos códigos y al mismo fraseo que usa
  Postgres, para que tanto los mensajes ya traducidos del backend como las
  reglas de `frontend/src/shared/api/traducirError.ts` sigan funcionando sin
  cambios.

**Limitación conocida, solo relevante en local:** SQLite aquí no tiene un pool
real de conexiones (una sola conexión síncrona para todo). Para un único
desarrollador probando la app esto no se nota; si algún día se necesitaran
varias transacciones concurrentes de verdad, hay que usar Postgres.

### Cambiar a PostgreSQL

```bash
# Desde la raíz del repo
docker compose up -d

# backend/.env
DB_CLIENT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smokesoft
DB_USER=postgres
DB_PASSWORD=admin321
```

```bash
cd backend
npm run migrate   # aplica database/migrations/ (solo hace falta con Postgres)
npm run seed       # vacía las tablas (TRUNCATE) y carga los datos de prueba
```

`docker-compose.yml` ya monta `database/schema.sql` como esquema inicial de un
volumen nuevo; `npm run migrate` es lo que actualiza una base de datos
**ya creada** (ver comentarios en `backend/src/scripts/migrate.js`).

---

## Comando de datos de prueba: `npm run seed`

Un solo comando dispara todo el proceso, para cualquiera de los dos motores:

```bash
cd backend
npm run seed
```

Qué hace, en orden:

1. **Arma el esquema.** Con SQLite: borra el archivo `.sqlite` (y sus
   `-wal`/`-shm`) y lo recrea desde `database/schema.sqlite.sql`. Con
   Postgres: aplica las migraciones pendientes y luego vacía las tablas con
   `TRUNCATE ... RESTART IDENTITY CASCADE`.
2. **Carga los datos de prueba**, relacionados entre sí: 7 categorías, 3
   proveedores, 11 productos (uno inactivo y otro con stock por debajo del
   mínimo, a propósito, para poder ver esos estados sin tener que crearlos a
   mano), 5 clientes, un usuario por cada rol del sistema, 2 compras a
   proveedor y 4 ventas ya facturadas (con sus totales e IVA calculados
   exactamente igual que los calcularía la aplicación).

**Guarda de seguridad:** el script se niega a correr si `NODE_ENV=production`,
porque **borra los datos existentes antes de sembrar**. Es una herramienta de
desarrollo local, no algo para correr contra una base de datos real.

> Si usas SQLite y el backend ya está corriendo en otra terminal, detenlo antes
> de correr `npm run seed` (en Windows no se puede reemplazar un archivo que
> otro proceso tiene abierto). El propio comando te avisa si esto pasa.

### Usuarios de prueba (tras `npm run seed`)

| Usuario | Contraseña | Rol | Notas |
|---|---|---|---|
| `admin` | `admin123` | Administrador | Acceso total al panel |
| `maria` | `vendedor123` | Vendedor | Ventas y clientes |
| `carlos` | `inventario123` | Inventario | Productos, categorías, compras |
| `juanperez` | `cliente123` | Cliente | Cuenta de tienda ligada a la ficha de cliente "Juan Pérez"; ya tiene 2 pedidos en su historial |

---

## Backend

### Patrón y organización

Node.js + Express, **sin ORM**: cada tabla se maneja con SQL parametrizado a
través de `pg` (o del adaptador de SQLite equivalente). Arquitectura por
capas, replicada igual en cada módulo de negocio:

```
routes  →  controller  →  service
(HTTP)     (req/res)      (SQL)
```

- **`routes`**: define los endpoints, aplica `verificarToken`/`verificarRol`,
  y delega al controlador. No tiene lógica de negocio.
- **`controller`**: lee `req`, llama al servicio, decide el código HTTP
  (`201` al crear, `204` al borrar, `404` si no existe) y pasa los errores a
  `next(error)`.
- **`service`**: la única capa que toca la base de datos. Arma las consultas
  SQL y lanza `throw { status, message }` para los errores de negocio.

```
backend/
├── database/
│   ├── schema.sql            # DDL de Postgres (instalación nueva)
│   ├── schema.sqlite.sql     # DDL equivalente para SQLite
│   └── migrations/           # ALTER TABLE incrementales, solo Postgres
├── src/
│   ├── app.js                 # arma la app de Express, monta cada módulo, maneja errores
│   ├── server.js               # arranca el servidor HTTP
│   ├── config/
│   │   ├── driver.js           # decide sqlite vs postgres (DB_CLIENT/NODE_ENV)
│   │   ├── db.js                # despachador: exporta uno u otro adaptador
│   │   ├── db.postgres.js       # pool de `pg`
│   │   └── db.sqlite.js         # adaptador sobre node:sqlite
│   ├── middlewares/
│   │   ├── auth.middleware.js          # verificarToken: exige un JWT válido
│   │   ├── auth.optional.middleware.js # variante para rutas públicas (catálogo)
│   │   └── role.middleware.js          # verificarRol('Administrador', ...)
│   ├── modules/
│   │   ├── auth/            # login, registro de cliente, /me
│   │   ├── usuarios/        # CRUD de personal (solo Administrador)
│   │   ├── productos/       # catálogo, stock, ajustes de inventario
│   │   ├── categorias/
│   │   ├── proveedores/
│   │   ├── clientes/        # CRM + autogestión del cliente de la tienda
│   │   ├── ventas/          # checkout: transacción que descuenta stock
│   │   └── compras/         # entrada de mercancía: transacción que suma stock
│   ├── scripts/
│   │   ├── migrate.js        # aplica migrations/ (Postgres)
│   │   ├── sqlite-reset.js   # recrea el archivo SQLite desde cero
│   │   ├── seed.js           # el comando `npm run seed`
│   │   └── rutas.js          # lista todos los endpoints, en orden de declaración
│   └── utils/
│       ├── peticiones.js     # conId() valida :id, ROLES_STAFF, etc.
│       └── errores.js        # traduce códigos de error de la BD a { status, message }
```

Cada módulo de `modules/` sigue exactamente esta forma:
`<nombre>.routes.js`, `<nombre>.controller.js`, `<nombre>.service.js`. Un
módulo nuevo se agrega copiando esa forma y montándolo en `app.js`.

**Reglas que vale la pena conocer antes de tocar código:**

- Las rutas con un segmento literal (`/stock-bajo`, `/mio`, `/estadisticas`)
  se declaran **antes** que `/:id`, o Express matchea el parámetro primero.
- `ventas` y `compras` corren su lógica dentro de una transacción real
  (`pool.connect()` + `BEGIN`/`COMMIT`/`ROLLBACK`), bloqueando las filas de
  producto en el mismo orden para evitar interbloqueos.
- No hay capa de validación de por medio: un campo obligatorio ausente llega
  tal cual a la base de datos. El frontend hace la validación (con `zod`)
  antes de enviar, y traduce a español lo que sí se escapa.

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga automática (nodemon) |
| `npm run start` | Servidor en modo normal |
| `npm run seed` | **El comando para tener datos de prueba** — arma el esquema y siembra |
| `npm run migrate` | Solo Postgres: aplica las migraciones pendientes sin tocar los datos |
| `node src/scripts/rutas.js` | Lista los endpoints registrados, en el orden real de Express |

---

## Frontend

### Patrón y organización

Next.js 16 con **App Router**. La carpeta `app/` es *solo enrutamiento*: cada
`page.tsx` importa una vista y la renderiza, sin lógica propia. Todo lo demás
vive en `modules/` (por funcionalidad) y `shared/` (reutilizable entre
módulos).

```
frontend/src/
├── proxy.ts                  # filtro de rutas por cookie (UX, NO es seguridad real)
├── app/                       # SOLO routing — sin JSX de negocio
│   ├── layout.tsx              # <html>, fuente, providers globales
│   ├── (publico)/               # shell público: tienda, login, carrito, perfil
│   └── (admin)/panel/            # shell del panel: dashboard y los CRUD
│
├── modules/<nombre>/           # la misma forma en los ~13 módulos
│   ├── views/                    # componentes que consume cada page.tsx
│   ├── components/               # piezas propias del módulo
│   ├── hooks/                    # lógica de datos (react-query) del módulo
│   ├── services/                  # llamadas HTTP de ese módulo
│   ├── config/                    # configuración del CRUD genérico (si aplica)
│   └── schemas/                    # validación con zod
│
├── shared/
│   ├── api/                    # cliente.ts (fetch), endpoints.ts, sesionStore.ts
│   ├── components/              # crud/ (ModuloCrud genérico), shells/, ui/
│   ├── hooks/, lib/, providers/, types/, constants/
│
└── styles/                     # tokens @theme, base.css, capas de componentes
```

**Piezas centrales para orientarse rápido:**

- `shared/api/cliente.ts` — el único lugar que llama a `fetch`. Absorbe las
  particularidades del backend: `DECIMAL` que llega como string, un `PUT`
  sobre un id inexistente que responde 200 vacío, el 403 que significa dos
  cosas distintas según el mensaje, etc.
- `shared/components/crud/ModuloCrud.tsx` — un CRUD completo (formulario +
  tabla + búsqueda + paginación) a partir de un objeto de configuración. Las
  pantallas de usuarios, clientes, proveedores, categorías y productos son
  solo esa configuración.
- `modules/auth/context/ProveedorSesion.tsx` + `src/proxy.ts` — la sesión vive
  en una cookie legible (no `localStorage`, para que el proxy pueda leerla
  antes de renderizar). El proxy es un filtro de UX (evita el parpadeo de
  mostrar el panel a alguien deslogueado); la seguridad real la impone el
  backend en cada endpoint.

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (incluye chequeo de tipos) |
| `npm run lint` | ESLint |

Ver [Variables de entorno](#variables-de-entorno) — no hace falta tocar
`frontend/.env.local` si el backend corre en su puerto por defecto.

---

## Notas y límites conocidos

- El catálogo (`GET /api/productos`, `GET /api/categorias`) es público a
  propósito: la tienda se navega sin iniciar sesión.
- `/panel` exige un rol de personal (Administrador, Inventario o Vendedor);
  `/perfil` exige rol Cliente.
- No hay integración de pagos: los pedidos quedan como pago contra entrega.
- `/muestras` en el frontend es una página de referencia del sistema de
  diseño (colores, botones, tablas, formularios) para comparar contra los
  estilos del proyecto guía.
