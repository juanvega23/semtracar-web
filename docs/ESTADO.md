# ESTADO del proyecto — Semtracar Web

> Memoria del proyecto entre turnos. **La IA lo lee completo al iniciar y lo actualiza al cerrar cada turno**
> (ver `AGENTS.md`). Manda sobre el brief en cuanto a avance y decisiones; el flujo de Git es el de D8.

## Turno actual
**T3 · Alberto**. Estado: Pendiente (T2 cerrado el 31-oct-2026)
Siguiente: T4 · Juan (cierre)

## Turnos
| Turno | Integrante | Alcance | Estado | Tag | Inicio | Cierre |
|---|---|---|---|---|---|---|
| T1 | Juan | Base, auth, accesos, usuarios, app_config, esqueleto de features | Cerrado | `turno-1-juan` | 30-oct-2026 | 31-oct-2026 |
| T2 | Daviana | Paquetes, modo almacén, facturación y pagos, retiro por REC, CSV | Cerrado | `turno-2-daviana` | 31-oct-2026 | 31-oct-2026 |
| T3 | Alberto | Cotizador, seguimiento, recibos del cliente + PDF/QR, delivery + push, pedidos admin | Pendiente | `turno-3-alberto` | | |
| T4 | Juan | Avisos, correos, dashboard, pruebas RLS y por rol, deploy final | Pendiente | `v1.0.0` | | |

Estados de turno: Pendiente · En curso · Cerrado

## Requerimientos funcionales
Estados: Pendiente · En curso · Hecho · Parcial · No hecho · Fuera de alcance

