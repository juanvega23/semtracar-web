# ESTADO del proyecto — Semtracar Web

> Memoria del proyecto entre turnos. **La IA lo lee completo al iniciar y lo actualiza al cerrar cada turno**
> (brief §7.3 y §7.4). Manda sobre el brief en cuanto a avance y decisiones.

## Turno actual
**T1 · Juan**. Estado: En curso
Siguiente: T2 · Daviana

## Turnos
| Turno | Integrante | Alcance | Estado | Tag | Inicio | Cierre |
|---|---|---|---|---|---|---|
| T1 | Juan | Base, auth, accesos, usuarios, app_config, esqueleto de features, Issues | En curso | `turno-1-juan` | 30-oct-2026 | |
| T2 | Daviana | Paquetes, modo almacén, facturación y pagos, retiro por REC, CSV | Pendiente | `turno-2-daviana` | | |
| T3 | Alberto | Cotizador, seguimiento, recibos del cliente + PDF/QR, delivery + push, pedidos admin | Pendiente | `turno-3-alberto` | | |
| T4 | Juan | Avisos, correos, dashboard, pruebas RLS y por rol, deploy final | Pendiente | `v1.0.0` | | |

Estados de turno: Pendiente · En curso · Cerrado

## Requerimientos funcionales
Estados: Pendiente · En curso · Hecho · Parcial · No hecho · Fuera de alcance

| RF | Descripción corta | Turno | Estado | Issue / notas |
|---|---|---|---|---|
| RF-01 | Registro (nombre, apellido, correo, contraseña, dirección, teléfono) | T1 | Pendiente | |
| RF-02 | Validar correo no registrado | T1 | Pendiente | |
| RF-03 | Validar nombre + apellido no duplicado | T1 | Pendiente | |
| RF-04 | Casillero único automático | T1 | Pendiente | Verificar cómo lo asigna la BD |
| RF-05 | Login con sesión persistente | T1 | Pendiente | |
| RF-06 | Recuperar contraseña por correo | T1 | Pendiente | Agregar URLs web en Auth → Redirect URLs |
| RF-07 | Cerrar sesión desde cualquier pantalla | T1 | Pendiente | |
| RF-08 | Ver/editar perfil y ver casillero | T1 | Pendiente | |
| RF-09 | Redirigir por rol (repartidor → "Tu rol usa la aplicación móvil" + signOut) | T1 | Pendiente | |
| RF-10 | Cambio de rol en tiempo real sin cerrar sesión | T1 | Pendiente | |
| RF-11 | Calcular costo estimado de envío | T3 | Pendiente | |
| RF-12 | Tarifas base (aéreo 6.50, marítimo 3.50) | T3 | Pendiente | Leer de `app_config` (creada en T1) |
| RF-13 | Multiplicadores por categoría | T3 | Pendiente | Leer de `app_config` |
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
| RF-24 | Cliente ve solo sus paquetes | T3 | Pendiente | |
| RF-25 | Buscar paquete por código | T3 | Pendiente | |
| RF-26 | Línea de tiempo visual | T3 | Pendiente | |
| RF-27 | Fechas en hora local | T3 | Pendiente | |
| RF-28 | Indicador de estado de pago | T3 | Pendiente | |
| RF-29 | Recibo automático al llegar a "Listo para recoger" | T2 | Pendiente | Ver decisión D1 |
| RF-30 | Recibo + ítems en una transacción | T2 | Pendiente | RPC `create_invoice` |
| RF-31 | Número correlativo REC-00000 | T2 | Pendiente | |
| RF-32 | Subtotal, impuesto, delivery y total | T2 | Pendiente | Ver decisión D3 |
| RF-33 | Sumar delivery ($3.58) al solicitarlo | T3 | Pendiente | Lo aplica la solicitud de delivery |
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
| RF-50 | Guardar dirección y teléfono en el perfil | T3 | Pendiente | |
| RF-51 | Estado del pedido, horas y repartidor asignado | T3 | Pendiente | Sin mapa (fuera de alcance) |
| RF-52 | Admin ve pedidos y repartidor | T3 | Pendiente | |
| RF-53 | Admin cancela pedido | T3 | Pendiente | |
| RF-54 | Centro de avisos con contador | T4 | Pendiente | Tabla `notifications` (D5) |
| RF-55 | Avisos en tiempo real | T4 | Pendiente | |
| RF-56 | Correos ante eventos críticos | T4 | Pendiente | Edge Function |
| RF-57 | Marcar avisos como leídos e historial | T4 | Pendiente | |
| RF-58 | Dashboard de indicadores | T4 | Pendiente | |
| RF-59 | Reporte de entregas por repartidor | T4 | Pendiente | |
| RF-60 | Listar, buscar y consultar usuarios | T1 | Pendiente | |
| RF-61 | Promover cliente a repartidor | T1 | Pendiente | RPC `promote_to_repartidor` |
| RF-62 | Asignar rol almacén | T1 | Pendiente | |
| RF-63 | Exportar CSV (paquetes, recibos, pedidos) | T2 / T3 | Pendiente | T2 crea `lib/csv.ts` + paquetes y recibos; T3 pedidos |
| RF-64 | RBAC: cliente, repartidor, almacén, admin | T1 | Pendiente | |
| RF-65 | Restricciones del encargado de almacén | T1 / T2 | Pendiente | T1 en navegación, T2 en paquetes |
| RF-66 | Candado en secciones no autorizadas | T1 | Pendiente | |
| RF-67 | Almacén ve solo paquetes y estados permitidos | T2 | Pendiente | |
| RF-68 | Rutas protegidas por rol | T1 | Pendiente | |

Otros: RNF-34 `app_config` (T1) · RNF-42 términos y privacidad (T1) · RNF-01 pruebas de RLS (T4) · RNF-20 navegadores (T4)

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

## Migraciones aplicadas
| Archivo | Turno | Qué hace | ¿Aplicada en producción? |
|---|---|---|---|
| | | | |

## Bitácora de relevos
Copiar la plantilla para cada turno cerrado. La entrada más reciente va arriba.

<!-- PLANTILLA
### TN · Nombre (fecha inicio → fecha cierre)
**Hecho:** RF-xx, RF-yy…
**Parcial / no hecho:** RF-zz (motivo, Issue #n)
**Archivos y servicios clave:** ruta → para qué sirve
**Decisiones tomadas:** D# → resolución
**Desviaciones del brief:** …
**Migraciones:** …
**Problemas conocidos:** …
**Notas para el siguiente:** qué necesita saber, por dónde empezar, qué reutilizar
-->

### T0 · Planificación, Juan (30-oct-2026)
**Hecho:** brief v1.1 (`docs/brief-semtracar-web.pdf`), `AGENTS.md`, `CLAUDE.md` y este archivo.
**Notas para el siguiente (T1 · Juan):** el repo está vacío salvo estos documentos. Empezar por la base del proyecto
(brief §7.2, fila T1), luego `supabase db pull` y los tipos generados, y crear todos los Issues con milestones `T1 · Juan`,
`T2 · Daviana`, `T3 · Alberto` y `T4 · Juan`.
