# CFG-ARQ-001 - MODULO CONFIGURACION

### 1. PROPOSITO DEL DOCUMENTO
- **Documento:** CFG-ARQ-001.
- **Modulo:** Configuracion / Ajustes.
- **Producto:** GaltekOne POS de escritorio para tiendas pequenas y medianas.
- **Audiencia:** Producto, Backend, Frontend, QA, Soporte, analisis funcional, Chat de analisis y futuros desarrolladores.
- **Estado funcional:** Inventario del estado actual del modulo. Este documento no describe una vision futura como si ya estuviera implementada.

Este documento resume lo que existe actualmente en Configuracion, que piezas estan conectadas, que piezas son solo interfaz local, que endpoints usa, que tablas participan y que brechas actuales deben conocerse antes de atacar el modulo.

La intencion es servir como fotografia funcional y tecnica del estado vigente para que otra herramienta o persona pueda analizar prioridades sin asumir capacidades inexistentes.

### 2. PRINCIPIO RECTOR ACTUAL
Configuracion funciona hoy como un contenedor de ajustes generales y administracion interna.

La parte mas real del modulo es administracion de usuarios, roles y permisos.
La parte mas incompleta esta en tienda, respaldos/exportacion, promociones, soporte y secciones placeholder.

Regla de lectura: si este documento marca una seccion como placeholder, maqueta, local o no conectada, no debe tratarse como funcionalidad productiva terminada.

### 3. ENTRADAS DE NAVEGACION
Rutas actuales:

- `/ajustes`: pantalla principal de Configuracion.
- `/configuracion-exportaciones`: wrapper independiente que muestra ExportarDatos.

Entradas por menu:

- `UserProfileMenu` muestra "Configuracion de la tienda" y navega a `/ajustes`.
- `UserProfileMenu` muestra "Soporte" y navega a `/soporte`.

Estado actual:

- `/ajustes` si existe en `AppRouter`.
- `/configuracion-exportaciones` si existe en `AppRouter`.
- `/soporte` no esta declarado en `AppRouter`, aunque existe el componente `Soporte.jsx`.

### 4. PANTALLA PRINCIPAL AJUSTES
Componente principal:

- `galtek-one-front/src/components/Configuracion/Ajustes.jsx`

Responsabilidades actuales:

- Renderiza la pantalla dentro de `Shell`.
- Muestra header "AJUSTES".
- Permite buscar secciones por texto.
- Organiza secciones en grupos.
- Mantiene tab activo en estado local.
- Renderiza contenido segun la seccion activa.
- Tiene boton de refrescar.
- Muestra acciones rapidas en el panel lateral.

Grupos visibles:

- Operacion.
- Finanzas.
- Sistema.

### 5. SECCIONES VISIBLES EN AJUSTES
Secciones actuales del arreglo `SECTIONS`:

- Tienda.
- Promociones.
- Usuarios.
- Roles.
- Impuestos.
- Pagos / Terminal.
- Notificaciones.
- Apariencia.
- Auditoria.
- Integraciones.
- Exportar / Respaldo.

Secciones con componente real renderizado:

- Tienda -> `ConfTienda`.
- Promociones -> `Promociones`.
- Usuarios -> `AjustesUsuarios`.
- Roles -> `AjustesRoles`.
- Exportar / Respaldo -> `ExportarDatos`.

Secciones que hoy son placeholder:

- Impuestos.
- Pagos / Terminal.
- Notificaciones.
- Apariencia.
- Auditoria.
- Integraciones.

### 6. BUSQUEDA DE SECCIONES
La busqueda de Ajustes filtra en frontend usando:

- Label de la seccion.
- Descripcion de la seccion.

Reglas actuales:

- Si no hay busqueda, muestra todas las secciones.
- Si la busqueda deja fuera la seccion activa, cambia a la primera coincidencia.
- Si no hay coincidencias, muestra estado vacio "Sin resultados".

No existe busqueda backend para secciones porque las secciones estan hardcodeadas en frontend.

### 7. BOTON REFRESCAR
El boton de refrescar intenta llamar `refresh()` sobre la seccion activa mediante refs.

Refs declarados:

- `tiendaRef`.
- `promosRef`.
- `usuariosRef`.
- `exportarRef`.
- `rolesRef`.

