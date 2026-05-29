# Prompt: Implementar checkout con Mercado Pago (basado en GEMA Editorial)

> Prompt listo para copiar/pegar en otro proyecto que necesite un checkout similar.
> Documenta toda la implementación de Mercado Pago de este repo: desde el setting de
> configuración (admin dual-mode) hasta la integración con la API de Mercado Pago
> (preference, redirect, webhook firmado, audit trail).

---

Quiero que implementes un checkout con **Mercado Pago** siguiendo exactamente la arquitectura que ya tengo funcionando en otro proyecto (GEMA Editorial, un Next.js App Router con Firebase/Firestore). A continuación te paso el diseño completo y probado para que lo repliques/adaptes. Respetá las mismas decisiones de seguridad y el mismo flujo. Adaptá los nombres de modelos/colecciones a este proyecto si difieren, pero mantené la estructura.

### Stack y supuestos
- **Next.js App Router** con Server Actions (`"use server"`) y Route Handlers (`app/api/.../route.ts`).
- **Firestore** como base de datos (cliente + Firebase Admin SDK en server). Si este proyecto usa otra DB (Postgres/Prisma), traducí los conceptos: documento `settings/mercadopago` → tabla de settings; subcolección `orders/{id}/events` → tabla `order_events`.
- SDK oficial: `mercadopago` v2 (paquete npm `mercadopago`). Clases usadas: `MercadoPagoConfig`, `Preference`, `Payment`.

### Principio de diseño nº1: credenciales en DB, NO en env vars
Las credenciales de Mercado Pago **NO van en variables de entorno**. Se guardan en la base de datos y se administran desde un panel de admin. Esto permite a un admin no técnico configurar y cambiar entre modo **test** y **producción** sin redeploys. A esto lo llamamos **"dual-mode"**.

### 1) Modelo de configuración (settings) — "dual-mode"

Guardar un documento `settings/mercadopago` con esta forma:

```ts
type MercadoPagoMode = "test" | "production";

interface MercadoPagoModeCredentials {
  accessToken: string;    // empieza con "APP_USR-" (prod y test) o "TEST-" (test legacy)
  webhookSecret: string;  // secreto HMAC-SHA256 para verificar el webhook
}

interface MercadoPagoSettingsRaw {
  activeMode?: MercadoPagoMode;          // default "test"
  test?: MercadoPagoModeCredentials;
  production?: MercadoPagoModeCredentials;
  updatedAt?: Timestamp;
  updatedBy?: string;                    // email del admin que editó
}
```

Implementá estos **server actions** (archivo `server/actions/settings.ts`), que son la única vía de acceso a las credenciales:

- `getMercadoPagoSettings()` → para la **UI de admin**. Devuelve las credenciales **enmascaradas** con una función `maskSecret(v)` que muestra los primeros 6 y últimos 4 caracteres (`APP_US••••1234`). Nunca exponer el secreto completo al cliente.
- `getActiveMercadoPago()` → para **checkout y webhook**. Devuelve `{ mode, accessToken, webhookSecret }` del modo activo SIN enmascarar (sólo server-side). Devuelve `null` si el modo activo no tiene ambas credenciales.
- `getMercadoPagoSecrets()` → para el **webhook**. Devuelve AMBOS bloques (test y production) sin enmascarar, para poder verificar la firma contra los dos secretos (ver punto 5).
- `saveMercadoPagoCredentials({ mode, accessToken, webhookSecret, updatedBy })` → valida prefijo del token (`APP_USR-` o `TEST-` para test; `APP_USR-` para production), hace trim, y guarda con `merge:true`.
- `setMercadoPagoActiveMode({ mode, updatedBy })` → valida que el modo destino tenga ambas credenciales ANTES de activarlo; recién ahí cambia `activeMode`.
- `clearMercadoPagoMode({ mode })` / `disconnectMercadoPago()` → borran un bloque o todo el documento.

**Seguridad**: las credenciales se guardan en texto plano en Firestore PERO la colección `settings` está bloqueada por reglas de Firestore a sólo admin (lectura/escritura). La protección es la regla + el enmascarado en UI + acceso unmasked sólo server-side. (Si querés mayor seguridad, podés cifrar el token en reposo; el proyecto original no lo hace.)

### 2) UI de admin de configuración

