import {
  buildAddressText,
  buildLeadTimeText,
  buildScheduleText,
  buildVisitDaysText,
  parseAddressText,
  parseLeadTimeText,
  parseScheduleText,
  parseVisitDaysText,
} from "./proveedorEditorUtils";

export const ESTADO_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Activos", value: "ACTIVO" },
  { label: "Inactivos", value: "INACTIVO" },
  { label: "Archivados", value: "ARCHIVADO" },
];

export const TIPO_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Distribuidor formal", value: "DISTRIBUIDOR_FORMAL" },
  { label: "Proveedor informal", value: "PROVEEDOR_INFORMAL" },
  { label: "Establecimiento", value: "ESTABLECIMIENTO_COMPRA" },
];

export const MODALIDAD_OPTIONS = [
  { label: "Todas", value: "TODOS" },
  { label: "Entrega a domicilio", value: "ENTREGA_DOMICILIO" },
  { label: "Recoleccion en proveedor", value: "RECOGE_TENDERO" },
  { label: "Entrega y recoleccion", value: "MIXTO" },
];

export const PRODUCTOS_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Con productos", value: "CON_PRODUCTOS" },
  { label: "Sin productos", value: "SIN_PRODUCTOS" },
];

export const ACTIVOS_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Con activos", value: "CON_ACTIVOS" },
];

export const PAGO_OPTIONS = [
  { label: "Todas", value: "TODOS" },
  { label: "Contado", value: "CONTADO" },
  { label: "Credito", value: "CREDITO" },
  { label: "Mixto", value: "MIXTO" },
];

export const ROL_CONTACTO_OPTIONS = [
  { label: "Vendedor", value: "VENDEDOR" },
  { label: "Repartidor", value: "REPARTIDOR" },
  { label: "Cobranza", value: "COBRANZA" },
  { label: "Atencion", value: "ATENCION_CLIENTES" },
  { label: "Encargado", value: "ENCARGADO" },
  { label: "Otro", value: "OTRO" },
];

export const ESTADO_PROVEEDOR_FORM_OPTIONS = [
  { label: "Activo", value: "ACTIVO" },
  { label: "Inactivo", value: "INACTIVO" },
];

export const emptyFilters = {
  estado: "TODOS",
  tipo: "TODOS",
  modalidad: "TODOS",
  productos: "TODOS",
  activos: "TODOS",
  pago: "TODOS",
};

export const labelFromOptions = (options, value, fallback = "Sin dato") =>
  options.find((option) => option.value === value)?.label || fallback;

export const normalizeState = (proveedor) => {
  const raw = proveedor?.estadoProveedor || proveedor?.estado || "";
  if (raw) return String(raw).trim().toUpperCase();
  return proveedor?.estatus === false ? "INACTIVO" : "ACTIVO";
};

const firstArray = (...values) => values.find((value) => Array.isArray(value));

const trim = (value) => (value == null ? "" : String(value).trim());

const numberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const moneyOrDash = (value) => {
  const number = numberOrNull(value);
  if (number === null) return "--";
  return number.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });
};

