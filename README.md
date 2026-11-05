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

GitHub Actions corre lo mismo en cada subida a `main`.

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

1. **Web.** En Vercel, importar este repositorio y definir `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
   `vercel.json` ya resuelve las rutas.
2. **Auth.** En Supabase → Authentication → URL Configuration, agregar `https://<dominio>/**` a las Redirect URLs.
   Sin esto, recuperar la contraseña no vuelve a la web.

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
