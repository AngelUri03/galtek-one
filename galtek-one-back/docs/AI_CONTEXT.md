# AI_CONTEXT

Fecha de referencia: 2026-07-20.

Este documento es el contexto maestro para cualquier IA, agente o desarrollador que trabaje en GaltekOne. Debe leerse antes de modificar codigo, pantallas, endpoints, entidades, seguridad, datos o documentacion tecnica.

## Regla permanente para prompts futuros

Antes de modificar codigo, pantallas, endpoints, entidades, seguridad, datos o documentacion tecnica en GaltekOne, cualquier IA debe cargar solo el contexto necesario.

Contexto nucleo obligatorio para cualquier tarea:

- `/galtek-one-back/docs/README_CONTEXT.md`
- `/galtek-one-back/docs/AI_CONTEXT.md`
- `/galtek-one-back/docs/DEVELOPMENT_RULES.md`
- `/galtek-one-back/docs/CODEX_WORKFLOW.md`
- La seccion relevante de `/galtek-one-back/docs/MODULES_STATUS.md`

Contexto condicional:

- `/galtek-one-back/docs/CFG-ARQ-001.md` solo para Configuracion, Tienda, Usuarios, Roles, Overrides, Ticket o secciones de Ajustes.
- `/galtek-one-back/docs/VTA-ARQ-001.md` solo para Caja, Ventas, Pagos, Cierre, Ticket o movimientos de efectivo/tarjeta.
- `/galtek-one-back/docs/CLI-ARQ-001.md` solo para Clientes o integraciones que afecten Clientes.
- `/galtek-one-back/docs/PRV-ARQ-001.md` solo para Proveedores, abastecimiento o relaciones directamente vinculadas.
- `/galtek-one-back/docs/analisis-arquitectura-backend.md` cuando la tarea modifique backend, seguridad, persistencia, servicios, entidades o endpoints.
- `/galtek-one-back/docs/PROJECT_HISTORY.md` cuando sea necesario conocer cambios anteriores, decisiones historicas, commits o actualizar documentacion.

Para tareas que afecten varios modulos, leer unicamente los documentos de esos modulos. No leer Clientes, Proveedores y Configuracion como paquete global si la tarea no los toca.

Orden recomendado:

1. `README_CONTEXT.md`
2. `AI_CONTEXT.md`
3. `DEVELOPMENT_RULES.md`
4. `CODEX_WORKFLOW.md`
5. Seccion relevante de `MODULES_STATUS.md`
6. Documentos condicionales segun la tarea

Regla de verdad: los documentos son una base estrategica, no una fuente perfecta. Si el codigo contradice los documentos, se debe priorizar el codigo real y dejar la diferencia marcada como `pendiente de alinear`.

## Identidad del producto

- Producto: GaltekOne.
- Empresa/marca: GaltekSolution.
- Tipo de sistema: punto de venta de escritorio para tiendas pequenas y medianas.
- Objetivo principal: operar ventas, inventario, compras, clientes, proveedores, configuracion, reportes y procesos administrativos desde una experiencia limpia, moderna y confiable.
- Experiencia esperada: premium, ordenada, rapida, sin apariencia generica. La referencia visual es una interfaz moderna tipo Apple Vision, aplicada de forma practica a un POS de escritorio.
- Prioridad de pantallas: escritorio. Resoluciones prioritarias: 1366x768, 1440x900, 1600x900, 1920x1080 y 2560x1440.
- Mobile: no es prioridad. No romper responsive basico, pero no disenar primero para telefono.

## Estandar visual no negociable de GaltekOne

En GaltekOne el diseno no es decoracion adicional. La claridad visual, velocidad operativa, navegacion por teclado, consistencia, microinteraccion y sensacion premium son parte central del producto.

Una funcionalidad que compila, pero se siente generica, lenta, desordenada, inconsistente o dificil de operar con teclado, no se considera terminada.

La referencia conceptual es Apple Vision adaptada a un POS de escritorio: claridad, profundidad controlada, capas bien jerarquizadas, superficies limpias, bordes sutiles, sombras naturales, transiciones suaves y reduccion de ruido. No debe convertirse en una interfaz experimental, flotante, lenta ni decorativa. Debe conservar la rapidez, densidad util, lectura inmediata y operacion repetitiva eficiente de un POS.

