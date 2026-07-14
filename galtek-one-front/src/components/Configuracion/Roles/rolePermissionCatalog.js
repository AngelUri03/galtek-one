const RISK = {
  CONSULTA: "Consulta",
  OPERACION: "Operacion",
  CRITICO: "Critico",
  DESTRUCTIVO: "Destructivo",
};

const catalog = {
  VENTAS_VER: ["VENTAS", "VER", "Ver ventas", "Consultar pantalla e historial de ventas.", RISK.CONSULTA],
  VENTAS_CREAR: ["VENTAS", "CREAR", "Crear ventas", "Registrar ventas y pagos.", RISK.OPERACION],
  VENTAS_APLICAR_DESCUENTO: ["VENTAS", "DESCUENTO", "Aplicar descuentos", "Autorizar descuentos durante la venta.", RISK.CRITICO],
  VENTAS_CAMBIAR_PRECIO: ["VENTAS", "PRECIO_EDITAR", "Cambiar precio", "Modificar precio manualmente durante la venta.", RISK.CRITICO],
  VENTAS_CANCELAR: ["VENTAS", "CANCELAR", "Cancelar ventas", "Cancelar ventas y afectar caja e inventario.", RISK.DESTRUCTIVO],
  VENTAS_DEVOLUCION: ["VENTAS", "DEVOLUCION", "Procesar devoluciones", "Registrar devoluciones de productos vendidos.", RISK.CRITICO],
  VENTAS_REIMPRIMIR_TICKET: ["VENTAS", "REIMPRIMIR_TICKET", "Reimprimir ticket", "Reimprimir comprobantes de venta.", RISK.OPERACION],
  VENTAS_VER_HISTORIAL: ["VENTAS", "VER", "Ver historial de ventas", "Consultar ventas anteriores.", RISK.CONSULTA],
  VENTAS_SELECCIONAR_CLIENTE: ["VENTAS", "CLIENTE", "Seleccionar cliente", "Asignar cliente a una venta.", RISK.OPERACION],

  CAJA_VER: ["CAJA", "VER", "Ver caja", "Consultar balance y movimientos de caja.", RISK.CONSULTA],
  CAJA_ABRIR: ["CAJA", "ABRIR", "Abrir caja", "Iniciar caja operativa.", RISK.OPERACION],
  CAJA_CERRAR_PROPIA: ["CAJA", "CERRAR", "Cerrar caja propia", "Cerrar la caja del usuario actual.", RISK.OPERACION],
  CAJA_CERRAR_AJENA: ["CAJA", "CERRAR", "Cerrar caja ajena", "Cerrar caja operada por otro usuario.", RISK.CRITICO],
  CAJA_ENTRADA_EFECTIVO: ["CAJA", "ENTRADA", "Entrada de efectivo", "Registrar ingresos manuales de efectivo.", RISK.CRITICO],
  CAJA_RETIRO_EFECTIVO: ["CAJA", "RETIRO", "Retiro de efectivo", "Registrar retiros manuales de efectivo.", RISK.CRITICO],
  CAJA_VER_ARQUEO: ["CAJA", "ARQUEO", "Ver arqueo", "Consultar conteos y diferencias de caja.", RISK.CRITICO],
  CAJA_AJUSTAR_DIFERENCIA: ["CAJA", "AJUSTAR", "Ajustar diferencia", "Corregir diferencias de arqueo.", RISK.DESTRUCTIVO],
  CAJA_MOVIMIENTOS: ["CAJA", "EDITAR", "Movimientos de caja", "Registrar ingresos y egresos manuales.", RISK.CRITICO],

  INVENTARIO_VER: ["INVENTARIO", "VER", "Ver inventario", "Consultar existencias, lotes y alertas.", RISK.CONSULTA],
  INVENTARIO_EDITAR: ["INVENTARIO", "EDITAR", "Editar inventario", "Crear productos y ajustar stock.", RISK.CRITICO],
  INVENTARIO_CREAR_PRODUCTO: ["INVENTARIO", "CREAR", "Crear producto", "Dar de alta productos en inventario.", RISK.OPERACION],
  INVENTARIO_EDITAR_PRODUCTO: ["INVENTARIO", "EDITAR", "Editar producto", "Modificar datos generales de productos.", RISK.OPERACION],
  INVENTARIO_EDITAR_PRECIO: ["INVENTARIO", "PRECIO_EDITAR", "Editar precio", "Modificar precios de venta.", RISK.CRITICO],
  INVENTARIO_VER_COSTOS: ["INVENTARIO", "COSTO_VER", "Ver costos", "Consultar costos y margen base.", RISK.CRITICO],
  INVENTARIO_AJUSTE_STOCK: ["INVENTARIO", "AJUSTAR", "Ajustar stock", "Corregir existencias manualmente.", RISK.CRITICO],
  INVENTARIO_AJUSTE_POSITIVO: ["INVENTARIO", "AJUSTAR", "Ajuste positivo", "Aumentar existencias manualmente.", RISK.CRITICO],
  INVENTARIO_AJUSTE_NEGATIVO: ["INVENTARIO", "AJUSTAR", "Ajuste negativo", "Disminuir existencias manualmente.", RISK.DESTRUCTIVO],
  INVENTARIO_ARCHIVAR_PRODUCTO: ["INVENTARIO", "ARCHIVAR", "Archivar producto", "Ocultar producto sin borrar historial.", RISK.CRITICO],
  INVENTARIO_ELIMINAR_SIN_USO: ["INVENTARIO", "ELIMINAR", "Eliminar producto sin uso", "Eliminar productos sin movimientos.", RISK.DESTRUCTIVO],
  INVENTARIO_IMPORTAR: ["INVENTARIO", "IMPORTAR", "Importar inventario", "Cargar datos masivos de productos.", RISK.CRITICO],
  INVENTARIO_EXPORTAR: ["INVENTARIO", "EXPORTAR", "Exportar inventario", "Exportar datos de inventario.", RISK.CRITICO],

  COMPRAS_VER: ["COMPRAS", "VER", "Ver compras", "Consultar compras y proveedores.", RISK.CONSULTA],
  COMPRAS_CREAR: ["COMPRAS", "CREAR", "Crear compras", "Registrar compras y costos.", RISK.OPERACION],
  COMPRAS_CONFIRMAR: ["COMPRAS", "CONFIRMAR", "Confirmar compras", "Confirmar recepcion y afectar inventario.", RISK.CRITICO],
  COMPRAS_CANCELAR: ["COMPRAS", "CANCELAR", "Cancelar compras", "Cancelar compras registradas.", RISK.DESTRUCTIVO],
  COMPRAS_DEVOLVER: ["COMPRAS", "DEVOLUCION", "Devolver compra", "Registrar devoluciones a proveedores.", RISK.CRITICO],
  COMPRAS_VER_COSTOS: ["COMPRAS", "COSTO_VER", "Ver costos de compra", "Consultar costos dentro de compras.", RISK.CRITICO],
  COMPRAS_GESTIONAR_PAGO: ["COMPRAS", "PAGO", "Gestionar pagos", "Administrar pagos a proveedores.", RISK.CRITICO],
  COMPRAS_ALTA_RAPIDA_PRODUCTO: ["COMPRAS", "CREAR", "Alta rapida de producto", "Crear productos desde compras.", RISK.OPERACION],
  COMPRAS_ALTA_RAPIDA_PROVEEDOR: ["COMPRAS", "CREAR", "Alta rapida de proveedor", "Crear proveedores desde compras.", RISK.OPERACION],

  PROVEEDORES_VER: ["PROVEEDORES", "VER", "Ver proveedores", "Consultar directorio de proveedores.", RISK.CONSULTA],
  PROVEEDORES_CREAR_EDITAR: ["PROVEEDORES", "EDITAR", "Crear y editar proveedores", "Modificar datos de proveedores.", RISK.OPERACION],
  PROVEEDORES_PRODUCTOS: ["PROVEEDORES", "PRODUCTOS", "Gestionar productos", "Relacionar productos con proveedores.", RISK.OPERACION],
  PROVEEDORES_ACTIVOS: ["PROVEEDORES", "ACTIVOS", "Gestionar activos", "Activar o desactivar proveedores.", RISK.CRITICO],
  PROVEEDORES_DOCUMENTOS: ["PROVEEDORES", "DOCUMENTOS", "Documentos de proveedores", "Administrar documentos asociados.", RISK.CRITICO],
  PROVEEDORES_VER_AUDITORIA: ["PROVEEDORES", "AUDITORIA", "Ver auditoria", "Consultar historial de cambios.", RISK.CONSULTA],
  PROVEEDORES_ARCHIVAR: ["PROVEEDORES", "ARCHIVAR", "Archivar proveedor", "Sacar proveedor de operacion sin borrar historial.", RISK.CRITICO],
  PROVEEDORES_ELIMINAR_SEGURO: ["PROVEEDORES", "ELIMINAR", "Eliminar proveedor seguro", "Eliminar solo si no rompe historial.", RISK.DESTRUCTIVO],

  CLIENTES_VER: ["CLIENTES", "VER", "Ver clientes", "Consultar directorio de clientes.", RISK.CONSULTA],
  CLIENTES_EDITAR: ["CLIENTES", "EDITAR", "Editar clientes", "Crear y editar clientes.", RISK.OPERACION],
  CLIENTES_CREAR_EDITAR: ["CLIENTES", "EDITAR", "Crear y editar clientes", "Modificar datos generales de clientes.", RISK.OPERACION],
  CLIENTES_VER_FISCALES: ["CLIENTES", "FISCALES", "Ver fiscales", "Consultar datos fiscales de clientes.", RISK.CRITICO],
  CLIENTES_EDITAR_FISCALES: ["CLIENTES", "FISCALES", "Editar fiscales", "Modificar datos fiscales de clientes.", RISK.CRITICO],
  CLIENTES_VER_COMPRAS: ["CLIENTES", "HISTORIAL", "Ver compras del cliente", "Consultar historial de compras del cliente.", RISK.CONSULTA],
  CLIENTES_ARCHIVAR: ["CLIENTES", "ARCHIVAR", "Archivar cliente", "Sacar cliente de operacion sin borrar historial.", RISK.CRITICO],
  CLIENTES_ELIMINAR_SEGURO: ["CLIENTES", "ELIMINAR", "Eliminar cliente seguro", "Eliminar solo si no rompe historial.", RISK.DESTRUCTIVO],

  REPORTES_VER: ["REPORTES", "VER", "Ver reportes", "Consultar reportes financieros.", RISK.CONSULTA],
  REPORTES_VENTAS: ["REPORTES", "VENTAS", "Reportes de ventas", "Consultar reportes de ventas.", RISK.CONSULTA],
  REPORTES_COMPRAS: ["REPORTES", "COMPRAS", "Reportes de compras", "Consultar reportes de compras.", RISK.CONSULTA],
  REPORTES_BALANCE: ["REPORTES", "BALANCE", "Balance operativo", "Consultar balance general.", RISK.CRITICO],
  REPORTES_VER_UTILIDAD: ["REPORTES", "UTILIDAD", "Ver utilidad", "Consultar utilidad y margen.", RISK.CRITICO],
  REPORTES_EXPORTAR: ["REPORTES", "EXPORTAR", "Exportar reportes", "Exportar informacion de reportes.", RISK.CRITICO],

  CONFIG_VER: ["CONFIGURACION", "VER", "Ver configuracion", "Consultar ajustes del sistema.", RISK.CONSULTA],
  CONFIG_TIENDA: ["CONFIGURACION", "EDITAR", "Configurar tienda", "Configurar tienda, cajas y parametros.", RISK.CRITICO],
  CONFIG_TIENDA_EDITAR: ["CONFIGURACION", "EDITAR", "Editar tienda", "Modificar datos operativos de la tienda.", RISK.CRITICO],
  CONFIG_USUARIOS: ["CONFIGURACION", "ADMIN", "Administrar usuarios", "Administrar usuarios, roles y permisos.", RISK.CRITICO],
  CONFIG_USUARIOS_VER: ["CONFIGURACION", "VER", "Ver usuarios", "Consultar usuarios del sistema.", RISK.CONSULTA],
  CONFIG_USUARIOS_GESTIONAR: ["CONFIGURACION", "USUARIOS", "Gestionar usuarios", "Crear, editar o desactivar usuarios.", RISK.CRITICO],
  CONFIG_USUARIOS_PASSWORD: ["CONFIGURACION", "RESET_PASSWORD", "Restablecer password", "Generar password temporal para usuarios.", RISK.CRITICO],
  CONFIG_ROLES_VER: ["CONFIGURACION", "VER", "Ver roles", "Consultar roles y permisos asignados.", RISK.CONSULTA],
  CONFIG_ROLES_GESTIONAR: ["CONFIGURACION", "ROLES", "Gestionar roles", "Crear, editar o desactivar roles.", RISK.CRITICO],
  CONFIG_ROLES_PERMISOS: ["CONFIGURACION", "ROLES", "Gestionar permisos de roles", "Asignar permisos existentes a roles.", RISK.CRITICO],
  CONFIG_OVERRIDES_GESTIONAR: ["CONFIGURACION", "OVERRIDES", "Gestionar overrides", "Autorizar permisos especiales por usuario.", RISK.CRITICO],
  CONFIG_CAJA_EDITAR: ["CONFIGURACION", "EDITAR", "Editar caja", "Modificar reglas de caja.", RISK.CRITICO],
  CONFIG_PAGOS_EDITAR: ["CONFIGURACION", "EDITAR", "Editar pagos", "Modificar metodos de pago y terminal.", RISK.CRITICO],
  CONFIG_TICKET_EDITAR: ["CONFIGURACION", "EDITAR", "Editar ticket", "Modificar formato de ticket.", RISK.CRITICO],
  CONFIG_INVENTARIO_EDITAR: ["CONFIGURACION", "EDITAR", "Editar reglas de inventario", "Modificar configuracion de inventario.", RISK.CRITICO],
  CONFIG_COMPRAS_EDITAR: ["CONFIGURACION", "EDITAR", "Editar reglas de compras", "Modificar configuracion de compras.", RISK.CRITICO],
  CONFIG_CLIENTES_EDITAR: ["CONFIGURACION", "EDITAR", "Editar reglas de clientes", "Modificar configuracion de clientes.", RISK.CRITICO],
  CONFIG_PROVEEDORES_EDITAR: ["CONFIGURACION", "EDITAR", "Editar reglas de proveedores", "Modificar configuracion de proveedores.", RISK.CRITICO],
  CONFIG_RESPALDOS: ["CONFIGURACION", "RESPALDO", "Gestionar respaldos", "Generar y borrar respaldos.", RISK.CRITICO],
  CONFIG_RESTAURAR_RESPALDO: ["CONFIGURACION", "RESTAURAR", "Restaurar respaldo", "Restaurar informacion desde respaldo.", RISK.DESTRUCTIVO],
  CONFIG_AUDITORIA_VER: ["CONFIGURACION", "AUDITORIA", "Ver auditoria", "Consultar bitacora de acciones.", RISK.CONSULTA],

  FACTURACION_VER_DATOS: ["FACTURACION", "VER", "Ver datos fiscales", "Consultar datos de facturacion.", RISK.CONSULTA],
  FACTURACION_EDITAR_DATOS: ["FACTURACION", "EDITAR", "Editar datos fiscales", "Modificar datos de facturacion.", RISK.CRITICO],
  FACTURACION_EXPORTAR_INFO: ["FACTURACION", "EXPORTAR", "Exportar informacion fiscal", "Exportar datos fiscales.", RISK.CRITICO],
};

