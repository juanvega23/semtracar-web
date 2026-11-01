# Revisión local del T3 · Alberto

Implementación del portal del cliente y pedidos admin. **Sin commits, tags ni push**, por instrucción de Alberto.
T3 continúa En curso hasta la revisión de Juan. No se modificó producción.

## Qué revisar

- `/cotizar`: peso decimal > 0 y ≤ 1000; tarifas y multiplicadores de `app_config`; desglose y total estimado.
- `/rastreo`: búsqueda entre paquetes propios, pago y recorrido con ubicación/fechas de Managua.
- `/historial`: recibos propios, pagos/saldo, PDF descargable para imprimir y QR PNG con solo el número REC.
- `/delivery`: selección de recibos completos, contacto guardado en Perfil, solicitud simple o múltiple, retiro en
  sucursal y seguimiento con repartidor/horas. Un fallo de push conserva el pedido y se avisa sin repetir la solicitud.
- `/admin/facturacion`: mantiene cobro/anulación por rol y añade las mismas descargas. Un recibo con delivery requiere
  cancelar primero su pedido antes de anularlo desde la UI.
- `/admin/pedidos`: listado con filtros por estado, contacto, repartidor, CSV de la página visible y cancelación.
- Almacén conserva su candado en Pedidos y Facturación. El repartidor sigue fuera de la web.
- Cambio necesario de T1 en `src/app/layouts/AppLayout.tsx`: menú móvil hasta 1280 px; la navegación de escritorio
  anterior desbordaba el encabezado en tableta (768 px).

## Decisiones confirmadas por Alberto

**D12:** agrupar solo recibos sin pagos y todos sus paquetes. Se mantiene el recibo principal; los secundarios quedan
anulados, con sus números, importes y una referencia al principal. Los ítems originales **se mueven** al principal,
conservando su id: no se copian ni se dejan en dos recibos. Así la consulta móvil por paquete con `maybeSingle` sigue
obteniendo una sola fila. No se borra ningún recibo ni pago.

**D13:** cancelar sin pagos quita el cargo de delivery y devuelve el recibo a retiro en sucursal. Si existe cualquier
pago, la cancelación automática se rechaza y se requiere revisión administrativa. Un paquete con delivery cancelado
**no puede volver a pedir delivery**, ni simple ni múltiple; queda para retiro en sucursal. Esto también mantiene una
sola fila para la consulta móvil del pedido por paquete.

## Backend propuesto, solo aplicado en local

1. `20261101030000_delivery_web.sql`: conserva las firmas de `request_delivery`, `request_delivery_multi` y
   `decline_delivery`; valida propietario, dirección, estado listo, recibos completos y pedidos existentes. Lee el cargo
   desde `app_config`, conserva impuestos, actualiza el saldo y guarda el contacto en el pedido. Añade `cancel_delivery`
   con control de admin y transacción para D13. El helper `validate_delivery_request` no es ejecutable por clientes.
2. `20261101030100_realtime_t3.sql`: publica las tablas necesarias sin cambiar RLS.

`database.ts` se generó con Supabase CLI 2.122.0 desde Docker. El cambio de formato del generador incluye
`ComputedFields` y modifica los tipos de funciones sin parámetros; no se inventaron tablas/columnas ni se editaron a mano.

El teléfono **no se exige ni se valida en SQL**, para conservar el contacto opcional y los formatos admitidos por la
app móvil. El formulario web mantiene su validación y normalización antes de guardar el perfil. Los pedidos copian
el teléfono disponible como dato de contacto, incluido null.

Se retiró el interruptor de activación de app_config y su consulta desde la web. La migración debe aplicarse completa
antes de usar estas escrituras web contra producción. **Solo Juan puede revisar y ejecutar `supabase db push`**,
después de las pruebas locales, y regenerar con `supabase gen types typescript --linked`.

## Comprobar en local

Docker Desktop debe estar abierto. Las cuatro cuentas de `supabase/seed.sql` usan `Prueba1234` y solo existen en local.
En PowerShell con scripts bloqueados se pueden usar `npm.cmd` y `npx.cmd`.

```bash
npm ci
npx supabase start
# db reset borra datos de este Docker local: usar una base de pruebas o confirmar antes de reiniciarla.
npx supabase db reset --local
npx supabase test db
npm run lint
npm run typecheck
npm run test
npm run format:check
npm run build
npm run dev
```

Usar `.env.development.local` (ignorado) con URL y clave anónima de Docker, sin BOM. No copiar claves de servicio.
La sesión de Alberto ya dejó ese archivo apuntando a `http://127.0.0.1:54321`; `.env.local` no cambió.

Para un recorrido desde cero: entrar como almacén, registrar paquetes para `cliente@prueba.local` y avanzar al estado 2;
entrar como admin, avanzar a Aduana y Listo para recoger. Esto genera los recibos. Entrar como cliente y probar cotización,
rastreo, descargas, retiro en sucursal y delivery. Para agrupar, seleccionar recibos sin pagos. Como admin, cancelar un
pedido sin pagos y comprobar que desaparece el cargo; registrar un pago en otro pedido y comprobar que se bloquea su
cancelación automática. Tras cancelar, comprobar que sus paquetes no pueden seleccionarse para otro pedido. Al agrupar,
verificar que el recibo secundario permanece anulado con su número/nota pero sin ítems, y que cada paquete tiene un solo
ítem asociado al principal. Filtrar pedidos y exportar su página visible.

## Evidencia y límites

- Lint, typecheck, format:check y build en verde; 62 pruebas Vitest en verde.
- SQL: 44 pruebas con pgTAP, permisos y reglas financieras; transacción con rollback de fixtures. Incluyen las regresiones
  móviles: un ítem por paquete, movimiento del id original, rechazo de nueva solicitud tras cancelar un pedido simple
  o múltiple y teléfono nulo o con otro formato. La exigencia de teléfono web también se prueba con Vitest.
- Chrome local: cotización decimal, rastreo/historial, PDF y PNG descargados, seis pantallas sin desborde a
  390/768/1440 px, solicitudes simple/múltiple, consulta/CSV/cancelación admin, bloqueo de cancelación con pagos,
  candado de almacén y cierre de sesión del repartidor.
- Push: contrato y orden de invocación probados con mocks; fallo real de función no desplegada en Docker comprobado
  sin duplicar pedidos. **Falta validar recepción real en la app móvil con Juan.**
- Realtime comprobado en Chrome: un pago hecho desde otra sesión se reflejó en Rastreo antes del respaldo de 30 s.
  En producción no cambia hasta que Juan aplique la publicación.
- RLS heredada para `deliveries` y `delivery_packages`: revisar en T4 el acceso directo de otros clientes a pedidos
  disponibles, aunque la web filtre siempre por su propio `client_id`. Revisar también cancelación frente a RPC móviles.
- El build avisa del tamaño del renderer PDF; se importa de forma diferida para no cargarlo al abrir las páginas.

Después de aprobar, cerrar T3 y pasar a T4 siguiendo D8 y la autorización del integrante para subir a main.
