import {
  enrichPermissionMetadata,
  isSensitivePermission,
  permissionRisk,
  permissionRiskKey,
} from "./rolePermissionCatalog";

export const ROLE_STATUS_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Activos", value: "ACTIVOS" },
  { label: "Inactivos", value: "INACTIVOS" },
];

export const ROLE_TYPE_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Protegidos", value: "PROTEGIDOS" },
  { label: "Editables", value: "EDITABLES" },
];

export const ROLE_ROW_OPTIONS = [5, 10, 15];

export const MODULE_ICON = {
  AUDITORIA: "pi pi-shield",
  CAJA: "pi pi-wallet",
  CATEGORIAS: "pi pi-tags",
  CLIENTES: "pi pi-users",
  COMPRAS: "pi pi-shopping-cart",
  CONFIGURACION: "pi pi-cog",
  FACTURACION: "pi pi-receipt",
  GRAFICAS: "pi pi-chart-line",
  INVENTARIO: "pi pi-box",
  PRODUCTOS: "pi pi-qrcode",
  PROVEEDORES: "pi pi-truck",
  REPORTES: "pi pi-file",
  ROLES: "pi pi-sitemap",
  TIENDA: "pi pi-shop",
  UNIDADES: "pi pi-sliders-h",
  USUARIOS: "pi pi-user",
  VENTAS: "pi pi-dollar",
};

export const ACTION_ICON = {
  ABRIR: "pi pi-folder-open",
  AJUSTAR: "pi pi-sliders-h",
  ARCHIVAR: "pi pi-folder",
  ARQUEO: "pi pi-calculator",
  CANCELAR: "pi pi-times-circle",
  CERRAR: "pi pi-lock",
  CLIENTE: "pi pi-user-plus",
  COBRAR: "pi pi-credit-card",
  COMPRAS: "pi pi-shopping-cart",
  CONFIRMAR: "pi pi-check-circle",
  COSTO_EDITAR: "pi pi-pencil",
  COSTO_VER: "pi pi-eye",
  CREAR: "pi pi-plus-circle",
  DESCUENTO: "pi pi-percentage",
  DOCUMENTOS: "pi pi-file",
  DEVOLUCION: "pi pi-replay",
  EDITAR: "pi pi-pencil",
  ELIMINAR: "pi pi-trash",
  ENTRADA: "pi pi-arrow-down",
  EXPORTAR: "pi pi-upload",
  FISCALES: "pi pi-id-card",
  HISTORIAL: "pi pi-history",
  IMPORTAR: "pi pi-download",
  IMPRIMIR_TICKET: "pi pi-print",
  KARDEX: "pi pi-book",
  MOVIMIENTOS: "pi pi-arrows-v",
  OVERRIDES: "pi pi-user-edit",
  PAGO: "pi pi-credit-card",
  PRECIO_EDITAR: "pi pi-pencil",
  PRECIO_MANUAL: "pi pi-dollar",
  PRODUCTOS: "pi pi-box",
  REIMPRIMIR_TICKET: "pi pi-print",
  RESPALDO: "pi pi-download",
  RESTAURAR: "pi pi-refresh",
  RETIRO: "pi pi-arrow-up",
  ROLES: "pi pi-sitemap",
  RESET_PASSWORD: "pi pi-key",
  UTILIDAD: "pi pi-chart-line",
  VER: "pi pi-eye",
  VENTAS: "pi pi-dollar",
};

export function safeTrim(value) {
  return String(value ?? "").trim();
}

export function normalizeRoleName(value) {
  return safeTrim(value).replace(/\s+/g, " ");
}

export async function readPayload(response, fallback) {
  if (!response) throw new Error("No se pudo contactar al servidor.");
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        payload?.detail ||
        fallback ||
        "Solicitud rechazada."
    );
  }
  return payload?.data ?? payload;
}

