# AGENTS.md — Semtracar Web

Instrucciones para cualquier IA de código (Claude Code, Cursor, Copilot, Codex, etc.) que trabaje en este repositorio.

## Qué es este proyecto
Aplicación web (React + TypeScript + Vite) de **Semtracar S.A.**, casillero internacional EE. UU. → Nicaragua.
Usa el **mismo proyecto Supabase** que la app móvil Flutter existente (mismo esquema, RLS y RPC).
Roles en la web: **cliente, admin y almacén**. El **repartidor NO usa la web**: si inicia sesión, se muestra
"Tu rol usa la aplicación móvil" y se cierra la sesión.

## Lee en este orden antes de hacer nada
1. Este archivo.
2. `docs/ESTADO.md`: qué está hecho, de quién es el turno actual, decisiones y bitácora de relevos.
3. `docs/brief-semtracar-web.pdf`: reglas completas, alcance, backend, división por turnos y Git.

`docs/ESTADO.md` manda sobre el **avance y las decisiones**. El brief manda sobre las **reglas**.

## Trabajo por turnos (relevo)
`T1 Juan → T2 Daviana → T3 Alberto → T4 Juan (cierre)`. Una persona trabaja a la vez.
- **Al empezar:** sigue el *protocolo de inicio* (brief §7.3). Identifica al integrante y confirma en
  `docs/ESTADO.md` que es su turno y que el anterior está **Cerrado**. Resume qué dejó el turno anterior y
  qué toca ahora, y **espera la confirmación del integrante** antes de escribir código.
- **Al terminar:** el *protocolo de cierre* (brief §7.4) es obligatorio. Actualiza `docs/ESTADO.md`
  (estado de cada RF + entrada en la bitácora con "Notas para el siguiente"), abre el PR de cierre y crea el tag `turno-N-nombre`.

## Reglas que no se rompen
- **Autoría:** antes del primer commit verifica `git config user.name` y `git config user.email` = el integrante.
  Nunca hagas commits en nombre de otra persona, push a `main`, `--force` sobre ramas compartidas ni reescribas historial publicado.
- **Ramas y PR:** una rama por Issue (`feat/<modulo>-<desc>`, `fix/...`, `docs/...`, `chore/...`). Todo entra por PR,
  con la aprobación del siguiente integrante de la fila. Fusión **solo con merge commit** (sin squash ni rebase).
- **Commits:** pequeños y en español: `tipo(modulo): descripción` (feat, fix, refactor, style, test, docs, chore).
- **Backend:** no inventes tablas ni columnas; usa `src/types/database.ts` (generado) y `supabase/migrations/`.
  Cambios de base de datos **solo con migraciones** revisadas por Juan, y siempre aditivos (la app móvil usa el mismo backend).
- **Secretos:** en el frontend solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Nunca uses `service_role`.
  No subas `.env.local`.
- **No llamar** desde la web a `accept_delivery`, `complete_delivery`, `update_deliverer_location` ni `delivery_balance`.
- **Sí:** después de `request_delivery` o `request_delivery_multi`, invocar la Edge Function `send-push-notification`
  con `{ title, body, role: 'repartidor' }`.
- **Fuera de alcance:** mapa o ubicación del repartidor, recepción de push en la web y escaneo de QR con cámara.
- **UI:** texto en español, montos en USD con 2 decimales y fechas en `America/Managua`. Responsive.
- **Arquitectura:** `src/features/<modulo>/{services (Modelo), hooks (Controlador), components + pages (Vista), routes.tsx, index.ts}`.
  Una feature solo importa lo que otra exporta en su `index.ts`.
- **Dudas de negocio:** revisa "Decisiones" en `docs/ESTADO.md`. Si no están resueltas, pregunta al integrante.

## Comandos
(T1 los deja funcionando; si cambian, actualiza esta sección.)
```bash
npm ci                 # instalar
npm run dev            # desarrollo
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run test           # Vitest
npm run build          # build de producción
supabase gen types typescript --linked > src/types/database.ts   # regenerar tipos
```

## Antes de abrir un PR
lint + typecheck + test + build en verde, probado con cada rol afectado, estados de carga/vacío/error,
sin `console.log` con datos personales y la plantilla de PR completa (`Closes #N`).