export const PERMISSION_CATALOG = Object.fromEntries(
  Object.entries(catalog).map(([key, [modulo, accion, nombre, descripcion, riesgo]]) => [
    key,
    { modulo, accion, nombre, descripcion, riesgo },
  ])
);

export const PERMISSION_RISK_LABELS = {
  CONSULTA: RISK.CONSULTA,
  OPERACION: RISK.OPERACION,
  CRITICO: RISK.CRITICO,
  DESTRUCTIVO: RISK.DESTRUCTIVO,
};

function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[-:.]+/g, "_")
    .toUpperCase();
}

export function permissionCatalogEntry(permission) {
  return PERMISSION_CATALOG[normalizeKey(permission?.clave)] || null;
}

export function enrichPermissionMetadata(permission) {
  const entry = permissionCatalogEntry(permission);
  if (!entry) {
    return {
      ...permission,
      riesgo: inferRisk(permission),
    };
  }

  return {
    ...permission,
    nombre: entry.nombre || permission.nombre,
    descripcion: entry.descripcion || permission.descripcion,
    modulo: entry.modulo || permission.modulo,
    accion: entry.accion || permission.accion,
    riesgo: entry.riesgo || inferRisk(permission),
  };
}

export function permissionRisk(permission) {
  return permission?.riesgo || permissionCatalogEntry(permission)?.riesgo || inferRisk(permission);
}