Pantallas de referencia visual principal:

- Proveedores.
- Clientes.
- Configuracion.
- Tienda.
- Usuarios.
- Roles.
- Overrides.
- Ticket e impresion.

Reglas estrategicas:

- Cada pantalla debe sentirse parte del mismo producto, sin apariencia de plantilla generica o sistema improvisado.
- No introducir variantes visuales aisladas si ya existe un patron valido dentro de GaltekOne.
- Normalizar inputs, selects, buscadores, tablas, botones, badges, tooltips, modales, drawers, tabs, tarjetas, skeletons, empty states, estados de error y acciones por fila.
- Reutilizar patrones, variables CSS o tokens existentes para colores, radios, sombras, espaciados, alturas de controles, animaciones y z-index cuando sea razonable.
- El verde institucional es el color operativo principal para foco, seleccion, acciones principales y estados positivos, sin volver la pantalla monocromatica.
- El foco visible debe ser verde, elegante y consistente. No debe aparecer el borde azul nativo de navegador, PrimeReact, MUI, Ant Design u otra libreria.
- Las sombras deben ser suaves, naturales y funcionales; no deben aplicarse de forma intensa a todos los elementos.
- El movimiento debe comunicar cambios de estado sin retrasar la operacion.
- Cualquier pantalla nueva o modificada debe contemplar carga, skeleton cuando aplique, vacio, sin resultados, error, reintento, guardando, guardado, cambios sin guardar, textos largos, pocos datos y muchos datos.

## Navegacion por teclado y velocidad operativa

GaltekOne debe poder utilizarse correctamente con teclado. Esto no es solo accesibilidad: es productividad esencial para un POS usado durante jornadas largas.

Toda pantalla nueva o modificada debe poder recorrerse, comprenderse y operarse de forma rapida y predecible con teclado:

- `Tab` y `Shift + Tab` siguen el orden visual y operativo.
- `Enter` confirma la accion principal cuando sea seguro.
- `Espacio` activa botones, switches, radios y checkboxes cuando corresponda.
- `Escape` cierra modales, drawers, popovers y menus cuando sea seguro.
- Flechas operan selects, listas, tabs, menus y controles compuestos.
- El foco no se pierde al guardar, refrescar, abrir o cerrar modales.
- Modales, drawers y popovers deben manejar focus trap, retorno de foco y cierre seguro.
- Ninguna funcion importante debe depender exclusivamente del mouse ni de drag and drop.
- Los flujos deben minimizar clics, pasos, ventanas y cambios de contexto.

Regla central: GaltekOne debe sentirse inmediato. La interfaz guia sin estorbar, responde sin retraso y permite completar la operacion con el menor esfuerzo mental y fisico razonable.

## Estado real del repositorio

Estructura principal detectada:

- `galtek-one-back/`: backend Java Spring Boot.
- `galtek-one-front/`: frontend React.
- `src-tauri/`: empaquetado desktop Tauri dentro del frontend.
- `dist-desktop/`: salida o recursos de distribucion desktop.
- `scripts/`: scripts auxiliares.
- `galtek-one-schema.sql` y `galtek-one-seed.sql`: esquema y semillas SQL de referencia.
- `database-setup.ps1`: preparacion local de base de datos.
- `build-desktop.ps1`: preparacion/build desktop.
- `package.json` raiz: orquesta comandos front/back/desktop.

La rama revisada fue `develop`. El arbol estaba limpio cuando se creo la documentacion base; en actualizaciones posteriores debe verificarse `git status` antes de asumirlo.

## Stack tecnico detectado

Backend:

- Java 21.
- Spring Boot 3.3.4.
- Maven.
- Spring Web, Spring Data JPA, Spring JDBC, Spring Security, Validation, Actuator.
- JWT con `jjwt`.
- BCrypt strength 12.
- RSA/BouncyCastle para claves y cifrado relacionado con autenticacion.
- OSHI para datos de hardware/licenciamiento.
- Lombok.
- SQLite para perfil desktop.
- MySQL para perfil productivo.
- H2 para perfil test.

Frontend:

- React 19.1.
- `react-scripts` 5.0.1. El proyecto no usa Vite.
- React Router DOM 7.
- PrimeReact, PrimeIcons.
- MUI, Ant Design en partes del proyecto.
- lucide-react.
- Chart.js.
- Tauri API 2.

