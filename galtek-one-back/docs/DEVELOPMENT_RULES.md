# DEVELOPMENT_RULES

Fecha de referencia: 2026-07-20.

Estas reglas guian cambios futuros en GaltekOne. Aplican para IA, agentes y desarrolladores humanos.

## Regla cero

Antes de modificar codigo, leer el contexto nucleo definido en `README_CONTEXT.md` y solo los documentos condicionales aplicables a la tarea.

Si una tarea es solo de documentacion, no modificar codigo funcional, endpoints, entidades, seguridad, dependencias, pantallas ni scripts de build.

## Fuente de verdad

- El codigo real tiene prioridad sobre los documentos.
- Los documentos existentes son base parcial.
- Si hay contradiccion, marcar `pendiente de alinear`.
- No borrar contenido historico util solo porque este desactualizado; agregar una nota de alineacion.

## Reglas de backend

- Mantener Java 21 y Spring Boot 3.3.4 salvo decision explicita.
- Seguir la arquitectura por capas existente: controller, service, serviceImplement, repository, entity, dto, mapper, specification.
- Usar `ApiResponseBuilder` cuando el modulo ya lo use.
- Respetar `CommonEntity` y sus campos de auditoria/estatus.
- No exponer endpoints nuevos sin revisar rutas frontend y seguridad.
- No cambiar contexto `/GaltekOne` sin revisar desktop, scripts y despliegue.
- No cambiar puerto desktop `18080` sin revisar Tauri y scripts.
- No introducir Flyway/Liquibase sin decision formal del proyecto.
- Si se cambia schema, actualizar scripts SQL y documentacion.
- Mantener SQLite desktop, MySQL produccion y H2 en pruebas cuando aplique.
- No romper perfil `desktop`, `prod` o `test`.

## Reglas de seguridad

- No relajar `SecurityConfig` sin razon documentada.
- No eliminar `HardwareLockFilter`.
- No eliminar `JwtAuthFilter`.
- Mantener login y activacion de dispositivo como flujos criticos.
- Mantener BCrypt y RSA donde ya se usan.
- No guardar secretos reales en repo.
- No registrar tokens, passwords, claves privadas ni datos sensibles.

## Reglas de permisos

Decision vigente:

- Roles, permisos y overrides ya existen como base.
- El enforcement completo en pantallas, acciones, rutas y endpoints criticos se aplicara al final del desarrollo completo.
- Hasta entonces, no eliminar permisos, no rehacer roles, no bloquear falsamente flujos y no inventar una autorizacion parcial que rompa operacion.
- Nuevos modulos criticos deben dejar preparado el punto de integracion para permisos futuros.

Cuando llegue la fase de enforcement:

- Validar permisos en frontend para visibilidad/acciones.
- Validar permisos en backend para operaciones criticas.
- Validar rutas protegidas.
- Validar acciones destructivas.
- Probar usuarios con rol admin, rol limitado y overrides.

## Reglas de frontend

- El proyecto usa `react-scripts`, no Vite.
- No migrar toolchain sin instruccion explicita.
- Mantener compatibilidad Tauri 2.
- Usar `src/API/api.js` para endpoints.
- Usar `src/API/APIfetch.js` para requests autenticados.
- No duplicar clientes HTTP sin necesidad.
- No introducir mocks si ya existe endpoint real.
- Si un mock es temporal, etiquetarlo y documentarlo.
- No cambiar rutas principales sin revisar `AppRouter`, menu y guards.
- Respetar `RequireAuth`, `RequireGuest` y `RequireActivation`.

## Semantica y accesibilidad minima

- Usar elementos HTML semanticos cuando sea posible.
- Botones de icono deben tener nombre accesible.
- Labels deben estar asociados a sus campos.
- No comunicar estados unicamente mediante color.
- Mantener contraste legible.
- Mensajes de error deben poder relacionarse con el campo correspondiente.
- Componentes personalizados deben conservar el comportamiento esperado de teclado.