Estado actual:

- `AjustesRoles` si esta implementado con `forwardRef` y expone `refresh`.
- Los demas componentes renderizados no exponen claramente `refresh` con `useImperativeHandle`.
- Para placeholders no hay refresco.
- El boton gira visualmente usando estado `spinning`.

### 8. CONFIGURACION DE TIENDA
Componente:

- `ConfTienda.jsx`

Campos actuales:

- Nombre.
- Direccion.
- Telefono.
- Correo.

Comportamiento actual:

- Guarda datos solo en estado local.
- Al enviar formulario ejecuta `console.log("Datos de tienda:", form)`.
- No consume endpoints.
- No lee datos actuales de empresa.
- No persiste cambios.
- No valida telefono, correo ni nombre.

Backend relacionado existente:

- Existe `EmpresasController`.
- Existe tabla `Empresas`.
- La pantalla `ConfTienda` no esta cableada a `EmpresasController`.

### 9. EXPORTAR / RESPALDO
Componente:

- `ExportarDatos.jsx`

Campos actuales:

- Fecha inicio.
- Fecha fin.
- Tipo de exportacion: `csv`, `xlsx`, `PDF`.

Comportamiento actual:

- Mantiene seleccion en estado local.
- El boton "Exportar" no tiene handler funcional.
- No consume endpoints.
- No genera archivos.
- No crea respaldos.
- No restaura respaldos.
- No borra respaldos.
- No valida rango de fechas.

Ruta adicional:

- `ConfiguracionExportaciones.jsx` renderiza `ExportarDatos` dentro de `Shell`.

### 10. PROMOCIONES
Componente activo en Ajustes:

- `Promociones.jsx`

Campos actuales:

- Codigo de barras.
- Nombre de promocion.
- Cantidad minima.
- Cantidad maxima.
- Precio final.

Comportamiento actual:

- Crea promociones en estado local del componente.
- Usa `Date.now()` como id.
- Usa imagen placeholder externa.
- Permite activar/desactivar localmente.
- Permite eliminar localmente.
- Editar solo muestra `alert`.
- No consume endpoints.
- No persiste en base de datos.
- No afecta Ventas.
- No aplica descuentos reales.

Archivo adicional:

- `PromocionesVIsual.jsx` contiene una version visual similar/no principal.

### 11. USUARIOS
Componente:

- `AjustesUsuarios.jsx`

Responsabilidades actuales:

- Cargar usuarios.
- Cargar roles.
- Cargar permisos.
- Mostrar lista de usuarios.
- Seleccionar usuario.
- Editar perfil basico.
- Cambiar rol asignado.
- Cambiar estatus visual/activo.
- Intentar subir imagen.
- Mostrar permisos efectivos por rol.
- Permitir overrides por permiso en la interfaz.
- Crear usuarios mediante modal.
- Eliminar usuarios con confirmacion.

Endpoints usados:

- `GET /usuarios`.
- `GET /roles`.
- `GET /permisos`.
- `PUT /usuarios/{id}`.
- `DELETE /usuarios/{id}`.
- `POST /usuarios/{id}/imagen` intentado por frontend.
- `PUT /usuarioPermisos/{idUsuario}` intentado por frontend para overrides.

### 12. LISTA Y SELECCION DE USUARIOS
La pantalla de usuarios:

- Carga todos los usuarios de la empresa.
- Filtra usuarios en frontend por nombre o usuario.
- Selecciona automaticamente un usuario:
  - Primero intenta mantener preferido.
  - Luego intenta usuario de sesion.
  - Luego selecciona el primero.

Datos normalizados por usuario:

- `idUsuario`.
- `nombreUsuario`.
- `usuario`.
- `correo`.
- `telefono`.
- `imagen`.
- `idRol`.
- `rolNombre`.
- `activo`.

No hay paginacion backend en esta pantalla.

### 13. EDICION DE USUARIO
Campos editables en `AjustesUsuarios`:

- Nombre completo.
- Usuario.
- Rol.
- Correo.
- Telefono.
- Estatus.
- Imagen.

Validaciones frontend:

- Nombre minimo 3 caracteres.
- Usuario minimo 3 caracteres.
- Rol obligatorio.
- Correo con formato basico si se captura.
- Imagen debe ser tipo imagen.
- Imagen maximo 2.5 MB.

