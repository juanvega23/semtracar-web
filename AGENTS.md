# AGENTS.md — Semtracar Web

Instrucciones para cualquier IA de código (Claude Code, Cursor, Copilot, Codex, etc.) que trabaje en este repositorio.

## Qué es este proyecto
Aplicación web (React + TypeScript + Vite) de **SEMTRACAR**, casillero internacional EE. UU. → Nicaragua.
Usa el **mismo proyecto Supabase** que la app móvil Flutter existente (mismo esquema, RLS y RPC).
Roles en la web: **cliente, admin y almacén**. El **repartidor NO usa la web**: si inicia sesión, se muestra
"Tu rol usa la aplicación móvil" y se cierra la sesión.

## Lee en este orden antes de hacer nada
1. Este archivo.
2. `docs/ESTADO.md`: qué está hecho, de quién es el turno actual, decisiones y bitácora de relevos.
3. `docs/brief-semtracar-web.pdf`: alcance, backend, reglas de negocio y división por turnos.

`docs/ESTADO.md` manda sobre el **avance y las decisiones**. El brief manda sobre las **reglas**, **excepto en el
flujo de Git**: ahí manda la sección "Git" de este archivo (decisión D8). Ignora lo que el brief diga sobre
Pull Requests, Issues, ramas por Issue, milestones, tablero, CODEOWNERS y protección de `main`.

## Trabajo por turnos (relevo)
`T1 Juan → T2 Daviana → T3 Alberto → T4 Juan (cierre)`. Una persona trabaja a la vez.
- **Al empezar:** identifica al integrante, haz `git pull` en `main` y confirma en `docs/ESTADO.md` que es su
  turno y que el anterior está **Cerrado**. Resume qué dejó el turno anterior y qué toca ahora, y **espera la
  confirmación del integrante** antes de escribir código.
- **Al terminar (obligatorio):** `lint`, `typecheck`, `test` y `build` en verde. Actualiza `docs/ESTADO.md`: estado
  de cada RF del turno, entrada en la bitácora con "Notas para el siguiente", turno en **Cerrado** y "Turno actual".
  Haz commit, sube a `main` y crea el tag `turno-N-nombre` (`git tag turno-2-daviana && git push origin turno-2-daviana`).

## Git (decisión D8)
- Se trabaja **directo en `main`**. No hay ramas por tarea, Pull Requests ni revisiones.
- **No crees nada en GitHub:** ni Pull Requests, ni Issues, ni milestones, ni etiquetas, ni proyectos. No asignes ni
  menciones a nadie y no cambies la configuración del repositorio. Cada una de esas acciones le manda correos al equipo.
- **Antes de empezar:** `git pull`. **Antes de subir:** verificaciones en verde y luego `git push`.
  Haz `git push` solo cuando el integrante lo pida o lo apruebe.
- **Autoría:** antes del primer commit verifica que `git config user.name` y `git config user.email` sean los del
  integrante. Solo aparece su nombre: **no agregues `Co-Authored-By` ni menciones a la IA** en commits ni tags.
- Nunca uses `--force`, `git push -f`, `rebase` sobre commits ya subidos ni reescribas historial publicado.
- **Commits:** pequeños, uno por cambio lógico, en español: `tipo(modulo): descripción`
  (feat, fix, refactor, style, test, docs, chore). Ej.: `feat(seguimiento): agregar línea de tiempo de estados`.
- Revisa `git status` antes de cada commit. Nunca subas `.env.local` ni la carpeta local de la app móvil.
- Se puede tocar código de turnos anteriores solo si hace falta para la tarea actual, en un commit aparte
  (`fix(paquetes): ...`) y anotándolo en la bitácora.

## Reglas que no se rompen
- **Backend:** no inventes tablas ni columnas; usa `src/types/database.ts` (generado) y `supabase/migrations/`.
  Cambios de base de datos **solo con migraciones** revisadas por Juan, siempre aditivas (la app móvil usa el mismo
  backend) y probadas antes en Supabase local (D6). Solo Juan ejecuta `supabase db push`.
- **Secretos:** en el frontend solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Nunca uses `service_role`.
- **No llamar** desde la web a `accept_delivery`, `complete_delivery`, `update_deliverer_location` ni `delivery_balance`.
- **Sí:** después de `request_delivery` o `request_delivery_multi`, invocar la Edge Function `send-push-notification`
  con `{ title, body, role: 'repartidor' }`.
- **Fuera de alcance:** mapa o ubicación del repartidor, recepción de push en la web y escaneo de QR con cámara.
- **UI:** texto en español, montos en USD con 2 decimales y fechas en `America/Managua`. Responsive. Marca SEMTRACAR (D4).
- **Arquitectura:** `src/features/<modulo>/{services (Modelo), hooks (Controlador), components + pages (Vista), routes.tsx, index.ts}`.
  Una feature solo importa lo que otra exporta en su `index.ts` (ESLint lo verifica). Dentro de la propia feature
  usa rutas relativas.
- **Librerías:** ya están instaladas todas las del brief §3. No agregues otras sin acuerdo del equipo.
- **Dudas de negocio:** revisa "Decisiones" en `docs/ESTADO.md`. Si no están resueltas, pregunta al integrante.

## Comandos
(T1 los deja funcionando; si cambian, actualiza esta sección.)
```bash
npm ci                 # instalar
npm run dev            # desarrollo
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run format         # Prettier (format:check lo verifica en CI)
npm run test           # Vitest
npm run build          # build de producción
supabase gen types typescript --linked > src/types/database.ts   # regenerar tipos
```
Al subir a `main`, GitHub Actions corre las mismas verificaciones (pestaña Actions).

### Probar sin tocar producción (Supabase local, D6)
Requiere Docker Desktop abierto.
```bash
supabase start            # levanta la base local con todas las migraciones
supabase db reset         # la reinicia desde cero (borra los datos locales)
supabase status -o env    # muestra API_URL y ANON_KEY locales
```
Para que la web use la base local, crea `.env.development.local` (no se sube) con `VITE_SUPABASE_URL` y
`VITE_SUPABASE_ANON_KEY` de `supabase status`; bórralo para volver a producción.
- **Nunca** ejecutes `supabase config push`: sobrescribiría la configuración de Auth de producción.
- `supabase db push` y `supabase migration repair` solo los ejecuta Juan.

### Qué reutilizar (lo dejó T1)
- `@/components/ui`: botones, campos, tarjetas, badge, tabla, modal, toast y estados de carga/vacío/error/candado.
- `@/lib/format`: `formatUSD`, `formatDate`, `formatDateTime`, `formatInvoiceNumber` (fechas en Managua).
- `@/lib/appConfig`: `useAppConfig()` para tarifas, multiplicadores y costo de delivery.
- `@/lib/errors`: `toUserMessage(error)` para mostrar errores en español.
- `@/features/acceso`: `useRequiredCurrentUser()` (usuario y rol), `RequireAccess` y la matriz en `roles.ts`.
- `@/features/perfil`: `updateProfile()` para guardar dirección y teléfono antes del delivery (RF-50).

## Antes de cada `git push`
lint + typecheck + test + build en verde, probado con cada rol afectado, estados de carga/vacío/error en español
y sin `console.log` con datos personales.
