# Documento de Requisitos

## Introducción

Sistema de gestión de turnos que permite a los clientes reservar citas en línea y a los administradores gestionar la agenda completa del negocio. El sistema incluye reserva online, carga manual de turnos, gestión de horarios y disponibilidad, administración de servicios, base de datos de clientes y un diseño responsivo para todos los dispositivos.

## Glosario

- **Sistema**: La aplicación web de gestión de turnos en su totalidad
- **Cliente**: Persona que solicita o reserva un turno para recibir un servicio
- **Administrador**: Persona encargada de gestionar la agenda, los servicios y los clientes
- **Turno**: Una cita programada que vincula un cliente con un servicio en una fecha y hora específica
- **Servicio**: Prestación ofrecida por el negocio que puede ser reservada por un cliente
- **Agenda**: Calendario de turnos organizados por fecha y hora
- **Franja_Horaria**: Bloque de tiempo disponible para agendar un turno
- **Panel_Admin**: Interfaz de administración para gestionar la agenda, servicios y clientes
- **Formulario_Reserva**: Interfaz pública donde los clientes seleccionan servicio, fecha y hora para solicitar un turno

## Requisitos

### Requisito 1: Reserva online de turnos

**User Story:** Como cliente, quiero reservar un turno en línea seleccionando servicio, fecha y hora, para no tener que llamar por teléfono.

#### Criterios de Aceptación

1. WHEN el Cliente accede al Formulario_Reserva, THE Sistema SHALL mostrar la lista de servicios disponibles para selección
2. WHEN el Cliente selecciona un Servicio, THE Sistema SHALL mostrar las fechas con Franjas_Horarias disponibles para ese Servicio
3. WHEN el Cliente selecciona una fecha, THE Sistema SHALL mostrar las Franjas_Horarias disponibles para esa fecha y Servicio
4. WHEN el Cliente confirma la reserva con servicio, fecha, hora y datos de contacto válidos, THE Sistema SHALL crear el Turno y enviar una confirmación al Cliente
5. IF el Cliente intenta reservar una Franja_Horaria que ya no está disponible, THEN THE Sistema SHALL informar al Cliente que la franja fue ocupada y solicitar que elija otra
6. WHEN el Cliente completa una reserva, THE Sistema SHALL solicitar nombre, teléfono y correo electrónico como datos obligatorios

### Requisito 2: Panel de administración

**User Story:** Como administrador, quiero un panel centralizado para gestionar toda la agenda, para tener control completo sobre los turnos del negocio.

#### Criterios de Aceptación

1. WHEN el Administrador accede al Panel_Admin, THE Sistema SHALL mostrar la Agenda del día actual con todos los Turnos programados
2. WHEN el Administrador selecciona una fecha en el Panel_Admin, THE Sistema SHALL mostrar todos los Turnos programados para esa fecha
3. THE Panel_Admin SHALL permitir al Administrador visualizar la Agenda en formato diario, semanal y mensual
4. WHEN el Administrador selecciona un Turno, THE Sistema SHALL mostrar los detalles completos del Turno incluyendo datos del Cliente y del Servicio
5. WHEN el Administrador cancela un Turno, THE Sistema SHALL marcar el Turno como cancelado y liberar la Franja_Horaria correspondiente
6. WHEN el Administrador modifica la fecha u hora de un Turno, THE Sistema SHALL verificar la disponibilidad de la nueva Franja_Horaria antes de confirmar el cambio

### Requisito 3: Carga manual de turnos

**User Story:** Como administrador, quiero cargar turnos manualmente, para registrar citas solicitadas por teléfono o por clientes que no usan la plataforma online.

#### Criterios de Aceptación

1. WHEN el Administrador inicia la carga manual de un Turno, THE Sistema SHALL presentar un formulario con campos para Cliente, Servicio, fecha y hora
2. WHEN el Administrador ingresa los datos de un Turno manual con una Franja_Horaria disponible, THE Sistema SHALL crear el Turno y actualizar la Agenda
3. IF el Administrador intenta cargar un Turno en una Franja_Horaria ocupada, THEN THE Sistema SHALL informar el conflicto y solicitar que elija otra franja
4. WHEN el Administrador carga un Turno para un Cliente nuevo, THE Sistema SHALL permitir crear el registro del Cliente en el mismo formulario
5. WHEN el Administrador carga un Turno para un Cliente existente, THE Sistema SHALL permitir buscar y seleccionar al Cliente por nombre o teléfono

### Requisito 4: Gestión de horarios y disponibilidad

