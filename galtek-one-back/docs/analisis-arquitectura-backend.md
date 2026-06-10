# ANÁLISIS DE ARQUITECTURA - galtek-one-back BACKEND

### 1. ESTRUCTURA GENERAL DEL PROYECTO
- **Tipo de proyecto:** Construido con Maven y basado en Spring Boot (versión 3.3.4).
- **Convenciones de paquetes:** Todo el código principal reside bajo `com.galtekone`. Los submódulos están claramente divididos por responsabilidad técnica: `config`, `controller`, `crypto`, `dto`, `entity`, `repository`, `security`, `services`, `utils`.
- **Capas identificadas:**
  - **Controllers:** Exponen la API REST.
  - **Services (Interfaz + Impl):** Contienen la lógica de negocio.
  - **Repositories:** Gestión de persistencia (Spring Data JPA).
  - **Entities:** Modelos de base de datos ORM.
  - **DTOs:** Objetos para la transferencia de datos y payload de la API.
  - **Security:** Configuración y filtros de JWT y CORS.
  - **Utils:** Utilidades transversales (Response Builders, Validadores de contexto, Creadores dinámicos de Queries).

### 2. ARQUITECTURA MULTI-EMPRESA
- **Filtrado y Entidades:** Las entidades que pertenecen a una empresa específica implementan la interfaz `BaseEmpresa` o poseen una relación directa con `EmpresasEntity`.
- **Contexto (ThreadLocal):** Se utiliza la clase `EmpresaContextHolder` para mantener el `idEmpresa` del usuario autenticado de forma aislada por cada hilo de ejecución de la petición web.
- **Inyección de contexto:** El filtro `JwtAuthFilter` se encarga de interceptar cada petición, leer el JWT, extraer el `idEmpresa` de los *claims* y guardarlo en el `EmpresaContextHolder`. Al finalizar la petición, el `finally` limpia el contexto para evitar fugas de memoria o contaminación entre hilos.
- **Validación y Asignación:** A través de la clase utilitaria `EmpresaValidator`, los servicios pueden invocar `asignarEmpresa(entity)` para inyectar automáticamente el `idEmpresa` actual antes de guardar, asegurando que un usuario no pueda afectar o crear datos para una empresa ajena.

### 3. SEGURIDAD Y AUTENTICACIÓN
- **Tecnología:** Autenticación Stateless basada en JWT (JSON Web Tokens) usando la librería `jjwt`, combinada con cifrado asimétrico RSA para protección de credenciales en tránsito.
- **Flujo de Login:** 
  - El endpoint `/auth/login` es público. 
  - Recibe el payload y desencripta la contraseña mediante `RsaCryptoService` (usando una llave privada definida en `application.properties`).
  - Utiliza `BCryptPasswordEncoder` para comparar la contraseña.
  - Si es correcta, genera una sesión en base de datos/memoria (`sessionService`) y un token JWT con claims clave (`rol`, `idEmpresa`, `sid`).
- **Filtros:** `JwtAuthFilter` valida el token en cada request protegido, renueva o valida el estado de la sesión (`sessionService.validateAndTouch(sid)`) y carga las autorizaciones en el `SecurityContextHolder`.
- **Endpoints:** Salvo el Login y recuperación de llaves públicas (`/auth/keys/public`), todo el sistema exige autenticación.
- **CORS y CSRF:** CSRF desactivado por la naturaleza stateless de la API. Las reglas CORS están globalmente configuradas en `SecurityConfig` para permitir cualquier origen, con credenciales habilitadas.

### 4. CAPA DE ENTIDADES (JPA)
- **Entidades Principales:** `UsuariosEntity`, `ProductosEntity`, `VentasEntity`, `CajasEntity`, `MovimientoCajaEntity`, `EmpresasEntity`, `InventarioEntity`, etc.
- **Relaciones:** Uso robusto de `@ManyToOne`, `@OneToMany`.
- **Superclase de Auditoría:** Gran parte de las tablas extienden de `CommonEntity` anotada con `@MappedSuperclass`. Esta clase provee auditoría base a la base de datos: `fechaCreacion` (`@CreationTimestamp`), `fechaModificacion` (`@UpdateTimestamp`), `usuarioCreacion`, `usuarioModificacion` y `estatus` (boolean soft-delete/activo).
- **Generación de IDs:** Estrategia de auto-incremento de JPA clásica.

### 5. REPOSITORIOS (DAO)
- **Patrón usado:** Interfaces que extienden `JpaRepository` y `JpaSpecificationExecutor`.
- **Filtros dinámicos:** Aprovechan fuertemente las Specifications de Spring Data JPA. Permiten construir queries programáticamente en lugar de quemar queries nativas en todos lados.
- Existen clases especializadas como `InventarioSpecification` para armar queries complejas multivariable.

