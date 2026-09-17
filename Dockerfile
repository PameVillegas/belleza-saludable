# Belleza Saludable - Dockerfile (raiz del repo, para EasyPanel/DonWeb)
#
# Este Dockerfile vive en la raiz del repo belleza-saludable.
# EasyPanel construye con contexto = raiz del repo, asi que las rutas
# relativas (backend/, frontend/, public/) funcionan directo.

# ---------- STAGE 1: compilar el frontend React (vite) ----------
FROM node:20-alpine AS build
WORKDIR /app

# backend raiz
COPY package*.json ./

# frontend: instalar y compilar (vite genera client dist en frontend/dist)
COPY frontend/package*.json frontend/
RUN cd frontend && npm install
COPY frontend/ frontend/
RUN cd frontend && npm run build

# ---------- STAGE 2: runtime ----------
FROM node:20-alpine
WORKDIR /app

# Backend
COPY package*.json ./
RUN npm install --omit=dev

COPY backend/ backend/
COPY public/ public/

# build de React ya compilado (server.js lo sirve en produccion)
COPY --from=build /app/frontend/dist frontend/dist

ENV NODE_ENV=production
ENV PORT=3000
# DATABASE_URL, SMTP_* se inyectan como variables en el panel de EasyPanel.

EXPOSE 3000
CMD ["node", "backend/server.js"]