Payload de actualizacion:

- `nombreUsuario`.
- `usuario`.
- `correo`.
- `telefono`.
- `rol: { idRol }`.
- `estatus`.

Estado actual de contrasena:

- Existe boton "Administrar".
- El boton no abre modal ni ejecuta logica.

### 14. CREACION DE USUARIO
Componente:

- `AjustesUsuariosCrear.jsx`

Campos:

- Nombre completo.
- Usuario login opcional.
- Telefono opcional.
- Contrasena.
- Rol.
- Foto opcional.

Validaciones frontend:

- Nombre minimo 3 caracteres.
- Contrasena minimo 6 caracteres.
- Rol obligatorio.
- Usuario minimo 3 caracteres si se captura.
- Telefono minimo 7 caracteres si se captura.
- Foto debe ser imagen.
- Foto maximo 2.5 MB.

Flujo actual:

1. Lee `auth_session` desde `sessionStorage`.
2. Carga roles desde `GET /roles`.
3. Solicita llave publica en `GET /auth/keys/public`.
4. Cifra contrasena con RSA-OAEP.
5. Envia `POST /usuarios`.
6. Si backend devuelve id, intenta subir imagen a `/usuarios/{id}/imagen`.
7. Cierra modal y refresca usuarios.

### 15. CONTRASENAS Y CIFRADO
Flujo actual de alta de usuario:

- Frontend pide llave publica.
- Frontend cifra la contrasena con RSA-OAEP.
- Backend descifra con `RsaCryptoService`.
- Backend guarda hash BCrypt.

Backend:

- `UsuariosServiceImpl.create` exige `usuario`, `password` cifrado y `rol.idRol`.
- Valida que `usuario` no exista globalmente con `existsByUsuario`.
- Usa `EmpresaContextHolder` para asignar empresa.
- Limpia password antes de responder.

Observacion actual:

- `UsuariosServiceImpl.update` acepta password si viene en payload, pero el flujo visual actual de administrar contrasena no esta implementado.

### 16. IMAGEN DE USUARIO
La entidad `UsuariosEntity` contiene:

- `avatarUrl` con `LONGTEXT`.

Frontend:

- Lee `avatarUrl`, `imagenBase64` o `imagen`.
- Convierte base64 a data URL.
- Permite seleccionar imagen local.
- Intenta subir imagen a `/usuarios/{id}/imagen`.

Estado actual:

- No se encontro controlador backend para `/usuarios/{id}/imagen`.
- La subida de imagen es best-effort y no debe romper la creacion o edicion del usuario.
- Si falla, el frontend muestra warning.

### 17. OVERRIDES DE PERMISOS POR USUARIO
La interfaz `AjustesUsuarios` muestra una tabla de permisos con:

- Modulo.
- Accion.
- Permiso.
- Base.
- Override.
- Motivo.
- Efectivo.

Opciones visuales de override:

- Heredado.
- Permitir.
- Denegar.

Logica frontend:

- Calcula permisos base desde el rol seleccionado.
- Permite definir overrides en un `Map`.
- Calcula efectivo combinando rol y override.
- Intenta guardar overrides con `PUT /usuarioPermisos/{idUsuario}`.

Estado backend actual:

- `UsuariosPermisosController` existe.
- Su `PUT /usuarioPermisos/{id}` espera id del registro `UsuariosPermisos`, no id de usuario.
- El body esperado es `UsuariosPermisosEntity`, no `{ permisos: [...] }`.
- No existe endpoint bulk actual para guardar overrides por usuario como lo manda la UI.

### 18. ROLES
Componente:

- `AjustesRoles.jsx`

Responsabilidades actuales:

- Cargar roles.
- Cargar permisos.
- Buscar roles.
- Seleccionar rol.
- Crear rol.
- Editar nombre y estatus.
- Eliminar rol.
- Mostrar permisos agrupados por modulo.
- Seleccionar permisos con arbol checkbox.
- Expandir, contraer, limpiar o marcar todo.
- Guardar permisos del rol.

Endpoints usados:

- `GET /roles`.
- `POST /roles`.
- `PUT /roles/{id}`.
- `DELETE /roles/{idRol}`.
- `GET /permisos`.
- `PUT /roles/permisos/{idRol}`.

