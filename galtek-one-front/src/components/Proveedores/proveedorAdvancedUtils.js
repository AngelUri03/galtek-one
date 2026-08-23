export const RELACION_PRODUCTO_OPTIONS = [
  { label: "Activa", value: "ACTIVA" },
  { label: "Inactiva", value: "INACTIVA" },
  { label: "Archivada", value: "ARCHIVADA" },
];

export const ACTIVO_TIPO_OPTIONS = [
  { label: "Enfriador", value: "ENFRIADOR" },
  { label: "Refrigerador", value: "REFRIGERADOR" },
  { label: "Stand", value: "STAND" },
  { label: "Anaquel", value: "ANAQUEL" },
  { label: "Exhibidor", value: "EXHIBIDOR" },
  { label: "Lona", value: "LONA" },
  { label: "Sombrilla", value: "SOMBRILLA" },
  { label: "Báscula", value: "BASCULA" },
  { label: "Otro", value: "OTRO" },
];

export const ACTIVO_ESTADO_OPTIONS = [
  { label: "Recibido", value: "RECIBIDO" },
  { label: "En tienda", value: "EN_TIENDA" },
  { label: "En exhibición", value: "EN_EXHIBICION" },
  { label: "Retirado por daño", value: "RETIRADO_DANO" },
  { label: "Reparación", value: "REPARACION" },
  { label: "Devuelto", value: "DEVUELTO" },
  { label: "Perdido", value: "PERDIDO" },
];

export const ACTIVO_FLOW_TRANSITIONS = {
  RECIBIDO: ["EN_TIENDA", "EN_EXHIBICION", "RETIRADO_DANO", "DEVUELTO"],
  EN_TIENDA: ["EN_EXHIBICION", "RETIRADO_DANO", "REPARACION", "DEVUELTO", "PERDIDO"],
  EN_EXHIBICION: ["EN_TIENDA", "RETIRADO_DANO", "REPARACION", "DEVUELTO", "PERDIDO"],
  RETIRADO_DANO: ["REPARACION", "EN_TIENDA", "EN_EXHIBICION", "DEVUELTO", "PERDIDO"],
  REPARACION: ["EN_TIENDA", "EN_EXHIBICION", "DEVUELTO", "PERDIDO"],
  DEVUELTO: ["RECIBIDO", "EN_TIENDA"],
  PERDIDO: ["RECIBIDO", "EN_TIENDA"],
  INACTIVO: ["RECIBIDO", "EN_TIENDA", "EN_EXHIBICION"],
};

export const DOCUMENTO_TIPO_OPTIONS = [
  { label: "Contrato", value: "CONTRATO" },
  { label: "Comodato", value: "COMODATO" },
  { label: "Lista de precios", value: "LISTA_PRECIOS" },
  { label: "Catálogo", value: "CATALOGO" },
  { label: "Evidencia", value: "EVIDENCIA" },
  { label: "Documento de crédito", value: "DOCUMENTO_CREDITO" },
  { label: "Identificación", value: "IDENTIFICACION" },
  { label: "Otro", value: "OTRO" },
];

export const DOCUMENTO_ESTADO_OPTIONS = [
  { label: "Activo", value: "ACTIVO" },
  { label: "Inactivo", value: "INACTIVO" },
  { label: "Archivado", value: "ARCHIVADO" },
];

