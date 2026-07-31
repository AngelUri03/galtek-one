import { APIfetchApi } from "../API/APIfetch";
import { endpoints } from "../API/api";

const api = new APIfetchApi();

export const FIXED_PAYMENT_METHODS = [
  { codigo: "TERMINAL", nombre: "Terminal", tipo: "TERMINAL", orden: 1 },
  { codigo: "EFECTIVO", nombre: "Efectivo", tipo: "CASH", orden: 2 },
  { codigo: "TARJETA", nombre: "Tarjeta", tipo: "CARD", orden: 3 },
  { codigo: "VALES", nombre: "Vales", tipo: "VOUCHER", orden: 4 },
];

export const PAYMENT_DEFAULTS = {
  terminalEnabled: true,
  terminalProvider: "MERCADO_PAGO",
  terminalName: "Mercado Pago",
  terminalIdentifier: "",
  terminalSerial: "",
  terminalStoreId: "",
  terminalAccount: "",
  terminales: [
    {
      key: "terminal_1",
      nombre: "Mercado Pago",
      provider: "MERCADO_PAGO",
      identifier: "",
      serial: "",
      storeId: "",
      account: "",
      enabled: true,
      commissionEnabled: true,
      commissionPercent: 0,
    },
  ],
  terminalPriority: 1,
  terminalCommissionEnabled: true,
  terminalCommissionPercent: 0,
  terminalRequireReference: true,
  cashRoundingDefaultEnabled: true,
  cardBankName: "",
  cardHolderName: "",
  cardNumber: "",
  cardAccount: "",
  cardInstructions: "",
  voucherIssuer: "",
  voucherInstructions: "",
  voucherRequireFolio: true,
  voucherRequireAuthorization: true,
  metodosPago: [],
};