Página `app/(admin)/admin/configuracion/page.tsx` (protegida por layout admin que chequea `isAdmin()`):
- Toggle de **modo activo**: botones "Pruebas" / "Producción". No deja activar un modo sin credenciales guardadas.
- Dos tarjetas (Test y Production), cada una con: campo **Access Token** (input password) y **Webhook Secret** (input password), botón Guardar y botón Limpiar. Muestra el valor actual enmascarado.
- **Badge de estado**: "Activo en Producción" / "Activo en Pruebas" / "Sin configurar".
- **URL del webhook** para copiar: `{origin}/api/webhooks/payment/mercadopago`, con instrucción de registrarla en el panel de desarrolladores de Mercado Pago suscribiendo el evento `payment`.
- Links útiles al panel de Mercado Pago y a la doc de tarjetas de prueba.

### 3) Cliente de Mercado Pago (wrapper)

Archivo `lib/mercadopago/client.ts`:

```ts
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { getActiveMercadoPago } from "@/server/actions/settings";

export async function getMercadoPagoContext() {
  const active = await getActiveMercadoPago();
  if (!active) return null;
  return { config: new MercadoPagoConfig({ accessToken: active.accessToken }), mode: active.mode };
}

export async function getPayment(paymentId) { /* new Payment(ctx.config).get({ id }) */ }
export async function searchPaymentsByExternalReference(ref) { /* payment.search({ options:{ external_reference: ref, sort:"date_created", criteria:"desc" }}) */ }
export async function createPreference(body, ctx?) { /* new Preference(ctx.config).create({ body }); devuelve { ok, mode, result } */ }

// true sólo si la URL es https público (no localhost / .local) — habilita auto_return
export function isPublicHttps(url) { /* ... */ }
```

### 4) Crear el pago (preference) y redirigir

En `lib/payments.ts`, función `createMercadoPagoPayment(params)`. Construir el body de la **preference** así:

- `items`: mapear cada item del carrito a `{ id, title, description, unit_price, quantity, currency_id: "ARS" }`. Agregar un item extra "Envío" si hay costo de envío.
- `payer`: `{ email, name?, surname?, phone? }` (partir el nombre completo en nombre/apellido).
- `back_urls`: `{ success, failure, pending }` (URLs de retorno de tu app).
- `auto_return: "approved"` **sólo si** `isPublicHttps(baseUrl)` (Mercado Pago rechaza auto_return con localhost).
- `external_reference: orderId` ← **CLAVE**: es lo que conecta el pago con tu orden en el webhook.
- `notification_url: {baseUrl}/api/webhooks/payment/mercadopago`.
- `statement_descriptor`, `binary_mode: false`, `expires: true`, `expiration_date_to` (ej. +24h).
- `payment_methods.excluded_payment_types: [{ id: "bank_transfer" }]` si la transferencia bancaria la manejás por fuera (flujo manual).

Tras crear la preference, elegir la URL de redirect según el modo:
```ts
const initPoint = result.mode === "test"
  ? (result.result.sandbox_init_point || result.result.init_point)
  : result.result.init_point;
```
Devolver `{ success, checkoutUrl: initPoint, paymentId: result.result.id }`. El frontend hace `window.location.href = checkoutUrl`.

**Orquestación de la orden** (`server/actions/orders.ts`):
- `createOrder(input)`: crea la orden en DB con `paymentStatus: "pending"`, `orderStatus: "pending"`, calcula subtotal/envío/descuento.
- `createOrderAndPayment(input, { successUrl, failureUrl, pendingUrl })`: crea la orden, llama a `createPayment`, guarda el `preferenceId` en la orden y devuelve `checkoutUrl`.

### 5) Webhook firmado (lo más importante de seguridad)

Route handler `app/api/webhooks/payment/mercadopago/route.ts`, método `POST`. Pasos:

1. Leer headers `x-signature` y `x-request-id`, y el body crudo (`await request.text()` y luego `JSON.parse`).
2. Sacar el `dataId` del pago: `body.data.id ?? body.id ?? ?data.id ?? ?id`. Si no hay, 400.
3. `getMercadoPagoSecrets()` y construir candidatos: primero el `webhookSecret` del modo activo, luego el del otro modo como **fallback** (cubre el caso de un webhook que llega justo después de cambiar de modo).
4. **Verificar la firma HMAC-SHA256** con cada candidato hasta que una valide. Si ninguna valida → 401.
5. Sólo procesar si `eventType === "payment"`; si no, responder `{ received: true, ignored }`.
6. `getPayment(dataId)` contra la API de MP para traer el estado real del pago. Sacar `orderId = payment.external_reference`.
7. **Audit trail**: crear doc en subcolección `orders/{orderId}/events/{eventId}` (eventId = `x-request-id`, garantiza **idempotencia**: si ya existe, devolver `{ idempotent: true }`). Guardar `receivedAt`, `source`, `eventType`, `dataId`, `verifiedMode`, `rawHeaders`, `rawBody`, `processed:false`.
8. Mapear estado MP → interno y actualizar la orden (ver puntos 6 y 7). Marcar el evento `processed:true` con `processedStatus`, `paymentMethod`, `skipped`.
9. Manejar la **race condition** webhook-llega-antes-que-la-orden con reintentos (`fetchOrderWithRetry`, delays `[100, 500, 2500]ms`).