export const DOCUMENTO_MIME_OPTIONS = [
  { label: "PDF", value: "application/pdf" },
  { label: "Imagen JPEG", value: "image/jpeg" },
  { label: "Imagen PNG", value: "image/png" },
  { label: "Imagen WebP", value: "image/webp" },
  { label: "Excel XLSX", value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  { label: "Excel XLS", value: "application/vnd.ms-excel" },
  { label: "CSV", value: "text/csv" },
  { label: "Word DOCX", value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  { label: "Word DOC", value: "application/msword" },
  { label: "PowerPoint PPTX", value: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  { label: "PowerPoint PPT", value: "application/vnd.ms-powerpoint" },
  { label: "Texto", value: "text/plain" },
];

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const MAX_ASSET_EVIDENCE_BYTES = 10 * 1024 * 1024;

export const trim = (value) => (value == null ? "" : String(value).trim());

export const numberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const dateOnly = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

export const dateTimeLocal = (value) => {
  if (!value) return "";
  return String(value).slice(0, 16);
};

export const enumText = (value) => {
  if (!value) return "Sin dato";
  const normalized = String(value).trim().toUpperCase();
  const labels = {
    BASCULA: "Báscula",
    CREDITO: "Crédito",
    DANADO: "Retirado por daño",
    RETIRADO_DANO: "Retirado por daño",
    RECIBIDO: "Recibido",
    EN_TIENDA: "En tienda",
    EN_EXHIBICION: "En exhibición",
    REPARACION: "Reparación",
    IDENTIFICACION: "Identificación",
    DOCUMENTO_CREDITO: "Documento de crédito",
    CATALOGO: "Catálogo",
    ARCHIVADA: "Archivada",
    ARCHIVADO: "Archivado",
    INACTIVA: "Inactiva",
    INACTIVO: "Inactivo",
  };
  if (labels[normalized]) return labels[normalized];
  return normalized
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const productLabel = (producto = {}) => {
  const data = producto || {};
  return data.nombreProducto || data.nombre || data.descripcion || "Producto";
};

export const productSku = (producto = {}) => {
  const data = producto || {};
  return data.codigoBarras || data.sku || data.codigo || "";
};

export const relationProductName = (row = {}) => {
  const data = row || {};
  return productLabel(data.producto || data) || data.skuProveedor || "Producto asociado";
};

export const relationProductSku = (row = {}) => {
  const data = row || {};
  return productSku(data.producto || data);
};

export const buildProductoPayload = (form) => ({
  producto: { idProducto: Number(form.idProducto) },
  skuProveedor: trim(form.skuProveedor),
  precioCompra: numberOrNull(form.ultimoCosto),
  ultimoCosto: numberOrNull(form.ultimoCosto),
  fechaUltimoCosto: trim(form.fechaUltimoCosto) || null,
  presentacionCompra: trim(form.presentacionCompra),
  cantidadMinima: numberOrNull(form.cantidadMinima),
  proveedorPreferido: Boolean(form.proveedorPreferido),
  estadoRelacion: form.estadoRelacion || "ACTIVA",
  estatus: (form.estadoRelacion || "ACTIVA") === "ACTIVA",
});

export const createProductoForm = (row = null) => ({
  idProveedorProducto: row?.idProveedorProducto || null,
  idProducto: row?.producto?.idProducto || row?.idProducto || null,
  skuInterno: relationProductSku(row),
  skuProveedor: row?.skuProveedor || "",
  ultimoCosto: numberOrNull(row?.ultimoCosto ?? row?.precioCompra),
  fechaUltimoCosto: dateTimeLocal(row?.fechaUltimoCosto),
  presentacionCompra: row?.presentacionCompra || "",
  cantidadMinima: numberOrNull(row?.cantidadMinima),
  proveedorPreferido: row?.proveedorPreferido === true,
  estadoRelacion: row?.estadoRelacion || "ACTIVA",
});

export const buildActivoPayload = (form) => ({
  nombre: trim(form.nombre),
  tipo: form.tipo || "OTRO",
  numeroSerie: trim(form.numeroSerie),
  fechaEntrega: trim(form.fechaEntrega) || null,
  fechaRegreso: trim(form.fechaRegreso) || null,
  estadoFisico: form.idProveedorActivo ? undefined : trim(form.estadoFisico),
  ubicacionTienda: form.idProveedorActivo ? undefined : trim(form.ubicacionTienda),
  condicionesPrestamo: trim(form.condicionesPrestamo),
  depositoGarantia: numberOrNull(form.depositoGarantia),
  estadoActivoPrestado: form.idProveedorActivo ? undefined : form.estadoActivoPrestado || "RECIBIDO",
  notas: trim(form.notas),
  evidencias: form.idProveedorActivo
    ? undefined
    : (form.evidencias || []).map((evidence) => ({
      evidenciaNombre: evidence.name,
      evidenciaMimeType: evidence.mimeType,
      evidenciaBase64: evidence.base64,
      evidenciaTamanoBytes: evidence.size,
    })),
  estatus: form.idProveedorActivo
    ? undefined
    : !["DEVUELTO", "PERDIDO"].includes(form.estadoActivoPrestado || "RECIBIDO"),
});

export const createActivoForm = (row = null) => ({
  idProveedorActivo: row?.idProveedorActivo || null,
  nombre: row?.nombre || "",
  tipo: row?.tipo || "OTRO",
  numeroSerie: row?.numeroSerie || "",
  fechaEntrega: dateOnly(row?.fechaEntrega),
  fechaRegreso: dateOnly(row?.fechaRegreso),
  estadoFisico: row?.estadoFisico || "",
  ubicacionTienda: row?.ubicacionTienda || "",
  condicionesPrestamo: row?.condicionesPrestamo || "",
  depositoGarantia: numberOrNull(row?.depositoGarantia),
  estadoActivoPrestado: row?.estadoActivoPrestado || "RECIBIDO",
  notas: row?.notas || "",
  evidencias: [],
});

export const buildDocumentoPayload = (form) => {
  const editing = Boolean(form.idProveedorDocumento);
  return {
    nombre: trim(form.nombre),
    tipo: form.tipo || "OTRO",
    rutaDocumento: "BASE_DATOS",
    archivoNombre: editing ? undefined : trim(form.archivoNombre),
    archivoBase64: editing ? undefined : trim(form.archivoBase64),
    mimeType: editing ? undefined : trim(form.mimeType),
    tamanoBytes: editing ? undefined : numberOrNull(form.tamanoBytes),
    descripcion: trim(form.descripcion),
    estadoDocumento: form.estadoDocumento || "ACTIVO",
    activo: null,
    estatus: (form.estadoDocumento || "ACTIVO") === "ACTIVO",
  };
};

export const createDocumentoForm = (row = null) => ({
  idProveedorDocumento: row?.idProveedorDocumento || null,
  nombre: row?.nombre || "",
  tipo: row?.tipo || "OTRO",
  rutaDocumento: row?.rutaDocumento || "",
  archivoNombre: row?.archivoNombre || "",
  archivoBase64: row?.archivoBase64 || "",
  mimeType: row?.mimeType || "",
  tamanoBytes: numberOrNull(row?.tamanoBytes),
  descripcion: row?.descripcion || "",
  estadoDocumento: row?.estadoDocumento || "ACTIVO",
});

export const normalizeProductosCatalog = (payload) => {
  const rows = Array.isArray(payload) ? payload : payload?.content || payload?.items || [];
  return rows.map((producto) => ({
    ...producto,
    label: `${productLabel(producto)}${productSku(producto) ? ` - ${productSku(producto)}` : ""}`,
    value: producto.idProducto,
  }));
};
