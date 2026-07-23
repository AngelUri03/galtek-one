import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  FileWarning,
  History,
  Loader2,
  Lock,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Shell from "../common/Shell";
import { useCashSession } from "../../cash/CashSessionContext";
import {
  createCashIdempotencyKey,
  formatAmountInput,
  formatMXN,
  normalizeAmountInput,
  toMoneyNumber,
} from "../../cash/cashSessionUtils";
import {
  fetchCashBalanceSummary,
  fetchCashIncidents,
  fetchCashMovements,
  fetchCashSessionHistory,
  fetchCurrentCashSessionSummary,
  registerCashEntry,
  registerCashWithdrawal,
  resolveCashIncident,
} from "../../cash/cashSessionService";
import "../../style/components/Caja/CashSession.css";

const entryCategories = [
  ["OWNER_INVESTMENT", "Aporte propietario"],
  ["CHANGE_FUND", "Fondo de cambio"],
  ["CASH_RETURNED", "Efectivo devuelto"],
  ["OTHER_ENTRY", "Otra entrada"],
];

const withdrawalCategories = [
  ["OWNER_WITHDRAWAL", "Retiro propietario"],
  ["BANK_DEPOSIT", "Deposito bancario"],
  ["STORE_EXPENSE", "Gasto tienda"],
  ["EXCESS_CASH_REMOVAL", "Retiro excedente"],
  ["OTHER_WITHDRAWAL", "Otro retiro"],
];

const entryCategoryOptions = entryCategories.map(([value, label]) => ({ value, label }));
const withdrawalCategoryOptions = withdrawalCategories.map(([value, label]) => ({ value, label }));
const historyPageSizeOptions = [8, 12, 25, 50];

const resolutionCategories = [
  {
    value: "RECOUNT_CORRECTED",
    label: "Reconteo correcto",
    effect: "HISTORICAL_RECOUNT",
    detail: "Corrige el corte con un ajuste contrario a la diferencia.",
    signs: ["short", "over", "neutral"],
  },
  {
    value: "RESPONSIBLE_REIMBURSEMENT",
    label: "Responsable paga",
    effect: "EXTERNAL_RECOVERY",
    detail: "Ingresa efectivo al saldo actual con referencia auditada.",
    signs: ["short"],
  },
  {
    value: "SHORTAGE_REPORTED",
    label: "Reportar faltante",
    effect: "REPORT_ONLY",
    detail: "Conserva la diferencia para reporte y seguimiento.",
    signs: ["short"],
  },
  {
    value: "RETURN_TO_RESPONSIBLE",
    label: "Devolver sobrante",
    effect: "EXTERNAL_RETURN",
    detail: "Retira el sobrante del saldo actual y deja evidencia.",
    signs: ["over"],
  },
  {
    value: "OVERAGE_REPORTED",
    label: "Reportar sobrante",
    effect: "REPORT_ONLY",
    detail: "Conserva el sobrante para reporte y seguimiento.",
    signs: ["over"],
  },
  {
    value: "OTHER",
    label: "Otra resolucion",
    effect: "REPORT_ONLY",
    detail: "Registra una resolucion operativa sin mover saldo actual.",
    signs: ["short", "over", "neutral"],
  },
];

const movementTypeLabels = {
  OPENING: "Apertura",
  INITIAL_BALANCE: "Saldo inicial",
  CASH_SALE: "Venta en efectivo",
  CASH_REFUND: "Devolucion",
  CARD_ENTRY: "Entrada tarjeta",
  CARD_WITHDRAWAL: "Retiro tarjeta",
  MANUAL_ENTRY: "Entrada manual",
  MANUAL_WITHDRAWAL: "Retiro manual",
  CLOSING_RECONCILIATION: "Conciliacion",
  HANDOFF_RECONCILIATION: "Conciliacion de apertura",
  INCIDENT_ADJUSTMENT: "Ajuste de incidencia",
};

const movementCategoryLabels = Object.fromEntries([
  ...entryCategories,
  ...withdrawalCategories,
  ["SALE", "Venta"],
  ["REFUND", "Devolucion"],
  ["CLOSING", "Corte"],
  ["CLOSING_OVERAGE", "Sobrante de corte"],
  ["CLOSING_SHORTAGE", "Faltante de corte"],
  ["OPENING_OVERAGE", "Sobrante de apertura"],
  ["OPENING_SHORTAGE", "Faltante de apertura"],
  ["INCIDENT_RECOUNT_SHORTAGE_CORRECTION", "Correccion por reconteo"],
  ["INCIDENT_RECOUNT_OVERAGE_CORRECTION", "Correccion por reconteo"],
  ["INCIDENT_RESPONSIBLE_REIMBURSEMENT", "Pago de responsable"],
  ["INCIDENT_OVERAGE_RETURN", "Devolucion de sobrante"],
  ["INCIDENT_ADJUSTMENT", "Ajuste de incidencia"],
]);

const incidentTypeLabels = {
  CLOSING_DIFFERENCE: "Diferencia de corte",
  HANDOFF_DIFFERENCE: "Diferencia de relevo",
  DEFERRED_HANDOFF_MISMATCH: "Diferencia de relevo",
  OTHER_CASH_DISCREPANCY: "Diferencia de apertura",
  BALANCE_REVIEW: "Revision de saldo",
};

function readAmount(value) {
  const amount = toMoneyNumber(value);
  if (amount === null || amount <= 0) return null;
  return amount;
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateInputValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateToValue(value) {
  if (!value) return null;
  const [datePart, timePart = "00:00:00"] = String(value).split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
}

function valueToLocalDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  const seconds = String(value.getSeconds()).padStart(2, "0");
  return `${dateInputValue(value)}T${hours}:${minutes}:${seconds}`;
}

function isInvalidDateRange(from, to) {
  if (!from || !to) return false;
  const fromValue = localDateToValue(from)?.getTime();
  const toValue = localDateToValue(to)?.getTime();
  if (!Number.isFinite(fromValue) || !Number.isFinite(toValue)) return false;
  return fromValue > toValue;
}

function isMeaningfulMovement(movement) {
  const type = String(movement?.tipo || "").toUpperCase();
  const amount = Number(movement?.monto || 0);
  const hasIdentity = movement?.idMovimientoCaja || movement?.idempotencyKey || movement?.fecha;
  if (!hasIdentity || !type) return false;
  if (["OPENING", "INITIAL_BALANCE"].includes(type) && amount === 0) return false;
  return true;
}

function normalizeRows(payload) {
  return Array.isArray(payload) ? payload : [];
}

function normalizeMovementPage(payload) {
  if (Array.isArray(payload)) {
    const rows = payload.filter(isMeaningfulMovement);
    return {
      content: rows,
      totalElements: rows.length,
      totalPages: 1,
      number: 0,
      size: rows.length || 12,
    };
  }
  const content = Array.isArray(payload?.content) ? payload.content.filter(isMeaningfulMovement) : [];
  return {
    content,
    totalElements: Number(payload?.totalElements ?? content.length),
    totalPages: Number(payload?.totalPages ?? 1),
    number: Number(payload?.number ?? 0),
    size: Number(payload?.size ?? content.length ?? 12),
  };
}