export async function parseApiResponse(response, fallbackMessage) {
  if (!response) {
    const error = new Error("No se pudo contactar al servidor.");
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status === "ERROR") {
    const rawMessage = payload?.message || fallbackMessage;
    const [maybeCode, ...messageParts] = String(rawMessage || "").split(":");
    const error = new Error(messageParts.length ? messageParts.join(":").trim() : rawMessage);
    error.code = messageParts.length ? maybeCode.trim() : payload?.data?.code || `HTTP_${response.status}`;
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? null;
}

export function normalizePaymentConfig(payload = {}) {
  const config = { ...PAYMENT_DEFAULTS, ...(payload || {}) };
  const terminales = normalizeTerminales(config.terminales?.length ? config.terminales : [legacyTerminal(config)]);
  const firstTerminal = terminales.find((terminal) => terminal.enabled !== false) || terminales[0];
  const terminalPercent = Number(firstTerminal?.commissionPercent ?? config.terminalCommissionPercent);

  return {
    ...config,
    terminalEnabled: config.terminalEnabled !== false,
    terminalProvider: firstTerminal?.provider || config.terminalProvider || PAYMENT_DEFAULTS.terminalProvider,
    terminalName: firstTerminal?.nombre || config.terminalName || PAYMENT_DEFAULTS.terminalName,
    terminalIdentifier: firstTerminal?.identifier || config.terminalIdentifier || "",
    terminalSerial: firstTerminal?.serial || config.terminalSerial || "",
    terminalStoreId: firstTerminal?.storeId || config.terminalStoreId || "",
    terminalAccount: firstTerminal?.account || config.terminalAccount || "",
    terminales,
    terminalPriority: 1,
    terminalCommissionEnabled: firstTerminal?.commissionEnabled !== false && config.terminalCommissionEnabled !== false,
    terminalCommissionPercent: Number.isFinite(terminalPercent) ? terminalPercent : 0,
    terminalRequireReference: config.terminalRequireReference !== false,
    cashRoundingDefaultEnabled: config.cashRoundingDefaultEnabled !== false,
    cardBankName: config.cardBankName || "",
    cardHolderName: config.cardHolderName || "",
    cardNumber: config.cardNumber || "",
    cardAccount: config.cardAccount || "",
    cardInstructions: config.cardInstructions || "",
    voucherIssuer: config.voucherIssuer || "",
    voucherInstructions: config.voucherInstructions || "",
    voucherRequireFolio: config.voucherRequireFolio !== false,
    voucherRequireAuthorization: config.voucherRequireAuthorization !== false,
    metodosPago: mergeFixedMethods(config.metodosPago),
  };
}

export function normalizePaymentMethod(method = {}) {
  const nombre = method.nombreMetodoPago || method.nombre || "";
  const codigo = normalizePaymentCode(method.codigo || nombre);
  return {
    ...method,
    idMetodoPago: method.idMetodoPago ?? method.id ?? null,
    id: method.idMetodoPago ?? method.id ?? null,
    nombre,
    nombreMetodoPago: nombre,
    codigo,
    code: codigo,
    tipo: normalizePaymentType(method.tipo || codigo || nombre),
    orden: Number.isFinite(Number(method.orden)) ? Number(method.orden) : 999,
    estatus: method.estatus !== false,
    visiblePos: method.visiblePos !== false,
    requiereReferencia: method.requiereReferencia === true,
    requiereVerificacion: method.requiereVerificacion === true,
    comisionPorcentaje: Number(method.comisionPorcentaje || 0),
    terminalProvider: method.terminalProvider || "",
    terminalNombre: method.terminalNombre || "",
    cuentaDestino: method.cuentaDestino || "",
  };
}

export function normalizeTerminal(terminal = {}, index = 0) {
  const provider = normalizeProvider(terminal.provider || terminal.terminalProvider || "MERCADO_PAGO");
  return {
    key: normalizeTerminalKey(terminal.key) || `terminal_${index + 1}`,
    nombre: terminal.nombre || terminal.terminalNombre || providerLabel(provider),
    provider,
    identifier: terminal.identifier || terminal.terminalIdentifier || "",
    serial: terminal.serial || terminal.terminalSerial || "",
    storeId: terminal.storeId || terminal.terminalStoreId || "",
    account: terminal.account || terminal.terminalAccount || "",
    enabled: terminal.enabled !== false,
    commissionEnabled: terminal.commissionEnabled !== false,
    commissionPercent: Number.isFinite(Number(terminal.commissionPercent))
      ? Number(terminal.commissionPercent)
      : 0,
  };
}

export function normalizeTerminales(list = []) {
  const normalized = (Array.isArray(list) ? list : [])
    .slice(0, 3)
    .map(normalizeTerminal);
  return normalized.length ? normalized : [...PAYMENT_DEFAULTS.terminales];
}

export function normalizePaymentCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizePaymentType(value) {
  const code = normalizePaymentCode(value);
  if (["CASH", "TERMINAL", "CARD", "VOUCHER"].includes(code)) return code;
  if (code.includes("EFECTIVO") || code.includes("CASH")) return "CASH";
  if (code.includes("TERMINAL") || code.includes("MERCADO_PAGO")) return "TERMINAL";
  if (code.includes("TARJETA") || code.includes("CREDITO") || code.includes("DEBITO") || code.includes("CARD")) {
    return "CARD";
  }
  if (code.includes("VALE") || code.includes("VOUCHER")) return "VOUCHER";
  return "CARD";
}

export function normalizeProvider(value) {
  const code = normalizePaymentCode(value);
  return ["MERCADO_PAGO", "CLIP", "CONEKTA", "BANCO"].includes(code) ? code : "MERCADO_PAGO";
}

export function providerLabel(provider) {
  return {
    MERCADO_PAGO: "Mercado Pago",
    CLIP: "Clip",
    CONEKTA: "Conekta",
    BANCO: "Banco",
  }[provider] || "Mercado Pago";
}

export function normalizeTerminalKey(value) {
  return normalizePaymentCode(value).toLowerCase();
}

export async function fetchPaymentConfig() {
  const response = await api.fetchApi({}, "GET", null, endpoints.paymentConfig);
  const payload = await parseApiResponse(response, "No se pudo consultar la configuracion de pagos.");
  return normalizePaymentConfig(payload);
}

export async function updatePaymentConfig(payload) {
  const response = await api.fetchApi({}, "PUT", payload, endpoints.paymentConfig);
  const data = await parseApiResponse(response, "No se pudo guardar la configuracion de pagos.");
  return normalizePaymentConfig(data);
}

function mergeFixedMethods(methods = []) {
  const normalized = (Array.isArray(methods) ? methods : []).map(normalizePaymentMethod);
  return FIXED_PAYMENT_METHODS.map((fixed) => {
    const existing = normalized.find((method) => method.codigo === fixed.codigo);
    return normalizePaymentMethod({
      ...fixed,
      ...(existing || {}),
      nombre: fixed.nombre,
      nombreMetodoPago: fixed.nombre,
      codigo: fixed.codigo,
      tipo: fixed.tipo,
      orden: fixed.orden,
      visiblePos: true,
    });
  });
}

function legacyTerminal(config) {
  return {
    key: "terminal_1",
    nombre: config.terminalName || "Mercado Pago",
    provider: config.terminalProvider || "MERCADO_PAGO",
    identifier: config.terminalIdentifier || "",
    serial: config.terminalSerial || "",
    storeId: config.terminalStoreId || "",
    account: config.terminalAccount || "",
    enabled: true,
    commissionEnabled: config.terminalCommissionEnabled !== false,
    commissionPercent: Number(config.terminalCommissionPercent || 0),
  };
}
