import { endpoints } from "../../../API/api";
import { MODULE_ICON, actionIcon, safeTrim } from "../Roles/rolesUtils";
import { buildDataUrlFromBase64, initialsFromName } from "../Usuarios/usuariosUtils";

export { safeTrim };

export const OVERRIDE_ROW_OPTIONS = [5, 10, 15];

export const OVERRIDE_SCOPE_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Con overrides", value: "CON_OVERRIDES" },
  { label: "Sin overrides", value: "SIN_OVERRIDES" },
  { label: "Overrides criticos", value: "CRITICOS" },
];

export const OVERRIDE_STATUS_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Activos", value: "ACTIVOS" },
  { label: "Inactivos", value: "INACTIVOS" },
];

export const OVERRIDE_EFFECT_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Permitidos", value: "PERMITIR" },
  { label: "Denegados", value: "DENEGAR" },
];

export const OVERRIDE_RISK_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Consulta", value: "Consulta" },
  { label: "Operacion", value: "Operacion" },
  { label: "Critico", value: "Critico" },
  { label: "Destructivo", value: "Destructivo" },
];

export function resolveOverridesSummaryURL() {
  if (endpoints?.usuariosOverrides) return endpoints.usuariosOverrides;
  return `${resolveUsuariosURL().replace(/\/+$/, "")}/overrides`;
}

export function resolveEffectivePermissionsURL(idUsuario) {
  return `${resolveUsuariosURL().replace(/\/+$/, "")}/${idUsuario}/permisos-efectivos`;
}

export function resolveUserOverridesURL(idUsuario) {
  return `${resolveUsuariosURL().replace(/\/+$/, "")}/${idUsuario}/overrides`;
}

export function resolveUserOverridePermissionURL(idUsuario, idPermiso) {
  return `${resolveUserOverridesURL(idUsuario)}/${idPermiso}`;
}

export function resolveUsuariosURL() {
  if (endpoints?.usuarios) return endpoints.usuarios;
  const base = (process.env.REACT_APP_API_BASE_URL || "").trim();
  return `${base.replace(/\/+$/, "")}/usuarios`;
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

export function normalizeOverrideUser(user) {
  const rawImage = user?.avatarUrl || user?.imagen || user?.foto || null;
  return {
    idUsuario: user?.idUsuario ?? user?.id_usuario ?? user?.id,
    nombreUsuario: user?.nombreUsuario ?? user?.nombre ?? "",
    usuario: user?.usuario ?? user?.login ?? "",
    correo: user?.correo ?? "",
    telefono: user?.telefono ?? "",
    imagen: buildDataUrlFromBase64(rawImage),
    activo: user?.activo !== false,
    idRol: user?.idRol ?? null,
    nombreRol: user?.nombreRol ?? user?.rolNombre ?? "Sin rol",
    rolProtegido: user?.rolProtegido === true,
    permisosHeredados: Number(user?.permisosHeredados || 0),
    overridesActivos: Number(user?.overridesActivos || 0),
    overridesPermitidos: Number(user?.overridesPermitidos || 0),
    overridesDenegados: Number(user?.overridesDenegados || 0),
    overridesCriticos: Number(user?.overridesCriticos || 0),
    permisosOverride: Array.isArray(user?.permisosOverride) ? user.permisosOverride : [],
    raw: user,
  };
}

export function normalizeEffectivePayload(payload) {
  return {
    usuario: payload?.usuario || null,
    rol: payload?.rol || null,
    permisos: Array.isArray(payload?.permisos) ? payload.permisos : [],
    overridesActivos: Array.isArray(payload?.overridesActivos) ? payload.overridesActivos : [],
    resumen: payload?.resumen || {},
  };
}

export function userAvatarContent(user) {
  if (user?.imagen || user?.avatarUrl) return null;
  return initialsFromName(user?.nombreUsuario, user?.usuario?.slice(0, 2) || "US");
}

export function overrideSearchText(user) {
  return [
    user?.nombreUsuario,
    user?.usuario,
    user?.correo,
    user?.telefono,
    user?.nombreRol,
    ...(user?.permisosOverride || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function roleOptionsFromUsers(users = []) {
  const map = new Map();
  users.forEach((user) => {
    if (!user.idRol) return;
    map.set(String(user.idRol), user.nombreRol || "Sin rol");
  });
  return [
    { label: "Todos", value: "TODOS" },
    ...Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1], "es"))
      .map(([value, label]) => ({ label, value })),
  ];
}

export function moduleOptionsFromEffective(permisos = []) {
  const modules = Array.from(new Set(permisos.map((item) => item.modulo || "GENERAL"))).sort((a, b) =>
    a.localeCompare(b, "es")
  );
  return [{ label: "Todos", value: "TODOS" }, ...modules.map((module) => ({ label: module, value: module }))];
}

export function groupEffectivePermissions(permisos = []) {
  const map = permisos.reduce((acc, permission) => {
    const key = permission.modulo || "GENERAL";
    if (!acc[key]) acc[key] = [];
    acc[key].push(permission);
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

export function filterOverrideUsers(users, search, filters) {
  const query = safeTrim(search).toLowerCase();
  return users.filter((user) => {
    const matchesSearch = !query || overrideSearchText(user).includes(query);
    const matchesScope =
      filters.scope === "TODOS" ||
      (filters.scope === "CON_OVERRIDES" && user.overridesActivos > 0) ||
      (filters.scope === "SIN_OVERRIDES" && user.overridesActivos === 0) ||
      (filters.scope === "CRITICOS" && user.overridesCriticos > 0);
    const matchesRole = filters.rol === "TODOS" || String(user.idRol || "") === String(filters.rol);
    const matchesStatus =
      filters.estado === "TODOS" ||
      (filters.estado === "ACTIVOS" && user.activo) ||
      (filters.estado === "INACTIVOS" && !user.activo);
    const matchesEffect =
      filters.efecto === "TODOS" ||
      (filters.efecto === "PERMITIR" && user.overridesPermitidos > 0) ||
      (filters.efecto === "DENEGAR" && user.overridesDenegados > 0);
    return matchesSearch && matchesScope && matchesRole && matchesStatus && matchesEffect;
  });
}

export function riskClass(value) {
  const key = safeTrim(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return `is-${key || "consulta"}`;
}

export function effectLabel(value) {
  if (value === "PERMITIR") return "Permitido por excepcion";
  if (value === "DENEGAR") return "Denegado por excepcion";
  return "Heredado del rol";
}

export function effectiveLabel(value) {
  return value ? "Permitido" : "Denegado";
}

export function permissionIcon(permission) {
  return actionIcon(permission);
}

export function hasCriticalChanges(changes = [], permissions = []) {
  const map = new Map(permissions.map((permission) => [Number(permission.idPermiso), permission]));
  return changes.some((change) => {
    const permission = map.get(Number(change.idPermiso));
    return ["Critico", "Destructivo"].includes(permission?.riesgo);
  });
}