| RF | Descripción corta | Turno | Estado | Notas |
|---|---|---|---|---|
| RF-01 | Registro (nombre, apellido, correo, contraseña, dirección, teléfono) | T1 | Hecho | `features/auth` → RegisterPage |
| RF-02 | Validar correo no registrado | T1 | Hecho | RPC `is_email_registered` + identidades vacías de signUp |
| RF-03 | Validar nombre + apellido no duplicado | T1 | Hecho | RPC `is_name_registered` (también al editar perfil) |
| RF-04 | Casillero único automático | T1 | Hecho | Lo asigna la BD: trigger `handle_new_user` → `NCX-` + 6 caracteres del id |
| RF-05 | Login con sesión persistente | T1 | Hecho | supabase-js persiste la sesión; `SessionProvider` |
| RF-06 | Recuperar contraseña por correo | T1 | Hecho | Redirección a `/reset-password`. Producción permite `http://localhost:5173/**` (Auth → URL Configuration); al publicar la web hay que agregar su dominio |
| RF-07 | Cerrar sesión desde cualquier pantalla | T1 | Hecho | Menú de usuario (escritorio y móvil) |
| RF-08 | Ver/editar perfil y ver casillero | T1 | Hecho | `features/perfil`. El correo no se edita desde la web |
| RF-09 | Redirigir por rol (repartidor → "Tu rol usa la aplicación móvil" + signOut) | T1 | Hecho | `/app-movil` cierra la sesión |
| RF-10 | Cambio de rol en tiempo real sin cerrar sesión | T1 | Hecho | Realtime sobre `users` (`useCurrentUserRealtime`) |
| RF-11 | Calcular costo estimado de envío | T3 | Pendiente | |
| RF-12 | Tarifas base (aéreo 6.50, marítimo 3.50) | T3 | Pendiente | Leer con `useAppConfig()` de `src/lib/appConfig.ts` |
| RF-13 | Multiplicadores por categoría | T3 | Pendiente | Leer con `useAppConfig()` de `src/lib/appConfig.ts` |
| RF-14 | Validar peso (> 0, ≤ 1000, decimal) | T3 | Pendiente | |
| RF-15 | Mostrar desglose y total | T3 | Pendiente | |
| RF-16 | Registrar paquete asignado a cliente | T2 | Hecho | Solo almacén (D2). Precio automático: peso × tarifa × multiplicador de `useAppConfig()`; "Otros" ×1.0 como la app. No se edita a mano |
| RF-17 | Código de rastreo único | T2 | Hecho | Restricción `packages_tracking_code_key` en la BD; la web avisa si se repite |
| RF-18 | Excluir almacén/repartidor del buscador de clientes | T2 | Hecho | `findClients` filtra `role = 'cliente'` |
| RF-19 | Listado de paquetes por cliente, estado o código | T2 | Hecho | Código y cliente se filtran en la BD; estado, sobre el último registro del historial |
| RF-20 | Actualizar estado con fecha, hora y ubicación | T2 | Hecho | Ubicación en `notes`; fecha y hora = `created_at` (Managua) |
| RF-21 | 4 estados (Recibido, En tránsito, En aduana, Listo para recoger) | T2 | Hecho | Catálogo `status_types`; solo avanza de uno en uno |
| RF-22 | Historial de estados cronológico e inmutable | T2 | Hecho | La web solo inserta. Ojo: la RLS deja a un admin editar o borrar historial (ver problemas conocidos del T2) |
| RF-23 | Marcar pagado / no pagado | T2 | Hecho | Automático como en la app: `register_payment` marca `is_paid` al quedar pagado y anular lo revierte. Sin interruptor manual |
| RF-24 | Cliente ve solo sus paquetes | T3 | Pendiente | Realtime: hoy solo `users` e `invoices` emiten cambios (ver Notas del T1) |
| RF-25 | Buscar paquete por código | T3 | Pendiente | |
| RF-26 | Línea de tiempo visual | T3 | Pendiente | |
| RF-27 | Fechas en hora local | T3 | Pendiente | |
| RF-28 | Indicador de estado de pago | T3 | Pendiente | |
| RF-29 | Recibo automático al llegar a "Listo para recoger" | T2 | Hecho | D1: RPC `transition_package_ready` (en producción desde el 31-oct-2026) |
| RF-30 | Recibo + ítems en una transacción | T2 | Hecho | `transition_package_ready` llama a `create_invoice` e inserta el estado 4 en la misma transacción |
| RF-31 | Número correlativo REC-00000 | T2 | Hecho | `formatInvoiceNumber` |
| RF-32 | Subtotal, impuesto, delivery y total | T2 | Hecho | D3. El detalle muestra subtotal, impuesto, delivery (si lo tiene) y total |
| RF-33 | Sumar delivery ($3.58) al solicitarlo | T3 | Pendiente | Lo aplica la solicitud de delivery. Monto: `useAppConfig().deliveryCost` |
| RF-34 | Pagos totales o parciales | T2 | Hecho | RPC `register_payment`; montos en centavos para evitar errores de redondeo |
| RF-35 | 5 métodos de pago | T2 | Parcial | La BD solo acepta 4 métodos (efectivo, transferencia, tarjeta_datafono, tarjeta_online). "Contra entrega" lo cobra el repartidor en la app |
| RF-36 | Saldo pendiente | T2 | Hecho | Total − pagos, en Facturación y Retiro |
| RF-37 | Anular recibo y revertir pago de paquetes | T2 | Parcial | RPC `cancel_unpaid_invoice` (en producción desde el 31-oct-2026): anula y revierte `is_paid`, **solo si el recibo no tiene pagos** (Juan lo dejó así: anular uno pagado implicaría devoluciones). Falta: un paquete con su recibo anulado no puede generar uno nuevo desde la web |
| RF-38 | Cliente consulta historial de recibos y pagos | T3 | Pendiente | |
| RF-39 | Un recibo activo por paquete | T2 | Hecho | `transition_package_ready` rechaza si el paquete ya tiene un recibo no anulado |
| RF-40 | Descargar/imprimir recibo en PDF | T3 | Pendiente | También botón en facturación admin |
| RF-41 | QR asociado a cada recibo | T3 | Pendiente | |
| RF-42 | Mostrar y descargar QR | T3 | Pendiente | |
| RF-43 | Validar retiro buscando REC | T2 | Hecho | `features/retiro`: busca por `REC-00000` |
| RF-44 | Mostrar cliente y estado de pago al validar | T2 | Hecho | Muestra cliente, casillero, pagos y saldo |
| RF-45 | Cobrar saldo antes de autorizar el retiro | T2 | Hecho | Cobro con el mismo modal de Facturación (solo admin) |
| RF-46 | Rechazar recibos inexistentes | T2 | Hecho | Recibo inexistente → mensaje; recibo anulado → no autoriza el retiro |
| RF-47 | Solicitar delivery de un recibo | T3 | Pendiente | + push a repartidores |
| RF-48 | Delivery de varios paquetes en un pedido | T3 | Pendiente | + push a repartidores |
| RF-49 | Rechazar delivery (retiro en sucursal por defecto) | T3 | Pendiente | |
| RF-50 | Guardar dirección y teléfono en el perfil | T3 | Pendiente | Reutilizar `updateProfile` de `@/features/perfil` |
| RF-51 | Estado del pedido, horas y repartidor asignado | T3 | Pendiente | Sin mapa (fuera de alcance) |
| RF-52 | Admin ve pedidos y repartidor | T3 | Pendiente | |
| RF-53 | Admin cancela pedido | T3 | Pendiente | |
| RF-54 | Centro de avisos con contador | T4 | Pendiente | Tabla `notifications` (D5) |
| RF-55 | Avisos en tiempo real | T4 | Pendiente | |
| RF-56 | Correos ante eventos críticos | T4 | Pendiente | Edge Function |
| RF-57 | Marcar avisos como leídos e historial | T4 | Pendiente | |
| RF-58 | Dashboard de indicadores | T4 | Pendiente | |
| RF-59 | Reporte de entregas por repartidor | T4 | Pendiente | |
| RF-60 | Listar, buscar y consultar usuarios | T1 | Hecho | `features/usuarios`, búsqueda y paginación en servidor |
| RF-61 | Promover cliente a repartidor | T1 | Hecho | RPC `promote_to_repartidor` |
| RF-62 | Asignar rol almacén | T1 | Hecho | RPC nueva `set_user_role` (cliente ↔ almacén) |
| RF-63 | Exportar CSV (paquetes, recibos, pedidos) | T2 / T3 | Parcial | T2 hecho: `lib/csv.ts` (UTF-8 con BOM, coma, protegido contra fórmulas) + paquetes y recibos. T3: pedidos |
| RF-64 | RBAC: cliente, repartidor, almacén, admin | T1 | Hecho | `features/acceso/roles.ts` (misma prioridad de roles que la app móvil) |
| RF-65 | Restricciones del encargado de almacén | T1 / T2 | Hecho | T1: navegación (D9). T2: dentro de Paquetes solo registra y avanza a estados 1–2, sin ver pagos |
| RF-66 | Candado en secciones no autorizadas | T1 | Hecho | `RequireAccess` + candado en el menú |
| RF-67 | Almacén ve solo paquetes y estados permitidos | T2 | Hecho | Almacén solo ve estados 1–2 y no ve el estado de pago. La RLS limita su inserción a los estados 1–2. Ver problemas conocidos |
| RF-68 | Rutas protegidas por rol | T1 | Hecho | `RequireAuth` + `RequireAccess` en cada `routes.tsx` |

