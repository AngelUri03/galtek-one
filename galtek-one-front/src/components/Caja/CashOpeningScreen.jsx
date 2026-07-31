import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Loader2,
  Monitor,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useCashSession } from "../../cash/CashSessionContext";
import {
  amountStringIsValid,
  createCashIdempotencyKey,
  formatAmountInput,
  formatMXN,
  normalizeAmountInput,
  toMoneyNumber,
} from "../../cash/cashSessionUtils";

export default function CashOpeningScreen() {
  const {
    currentBalance,
    openCashSession,
    opening,
    error,
    refreshCashState,
    policy,
    pendingIncidentCount,
    requiresReceivingCount,
    incomingCount,
    capabilities,
    station,
  } = useCashSession();
  const [submitError, setSubmitError] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receivingReason, setReceivingReason] = useState("");
  const [reportDifference, setReportDifference] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const openButtonRef = useRef(null);
  const idempotencyKeyRef = useRef(createCashIdempotencyKey());
  const submittingRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => openButtonRef.current?.focus?.(), 80);
    return () => window.clearTimeout(id);
  }, []);

  const stationName = station?.displayName || "Punto de venta";
  const canViewExpectedBalance = Boolean(capabilities?.canViewExpectedBalance);
  const canReviewIncidents = Boolean(capabilities?.canReviewIncidents);
  const inheritedBalance =
    canViewExpectedBalance && currentBalance !== null && currentBalance !== undefined
      ? Number(currentBalance || 0)
      : null;
  const hasIncomingExpected = incomingCount?.expectedAmount !== null && incomingCount?.expectedAmount !== undefined;
  const expectedIncoming =
    canViewExpectedBalance && (hasIncomingExpected || inheritedBalance !== null)
      ? Number(hasIncomingExpected ? incomingCount.expectedAmount : inheritedBalance ?? 0)
      : null;
  const previousCashier =
    incomingCount?.previousCashier?.name ||
    incomingCount?.previousCashier?.username ||
    "cajero anterior";
  const countMode = requiresReceivingCount || reportDifference;
  const receivedMoney = useMemo(() => toMoneyNumber(receivedAmount), [receivedAmount]);
  const incomingDifference = countMode && expectedIncoming !== null && receivedMoney !== null
    ? Number((receivedMoney - expectedIncoming).toFixed(2))
    : null;
  const hasKnownOpeningDifference = incomingDifference !== null && incomingDifference !== 0;
  const differenceIsProtected = countMode && expectedIncoming === null;
  const showDifferenceReason = hasKnownOpeningDifference || differenceIsProtected;
  const requiresDifferenceReason = hasKnownOpeningDifference;
  const willSendOpeningCount =
    requiresReceivingCount || (reportDifference && (differenceIsProtected || hasKnownOpeningDifference));
  const willReportOpeningDifference =
    reportDifference && (differenceIsProtected || hasKnownOpeningDifference);
  const canSubmit = Boolean(
    !opening &&
    (!countMode ||
      (receivedMoney !== null &&
        amountStringIsValid(receivedAmount) &&
        (!requiresDifferenceReason || receivingReason.trim())))
  );
  const dateLabel = now.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const timeLabel = now.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    if (!requiresReceivingCount || expectedIncoming === null) return;
    setReceivedAmount(formatAmountInput(String(Number(expectedIncoming || 0))));
  }, [expectedIncoming, requiresReceivingCount]);

  useEffect(() => {
    if (requiresReceivingCount || reportDifference) return;
    setReceivedAmount("");
    setReceivingReason("");
  }, [reportDifference, requiresReceivingCount]);

  const toggleReportMode = () => {
    const nextValue = !reportDifference;
    setReportDifference(nextValue);
    setSubmitError("");
    if (nextValue) {
      setReceivingReason("");
      if (expectedIncoming !== null) {
        setReceivedAmount(formatAmountInput(String(Number(expectedIncoming || 0))));
      }
      return;
    }
    setReceivedAmount("");
    setReceivingReason("");
  };

  const handleSubmit = async () => {
    if (opening || submittingRef.current) return;
    setSubmitError("");
    if (countMode) {
      if (receivedMoney === null || !amountStringIsValid(receivedAmount)) {
        setSubmitError("Captura el efectivo contado con maximo dos decimales.");
        return;
      }
      if (requiresDifferenceReason && !receivingReason.trim()) {
        setSubmitError("Captura el motivo de la diferencia de apertura.");
        return;
      }
    }
    submittingRef.current = true;
    try {
      const reason = receivingReason.trim();
      await openCashSession({
        idempotencyKey: idempotencyKeyRef.current,
        receivedAmount: willSendOpeningCount ? receivedMoney : undefined,
        receivingDiscrepancyReason: willSendOpeningCount && reason ? reason : undefined,
        reportOpeningDifference: willReportOpeningDifference,
      });
    } catch (err) {
      setSubmitError(err?.message || "No se pudo abrir el turno.");
    } finally {
      submittingRef.current = false;
    }
  };

  const policyLabels = {
    CONTINUITY_FIRST: "Continuidad primero",
    STRICT_SUPERVISED: "Revision estricta",
  };
  const policyLabel = policyLabels[policy] || "Continuidad primero";
  const balanceLabel = inheritedBalance === null ? "Protegido" : formatMXN(inheritedBalance);
  const countedLabel = receivedMoney === null ? "--" : formatMXN(receivedMoney);
  const openingWillCreateIncident = hasKnownOpeningDifference || (reportDifference && differenceIsProtected);
  const primaryLabel = openingWillCreateIncident
    ? opening ? "Abriendo y reportando..." : "Abrir y reportar"
    : opening ? "Abriendo turno..." : "Abrir turno";
  const controlLabel = openingWillCreateIncident
    ? "Con incidencia"
    : differenceIsProtected
      ? "Conteo protegido"
      : "Sin incidencia";
  const actionTitle = reportDifference
    ? hasKnownOpeningDifference
      ? "Apertura con diferencia"
      : differenceIsProtected
        ? "Conteo de apertura"
        : "Sin diferencia real"
    : "Listo para abrir";
  const actionDetail = openingWillCreateIncident
    ? "Se registrara la diferencia al iniciar el turno."
    : "No se registrara movimiento de dinero.";
  const differenceTone = incomingDifference === null || incomingDifference === 0
    ? "is-even"
    : incomingDifference > 0
      ? "is-over"
      : "is-short";

  return (
    <main className="cash-opening-page cash-opening-dashboard-page cash-opening-premium-page">
      <form
        className={`cash-opening-console ${reportDifference ? "is-reporting" : ""}`}
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <section className="cash-opening-command-panel">
          <div className="cash-opening-command-top">
            <div className="cash-brand-mark">
              <span>GaltekOne</span>
              <strong>POS</strong>
            </div>
            <div className="cash-opening-time-chip">
              <Clock size={15} aria-hidden="true" />
              <span>{dateLabel} - {timeLabel}</span>
            </div>
          </div>

          <div className="cash-opening-command-body">
            <div className="cash-opening-copy">
              <span className="cash-eyebrow">Inicio operativo</span>
              <h1>Apertura de caja</h1>
              <p>
                Confirma la fotografia inicial del efectivo antes de vender. Si el conteo real no coincide,
                abre el turno con incidencia para dejar evidencia desde el primer minuto.
              </p>
            </div>

            <div className="cash-opening-control-strip" aria-label="Pasos de apertura">
              <div>
                <Wallet size={18} aria-hidden="true" />
                <span>Saldo base</span>
                <strong>{balanceLabel}</strong>
              </div>
              <div>
                <Monitor size={18} aria-hidden="true" />
                <span>Estacion</span>
                <strong>{stationName}</strong>
              </div>
              <div>
                <ShieldCheck size={18} aria-hidden="true" />
                <span>Control</span>
                <strong>{controlLabel}</strong>
              </div>
            </div>
          </div>

          <div className="cash-opening-action-dock">
            <div className="cash-opening-action-copy">
              <span>{actionTitle}</span>
              <strong>{actionDetail}</strong>
            </div>
            <div className="cash-opening-action-buttons">
              <Button
                ref={openButtonRef}
                type="submit"
                className="cash-primary-button cash-open-main-button"
                disabled={!canSubmit}
                label={primaryLabel}
                icon={opening ? <Loader2 className="cash-spin" size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
              />
              {!requiresReceivingCount ? (
                <Button
                  type="button"
                  className={`cash-secondary-button cash-open-report-button ${reportDifference ? "is-active" : ""}`}
                  disabled={opening}
                  label={reportDifference ? "Cancelar reporte" : "Reportar diferencia"}
                  icon={<AlertTriangle size={17} aria-hidden="true" />}
                  onClick={toggleReportMode}
                />
              ) : null}
            </div>
          </div>
        </section>

        <aside className="cash-opening-register-panel">
          <section className="cash-opening-balance-display" aria-label="Saldo continuo">
            <div className="cash-opening-balance-icon">
              <Wallet size={26} aria-hidden="true" />
            </div>
            <div>
              <span>{inheritedBalance === null ? "Saldo protegido" : "Caja fisica esperada"}</span>
              <strong>{balanceLabel}</strong>
              {inheritedBalance !== null ? <small>Efectivo esperado al abrir turno</small> : <small>Requiere permiso para verlo</small>}
            </div>
          </section>

          {countMode ? (
            <section className={`cash-opening-report-panel ${reportDifference ? "is-report" : ""}`}>
              <div className="cash-opening-report-head">
                <AlertTriangle size={18} aria-hidden="true" />
                <span>{requiresReceivingCount ? "Conteo entrante requerido" : "Reporte de diferencia"}</span>
                <strong>{requiresReceivingCount ? `Relevo de ${previousCashier}` : "Cuenta el efectivo real antes de abrir"}</strong>
              </div>

              <label className="cash-amount-field" htmlFor="cash-received-count">
                <span className="cash-amount-field__label">Efectivo contado</span>
                <div className="cash-money-input-shell cash-money-input-shell--compact">
                  <span aria-hidden="true">$</span>
                  <InputText
                    id="cash-received-count"
                    value={receivedAmount}
                    onChange={(event) => {
                      const normalized = normalizeAmountInput(event.target.value);
                      if (normalized !== null) {
                        setReceivedAmount(normalized);
                        setSubmitError("");
                      }
                    }}
                    onBlur={() => {
                      if (amountStringIsValid(receivedAmount)) {
                        setReceivedAmount(formatAmountInput(receivedAmount));
                      }
                    }}
                    inputMode="decimal"
                    autoComplete="off"
                    className="cash-money-input cash-money-input--compact"
                    disabled={opening}
                  />
                </div>
              </label>

              <div className="cash-opening-count-summary">
                <span>Contado</span>
                <strong>{countedLabel}</strong>
              </div>

              {incomingDifference !== null ? (
                <div className={`cash-open-difference cash-opening-difference ${differenceTone}`}>
                  <span>Diferencia vs saldo continuo</span>
                  <strong>{formatMXN(incomingDifference)}</strong>
                </div>
              ) : null}

              {showDifferenceReason ? (
                <label className="cash-amount-field" htmlFor="cash-received-reason">
                  <span className="cash-amount-field__label">
                    {requiresDifferenceReason ? "Motivo de diferencia" : "Motivo si hay diferencia"}
                  </span>
                  <InputTextarea
                    id="cash-received-reason"
                    value={receivingReason}
                    onChange={(event) => setReceivingReason(event.target.value)}
                    className="cash-textarea cash-open-reason"
                    rows={3}
                    maxLength={500}
                    placeholder="Ej. Conteo fisico inicial no coincide con el saldo continuo."
                    disabled={opening}
                  />
                </label>
              ) : null}
            </section>
          ) : (
            <section className="cash-opening-clear-panel">
              <CheckCircle2 size={18} aria-hidden="true" />
              <div>
                <span>Apertura limpia</span>
                <strong>Se guardara el saldo esperado como fotografia inicial.</strong>
                <small>Usa reportar diferencia si el dinero fisico no coincide.</small>
              </div>
            </section>
          )}

          {submitError || error ? (
            <div className="cash-opening-error" role="alert">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>{submitError || error}</span>
              <button type="button" onClick={() => refreshCashState({ force: true })}>
                Reintentar
              </button>
            </div>
          ) : null}
        </aside>

        <section className="cash-opening-system-panel" aria-label="Resumen del sistema">
          <article>
            <ClipboardCheck size={18} aria-hidden="true" />
            <span>Politica</span>
            <strong>{policyLabel}</strong>
            <small>{requiresReceivingCount ? "Conteo entrante activo" : "Continuidad operativa"}</small>
          </article>
          <article>
            <AlertTriangle size={18} aria-hidden="true" />
            <span>Incidencias</span>
            <strong>{canReviewIncidents ? pendingIncidentCount || 0 : "Restringido"}</strong>
            <small>{canReviewIncidents ? "Pendientes por revisar" : "Sin permiso de revision"}</small>
          </article>
          <article>
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Ventas</span>
            <strong>Listas</strong>
            <small>Se habilitan al abrir caja</small>
          </article>
          <article>
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Auditoria</span>
            <strong>{openingWillCreateIncident ? "Con reporte" : "Automatica"}</strong>
            <small>{openingWillCreateIncident ? "Diferencia documentada" : "Snapshot de apertura"}</small>
          </article>
        </section>
      </form>
    </main>
  );
}
