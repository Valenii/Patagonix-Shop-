# Patagonix Shop: AI Driven E-Commerce

SPA de e-commerce desarrollada para un cliente del sector retail de **Patagonix Tech**. Los clientes pueden navegar el catálogo, armar su carrito y comprar. Los administradores gestionan productos y órdenes desde un panel protegido.

**🌐 Producción:** `https://<COMPLETAR>.vercel.app`

**📦 Repositorio:** https://github.com/Valenii/Patagonix-Shop-

---

## Índice

1. [Contexto del cliente](#contexto-del-cliente)
2. [Funcionalidades](#funcionalidades)
3. [Tech stack](#tech-stack)
4. [Decisiones arquitectónicas](#decisiones-arquitectónicas)
5. [Estructura de carpetas](#estructura-de-carpetas)
6. [Modelo de datos (Firestore)](#modelo-de-datos-firestore)
7. [Flujo de upload de imágenes a S3](#flujo-de-upload-de-imágenes-a-s3-con-presigned-urls)
8. [Seguridad](#seguridad)
9. [Instalación y configuración](#instalación-y-configuración)
10. [Variables de entorno](#variables-de-entorno)
11. [Testing](#testing)
12. [Deploy en Vercel](#deploy-en-vercel)
13. [Bitácora de uso de IA](#bitácora-de-uso-de-ia)

---

## Contexto del cliente

El cliente necesitaba una plataforma de e-commerce **escalable, mantenible y basada en servicios administrados (BaaS)**. El objetivo era reducir los costos de infraestructura y salir al mercado rápido. La plataforma tiene dos tipos de usuario:

| Rol | Qué puede hacer |
|---|---|
| **customer** | Navegar y filtrar el catálogo, gestionar su carrito, comprar (checkout simulado), ver su historial de órdenes y dejar reseñas. |
| **admin** | CRUD de productos con imágenes en S3, ver y filtrar todas las órdenes, cambiar sus estados y consultar el dashboard de ventas. |

## Funcionalidades

**Autenticación**
- Registro e inicio de sesión con email/contraseña o con Google
- Logout y persistencia de sesión (`onAuthStateChanged`)
- Roles `customer` / `admin` guardados en `users/{uid}`

**Catálogo**
- Listado desde Firestore con **paginación** (`limit` + `startAfter`)
- Filtro por categoría y búsqueda por nombre con **debounce** (`useDebounce`, 350 ms)
- Detalle de producto con stock, rating y reseñas

**Carrito**
- Agregar, eliminar y actualizar cantidades (con tope de stock)
- Total calculado automáticamente con selectores del reducer
- Estado global con **Context API + useReducer**, persistido en Firestore por usuario (`carts/{uid}`)

**Checkout y órdenes**
- Checkout simulado: revisar carrito, cargar datos de envío (con validación) y confirmar
- La orden se crea en Firestore con estado `pending` y **descuenta stock en la misma transacción**
- Estados: `pending` → `processing` → `completed` / `cancelled`
- Historial de órdenes del usuario y detalle con número de seguimiento

**Panel de administración** (layout propio, ruta protegida por rol)
- CRUD completo de productos con upload de imágenes a **AWS S3**
- Listado de todas las órdenes, filtro por estado y cambio de estado

**UI**
- Diseño mobile-first con Tailwind
- Skeletons y spinners durante la carga
- Estados vacíos (sin productos, sin órdenes, carrito vacío)
- Mensajes de error claros
- Componentes reutilizables con props tipadas (`Button`, `Input`, `Select`, `Modal`, `Badge`, `QuantitySelector`, etc.)

**Extra credit**
- 📊 **Dashboard de analytics** con Recharts: ingresos, ventas en el tiempo y productos más vendidos
- 📄 **Paginación** de productos con cursores de Firestore
- ⭐ **Reviews y ratings**: subcolección `products/{id}/reviews`, con el promedio recalculado en una transacción

## Tech stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18, TypeScript (strict), Vite, React Router 6, TailwindCSS |
| Estado global | Context API + `useReducer` |
| BaaS | Firebase Authentication + Cloud Firestore |
| Archivos | AWS S3 (presigned URLs) |
| Backend serverless | Vercel Serverless Functions (`/api`) |
| Testing | Vitest + React Testing Library + user-event |
| Deploy | Vercel + GitHub (CI/CD) |

---

## Decisiones arquitectónicas

### ¿Por qué Context API + useReducer?

- **El estado del carrito tiene muchas transiciones** (`ADD_ITEM`, `REMOVE_ITEM`, `UPDATE_QUANTITY`, `CLEAR_CART`, `HYDRATE`). Un reducer concentra toda esa lógica en una **función pura** (`cartReducer.ts`) que se testea sin montar componentes.
- **No hace falta una librería externa** (Redux, Zustand) para el tamaño de este proyecto. Context + useReducer viene con React y alcanza.
- **Separa responsabilidades:** el reducer decide *cómo* cambia el estado; el `CartProvider` se encarga de los efectos (hidratar desde Firestore y persistir con debounce); los componentes solo consumen el hook `useCart()`.
- Se aplica el mismo patrón en `AuthContext` + `authReducer`.

### ¿Por qué S3 para las imágenes?

- **Firestore no está pensado para archivos binarios** (límite de 1 MB por documento y costo por lectura). S3 es almacenamiento de objetos barato, durable y servible directamente por URL.
- Con **presigned URLs**, el navegador sube la imagen **directo a S3**: el archivo no pasa por nuestro backend (no consume tiempo ni memoria de las funciones serverless) y las **credenciales de AWS nunca llegan al frontend**.
- La firma dura **120 segundos** y solo vale para *esa* key, *ese* tipo de archivo y *ese* tamaño.

### ¿Por qué snapshot de productos en las órdenes?

Cada orden guarda una **copia** de los datos de cada producto comprado (`productId`, `name`, `price`, `quantity`, `imageUrl`), no solo una referencia. Así el historial queda fijo aunque el producto cambie de precio, de nombre o se elimine, como un ticket de compra. El precio se lee de Firestore **dentro de la transacción del checkout**, de modo que refleja el precio vigente al momento de comprar.

### ¿Por qué una transacción en el checkout?

Crear la orden y descontar stock tiene que ser **todo o nada**. `createOrder` usa `runTransaction`: lee todos los productos, valida el stock, escribe la orden y descuenta las unidades. Si un producto no tiene stock suficiente o fue eliminado, no se escribe nada y el usuario ve un mensaje claro.

### Organización por features (Screaming Architecture)

La carpeta `src/features` "grita" de qué se trata la app: `auth`, `catalog`, `cart`, `checkout`, `orders`, `admin`, `reviews`. Cada feature agrupa sus propias capas (`pages`, `components`, `context`, `hooks`, `services`). Lo que se comparte entre features vive en `src/shared`.

**Capas y responsabilidades:**

```
pages       →  arman la pantalla y conectan hooks con componentes
components  →  UI presentacional, reciben datos por props tipadas
hooks       →  lógica de UI reutilizable (useCart, useAuth, useProducts, useOrders)
context     →  estado global (Provider + reducer puro)
services    →  ÚNICO lugar que habla con Firebase / la API (devuelven Result<T>)
types       →  interfaces de las entidades del negocio
api/        →  backend serverless (Vercel Functions)
```

Los componentes **nunca importan Firebase directamente**: siempre pasan por un `service`. Eso permite mockear la capa de datos en los tests.

---

## Estructura de carpetas

```
.
├── api/                          # Vercel Serverless Functions (backend)
│   ├── _lib/
│   │   ├── firebaseAuth.ts       # Verifica Firebase ID token (JWT) + rol admin
│   │   ├── http.ts               # CORS y helpers de respuesta
│   │   └── s3Client.ts           # Cliente S3 (credenciales solo acá)
│   └── s3/
│       ├── presign.ts            # POST /api/s3/presign → URL firmada para subir
│       └── delete.ts             # POST /api/s3/delete  → borra imagen
├── scripts/
│   └── seed-firestore.mjs        # Carga productos de ejemplo
├── src/
│   ├── app/providers/            # AppProviders (Router + Auth + Cart)
│   ├── features/
│   │   ├── admin/                # Panel: layout, productos, órdenes, dashboard
│   │   ├── auth/                 # Login, registro, AuthContext, useAuth
│   │   ├── cart/                 # CartContext, cartReducer, useCart, CartPage
│   │   ├── catalog/              # Catálogo, filtros, búsqueda, detalle
│   │   ├── checkout/             # Formulario de envío, CheckoutPage
│   │   ├── orders/               # Historial, detalle, orderService
│   │   └── reviews/              # Reviews y ratings
│   ├── shared/
│   │   ├── components/
│   │   │   ├── feedback/         # Spinner, Skeleton, EmptyState, ErrorMessage
│   │   │   ├── layout/           # Navbar, MainLayout, ProtectedRoute, AdminRoute
│   │   │   └── ui/               # Button, Input, Select, Modal, Badge, ...
│   │   ├── hooks/                # useDebounce
│   │   ├── lib/firebase.ts       # Inicialización de Firebase
│   │   ├── types/                # Product, CartItem, Order, UserProfile, Review
│   │   └── utils/                # Formateo de moneda, fechas, tracking
│   └── test/                     # setup, fixtures y renderWithProviders
├── firestore.rules               # Security Rules
├── firestore.indexes.json        # Índices compuestos
├── vercel.json                   # Config de build, funciones y rewrites SPA
└── .env.example                  # Plantilla de variables (sin valores reales)
```

---

## Modelo de datos (Firestore)

| Colección | Contenido | Quién lee / escribe |
|---|---|---|
| `users/{uid}` | email, displayName, **role**, timestamps | El dueño lee y edita (sin poder cambiar su rol); el admin lee |
| `products/{id}` | name, description, price, category, imageUrl, imageKey, stock, ratingAverage, ratingCount | Lectura pública; escritura solo admin (*) |
| `products/{id}/reviews/{id}` | userId, userName, rating (1-5), comment | Lectura pública; crea cualquier usuario logueado |
| `carts/{uid}` | items del carrito | Solo el dueño |
| `orders/{id}` | userId, items (snapshot), subtotal, total, status, shippingAddress, trackingNumber | El dueño crea (en `pending`) y lee las suyas; el admin lee todas y cambia el estado |

(*) Excepciones acotadas para clientes logueados: **bajar** el `stock` durante el checkout y sumar una reseña al `ratingCount`/`ratingAverage`. No pueden tocar ningún otro campo (precio, nombre, etc.).

---

## Flujo de upload de imágenes a S3 con presigned URLs

```
 Admin (navegador)            Vercel Function /api/s3/presign             AWS S3
        │                                  │                                 │
   1.   │── POST {fileName,type,size} ────▶│                                 │
        │   Authorization: Bearer <IDtoken>│                                 │
        │                                  │ 2. Verifica JWT de Firebase     │
        │                                  │    (firma con JWKS de Google)   │
        │                                  │ 3. Verifica rol admin en        │
        │                                  │    users/{uid}                  │
        │                                  │ 4. Valida tipo (jpg/png/webp)   │
        │                                  │    y tamaño (máx. 5 MB)         │
        │                                  │ 5. Firma PutObject (120 s) ─────│
        │◀── {uploadUrl, publicUrl, key} ──│                                 │
   6.   │──────────────── PUT archivo (directo, sin pasar por el backend) ──▶│
        │◀─────────────────────────────────────────────────────── 200 OK ───│
   7.   │ Guarda publicUrl + key en products/{id} (Firestore)
```

- **Paso 1:** `imageUploadService.uploadProductImage()` pide la firma enviando el ID token del usuario.
- **Pasos 2 y 3:** `api/_lib/firebaseAuth.ts` valida el token **sin service account**: verifica la firma RS256 contra las claves públicas de Google con `jose` y consulta el rol en Firestore.
- **Pasos 4 y 5:** `api/s3/presign.ts` genera una key única (`products/<uuid>-<nombre>`) y la URL firmada.
- **Paso 6:** el navegador sube el archivo directo a S3.
- **Borrado:** `api/s3/delete.ts` (solo admin, y solo keys bajo `products/`) se usa al reemplazar o eliminar la imagen de un producto.

**Configuración necesaria en AWS:**
1. Bucket S3 con lectura pública de `products/*` (o un CDN delante).
2. **CORS del bucket** que permita `PUT` desde el dominio de la app:
   ```json
   [{ "AllowedOrigins": ["http://localhost:5173", "https://<tu-app>.vercel.app"],
      "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["*"] }]
   ```
3. Usuario IAM con **permisos mínimos** (`s3:PutObject`, `s3:DeleteObject`, `s3:GetObject`) sobre `arn:aws:s3:::<bucket>/products/*`.

---

## Seguridad

- **`.env` en `.gitignore`**: nunca se commitea. El repo incluye solo `.env.example` con valores de ejemplo.
- **Firebase (frontend):** las variables `VITE_FIREBASE_*` son públicas por diseño. La seguridad real la dan las **Firestore Security Rules**.
- **AWS (solo backend):** `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY` **no llevan prefijo `VITE_`**, así que Vite nunca las incluye en el bundle. Solo se leen dentro de `/api`, configuradas en Vercel.
- **Roles en dos niveles:**
  - *Frontend (UX):* `ProtectedRoute` y `AdminRoute` redirigen a quien no tiene sesión o no es admin.
  - *Backend (seguridad real):* `firestore.rules` valida cada lectura y escritura, y las funciones `/api/s3/*` verifican el token y el rol admin antes de firmar.
- **Nadie puede auto-asignarse admin:** el rol solo se crea como `customer` (salvo el email de bootstrap definido en las reglas) y es inmutable desde el cliente.
- Headers de seguridad en `vercel.json` (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).

---

## Instalación y configuración

**Requisitos:** Node.js ≥ 20, un proyecto de Firebase y un bucket de AWS S3.

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/Valenii/Patagonix-Shop-.git
cd Patagonix-Shop-
npm install

# 2. Crear el archivo de variables y completarlo (ver sección siguiente)
cp .env.example .env
```

**3. Configurar Firebase**
1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com).
2. **Authentication** → habilitar los proveedores *Email/Password* y *Google*.
3. **Firestore Database** → crear la base de datos.
4. **Project settings → Your apps** → registrar una app web y copiar la config al `.env`.
5. Publicar las reglas y los índices:
   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,firestore:indexes
   ```
   (También se puede pegar `firestore.rules` en *Firestore → Rules* y publicar desde la consola.)
6. Para tener un admin, poner tu email en `VITE_BOOTSTRAP_ADMIN_EMAIL` **y** en la regla de `users` de `firestore.rules`, y registrarte con ese email.

**4. Configurar AWS S3:** ver [Configuración necesaria en AWS](#flujo-de-upload-de-imágenes-a-s3-con-presigned-urls).

**5. Cargar productos de ejemplo (opcional)**
```bash
npm run seed   # pide email y contraseña de una cuenta admin
```

**6. Levantar el proyecto**
```bash
npm run dev           # solo frontend en http://localhost:5173
npx vercel dev        # frontend + funciones /api (necesario para subir imágenes)
```

### Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | Typecheck + build de producción |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación de tipos |
| `npm test` | Corre todos los tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Reporte de cobertura |
| `npm run seed` | Carga productos de ejemplo en Firestore |

---

## Variables de entorno

Ver `.env.example`.

| Variable | Dónde se usa | Descripción |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Frontend | Config del SDK de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontend | Config del SDK de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Frontend + API | ID del proyecto (la API lo usa para validar tokens) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Frontend | Config del SDK de Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Frontend | Config del SDK de Firebase |
| `VITE_FIREBASE_APP_ID` | Frontend | Config del SDK de Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | Frontend | Opcional (Analytics) |
| `VITE_BOOTSTRAP_ADMIN_EMAIL` | Frontend | Email que se registra como admin |
| `VITE_API_BASE_URL` | Frontend | Base de `/api`; vacío = mismo origen |
| `AWS_REGION` | **Solo API** | Región del bucket (ej: `sa-east-1`) |
| `AWS_S3_BUCKET` | **Solo API** | Nombre del bucket |
| `S3_ACCESS_KEY_ID` | **Solo API** 🔒 | Access key del usuario IAM |
| `S3_SECRET_ACCESS_KEY` | **Solo API** 🔒 | Secret key del usuario IAM |
| `S3_PUBLIC_BASE_URL` | Solo API | Opcional: dominio CDN para las imágenes |
| `FIREBASE_PROJECT_ID` | Solo API | Opcional: si difiere de `VITE_FIREBASE_PROJECT_ID` |

> Las variables marcadas con 🔒 son secretas: **nunca** deben llevar prefijo `VITE_` ni subirse al repositorio.

---

## Testing

```bash
npm test
```

**10 archivos y 56 tests**, sin dependencia de servicios externos: Firebase y AWS SDK están mockeados con `vi.mock`.

| Tipo | Archivo | Qué cubre |
|---|---|---|
| Wrapper de providers | `src/test/utils/renderWithProviders.tsx` | `AllProviders` (Router + Auth + Cart) para testear componentes que dependen de varios contexts |
| Reducer | `cart/context/__tests__/cartReducer.test.ts` | Cada action produce el estado correcto: tope de stock, cantidades inválidas, selectores de total |
| Custom hooks | `cart/hooks/__tests__/useCart.test.tsx` | `renderHook`: hidratación, add/update/remove, persistencia con debounce |
| Custom hooks | `auth/hooks/__tests__/useAuth.test.tsx` | `renderHook`: estados loading / authenticated / unauthenticated, roles |
| Servicios | `cart/services/__tests__/cartService.test.ts` | Lectura y escritura del carrito en Firestore (mock) |
| Servicios | `orders/services/__tests__/orderService.test.ts` | Transacción del checkout: descuento de stock, precio al momento de compra, sin stock, producto eliminado, todo o nada |
| **Integración** | `checkout/__tests__/checkoutFlow.test.tsx` | Flujo completo: detalle → agregar al carrito → carrito → checkout → orden creada y carrito vacío; validación del formulario; error de stock |
| Componentes | `shared/components/ui/__tests__/QuantitySelector.test.tsx` | Límites mín./máx. e interacción |
| API serverless | `api/s3/__tests__/*.test.ts` | Presign y delete: auth, validación de tipo y tamaño, AWS SDK mockeado |
| API serverless | `api/_lib/__tests__/firebaseAuth.test.ts` | Verificación de token y rol admin |

---

## Deploy en Vercel

1. Subir el repositorio a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importar el repo. Vercel detecta Vite; la configuración está en `vercel.json`.
3. **Settings → Environment Variables:** cargar **todas** las variables de la tabla anterior para *Production* y *Preview*.
4. Deploy. Cada `push` a `main` redespliega automáticamente (CI/CD).
5. En Firebase → **Authentication → Settings → Authorized domains**, agregar el dominio `*.vercel.app` (necesario para el login con Google).
6. Agregar el dominio de Vercel al **CORS del bucket S3**.

**Checklist de verificación en producción**
- [ ] Registro, login con email y con Google, logout, sesión persistente al recargar
- [ ] Catálogo: filtro por categoría, búsqueda, paginación, detalle
- [ ] Carrito: agregar, modificar, eliminar; se mantiene al recargar
- [ ] Checkout con cuenta **customer** → orden creada → el stock baja
- [ ] Historial y detalle de órdenes
- [ ] Admin: crear, editar y eliminar producto con imagen (upload a S3)
- [ ] Admin: filtrar órdenes y cambiar su estado
- [ ] Customer no puede entrar a `/admin`

---

## Bitácora de uso de IA

La IA se usó como asistente para **planificar, revisar código, validar decisiones, generar tests y resolver problemas**, no solo para copiar código. Cada entrada registra qué se preguntó, qué se aprendió y qué decisión se tomó.

| # | Categoría | Herramienta | Qué le pedí | Qué aprendí / qué aportó | Decisión tomada |
|---|---|---|---|---|---|
| 1 | Validación de decisiones técnicas | Claude | Si el diseño de guardar en cada orden un snapshot de los productos (`productId`, `name`, `priceAtPurchase`, `quantity`) se cumplía en mi proyecto. | Entendí el patrón **snapshot / desnormalización**: la orden funciona como un ticket que no cambia aunque cambie el catálogo. Detecté que en el código el campo se llama `price` y que el precio se copiaba al agregar al carrito, no al comprar. | Mantener el snapshot y documentarlo con el nombre real del campo. Más adelante se cambió para que el precio se lea al confirmar la compra (#4). |
| 2 | Code review / planificación | Claude | Auditar el proyecto completo contra la consigna del Proyecto Integrador. | Me dio un checklist de lo cumplido y lo faltante: README, repo git, tests de integración, deploy. Pude priorizar en vez de revisar a ciegas. | Seguir el orden: bug → tests → README → git → deploy. |
| 3 | Code review / resolución de problemas | Claude | (Dentro de la auditoría) Revisar el flujo de checkout. | Encontró un **bug crítico**: las Security Rules solo dejaban modificar productos al admin, pero el checkout de un *customer* descontaba stock. La orden se guardaba igual, pero el usuario veía un error. No lo había visto porque probaba con mi cuenta admin. Lo mismo pasaba con las reseñas (`ratingAverage`). | Agregar a `firestore.rules` excepciones acotadas: un cliente solo puede **bajar** el stock o sumar una reseña, sin tocar precio ni nombre. Aprendí a usar `diff().affectedKeys().hasOnly()`. |
| 4 | Validación de decisiones técnicas | Claude | Cómo descontar stock de forma segura al crear la orden. | Aprendí por qué conviene una **transacción** (`runTransaction`): que la orden y los descuentos sean todo o nada, que no se venda sin stock si dos personas compran a la vez, y que en una transacción las lecturas van antes que las escrituras. | Reescribir `createOrder` con transacción que valida stock y toma nombre y precio vigentes del producto. |
| 5 | Generación de tests | Claude | Generar tests de integración del flujo de compra y casos edge del checkout. | Cómo armar un test de integración con los providers reales mockeando solo la capa de servicios, y qué casos edge cubrir: sin stock, producto eliminado, varios productos con uno sin stock, formulario inválido. | Agregar `checkoutFlow.test.tsx` (3 tests) y `orderService.test.ts` (5 tests). Total: 56 tests. |
| 6 | Explicación de conceptos | Claude | Explicar qué es exactamente el snapshot en las órdenes y si significa "copiar cada compra". | Diferencia entre la orden (el registro de la compra) y el snapshot (la copia de los datos del producto **dentro** de la orden). | Usar la analogía del ticket de supermercado en la presentación. |
| 7 | Validación de flujos de negocio / tests | Claude | Por qué el formulario de envío rechazaba mi código postal, y si era obligatorio pedir dirección en un checkout simulado. | La consigna no exige datos de envío, pero le dan sentido al seguimiento de estados de la orden. Aprendí los dos formatos de código postal argentino (4 dígitos y CPA `M5500ABC`): mi validación `^\d{4,8}$` rechazaba CPAs válidos. | Mantener el formulario, mover la validación a `checkout/utils/shippingValidation.ts`, aceptar ambos formatos, normalizar a mayúsculas y agregar tests de casos válidos e inválidos. |
| 8 | Resolución de problemas | Claude | Al confirmar una compra solo veía "No se pudo crear la orden. Intenta nuevamente." | El `catch` ocultaba el error real. Al loguearlo apareció `permission-denied`: las reglas **publicadas** en Firebase eran una versión vieja, distinta de mi `firestore.rules` local (el fix de la entrada #3 nunca se había desplegado). | Loguear el error original en `createOrder` y mostrar un mensaje específico para permisos. Republicar las reglas desde la consola de Firebase. A futuro, desplegarlas con `firebase deploy --only firestore:rules` para que local y producción no se desincronicen. |

### Reflexión

_COMPLETAR: qué aprendiste usando IA, en qué casos te ayudó más, en qué casos tuviste que corregirla o validar su respuesta y cómo cambió tu forma de trabajar._

---

Proyecto Integrador · **AI Driven E-Commerce** · Patagonix Tech