**Algoritmo de firma** (`lib/mercadopago/signature.ts`) — replicar exacto, lo exige Mercado Pago:
```ts
// 1. Parsear header "ts=...,v1=..."
// 2. manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
// 3. expected = HMAC_SHA256(manifest, webhookSecret).hex()
// 4. comparar contra v1 con timingSafeEqual (constant-time)
```
Incluir tests unitarios del algoritmo de firma (`signature.test.ts`).

### 6) Mapeo de estados

`lib/mercadopago/status.ts` — `mapMercadoPagoStatus(mpStatus)`:
- `approved`, `authorized` → `completed`
- `rejected`, `cancelled` → `failed`
- `refunded`, `charged_back` → `refunded`
- `in_process`, `in_mediation`, `pending` → `processing`
- default → `pending`

### 7) Modelo de orden y actualización

Tipos: `paymentStatus: "pending" | "processing" | "completed" | "failed" | "refunded"`; `orderStatus: "pending" | "paid" | "shipped" | "delivered" | "cancelled"`.

`updateOrderPayment(orderId, paymentId, status, extra?)`:
- **Idempotencia**: si `paymentStatus` ya es el mismo, el `paymentId` coincide y `emailSent` es true → `{ skipped: true }`.
- Actualiza `paymentStatus`; si `status === "completed"` setea `orderStatus: "paid"`.
- Si pasa a `completed` y `!emailSent` → llama a `processCompletedOrder(orderId)` (genera links de descarga / envía emails / actualiza biblioteca, según tu dominio).

### 8) Páginas de retorno + actualización en tiempo real

- `/checkout/success?external_reference={orderId}`, `/checkout/failure`, `/checkout/pending`.
- Componente `OrderStatusListener`: escucha el doc de la orden con `onSnapshot` y además hace **polling de respaldo** a un server action `checkPaymentStatus(orderId)` que usa `searchPaymentsByExternalReference` (por si el webhook se demora). Limpia el carrito al completarse.

### (Opcional) Flujo de transferencia bancaria manual
Si lo necesitás: settings en `settings/transfer` (banco, titular, CBU/alias, % descuento, instrucciones). La orden se crea con `paymentProvider:"transfer"` SIN tocar MP; el comprador sube comprobante; queda `processing`; el admin confirma/rechaza desde un panel (`confirmTransferOrder` / `rejectTransferOrder`). No mezclar con el flujo MP — por eso se excluye `bank_transfer` del preference.

### Checklist de implementación
1. SDK `mercadopago` v2 + wrapper `lib/mercadopago/client.ts`.
2. Settings dual-mode en DB + server actions (`getActive`, `getSecrets`, `save`, `setActiveMode`).
3. UI admin de configuración con enmascarado y toggle de modo.
4. `createMercadoPagoPayment` con preference (external_reference, notification_url, sandbox/prod init_point).
5. Webhook firmado HMAC-SHA256 con verificación timing-safe + fallback de modo.
6. Audit trail idempotente en subcolección de eventos.
7. Mapeo de estados + `updateOrderPayment` idempotente con efecto `processCompletedOrder`.
8. Páginas success/failure/pending + listener tiempo real con polling de respaldo.
9. Reglas de DB: bloquear `settings` a admin; eventos sólo lectura admin.

### Archivos de referencia (nombres del proyecto original)
- `server/actions/settings.ts` — settings dual-mode
- `lib/mercadopago/client.ts` — wrapper SDK
- `lib/mercadopago/signature.ts` (+ `.test.ts`) — firma HMAC
- `lib/mercadopago/status.ts` — mapeo de estados
- `lib/payments.ts` — creación de preference
- `server/actions/orders.ts` — orden + updateOrderPayment + processCompletedOrder
- `app/api/webhooks/payment/mercadopago/route.ts` — webhook
- `app/(admin)/admin/configuracion/page.tsx` — UI admin
- `components/checkout/*` — formulario y listener de estado