### 6. SERVICIOS (SERVICIO + IMPL)
- **Patrón de diseño:** Uso estricto de segregación por interfaces (`Interface` + `Impl`).
- **Inyección de dependencias:** Configurada mediante Inyección por Constructor (`@RequiredArgsConstructor` de Lombok) y `@Autowired`.
- **Lógica principal:** Orquestan mapeos DTO -> Entity, realizan llamadas a utilidades de empresa y aplican la persistencia.
- Tienen la responsabilidad de las interacciones transaccionales, aunque el uso explícito de `@Transactional` varía según las operaciones de escritura pesadas.

### 7. CONTROLADORES (REST API)
- **Estilo REST:** Se exponen URIs plurales en su mayoría (`/cajas`, `/movimiento-caja`, etc.).
- **Wrappers de Respuesta:** Todas las respuestas de éxito o error pasan obligatoriamente por un factory centralizado llamado `ApiResponseBuilder` que devuelve una estructura coherente tipo JSON:
  `{ statusCode, status, user, timestamp, durationMs, message, data }`.
- **Manejo de tiempos:** La mayoría de los endpoints inicializan un `long startTime = System.currentTimeMillis();` al arrancar el método para registrar el tiempo de procesamiento (`durationMs`) que exige el `ApiResponseBuilder`.

### 8. DTOs
- **Agrupación:** Organizados por subpaquetes de dominio dentro del paquete `dto` (ej. `dto/login`, `dto/movimientoCaja`, `dto/caja`).
- **Patrón:** Clases planas utilizando anotaciones de Lombok (`@Data`, `@Getter`, `@Setter`) para evitar código repetitivo. No usan Records de Java 14+ hasta el momento, mantienen las clases clásicas.

### 9. MANEJO DE EXCEPCIONES
- **Centralización (o falta de ella):** **Punto arquitectónico clave:** El proyecto **NO** utiliza una clase global `@ControllerAdvice` con `@ExceptionHandler`. 
- En su lugar, el manejo de excepciones se gestiona localmente en cada método de cada controlador utilizando bloques `try-catch` que retornan un `ApiResponseBuilder.buildErrorResponse(...)`.
- A nivel de seguridad (AuthenticationEntryPoint y AccessDeniedHandler), se encuentra centralizado en `RestAuthHandlers`, forzando devoluciones estandarizadas a través del mismo builder.

### 10. CONFIGURACIÓN
- **Application Properties:** Define la conexión a MySQL, configuraciones de pool de conexiones optimizadas para Hikari (`max-lifetime`, `connection-timeout`), y variables críticas del negocio (`app.jwt.secret`, paths del RSA).
- **Beans:** `SecurityConfig` maneja la instanciación principal de la cadena de filtros, el administrador de autenticación y el mapeo CORS.

### 11. UTILIDADES Y HELPERS
- **DynamicSpecification:** Helper sumamente inteligente para consultas REST. Interpreta símbolos como `>=`, `<=`, `>`, `<` pasados en un mapa para construir predicados JPA `CriteriaBuilder` en tiempo de ejecución. Convierte automáticamente el tipo de dato (Double, String, LocalDateTime) basándose en la clase destino de la entidad.
- **ApiResponseBuilder / ApiResponse:** Centralizan la respuesta genérica del backend.
- **RsaCryptoService:** Oculta la complejidad de BounceCastle para la gestión del cifrado de passwords desde el Front.

### 12. PRUEBAS
- Cuentan con soporte inicial para dependencias de prueba (ej. base de datos H2 en scope *test*, dependencias de Spring Boot Test). Existe una clase base generada `GaltekOneBackendApplicationTests.java`.

### 13. DEPENDENCIAS PRINCIPALES
- **Spring Boot Starters:** `web`, `data-jpa`, `security`, `validation`.
- **Base de datos:** `mysql-connector-j` y `h2` para testing.
- **Seguridad y Cifrado:** `jjwt` (manejo de JWT), `bcprov-jdk18on` (BouncyCastle para criptografía asimétrica).
- **Herramientas de Desarrollador:** `lombok` (reducción boilerplate).

### 14. PATRONES ARQUITECTÓNICOS OBSERVABLES
- **Multi-Tenant a Nivel de Filas:** Discriminación de empresa por columas en DB + `ThreadLocalContext`.
- **Patrón Especificación (Specification Pattern):** Altamente explotado en listas de GET.
- **Facade/Factory de Repuestas:** `ApiResponseBuilder`.
- **Cifrado Híbrido Asimétrico/Hash:** RSA para tránsito (front-to-back) y BCrypt para reposo (back-to-db).

