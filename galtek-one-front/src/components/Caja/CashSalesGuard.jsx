import React, { useEffect } from "react";
import { Button } from "primereact/button";
import { AlertTriangle, Lock, RefreshCw } from "lucide-react";
import NavBar from "../common/NavBar";
import { useCashSession } from "../../cash/CashSessionContext";
import { CASH_STATUS } from "../../cash/cashSessionUtils";
import CashBalanceSetupScreen from "./CashBalanceSetupScreen";
import CashOpeningScreen from "./CashOpeningScreen";
import CashPendingReconciliationState from "./CashPendingReconciliationState";
import "../../style/components/Caja/CashSession.css";

function GuardLayout({ children }) {
  return (
    <div className="cash-guard-page">
      <NavBar />
      {children}
    </div>
  );
}

function CashLoadingState() {
  return (
    <GuardLayout>
      <main className="cash-loading-state" aria-live="polite">
        <div className="cash-loading-card">
          <div className="cash-loading-skeleton cash-loading-skeleton--icon" />
          <div className="cash-loading-lines">
            <span />
            <strong />
            <em />
          </div>
        </div>
      </main>
    </GuardLayout>
  );
}

function CashErrorState({ title, message, icon = "error", onRetry, loading }) {
  const Icon = icon === "lock" ? Lock : AlertTriangle;
  return (
    <GuardLayout>
      <section className="cash-block-state" aria-live="assertive">
        <div className={`cash-block-state__icon ${icon === "lock" ? "" : "cash-block-state__icon--error"}`}>
          <Icon size={28} aria-hidden="true" />
        </div>
        <div className="cash-block-state__copy">
          <span className="cash-eyebrow">Ventas bloqueadas</span>
          <h1>{title}</h1>
          <p>{message}</p>
        </div>
        <Button
          type="button"
          icon={<RefreshCw size={16} aria-hidden="true" />}
          label={loading ? "Consultando..." : "Reintentar"}
          className="cash-secondary-button"
          onClick={onRetry}
          disabled={loading}
        />
      </section>
    </GuardLayout>
  );
}

export default function CashSalesGuard({ children }) {
  const {
    cashStatus,
    cashSession,
    loading,
    error,
    message,
    isOpen,
    requiresOpening,
    requiresBalanceSetup,
    refreshCashState,
  } = useCashSession();

  useEffect(() => {
    refreshCashState({ force: true });
  }, [refreshCashState]);

  if (loading && !cashSession) {
    return <CashLoadingState />;
  }

  if (cashStatus === CASH_STATUS.ERROR || error) {
    return (
      <CashErrorState
        title="No se pudo comprobar el turno"
        message={message || error || "Revisa la conexion local y vuelve a intentar."}
        onRetry={() => refreshCashState({ force: true })}
        loading={loading}
      />
    );
  }

  if (isOpen) {
    return children;
  }

  if (requiresBalanceSetup) {
    return (
      <GuardLayout>
        <CashBalanceSetupScreen />
      </GuardLayout>
    );
  }

  if ((cashStatus === CASH_STATUS.OPEN && !isOpen) || cashStatus === CASH_STATUS.OPEN_BY_OTHER_USER) {
    const openedBy = cashSession?.openedBy?.name || cashSession?.openedBy?.username || "otro usuario";
    return (
      <CashErrorState
        icon="lock"
        title="Turno abierto por otro usuario"
        message={`El turno actual pertenece a ${openedBy}.`}
        onRetry={() => refreshCashState({ force: true })}
        loading={loading}
      />
    );
  }

  if (cashStatus === CASH_STATUS.PENDING_RECONCILIATION) {
    return (
      <GuardLayout>
        <CashPendingReconciliationState
          cashSession={cashSession}
          onRetry={() => refreshCashState({ force: true })}
          loading={loading}
        />
      </GuardLayout>
    );
  }

  if (requiresOpening) {
    return (
      <GuardLayout>
        <CashOpeningScreen />
      </GuardLayout>
    );
  }

  return (
    <CashErrorState
      title="Turno sin estado operativo"
      message={message || "No fue posible determinar si la estacion puede vender."}
      onRetry={() => refreshCashState({ force: true })}
      loading={loading}
    />
  );
}