Otros: RNF-34 `app_config` (T1, **Hecho**: tabla + `src/lib/appConfig.ts`) · RNF-42 términos y privacidad (T1, **Hecho**: texto base en `/terminos` y `/privacidad`; la empresa debe revisarlo) · RNF-01 pruebas de RLS (T4) · RNF-20 navegadores (T4)

## Decisiones
| ID | Tema | Estado | Resolución | Quién / fecha |
|---|---|---|---|---|
| D0 | Repartidor fuera de la web (pantalla app móvil), sin mapa, sin push en la web, QR sin cámara | Resuelta | Como dice el brief §2 | Equipo · 30-oct-2026 |
| D1 | RF-29: recibo automático (trigger) o manual (create_invoice como en la app) | Resuelta | Automático **sin trigger**: la RPC `transition_package_ready` pasa el paquete a "Listo para recoger" y crea el recibo con `create_invoice` en una sola transacción. La app móvil no cambia | Daviana, revisado por Juan · 31-oct-2026 |
| D2 | Matriz: ¿admin bloqueado para asignar paquetes nuevos? | Resuelta | Sí: solo almacén registra paquetes nuevos. El admin consulta, avanza estados (incluido el 4), cobra y anula | Daviana · 31-oct-2026 |
| D3 | Tasa y cálculo del impuesto (`tax_amount`) | Resuelta | Impuesto 0, como lo calcula hoy `create_invoice` en el backend (igual que la app). La web no recalcula montos; si cambia la tasa, se cambia en la BD | Daviana · 31-oct-2026 |
| D4 | Nombre visible: "Semtracar" o "Nica Cargo Xpress" | Resuelta | Siempre **SEMTRACAR** (logo naranja + azul). No se usa la marca ni el logo de Nica Cargo Xpress | Juan · 30-oct-2026 |
| D5 | Diseño de la tabla `notifications` y eventos que la alimentan | Pendiente | | |
| D6 | ¿Proyecto Supabase separado para desarrollo? | Resuelta | No se crea otro proyecto en la nube. Las migraciones se prueban en Supabase local (Docker: `supabase start` + `supabase db reset`) antes de que Juan haga `supabase db push` al proyecto real `cargo-express3` | Juan · 30-oct-2026 |
| D7 | Mapa "Ubicación del paquete" de la referencia visual | Resuelta | Sin mapa embebido: se muestra la dirección de la sucursal y un botón "Cómo llegar" que abre Google Maps en otra pestaña. Sin librería de mapas | Juan · 30-oct-2026 |
| D8 | Flujo de Git (reemplaza brief §7.3–7.4 y §8.2–8.6 en lo que toca a GitHub) | Resuelta | Commits directo a `main`, con `git pull` antes de empezar y verificaciones en verde antes de `git push`. **Sin** Pull Requests, Issues, milestones, etiquetas, tablero ni protección de `main`, y sin asignar ni mencionar a nadie en GitHub. Se mantienen los tags `turno-N-nombre`. Detalle en `AGENTS.md` → "Git" | Juan · 30-oct-2026 |
| D9 | Qué ve el encargado de almacén en el menú (brief §2 y §5.1 no lo cubren todo) | Resuelta | Paquetes: entra. Facturación y Pedidos: visibles con candado. Retiro, Dashboard y Usuarios: ocultos. Se cambia en `features/acceso/roles.ts` | Juan · 30-oct-2026 |
| D10 | Menú y rutas del cliente | Resuelta | Como la referencia visual: Rastreo (`/rastreo`), Historial = recibos (`/historial`), Delivery (`/delivery`), Cotizar (`/cotizar`). Avisos en la campana (`/avisos`) y perfil en el menú de usuario | Juan · 30-oct-2026 |
| D11 | Publicación de la web (Vercel) | Resuelta | Se pospone: por ahora la web solo corre en local (`npm run dev`). `vercel.json` ya está listo. Al publicar: importar el repo, poner `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` y agregar el dominio en las Redirect URLs de Supabase | Juan · 31-oct-2026 |