export function permissionRiskKey(permission) {
  const risk = permissionRisk(permission);
  if (risk === RISK.DESTRUCTIVO) return "DESTRUCTIVO";
  if (risk === RISK.CRITICO) return "CRITICO";
  if (risk === RISK.OPERACION) return "OPERACION";
  return "CONSULTA";
}

export function isSensitivePermission(permission) {
  const risk = permissionRiskKey(permission);
  return risk === "CRITICO" || risk === "DESTRUCTIVO";
}

function inferRisk(permission) {
  const key = normalizeKey(permission?.clave);
  const module = normalizeKey(permission?.modulo);
  const action = normalizeKey(permission?.accion);

  if (
    key.includes("ELIMINAR") ||
    key.includes("RESTAURAR") ||
    key.includes("CANCELAR") ||
    action.includes("ELIMINAR") ||
    action.includes("CANCELAR")
  ) {
    return RISK.DESTRUCTIVO;
  }

  if (
    module === "CONFIGURACION" ||
    module === "CAJA" ||
    key.includes("CONFIG") ||
    key.includes("ROLES") ||
    key.includes("USUARIOS") ||
    key.includes("PASSWORD") ||
    key.includes("COSTO") ||
    key.includes("UTILIDAD") ||
    key.includes("AJUST")
  ) {
    return RISK.CRITICO;
  }

  if (action.includes("VER") || key.endsWith("_VER")) return RISK.CONSULTA;
  return RISK.OPERACION;
}