export const createEmptyContact = (principal = false) => ({
  tempId: `contacto-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  idProveedorContacto: null,
  nombre: "",
  rol: "VENDEDOR",
  telefono: "",
  whatsapp: "",
  correo: "",
  notas: "",
  contactoPrincipal: principal,
  estadoContacto: "ACTIVO",
  estatus: true,
});

export const normalizeContacto = (contacto = {}) => ({
  tempId:
    contacto.tempId ||
    `contacto-${contacto.idProveedorContacto || contacto.id || Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`,
  idProveedorContacto: contacto.idProveedorContacto ?? contacto.id ?? null,
  nombre: contacto.nombre ?? contacto.contacto ?? "",
  rol: contacto.rol || "OTRO",
  telefono: contacto.telefono ?? "",
  whatsapp: contacto.whatsapp ?? "",
  correo: contacto.correo ?? "",
  notas: contacto.notas ?? "",
  contactoPrincipal: Boolean(contacto.contactoPrincipal),
  estadoContacto: contacto.estadoContacto || (contacto.estatus === false ? "INACTIVO" : "ACTIVO"),
  estatus: contacto.estatus !== false,
});

const normalizeCollection = (items) => (Array.isArray(items) ? items : []);

export const normalizeProveedor = (proveedor, detail = null) => {
  const data =
    detail?.proveedor
      ? { ...(proveedor || {}), ...detail.proveedor }
      : (detail && !Array.isArray(detail) ? { ...(proveedor || {}), ...detail } : proveedor) ||
        {};
  const contactos = normalizeCollection(firstArray(detail?.contactos, data.contactos));
  const productos = firstArray(detail?.productos, data.productos, data.productosAsociados);
  const activos = firstArray(detail?.activos, data.activos, data.activosPrestados);
  const documentos = firstArray(detail?.documentos, data.documentos);
  const contactosNormalizados = contactos.map(normalizeContacto);
  const contactoPrincipal =
    contactosNormalizados.find((contacto) => contacto?.contactoPrincipal) ||
    contactosNormalizados[0] ||
    null;

  const productosCount =
    numberOrNull(data.productosAsociadosCount) ??
    numberOrNull(data.productosCount) ??
    (productos ? productos.length : null);

  const activosPrestadosCount =
    numberOrNull(data.activosPrestadosCount) ??
    numberOrNull(data.activosCount) ??
    (activos ? activos.length : null);

  const estadoProveedor = normalizeState(data);
  const telefono = data.telefono || contactoPrincipal?.telefono || "";
  const whatsapp = data.whatsapp || contactoPrincipal?.whatsapp || "";
  const correo = data.correo || contactoPrincipal?.correo || "";

  return {
    idProveedor: data.idProveedor ?? data.id ?? null,
    nombreProveedor: data.nombreProveedor ?? data.nombre ?? "",
    razonSocial: data.razonSocial ?? "",
    rfc: data.rfc ?? "",
    tipoProveedor: data.tipoProveedor || "PROVEEDOR_INFORMAL",
    categoriaPrincipal: data.categoriaPrincipal ?? "",
    notasInternas: data.notasInternas ?? "",
    contacto: data.contacto ?? contactoPrincipal?.nombre ?? "",
    contactoPrincipal,
    contactos: contactosNormalizados,
    telefono,
    whatsapp,
    correo,
    direccion: data.direccion ?? "",
    modalidadAbastecimiento: data.modalidadAbastecimiento || "ENTREGA_DOMICILIO",
    pedidoWhatsapp: data.pedidoWhatsapp === true,
    pedidoLlamada: data.pedidoLlamada === true,
    pedidoApp: data.pedidoApp === true,
    visitaRuta: data.visitaRuta === true,
    compraMostrador: data.compraMostrador === true,
    diasVisitaEntrega: data.diasVisitaEntrega ?? "",
    horarioHabitual: data.horarioHabitual ?? "",
    pedidoMinimo: data.pedidoMinimo ?? null,
    tiempoEstimadoEntrega: data.tiempoEstimadoEntrega ?? "",
    costoEnvio: data.costoEnvio ?? null,
    observacionesAbastecimiento: data.observacionesAbastecimiento ?? "",
    formaPagoPrincipal:
      data.formaPagoPrincipal || (data.manejaCredito ? "CREDITO" : "CONTADO"),
    manejaCredito:
      data.manejaCredito === true ||
      data.formaPagoPrincipal === "CREDITO" ||
      data.formaPagoPrincipal === "MIXTO",
    diasCredito: data.diasCredito ?? null,
    limiteCredito: data.limiteCredito ?? null,
    permiteDevoluciones: data.permiteDevoluciones === true,
    cambiosCaducidad: data.cambiosCaducidad === true,
    bonificaciones: data.bonificaciones === true,
    descuentosFrecuentes: data.descuentosFrecuentes === true,
    notasComerciales: data.notasComerciales ?? "",
    estadoProveedor,
    estatus: estadoProveedor === "ACTIVO",
    productosAsociadosCount: productosCount,
    activosPrestadosCount,
    productosAsociados: normalizeCollection(productos),
    activosPrestados: normalizeCollection(activos),
    documentos: normalizeCollection(documentos),
    detailLoaded: Boolean(detail),
    ultimaCompra: data.ultimaCompra ?? data.fechaUltimaCompra ?? "",
    ultimaActividad:
      data.ultimaActividad ??
      data.fechaModificacion ??
      data.fechaCreacion ??
      "",
    raw: data,
    detail,
  };
};

export const createProveedorForm = (proveedor = null) => {
  if (!proveedor) {
    return {
      idProveedor: null,
      nombreProveedor: "",
      razonSocial: "",
      rfc: "",
      tipoProveedor: "PROVEEDOR_INFORMAL",
      categoriaPrincipal: "",
      estadoProveedor: "ACTIVO",
      notasInternas: "",
      tieneDireccion: false,
      direccion: "",
      ...parseAddressText(""),
      contactos: [createEmptyContact(true)],
      modalidadAbastecimiento: "ENTREGA_DOMICILIO",
      pedidoWhatsapp: false,
      pedidoLlamada: false,
      pedidoApp: false,
      visitaRuta: false,
      compraMostrador: false,
      requiereRecurrencia: false,
      diasVisitaEntrega: "",
      diasVisitaModo: "SEMANA",
      diasSemanaVisita: [],
      diasMesVisita: [],
      horarioHabitual: "",
      horarioModo: "RANGO",
      horarioInicio: "",
      horarioFin: "",
      pedidoMinimo: null,
      requiereAnticipacion: false,
      tiempoEstimadoEntrega: "",
      anticipacionCantidad: null,
      anticipacionUnidad: "HORAS",
      anticipacionContexto: "ENTREGA_RECURRENTE",
      costoEnvio: null,
      observacionesAbastecimiento: "",
      formaPagoPrincipal: "CONTADO",
      manejaCredito: false,
      diasCredito: null,
      limiteCredito: null,
      permiteDevoluciones: false,
      cambiosCaducidad: false,
      bonificaciones: false,
      descuentosFrecuentes: false,
      notasComerciales: "",
    };
  }

  const base = proveedor.raw || proveedor;
  const visitDays = parseVisitDaysText(proveedor.diasVisitaEntrega || "");
  const schedule = parseScheduleText(proveedor.horarioHabitual || "");
  const leadTime = parseLeadTimeText(proveedor.tiempoEstimadoEntrega || "");
  const address = parseAddressText(proveedor.direccion || "");
  const hasAddress = Boolean(trim(proveedor.direccion));
  const hasRecurrence = Boolean(trim(proveedor.diasVisitaEntrega) || trim(proveedor.horarioHabitual));
  const hasAnticipation = Boolean(trim(proveedor.tiempoEstimadoEntrega));
  const contactos =
    proveedor.contactos?.length > 0
      ? proveedor.contactos.map(normalizeContacto)
      : [
          normalizeContacto({
            nombre: proveedor.contacto,
            telefono: proveedor.telefono,
            whatsapp: proveedor.whatsapp,
            correo: proveedor.correo,
            contactoPrincipal: true,
            rol: "VENDEDOR",
          }),
        ];

  if (!contactos.some((contacto) => contacto.contactoPrincipal) && contactos[0]) {
    contactos[0].contactoPrincipal = true;
  }

  return {
    idProveedor: proveedor.idProveedor,
    nombreProveedor: proveedor.nombreProveedor || "",
    razonSocial: proveedor.razonSocial || "",
    rfc: proveedor.rfc || "",
    tipoProveedor: proveedor.tipoProveedor || "PROVEEDOR_INFORMAL",
    categoriaPrincipal: proveedor.categoriaPrincipal || "",
    estadoProveedor: proveedor.estadoProveedor || "ACTIVO",
    notasInternas: proveedor.notasInternas || base.notasInternas || "",
    tieneDireccion: hasAddress,
    direccion: proveedor.direccion || "",
    ...address,
    contactos,
    modalidadAbastecimiento: proveedor.modalidadAbastecimiento || "ENTREGA_DOMICILIO",
    pedidoWhatsapp: proveedor.pedidoWhatsapp || false,
    pedidoLlamada: proveedor.pedidoLlamada || false,
    pedidoApp: proveedor.pedidoApp || false,
    visitaRuta: proveedor.visitaRuta || false,
    compraMostrador: proveedor.compraMostrador || false,
    requiereRecurrencia: hasRecurrence,
    diasVisitaEntrega: proveedor.diasVisitaEntrega || "",
    ...visitDays,
    horarioHabitual: proveedor.horarioHabitual || "",
    ...schedule,
    pedidoMinimo: numberOrNull(proveedor.pedidoMinimo),
    requiereAnticipacion: hasAnticipation,
    tiempoEstimadoEntrega: proveedor.tiempoEstimadoEntrega || "",
    ...leadTime,
    costoEnvio: numberOrNull(proveedor.costoEnvio),
    observacionesAbastecimiento: proveedor.observacionesAbastecimiento || "",
    formaPagoPrincipal: proveedor.formaPagoPrincipal || "CONTADO",
    manejaCredito:
      proveedor.manejaCredito ||
      proveedor.formaPagoPrincipal === "CREDITO" ||
      proveedor.formaPagoPrincipal === "MIXTO",
    diasCredito: numberOrNull(proveedor.diasCredito),
    limiteCredito: numberOrNull(proveedor.limiteCredito),
    permiteDevoluciones: proveedor.permiteDevoluciones || false,
    cambiosCaducidad: proveedor.cambiosCaducidad || false,
    bonificaciones: proveedor.bonificaciones || false,
    descuentosFrecuentes: proveedor.descuentosFrecuentes || false,
    notasComerciales: proveedor.notasComerciales || "",
  };
};

export const getPrincipalContact = (contactos = []) =>
  contactos.find((contacto) => contacto.contactoPrincipal && trim(contacto.nombre)) ||
  contactos.find((contacto) => trim(contacto.nombre)) ||
  null;

export const buildProveedorPayload = (form) => {
  const principal = getPrincipalContact(form.contactos);
  const diasVisitaEntrega = buildVisitDaysText(
    form.diasVisitaModo,
    form.diasSemanaVisita,
    form.diasMesVisita
  );
  const horarioHabitual = buildScheduleText(
    form.horarioModo,
    form.horarioInicio,
    form.horarioFin
  );
  const tiempoEstimadoEntrega = buildLeadTimeText(
    form.anticipacionCantidad,
    form.anticipacionUnidad,
    form.anticipacionContexto
  );
  const direccion = form.tieneDireccion ? buildAddressText(form) || form.direccion : "";
  const usesCredit = form.formaPagoPrincipal === "CREDITO" || form.formaPagoPrincipal === "MIXTO";

  return {
    nombreProveedor: trim(form.nombreProveedor),
    razonSocial: trim(form.razonSocial),
    rfc: trim(form.rfc).toUpperCase(),
    tipoProveedor: form.tipoProveedor || "PROVEEDOR_INFORMAL",
    categoriaPrincipal: trim(form.categoriaPrincipal),
    estadoProveedor: form.estadoProveedor || "ACTIVO",
    notasInternas: trim(form.notasInternas),
    contacto: trim(principal?.nombre),
    telefono: trim(principal?.telefono),
    correo: trim(principal?.correo),
    direccion: trim(direccion),
    modalidadAbastecimiento: form.modalidadAbastecimiento || "ENTREGA_DOMICILIO",
    pedidoWhatsapp: Boolean(form.pedidoWhatsapp),
    pedidoLlamada: Boolean(form.pedidoLlamada),
    pedidoApp: Boolean(form.pedidoApp),
    visitaRuta: Boolean(form.visitaRuta),
    compraMostrador: Boolean(form.compraMostrador),
    diasVisitaEntrega: form.requiereRecurrencia
      ? trim(diasVisitaEntrega || form.diasVisitaEntrega)
      : "",
    horarioHabitual: form.requiereRecurrencia
      ? trim(horarioHabitual || form.horarioHabitual)
      : "",
    pedidoMinimo: numberOrNull(form.pedidoMinimo),
    tiempoEstimadoEntrega: form.requiereAnticipacion
      ? trim(tiempoEstimadoEntrega || form.tiempoEstimadoEntrega)
      : "",
    costoEnvio: numberOrNull(form.costoEnvio),
    observacionesAbastecimiento: trim(form.observacionesAbastecimiento),
    formaPagoPrincipal: form.formaPagoPrincipal || "CONTADO",
    manejaCredito: usesCredit,
    diasCredito: usesCredit ? numberOrNull(form.diasCredito) : null,
    limiteCredito: usesCredit ? numberOrNull(form.limiteCredito) : null,
    permiteDevoluciones: Boolean(form.permiteDevoluciones),
    cambiosCaducidad: Boolean(form.cambiosCaducidad),
    bonificaciones: Boolean(form.bonificaciones),
    descuentosFrecuentes: Boolean(form.descuentosFrecuentes),
    notasComerciales: trim(form.notasComerciales),
    estatus: form.estadoProveedor === "ACTIVO",
  };
};

export const buildContactoPayload = (contacto) => ({
  nombre: trim(contacto.nombre),
  rol: contacto.rol || "OTRO",
  telefono: trim(contacto.telefono),
  whatsapp: trim(contacto.whatsapp),
  correo: trim(contacto.correo),
  notas: trim(contacto.notas),
  contactoPrincipal: Boolean(contacto.contactoPrincipal),
  estadoContacto: contacto.estadoContacto || "ACTIVO",
  estatus: contacto.estadoContacto !== "INACTIVO",
});

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

export const formatDate = (value) => {
  if (!value) return "Sin dato";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin dato";
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const searchableText = (proveedor) =>
  [
    proveedor.nombreProveedor,
    proveedor.razonSocial,
    proveedor.rfc,
    proveedor.contacto,
    proveedor.contactoPrincipal?.nombre,
    proveedor.telefono,
    proveedor.whatsapp,
    proveedor.correo,
    proveedor.direccion,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const hasKnownCount = (value) => value !== null && value !== undefined;