## Migraciones aplicadas
| Archivo | Turno | Qué hace | ¿Aplicada en producción? |
|---|---|---|---|
| `20261030000000_remote_schema.sql` | T1 | Esquema `public` de producción obtenido con `supabase db dump` (solo lectura). Clave `service_role` y secreto del webhook reemplazados por marcadores | Ya existía. Marcada como aplicada con `migration repair` (30-oct-2026). **Nunca aplicarla en producción** |
| `20261030000100_catalogos.sql` | T1 | Catálogos (estados, métodos de envío, tipos de paquete) con los ids de producción | Sí, 30-oct-2026 (sin cambios en producción) |
| `20261030000200_trigger_auth_usuario_nuevo.sql` | T1 | Trigger `auth.users` → `handle_new_user` (casillero, RF-04) solo si no existe | Sí, 30-oct-2026 (sin cambios en producción) |
| `20261030010000_proteger_columnas_users.sql` | T1 | **Seguridad:** un usuario no puede cambiarse `role`, `is_admin` ni `casillero` | Sí, 30-oct-2026 (cerraba una escalada a admin) |
| `20261030010100_rpc_registro_y_roles.sql` | T1 | RPC `is_email_registered`, `is_name_registered` (RF-02, RF-03) y `set_user_role` (RF-62) | Sí, 30-oct-2026 |
| `20261030010200_app_config.sql` | T1 | Tabla `app_config` con tarifas, multiplicadores y delivery (RNF-34) | Sí, 30-oct-2026 |
| `20261101010445_transition_package_ready.sql` | T2 | RPC `transition_package_ready` (D1, RF-29/30/39): estado 4 + recibo en una transacción, con bloqueo contra recibos dobles. Solo admin | Sí, 31-oct-2026 |
| `20261101020000_cancel_invoice_unpaid.sql` | T2 | RPC `cancel_unpaid_invoice` (RF-37): anula un recibo **sin pagos** y revierte `is_paid`. Solo admin | Sí, 31-oct-2026 |

Las de T1 están probadas en Supabase local (`supabase db reset`). Las de T2 las probaron Daviana y Juan en local (9 casos:
permisos, saltos de estado, recibo doble, anular con pagos, anular dos veces). Solo Juan aplica en producción.
Después de aplicarlas se regeneró `database.ts` y se quitaron los tipos temporales (`TransactionDatabase`, `as never`).
`src/types/database.ts` generado desde producción (`--linked`) después del `db push`.

