# Tareas de Implementación

## Fase 1: Configuración del proyecto y base de datos

- [x] 1.1 Inicializar proyecto con estructura de carpetas (frontend/, backend/, public/)
- [x] 1.2 Configurar proyecto backend con Node.js y Express
- [x] 1.3 Configurar proyecto frontend con React 18 y Vite
- [x] 1.4 Configurar conexión a PostgreSQL con pg pool (soporte SSL para producción)
- [x] 1.5 Crear script SQL de creación de tablas (clients, services, schedules, blocked_slots, appointments, admins)
- [x] 1.6 Ejecutar migración inicial de base de datos
- [x] 1.7 Crear seed de datos iniciales (admin por defecto, horarios de ejemplo)

## Fase 2: Backend - Autenticación simple

- [x] 2.1 Crear tabla admins con campos username y password
- [x] 2.2 Crear endpoint POST /api/auth/login con comparación directa de username/password contra la DB
- [x] 2.3 Crear middleware que verifica header de sesión (username autenticado)
- [x] 2.4 Crear endpoint POST /api/auth/logout
- [x] 2.5 Agregar rate limiting a endpoints de autenticación

## Fase 3: Backend - Gestión de servicios

- [x] 3.1 Crear CRUD completo de servicios (GET, POST, PUT) con consultas parametrizadas pg
- [x] 3.2 Implementar endpoint PATCH /api/admin/services/:id/deactivate
- [x] 3.3 Crear endpoint público GET /api/services (solo servicios activos)
- [x] 3.4 Agregar validación de datos de entrada para servicios (nombre, duración, precio)

## Fase 4: Backend - Gestión de horarios y disponibilidad

- [x] 4.1 Crear endpoints GET/PUT /api/admin/schedules para configurar horarios de atención
- [x] 4.2 Implementar CRUD de bloqueos (blocked_slots): GET, POST, DELETE
- [x] 4.3 Implementar algoritmo de cálculo de franjas disponibles
- [x] 4.4 Crear endpoint público GET /api/availability/:serviceId para fechas disponibles
- [x] 4.5 Crear endpoint público GET /api/availability/:serviceId/:date para franjas horarias
- [x] 4.6 Implementar detección de conflictos (solapamiento de rangos horarios)

## Fase 5: Backend - Gestión de clientes

- [x] 5.1 Crear CRUD de clientes (GET lista, GET detalle, POST, PUT) con pg pool
- [x] 5.2 Implementar búsqueda de clientes por nombre, teléfono o email
- [x] 5.3 Implementar lógica de detección de cliente existente por email o teléfono
- [x] 5.4 Crear endpoint GET /api/admin/clients/:id con historial de turnos

## Fase 6: Backend - Gestión de turnos

- [x] 6.1 Crear endpoint público POST /api/appointments (reserva online)
- [x] 6.2 Implementar validación de disponibilidad al crear turno (prevenir doble reserva)
- [x] 6.3 Crear endpoint POST /api/admin/appointments (carga manual con creación de cliente opcional)
- [x] 6.4 Crear endpoint PUT /api/admin/appointments/:id (modificar turno con verificación de disponibilidad)
- [x] 6.5 Crear endpoint PATCH /api/admin/appointments/:id/cancel (cancelar y liberar franja)
- [x] 6.6 Crear endpoint GET /api/admin/appointments con filtros (fecha, estado, cliente)
- [ ] 6.7 Implementar envío de confirmación por email al crear turno

## Fase 7: Frontend React (SPA) - Formulario de reserva pública

- [x] 7.1 Configurar React Router con rutas del formulario de reserva
- [x] 7.2 Implementar layout responsivo base con CSS (flexbox/grid, mobile-first)
- [x] 7.3 Crear página de selección de servicio (listado con tarjetas)
- [x] 7.4 Crear página de selección de fecha y hora (calendario + franjas)
- [x] 7.5 Crear página de datos del cliente y confirmación
- [x] 7.6 Implementar flujo de 3 pasos con navegación entre ellos
- [x] 7.7 Implementar manejo de errores (franja ocupada, validación de campos)
- [x] 7.8 Mostrar confirmación exitosa con resumen del turno

## Fase 8: Panel de Administración - panel.html (HTML/JS vanilla)

- [x] 8.1 Crear estructura base de panel.html con navegación lateral/responsive
- [x] 8.2 Implementar login con formulario username/password y guardar sesión en localStorage
- [x] 8.3 Implementar guard de acceso (redirect a login si no hay sesión en localStorage)
- [x] 8.4 Crear dashboard con agenda del día (lista de turnos)
- [x] 8.5 Implementar vista de calendario con modos diario, semanal y mensual
- [x] 8.6 Crear formulario de carga manual de turnos (con búsqueda/creación de cliente)
- [x] 8.7 Implementar vista de detalle de turno con opciones de editar y cancelar
- [x] 8.8 Crear sección de gestión de clientes (listado, búsqueda, detalle con historial)
- [x] 8.9 Crear sección de gestión de servicios (CRUD completo)
- [x] 8.10 Crear sección de configuración de horarios y bloqueos
- [x] 8.11 Implementar cierre de sesión y limpieza de localStorage

## Fase 9: Página de Cliente - cliente.html (HTML/JS vanilla)

- [x] 9.1 Crear estructura base de cliente.html con diseño responsivo
- [x] 9.2 Implementar vista de estado de turno
- [x] 9.3 Mostrar información de contacto del negocio

## Fase 10: Diseño responsivo y accesibilidad

- [x] 10.1 Implementar breakpoints (móvil <768px, tablet 768-1024px, desktop >1024px)
- [x] 10.2 Asegurar menú hamburguesa en móvil para panel.html
- [x] 10.3 Verificar touch targets mínimos de 44x44px en dispositivos táctiles
- [ ] 10.4 Verificar accesibilidad (roles ARIA, contraste, navegación por teclado)

## Fase 11: Testing y calidad

- [ ] 11.1 Escribir tests unitarios para la lógica de cálculo de disponibilidad
- [ ] 11.2 Escribir tests para la detección de conflictos de horarios
- [ ] 11.3 Escribir tests de integración para los endpoints de la API
- [ ] 11.4 Verificar flujo completo de reserva online (frontend)

## Fase 12: Despliegue en Render

- [x] 12.1 Configurar Render web service (build command, start command)
- [x] 12.2 Configurar base de datos PostgreSQL en Render (plan free)
- [x] 12.3 Configurar variables de entorno (DATABASE_URL, NODE_ENV, PORT)
- [x] 12.4 Configurar Express para servir archivos estáticos (React build + HTMLs)
- [x] 12.5 Configurar SSL para conexión a PostgreSQL en producción
- [x] 12.6 Crear script de seed para primer administrador en producción
- [x] 12.7 Mantener vercel.json como configuración alternativa
- [ ] 12.8 Crear documentación de despliegue y configuración inicial