function normalizeSessionHistoryPage(payload) {
  const content = Array.isArray(payload?.content) ? payload.content : Array.isArray(payload) ? payload : [];
  return {
    content,
    totalElements: Number(payload?.totalElements ?? content.length),
    totalPages: Number(payload?.totalPages ?? 1),
    number: Number(payload?.number ?? 0),
    size: Number(payload?.size ?? content.length ?? 8),
  };
}

function movementDirection(movement) {
  const explicit = String(movement?.financialDirection || "").toUpperCase();
  if (explicit === "IN" || explicit === "OUT") return explicit;
  const type = String(movement?.tipo || "").toUpperCase();
  if (["MANUAL_WITHDRAWAL", "CASH_REFUND"].includes(type)) return "OUT";
  return "IN";
}

function movementIsElectronic(movement) {
  return ["CARD_ENTRY", "CARD_WITHDRAWAL"].includes(String(movement?.tipo || "").toUpperCase());
}

function userDisplayName(user, fallback = "Responsable") {
  return user?.name || user?.username || fallback;
}

function sessionReferenceLabel(item) {
  if (!item?.idCajaSesion && !item?.sessionOpenedAt && String(item?.referenceType || "").toUpperCase() === "CASH_INCIDENT") {
    return `Ajuste de incidencia - ${formatDateTime(item?.fecha || item?.createdAt)}`;
  }
  const responsible = userDisplayName(item?.sessionResponsibleUser || item?.responsibleUser, "Responsable");
  const openedAt = item?.sessionOpenedAt || item?.openedAt || item?.fecha || item?.createdAt;
  const closedAt = item?.sessionClosedAt || item?.closedAt;
  const opened = openedAt ? formatDateTime(openedAt) : "--";
  const closed = closedAt ? formatDateTime(closedAt) : "en curso";
  return `${responsible} - Inicio ${opened} - Fin ${closed}`;
}

function historySessionKey(sessionGroup) {
  return sessionGroup?.sessionId ? `sesion-${sessionGroup.sessionId}` : `sesion-${sessionGroup?.openedAt || "sin-referencia"}`;
}

function sessionAmountLabel(sessionGroup, medium) {
  const cash = `Efec +${formatMXN(sessionGroup?.cashInAmount || 0)} / -${formatMXN(sessionGroup?.cashOutAmount || 0)}`;
  const card = `Tarj +${formatMXN(sessionGroup?.electronicInAmount || 0)} / -${formatMXN(sessionGroup?.electronicOutAmount || 0)}`;
  if (medium === "CASH") return cash;
  if (medium === "CARD") return card;
  return `${cash} | ${card}`;
}

function movementReferenceLabel(movement) {
  const referenceType = String(movement?.referenceType || "").trim().toUpperCase();
  const referenceId = String(movement?.referenceId || "").trim();
  if (!referenceId || referenceType === "CASH_SESSION") return null;
  if (["DESTINATION_ACCOUNT", "TARGET_ACCOUNT", "BANK_ACCOUNT"].includes(referenceType)) {
    return `Destino ${referenceId}`;
  }
  if (referenceType === "SALE") return `Venta ${referenceId}`;
  if (referenceType === "CASH_BALANCE") return "Saldo inicial";
  return `Ref ${referenceId}`;
}

function incidentSign(difference) {
  if (Number(difference || 0) < 0) return "short";
  if (Number(difference || 0) > 0) return "over";
  return "neutral";
}

function resolutionOptionsFor(difference) {
  const sign = incidentSign(difference);
  return resolutionCategories.filter((option) => option.signs.includes(sign));
}

