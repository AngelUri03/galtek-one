export const CASH_STATUS = {
  LOADING: "LOADING",
  ERROR: "ERROR",
  BALANCE_NOT_INITIALIZED: "BALANCE_NOT_INITIALIZED",
  BALANCE_REVIEW_REQUIRED: "BALANCE_REVIEW_REQUIRED",
  NO_SESSION: "NO_SESSION",
  RECEIVING_COUNT_REQUIRED: "RECEIVING_COUNT_REQUIRED",
  OPEN: "OPEN",
  OPEN_BY_OTHER_USER: "OPEN_BY_OTHER_USER",
  HANDOFF_IN_PROGRESS: "HANDOFF_IN_PROGRESS",
  PENDING_OWNER_REVIEW: "PENDING_OWNER_REVIEW",
  SUPERVISOR_REVIEW: "SUPERVISOR_REVIEW",
  PENDING_RECONCILIATION: "PENDING_RECONCILIATION",
  CLOSED: "CLOSED",
  CLOSED_BY_SUPERVISOR: "CLOSED_BY_SUPERVISOR",
};

export function formatMXN(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShiftDuration(value, nowValue = Date.now()) {
  if (!value) return "Sin hora";
  const openedAt = new Date(value).getTime();
  if (Number.isNaN(openedAt)) return "Sin hora";
  const totalMinutes = Math.max(0, Math.floor((nowValue - openedAt) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes} min`;
  }
  return `${hours} h ${String(minutes).padStart(2, "0")} min`;
}

export function amountStringIsValid(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  if (!/^\d+(\.\d{0,2})?$/.test(text)) return false;
  return Number(text) >= 0;
}

export function normalizeAmountInput(value) {
  const raw = String(value ?? "").replace(",", ".").trim();
  if (raw === "") return "";
  if (!/^\d*(\.\d*)?$/.test(raw)) return null;
  const [whole = "", decimal = ""] = raw.split(".");
  if (decimal.length > 2) return null;
  const normalizedWhole = whole.replace(/^0+(?=\d)/, "") || "0";
  return raw.includes(".") ? `${normalizedWhole}.${decimal}` : normalizedWhole;
}

export function formatAmountInput(value) {
  if (!amountStringIsValid(value)) return value;
  return Number(value).toFixed(2);
}

export function toMoneyNumber(value) {
  if (!amountStringIsValid(value)) return null;
  return Number(Number(value).toFixed(2));
}

export function createCashIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `cash-${crypto.randomUUID()}`;
  }
  return `cash-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function appendKeypadValue(current, key) {
  const value = String(current ?? "0");
  if (key === "backspace") {
    const next = value.slice(0, -1);
    return next || "0";
  }
  if (key === "clear") return "0";
  if (key === ".") {
    return value.includes(".") ? value : `${value}.`;
  }
  if (!/^\d$/.test(key)) return value;
  if (value === "0") return key;
  return normalizeAmountInput(`${value}${key}`) ?? value;
}
