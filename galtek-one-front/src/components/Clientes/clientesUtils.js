export const ESTADO_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Activos", value: "ACTIVO" },
  { label: "Inactivos", value: "INACTIVO" },
  { label: "Archivados", value: "ARCHIVADO" },
];

export const ESTADO_FORM_OPTIONS = ESTADO_OPTIONS.filter((option) => option.value !== "TODOS");

export const TIPO_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Persona", value: "PERSONA" },
  { label: "Negocio", value: "NEGOCIO" },
];

export const TIPO_FORM_OPTIONS = TIPO_OPTIONS.filter((option) => option.value !== "TODOS");

export const FISCAL_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Con datos", value: "CON_FISCALES" },
  { label: "Sin datos", value: "SIN_FISCALES" },
];

export const DIRECCION_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Con direccion", value: "CON_DIRECCION" },
  { label: "Sin direccion", value: "SIN_DIRECCION" },
];

export const COMPRAS_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Con compras", value: "CON_COMPRAS" },
  { label: "Sin compras", value: "SIN_COMPRAS" },
];

export const emptyFilters = {
  estado: "TODOS",
  tipo: "TODOS",
  fiscales: "TODOS",
  direccion: "TODOS",
  compras: "TODOS",
};

const trim = (value) => (value == null ? "" : String(value).trim());

export const labelFromOptions = (options, value, fallback = "Sin dato") =>
  options.find((option) => option.value === value)?.label || fallback;

export const readApiPayload = async (response, label = "solicitud") => {
  if (!response) throw new Error(`Sin respuesta del servidor en ${label}`);
  const payload = await response.json().catch(() => null);
  const apiStatus = Number(payload?.statusCode || 0);

  if (!response.ok || apiStatus >= 400) {
    throw new Error(payload?.message || `Error HTTP ${response.status} en ${label}`);
  }

  return payload?.data;
};

export const getListPayload = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const normalizeEstado = (cliente = {}) => {
  const raw = cliente.estadoCliente || cliente.estado || "";
  if (raw) return String(raw).trim().toUpperCase();
  return cliente.estatus === false ? "INACTIVO" : "ACTIVO";
};

const hasValue = (value) => trim(value).length > 0;

export const hasFiscalData = (cliente = {}) =>
  [
    cliente.rfc,
    cliente.razonSocial,
    cliente.codigoPostalFiscal,
    cliente.correoFiscal,
    cliente.regimenFiscal,
    cliente.usoCfdi,
  ].some(hasValue);

export const hasAddressData = (cliente = {}) =>
  [
    cliente.direccion,
    cliente.direccionCalle,
    cliente.direccionNumeroExterior,
    cliente.direccionNumeroInterior,
    cliente.direccionColonia,
    cliente.direccionMunicipio,
    cliente.direccionEstado,
    cliente.direccionCodigoPostal,
    cliente.direccionReferencia,
  ].some(hasValue);