### 19. VALIDACIONES DE ROLES
Validaciones frontend:

- Nombre obligatorio.
- Nombre minimo 3 caracteres.
- No permite duplicado local por nombre antes de enviar.

Validaciones backend:

- `idEmpresa` header obligatorio.
- `nombreRol` obligatorio.
- `estatus` obligatorio en DTO.
- Nombre se normaliza con trim y espacios simples.
- No permite nombre repetido por empresa.
- Para actualizar, valida duplicado excluyendo el rol actual.
- Para eliminar, bloquea si el rol tiene usuarios asignados en la empresa.

### 20. PERMISOS DE ROL
El arbol de permisos se arma desde `GET /permisos`.

Agrupacion actual:

- Por `modulo`.
- Cada permiso muestra nombre, descripcion, clave y accion.

Guardado actual:

- Frontend manda `PUT /roles/permisos/{idRol}`.
- Body: `{ permisos: [idPermiso, ...] }`.
- Backend calcula diferencia:
  - Quita permisos no deseados.
  - Agrega permisos nuevos.
  - Valida que todos los permisos existan.

Estado actual:

- Esta es la parte mejor conectada del modulo de Configuracion.

### 21. CATALOGO DE PERMISOS
Backend:

- `PermisosController`.
- Tabla `Permisos`.

Endpoints:

- `GET /permisos`.
- `POST /permisos`.
- `PUT /permisos/{id}`.
- `DELETE /permisos/{id}`.

Uso actual en frontend:

- Usuarios y Roles consumen `GET /permisos`.
- No hay pantalla dedicada en Ajustes para crear/editar/eliminar permisos.

Permisos seed actuales relevantes:

- `CONFIG_USUARIOS`: Administrar usuarios, roles y permisos.
- `CONFIG_TIENDA`: Configurar tienda, cajas y parametros.

### 22. RELACION ROL-PERMISO
Backend:

- `RolesPermisosController`.
- Tabla `RolesPermisos`.

Endpoints genericos:

- `GET /rolesPermisos`.
- `POST /rolesPermisos`.
- `PUT /rolesPermisos/{id}`.
- `DELETE /rolesPermisos/{id}`.

Uso actual:

- La pantalla de Roles no usa directamente estos endpoints genericos.
- La pantalla usa el endpoint especifico `PUT /roles/permisos/{idRol}`.
- `RolesServiceImpl.updatePermisos` administra la relacion de forma bulk.

### 23. RELACION USUARIO-PERMISO
Backend:

- `UsuariosPermisosController`.
- Tabla `UsuariosPermisos`.

Endpoints genericos:

- `GET /usuarioPermisos`.
- `POST /usuarioPermisos`.
- `PUT /usuarioPermisos/{id}`.
- `DELETE /usuarioPermisos/{id}`.

Campos:

- Usuario.
- Permiso.
- Efecto.
- Motivo.

Estado actual:

- Existe persistencia para overrides.
- No existe endpoint frontend/backend alineado para guardar todos los overrides de un usuario de una vez.
- La UI actual intenta un contrato distinto al implementado.

### 24. CAMBIAR PERFIL
Componente relacionado:

- `CambiarPerfil.jsx`

Ubicacion:

- Vive en `components/common`.
- Se abre desde `UserProfileMenu`.

Flujo actual:

1. Carga usuarios agrupados por rol desde `GET /usuarios/rol`.
2. Usuario selecciona rol.
3. Usuario selecciona usuario.
4. Captura contrasena.
5. Solicita llave publica.
6. Cifra contrasena.
7. Ejecuta login.
8. Cierra sesion anterior best-effort.
9. Guarda nueva sesion con `useAuth.login`.
10. Recarga ventana.

Estado actual:

- Es funcionalmente cercano a Configuracion de usuarios, pero no forma parte del contenido principal de `Ajustes`.

### 25. SELECCION PERFIL LEGACY
Componente:

- `SeleccionPerfil.jsx`

Estado actual:

