# SEMTRACAR Web

Aplicación web de SEMTRACAR, casillero internacional de Estados Unidos a Nicaragua. Usa el mismo proyecto
Supabase que la app móvil en Flutter. Es para clientes, administradores y encargados de almacén; el repartidor
usa solo la app móvil.

Tecnologías: React, TypeScript, Vite, Tailwind CSS, TanStack Query y Supabase.

## Empezar

Requiere Node 24.

```bash
npm ci
cp .env.example .env.local   # poner VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

Solo van esas dos variables en el frontend. La clave `service_role` nunca se usa en el navegador.

## Verificaciones

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test
npm run build
```

En cada subida a `main`, GitHub Actions (`.github/workflows/ci-cd.yml`) corre lo mismo, construye la imagen Docker,
la prueba, la publica en GHCR y redespliega Render.

## Probar sin tocar producción

Requiere Docker Desktop.

```bash
supabase start            # base local con todas las migraciones y las cuentas de prueba
supabase db reset         # la reinicia desde cero
supabase test db          # pruebas SQL de seguridad y reglas; requiere la base recién reiniciada
supabase status -o env    # API_URL y ANON_KEY locales
```

Para que la web use la base local, crea `.env.development.local` con esos dos valores. Las cuentas de prueba solo
existen en local: `cliente@`, `admin@`, `almacen@` y `repartidor@prueba.local`, con contraseña `Prueba1234`.

## Estructura

```
src/features/<modulo>/   services (modelo), hooks (controlador), components y pages (vista)
src/components/ui/       componentes compartidos
src/lib/                 cliente de Supabase, formatos, errores, CSV, configuración
supabase/migrations/     cambios de base de datos versionados
supabase/functions/      Edge Functions
supabase/tests/          pruebas SQL
docs/ESTADO.md           avance, decisiones y bitácora
AGENTS.md                reglas de trabajo del proyecto
```

## Publicar

La web se publica como imagen Docker en Render (decisión D11), siguiendo la guía de Docker + CI/CD del curso:

```text
git push ─▶ GitHub Actions ─▶ verificaciones ─▶ docker build ─▶ prueba con curl ─▶ GHCR ─▶ deploy hook de Render
```

- `Dockerfile`: etapa 1 con Node (`npm ci` + `npm run build`), etapa 2 con nginx sirviendo `dist/`.
- `docker/default.conf.template`: nginx escucha en `${PORT}` (Render usa 10000) y devuelve `index.html` en cualquier ruta.
- Vite incrusta `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` **al compilar**, por eso van como `--build-arg`.

**Probar la imagen en local:**

```bash
docker build -t semtracar-web:local \
  --build-arg VITE_SUPABASE_URL=<url> --build-arg VITE_SUPABASE_ANON_KEY=<anon-key> .
docker run -d --name semtracar -p 8081:80 semtracar-web:local                          # http://localhost:8081
docker run -d --name semtracar-render -e PORT=10000 -p 10000:10000 semtracar-web:local # simula Render
docker rm -f semtracar semtracar-render
```

**Configuración única (a mano, en este orden):**

1. **Secrets del repo.** GitHub → Settings → Secrets and variables → Actions: `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` (nunca la `service_role`).
2. **Primer push.** El job `build-test-push` debe quedar en verde; `deploy-render` falla hasta el paso 5 (es normal).
3. **GHCR.** Perfil → Packages → `semtracar-web` → Package settings → Change visibility → **Public**.
4. **Render.** New → Web Service → Existing Image `ghcr.io/juanvega23/semtracar-web:latest`, plan Free.
5. **Deploy hook.** Render → servicio → Settings → Deploy Hook: copiar la URL y guardarla como secret
   `RENDER_DEPLOY_HOOK_URL`. Volver a correr el workflow fallido (Re-run failed jobs).
6. **Auth.** Supabase → Authentication → URL Configuration: agregar `https://<servicio>.onrender.com/**` a las
   Redirect URLs. Sin esto, confirmar la cuenta y recuperar la contraseña no vuelven a la web. **No cambiar el Site URL**
   (`com.example.testapp://login-callback`): la app móvil se registra sin indicar destino y depende de él; la web siempre
   indica el suyo. Hacerlo en el panel, **nunca** con `supabase config push`.

Publicada en **https://semtracar.onrender.com**.

Rollback: Render → Events → deploy anterior → Rollback, o fijar la imagen `:sha-<commit>` en Settings → Image URL.
En el plan Free el servicio se duerme tras ~15 min sin visitas y la primera carga tarda 30–50 s.

## Activar los correos (RF-56)

Se envían al crear un aviso de paquete listo, recibo generado o entrega confirmada.

1. Crear una cuenta en [Resend](https://resend.com), verificar un dominio y generar una API key.
2. Definir los secretos y publicar la función:

   ```bash
   supabase secrets set RESEND_API_KEY=<clave> EMAIL_FROM="SEMTRACAR <avisos@tu-dominio>" \
     EMAIL_WEBHOOK_SECRET=<texto-largo-al-azar> WEB_URL=https://<dominio>
   supabase functions deploy send-email-notification
   ```

3. En Supabase → Database → Webhooks, crear uno para `INSERT` en `public.notifications`, tipo Supabase Edge
   Function, apuntando a `send-email-notification` y con el encabezado `x-webhook-secret` igual al secreto anterior.

El webhook se configura en el panel y no en una migración, para no dejar ese secreto en el repositorio.
