import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import {
  AlertTriangle,
  Eye,
  Loader2,
  Lock,
  ReceiptText,
  RefreshCw,
  X,
} from "lucide-react";
import { useCashSession } from "../../cash/CashSessionContext";
import { formatMXN, formatShiftDuration, formatTime } from "../../cash/cashSessionUtils";
import {
  fetchCurrentCashSessionSummary,
  revealExpectedCash,
} from "../../cash/cashSessionService";

function capability(summary, contextCapabilities, key) {
  return Boolean(summary?.capabilities?.[key] ?? contextCapabilities?.[key]);
}

function valueOrDash(value) {
  if (value === 0) return "0";
  return value ?? "--";
}

function InfoItem({ label, value }) {
  return (
    <div className="cash-quick-info-item">
      <span>{label}</span>
      <strong>{valueOrDash(value)}</strong>
    </div>
  );
}

export default function CashControlDrawer({
  visible,
  onHide,
  onNotify,
  onStartClosing,
  returnFocusRef,
}) {
  const titleRef = useRef(null);
  const refreshRef = useRef(null);
  const {
    cashStatus,
    cashSession,
    pendingIncidentCount,
    refreshCashState,
    capabilities,
  } = useCashSession();
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmReveal, setConfirmReveal] = useState(false);

  const isOpen = cashStatus === "OPEN";
  const responsible = summary?.responsibleUser || cashSession?.openedBy || {};
  const responsibleName = responsible?.name || responsible?.username || "Responsable del turno";
  const openedAt = summary?.openedAt || cashSession?.openedAt;
  const canViewExpectedBalance = Boolean(summary?.expectedCashVisible);
  const canRevealExpectedBalance =
    capability(summary, capabilities, "canRevealExpectedBalance") && !canViewExpectedBalance;
  const canCloseCurrentSession = capability(summary, capabilities, "canCloseCurrentSession");
  const canReviewIncidents = capability(summary, capabilities, "canReviewIncidents");

  const activityItems = useMemo(() => {
    const items = [
      { label: "Inicio", value: formatTime(openedAt) },
      { label: "Duracion", value: formatShiftDuration(openedAt) },
    ];
    if (canReviewIncidents) {
      items.push({ label: "Incidencias", value: pendingIncidentCount ?? 0 });
    }
    return items;
  }, [canReviewIncidents, openedAt, pendingIncidentCount]);

  const loadDetails = useCallback(async ({ keepFocus = false } = {}) => {
    if (!visible || !isOpen) return;
    setBusy("load");
    setError("");
    try {
      const sessionPayload = await fetchCurrentCashSessionSummary();
      setSummary(sessionPayload);
      if (keepFocus) {
        window.setTimeout(() => refreshRef.current?.focus?.(), 50);
      }
    } catch (err) {
      setError(err?.message || "No se pudo cargar el resumen de caja.");
    } finally {
      setBusy("");
    }
  }, [isOpen, visible]);

  useEffect(() => {
    if (!visible) return;
    loadDetails();
    const timer = window.setTimeout(() => titleRef.current?.focus?.(), 120);
    return () => window.clearTimeout(timer);
  }, [loadDetails, visible]);

  const handleHide = () => {
    setConfirmReveal(false);
    onHide?.();
    window.setTimeout(() => returnFocusRef?.current?.focus?.(), 80);
  };

  const handleRefresh = async () => {
    if (busy) return;
    setBusy("load");
    setError("");
    try {
      await refreshCashState({ force: true });
      await loadDetails({ keepFocus: true });
      onNotify?.({
        severity: "info",
        summary: "Caja actualizada",
        detail: "Se sincronizo el estado del turno.",
        life: 2600,
      });
    } catch (err) {
      setError(err?.message || "No se pudo actualizar caja.");
    } finally {
      setBusy("");
    }
  };

  const handleReveal = async () => {
    if (busy) return;
    setBusy("reveal");
    setError("");
    try {
      const payload = await revealExpectedCash();
      setSummary(payload);
      setConfirmReveal(false);
      await refreshCashState({ force: true });
      onNotify?.({
        severity: "info",
        summary: "Monto revelado",
        detail: "La consulta quedo registrada en la auditoria del turno.",
        life: 3600,
      });
    } catch (err) {
      setError(err?.message || "No se pudo revelar el efectivo esperado.");
    } finally {
      setBusy("");
    }
  };

  const startClosing = () => {
    handleHide();
    window.setTimeout(() => onStartClosing?.(), 80);
  };

  const header = (
    <div className="cash-quick-sidebar-header">
      <div>
        <span>CAJA - TURNO ACTUAL</span>
        <strong ref={titleRef} tabIndex={-1}>Resumen del turno</strong>
      </div>
      <div className="cash-quick-sidebar-header__actions">
        <button
          ref={refreshRef}
          type="button"
          className="cash-icon-button"
          onClick={handleRefresh}
          disabled={Boolean(busy)}
          title="Actualizar"
          aria-label="Actualizar resumen de caja"
        >
          {busy === "load" ? <Loader2 className="cash-spin" size={17} aria-hidden="true" /> : <RefreshCw size={17} aria-hidden="true" />}
        </button>
        <button type="button" className="cash-icon-button" onClick={handleHide} aria-label="Cerrar resumen de caja">
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return (
    <Sidebar
      visible={visible}
      onHide={handleHide}
      position="right"
      blockScroll
      showCloseIcon={false}
      className="cash-quick-sidebar"
      header={header}
    >
      <div className="cash-quick-panel">
        {!isOpen ? (
          <section className="cash-drawer__empty">
            <Lock size={28} aria-hidden="true" />
            <strong>Sin turno operativo</strong>
            <span>Abre un turno para vender o iniciar un corte.</span>
            <Button
              type="button"
              className="cash-secondary-button"
              icon={busy === "load" ? <Loader2 className="cash-spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
              label="Reintentar"
              onClick={handleRefresh}
              disabled={Boolean(busy)}
            />
          </section>
        ) : (
          <>
            {busy === "load" && !summary ? (
              <section className="cash-quick-loading" aria-label="Cargando resumen">
                <span />
                <strong />
                <em />
                <div />
                <div />
                <div />
              </section>
            ) : (
              <>
                <section className="cash-quick-responsible">
                  <div className="cash-quick-avatar" aria-hidden="true">
                    {responsible?.avatarUrl ? <img src={responsible.avatarUrl} alt="" /> : <span>{responsibleName.slice(0, 1).toUpperCase()}</span>}
                  </div>
                  <div>
                    <strong>{responsibleName}</strong>
                    <span>
                      {responsible?.role || "Rol operativo"} - Turno abierto desde {formatTime(openedAt)}
                    </span>
                    <small>Cuenta de efectivo</small>
                  </div>
                </section>

                <section className="cash-quick-section">
                  <div className="cash-quick-section__title">
                    <ReceiptText size={16} aria-hidden="true" />
                    <h3>Actividad del turno</h3>
                  </div>
                  <div className="cash-quick-info-grid">
                    {activityItems.map((item) => (
                      <InfoItem key={item.label} label={item.label} value={item.value} />
                    ))}
                  </div>
                </section>

                <section className="cash-quick-section">
                  <div className="cash-quick-section__title">
                    <Lock size={16} aria-hidden="true" />
                    <h3>{canViewExpectedBalance ? "Efectivo esperado" : "Efectivo esperado protegido"}</h3>
                  </div>
                  {canViewExpectedBalance ? (
                    <div className="cash-quick-protected is-visible">
                      <strong>{formatMXN(summary?.expectedCashAmount ?? 0)}</strong>
                      <span>Saldo autoritativo calculado por backend.</span>
                    </div>
                  ) : (
                    <div className="cash-quick-protected">
                      <Lock size={20} aria-hidden="true" />
                      <div>
                        <strong>Efectivo esperado protegido</strong>
                        <span>Este monto solo esta disponible para usuarios autorizados.</span>
                      </div>
                      {canRevealExpectedBalance ? (
                        <Button
                          type="button"
                          className="cash-secondary-button"
                          icon={busy === "reveal" ? <Loader2 className="cash-spin" size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                          label="Revelar monto"
                          onClick={() => setConfirmReveal(true)}
                          disabled={Boolean(busy)}
                        />
                      ) : null}
                    </div>
                  )}
                  {confirmReveal ? (
                    <div className="cash-quick-reveal-confirm" role="alertdialog" aria-label="Confirmar revelado de efectivo">
                      <AlertTriangle size={17} aria-hidden="true" />
                      <span>La consulta quedara registrada en la auditoria del turno.</span>
                      <div>
                        <Button type="button" className="cash-secondary-button" label="Cancelar" onClick={() => setConfirmReveal(false)} disabled={Boolean(busy)} />
                        <Button type="button" className="cash-primary-button" label={busy === "reveal" ? "Revelando..." : "Revelar"} onClick={handleReveal} disabled={Boolean(busy)} />
                      </div>
                    </div>
                  ) : null}
                </section>
              </>
            )}
          </>
        )}

        {error ? (
          <div className="cash-drawer__error" role="alert">
            <AlertTriangle size={17} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        {canCloseCurrentSession ? (
          <footer className="cash-quick-footer">
            <Button
              type="button"
              className="cash-primary-button"
              icon={<ReceiptText size={16} aria-hidden="true" />}
              label="Realizar corte"
              onClick={startClosing}
              disabled={Boolean(busy)}
            />
          </footer>
        ) : null}
      </div>
    </Sidebar>
  );
}
