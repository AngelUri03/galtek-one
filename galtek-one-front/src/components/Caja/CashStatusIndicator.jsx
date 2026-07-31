import React from "react";
import { AlertTriangle, CheckCircle2, CircleDollarSign } from "lucide-react";
import { useCashSession } from "../../cash/CashSessionContext";
import { CASH_STATUS } from "../../cash/cashSessionUtils";

const CashStatusIndicator = React.forwardRef(function CashStatusIndicator({ onClick }, ref) {
  const { cashStatus, cashSession, loading, error } = useCashSession();

  const chipProps = {
    type: "button",
    onClick,
    disabled: !onClick,
    ref,
  };

  if (loading && !cashSession) {
    return (
      <button {...chipProps} className="cash-status-chip cash-status-chip--loading" aria-label="Cargando estado del turno" />
    );
  }

  const openedBy = cashSession?.openedBy?.name || cashSession?.openedBy?.username || "Usuario";

  if (cashStatus === CASH_STATUS.OPEN) {
    return (
      <button
        {...chipProps}
        className="cash-status-chip cash-status-chip--open"
        title={`Turno abierto por ${openedBy} en cuenta de efectivo`}
        aria-label="Abrir resumen del turno"
      >
        <CheckCircle2 size={16} aria-hidden="true" />
        <div>
          <strong>Turno abierto</strong>
        </div>
      </button>
    );
  }

  if (cashStatus === CASH_STATUS.BALANCE_NOT_INITIALIZED) {
    return (
      <button {...chipProps} className="cash-status-chip cash-status-chip--warning" title="Saldo inicial pendiente" aria-label="Saldo inicial pendiente">
        <AlertTriangle size={16} aria-hidden="true" />
        <div>
          <strong>Saldo pendiente</strong>
        </div>
      </button>
    );
  }

  if (cashStatus === CASH_STATUS.OPEN_BY_OTHER_USER) {
    return (
      <button {...chipProps} className="cash-status-chip cash-status-chip--warning" title="Turno de otro usuario" aria-label="Turno abierto por otro usuario">
        <AlertTriangle size={16} aria-hidden="true" />
        <div>
          <strong>Turno ajeno</strong>
        </div>
      </button>
    );
  }

  if (cashStatus === CASH_STATUS.PENDING_RECONCILIATION) {
    return (
      <button {...chipProps} className="cash-status-chip cash-status-chip--warning" title="Turno pendiente de conciliacion" aria-label="Conciliacion pendiente">
        <AlertTriangle size={16} aria-hidden="true" />
        <div>
          <strong>Conciliacion pendiente</strong>
        </div>
      </button>
    );
  }

  if (cashStatus === CASH_STATUS.ERROR || error) {
    return (
      <button {...chipProps} className="cash-status-chip cash-status-chip--error" title="No se pudo comprobar turno" aria-label="Revisar estado de caja">
        <AlertTriangle size={16} aria-hidden="true" />
        <div>
          <strong>Revisar caja</strong>
        </div>
      </button>
    );
  }

  return (
    <button {...chipProps} className="cash-status-chip cash-status-chip--idle" title="Sin turno abierto" aria-label="Estado de caja sin turno">
      <CircleDollarSign size={16} aria-hidden="true" />
      <div>
        <strong>Sin turno</strong>
      </div>
    </button>
  );
});

export default CashStatusIndicator;