- Existe como componente separado.
- Carga usuarios desde `/usuarios`.
- Permite cambiar usuario con contrasena.
- Importa `CrearUsuarioModal` desde `./CrearUsuario`, pero ese archivo no aparece en el listado actual de Configuracion.
- No aparece declarado en `AppRouter`.
- El flujo mas actual visible en menu parece ser `CambiarPerfil`.

### 26. SOPORTE
Componente:

- `Soporte.jsx`

Comportamiento actual:

- Renderiza dentro de `Shell`.
- Muestra tarjetas de Contacto, Preguntas Frecuentes, Chat en vivo y Reportar Problema.
- Muestra busqueda.
- Muestra tabla de tickets.
- Abre modal de detalle de ticket.

Datos:

- Tickets hardcodeados en el componente.
- No consume endpoint.
- No persiste mensajes.
- No crea tickets reales.

Estado de ruta:

- `UserProfileMenu` navega a `/soporte`.
- `AppRouter` no declara `/soporte`.

### 27. EMPRESAS
Backend existente:

- `EmpresasController`.
- `EmpresasServiceImpl`.
- `EmpresasRepository`.
- Tabla `Empresas`.

Endpoints:

- `GET /empresas`.
- `POST /empresas`.
- `PUT /empresas/{id}`.
- `DELETE /empresas/{id}`.

Campos principales:

- Nombre.
- Direccion.
- Fecha inicio.
- Fecha fin.
- Token licencia.
- Tipo suscripcion.

Estado actual respecto a Configuracion:

- Backend existe.
- La pantalla `ConfTienda` no consume estos endpoints.
- No hay pantalla conectada para editar empresa desde Ajustes.

### 28. CAJAS
Backend existente:

- `CajasController`.
- `CajasServiceImpl`.
- `CajasRepository`.
- Tabla `Cajas`.

Endpoints:

- `GET /cajas`.
- `POST /cajas`.
- `PUT /cajas/{id}`.
- `DELETE /cajas/{id}`.

Campos principales:

- Nombre.
- Tipo.
- Empresa.

Estado actual respecto a Configuracion:

- Backend existe.
- No hay seccion visual conectada en Ajustes para administrar cajas.
- El texto de `CONFIG_TIENDA` menciona cajas y parametros, pero no hay UI actual cableada para ello.

### 29. SEGURIDAD ACTUAL
Backend:

- `SecurityConfig` permite publicamente:
  - `/auth/login`.
  - `/auth/keys/public`.
- Todo lo demas requiere autenticacion JWT.
- Se usa `JwtAuthFilter`.
- Sesion HTTP es stateless.
- CORS permite Tauri y localhost.

Estado actual de autorizacion por permiso:

- Existen roles y permisos.
- Existen relaciones rol-permiso.
- Existen overrides usuario-permiso.
- No se observo enforcement por permiso en `SecurityConfig`.
- No se observo guarda frontend por permiso en `RequireAuth`.
- `RequireAuth` solo valida autenticacion.

### 30. MULTIEMPRESA ACTUAL
Patrones actuales:

- Usuarios se filtran por `EmpresaContextHolder`.
- Crear usuario asigna empresa desde `EmpresaContextHolder`.
- Roles requieren header `idEmpresa`.
- Cajas se filtran por `EmpresaContextHolder`.
- Empresas se consultan con especificacion generica.
- Permisos son catalogo global, no por empresa.

Riesgo actual a conocer:

- Algunos endpoints usan `EmpresaContextHolder`.
- Otros usan header `idEmpresa`.
- Otros no aplican empresa porque son globales.
- El modulo Configuracion mezcla estos patrones.

### 31. TABLAS PRINCIPALES
Tablas relacionadas directamente con Configuracion actual:

- `Usuarios`.
- `Roles`.
- `Permisos`.
- `RolesPermisos`.
- `UsuariosPermisos`.
- `Empresas`.
- `Cajas`.

Tablas relacionadas por sesion/seguridad:

- `Sesion`.
- `TipoSuscripcion`.

Campos comunes:

- `estatus`.
- `fecha_creacion`.
- `fecha_modificacion`.
- `usuario_creacion`.
- `usuario_modificacion`.

### 32. SEED ACTUAL
Seed desktop crea:

- Tipo de suscripcion local.
- Empresa demo.
- Roles demo:
  - Administrador.
  - Vendedor.
  - Cajero.
  - Supervisor.
  - Invitado.