export function normalizePermiso(permission, catalogMap = new Map()) {
  const idPermiso = permission?.idPermiso ?? permission?.id_permiso ?? permission?.id;
  const catalog = idPermiso != null ? catalogMap.get(Number(idPermiso)) : null;
  const clave = permission?.clave ?? permission?.clavePermiso ?? catalog?.clave ?? "";
  const inferredModule = String(clave || "GENERAL").split(/[_:.]/)[0] || "GENERAL";

  const normalized = {
    idPermiso: idPermiso != null ? Number(idPermiso) : null,
    clave,
    nombre:
      permission?.nombre ??
      permission?.nombrePermiso ??
      permission?.name ??
      catalog?.nombre ??
      clave,
    descripcion: permission?.descripcion ?? catalog?.descripcion ?? "",
    modulo: String(permission?.modulo ?? catalog?.modulo ?? inferredModule).toUpperCase(),
    accion: String(permission?.accion ?? catalog?.accion ?? "").toUpperCase(),
  };

  return enrichPermissionMetadata(normalized);
}

export function normalizeRole(role, catalogMap = new Map()) {
  const permisos = Array.isArray(role?.permisos)
    ? role.permisos.map((item) => normalizePermiso(item, catalogMap))
    : [];

  const normalized = {
    idRol: role?.idRol ?? role?.id_rol ?? role?.id ?? null,
    nombreRol: role?.nombreRol ?? role?.nombre ?? role?.rol ?? "",
    activo: role?.estatus !== false && role?.activo !== false,
    idEmpresa: role?.idEmpresa ?? role?.id_empresa ?? null,
    protegido: role?.protegido === true,
    permisos,
    raw: role,
  };

  return {
    ...normalized,
    protegido: normalized.protegido || isProtectedRole(normalized),
  };
}

export function createEmptyRoleEditor() {
  return {
    idRol: null,
    nombreRol: "",
    activo: true,
  };
}

export function roleSnapshot(editor) {
  return JSON.stringify({
    idRol: editor?.idRol ?? null,
    nombreRol: normalizeRoleName(editor?.nombreRol),
    activo: editor?.activo !== false,
  });
}

export function permissionsSnapshot(permissionIds) {
  return JSON.stringify(
    Array.from(permissionIds || [])
      .map(Number)
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b)
  );
}

export function groupPermissions(permisos = []) {
  const map = permisos.reduce((acc, permiso) => {
    const key = permiso?.modulo || "GENERAL";
    if (!acc[key]) acc[key] = [];
    acc[key].push(permiso);
    return acc;
  }, {});

  return Object.keys(map)
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((module) => ({
      module,
      icon: MODULE_ICON[module] || "pi pi-folder",
      items: map[module].sort((a, b) =>
        String(a.nombre || a.clave || "").localeCompare(String(b.nombre || b.clave || ""), "es")
      ),
    }));
}

export function moduleOptionsFromPermissions(permisos = []) {
  const modules = Array.from(new Set(permisos.map((permiso) => permiso.modulo || "GENERAL"))).sort(
    (a, b) => a.localeCompare(b, "es")
  );

  return [
    { label: "Todos", value: "TODOS" },
    ...modules.map((module) => ({ label: module, value: module })),
  ];
}

export function moduleNamesFromRole(role) {
  return Array.from(new Set((role?.permisos || []).map((permiso) => permiso.modulo || "GENERAL"))).sort(
    (a, b) => a.localeCompare(b, "es")
  );
}

export function rolePermissionIds(role) {
  return new Set(
    (role?.permisos || [])
      .map((permiso) => Number(permiso.idPermiso))
      .filter((value) => Number.isFinite(value))
  );
}

