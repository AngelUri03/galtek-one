import { APIfetchApi } from "../API/APIfetch";
import { endpoints } from "../API/api";

const api = new APIfetchApi();

async function parseApiResponse(response, fallbackMessage) {
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

export async function fetchCashState() {
  const response = await api.fetchApi({}, "GET", null, endpoints.cashCurrentState);
  return parseApiResponse(response, "No se pudo consultar el estado del turno.");
}

export async function openCashSession({ idempotencyKey, receivedAmount, receivingDiscrepancyReason, reportOpeningDifference }) {
  const response = await api.fetchApi(
    {},
    "POST",
    { idempotencyKey, receivedAmount, receivingDiscrepancyReason, reportOpeningDifference },
    endpoints.cashOpenSession
  );
  return parseApiResponse(response, "No se pudo abrir el turno.");
}

export async function initializeCashBalance({ amount, category, reason, idempotencyKey }) {
  const response = await api.fetchApi(
    {},
    "POST",
    { amount, category, reason, idempotencyKey },
    endpoints.cashInitializeBalance
  );
  return parseApiResponse(response, "No se pudo inicializar el saldo.");
}

export async function fetchCurrentCashSessionSummary() {
  const response = await api.fetchApi({}, "GET", null, endpoints.cashCurrentSessionSummary);
  return parseApiResponse(response, "No se pudo consultar el resumen del turno.");
}

export async function revealExpectedCash() {
  const response = await api.fetchApi({}, "POST", {}, endpoints.cashRevealExpectedBalance);
  return parseApiResponse(response, "No se pudo revelar el efectivo esperado.");
}

export async function prepareCurrentCashSessionClose({ countedAmount, discrepancyReason, notes, idempotencyKey }) {
  const response = await api.fetchApi(
    {},
    "POST",
    { countedAmount, discrepancyReason, notes, idempotencyKey },
    endpoints.cashPrepareCloseSession
  );
  return parseApiResponse(response, "No se pudo preparar el corte.");
}

export async function closeCurrentCashSession({ countedAmount, discrepancyReason, notes, idempotencyKey }) {
  const response = await api.fetchApi(
    {},
    "POST",
    { countedAmount, discrepancyReason, notes, idempotencyKey },
    endpoints.cashCloseCurrentSession
  );
  return parseApiResponse(response, "No se pudo cerrar el turno.");
}

export async function registerCashEntry({ amount, category, reason, movementMedium, referenceType, referenceId, idempotencyKey }) {
  const response = await api.fetchApi(
    {},
    "POST",
    { amount, category, reason, movementMedium, referenceType, referenceId, idempotencyKey },
    endpoints.cashEntry
  );
  return parseApiResponse(response, "No se pudo registrar la entrada.");
}

export async function registerCashWithdrawal({ amount, category, reason, movementMedium, referenceType, referenceId, idempotencyKey }) {
  const response = await api.fetchApi(
    {},
    "POST",
    { amount, category, reason, movementMedium, referenceType, referenceId, idempotencyKey },
    endpoints.cashWithdrawal
  );
  return parseApiResponse(response, "No se pudo registrar el retiro.");
}

export async function fetchCashBalanceSummary() {
  const response = await api.fetchApi({}, "GET", null, endpoints.cashBalanceSummary);
  return parseApiResponse(response, "No se pudo consultar el saldo de caja.");
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function fetchCashMovements({ page = 0, size = 12, desde, hasta, q, sessionId, movementMedium } = {}) {
  const response = await api.fetchApi(
    {},
    "GET",
    null,
    `${endpoints.cashMovements}${buildQuery({ page, size, desde, hasta, q, sessionId, movementMedium, sort: "fecha", direction: "DESC" })}`,
    { logoutOnUnauthorized: false }
  );
  return parseApiResponse(response, "No se pudo consultar el historial de movimientos.");
}

export async function fetchCashSessionHistory({ page = 0, size = 8, desde, hasta, q, medium, sessionId } = {}) {
  const response = await api.fetchApi(
    {},
    "GET",
    null,
    `${endpoints.cashSessionHistory}${buildQuery({ page, size, desde, hasta, q, medium, sessionId, sort: "openedAt", direction: "DESC" })}`,
    { logoutOnUnauthorized: false }
  );
  return parseApiResponse(response, "No se pudo consultar el historial de cortes.");
}

export async function fetchCashIncidents() {
  const response = await api.fetchApi(
    {},
    "GET",
    null,
    endpoints.cashIncidents,
    { logoutOnUnauthorized: false }
  );
  return parseApiResponse(response, "No se pudieron consultar las incidencias de caja.");
}

export async function resolveCashIncident(
  id,
  { resolutionCategory, resolutionNotes, resolutionCashEffect, resolutionAmount, resolutionReference, idempotencyKey }
) {
  const response = await api.fetchApi(
    {},
    "POST",
    { resolutionCategory, resolutionNotes, resolutionCashEffect, resolutionAmount, resolutionReference, idempotencyKey },
    `${endpoints.cashIncidents}/${id}/resolver`
  );
  return parseApiResponse(response, "No se pudo resolver la incidencia.");
}

export async function fetchCashPolicy() {
  const response = await api.fetchApi({}, "GET", null, endpoints.cashPolicy);
  return parseApiResponse(response, "No se pudo consultar la politica de caja.");
}

export async function updateCashPolicy(payload) {
  const response = await api.fetchApi({}, "PUT", payload, endpoints.cashPolicy);
  return parseApiResponse(response, "No se pudo guardar la politica de caja.");
}
