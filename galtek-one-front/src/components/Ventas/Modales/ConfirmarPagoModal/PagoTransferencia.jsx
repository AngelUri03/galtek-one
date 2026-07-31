import React, { useMemo, useState } from "react";

const money = (value) =>
  (Number(value) || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const readDestination = (metodoPago, paymentConfig) => {
  const raw = metodoPago?.raw || {};
  return (
    paymentConfig?.transferBankName ||
    paymentConfig?.transferClabe ||
    paymentConfig?.transferAccountName ||
    raw.cuentaDestino ||
    raw.cuenta_destino ||
    raw.clabe ||
    raw.cuenta ||
    raw.banco ||
    raw.nombreBanco ||
    ""
  );
};

const PagoTransferencia = ({
  total,
  metodoPago,
  onCancelar,
  onPaymentSuccess,
  processing = false,
  paymentConfig = null,
}) => {
  const [folio, setFolio] = useState("");
  const [verificado, setVerificado] = useState(false);

  const totalOriginal = Number(total) || 0;
  const totalCobro = Number(totalOriginal.toFixed(2));
  const folioLimpio = folio.trim();
  const destino = useMemo(() => readDestination(metodoPago, paymentConfig), [metodoPago, paymentConfig]);
  const puedePagar = verificado && folioLimpio.length >= 4;

  const confirmarPago = () => {
    if (!puedePagar || processing) return;

    onPaymentSuccess?.({
      metodo: metodoPago?.code || "TRANSFERENCIA",
      metodoNombre: metodoPago?.label || "Transferencia",
      metodoTipo: metodoPago?.type || "TRANSFER",
      metodoPagoId: metodoPago?.id,
      folio: folioLimpio,
      referencia: folioLimpio,
      total: totalCobro,
      totalOriginal,
      totalCobrado: totalCobro,
      verificadoManual: true,
    });
  };

  return (
    <div className="pago-metodo pago-screen pago-screen--transfer">
      <section className="pago-method-hero pago-method-hero--transfer">
        <div>
          <span>Transferencia bancaria</span>
          <strong>{money(totalCobro)}</strong>
          <small>Entrega solo despues de confirmar el abono.</small>
        </div>
        <div className="pago-hero-chip">
          <i className="pi pi-building" />
          <span>{destino || "Cuenta configurada"}</span>
        </div>
      </section>

      <div className="pago-method-grid">
        <section className="pago-panel pago-method-form">
          <div className="pago-risk-card is-transfer">
            <i className="pi pi-eye" />
            <span>
              <strong>Verifica el movimiento en banco antes de cerrar.</strong>
              <small>El folio por si solo no comprueba que el dinero entro.</small>
            </span>
          </div>

          <label className="pago-field">
            <span>Folio, clave de rastreo o referencia</span>
            <input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmarPago()}
              placeholder="Ej. SPEI-538271"
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
              <strong>Abono visto en cuenta</strong>
              <small>El importe recibido coincide con el total de la venta.</small>
            </span>
          </button>
        </section>

        <aside className="pago-panel pago-method-summary">
          <div className={`pago-status-card ${verificado ? "is-ready" : "is-pending"}`}>
            <span>{verificado ? "Transferencia validada" : "Pendiente de validar"}</span>
            <strong>{money(totalCobro)}</strong>
            <small>
              {verificado
                ? "Ya puedes registrar el pago."
                : "No cierres la venta hasta confirmar el abono."}
            </small>
          </div>

          <div className="pago-breakdown">
            <div>
              <span>Monto esperado</span>
              <strong>{money(totalCobro)}</strong>
            </div>
            <div>
              <span>Destino</span>
              <strong>{destino || "Sin dato"}</strong>
            </div>
            <div>
              <span>Folio</span>
              <strong>{folioLimpio || "Pendiente"}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>{verificado ? "Validado" : "Sin validar"}</strong>
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
              {processing ? "Registrando..." : "Confirmar transferencia"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PagoTransferencia;
