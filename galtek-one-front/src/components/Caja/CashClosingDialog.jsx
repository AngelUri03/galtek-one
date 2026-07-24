import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  ReceiptText,
  X,
} from "lucide-react";
import { useCashSession } from "../../cash/CashSessionContext";
import {
  amountStringIsValid,
  createCashIdempotencyKey,
  formatAmountInput,
  formatMXN,
  formatShiftDuration,
  formatTime,
  normalizeAmountInput,
  toMoneyNumber,
} from "../../cash/cashSessionUtils";
import {
  closeCurrentCashSession,
  fetchCurrentCashSessionSummary,
  prepareCurrentCashSessionClose,
} from "../../cash/cashSessionService";

function resultLabel(result) {
  if (result === "OVERAGE") return "Sobrante";
  if (result === "SHORTAGE") return "Faltante";
  return "Corte exacto";
}

function PreviewMetric({ label, value, tone = "" }) {
  return (
    <div className={`cash-close-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function CashClosingDialog({ visible, onHide, onClosed, onNotify, returnFocusRef }) {
  const { cashSession } = useCashSession();
  const [step, setStep] = useState("count");
  const [summary, setSummary] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [countedAmount, setCountedAmount] = useState("0.00");
  const [discrepancyReason, setDiscrepancyReason] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);
  const countInputRef = useRef(null);
  const reasonRef = useRef(null);
  const closeKeyRef = useRef(createCashIdempotencyKey());

  const countedMoney = useMemo(() => toMoneyNumber(countedAmount), [countedAmount]);
  const openedAt = summary?.openedAt || cashSession?.openedAt;
  const responsible =
    summary?.responsibleUser ||
    cashSession?.openedBy ||
    {};
  const responsibleName = responsible?.name || responsible?.username || "Responsable del turno";
  const dirty = Boolean((countedAmount && countedAmount !== "0.00") || discrepancyReason || notes || preview);
  const requiresReason = Boolean(preview?.discrepancyReasonRequired);
  const canConfirmClose = Boolean(
    preview &&
    !busy &&
    (!requiresReason || discrepancyReason.trim())
  );

  const reset = useCallback(() => {
    setStep("count");
    setSummary(null);
    setPreview(null);
    setResult(null);
    setCountedAmount("0.00");
    setDiscrepancyReason("");
    setNotes("");
    setBusy("");
    setError("");
    setConfirmExit(false);
    closeKeyRef.current = createCashIdempotencyKey();
  }, []);

  useEffect(() => {
    if (!visible) return;
    reset();
    let active = true;
    setBusy("load");
    fetchCurrentCashSessionSummary()
      .then((payload) => {
        if (active) setSummary(payload);
      })
      .catch((err) => {
        if (active) setError(err?.message || "No se pudo cargar el turno para corte.");
      })
      .finally(() => {
        if (active) setBusy("");
      });

    const timer = window.setTimeout(() => countInputRef.current?.focus?.(), 120);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [reset, visible]);

  useEffect(() => {
    if (step === "review" && requiresReason) {
      const timer = window.setTimeout(() => reasonRef.current?.focus?.(), 80);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [requiresReason, step]);

  const requestClose = () => {
    if (busy) return;
    if (step !== "result" && dirty) {
      setConfirmExit(true);
      return;
    }
    reset();
    onHide?.();
    window.setTimeout(() => returnFocusRef?.current?.focus?.(), 80);
  };

  const forceClose = () => {
    reset();
    onHide?.();
    window.setTimeout(() => returnFocusRef?.current?.focus?.(), 80);
  };

  const handleAmountChange = (event) => {
    const normalized = normalizeAmountInput(event.target.value);
    if (normalized !== null) {
      setCountedAmount(normalized);
      setError("");
      setPreview(null);
    }
  };

  const handlePrepare = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (countedMoney === null || countedMoney < 0 || !amountStringIsValid(countedAmount)) {
      setError("Captura el efectivo contado con maximo dos decimales.");
      countInputRef.current?.focus?.();
      return;
    }

    setBusy("preview");
    setError("");
    setCountedAmount(formatAmountInput(countedAmount));
    try {
      const payload = await prepareCurrentCashSessionClose({
        countedAmount: countedMoney,
        idempotencyKey: closeKeyRef.current,
      });
      setPreview(payload);
      setStep("review");
    } catch (err) {
      setError(err?.message || "No se pudo preparar el corte.");
    } finally {
      setBusy("");
    }
  };

  const handleConfirmClose = async () => {
    if (!canConfirmClose) {
      if (requiresReason) {
        setError("Captura el motivo de la diferencia.");
        reasonRef.current?.focus?.();
      }
      return;
    }

    setBusy("close");
    setError("");
    try {
      const payload = await closeCurrentCashSession({
        countedAmount: countedMoney,
        discrepancyReason: discrepancyReason.trim(),
        notes: notes.trim(),
        idempotencyKey: closeKeyRef.current,
      });
      setResult(payload);
      setStep("result");
      onNotify?.({
        severity: "success",
        summary: "Turno cerrado",
        detail: "El cierre fue confirmado por backend.",
        life: 3000,
      });
    } catch (err) {
      setError(err?.message || "No se pudo cerrar el turno.");
    } finally {
      setBusy("");
    }
  };

  const handleFinish = async () => {
    await onClosed?.(result);
    forceClose();
  };

  const header = (
    <div className="cash-close-dialog-title">
      <span>Caja - Corte de turno</span>
      <strong>
        {step === "count"
          ? "Cuenta el efectivo disponible"
          : step === "review"
            ? "Revisa el corte"
            : "Turno cerrado"}
      </strong>
    </div>
  );

  const footer = (
    <div className="cash-close-footer">
      {step === "count" ? (
        <>
          <Button type="button" className="p-button-text cash-dialog-cancel-button" label="Cancelar" icon={<X size={16} aria-hidden="true" />} onClick={requestClose} disabled={Boolean(busy)} />
          <Button type="submit" form="cash-close-count-form" className="cash-primary-button cash-dialog-primary-button" label={busy === "preview" ? "Revisando..." : "Revisar corte"} icon={busy === "preview" ? <Loader2 className="cash-spin" size={16} aria-hidden="true" /> : <ReceiptText size={16} aria-hidden="true" />} disabled={Boolean(busy) || countedMoney === null} />
        </>
      ) : step === "review" ? (
        <>
          <Button type="button" className="cash-secondary-button" label="Volver" icon={<ArrowLeft size={16} aria-hidden="true" />} onClick={() => setStep("count")} disabled={Boolean(busy)} />
          <Button type="button" className="cash-primary-button cash-primary-button--danger" label={busy === "close" ? "Cerrando..." : "Confirmar cierre"} icon={busy === "close" ? <Loader2 className="cash-spin" size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />} onClick={handleConfirmClose} disabled={!canConfirmClose} />
        </>
      ) : (
        <Button type="button" className="cash-primary-button" label="Finalizar" icon={<CheckCircle2 size={16} aria-hidden="true" />} onClick={handleFinish} />
      )}
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={requestClose}
      header={header}
      footer={footer}
      modal
      blockScroll
      draggable={false}
      className="cash-close-dialog"
      style={{ width: step === "review" ? "min(560px, calc(100vw - 32px))" : "min(600px, calc(100vw - 32px))" }}
    >
      <div className="cash-close-flow">
        <section className="cash-close-responsible">
          <div className="cash-close-avatar" aria-hidden="true">
            {responsible?.avatarUrl ? <img src={responsible.avatarUrl} alt="" /> : <span>{responsibleName.slice(0, 1).toUpperCase()}</span>}
          </div>
          <div>
            <strong>{responsibleName}</strong>
            <span>
              {responsible?.role || "Rol operativo"} - Turno abierto desde {formatTime(openedAt)}
            </span>
            <small>Cuenta de efectivo - {formatShiftDuration(openedAt)}</small>
          </div>
        </section>

        {step === "count" ? (
          <form id="cash-close-count-form" className="cash-close-step" onSubmit={handlePrepare}>
            <div className="cash-close-count-grid">
              <PreviewMetric label="Ventas del turno" value={summary?.salesCount ?? 0} />
              <PreviewMetric label="Hora de apertura" value={formatTime(openedAt)} />
            </div>
            <label className="cash-amount-field" htmlFor="cash-close-counted-amount">
              <span className="cash-amount-field__label">Efectivo contado</span>
              <div className="cash-money-input-shell">
                <span aria-hidden="true">$</span>
                <InputText
                  ref={countInputRef}
                  id="cash-close-counted-amount"
                  value={countedAmount}
                  onChange={handleAmountChange}
                  onBlur={() => setCountedAmount((current) => formatAmountInput(current))}
                  onFocus={(event) => event.target.select()}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  className="cash-money-input"
                  disabled={Boolean(busy)}
                />
              </div>
              <small className="cash-amount-field__hint">Ejemplo: $ 1,250.00. Captura solo el efectivo fisico disponible.</small>
            </label>
          </form>
        ) : null}

        {step === "review" && preview ? (
          <section className="cash-close-step">
            <div className="cash-close-result-band">
              <span>{resultLabel(preview.result)}</span>
              <strong>{formatMXN(preview.differenceAmount)}</strong>
            </div>
            <div className="cash-close-count-grid">
              <PreviewMetric label="Efectivo contado" value={formatMXN(preview.countedCashAmount)} />
              <PreviewMetric label="Efectivo esperado" value={formatMXN(preview.expectedCashAmount)} />
              <PreviewMetric label="Saldo al iniciar" value={formatMXN(preview.openingBalanceSnapshot)} />
              <PreviewMetric label="Ventas efectivo" value={formatMXN(preview.cashSalesAmount)} />
              <PreviewMetric label="Ventas electronicas" value={formatMXN(preview.cardSalesAmount)} />
              <PreviewMetric label="Entradas" value={formatMXN(preview.manualEntriesAmount)} />
              <PreviewMetric label="Retiros" value={formatMXN(preview.manualWithdrawalsAmount)} />
            </div>
            <div className="cash-close-audit-note">
              <Lock size={16} aria-hidden="true" />
              <span>
                {preview.expectedBalanceViewedBeforeCount
                  ? "El esperado fue revelado antes del conteo."
                  : "El esperado se calculo despues de confirmar el conteo."}
              </span>
            </div>
            {requiresReason ? (
              <label className="cash-amount-field" htmlFor="cash-close-discrepancy-reason">
                <span className="cash-amount-field__label">Motivo de diferencia</span>
                <InputText
                  ref={reasonRef}
                  id="cash-close-discrepancy-reason"
                  value={discrepancyReason}
                  onChange={(event) => {
                    setDiscrepancyReason(event.target.value);
                    setError("");
                  }}
                  className="cash-text-input"
                  maxLength={500}
                  disabled={Boolean(busy)}
                />
              </label>
            ) : null}
            <label className="cash-amount-field" htmlFor="cash-close-notes">
              <span className="cash-amount-field__label">Notas</span>
              <InputTextarea
                id="cash-close-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="cash-textarea"
                rows={2}
                maxLength={500}
                disabled={Boolean(busy)}
              />
            </label>
          </section>
        ) : null}

        {step === "result" && result ? (
          <section className="cash-close-step cash-close-step--result">
            <CheckCircle2 size={36} aria-hidden="true" />
            <div>
              <strong>{resultLabel(result.result)}</strong>
              <span>Cierre registrado a las {formatTime(result.closedAt)}.</span>
            </div>
            <div className="cash-close-count-grid">
              <PreviewMetric label="Contado" value={formatMXN(result.countedCashAmount)} />
              <PreviewMetric label="Diferencia" value={formatMXN(result.differenceAmount)} />
              <PreviewMetric label="Incidencia" value={result.incidentId ? `#${result.incidentId}` : "Sin incidencia"} />
              <PreviewMetric label="Politica" value={result.policyApplied || "CONTINUITY_FIRST"} />
            </div>
          </section>
        ) : null}

        {confirmExit ? (
          <div className="cash-close-exit-confirm" role="alertdialog" aria-label="Cancelar corte">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <strong>Cancelar corte</strong>
              <span>Hay datos capturados en este corte.</span>
            </div>
            <Button type="button" className="cash-secondary-button" label="Seguir" onClick={() => setConfirmExit(false)} />
            <Button type="button" className="cash-secondary-button cash-secondary-button--danger" label="Descartar" onClick={forceClose} />
          </div>
        ) : null}

        {error ? (
          <div className="cash-control-error cash-control-error--dialog" role="alert">
            <AlertTriangle size={17} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