const getLastPurchase = (pedidos = []) => {
  const sorted = [...pedidos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  return sorted[0] || null;
};

export const normalizeCliente = (cliente = {}, detail = null) => {
  const data =
    detail && !Array.isArray(detail) ? { ...(cliente || {}), ...detail } : cliente || {};
  const pedidos = Array.isArray(data.pedidos) ? data.pedidos : [];
  const estadoCliente = normalizeEstado(data);
  const comprasRegistradas =
    data.comprasRegistradas ?? data.comprasCount ?? data.ventasCount ?? pedidos.length;

  return {
    idCliente: data.idCliente ?? data.id ?? null,
    id: data.idCliente ?? data.id ?? null,
    nombre: data.nombre ?? "",
    alias: data.alias ?? "",
    tipoCliente: data.tipoCliente || "PERSONA",
    estadoCliente,
    estatus: estadoCliente === "ACTIVO",
    email: data.email ?? "",
    telefono: data.telefono ?? "",
    whatsapp: data.whatsapp ?? "",
    direccion: data.direccion ?? "",
    direccionCalle: data.direccionCalle ?? "",
    direccionNumeroExterior: data.direccionNumeroExterior ?? "",
    direccionNumeroInterior: data.direccionNumeroInterior ?? "",
    direccionColonia: data.direccionColonia ?? "",
    direccionMunicipio: data.direccionMunicipio ?? "",
    direccionEstado: data.direccionEstado ?? "",
    direccionCodigoPostal: data.direccionCodigoPostal ?? "",
    direccionReferencia: data.direccionReferencia ?? "",
    notasInternas: data.notasInternas ?? "",
    rfc: data.rfc ?? "",
    razonSocial: data.razonSocial ?? "",
    codigoPostalFiscal: data.codigoPostalFiscal ?? "",
    correoFiscal: data.correoFiscal ?? "",
    regimenFiscal: data.regimenFiscal ?? "",
    usoCfdi: data.usoCfdi ?? "",
    avatar: data.avatar ?? "",
    pedidos,
    comprasRegistradas,
    ultimaCompra: getLastPurchase(pedidos),
    fechaCreacion: data.fechaCreacion ?? "",
    fechaModificacion: data.fechaModificacion ?? "",
    usuarioCreacion: data.usuarioCreacion ?? "",
    usuarioModificacion: data.usuarioModificacion ?? "",
    ultimaAccionEstado: data.ultimaAccionEstado ?? "",
    motivoCambioEstado: data.motivoCambioEstado ?? "",
    usuarioCambioEstado: data.usuarioCambioEstado ?? "",
    fechaCambioEstado: data.fechaCambioEstado ?? "",
    tieneDatosFiscales: hasFiscalData(data),
    tieneDireccion: hasAddressData(data),
    detailLoaded: Boolean(detail || data.pedidos),
    raw: data,
  };
};

export const createClienteForm = (cliente = null) => ({
  idCliente: cliente?.idCliente ?? cliente?.id ?? null,
  nombre: cliente?.nombre ?? "",
  alias: cliente?.alias ?? "",
  tipoCliente: cliente?.tipoCliente || "PERSONA",
  estadoCliente: cliente?.estadoCliente || "ACTIVO",
  notasInternas: cliente?.notasInternas ?? "",
  email: cliente?.email ?? "",
  telefono: cliente?.telefono ?? "",
  whatsapp: cliente?.whatsapp ?? "",
  direccion: cliente?.direccion ?? "",
  direccionCalle: cliente?.direccionCalle ?? "",
  direccionNumeroExterior: cliente?.direccionNumeroExterior ?? "",
  direccionNumeroInterior: cliente?.direccionNumeroInterior ?? "",
  direccionColonia: cliente?.direccionColonia ?? "",
  direccionMunicipio: cliente?.direccionMunicipio ?? "",
  direccionEstado: cliente?.direccionEstado ?? "",
  direccionCodigoPostal: cliente?.direccionCodigoPostal ?? "",
  direccionReferencia:
    cliente?.direccionReferencia ||
    (!cliente?.direccionCalle && cliente?.direccion ? cliente.direccion : ""),
  rfc: cliente?.rfc ?? "",
  razonSocial: cliente?.razonSocial ?? "",
  codigoPostalFiscal: cliente?.codigoPostalFiscal ?? "",
  correoFiscal: cliente?.correoFiscal ?? "",
  regimenFiscal: cliente?.regimenFiscal ?? "",
  usoCfdi: cliente?.usoCfdi ?? "",
  avatar: cliente?.avatar ?? "",
});

export const buildAddressText = (form = {}) =>
  [
    form.direccionCalle,
    form.direccionNumeroExterior,
    form.direccionNumeroInterior,
    form.direccionColonia,
    form.direccionMunicipio,
    form.direccionEstado,
    form.direccionCodigoPostal,
    form.direccionReferencia,
  ]
    .map(trim)
    .filter(Boolean)
    .join(", ");

export const buildClientePayload = (form = {}) => ({
  nombre: trim(form.nombre),
  alias: trim(form.alias),
  tipoCliente: form.tipoCliente || "PERSONA",
  estadoCliente: form.estadoCliente || "ACTIVO",
  notasInternas: trim(form.notasInternas),
  email: trim(form.email),
  telefono: sanitizePhoneInput(form.telefono),
  whatsapp: sanitizePhoneInput(form.whatsapp),
  direccion: buildAddressText(form) || trim(form.direccion),
  direccionCalle: trim(form.direccionCalle),
  direccionNumeroExterior: trim(form.direccionNumeroExterior),
  direccionNumeroInterior: trim(form.direccionNumeroInterior),
  direccionColonia: trim(form.direccionColonia),
  direccionMunicipio: trim(form.direccionMunicipio),
  direccionEstado: trim(form.direccionEstado),
  direccionCodigoPostal: onlyDigits(form.direccionCodigoPostal).slice(0, 5),
  direccionReferencia: trim(form.direccionReferencia),
  rfc: trim(form.rfc).toUpperCase(),
  razonSocial: trim(form.razonSocial),
  codigoPostalFiscal: onlyDigits(form.codigoPostalFiscal).slice(0, 5),
  correoFiscal: trim(form.correoFiscal),
  regimenFiscal: trim(form.regimenFiscal),
  usoCfdi: trim(form.usoCfdi).toUpperCase(),
  avatar: trim(form.avatar),
  estatus: form.estadoCliente === "ACTIVO",
});

const onlyDigits = (value) => trim(value).replace(/\D/g, "");

export const sanitizePhoneInput = (value) => {
  const text = trim(value);
  const prefix = text.startsWith("+") ? "+" : "";
  return prefix + text.replace(/[^\d]/g, "").slice(0, prefix ? 13 : 10);
};

export const sanitizeEmailInput = (value) => trim(value).toLowerCase();

export const isValidEmail = (value) => !trim(value) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(value));

export const isValidPhone = (value) => {
  const phone = sanitizePhoneInput(value);
  return !phone || /^\+?\d{10,13}$/.test(phone);
};

export const isValidRfc = (value) =>
  !trim(value) || /^[A-Z&\u00D1]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(trim(value).toUpperCase());

export const searchableText = (cliente = {}) =>
  [
    cliente.nombre,
    cliente.alias,
    cliente.telefono,
    cliente.whatsapp,
    cliente.email,
    cliente.rfc,
    cliente.razonSocial,
    cliente.direccion,
    cliente.direccionCalle,
    cliente.direccionColonia,
    cliente.direccionMunicipio,
    cliente.notasInternas,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const moneyOrDash = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return number.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });
};

export const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