export function normalizeRoleKey(value) {
  return safeTrim(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function isProtectedRole(role) {
  const key = normalizeRoleKey(role?.nombreRol);
  return role?.protegido === true || key === "ADMINISTRADOR" || key === "ADMIN";
}

export function hasModuleAccess(role, moduleName) {
  const module = String(moduleName || "").toUpperCase();
  if (!module) return false;
  return (role?.permisos || []).some((permiso) => {
    const currentModule = String(permiso?.modulo || "").toUpperCase();
    const clave = String(permiso?.clave || "").toUpperCase();
    if (module === "CAJA") {
      return currentModule === "CAJA" || clave.includes("CAJA") || permiso?.accion === "COBRAR";
    }
    return currentModule === module || clave.includes(module);
  });
}

export function roleSearchText(role) {
  const modules = moduleNamesFromRole(role).join(" ");
  return [
    role?.nombreRol,
    role?.activo ? "activo" : "inactivo",
    modules,
    ...(role?.permisos || []).map((permiso) =>
      [permiso?.nombre, permiso?.clave, permiso?.descripcion, permiso?.modulo, permiso?.accion].join(" ")
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function validateRoleEditor(editor, roles = []) {
  const nombreRol = normalizeRoleName(editor?.nombreRol);
  if (!nombreRol) return { message: "Escribe el nombre del rol." };
  if (nombreRol.length < 3) return { message: "El nombre del rol debe tener al menos 3 caracteres." };
  if (!editor?.idRol && isProtectedRole({ nombreRol })) {
    return { message: "El rol Administrador ya es un rol protegido del sistema." };
  }

  const duplicated = roles.some((role) => {
    if (!role?.nombreRol) return false;
    if (editor?.idRol && Number(role.idRol) === Number(editor.idRol)) return false;
    return normalizeRoleName(role.nombreRol).toLowerCase() === nombreRol.toLowerCase();
  });

  if (duplicated) return { message: "Ya existe un rol con ese nombre." };

  return {
    nombreRol,
    estatus: editor?.activo !== false,
  };
}

export function filterRoles(roles, search, filters) {
  const query = safeTrim(search).toLowerCase();

  return roles.filter((role) => {
    const matchesSearch = !query || roleSearchText(role).includes(query);
    const matchesStatus =
      filters.estado === "TODOS" ||
      (filters.estado === "ACTIVOS" && role.activo) ||
      (filters.estado === "INACTIVOS" && !role.activo);
    const matchesType =
      filters.tipo === "TODOS" ||
      (filters.tipo === "PROTEGIDOS" && isProtectedRole(role)) ||
      (filters.tipo === "EDITABLES" && !isProtectedRole(role));
    const matchesModule =
      filters.modulo === "TODOS" ||
      (role?.permisos || []).some((permiso) => permiso.modulo === filters.modulo);

    return matchesSearch && matchesStatus && matchesType && matchesModule;
  });
}

export function summarizeRoles(roles, permisos) {
  return {
    total: roles.length,
    activos: roles.filter((role) => role.activo).length,
    inactivos: roles.filter((role) => !role.activo).length,
    protegidos: roles.filter((role) => isProtectedRole(role)).length,
    permisos: permisos.length,
  };
}

export function describeRoleModules(role, limit = 3) {
  const modules = moduleNamesFromRole(role);
  if (!modules.length) return "Sin modulos";
  if (modules.length <= limit) return modules.join(", ");
  return `${modules.slice(0, limit).join(", ")} +${modules.length - limit}`;
}

export function actionIcon(permission) {
  const action = String(permission?.accion || "").toUpperCase();
  return ACTION_ICON[action] || "pi pi-lock";
}

export function isCriticalPermission(permission) {
  const module = normalizeRoleKey(permission?.modulo);
  const clave = normalizeRoleKey(permission?.clave);
  const accion = normalizeRoleKey(permission?.accion);
  return (
    isSensitivePermission(permission) ||
    module === "CONFIGURACION" ||
    module === "CAJA" ||
    module === "VENTAS" ||
    clave.includes("CONFIG") ||
    clave.includes("ROLES") ||
    clave.includes("USUARIOS") ||
    clave.includes("CAJA") ||
    clave.includes("VENTAS") ||
    accion === "COBRAR"
  );
}

export function permissionRiskLabel(permission) {
  return permissionRisk(permission);
}

export function permissionRiskClass(permission) {
  return `is-${permissionRiskKey(permission).toLowerCase()}`;
}

export function removedCriticalPermissions(originalIds, nextIds, permisos) {
  const next = new Set(Array.from(nextIds || []).map(Number));
  const catalog = new Map(permisos.map((permission) => [Number(permission.idPermiso), permission]));

  return Array.from(originalIds || [])
    .map(Number)
    .filter((id) => Number.isFinite(id) && !next.has(id))
    .map((id) => catalog.get(id))
    .filter(Boolean)
    .filter(isCriticalPermission);
}