- Permisos demo:
  - Ventas.
  - Inventario.
  - Clientes.
  - Compras.
  - Reportes.
  - Configuracion.
  - Caja.
- Relaciones rol-permiso.
- Usuarios demo:
  - admin.
  - caja1.
  - vendedor.
  - supervisor.
- Overrides en `UsuariosPermisos`.

### 33. LIMITES ACTUALES IMPORTANTES
Estos limites existen hoy y deben considerarse antes de planear trabajo:

- Tienda no persiste.
- Exportar / Respaldo no exporta ni respalda.
- Promociones no persiste ni afecta ventas.
- Impuestos es placeholder.
- Pagos / Terminal es placeholder.
- Notificaciones es placeholder.
- Apariencia es placeholder.
- Auditoria es placeholder.
- Integraciones es placeholder.
- Soporte usa datos simulados y no tiene ruta declarada.
- Imagen de usuario intenta endpoint no encontrado.
- Overrides por usuario tienen contrato frontend/backend desalineado.
- Administrar contrasena no esta implementado.
- Permisos existen como datos administrables, pero no se vio enforcement global.

### 34. RENDIMIENTO ACTUAL
Pantallas que cargan listas completas:

- Usuarios carga todos los usuarios, roles y permisos.
- Roles carga todos los roles y permisos.
- Permisos se filtran en frontend.
- Secciones de Ajustes estan hardcodeadas y se filtran en frontend.

Estado actual:

- Para volumen bajo funciona.
- No hay paginacion backend en Usuarios/Roles desde estas pantallas.
- No hay virtualizacion en tablas/arboles.
- La parte de permisos puede crecer visualmente si aumenta mucho el catalogo.

### 35. QA FUNCIONAL MINIMO DEL ESTADO ACTUAL
Casos para verificar lo que ya existe:

- Entrar a `/ajustes`.
- Buscar secciones.
- Cambiar entre secciones.
- Ver placeholders sin error.
- Crear rol.
- Editar rol.
- Eliminar rol sin usuarios asignados.
- Bloquear eliminacion de rol con usuarios.
- Asignar permisos a rol.
- Cargar usuarios.
- Crear usuario con rol y contrasena.
- Editar usuario.
- Eliminar usuario.
- Cambiar perfil desde menu de usuario.
- Validar que Exportar no genera archivo actualmente.
- Validar que Tienda no persiste actualmente.
- Validar que Promociones se pierde al recargar.
- Validar que `/soporte` no esta declarado aunque el menu lo enlace.

### 36. QA TECNICO DEL ESTADO ACTUAL
Casos tecnicos:

- `GET /usuarios` filtra por empresa activa.
- `POST /usuarios` exige password cifrado y rol.
- `PUT /usuarios/{id}` no permite editar usuario de otra empresa.
- `DELETE /usuarios/{id}` no permite eliminar usuario de otra empresa.
- `GET /roles` requiere `idEmpresa`.
- `POST /roles` bloquea nombre repetido por empresa.
- `PUT /roles/permisos/{idRol}` agrega y elimina relaciones correctamente.
- `DELETE /roles/{idRol}` bloquea rol con usuarios.
- `GET /permisos` devuelve catalogo global.
- `PUT /usuarioPermisos/{idUsuario}` desde UI no coincide con backend actual.
- `POST /usuarios/{id}/imagen` no tiene endpoint backend encontrado.

### 37. RESUMEN EJECUTIVO
Configuracion hoy es una pantalla contenedora con una parte solida y varias partes preparadas visualmente.

Lo mas funcional actualmente es:

- Usuarios.
- Roles.
- Catalogo de permisos.
- Asignacion de permisos por rol.
- Cambio de perfil desde el menu de usuario.

Lo que existe pero esta incompleto o solo visual:

- Tienda.
- Exportar / Respaldo.
- Promociones.
- Soporte.
- Impuestos.
- Pagos / Terminal.
- Notificaciones.
- Apariencia.
- Auditoria.
- Integraciones.

La base tecnica para Configuracion ya existe en usuarios, roles, permisos, empresas y cajas. El primer analisis posterior debe partir de esta realidad: no todo lo visible esta conectado, y no todo lo existente en backend esta expuesto en la UI.
