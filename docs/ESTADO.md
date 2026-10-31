# ESTADO del proyecto — Semtracar Web

> Memoria del proyecto entre turnos. **La IA lo lee completo al iniciar y lo actualiza al cerrar cada turno**
> (ver `AGENTS.md`). Manda sobre el brief en cuanto a avance y decisiones; el flujo de Git es el de D8.

## Turno actual
**T2 · Daviana**. Estado: Pendiente (T1 cerrado el 31-oct-2026)
Siguiente: T3 · Alberto

## Turnos
| Turno | Integrante | Alcance | Estado | Tag | Inicio | Cierre |
|---|---|---|---|---|---|---|
| T1 | Juan | Base, auth, accesos, usuarios, app_config, esqueleto de features | Cerrado | `turno-1-juan` | 30-oct-2026 | 31-oct-2026 |
| T2 | Daviana | Paquetes, modo almacén, facturación y pagos, retiro por REC, CSV | Pendiente | `turno-2-daviana` | | |
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
| RF-16 | Registrar paquete asignado a cliente | T2 | Pendiente | Ver decisión D2 |
| RF-17 | Código de rastreo único | T2 | Pendiente | |
| RF-18 | Excluir almacén/repartidor del buscador de clientes | T2 | Pendiente | |
| RF-19 | Listado de paquetes por cliente, estado o código | T2 | Pendiente | |
| RF-20 | Actualizar estado con fecha, hora y ubicación | T2 | Pendiente | |
| RF-21 | 4 estados (Recibido, En tránsito, En aduana, Listo para recoger) | T2 | Pendiente | |
| RF-22 | Historial de estados cronológico e inmutable | T2 | Pendiente | |
| RF-23 | Marcar pagado / no pagado | T2 | Pendiente | |
| RF-24 | Cliente ve solo sus paquetes | T3 | Pendiente | Realtime: hoy solo `users` e `invoices` emiten cambios (ver Notas del T1) |
| RF-25 | Buscar paquete por código | T3 | Pendiente | |
| RF-26 | Línea de tiempo visual | T3 | Pendiente | |
| RF-27 | Fechas en hora local | T3 | Pendiente | |
| RF-28 | Indicador de estado de pago | T3 | Pendiente | |
| RF-29 | Recibo automático al llegar a "Listo para recoger" | T2 | Pendiente | Ver decisión D1 |
| RF-30 | Recibo + ítems en una transacción | T2 | Pendiente | RPC `create_invoice` |
| RF-31 | Número correlativo REC-00000 | T2 | Pendiente | |
| RF-32 | Subtotal, impuesto, delivery y total | T2 | Pendiente | Ver decisión D3 |
| RF-33 | Sumar delivery ($3.58) al solicitarlo | T3 | Pendiente | Lo aplica la solicitud de delivery. Monto: `useAppConfig().deliveryCost` |
| RF-34 | Pagos totales o parciales | T2 | Pendiente | RPC `register_payment` |
| RF-35 | 5 métodos de pago | T2 | Pendiente | |
| RF-36 | Saldo pendiente | T2 | Pendiente | |
| RF-37 | Anular recibo y revertir pago de paquetes | T2 | Pendiente | |
| RF-38 | Cliente consulta historial de recibos y pagos | T3 | Pendiente | |
| RF-39 | Un recibo activo por paquete | T2 | Pendiente | |
| RF-40 | Descargar/imprimir recibo en PDF | T3 | Pendiente | También botón en facturación admin |
| RF-41 | QR asociado a cada recibo | T3 | Pendiente | |
| RF-42 | Mostrar y descargar QR | T3 | Pendiente | |
| RF-43 | Validar retiro buscando REC | T2 | Pendiente | |
| RF-44 | Mostrar cliente y estado de pago al validar | T2 | Pendiente | |
| RF-45 | Cobrar saldo antes de autorizar el retiro | T2 | Pendiente | |
| RF-46 | Rechazar recibos inexistentes | T2 | Pendiente | |
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
| RF-63 | Exportar CSV (paquetes, recibos, pedidos) | T2 / T3 | Pendiente | T2 crea `lib/csv.ts` + paquetes y recibos; T3 pedidos |
| RF-64 | RBAC: cliente, repartidor, almacén, admin | T1 | Hecho | `features/acceso/roles.ts` (misma prioridad de roles que la app móvil) |
| RF-65 | Restricciones del encargado de almacén | T1 / T2 | Parcial | T1 hecho: navegación (D9). T2: restricciones dentro de paquetes |
| RF-66 | Candado en secciones no autorizadas | T1 | Hecho | `RequireAccess` + candado en el menú |
| RF-67 | Almacén ve solo paquetes y estados permitidos | T2 | Pendiente | |
| RF-68 | Rutas protegidas por rol | T1 | Hecho | `RequireAuth` + `RequireAccess` en cada `routes.tsx` |

Otros: RNF-34 `app_config` (T1, **Hecho**: tabla + `src/lib/appConfig.ts`) · RNF-42 términos y privacidad (T1, **Hecho**: texto base en `/terminos` y `/privacidad`; la empresa debe revisarlo) · RNF-01 pruebas de RLS (T4) · RNF-20 navegadores (T4)

## Decisiones
| ID | Tema | Estado | Resolución | Quién / fecha |
|---|---|---|---|---|
| D0 | Repartidor fuera de la web (pantalla app móvil), sin mapa, sin push en la web, QR sin cámara | Resuelta | Como dice el brief §2 | Equipo · 30-oct-2026 |
| D1 | RF-29: recibo automático (trigger) o manual (create_invoice como en la app) | Pendiente | | |
| D2 | Matriz: ¿admin bloqueado para asignar paquetes nuevos? | Pendiente | | |
| D3 | Tasa y cálculo del impuesto (`tax_amount`) | Pendiente | | |
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

Todas probadas en Supabase local (`supabase db reset`). Solo Juan aplica en producción.
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
