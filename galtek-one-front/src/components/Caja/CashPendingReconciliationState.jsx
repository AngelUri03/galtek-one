import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "primereact/button";

export default function CashPendingReconciliationState({ cashSession, onRetry, loading }) {
  const openedBy = cashSession?.openedBy?.name || cashSession?.openedBy?.username || "Usuario responsable";

  return (
    <section className="cash-block-state" aria-live="polite">
      <div className="cash-block-state__icon cash-block-state__icon--warning">
        <AlertTriangle size={28} aria-hidden="true" />
      </div>
      <div className="cash-block-state__copy">
        <span className="cash-eyebrow">Turno protegido</span>
        <h1>Conciliacion pendiente</h1>
        <p>
          El turno de {openedBy} debe conciliarse antes de volver a vender.
        </p>
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
  );
}