function defaultResolutionAmount(difference) {
  const amount = Math.abs(Number(difference || 0));
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function moneyWhenVisible(value, visible, fallback = "Protegido") {
  if (!visible || value === null || value === undefined) return fallback;
  return formatMXN(value);
}

function SummaryCard({ icon, label, value, detail, tone = "" }) {
  return (
    <article className={`cash-summary-card ${tone}`}>
      <div className="cash-summary-card__icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
    </article>
  );
}

function MiniMetric({ label, value, tone = "" }) {
  return (
    <div className={`cash-mini-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyBlock({ icon, title, detail }) {
  return (
    <div className="cash-control-empty-block">
      {icon}
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

function AccessState({ icon, eyebrow, title, detail, action, secondaryAction, hints = [], variant = "" }) {
  return (
    <section className={`cash-control-access-state ${variant ? `is-${variant}` : ""}`}>
      <div className="cash-access-card">
        <div className="cash-access-icon">{icon}</div>
        <div className="cash-access-copy">
          {eyebrow ? <span className="cash-access-eyebrow">{eyebrow}</span> : null}
          <strong>{title}</strong>
          <p>{detail}</p>
        </div>

        {hints.length ? (
          <div className="cash-access-hints">
            {hints.map((hint) => (
              <article key={hint.title} className="cash-access-hint">
                <span>{hint.icon}</span>
                <div>
                  <strong>{hint.title}</strong>
                  <small>{hint.detail}</small>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {action || secondaryAction ? (
          <div className="cash-access-actions">
            {action}
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function NoTurnState({ onOpenSales, onRefresh, refreshing }) {
  return (
    <section className="cash-no-turn-state" aria-label="Caja sin turno abierto">
      <div className="cash-no-turn-panel">
        <div className="cash-no-turn-main">
          <span className="cash-no-turn-icon" aria-hidden="true">
            <Lock size={24} />
          </span>
          <div className="cash-no-turn-copy">
            <span>Caja sin turno</span>
            <strong>Abre un turno para usar caja</strong>
            <p>Los movimientos, cortes e incidencias se habilitan cuando Ventas inicia la operacion.</p>
          </div>
        </div>

        <div className="cash-no-turn-flow" aria-label="Flujo para habilitar caja">
          <span><b>1</b> Ventas</span>
          <span><b>2</b> Conteo inicial</span>
          <span><b>3</b> Caja activa</span>
        </div>

        <div className="cash-no-turn-actions">
          <Button
            type="button"
            className="cash-primary-button"
            icon={<ReceiptText size={16} aria-hidden="true" />}
            label="Abrir en ventas"
            onClick={onOpenSales}
          />
          <Button
            type="button"
            className="cash-secondary-button"
            icon={refreshing ? <Loader2 className="cash-spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
            label="Actualizar"
            onClick={onRefresh}
            disabled={refreshing}
          />
        </div>
      </div>
    </section>
  );
}

export default function CashControlPage() {
  const navigate = useNavigate();
  const toast = useRef(null);
  const {
    cashStatus,
    cashSession,
    pendingIncidentCount,
    policy,
    loading,
    capabilities,
    refreshCashState,
  } = useCashSession();

  const [summary, setSummary] = useState(null);
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [historySessions, setHistorySessions] = useState([]);
  const [sessionMovements, setSessionMovements] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [busy, setBusy] = useState("");
  const [loadingSessionId, setLoadingSessionId] = useState("");
  const [error, setError] = useState("");
  const [activityError, setActivityError] = useState("");
  const [incidentsError, setIncidentsError] = useState("");
  const [movementMode, setMovementMode] = useState("entry");
  const [movementMedium, setMovementMedium] = useState("CASH");
  const [movementAmount, setMovementAmount] = useState("0.00");
  const [movementCategory, setMovementCategory] = useState("OWNER_INVESTMENT");
  const [movementReason, setMovementReason] = useState("");
  const [movementQuery, setMovementQuery] = useState("");
  const [movementSearchDraft, setMovementSearchDraft] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyMedium, setHistoryMedium] = useState("ALL");
  const [historyRangeError, setHistoryRangeError] = useState("");
  const [historyPage, setHistoryPage] = useState(0);
  const [historySize, setHistorySize] = useState(8);
  const [historyMeta, setHistoryMeta] = useState({
    totalElements: 0,
    totalPages: 1,
    number: 0,
    size: 8,
  });
  const [historyScope, setHistoryScope] = useState("all");
  const [incidentToResolve, setIncidentToResolve] = useState(null);
  const [resolutionCategory, setResolutionCategory] = useState("RECOUNT_CORRECTED");
  const [resolutionCashEffect, setResolutionCashEffect] = useState("HISTORICAL_RECOUNT");
  const [resolutionAmount, setResolutionAmount] = useState("0.00");
  const [resolutionReference, setResolutionReference] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolvingIncident, setResolvingIncident] = useState(false);
  const [collapsedSessions, setCollapsedSessions] = useState(() => new Set());
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const movementKeyRef = useRef(createCashIdempotencyKey());
  const resolveKeyRef = useRef(createCashIdempotencyKey());
  const collapseSignatureRef = useRef("");
  const pageSizeRef = useRef(null);

  const isOpen = cashStatus === "OPEN";
  const canOpenCashControl = Boolean(capabilities?.canOpenCashControl);
  const accessPending = loading || cashStatus === "LOADING";
  const accessDenied = !accessPending && !canOpenCashControl;
  const canViewMovements = Boolean(capabilities?.canViewMovements || capabilities?.canViewHistory);
  const canReviewIncidents = Boolean(capabilities?.canReviewIncidents);
  const movementCategoryOptions = movementMode === "entry" ? entryCategoryOptions : withdrawalCategoryOptions;
  const movementMoney = useMemo(() => readAmount(movementAmount), [movementAmount]);
  const expectedVisible = Boolean(summary?.expectedCashVisible);
  const balanceVisible = Boolean(balanceSummary?.currentBalanceVisible);
  const sessionId = summary?.sessionId || cashSession?.id;

  const notify = useCallback((severity, summaryText, detail) => {
    toast.current?.show({ severity, summary: summaryText, detail, life: 3200 });
  }, []);

  const loadDetails = useCallback(async () => {
    if (!isOpen) return;
    if (isInvalidDateRange(historyFrom, historyTo)) {
      setActivityError("La fecha inicial no puede ser mayor a la fecha final.");
      return;
    }
    setBusy("load");
    setError("");
    setActivityError("");
    setIncidentsError("");

    try {
      const [sessionResult, balanceResult, historyResult, incidentsResult] = await Promise.allSettled([
        fetchCurrentCashSessionSummary(),
        fetchCashBalanceSummary(),
        canViewMovements
          ? fetchCashSessionHistory({
              page: historyPage,
              size: historySize,
              desde: historyFrom || undefined,
              hasta: historyTo || undefined,
              q: movementQuery,
              medium: historyMedium === "ALL" ? undefined : historyMedium,
              sessionId: historyScope === "shift" ? sessionId : undefined,
            })
          : Promise.resolve({ content: [], totalElements: 0, totalPages: 1, number: 0, size: historySize }),
        canReviewIncidents ? fetchCashIncidents() : Promise.resolve([]),
      ]);

      if (sessionResult.status === "rejected") {
        throw sessionResult.reason;
      }

      setSummary(sessionResult.value);
      if (balanceResult.status === "fulfilled") {
        setBalanceSummary(balanceResult.value);
      }
      if (historyResult.status === "fulfilled") {
        const pageInfo = normalizeSessionHistoryPage(historyResult.value);
        setHistorySessions(pageInfo.content);
        setSessionMovements({});
        setHistoryMeta(pageInfo);
        if (pageInfo.totalPages > 0 && historyPage >= pageInfo.totalPages) {
          setHistoryPage(Math.max(0, pageInfo.totalPages - 1));
        }
      } else if (canViewMovements) {
        setActivityError(historyResult.reason?.message || "No se pudo cargar historial de cortes.");
      }
      if (incidentsResult.status === "fulfilled") {
        setIncidents(normalizeRows(incidentsResult.value));
      } else if (canReviewIncidents) {
        setIncidentsError(incidentsResult.reason?.message || "No se pudieron cargar incidencias.");
      }
    } catch (err) {
      setError(err?.message || "No se pudo cargar el control de caja.");
    } finally {
      setBusy("");
    }
  }, [canReviewIncidents, canViewMovements, historyFrom, historyMedium, historyPage, historyScope, historySize, historyTo, isOpen, movementQuery, sessionId]);

  const refreshControl = useCallback(async () => {
    if (isOpen) {
      await loadDetails();
      return;
    }

    setBusy("load");
    setError("");
    try {
      await refreshCashState({ force: true });
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el estado de caja.");
    } finally {
      setBusy("");
    }
  }, [isOpen, loadDetails, refreshCashState]);

  useEffect(() => {
    refreshCashState({ force: true });
  }, [refreshCashState]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    const next = movementMode === "entry" ? "OWNER_INVESTMENT" : "OWNER_WITHDRAWAL";
    setMovementCategory(next);
  }, [movementMode]);

  useEffect(() => {
    if (!canViewMovements) return undefined;
    const handle = window.setTimeout(() => {
      setHistoryPage(0);
      setSessionMovements({});
      collapseSignatureRef.current = "";
      setMovementQuery(movementSearchDraft.trim());
    }, 320);
    return () => window.clearTimeout(handle);
  }, [canViewMovements, movementSearchDraft]);

  const applyMoneyInput = (setter) => (event) => {
    const normalized = normalizeAmountInput(event.target.value);
    if (normalized !== null) {
      setter(normalized);
      setError("");
    }
  };

  const historyTotals = useMemo(() => {
    return historySessions.reduce(
      (acc, sessionGroup) => {
        acc.cashIn += Number(sessionGroup?.cashInAmount || 0);
        acc.cashOut += Number(sessionGroup?.cashOutAmount || 0);
        acc.cardIn += Number(sessionGroup?.electronicInAmount || 0);
        acc.cardOut += Number(sessionGroup?.electronicOutAmount || 0);
        return acc;
      },
      { cashIn: 0, cashOut: 0, cardIn: 0, cardOut: 0 }
    );
  }, [historySessions]);

  const balanceLabel = balanceVisible && balanceSummary?.currentBalance !== null && balanceSummary?.currentBalance !== undefined
    ? formatMXN(balanceSummary.currentBalance)
    : "Protegido";
  const salesSummaryVisible = Boolean(summary?.salesSummaryVisible || expectedVisible);
  const expectedCardLabel = moneyWhenVisible(summary?.expectedCardAmount ?? summary?.cardSalesAmount, salesSummaryVisible, "Sin permiso");
  const cashEntriesLabel = moneyWhenVisible(summary?.cashEntriesAmount, expectedVisible, "Sin permiso");
  const cashOutflowsLabel = moneyWhenVisible(summary?.cashOutflowsAmount, expectedVisible, "Sin permiso");
  const cardEntriesLabel = moneyWhenVisible(summary?.cardEntriesAmount ?? summary?.cardSalesAmount, salesSummaryVisible, "Sin permiso");
  const cardOutflowsLabel = moneyWhenVisible(summary?.cardWithdrawalsAmount, salesSummaryVisible, "Sin permiso");
  const pendingIncidents = canReviewIncidents ? incidents.length : pendingIncidentCount;
  const totalSessionRecords = Number(historyMeta.totalElements || 0);
  const totalHistoryPages = Math.max(1, Number(historyMeta.totalPages || 1));
  const safeHistoryPage = Math.min(Math.max(1, historyPage + 1), totalHistoryPages);
  const pageStart = totalSessionRecords === 0 ? 0 : historyPage * historySize + 1;
  const pageEnd = Math.min(totalSessionRecords, historyPage * historySize + historySessions.length);
  const pageReport = totalSessionRecords === 0
    ? "Sin cortes"
    : `${pageStart}-${pageEnd} de ${totalSessionRecords}`;
  const historyPageNumbers = useMemo(() => {
    const visibleCount = Math.min(5, totalHistoryPages);
    const half = Math.floor(visibleCount / 2);
    let start = Math.max(1, safeHistoryPage - half);
    let end = Math.min(totalHistoryPages, start + visibleCount - 1);
    start = Math.max(1, end - visibleCount + 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safeHistoryPage, totalHistoryPages]);
  const canSubmitMovement = Boolean(
    !busy &&
    movementMoney !== null &&
    movementReason.trim()
  );
  const incidentDeclaredAmount =
    incidentToResolve?.incomingDeclaredAmount ??
    incidentToResolve?.outgoingDeclaredAmount ??
    null;
  const incidentDifference = Number(incidentToResolve?.differenceAmount || 0);
  const resolutionOptions = useMemo(() => resolutionOptionsFor(incidentDifference), [incidentDifference]);
  const selectedResolution = useMemo(
    () => resolutionOptions.find((option) => option.value === resolutionCategory) || resolutionOptions[0],
    [resolutionCategory, resolutionOptions]
  );
  const resolutionMoney = useMemo(() => toMoneyNumber(resolutionAmount), [resolutionAmount]);

  const openResolveDialog = (incident) => {
    const [defaultOption] = resolutionOptionsFor(Number(incident?.differenceAmount || 0));
    setIncidentToResolve(incident);
    setResolutionCategory(defaultOption?.value || "RECOUNT_CORRECTED");
    setResolutionCashEffect(defaultOption?.effect || "HISTORICAL_RECOUNT");
    setResolutionAmount(defaultResolutionAmount(incident?.differenceAmount));
    setResolutionReference("");
    setResolutionNotes("");
    setIncidentsError("");
    resolveKeyRef.current = createCashIdempotencyKey();
  };

  useEffect(() => {
    const sessionKeys = historySessions.map(historySessionKey);
    const signature = sessionKeys.join("|");
    if (collapseSignatureRef.current === signature) return;

    setCollapsedSessions(new Set(sessionKeys));
    collapseSignatureRef.current = signature;
  }, [historySessions]);

  const loadSessionMovements = useCallback(async (sessionGroup) => {
    if (!canViewMovements || !sessionGroup?.sessionId) return;
    const key = historySessionKey(sessionGroup);
    if (sessionMovements[key]) return;

    setLoadingSessionId(key);
    setActivityError("");
    try {
      const pageInfo = normalizeMovementPage(await fetchCashMovements({
        page: 0,
        size: 100,
        q: movementQuery,
        sessionId: sessionGroup.sessionId,
        movementMedium: historyMedium === "ALL" ? undefined : historyMedium,
      }));
      setSessionMovements((current) => ({
        ...current,
        [key]: pageInfo.content,
      }));
    } catch (err) {
      setActivityError(err?.message || "No se pudieron cargar los movimientos del corte.");
    } finally {
      setLoadingSessionId("");
    }
  }, [canViewMovements, historyMedium, movementQuery, sessionMovements]);

  const toggleSessionCollapse = useCallback((sessionGroup) => {
    const sessionKey = historySessionKey(sessionGroup);
    const willOpen = collapsedSessions.has(sessionKey);
    setCollapsedSessions((current) => {
      const next = new Set(current);
      if (next.has(sessionKey)) {
        next.delete(sessionKey);
      } else {
        next.add(sessionKey);
      }
      return next;
    });
    if (willOpen) {
      loadSessionMovements(sessionGroup);
    }
  }, [collapsedSessions, loadSessionMovements]);

  const applyHistorySearch = (event) => {
    event?.preventDefault?.();
    if (isInvalidDateRange(historyFrom, historyTo)) {
      setHistoryRangeError("La fecha inicial no puede ser mayor a la fecha final.");
      return;
    }
    setHistoryRangeError("");
    setHistoryPage(0);
    setSessionMovements({});
    collapseSignatureRef.current = "";
    setMovementQuery(movementSearchDraft.trim());
  };

  const updateHistoryRange = (field, value) => {
    const nextValue = valueToLocalDate(value);
    const nextFrom = field === "from" ? nextValue : historyFrom;
    const nextTo = field === "to" ? nextValue : historyTo;
    setHistoryFrom(nextFrom);
    setHistoryTo(nextTo);
    setHistoryRangeError(isInvalidDateRange(nextFrom, nextTo)
      ? "La fecha inicial no puede ser mayor a la fecha final."
      : "");
    setHistoryPage(0);
    setSessionMovements({});
    collapseSignatureRef.current = "";
  };

  const updateHistoryScope = (scope) => {
    setHistoryScope(scope);
    setHistoryPage(0);
    setSessionMovements({});
    collapseSignatureRef.current = "";
  };

  const updateHistoryMedium = (medium) => {
    setHistoryMedium(medium);
    setHistoryPage(0);
    setSessionMovements({});
    collapseSignatureRef.current = "";
  };

  const changeHistoryPage = (nextPage) => {
    const safePage = Math.max(0, Math.min(totalHistoryPages - 1, nextPage));
    if (safePage !== historyPage) {
      setHistoryPage(safePage);
      setSessionMovements({});
      collapseSignatureRef.current = "";
    }
  };

  useEffect(() => {
    if (!pageSizeOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!pageSizeRef.current?.contains(event.target)) {
        setPageSizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [pageSizeOpen]);

  const handleMovementSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const amount = movementMoney;
    if (amount === null) {
      setError("Captura un monto mayor a cero.");
      return;
    }
    if (!movementReason.trim()) {
      setError("Captura el motivo del movimiento.");
      return;
    }
    setBusy("movement");
    setError("");
    try {
      const payload = {
        amount,
        category: movementCategory,
        reason: movementReason.trim(),
        movementMedium,
        idempotencyKey: movementKeyRef.current,
      };
      if (movementMode === "entry") {
        await registerCashEntry(payload);
      } else {
        await registerCashWithdrawal(payload);
      }
      movementKeyRef.current = createCashIdempotencyKey();
      setMovementAmount("0.00");
      setMovementReason("");
      await refreshCashState({ force: true });
      await loadDetails();
      notify(
        "success",
        "Movimiento registrado",
        movementMedium === "CARD"
          ? "El movimiento electronico quedo auditado."
          : "El saldo de efectivo fue actualizado."
      );
    } catch (err) {
      setError(err?.message || "No se pudo registrar el movimiento.");
    } finally {
      setBusy("");
    }
  };

  const handleResolveIncident = async () => {
    if (!incidentToResolve || resolvingIncident) return;
    if (resolutionMoney === null) {
      setIncidentsError("Captura un monto de resolucion valido.");
      return;
    }
    if (!resolutionNotes.trim()) {
      setIncidentsError("Captura notas de resolucion para cerrar la incidencia.");
      return;
    }

    setResolvingIncident(true);
    setIncidentsError("");
    try {
      await resolveCashIncident(incidentToResolve.id, {
        resolutionCategory,
        resolutionNotes: resolutionNotes.trim(),
        resolutionCashEffect,
        resolutionAmount: resolutionMoney,
        resolutionReference: resolutionReference.trim() || undefined,
        idempotencyKey: resolveKeyRef.current,
      });
      setIncidentToResolve(null);
      setResolutionNotes("");
      setResolutionReference("");
      setResolutionAmount("0.00");
      resolveKeyRef.current = createCashIdempotencyKey();
      await refreshCashState({ force: true });
      await loadDetails();
      notify(
        "success",
        "Incidencia resuelta",
        selectedResolution?.effect === "REPORT_ONLY"
          ? "El conflicto quedo marcado para reporte."
          : "Se registro el ajuste correspondiente en caja."
      );
    } catch (err) {
      setIncidentsError(err?.message || "No se pudo resolver la incidencia.");
    } finally {
      setResolvingIncident(false);
    }
  };

  const renderMovementRow = (movement, { keySuffix = "" } = {}) => {
    const direction = movementDirection(movement);
    const electronic = movementIsElectronic(movement);
    const meta = [
      movementCategoryLabels[movement.category] || movement.category || "Sin categoria",
      movementReferenceLabel(movement),
      formatDateTime(movement.fecha),
    ].filter(Boolean);

    return (
      <article
        className={`cash-movement-row ${direction === "OUT" ? "is-out" : "is-in"} ${electronic ? "is-card" : ""}`}
        key={`${movement.idMovimientoCaja || movement.idempotencyKey || movement.fecha}-${keySuffix}`}
      >
        <div className="cash-movement-icon">
          {electronic
            ? <CreditCard size={16} aria-hidden="true" />
            : direction === "OUT" ? <ArrowDownCircle size={16} aria-hidden="true" /> : <ArrowUpCircle size={16} aria-hidden="true" />}
        </div>
        <div className="cash-movement-main">
          <strong>{movementTypeLabels[movement.tipo] || movement.tipo || "Movimiento"}</strong>
          <span>{movement.motivo || movementCategoryLabels[movement.category] || "Sin motivo registrado"}</span>
          <small>{meta.join(" - ")}</small>
        </div>
        <div className="cash-movement-money">
          <strong>{formatMXN(movement.monto || 0)}</strong>
          <span>{electronic ? "Banco auditado" : movement.balanceAfter !== null && movement.balanceAfter !== undefined ? formatMXN(movement.balanceAfter) : "Saldo --"}</span>
        </div>
      </article>
    );
  };

  return (
    <Shell>
      <Toast ref={toast} />

      <main className="cash-control-page">
        <section className="cash-control-header">
          <div className="cash-control-header-title">
            <WalletCards size={22} aria-hidden="true" />
            <span>CAJA</span>
          </div>
          <div className="cash-control-header-actions">
            <Button
              type="button"
              className="cash-primary-button cash-refresh-button"
              icon={busy === "load" || loading ? <Loader2 className="cash-spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
              label="Actualizar"
              onClick={refreshControl}
              disabled={Boolean(busy) || accessPending || accessDenied}
            />
          </div>
        </section>

        {accessPending ? (
          <AccessState
            icon={<Loader2 className="cash-spin" size={34} aria-hidden="true" />}
            title="Cargando permisos de caja"
            detail="Estamos validando el estado operativo y los permisos del usuario."
          />
        ) : accessDenied ? (
          <AccessState
            icon={<Lock size={34} aria-hidden="true" />}
            title="Acceso no disponible"
            detail="La pagina de Caja requiere permisos administrativos."
            action={
              <Button
                type="button"
                className="cash-secondary-button"
                icon={<ArrowLeft size={16} aria-hidden="true" />}
                label="Volver a ventas"
                onClick={() => navigate("/ventas")}
              />
            }
          />
        ) : !isOpen ? (
          <NoTurnState
            onOpenSales={() => navigate("/ventas")}
            onRefresh={refreshControl}
            refreshing={busy === "load" || accessPending}
          />
        ) : (
          <>
            <section className="cash-summary-grid" aria-label="Resumen de caja">
              <SummaryCard
                icon={<CircleDollarSign size={18} aria-hidden="true" />}
                label="Caja fisica"
                value={balanceLabel}
                detail={balanceVisible ? "Efectivo actual esperado" : "Protegido por permisos"}
                tone="is-primary is-featured"
              />
              <SummaryCard
                icon={<CreditCard size={18} aria-hidden="true" />}
                label="Tarjeta esperada"
                value={expectedCardLabel}
                detail={salesSummaryVisible ? "Cobros tarjeta del turno" : "Vista restringida"}
                tone="is-card is-featured"
              />
              <SummaryCard
                icon={<ArrowUpCircle size={18} aria-hidden="true" />}
                label="Ingresos efectivo"
                value={cashEntriesLabel}
                detail={expectedVisible ? "Ventas, entradas y ajustes" : "Sin permiso"}
                tone="is-in"
              />
              <SummaryCard
                icon={<ArrowDownCircle size={18} aria-hidden="true" />}
                label="Retiros efectivo"
                value={cashOutflowsLabel}
                detail={expectedVisible ? "Retiros, devoluciones y ajustes" : "Sin permiso"}
                tone="is-out"
              />
              <SummaryCard
                icon={<ReceiptText size={18} aria-hidden="true" />}
                label="Ingresos tarjeta"
                value={cardEntriesLabel}
                detail={`${summary?.salesCount ?? 0} venta(s) en turno`}
                tone="is-card"
              />
              <SummaryCard
                icon={<ArrowDownCircle size={18} aria-hidden="true" />}
                label="Retiros tarjeta"
                value={cardOutflowsLabel}
                detail={salesSummaryVisible ? "Devoluciones electronicas" : "Vista restringida"}
                tone="is-card-out"
              />
              <SummaryCard
                icon={<FileWarning size={18} aria-hidden="true" />}
                label="Conflictos abiertos"
                value={canReviewIncidents ? incidents.length : pendingIncidentCount}
                detail={canReviewIncidents ? "Listos para revisar" : "Vista restringida"}
                tone={Number(pendingIncidents || 0) > 0 ? "is-warning" : ""}
              />
            </section>

            <div className="cash-control-board">
              <div className="cash-left-stack">
                <form className="cash-panel cash-panel--movement" onSubmit={handleMovementSubmit}>
                  <div className="cash-panel-head">
                    <div>
                      <span>Operacion</span>
                      <strong>Movimiento manual</strong>
                    </div>
                    <div className="cash-segmented" role="group" aria-label="Tipo de movimiento">
                      <button
                        type="button"
                        className={movementMode === "entry" ? "is-active" : ""}
                        onClick={() => setMovementMode("entry")}
                      >
                        <ArrowUpCircle size={15} aria-hidden="true" />
                        Entrada
                      </button>
                      <button
                        type="button"
                        className={movementMode === "withdrawal" ? "is-active" : ""}
                        onClick={() => setMovementMode("withdrawal")}
                      >
                        <ArrowDownCircle size={15} aria-hidden="true" />
                        Retiro
                      </button>
                    </div>
                  </div>

                  <div className="cash-medium-row">
                    <span>Medio</span>
                    <div className="cash-medium-segmented" role="group" aria-label="Medio del movimiento">
                      <button
                        type="button"
                        className={movementMedium === "CASH" ? "is-active" : ""}
                        onClick={() => setMovementMedium("CASH")}
                        disabled={Boolean(busy)}
                      >
                        <CircleDollarSign size={15} aria-hidden="true" />
                        Efectivo
                      </button>
                      <button
                        type="button"
                        className={movementMedium === "CARD" ? "is-active" : ""}
                        onClick={() => setMovementMedium("CARD")}
                        disabled={Boolean(busy)}
                      >
                        <CreditCard size={15} aria-hidden="true" />
                        Tarjeta
                      </button>
                    </div>
                  </div>

                  <div className="cash-form-grid">
                    <label className="cash-field" htmlFor="cash-page-movement-amount">
                      <span>Monto</span>
                      <div className="cash-money-input-shell cash-money-input-shell--compact">
                        <span aria-hidden="true">$</span>
                        <InputText
                          id="cash-page-movement-amount"
                          value={movementAmount}
                          onChange={applyMoneyInput(setMovementAmount)}
                          onBlur={() => setMovementAmount((current) => formatAmountInput(current))}
                          onFocus={(event) => event.target.select()}
                          inputMode="decimal"
                          autoComplete="off"
                          className="cash-money-input cash-money-input--compact"
                          disabled={Boolean(busy)}
                        />
                      </div>
                    </label>
                    <label className="cash-field" htmlFor="cash-page-movement-category">
                      <span>Categoria</span>
                      <Dropdown
                        id="cash-page-movement-category"
                        className="cash-category-dropdown"
                        value={movementCategory}
                        options={movementCategoryOptions}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(event) => setMovementCategory(event.value)}
                        placeholder="Selecciona categoria"
                        panelClassName="cash-category-panel"
                        filter
                        disabled={Boolean(busy)}
                      />
                    </label>
                  </div>

                  <label className="cash-field" htmlFor="cash-page-movement-reason">
                    <span>Motivo</span>
                    <InputTextarea
                      id="cash-page-movement-reason"
                      value={movementReason}
                      onChange={(event) => setMovementReason(event.target.value)}
                      rows={3}
                      maxLength={500}
                      disabled={Boolean(busy)}
                      placeholder="Ej. Retiro para deposito, compra menor o fondo de cambio."
                    />
                  </label>

                  <Button
                    type="submit"
                    className="cash-primary-button cash-wide-button"
                    icon={busy === "movement" ? <Loader2 className="cash-spin" size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                    label={busy === "movement" ? "Registrando..." : "Registrar movimiento"}
                    disabled={!canSubmitMovement}
                  />
                </form>

                <section className="cash-panel cash-panel--incidents">
                  <div className="cash-panel-head">
                    <div>
                      <span>Conflictos</span>
                      <strong>Incidencias abiertas</strong>
                    </div>
                    <small>{canReviewIncidents ? `${incidents.length} pendiente(s)` : "Sin permiso"}</small>
                  </div>

                  {incidentsError ? (
                    <div className="cash-inline-error">
                      <AlertTriangle size={16} aria-hidden="true" />
                      <span>{incidentsError}</span>
                    </div>
                  ) : null}

                  {!canReviewIncidents ? (
                    <EmptyBlock
                      icon={<Lock size={24} aria-hidden="true" />}
                      title="Revision restringida"
                      detail="Solo usuarios autorizados pueden resolver diferencias de caja."
                    />
                  ) : incidents.length === 0 ? (
                    <EmptyBlock
                      icon={<CheckCircle2 size={24} aria-hidden="true" />}
                      title="Sin conflictos pendientes"
                      detail="Las diferencias de corte o relevo apareceran aqui."
                    />
                  ) : (
                    <div className="cash-incident-list">
                      {incidents.map((incident) => (
                        <article className="cash-incident-card" key={incident.id}>
                          <div>
                            <span>#{incident.id} - {incidentTypeLabels[incident.type] || incident.type || "Incidencia"}</span>
                            <strong>{formatMXN(incident.differenceAmount || 0)}</strong>
                            <small>{sessionReferenceLabel(incident)} - Creada {formatDateTime(incident.createdAt)}</small>
                          </div>
                          <Button
                            type="button"
                            className="cash-secondary-button"
                            icon={<ClipboardCheck size={15} aria-hidden="true" />}
                            label="Resolver"
                            onClick={() => openResolveDialog(incident)}
                            disabled={resolvingIncident}
                          />
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <section className="cash-panel cash-panel--history">
                <div className="cash-panel-head">
                  <div>
                    <span>Historial</span>
                    <strong>Movimientos de caja</strong>
                  </div>
                  <small>{canViewMovements ? `${totalSessionRecords} corte(s)` : "Sin permiso"}</small>
                </div>

                <div className="cash-history-scope" role="group" aria-label="Alcance del historial de caja">
                  <button
                    type="button"
                    className={historyScope === "all" ? "is-active" : ""}
                    onClick={() => updateHistoryScope("all")}
                  >
                    Todas las sesiones
                  </button>
                  <button
                    type="button"
                    className={historyScope === "shift" ? "is-active" : ""}
                    onClick={() => updateHistoryScope("shift")}
                  >
                    Este turno
                  </button>
                </div>

                <form className="cash-history-toolbar" onSubmit={applyHistorySearch}>
                  <div className="cash-history-medium" role="group" aria-label="Medio del historial">
                    <button
                      type="button"
                      className={historyMedium === "ALL" ? "is-active" : ""}
                      onClick={() => updateHistoryMedium("ALL")}
                      disabled={!canViewMovements}
                    >
                      Todo
                    </button>
                    <button
                      type="button"
                      className={historyMedium === "CASH" ? "is-active" : ""}
                      onClick={() => updateHistoryMedium("CASH")}
                      disabled={!canViewMovements}
                    >
                      Efectivo
                    </button>
                    <button
                      type="button"
                      className={historyMedium === "CARD" ? "is-active" : ""}
                      onClick={() => updateHistoryMedium("CARD")}
                      disabled={!canViewMovements}
                    >
                      Tarjeta
                    </button>
                  </div>
                  <label className={`cash-history-date-field ${historyRangeError ? "has-error" : ""}`} htmlFor="cash-history-from">
                    <Calendar
                      inputId="cash-history-from"
                      value={localDateToValue(historyFrom)}
                      onChange={(event) => updateHistoryRange("from", event.value)}
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="12"
                      showIcon
                      icon="pi pi-calendar"
                      showButtonBar
                      readOnlyInput
                      placeholder="Sin limite inicial"
                      className="cash-date-calendar"
                      panelClassName="cash-date-panel"
                      maxDate={localDateToValue(historyTo) || undefined}
                      disabled={!canViewMovements}
                    />
                  </label>
                  <label className={`cash-history-date-field ${historyRangeError ? "has-error" : ""}`} htmlFor="cash-history-to">
                    <Calendar
                      inputId="cash-history-to"
                      value={localDateToValue(historyTo)}
                      onChange={(event) => updateHistoryRange("to", event.value)}
                      dateFormat="dd/mm/yy"
                      showTime
                      hourFormat="12"
                      showIcon
                      icon="pi pi-calendar"
                      showButtonBar
                      readOnlyInput
                      placeholder="Sin limite final"
                      className="cash-date-calendar"
                      panelClassName="cash-date-panel"
                      minDate={localDateToValue(historyFrom) || undefined}
                      disabled={!canViewMovements}
                    />
                  </label>
                  <div className="cash-history-search-field">
                    <Search size={16} aria-hidden="true" />
                    <InputText
                      value={movementSearchDraft}
                      onChange={(event) => setMovementSearchDraft(event.target.value)}
                      placeholder="Buscar por motivo, tipo o referencia"
                      disabled={!canViewMovements}
                    />
                  </div>
                </form>
                {historyRangeError ? (
                  <div className="cash-inline-error cash-inline-error--compact">
                    <AlertTriangle size={16} aria-hidden="true" />
                    <span>{historyRangeError}</span>
                  </div>
                ) : null}

                <div className="cash-history-totals">
                  <MiniMetric label="Ingresos efectivo" value={formatMXN(historyTotals.cashIn)} tone="is-in" />
                  <MiniMetric label="Retiros efectivo" value={formatMXN(historyTotals.cashOut)} tone="is-out" />
                  <MiniMetric label="Ingresos tarjeta" value={formatMXN(historyTotals.cardIn)} tone="is-in" />
                  <MiniMetric label="Retiros tarjeta" value={formatMXN(historyTotals.cardOut)} tone="is-out" />
                </div>

                {activityError ? (
                  <div className="cash-inline-error">
                    <AlertTriangle size={16} aria-hidden="true" />
                    <span>{activityError}</span>
                  </div>
                ) : null}

                {!canViewMovements ? (
                  <EmptyBlock
                    icon={<Lock size={24} aria-hidden="true" />}
                    title="Historial restringido"
                    detail="El historial completo requiere permisos de movimientos de caja."
                  />
                ) : historySessions.length === 0 ? (
                  <EmptyBlock
                    icon={<History size={24} aria-hidden="true" />}
                    title="Sin cortes visibles"
                    detail="Ajusta el rango, medio o busqueda para consultar cortes de caja."
                  />
                ) : (
                  <div className="cash-movement-groups">
                    {historySessions.map((sessionGroup) => {
                      const sessionKey = historySessionKey(sessionGroup);
                      const collapsed = collapsedSessions.has(sessionKey);
                      const rows = sessionMovements[sessionKey] || [];
                      const loadingRows = loadingSessionId === sessionKey;
                      return (
                        <section className={`cash-session-group ${collapsed ? "is-collapsed" : ""}`} key={sessionKey}>
                          <button
                            type="button"
                            className="cash-session-toggle"
                            aria-expanded={!collapsed}
                            onClick={() => toggleSessionCollapse(sessionGroup)}
                          >
                            <ChevronDown className="cash-session-chevron" size={16} aria-hidden="true" />
                            <div>
                              <strong>{sessionReferenceLabel(sessionGroup)}</strong>
                              <span>{Number(sessionGroup.movementCount || 0)} movimiento(s) - Ultimo {formatDateTime(sessionGroup.latestAt)}</span>
                            </div>
                            <small>{sessionAmountLabel(sessionGroup, historyMedium)}</small>
                          </button>

                          {!collapsed ? (
                            <div className="cash-movement-list cash-movement-list--grouped">
                              {loadingRows ? (
                                <div className="cash-session-loading">
                                  <Loader2 className="cash-spin" size={16} aria-hidden="true" />
                                  <span>Cargando movimientos del corte</span>
                                </div>
                              ) : rows.length === 0 ? (
                                <div className="cash-session-empty">
                                  <span>Sin movimientos visibles para este filtro.</span>
                                </div>
                              ) : rows.map((movement, index) => renderMovementRow(movement, { keySuffix: `${sessionKey}-${index}` }))}
                            </div>
                          ) : null}
                        </section>
                      );
                    })}
                  </div>
                )}
                {canViewMovements ? (
                  <footer className="cash-table-footer">
                    <div className={`cash-page-size ${pageSizeOpen ? "is-open" : ""}`} ref={pageSizeRef}>
                      <button
                        type="button"
                        className="cash-page-size-control"
                        onClick={() => setPageSizeOpen((value) => !value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") setPageSizeOpen(false);
                        }}
                        disabled={busy === "load"}
                        aria-label="Cortes por pagina"
                        aria-haspopup="listbox"
                        aria-expanded={pageSizeOpen}
                      >
                        <span>{historySize}</span>
                        <ChevronDown size={14} aria-hidden="true" />
                      </button>

                      {pageSizeOpen ? (
                        <div className="cash-page-size-menu" role="listbox" aria-label="Cortes por pagina">
                          {historyPageSizeOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              role="option"
                              aria-selected={option === historySize}
                              className={`cash-page-size-option ${option === historySize ? "is-selected" : ""}`}
                              onClick={() => {
                                setHistorySize(option);
                                setHistoryPage(0);
                                setSessionMovements({});
                                setPageSizeOpen(false);
                                collapseSignatureRef.current = "";
                              }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="cash-pager" aria-label="Paginacion de cortes">
                      <Button
                        icon="pi pi-angle-double-left"
                        className="cash-page-btn"
                        onClick={() => changeHistoryPage(0)}
                        disabled={safeHistoryPage <= 1 || busy === "load"}
                        aria-label="Primera pagina"
                      />
                      <Button
                        icon="pi pi-angle-left"
                        className="cash-page-btn"
                        onClick={() => changeHistoryPage(historyPage - 1)}
                        disabled={safeHistoryPage <= 1 || busy === "load"}
                        aria-label="Pagina anterior"
                      />
                      {historyPageNumbers.map((pageNumber) => (
                        <Button
                          key={pageNumber}
                          label={String(pageNumber)}
                          className={`cash-page-btn cash-page-number ${pageNumber === safeHistoryPage ? "is-current" : ""}`}
                          onClick={() => changeHistoryPage(pageNumber - 1)}
                          aria-current={pageNumber === safeHistoryPage ? "page" : undefined}
                          aria-label={`Pagina ${pageNumber}`}
                          disabled={busy === "load"}
                        />
                      ))}
                      <Button
                        icon="pi pi-angle-right"
                        className="cash-page-btn"
                        onClick={() => changeHistoryPage(historyPage + 1)}
                        disabled={safeHistoryPage >= totalHistoryPages || busy === "load"}
                        aria-label="Pagina siguiente"
                      />
                      <Button
                        icon="pi pi-angle-double-right"
                        className="cash-page-btn"
                        onClick={() => changeHistoryPage(totalHistoryPages - 1)}
                        disabled={safeHistoryPage >= totalHistoryPages || busy === "load"}
                        aria-label="Ultima pagina"
                      />
                    </div>

                    <span className="cash-page-report">{pageReport}</span>
                  </footer>
                ) : null}
              </section>
            </div>
          </>
        )}

        {error ? (
          <div className="cash-control-error" role="alert">
            <AlertTriangle size={17} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
      </main>

      <Dialog
        visible={Boolean(incidentToResolve)}
        onHide={() => setIncidentToResolve(null)}
        modal
        blockScroll
        draggable={false}
        className="cash-resolve-dialog"
        header={
          <div className="cash-resolve-title">
            <span>Incidencia de caja</span>
            <strong>Resolver conflicto #{incidentToResolve?.id}</strong>
            <small>
              {incidentTypeLabels[incidentToResolve?.type] || incidentToResolve?.type || "Revision de caja"} - {sessionReferenceLabel(incidentToResolve)}
            </small>
          </div>
        }
        footer={
          <div className="cash-resolve-footer">
            <Button
              type="button"
              className="cash-secondary-button"
              label="Cancelar"
              onClick={() => setIncidentToResolve(null)}
              disabled={resolvingIncident}
            />
            <Button
              type="button"
              className="cash-primary-button"
              label={resolvingIncident ? "Resolviendo..." : "Resolver incidencia"}
              icon={resolvingIncident ? <Loader2 className="cash-spin" size={16} aria-hidden="true" /> : <ClipboardCheck size={16} aria-hidden="true" />}
              onClick={handleResolveIncident}
              disabled={resolvingIncident || resolutionMoney === null || !resolutionNotes.trim()}
            />
          </div>
        }
      >
        <div className="cash-resolve-body">
          <section className={`cash-resolve-difference ${incidentDifference < 0 ? "is-short" : "is-over"}`}>
            <span>Diferencia detectada</span>
            <strong>{formatMXN(incidentDifference)}</strong>
            <small>Creada {formatDateTime(incidentToResolve?.createdAt)} bajo politica {incidentToResolve?.policySnapshot || policy || "CONTINUITY_FIRST"}</small>
          </section>

          <div className="cash-incident-summary">
            <MiniMetric label="Esperado" value={formatMXN(incidentToResolve?.expectedAmount || 0)} />
            <MiniMetric label="Declarado" value={incidentDeclaredAmount !== null ? formatMXN(incidentDeclaredAmount) : "--"} />
            <MiniMetric label="Aceptado" value={formatMXN(incidentToResolve?.acceptedAmount || 0)} />
          </div>

          <div className="cash-field">
            <span>Categoria de resolucion</span>
            <div className="cash-resolution-options" role="group" aria-label="Categoria de resolucion">
              {resolutionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={resolutionCategory === option.value ? "is-active" : ""}
                  onClick={() => {
                    setResolutionCategory(option.value);
                    setResolutionCashEffect(option.effect);
                  }}
                  disabled={resolvingIncident}
                >
                  <span>{option.label}</span>
                  <small>{option.detail}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="cash-resolution-guidance">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>{selectedResolution?.detail || "La resolucion queda auditada sin modificar el saldo actual."}</span>
          </div>

          <div className="cash-resolution-detail-grid">
            <label className="cash-field" htmlFor="cash-resolution-amount">
              <span>Monto resuelto</span>
              <div className="cash-money-input-shell cash-money-input-shell--compact">
                <span aria-hidden="true">$</span>
                <InputText
                  id="cash-resolution-amount"
                  value={resolutionAmount}
                  onChange={(event) => {
                    const normalized = normalizeAmountInput(event.target.value);
                    if (normalized !== null) {
                      setResolutionAmount(normalized);
                      setIncidentsError("");
                    }
                  }}
                  onBlur={() => setResolutionAmount((current) => formatAmountInput(current))}
                  inputMode="decimal"
                  autoComplete="off"
                  className="cash-money-input cash-money-input--compact"
                  disabled={resolvingIncident}
                />
              </div>
            </label>
            <label className="cash-field" htmlFor="cash-resolution-reference">
              <span>Referencia</span>
              <InputText
                id="cash-resolution-reference"
                value={resolutionReference}
                onChange={(event) => setResolutionReference(event.target.value)}
                maxLength={160}
                autoComplete="off"
                disabled={resolvingIncident}
                placeholder="Ej. Reconteo con encargado, pago del responsable."
              />
            </label>
          </div>

          <label className="cash-field" htmlFor="cash-resolution-notes">
            <span>Notas de resolucion</span>
            <InputTextarea
              id="cash-resolution-notes"
              value={resolutionNotes}
              onChange={(event) => setResolutionNotes(event.target.value)}
              rows={3}
              maxLength={500}
              disabled={resolvingIncident}
              placeholder="Ej. Se verifico conteo fisico, ticket relacionado y autorizacion del encargado."
            />
          </label>

          {incidentsError ? (
            <div className="cash-inline-error" role="alert">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{incidentsError}</span>
            </div>
          ) : null}
        </div>
      </Dialog>
    </Shell>
  );
}
