# HairStyle Abii - Dockerfile para desplegar en EasyPanel
#
# La app sirve el frontend (client/dist), las paginas HTML y las imagenes
# /fotos desde el filesystem (client/public y client/dist). Por eso el
# contenedor debe contener cliente compilado + carpeta de fotos.
#
# Los archivos de /fotos que estan en client/public y client/dist se copian
# tal cual al contenedor (la mayoria vienen con el repo).

# ---------- STAGE 1: compilar el frontend React (vite) ----------
FROM node:20-alpine AS build
WORKDIR /app

# Copiar raiz + server (para dockerfile context)
COPY package*.json ./
COPY client/package*.json client/
WORKDIR /app/client
RUN npm install
COPY client/ client/
RUN npm run build

# ---------- STAGE 2: runtime ----------
FROM node:20-alpine
WORKDIR /app

# Backend (server) con sus dependencias
COPY package*.json ./
COPY server/package*.json server/
RUN cd server && npm install

COPY server/ server/
COPY client/public/ client/public/
COPY --from=build /app/client/dist/ client/dist/

ENV NODE_ENV=production
ENV PORT=3000

# La base la levanta EasyPanel; las variables DB_* o DATABASE_URL van en el panel.

EXPOSE 3000
CMD ["node", "server/server.js"]