## Reglas de UX

- GaltekOne es desktop-first.
- Priorizar 1366x768, 1440x900, 1600x900, 1920x1080 y 2560x1440.
- Mobile no es prioridad, pero no debe quedar roto de forma absurda.
- La experiencia debe sentirse premium, limpia, moderna y practica.
- Evitar apariencia de plantilla generica.
- Mantener densidad util para POS: tablas, filtros, acciones rapidas y lectura rapida.
- No introducir hero pages o marketing UI dentro del producto operativo.
- No usar controles nativos si el modulo ya usa componentes estilizados del sistema.
- Evitar UI que dependa de una sola familia de color.
- No romper layouts en resoluciones objetivo.

## Reglas visuales no negociables

Estas reglas aplican a cualquier pantalla nueva o modificada del frontend:

- El diseno, la velocidad operativa, la claridad y la interaccion son parte central del producto.
- Una pantalla que compila pero se siente generica, lenta, desordenada o inconsistente no esta terminada.
- Cada pantalla debe sentirse parte de GaltekOne, no de una plantilla administrativa generica.
- Comparar pantallas nuevas contra Proveedores, Clientes, Configuracion, Tienda, Usuarios, Roles, Overrides y Ticket/impresion antes de darlas por cerradas.
- No mezclar estilos visuales incompatibles.
- No introducir patrones nuevos sin revisar componentes hermanos y estilos existentes.
- No usar controles nativos sin personalizacion cuando rompan la estetica del sistema.
- No permitir bordes azules nativos de navegador, PrimeReact, MUI, Ant Design u otra libreria.
- No usar rojo agresivo como accion principal. Acciones destructivas deben ser discretas, explicadas y confirmadas.
- No usar `alert`, `confirm` o `prompt` nativos del navegador para flujos de producto.
- No saturar con tarjetas, colores, sombras, degradados o acciones.
- No abusar del glassmorphism. Debe aportar profundidad, no ruido.
- No crear scroll horizontal innecesario.
- Textos largos, datos minimos y datos abundantes no deben romper el layout.
- Estados de carga, vacio, error y guardado deben verse disenados, no improvisados.

## Normalizacion de componentes

No se debe resolver una nueva pantalla creando una variante visual aislada cuando ya existe un patron valido dentro de GaltekOne.

Familias que deben mantenerse normalizadas:

- Inputs, textareas, selects, autocompletados y buscadores.
- Checkboxes, radios, switches, chips, badges y tooltips.
- Botones primarios, secundarios, discretos, icon-only y destructivos.
- Tablas, paginadores, filtros y acciones por fila.
- Modales, drawers, popovers, menus y tabs.
- Tarjetas, paneles laterales, headers y footers de formulario.
- Skeletons, empty states, estados de error, toasts y feedback de guardado.

Para cada familia conservar:

- Altura, radio, padding, tipografia, tamano de icono y alineacion.
- Estados hover, focus, active, disabled, loading y error.
- Transiciones, labels, mensajes de validacion y posicion de acciones.
- Compatibilidad visual con componentes PrimeReact, MUI o Ant Design ya usados en el modulo, sin aceptar su apariencia nativa si rompe GaltekOne.

## Color, sombras y profundidad

- El verde institucional es el color operativo principal.
- Usar verde para foco, seleccion, accion principal y estados positivos.
- No abusar del verde hasta volver la pantalla monocromatica.
- Colores secundarios deben tener proposito: advertencia, error, informacion, exito o jerarquia.
- Mantener contraste suficiente y legibilidad en estados activos, deshabilitados y hover.
- Fondos y superficies deben separar niveles sin competir con el contenido.
- Sombras suaves indican jerarquia, elevacion o interaccion; no deben aplicarse intensamente a todos los componentes.
- Bordes deben ser sutiles y consistentes.
- Overlays deben oscurecer lo suficiente sin sentirse pesados.
- Reutilizar variables CSS, tokens o patrones existentes para colores, radios, sombras, espaciados, alturas, duraciones, capas y z-index cuando sea razonable.
- No crear un design system nuevo sin decision explicita; consolidar y reutilizar lo existente.