## Bitácora de relevos
Copiar la plantilla para cada turno cerrado. La entrada más reciente va arriba.

<!-- PLANTILLA
### TN · Nombre (fecha inicio → fecha cierre)
**Hecho:** RF-xx, RF-yy…
**Parcial / no hecho:** RF-zz (motivo y qué falta)
**Archivos y servicios clave:** ruta → para qué sirve
**Decisiones tomadas:** D# → resolución
**Desviaciones del brief:** …
**Migraciones:** …
**Problemas conocidos:** …
**Notas para el siguiente:** qué necesita saber, por dónde empezar, qué reutilizar
-->

### T2 · Daviana (31-oct-2026 → 31-oct-2026)
**Hecho:** RF-16 a RF-23, RF-29 a RF-32, RF-34, RF-36, RF-39, RF-43 a RF-46, RF-65 y RF-67. De RF-63, la parte de T2
(paquetes y recibos).
**Parcial / no hecho:**
- RF-35: la BD solo acepta 4 métodos de pago; "Contra entrega" lo cobra el repartidor desde la app.
- RF-37: solo se anulan recibos **sin pagos**, y la migración está pendiente de la revisión de Juan. Falta decidir si se
  pueden anular recibos con pagos y qué pasa con esos pagos.
- RF-63: falta exportar pedidos (T3).
**Archivos y servicios clave:**
- `src/features/paquetes/services/packagesService.ts` → listado con filtros (RF-19), buscador de clientes (RF-18) y registro.
- `src/features/paquetes/services/packageStatusService.ts` → historial, avance de estados y `markPackageReady` (RPC de D1).
- `src/features/facturacion/services/invoicesService.ts` → recibos, detalle, `registerPayment`, `cancelUnpaidInvoice` y
  `PAYMENT_METHODS`.
- `@/features/facturacion` exporta `InvoiceDetailModal` (detalle + cobro + anular) y los tipos `Invoice` e `InvoiceDetail`.
  Retiro ya lo reutiliza.
- `src/features/retiro` → búsqueda por REC y validación del retiro.
- `src/lib/csv.ts` → `downloadCsv(nombre, encabezados, filas)`: UTF-8 con BOM, coma y protección contra fórmulas.
**Decisiones tomadas:** D1, D2 y D3.
**Desviaciones del brief:** RF-35 con 4 métodos (límite de la BD). En Retiro no hay botón "Confirmar entrega física": la
BD no tiene dónde guardarlo, y RF-43 a RF-46 solo piden validar el REC, mostrar cliente y saldo, cobrar y rechazar
recibos inexistentes (acordado con Juan). No se crearon tablas nuevas.
**Migraciones:** 2 nuevas, **ninguna aplicada en producción** (ver "Migraciones aplicadas"). Mientras no estén,
"Listo para recoger" y "Anular" muestran un aviso claro en vez de fallar en silencio. Después de aplicarlas hay que
regenerar `database.ts` y quitar el tipo temporal `TransactionDatabase` de `packageStatusService.ts` y el `as never`
de `cancelUnpaidInvoice`.
**Problemas conocidos:**
- Filtro de almacén (RF-67) y de estado (RF-19): el último estado sale de `package_status_history`, así que se filtra
  después de traer los paquetes. Para almacén, la página de 15 puede quedar con menos filas y el contador sigue contando
  el total ("1–15 de 40"). La app móvil hace lo mismo. Se arregla con una vista o RPC con el estado actual (revisa Juan).
- El registro de un paquete y su estado inicial ("Recibido en Estados Unidos") son dos inserciones; si falla la segunda,
  la web avisa que no se registre otra vez. Lo ideal sería una RPC transaccional.
- La RLS deja a un admin editar o borrar `package_status_history`: la web no lo hace, pero en la BD el historial no es
  inmutable (para las pruebas RLS de T4).
- Las migraciones de T2 llevan fecha 2026-11-01 en el nombre (posterior al cierre). Si Juan crea otra antes de esa
  fecha, quedará ordenada antes; conviene revisarlo al aplicarlas.
**Notas para el siguiente (T3 · Alberto):**
- Recibos del cliente (RF-38): el tipo `Invoice` y `InvoiceDetailModal` vienen de `@/features/facturacion`. El modal
  incluye cobro y "Anular" para admin; revísalo antes de reutilizarlo con el cliente o arma una vista de solo lectura.
