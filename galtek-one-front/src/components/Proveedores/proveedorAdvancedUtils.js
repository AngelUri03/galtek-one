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
  { label: "Bascula", value: "BASCULA" },
  { label: "Otro", value: "OTRO" },
];

export const ACTIVO_ESTADO_OPTIONS = [
  { label: "En tienda", value: "EN_TIENDA" },
  { label: "Danado", value: "DANADO" },
  { label: "Reparacion", value: "REPARACION" },
  { label: "Devuelto", value: "DEVUELTO" },
  { label: "Perdido", value: "PERDIDO" },
];

export const DOCUMENTO_TIPO_OPTIONS = [
  { label: "Contrato", value: "CONTRATO" },
  { label: "Comodato", value: "COMODATO" },
  { label: "Lista de precios", value: "LISTA_PRECIOS" },
  { label: "Catalogo", value: "CATALOGO" },
  { label: "Evidencia", value: "EVIDENCIA" },
  { label: "Documento de credito", value: "DOCUMENTO_CREDITO" },
  { label: "Identificacion", value: "IDENTIFICACION" },
  { label: "Otro", value: "OTRO" },
];

export const DOCUMENTO_ESTADO_OPTIONS = [
  { label: "Activo", value: "ACTIVO" },
  { label: "Archivado", value: "ARCHIVADO" },
];

export const ACUERDO_TIPO_OPTIONS = [
  { label: "Credito", value: "CREDITO" },
  { label: "Cambio por caducidad", value: "CAMBIO_CADUCIDAD" },
  { label: "Prestamo de activo", value: "PRESTAMO_ACTIVO" },
  { label: "Descuento", value: "DESCUENTO" },
  { label: "Entrega", value: "ENTREGA" },
  { label: "Pedido minimo", value: "PEDIDO_MINIMO" },
  { label: "Pago", value: "PAGO" },
  { label: "Contacto", value: "CONTACTO" },
  { label: "Otro", value: "OTRO" },
];

export const ACUERDO_ESTADO_OPTIONS = [
  { label: "Activo", value: "ACTIVO" },
  { label: "Vencido", value: "VENCIDO" },
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
  { label: "Texto", value: "text/plain" },
];

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

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
  return String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const productLabel = (producto = {}) =>
  producto.nombreProducto || producto.nombre || producto.descripcion || "Producto";

export const productSku = (producto = {}) =>
  producto.codigoBarras || producto.sku || producto.codigo || "";

export const relationProductName = (row = {}) =>
  productLabel(row.producto || row) || row.skuProveedor || "Producto asociado";

export const relationProductSku = (row = {}) => productSku(row.producto || row);

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
  estadoFisico: trim(form.estadoFisico),
  ubicacionTienda: trim(form.ubicacionTienda),
  condicionesPrestamo: trim(form.condicionesPrestamo),
  depositoGarantia: numberOrNull(form.depositoGarantia),
  estadoActivoPrestado: form.estadoActivoPrestado || "EN_TIENDA",
  notas: trim(form.notas),
  estatus: !["DEVUELTO", "PERDIDO"].includes(form.estadoActivoPrestado),
});

export const createActivoForm = (row = null) => ({
  idProveedorActivo: row?.idProveedorActivo || null,
  nombre: row?.nombre || "",
  tipo: row?.tipo || "OTRO",
  numeroSerie: row?.numeroSerie || "",
  fechaEntrega: dateOnly(row?.fechaEntrega),
  estadoFisico: row?.estadoFisico || "",
  ubicacionTienda: row?.ubicacionTienda || "",
  condicionesPrestamo: row?.condicionesPrestamo || "",
  depositoGarantia: numberOrNull(row?.depositoGarantia),
  estadoActivoPrestado: row?.estadoActivoPrestado || "EN_TIENDA",
  notas: row?.notas || "",
});

export const buildDocumentoPayload = (form) => ({
  nombre: trim(form.nombre),
  tipo: form.tipo || "OTRO",
  rutaDocumento: trim(form.rutaDocumento),
  mimeType: trim(form.mimeType),
  tamanoBytes: numberOrNull(form.tamanoBytes),
  descripcion: trim(form.descripcion),
  estadoDocumento: form.estadoDocumento || "ACTIVO",
  activo: form.idProveedorActivo ? { idProveedorActivo: Number(form.idProveedorActivo) } : null,
  estatus: (form.estadoDocumento || "ACTIVO") === "ACTIVO",
});

export const createDocumentoForm = (row = null) => ({
  idProveedorDocumento: row?.idProveedorDocumento || null,
  nombre: row?.nombre || "",
  tipo: row?.tipo || "OTRO",
  rutaDocumento: row?.rutaDocumento || "",
  mimeType: row?.mimeType || "",
  tamanoBytes: numberOrNull(row?.tamanoBytes),
  descripcion: row?.descripcion || "",
  estadoDocumento: row?.estadoDocumento || "ACTIVO",
  idProveedorActivo: row?.activo?.idProveedorActivo || row?.idProveedorActivo || null,
});

export const buildAcuerdoPayload = (form) => ({
  tipo: form.tipo || "OTRO",
  descripcion: trim(form.descripcion),
  fechaInicio: trim(form.fechaInicio) || null,
  fechaVigencia: trim(form.fechaVigencia) || null,
  estadoAcuerdo: form.estadoAcuerdo || "ACTIVO",
  documentoRelacionado: form.idProveedorDocumento
    ? { idProveedorDocumento: Number(form.idProveedorDocumento) }
    : null,
  notas: trim(form.notas),
  estatus: (form.estadoAcuerdo || "ACTIVO") === "ACTIVO",
});

export const createAcuerdoForm = (row = null) => ({
  idProveedorAcuerdo: row?.idProveedorAcuerdo || null,
  tipo: row?.tipo || "OTRO",
  descripcion: row?.descripcion || "",
  fechaInicio: dateOnly(row?.fechaInicio),
  fechaVigencia: dateOnly(row?.fechaVigencia),
  estadoAcuerdo: row?.estadoAcuerdo || "ACTIVO",
  idProveedorDocumento:
    row?.documentoRelacionado?.idProveedorDocumento || row?.idProveedorDocumento || null,
  notas: row?.notas || "",
});

export const normalizeProductosCatalog = (payload) => {
  const rows = Array.isArray(payload) ? payload : payload?.content || payload?.items || [];
  return rows.map((producto) => ({
    ...producto,
    label: `${productLabel(producto)}${productSku(producto) ? ` - ${productSku(producto)}` : ""}`,
    value: producto.idProducto,
  }));
};