## Movimiento y microinteracciones

- Las animaciones deben comunicar cambio de estado.
- Deben ayudar a entender que aparecio, desaparecio o cambio.
- No deben retrasar la operacion ni sentirse decorativas.
- Hover, focus, apertura, cierre, seleccion y guardado deben responder de forma inmediata y suave.
- Skeletons deben mantener la estructura esperada.
- Modales y drawers deben abrir y cerrar con transiciones cortas.
- No animar propiedades que provoquen saltos de layout innecesarios.
- Respetar preferencias de reduccion de movimiento cuando aplique.
- La interfaz debe sentirse viva, pero nunca lenta.

## Navegacion por teclado y velocidad operativa

GaltekOne debe poder usarse correctamente con teclado. No es solo accesibilidad: es productividad para un POS usado muchas horas.

Reglas obligatorias:

- `Tab` avanza siguiendo el orden visual y operativo correcto.
- `Shift + Tab` retrocede de manera predecible.
- `Enter` confirma o ejecuta la accion principal cuando sea seguro.
- `Espacio` activa botones, switches, radios y checkboxes cuando corresponda.
- `Escape` cierra modales, drawers, popovers y menus cuando sea seguro.
- Flechas navegan selects, listas, tabs, menus y controles compuestos.
- `Home` y `End` pueden usarse en listas largas cuando aporten velocidad.
- Atajos importantes deben ser visibles o descubribles.
- No crear atajos arbitrarios dificiles de recordar.
- No depender exclusivamente del mouse ni de drag and drop para funciones importantes.
- Toda pantalla nueva o modificada debe recorrerse, comprenderse y operarse rapido con teclado.

## Orden de tabulacion y foco visual

- El orden de tabulacion debe coincidir con la jerarquia visual y el flujo natural de la tarea.
- Priorizar campos operativos antes que acciones secundarias.
- No saltar entre paneles sin logica.
- Elementos ocultos, deshabilitados o decorativos no reciben foco.
- Evitar `tabIndex` positivos; corregir estructura semantica y DOM antes de forzar ordenes artificiales.
- El usuario debe poder anticipar cual sera el siguiente elemento.
- Revisar el orden en resoluciones distintas porque el layout puede reorganizarse.
- Todo elemento interactivo debe mostrar foco visible.
- El foco debe usar el verde institucional, ser perceptible y no modificar el tamano del componente.
- No eliminar `outline` sin reemplazo accesible.
- Hover y focus deben distinguirse.
- Usar `:focus-visible` cuando corresponda.
- Botones de icono deben tener tooltip y nombre accesible.

## Modales, drawers y popovers

- Al abrir, el foco debe ir al primer elemento util o al encabezado si primero debe leerse informacion.
- El foco debe permanecer dentro mientras el modal/drawer este abierto.
- No debe existir una trampa de foco que impida cerrar.
- `Escape` debe cerrar cuando sea seguro.
- Si hay cambios sin guardar, usar confirmacion disenada.
- Al cerrar, el foco debe regresar al elemento que abrio el modal.
- Header, cuerpo y footer deben estar claramente definidos.
- El footer debe mantenerse accesible en contenido largo; puede ser sticky cuando sea necesario.
- El orden entre contenido, cancelar y guardar debe ser consistente.
- El flujo completo debe poder completarse sin mouse.
- Popovers y menus no deben perder foco ni cerrarse de forma impredecible.

## Gramatica de superficies de GaltekOne

Regla oficial de interaccion:

- Pagina = modulo o espacio operativo principal.
- Drawer = contexto de trabajo de una entidad principal.
- Navegacion interna del drawer = profundizar dentro de ese contexto.
- Modal = accion puntual, critica, irreversible o breve.
- Toast o feedback inline = resultado de la operacion.

Reglas obligatorias:

- Solo debe existir un drawer fisico abierto.
- La profundidad logica vive dentro del drawer mediante pila o navegacion interna.
- El maximo permitido es `Pagina -> Drawer -> Modal puntual`.
- Nunca abrir drawer sobre drawer.
- Nunca usar mega-modal como sustituto de subpantalla.
- Navegar cambia el contenido del drawer.
- Actuar abre modal.
- Escape dentro del drawer retrocede un nivel; en el primer nivel cierra el drawer.
- Si hay cambios sin guardar, volver, cerrar, navegar o usar Escape debe pedir confirmacion disenada.
- Todos los drawers y modales deben usar el backdrop unificado del sistema.
- No acumular blur ni opacidad al navegar dentro del drawer.
- El foco debe entrar al titulo o primer campo util, restaurarse al origen al cerrar y conservarse tras guardar cuando sea razonable.

Tamanos semanticos:

- Drawer `detail`: lectura o detalle simple, aproximadamente 560 a 620 px.
- Drawer `form`: crear o editar entidad, aproximadamente 640 a 760 px.
- Drawer `workspace`: colecciones, historial, relaciones y subflujos, aproximadamente 820 a 1000 px.
- Modal `small`: confirmacion puntual.
- Modal `medium`: captura breve.
- Modal `large`: solo cuando el contenido puntual lo justifique, por ejemplo preview de archivo.

Ejemplo de navegacion esperada:

- `Proveedores -> Proveedor -> Activos prestados -> Nuevo activo` dentro de un solo Drawer Workspace.
- `Inventario -> Producto -> Lotes -> Nuevo lote` debe seguir el mismo patron cuando se implemente.

Ejemplos de modal correcto:

- Desactivar, archivar, eliminar, confirmar devolucion, marcar como danado, resolver incidencia o confirmar una operacion irreversible.

## Formularios

- El flujo debe llevar naturalmente desde el primer campo hasta Guardar.
- El primer campo logico debe recibir foco al abrir cuando sea seguro.
- `Enter` no debe ejecutar acciones destructivas accidentalmente.
- En textarea, `Enter` crea una nueva linea.
- Errores deben mostrarse junto al campo.
- Al fallar validacion, el foco debe ir al primer campo invalido.
- Mantener datos capturados si ocurre un error recuperable o de red.
- No perder foco despues de guardar parcialmente.
- Agrupar campos relacionados.
- Identificar opcionales sin ruido.
- Usar valores predeterminados seguros y utiles.
- No pedir informacion que el sistema ya conoce.
- Reutilizar datos de Tienda, usuario, empresa y sesion cuando corresponda.
- Debe existir salida clara si hay cambios sin guardar.

## Selects, autocompletados y buscadores

- Deben poder abrirse con teclado.
- Flechas cambian opcion activa.
- `Enter` selecciona.
- `Escape` cierra.
- El foco debe mantenerse estable.
- El usuario debe poder escribir inmediatamente en buscadores.
- No usar selects nativos visualmente inconsistentes si existe patron normalizado.
- Resultados deben mostrar claramente el elemento activo.
- Autocompletados deben conservar texto si no se selecciona opcion.
- El tabulador debe continuar al siguiente campo logico despues de seleccionar.
- Controles que consumen backend deben mostrar vacio, carga y error.

## Tablas

- Acciones importantes por fila deben ser accesibles con teclado.
- No obligar a recorrer demasiados iconos por cada fila; definir estrategia eficiente de foco.
- Si la fila es seleccionable, `Enter` o `Espacio` puede seleccionarla cuando sea apropiado.
- Botones de icono deben tener tooltip y nombre accesible.
- El foco no debe perderse despues de editar, guardar o refrescar.
- No generar scroll horizontal normal en resoluciones objetivo.
- Columnas, alturas y alineacion deben ser consistentes.
- Acciones deben conservar posicion predecible.
- Textos largos deben truncarse con acceso al contenido completo cuando sea necesario.
- Tabla, paginacion y acciones deben ser legibles con pocas y muchas filas.

