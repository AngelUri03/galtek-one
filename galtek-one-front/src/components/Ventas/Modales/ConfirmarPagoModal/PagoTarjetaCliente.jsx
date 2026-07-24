import React, { useMemo, useState } from "react";

const money = (value) =>
  (Number(value) || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const visibleCardNumber = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "Sin numero configurado";
  return raw.replace(/\s+/g, " ").replace(/(.{4})/g, "$1 ").trim();
};

const PagoTarjetaCliente = ({
  total,
  metodoPago,
  onCancelar,
  onPaymentSuccess,
  processing = false,
  paymentConfig = null,
}) => {
  const [referencia, setReferencia] = useState("");
  const [verificado, setVerificado] = useState(false);

  const totalCobro = Number((Number(total) || 0).toFixed(2));
  const referenciaLimpia = referencia.trim();
  const puedePagar = referenciaLimpia.length >= 3 && verificado;
  const datos = useMemo(
    () => [
      ["Banco", paymentConfig?.cardBankName || "Sin banco"],
      ["Titular", paymentConfig?.cardHolderName || "Sin titular"],
      ["Tarjeta", visibleCardNumber(paymentConfig?.cardNumber)],
      ["Cuenta", paymentConfig?.cardAccount || "Sin cuenta"],
    ],
    [paymentConfig]
  );

  const confirmarPago = () => {
    if (!puedePagar || processing) return;

    onPaymentSuccess?.({
      metodo: metodoPago?.code || "TARJETA",
      metodoNombre: metodoPago?.label || "Tarjeta",
      metodoTipo: metodoPago?.type || "CARD",
      metodoPagoId: metodoPago?.id,
      referencia: referenciaLimpia,
      folio: referenciaLimpia,
      total: totalCobro,
      totalOriginal: totalCobro,
      totalCobrado: totalCobro,
      verificadoManual: true,
    });
  };

  return (
    <div className="pago-metodo pago-screen pago-screen--transfer">
      <section className="pago-method-hero pago-method-hero--transfer">
        <div>
          <span>Pago a tarjeta</span>
          <strong>{money(totalCobro)}</strong>
          <small>{paymentConfig?.cardInstructions || "Comparte los datos configurados y confirma el abono."}</small>
        </div>
        <div className="pago-hero-chip">
          <i className="pi pi-credit-card" />
          <span>{paymentConfig?.cardBankName || "Tarjeta configurada"}</span>
        </div>
      </section>

      <div className="pago-method-grid">
        <section className="pago-panel pago-method-form">
          <div className="pago-card-data-grid">
            {datos.map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>

          <label className="pago-field">
            <span>Referencia, folio o ultimos 4 digitos</span>
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmarPago()}
              placeholder="Ej. 8291 o FOL-2940"
              disabled={processing}
              autoFocus
            />
          </label>

          <button
            type="button"
            className={`pago-check-row ${verificado ? "is-on" : ""}`}
            onClick={() => setVerificado((prev) => !prev)}
            disabled={processing}
            aria-pressed={verificado}
          >
            <span className="pago-check-icon">
              <i className={verificado ? "pi pi-check" : "pi pi-circle"} />
            </span>
            <span>
              <strong>Pago confirmado</strong>
              <small>El importe coincide con la venta antes de entregar.</small>
            </span>
          </button>
        </section>

        <aside className="pago-panel pago-method-summary">
          <div className={`pago-status-card ${verificado ? "is-ready" : "is-pending"}`}>
            <span>{verificado ? "Tarjeta validada" : "Pendiente de validar"}</span>
            <strong>{money(totalCobro)}</strong>
            <small>{referenciaLimpia || "Captura una referencia para cerrar."}</small>
          </div>

          <div className="pago-breakdown">
            <div>
              <span>Monto</span>
              <strong>{money(totalCobro)}</strong>
            </div>
            <div>
              <span>Banco</span>
              <strong>{paymentConfig?.cardBankName || "Sin dato"}</strong>
            </div>
            <div>
              <span>Tarjeta</span>
              <strong>{visibleCardNumber(paymentConfig?.cardNumber)}</strong>
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
              {processing ? "Registrando..." : "Confirmar tarjeta"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PagoTarjetaCliente;
