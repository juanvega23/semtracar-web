# ---------- Etapa 1: compilar la web (React + Vite) con Node ----------
FROM node:24-alpine AS build
WORKDIR /app

# Primero solo las dependencias: si package*.json no cambia, Docker reutiliza esta capa
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite incrusta estas variables en la web al compilar (no en tiempo de ejecución).
# Solo van la URL y la clave anon, que son públicas; nunca la service_role.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_ANON_KEY" \
  || (echo "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY (--build-arg)" && exit 1)
RUN npm run build

# ---------- Etapa 2: servir el resultado con nginx ----------
FROM nginx:1.27-alpine

# Render inyecta la variable PORT; en local usamos 80 por defecto
ENV PORT=80

# Plantilla de configuración: nginx reemplaza ${PORT} al arrancar el contenedor
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template

# Solo la carpeta compilada: la imagen final no lleva Node ni el código fuente
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