## Drag and drop y reordenamiento

- Ninguna funcion importante puede depender exclusivamente de drag and drop.
- Si se permite arrastrar, tambien deben existir acciones de teclado para mover arriba, mover abajo, llevar al inicio y llevar al final cuando sea util.
- El elemento seleccionado debe mostrar foco y posicion.
- El reordenamiento debe dar feedback inmediato.
- No permitir que el usuario pierda el elemento activo despues del movimiento.

## Flujo rapido y super intuitivo

- La accion principal debe identificarse rapido.
- La jerarquia visual debe indicar el siguiente paso.
- Minimizar clics, pasos, ventanas y cambios de contexto.
- Opciones avanzadas no deben bloquear el flujo principal.
- Tareas frecuentes deben ser mas rapidas que tareas poco frecuentes.
- Acciones reversibles no deben generar confirmaciones excesivas.
- Acciones criticas, destructivas o financieras si deben confirmarse.
- Errores recuperables no deben reiniciar el flujo.
- El usuario debe poder volver al punto donde estaba.
- La pantalla debe entenderse sin manual.
- Textos de ayuda deben ser breves, claros y situacionales.
- Usuarios avanzados deben poder completar acciones repetitivas casi completamente con teclado.

Regla central: GaltekOne debe sentirse inmediato; la interfaz guia sin estorbar, responde sin retraso y reduce esfuerzo mental y fisico.

## Resoluciones de escritorio

Resoluciones prioritarias:

- 1366x768.
- 1440x900.
- 1600x900.
- 1920x1080.
- 2560x1440.

Reglas:

- No disenar solo para 1920x1080.
- En 1366x768 la accion principal debe permanecer disponible.
- No ocultar footers o botones importantes debajo del viewport.
- Evitar scroll anidado innecesario.
- Mantener densidad util.
- En monitores grandes no estirar contenido hasta perder legibilidad.
- Usar anchos maximos y columnas adaptativas.
- No desperdiciar espacio de forma excesiva.
- Mantener consistencia de alineacion entre resoluciones.
- Mobile no es prioridad, pero no dejar el layout completamente roto.

## Estados obligatorios de UI

Toda pantalla funcional debe contemplar:

- Carga inicial y skeleton cuando aplique.
- Estado vacio y sin resultados.
- Error de carga y reintento.
- Guardando, guardado y cambios sin guardar.
- Accion deshabilitada.
- Operacion exitosa.
- Error de validacion y error de backend.
- Contenido parcial.
- Texto largo.
- Datos minimos y datos abundantes.

No usar spinners genericos como unica solucion cuando un skeleton estructural sea mas adecuado.

## QA visual obligatorio

Antes de cerrar una tarea frontend, validar:

- La pantalla se ve premium y parte de GaltekOne.
- Evita apariencia de plantilla generica.
- Respeta verde institucional sin saturar.
- Colores tienen proposito.
- Sombras son suaves y coherentes.
- Radios, espaciados, alturas e iconos son consistentes.
- Inputs y selects tienen la misma altura.
- Botones tienen jerarquia clara.
- Acciones destructivas son discretas.
- No existe borde azul nativo.
- Foco verde es visible.
- Tablas estan alineadas y sin scroll lateral innecesario.
- Textos largos no rompen layout.
- Modales tienen header, cuerpo y footer.
- Drawers se sienten integrados.
- Existen skeletons, estados vacios, errores, reintento y feedback al guardar.
- Existe estado de cambios sin guardar cuando aplique.
- Se ve correctamente en 1366x768, 1920x1080 y 2560x1440.
- La accion principal es evidente.
- El flujo tiene la menor cantidad razonable de pasos.
- Animaciones son naturales y rapidas.
- La pantalla esta al nivel visual de Proveedores y Clientes, o queda marcado el pendiente real.