Desktop:

- Tauri 2.
- Producto desktop: `Galtek One`.
- Identificador: `com.galtekone.desktop`.
- Desarrollo frontend: `http://localhost:3000`.
- Backend desktop local: `http://127.0.0.1:18080/GaltekOne`.
- Ventana minima detectada: 1024x680.
- Ventana inicial detectada: 1280x800.
- El bundle incluye recursos de backend y JRE.

Despliegue objetivo:

- Desarrollo local: Windows.
- Backend objetivo: Linux/AWS, con intencion de Elastic Beanstalk.
- Frontend objetivo: AWS Amplify.
- Nota: no se detecto configuracion Amplify completa en el repositorio durante esta revision. Tratarlo como intencion de despliegue hasta alinear infraestructura.

## Arquitectura backend

Patron dominante:

- `controller`
- `service`
- `serviceImplement`
- `repository`
- `entity`
- `dto`
- `mapper`
- `specification`

Convenciones observadas:

- Muchas entidades heredan de `CommonEntity`.
- `CommonEntity` centraliza `fechaCreacion`, `fechaModificacion`, `estatus`, `usuarioCreacion` y `usuarioModificacion`.
- Las respuestas suelen usar `ApiResponseBuilder`.
- Los filtros dinamicos usan `DynamicSpecification` y/o specifications por modulo.
- Hay soporte multiempresa con `EmpresaContextHolder` y uso de `idEmpresa` desde JWT/header segun flujo.
- No se debe introducir una arquitectura nueva si el cambio puede resolverse siguiendo el patron actual.

Seguridad real detectada:

- Configuracion stateless.
- JWT obligatorio para casi todo el backend.
- Endpoints permitidos sin autenticacion: login, claves publicas, identidad/activacion de dispositivo y OPTIONS.
- CORS restringido a origenes locales/Tauri detectados, sin acceso abierto global en el codigo actual.
- Filtros relevantes: `HardwareLockFilter` y `JwtAuthFilter`.
- `@EnableMethodSecurity` esta activo.

Decision especial sobre permisos:

- La base de roles, permisos y overrides existe.
- La aplicacion final debe validar permisos en pantallas, acciones, rutas y endpoints criticos.
- La aplicacion del enforcement real de permisos se hara al final del desarrollo completo.
- Por ahora no eliminar permisos, no rehacer roles, no bloquear falsamente flujos existentes y no inventar autorizaciones parciales que rompan operacion.
- Toda nueva pantalla critica debe dejar referencias listas para permisos futuros.

## Arquitectura frontend

Patron dominante:

- App React con rutas centralizadas en `AppRouter`.
- Cliente HTTP centralizado en `src/API/APIfetch.js`.
- Endpoints definidos en `src/API/api.js`.
- Sesion en `sessionStorage.auth_session`.
- `APIfetch` adjunta JWT, usuario e `idEmpresa`.
- Existen guardas `RequireAuth`, `RequireGuest` y `RequireActivation`.
- `DeviceContext` maneja estado de activacion/licenciamiento local.

Reglas importantes:

- No migrar a Vite sin instruccion explicita.
- Mantener compatibilidad Tauri real.
- No usar datos mock si ya existe endpoint funcional.
- Si una pantalla todavia esta local/mock, marcarla en documentacion como parcial o pendiente.
- Las pantallas de POS deben optimizarse para escritorio, escaneo rapido y trabajo repetido.

## Modulos detectados

Modulos funcionales o parcialmente funcionales:

- Configuracion general.
- Tienda/empresa actual.
- Usuarios.
- Roles.
- Permisos y overrides por usuario.
- Ticket e impresion.
- Ventas.
- Inventario.
- Compras.
- Proveedores.
- Clientes.
- Reportes.
- Metodos de pago.
- Licenciamiento/activacion local.
- Caja operativa: `SaldoEfectivo` es el saldo continuo por instalacion (`LocalDevice`) y empresa; `CajaSesion` es el turno financiero por usuario. La apertura limpia no captura `openingAmount` ni crea `OPENING`; si el usuario reporta diferencia al abrir, el backend registra incidencia y conciliacion `HANDOFF_RECONCILIATION` para dejar el saldo operativo alineado al conteo declarado. `CajasEntity`/`cashRegisterId` son legacy y no representan un cajon fisico configurable.