**User Story:** Como administrador, quiero configurar los horarios de atención y la disponibilidad, para que los clientes solo puedan reservar en horarios válidos.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir al Administrador definir los días y horarios de atención para cada día de la semana
2. WHEN el Administrador configura un horario de atención, THE Sistema SHALL solicitar hora de inicio, hora de fin y duración de cada Franja_Horaria
3. WHEN el Administrador marca un día como no laborable, THE Sistema SHALL bloquear la reserva de Turnos para ese día
4. WHEN el Administrador bloquea una Franja_Horaria específica, THE Sistema SHALL excluir esa franja de las opciones disponibles para reserva
5. THE Sistema SHALL calcular las Franjas_Horarias disponibles combinando los horarios de atención configurados menos los Turnos ya reservados y las franjas bloqueadas
6. WHEN el Administrador modifica los horarios de atención, THE Sistema SHALL mantener los Turnos previamente confirmados sin alteración

### Requisito 5: Administración de servicios

**User Story:** Como administrador, quiero gestionar los servicios que ofrece el negocio, para mantener actualizada la oferta disponible para los clientes.

#### Criterios de Aceptación

1. WHEN el Administrador crea un Servicio, THE Sistema SHALL solicitar nombre, descripción, duración estimada y precio
2. WHEN el Administrador modifica un Servicio, THE Sistema SHALL actualizar la información del Servicio sin afectar los Turnos ya reservados con ese Servicio
3. WHEN el Administrador desactiva un Servicio, THE Sistema SHALL excluir ese Servicio de las opciones disponibles en el Formulario_Reserva
4. WHILE un Servicio está desactivado, THE Sistema SHALL mantener visible el historial de Turnos asociados a ese Servicio en el Panel_Admin
5. THE Sistema SHALL mostrar solo los Servicios activos en el Formulario_Reserva

### Requisito 6: Base de datos de clientes

**User Story:** Como administrador, quiero mantener una base de datos de clientes, para tener un registro de contacto e historial de turnos.

#### Criterios de Aceptación

1. WHEN un Cliente completa una reserva por primera vez, THE Sistema SHALL crear un registro del Cliente con nombre, teléfono y correo electrónico
2. THE Sistema SHALL permitir al Administrador buscar clientes por nombre, teléfono o correo electrónico
3. WHEN el Administrador selecciona un Cliente en la base de datos, THE Sistema SHALL mostrar el historial completo de Turnos de ese Cliente
4. WHEN el Administrador edita los datos de un Cliente, THE Sistema SHALL actualizar el registro conservando el historial de Turnos asociado
5. IF un Cliente realiza una nueva reserva con el mismo correo electrónico o teléfono de un registro existente, THEN THE Sistema SHALL asociar el nuevo Turno al registro existente del Cliente

### Requisito 7: Diseño responsivo

**User Story:** Como cliente, quiero acceder al sistema desde cualquier dispositivo, para poder reservar turnos desde mi celular, tablet o computadora.

#### Criterios de Aceptación

1. THE Sistema SHALL adaptar su interfaz al ancho de pantalla del dispositivo utilizado, soportando resoluciones desde 320px hasta 1920px
2. WHILE el Cliente accede desde un dispositivo móvil (ancho menor a 768px), THE Sistema SHALL mostrar la navegación en formato de menú colapsable
3. WHILE el Cliente accede desde una tablet (ancho entre 768px y 1024px), THE Sistema SHALL organizar el contenido en máximo dos columnas
4. WHILE el Cliente accede desde una computadora (ancho mayor a 1024px), THE Sistema SHALL aprovechar el espacio disponible con diseño multi-columna
5. THE Sistema SHALL mantener todos los elementos interactivos con un tamaño mínimo de 44x44 píxeles en dispositivos táctiles
6. THE Formulario_Reserva SHALL completarse en un máximo de 3 pasos en cualquier dispositivo

### Requisito 8: Autenticación y seguridad del Panel de Administración

**User Story:** Como administrador, quiero que el panel de administración esté protegido con credenciales, para que solo personal autorizado pueda gestionar la agenda.

#### Criterios de Aceptación

1. WHEN un usuario intenta acceder al Panel_Admin, THE Sistema SHALL solicitar credenciales de acceso (username y password)
2. WHEN el Administrador ingresa credenciales válidas, THE Sistema SHALL guardar la sesión en localStorage y otorgar acceso al Panel_Admin
3. IF un usuario ingresa credenciales inválidas, THEN THE Sistema SHALL mostrar un mensaje de error sin revelar cuál credencial es incorrecta
4. WHEN el Administrador cierra sesión, THE Sistema SHALL limpiar la sesión de localStorage y redirigir al formulario de login
5. THE Sistema SHALL verificar la existencia de sesión en localStorage antes de permitir acceso a cualquier sección del Panel_Admin
6. THE Sistema SHALL utilizar comparación directa de username/password contra la base de datos para la autenticación