## QA de teclado obligatorio

1. Recorrer toda la pantalla unicamente con `Tab`.
2. Retroceder con `Shift + Tab`.
3. Confirmar que el orden coincide con el flujo visual.
4. Confirmar que el foco siempre es visible.
5. Confirmar que no aparece borde azul nativo.
6. Confirmar que elementos ocultos no reciben foco.
7. Confirmar que elementos deshabilitados no reciben foco.
8. Abrir modales solo con teclado.
9. Confirmar que el foco se mantiene dentro del modal.
10. Cerrar modales con `Escape`.
11. Confirmar que el foco regresa al elemento de origen.
12. Operar selects con flechas y `Enter`.
13. Operar menus y tabs con teclado.
14. Activar switches, radios y checkboxes con teclado.
15. Completar formularios sin mouse.
16. Provocar validaciones.
17. Confirmar que el foco llega al primer campo invalido.
18. Confirmar que `Enter` no ejecuta acciones peligrosas accidentalmente.
19. Confirmar que textarea conserva nueva linea.
20. Operar acciones importantes de tablas con teclado.
21. Confirmar que no existen trampas de foco.
22. Confirmar que no se pierde el foco despues de guardar.
23. Confirmar que no se pierde el foco despues de refrescar.
24. Confirmar que drag and drop tiene alternativa.
25. Completar el flujo principal sin mouse.
26. Medir si hay pasos o clics innecesarios.
27. Confirmar funcionamiento en 1366x768.
28. Confirmar que no se genera scroll horizontal.
29. Confirmar que atajos visibles coinciden con comportamiento.
30. Confirmar que el flujo es rapido y predecible.

## Reglas de datos

- Revisar entidades y scripts SQL antes de cambiar persistencia.
- Cuidar relaciones con `idEmpresa`.
- Cuidar estatus logico versus eliminacion fisica.
- No asumir que todos los campos son globales; muchos flujos son por empresa.
- Validar fechas con SQLite y MySQL.
- Evitar cambios que generen incompatibilidad entre desktop local y produccion.

## Reglas por modulo

Clientes:

- Leer `CLI-ARQ-001.md` antes de tocar clientes.
- Mantener detalle, filtros, acciones de estado y eliminacion segura.
- Cuidar campos fiscales y comerciales porque soportan facturacion futura.

Proveedores:

- Leer `PRV-ARQ-001.md` antes de tocar proveedores.
- Mantener contactos, productos, activos, documentos, historial y eliminacion segura.
- No promover estructuras legacy sin revisar el frontend actual.

Configuracion:

- Leer `CFG-ARQ-001.md` y sus notas de alineacion.
- Tienda, ticket, usuarios, roles y overrides ya tienen conexion real parcial.
- No tratar todos los tiles como placeholders.

Ventas:

- Antes de cambiar ventas, verificar si el frontend ya persiste la venta real.
- Backend tiene endpoint de creacion y descuento de stock por lotes.
- No romper impresion de ticket ni metodos de pago.

Caja:

