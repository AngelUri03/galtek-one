import React, { useMemo, useState } from "react";

const money = (value) =>
  (Number(value) || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const parsePercent = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(String(value).replace("%", "").replace(",", "."));
  if (!Number.isFinite(number)) return 0;
  return number > 0 && number <= 1 ? number * 100 : number;
};

const PagoTarjeta = ({
  total,
  metodoPago,
  onCancelar,
  onPaymentSuccess,
  processing = false,
  paymentConfig = null,
}) => {
  const terminales = useMemo(
    () => (paymentConfig?.terminales || []).filter((terminal) => terminal.enabled !== false),
    [paymentConfig]
  );
  const [terminalKey, setTerminalKey] = useState(terminales[0]?.key || "");
  const [referencia, setReferencia] = useState("");
  const [autorizado, setAutorizado] = useState(false);

  const selectedTerminal =
    terminales.find((terminal) => terminal.key === terminalKey) ||
    terminales[0] ||
    null;
  const totalOriginal = Number(total) || 0;
  const comisionPorcentaje =
    selectedTerminal?.commissionEnabled === false
      ? 0
      : Math.max(parsePercent(selectedTerminal?.commissionPercent), 0);
  const comisionMonto = Number(((totalOriginal * comisionPorcentaje) / 100).toFixed(2));
  const totalCobro = Number((totalOriginal + comisionMonto).toFixed(2));
  const referenciaLimpia = referencia.trim();
  const requiereReferencia = paymentConfig?.terminalRequireReference !== false;
  const puedePagar =
    Boolean(selectedTerminal) &&
    autorizado &&
    (!requiereReferencia || referenciaLimpia.length >= 3);

  const confirmarPago = () => {
    if (!puedePagar || processing) return;

    onPaymentSuccess?.({
      metodo: metodoPago?.code || "TERMINAL",
      metodoNombre: metodoPago?.label || "Terminal",
      metodoTipo: metodoPago?.type || "TERMINAL",
      metodoPagoId: metodoPago?.id,
      referencia: referenciaLimpia,
      terminalKey: selectedTerminal?.key,
      terminalProvider: selectedTerminal?.provider,
      terminalNombre: selectedTerminal?.nombre,
      total: totalCobro,
      totalOriginal,
      totalCobrado: totalCobro,
      comisionPorcentaje,
      comisionMonto,
      autorizadoManual: true,
    });
  };

  return (
    <div className="pago-metodo pago-screen pago-screen--card">
      <section className="pago-method-hero pago-method-hero--card">
        <div>
          <span>Cobro por terminal</span>
          <strong>{money(totalCobro)}</strong>
          <small>
            {comisionPorcentaje > 0
              ? `${comisionPorcentaje.toFixed(2)}% de comision configurada`
              : "Sin comision configurada"}
          </small>
        </div>
        <div className="pago-hero-chip is-warning">
          <i className="pi pi-tablet" />
          <span>{selectedTerminal?.nombre || "Terminal"}</span>
        </div>
      </section>

      <div className="pago-method-grid">
        <section className="pago-panel pago-method-form">
          <div className="pago-risk-card">
            <i className="pi pi-shield" />
            <span>
              <strong>Solo registra terminal si ya viste el aprobado.</strong>
              <small>Selecciona la terminal usada y captura autorizacion o voucher.</small>
            </span>
          </div>

          <div className="pago-terminal-picker">
            {terminales.map((terminal) => (
              <button
                key={terminal.key}
                type="button"
                className={terminal.key === selectedTerminal?.key ? "is-selected" : ""}
                onClick={() => setTerminalKey(terminal.key)}
                disabled={processing}
              >
                <i className="pi pi-tablet" />
                <span>
                  <strong>{terminal.nombre || "Terminal"}</strong>
                  <small>{terminal.identifier || terminal.serial || terminal.provider || "Sin identificador"}</small>
                </span>
              </button>
            ))}
          </div>

          <label className="pago-field">
            <span>Autorizacion, voucher o ultimos 4 digitos</span>
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmarPago()}
              placeholder={requiereReferencia ? "Ej. AUT-8291 o 8291" : "Opcional"}
              disabled={processing}
              autoFocus
            />
          </label>

          <button
            type="button"
            className={`pago-check-row ${autorizado ? "is-on" : ""}`}
            onClick={() => setAutorizado((prev) => !prev)}
            disabled={processing}
            aria-pressed={autorizado}
          >
            <span className="pago-check-icon">
              <i className={autorizado ? "pi pi-check" : "pi pi-circle"} />
            </span>
            <span>
              <strong>Pago aprobado en terminal</strong>
              <small>Marcar solo despues de ver autorizacion real.</small>
            </span>
          </button>
        </section>

        <aside className="pago-panel pago-method-summary">
          <div className="pago-status-card is-card">
            <span>Total a capturar</span>
            <strong>{money(totalCobro)}</strong>
            <small>{selectedTerminal?.identifier || selectedTerminal?.account || "Terminal configurada"}</small>
          </div>

          <div className="pago-breakdown">
            <div>
              <span>Venta</span>
              <strong>{money(totalOriginal)}</strong>
            </div>
            <div>
              <span>Comision</span>
              <strong>{money(comisionMonto)}</strong>
            </div>
            <div>
              <span>Terminal</span>
              <strong>{selectedTerminal?.nombre || "Sin terminal"}</strong>
            </div>
            <div>
              <span>Referencia</span>
              <strong>{referenciaLimpia || "Pendiente"}</strong>
            </div>
          </div>

          <div className="pago-acciones pago-acciones--sticky">
            <button
              type="button"
              className="pago-secondary-action"
              onClick={onCancelar}
              disabled={processing}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="pago-primary-action"
              onClick={confirmarPago}
              disabled={!puedePagar || processing}
            >
              {processing ? "Registrando..." : "Confirmar terminal"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PagoTarjeta;
