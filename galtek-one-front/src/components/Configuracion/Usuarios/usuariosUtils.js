import { endpoints } from "../../../API/api";

export const STATUS_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Activos", value: "ACTIVOS" },
  { label: "Inactivos", value: "INACTIVOS" },
];

export const CONTACT_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Con correo", value: "CON_CORREO" },
  { label: "Sin correo", value: "SIN_CORREO" },
  { label: "Con telefono", value: "CON_TELEFONO" },
  { label: "Sin telefono", value: "SIN_TELEFONO" },
];

export const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function readAuthSession() {
  try {
    const raw = sessionStorage.getItem("auth_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function resolveUsuariosURL() {
  if (endpoints?.usuarios) return endpoints.usuarios;
  const base = (process.env.REACT_APP_API_BASE_URL || "").trim();
  return `${base.replace(/\/+$/, "")}/usuarios`;
}

export function resolveUsuarioImagenURL(idUsuario) {
  return `${resolveUsuariosURL().replace(/\/+$/, "")}/${idUsuario}/imagen`;
}

export function resolveUsuarioPasswordURL(idUsuario) {
  return `${resolveUsuariosURL().replace(/\/+$/, "")}/${idUsuario}/password`;
}

export function resolveOwnPasswordURL() {
  return `${resolveUsuariosURL().replace(/\/+$/, "")}/me/password`;
}

export function resolveUsuarioStatusURL(idUsuario, active) {
  const action = active ? "activar" : "desactivar";
  return `${resolveUsuariosURL().replace(/\/+$/, "")}/${idUsuario}/${action}`;
}

export function getResponseMessage(payload, fallback) {
  return (
    payload?.message ||
    payload?.error ||
    payload?.detail ||
    fallback ||
    "Solicitud rechazada."
  );
}

export async function readPayload(response, fallback) {
  if (!response) throw new Error("No se pudo contactar al servidor.");
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getResponseMessage(payload, fallback));
  }
  return payload?.data ?? payload;
}

export function buildDataUrlFromBase64(raw, fallbackMime = "image/png") {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (value.startsWith("data:image/")) return value;
  if (value.includes(";base64,")) return `data:${value}`;
  return `data:${fallbackMime};base64,${value.replace(/\s/g, "")}`;
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

export function safeTrim(value) {
  return String(value ?? "").trim();
}

export function normalizePermiso(permission, catalogMap = new Map()) {
  const idPermiso = permission?.idPermiso ?? permission?.id_permiso ?? permission?.id;
  const catalog = idPermiso != null ? catalogMap.get(Number(idPermiso)) : null;
  const clave = permission?.clave ?? permission?.clavePermiso ?? catalog?.clave ?? "";
  const inferredModule = String(clave || "GENERAL").split(/[_:.]/)[0] || "GENERAL";

  return {
    idPermiso,
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
}

export function normalizeRole(role, catalogMap = new Map()) {
  const permisos = Array.isArray(role?.permisos)
    ? role.permisos.map((item) => normalizePermiso(item, catalogMap))
    : [];

  return {
    idRol: role?.idRol ?? role?.id_rol ?? role?.id,
    nombreRol: role?.nombreRol ?? role?.nombre ?? role?.rol ?? "",
    activo: role?.estatus !== false && role?.activo !== false,
    permisos,
  };
}

export function normalizeUsuario(usuario) {
  const rawImage =
    usuario?.avatarUrl || usuario?.imagenBase64 || usuario?.imagen || usuario?.foto || null;
  const activo =
    usuario?.activo != null
      ? Number(usuario.activo) !== 0
      : usuario?.estatus != null
      ? usuario.estatus !== false
      : true;

  return {
    idUsuario: usuario?.idUsuario ?? usuario?.id_usuario ?? usuario?.id,
    nombreUsuario: usuario?.nombreUsuario ?? usuario?.nombre ?? "",
    usuario: usuario?.usuario ?? usuario?.login ?? "",
    correo: usuario?.correo ?? usuario?.correoUsuario ?? "",
    telefono: usuario?.telefono ?? usuario?.telefonoUsuario ?? "",
    imagen: buildDataUrlFromBase64(rawImage),
    idRol: usuario?.rol?.idRol ?? usuario?.rol?.id ?? usuario?.idRol ?? null,
    rolNombre: usuario?.rol?.nombreRol ?? usuario?.rol?.nombre ?? usuario?.rolNombre ?? "",
    activo,
    requiereCambioPassword: Boolean(usuario?.requiereCambioPassword),
    raw: usuario,
  };
}

export function initialsFromName(name, fallback = "US") {
  const parts = safeTrim(name).split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]).join("");
  return (initials || fallback).toUpperCase();
}

export function userSearchText(user, roleName = "") {
  return [
    user?.nombreUsuario,
    user?.usuario,
    user?.correo,
    user?.telefono,
    roleName || user?.rolNombre,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function isValidEmail(value) {
  const email = safeTrim(value);
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(value) {
  const phone = safeTrim(value);
  if (!phone) return true;
  return /^[+\d][\d\s()-]{6,17}$/.test(phone);
}

export function validateUserEditor(editor) {
  const nombre = safeTrim(editor.nombreUsuario).replace(/\s+/g, " ");
  const usuario = safeTrim(editor.usuario).replace(/\s+/g, "");
  const correo = safeTrim(editor.correo);
  const telefono = safeTrim(editor.telefono);

  if (nombre.length < 3) return { message: "El nombre debe tener al menos 3 caracteres." };
  if (usuario.length < 3) return { message: "El usuario debe tener al menos 3 caracteres." };
  if (!editor.idRol) return { message: "Selecciona un rol." };
  if (!isValidEmail(correo)) return { message: "Revisa el correo capturado." };
  if (!isValidPhone(telefono)) return { message: "Revisa el telefono capturado." };

  return { nombre, usuario, correo, telefono };
}

export function validateImageFile(file) {
  if (!file) return "Selecciona una imagen.";
  if (!IMAGE_TYPES.has(file.type)) return "Usa PNG, JPG o WEBP.";
  if (file.size > 2_500_000) return "La imagen no debe superar 2.5 MB.";
  return "";
}

export function isCurrentSessionUser(user, session = readAuthSession()) {
  const login = safeTrim(session?.usuario).toLowerCase();
  return Boolean(login && safeTrim(user?.usuario).toLowerCase() === login);
}

export function getRoleName(roles, idRol, fallback = "Sin rol") {
  const role = roles.find((item) => Number(item.idRol) === Number(idRol));
  return role?.nombreRol || fallback;
}

export function groupPermissions(permisos = []) {
  return permisos.reduce((acc, permission) => {
    const key = permission.modulo || "GENERAL";
    if (!acc[key]) acc[key] = [];
    acc[key].push(permission);
    return acc;
  }, {});
}