- Leer `VTA-ARQ-001.md` antes de tocar caja, ventas, pagos, cierre, ticket o movimientos de dinero.
- Mantener `LocalDevice` como estacion/computadora, `SaldoEfectivo` como saldo continuo de efectivo y `CajaSesion` como turno financiero.
- No volver a depender de `CajasEntity`, `cashRegisterId` o `idCaja` como fuente de verdad del flujo operativo nuevo.
- La apertura limpia no crea movimiento `OPENING`; solo guarda snapshot heredado. Si se reporta diferencia de apertura, debe quedar incidencia y conciliacion auditable.
- No esconder diferencias de caja: cierre, relevo, apertura reportada y resolucion de incidencias deben conservar trazabilidad.
- Movimientos electronicos/tarjeta deben registrarse para auditoria, pero no deben modificar `SaldoEfectivo`.
- Historial de caja debe consultarse por cortes/sesiones con paginacion, filtros por fecha-hora y medio; no cargar miles de movimientos al abrir la pantalla.
- Resolver incidencias debe declarar su efecto de caja: recuento historico, recuperacion externa, devolucion externa, reporte sin cambio, entrada o salida manual.
- No ajustar saldos historicos de dias anteriores como si fueran saldo actual sin movimiento de conciliacion o incidencia que explique el ajuste.
- La pantalla de caja debe conservar densidad operativa, controles normalizados, foco verde y paginacion alineada con Usuarios/Roles.

Compras:

- Distinguir historial conectado de alta de compra aun parcial.
- No asumir que la pantalla de nueva compra persiste todo.

Inventario:

- Cuidar productos, lotes, almacen, unidades, estados y umbrales.
- Validar impacto en ventas y compras.

Reportes:

- Distinguir datos reales de filtros/exports temporales.
- No presentar exportaciones como completas si solo muestran toast.

## Reglas de documentacion

- Actualizar `MODULES_STATUS.md` cuando cambie el estado real de un modulo.
- Actualizar `PROJECT_HISTORY.md` cuando haya hitos importantes.
- Actualizar `AI_CONTEXT.md` cuando cambie arquitectura, stack, despliegue o decision estrategica.
- Agregar notas `pendiente de alinear` si se detecta diferencia entre docs y codigo.
- No borrar secciones antiguas utiles sin dejar contexto.

## Protocolo de evidencia y validacion

Niveles de verificacion que deben reportarse sin mezclarlos:

- Revisado en documentacion.
- Revisado en codigo.
- Build o compilacion verificada.
- Verificado funcionalmente en runtime.
- Verificado visualmente en runtime.
- Verificado con teclado en runtime.
- No verificado.

Reglas:

- No declarar una pantalla "perfecta", "pulida", "completa" o "validada" basandose solo en lectura de codigo.
- Un build exitoso no demuestra calidad visual ni navegacion por teclado.
- Para declarar QA visual, abrir y recorrer las pantallas en ejecucion.
- Para declarar QA de teclado, completar el flujo principal sin mouse.
- Si no se pudo ejecutar la aplicacion, indicar expresamente que quedo sin verificar.
- Diferenciar observaciones de codigo de resultados observados en runtime.
- No inventar resoluciones probadas.
- No inventar comportamiento de impresoras, Tauri, modales o componentes.

En la respuesta final de una tarea frontend, Codex debe reportar:

- Documentacion revisada: si/no.
- Codigo revisado: si/no.
- Build ejecutado: si/no y resultado.
- Runtime ejecutado: si/no.
- Resoluciones verificadas realmente.
- Flujo con teclado verificado: si/no.
- Pendientes no comprobados.

## Verificacion minima

Para cambios de documentacion:

- Revisar `git diff --check`.
- Revisar que los archivos editados esten en `galtek-one-back/docs/`.

Para cambios de backend:

- Ejecutar pruebas disponibles si existen.
- Compilar Maven cuando el cambio toque codigo Java o dependencias.
- Probar endpoint o flujo critico si aplica.

Para cambios de frontend:

- Ejecutar build/lint disponible si el cambio toca codigo React.
- Revisar resoluciones desktop objetivo para cambios visuales importantes.
- Ejecutar o documentar el `QA visual obligatorio`.
- Ejecutar o documentar el `QA de teclado obligatorio`.
- Probar rutas y acciones afectadas.

Para cambios desktop:

- Revisar Tauri config.
- Validar backend local, frontendDist y recursos empaquetados.
- Probar arranque si el cambio afecta puerto, paths o bundle.