Modulos preparados o visuales:

- Auditoria.
- Soporte.
- Apariencia.

Modulos pendientes o aun no conectados de forma completa:

- Respaldos/exportaciones.
- Facturacion futura.
- Integraciones.
- Notificaciones.
- Promociones con impacto real en ventas.

Ver detalle operativo en `MODULES_STATUS.md`.

## Documentos base existentes

Documentos que ya existian y se conservan como base parcial:

- `CFG-ARQ-001.md`: configuracion, usuarios, roles, permisos, overrides, ticket y ajustes.
- `CLI-ARQ-001.md`: clientes.
- `PRV-ARQ-001.md`: proveedores.
- `analisis-arquitectura-backend.md`: analisis backend.

Estos documentos son utiles, pero su lectura es condicional segun modulo o tipo de cambio. Algunos puntos quedaron desactualizados contra el codigo; las diferencias detectadas se documentan en cada archivo y en `MODULES_STATUS.md`.

## Decisiones que no se deben romper

- Mantener Spring Boot como backend principal.
- Mantener React con `react-scripts` como frontend actual.
- Mantener Tauri 2 como objetivo desktop real.
- Mantener SQLite para desktop local y MySQL para produccion.
- Mantener contexto `/GaltekOne` en backend.
- Mantener puerto desktop local `18080` salvo instruccion explicita.
- Mantener endpoints existentes salvo que el cambio pida una migracion controlada.
- Mantener estructura de entidades y tablas salvo que se documente migracion.
- Mantener roles/permisos/overrides aunque el enforcement total se posponga.
- Mantener el look premium, limpio, denso y usable para escritorio.
- Mantener navegacion completa por teclado, foco verde visible, tabulacion logica y flujos rapidos como requisitos de producto.

## Como actuar cuando hay contradicciones

1. Leer el codigo real.
2. Compararlo contra los documentos.
3. Priorizar el codigo si hay contradiccion.
4. Marcar la diferencia como `pendiente de alinear`.
5. No borrar documentacion historica util.
6. Si se cambia comportamiento, actualizar este paquete documental.

## Cosas que requieren cuidado especial

- `SecurityConfig`.
- `HardwareLockFilter`.
- `JwtAuthFilter`.
- Rutas de activacion/licenciamiento.
- Entidades y scripts SQL.
- Endpoints usados por pantallas existentes.
- Flujo de ventas y descuento de inventario.
- Caja operativa, apertura con reporte, cierre/corte, movimientos de efectivo/tarjeta e incidencias.
- Ticket e impresion.
- Usuarios, roles, permisos y overrides.
- Empaquetado Tauri.
- Resoluciones desktop prioritarias.

## Prompt recomendado para futuras sesiones

```text
Trabaja en GaltekOne. Antes de modificar, lee el contexto nucleo: /galtek-one-back/docs/README_CONTEXT.md, /galtek-one-back/docs/AI_CONTEXT.md, /galtek-one-back/docs/DEVELOPMENT_RULES.md, /galtek-one-back/docs/CODEX_WORKFLOW.md y la seccion relevante de /galtek-one-back/docs/MODULES_STATUS.md. Lee documentos condicionales solo si aplican al modulo o tipo de cambio: CFG-ARQ-001 para Configuracion/Tienda/Usuarios/Roles/Overrides/Ticket/Ajustes, VTA-ARQ-001 para Caja/Ventas/Pagos/Cierre/Ticket/movimientos, CLI-ARQ-001 para Clientes, PRV-ARQ-001 para Proveedores/abastecimiento, analisis-arquitectura-backend.md para backend/seguridad/persistencia/servicios/entidades/endpoints y PROJECT_HISTORY.md solo si se necesita historia, commits, decisiones previas o actualizar documentacion. Verifica el codigo real antes de modificar; si contradice la documentacion, prioriza el codigo y marca pendiente de alinear. Manten el estandar visual premium tipo Apple Vision adaptado a POS: componentes normalizados, experiencia rapida, foco verde, navegacion completa por teclado, tabulacion logica y flujos con pocos pasos. No apliques enforcement final de permisos salvo solicitud explicita. No declares QA visual ni QA de teclado sin ejecutar la app y validar en runtime.
```