### 15. POSIBLES DEUDAS TÉCNICAS O PUNTOS DE MEJORA
1. **Falta de ControllerAdvice:** Es el mayor punto de dolor actual. Tener `try-catch` capturando `Exception` genérico en cada Controller rompe el principio DRY y contamina los controladores con fontanería de manejo de errores y cálculo de `durationMs`.
2. **Validaciones en API:** Carencia parcial del uso de anotaciones automáticas `@Valid` en las firmas de los endpoints para automatizar errores *Bad Request* 400.
3. **MapStruct/ModelMapper:** Aparentemente, los mapeos entre Entity y DTO se están haciendo de forma manual, propensos a errores y pesados a la vista.

---

### 16. FLUJOS DE EJEMPLO

#### Flujo 1: Inicio de Sesión (Login)
1. El usuario cliente encripta su contraseña con la llave RSA Pública de la API.
2. Se envía la solicitud al endpoint `/auth/login` con el `LoginRequestDTO`.
3. El `AuthServiceImpl` intercepta. Busca al usuario por nombre en la BD con `UsuariosRepository`.
4. El servicio invoca `rsaCryptoService.decryptBase64()` para obtener la clave cruda del request enviado por frontend.
5. Invoca a `passwordEncoder.matches()` para compararla con el hash de BD.
6. Si es exitoso, crea una sesión virtual con `sessionService`.
7. Construye el payload del JWT con información sensible (Rol, Empresa, Session ID).
8. Retorna el token en un `LoginResponseDTO`.

#### Flujo 2: Creación de un recurso (ej. Caja o Movimiento) filtrado por Empresa
1. El request llega al controlador (ej. `CajasController.postCajas`) incluyendo el header `Authorization: Bearer <token>`.
2. Interviene `JwtAuthFilter`: descifra el token, extrae el claim `idEmpresa` y ejecuta `EmpresaContextHolder.setEmpresaId(idEmpresa)`.
3. La petición avanza al Controlador, el cual mapea el DTO del Request.
4. Antes de que el Servicio/Controller llame a `repository.save()`, instancia la entidad e incluye manual o dinámicamente la `EmpresaEntity` asociada. En flujos refactorizados se usa `EmpresaValidator.asignarEmpresa(entity)`.
5. JPA ejecuta el `INSERT` amarrando el ID correcto de forma segura e imperceptible para el front.
6. En el `finally` de `JwtAuthFilter`, el bloque hace `EmpresaContextHolder.clear()` limpiando el ThreadLocal.

---

### 🔥 RESUMEN EJECUTIVO: LOS 10 PUNTOS CLAVE PARA UN DEV NUEVO

1. **No toques la estructura de Respuesta:** Usa SIEMPRE `ApiResponseBuilder` para retornar los JSONs y pasa siempre el tiempo y el header de `user`.
2. **El contexto de Empresa es invisible pero crucial:** Todo usuario logueado inyecta automáticamente su `idEmpresa` en el Thread a través de JWT. Siempre que guardes o filtres una entidad asociada a una empresa, obtén este ID de `EmpresaContextHolder.getEmpresaId()`.
3. **No uses Queries nativas si puedes usar Especificaciones:** El proyecto usa `DynamicSpecification` masivamente en los controladores para convertir diccionarios de filtros (Maps) en predicados de JPA. Acostúmbrate a este flujo en métodos GET.
4. **Manejo de Errores local (por ahora):** Notarás `try-catch(Exception e)` en cada endpoint. Así se ha manejado. Si se refactoriza a futuro, se hará un Global ControllerAdvice.
5. **Autenticación doblemente protegida:** Contraseñas viajan encriptadas en RSA (frontend -> backend) y descansan encriptadas en BCrypt (backend -> base de datos). 
6. **Interfaces e Impl es Ley:** Por regla general en este proyecto, jamás se autowirean las clases Impl en el controller, siempre las interfaces de los servicios.
7. **CommonEntity como base:** Si vas a crear una nueva tabla del negocio, que tu Entity extienda de `CommonEntity`. Obtendrás manejo automático de estatus, usuario de creación y timestamps.
8. **CORS Abierto, Rutas Protegidas:** CORS permite a todos; la seguridad recae completamente en la validez del token JWT en el filtro.
9. **Eliminación Lógica sobre Física:** El campo `estatus` (boolean en `CommonEntity`) se favorece en el dominio para borrar ("dar de baja") registros, en vez de un SQL `DELETE` duro.
10. **Lombok para simplificar:** Usa `@Data`, `@Getter`, `@Setter` y `@RequiredArgsConstructor` (inyección de constructor) para tus clases. Reduce la verbosidad al máximo.