- Seguimiento (RF-24 a RF-28): el catálogo de estados y el historial están en `packageStatusService.ts`, pero todavía
  no se exportan desde `@/features/paquetes`. Si los necesitas, expórtalos en su `index.ts` (commit aparte, anótalo).
- CSV de pedidos (RF-63): usa `downloadCsv` de `@/lib/csv`.
- Delivery (RF-33/47/48): el detalle del recibo ya muestra la línea "Delivery" cuando `has_delivery` es verdadero.
- Para probar "Listo para recoger" y "Anular" en local, `supabase db reset` aplica las migraciones de T2.

### T1 · Juan (30-oct-2026 → 31-oct-2026)
**Hecho:** base del proyecto (Vite + React + TS, Tailwind, ESLint, Prettier, Vitest, CI en GitHub Actions),
RF-01 a RF-10, RF-60 a RF-62, RF-64, RF-66, RF-68, RNF-34 (`app_config`), RNF-42 (términos y privacidad) y el
esqueleto de todas las features con página "Próximamente".
**Parcial / no hecho:** RF-65: T1 hizo el menú por rol (D9); las restricciones dentro de Paquetes son de T2 (con RF-67).
**Archivos y servicios clave:**
- `src/components/ui` → componentes base (ver `AGENTS.md` → "Qué reutilizar"). Úsalos en vez de crear otros.
- `src/lib/format.ts` (USD, fechas en Managua, `REC-00000`), `src/lib/errors.ts`, `src/lib/appConfig.ts`.
- `src/features/acceso/roles.ts` → roles, matriz `ACCESS` y página de inicio por rol. `RequireAccess section="…"` protege cada ruta.
- `src/app/routes.tsx` → router central; cada feature aporta su `routes.tsx` y su entrada en `src/app/navigation.ts`.
- `src/features/usuarios/services/usersService.ts` → ejemplo de servicio con búsqueda y paginación en servidor.
**Decisiones tomadas:** D4, D6, D7, D8, D9, D10 y D11.
**Desviaciones del brief:** flujo de Git sin PR ni Issues (D8). Sin publicar en Vercel por ahora (D11).
**Migraciones:** 6 (ver "Migraciones aplicadas"). La más importante cierra una escalada de privilegios: antes cualquier
cliente podía ponerse `is_admin = true` desde la API. Ahora un trigger lo impide (solo admins o SQL del panel).
**Problemas conocidos:**
- Realtime en producción solo publica `users` e `invoices`. Para ver cambios de `packages`, `package_status_history`
  o `deliveries` en vivo hace falta una migración que los agregue a `supabase_realtime` (revisa Juan).
- Las RLS no dejan que un admin edite a otros usuarios directamente: para eso existen RPC (`set_user_role`,
  `promote_to_repartidor`). Si una pantalla necesita escribir algo que la RLS no permite, pedir una RPC a Juan.
- Los textos de `/terminos` y `/privacidad` son una base; la empresa debe revisarlos.
- `20261030000000_remote_schema.sql` tiene secretos reemplazados por marcadores: **nunca** aplicarla en producción.
**Notas para el siguiente (T2 · Daviana):**
- Antes de programar, resolver con Juan D1 (recibo automático o manual), D2 (admin y paquetes nuevos) y D3 (impuesto).
- Paquetes, Facturación y Retiro ya tienen ruta, menú y candado; reemplaza la página "Próximamente" de cada feature.
- Modo almacén: `useRequiredCurrentUser()` da el rol; la matriz está en `roles.ts` (D9). RF-18: excluir a almacén y
  repartidor del buscador de clientes.
- Usa siempre los tipos de `src/types/database.ts` y las RPC existentes (`create_invoice`, `register_payment`).
- Prueba en Supabase local (D6): `supabase start`, crea `.env.development.local` y regístrate en la web local (no pide
  confirmar correo). Para volver admin a una cuenta local, actualiza `users.is_admin` con SQL en la base local.

### T0 · Planificación, Juan (30-oct-2026)
**Hecho:** brief v1.1 (`docs/brief-semtracar-web.pdf`), `AGENTS.md`, `CLAUDE.md` y este archivo.
**Notas para el siguiente (T1 · Juan):** el repo está vacío salvo estos documentos. Empezar por la base del proyecto
(brief §7.2, fila T1), luego `supabase db pull` y los tipos generados. ~~Crear todos los Issues con milestones~~
(anulado por D8: no se usan Issues ni PR).
