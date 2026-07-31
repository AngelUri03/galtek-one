import React, { useState } from "react";

const money = (value) =>
  (Number(value) || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const PagoVales = ({
  total,
  metodoPago,
  onCancelar,
  onPaymentSuccess,
  processing = false,
  paymentConfig = null,
}) => {
  const [emisor, setEmisor] = useState(paymentConfig?.voucherIssuer || "");
  const [folio, setFolio] = useState("");
  const [autorizado, setAutorizado] = useState(false);

  const totalCobro = Number((Number(total) || 0).toFixed(2));
  const folioLimpio = folio.trim();
  const emisorLimpio = emisor.trim();
  const requiereFolio = paymentConfig?.voucherRequireFolio !== false;
  const requiereAutorizacion = paymentConfig?.voucherRequireAuthorization !== false;
  const puedePagar =
    (!requiereFolio || folioLimpio.length >= 3) &&
    (!requiereAutorizacion || autorizado);

  const confirmarPago = () => {
    if (!puedePagar || processing) return;

    onPaymentSuccess?.({
      metodo: metodoPago?.code || "VALES",
      metodoNombre: metodoPago?.label || "Vales",
      metodoTipo: metodoPago?.type || "VOUCHER",
      metodoPagoId: metodoPago?.id,
      referencia: folioLimpio || emisorLimpio,
      folio: folioLimpio,
      total: totalCobro,
      totalOriginal: totalCobro,
      totalCobrado: totalCobro,
      verificadoManual: autorizado || !requiereAutorizacion,
      pagoVerificado: autorizado || !requiereAutorizacion,
    });
  };

  return (
    <div className="pago-metodo pago-screen pago-screen--voucher">
      <section className="pago-method-hero pago-method-hero--voucher">
        <div>
          <span>Pago con vales</span>
          <strong>{money(totalCobro)}</strong>
          <small>{paymentConfig?.voucherInstructions || "Valida saldo, folio y autorizacion antes de cerrar."}</small>
        </div>
        <div className="pago-hero-chip">
          <i className="pi pi-ticket" />
          <span>{paymentConfig?.voucherIssuer || "Vales"}</span>
        </div>
      </section>

      <div className="pago-method-grid">
        <section className="pago-panel pago-method-form">
          <div className="pago-risk-card is-transfer">
            <i className="pi pi-eye" />
            <span>
              <strong>Entrega solo despues de validar el vale.</strong>
              <small>El folio ayuda a rastrear aclaraciones y conciliaciones.</small>
            </span>
          </div>

          <label className="pago-field">
            <span>Emisor del vale</span>
            <input
              value={emisor}
              onChange={(e) => setEmisor(e.target.value)}
              placeholder="Ej. Edenred, Pluxee o vale interno"
              disabled={processing}
            />
          </label>

          <label className="pago-field">
            <span>Folio o autorizacion</span>
            <input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmarPago()}
              placeholder={requiereFolio ? "Folio requerido" : "Opcional"}
              disabled={processing}
              autoFocus
            />
          </label>

          {requiereAutorizacion ? (
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
                <strong>Vale autorizado</strong>
                <small>Saldo y folio validados antes de cerrar.</small>
              </span>
            </button>
          ) : null}
        </section>

        <aside className="pago-panel pago-method-summary">
          <div className={`pago-status-card ${puedePagar ? "is-ready" : "is-pending"}`}>
            <span>{puedePagar ? "Vale listo" : "Vale pendiente"}</span>
            <strong>{money(totalCobro)}</strong>
            <small>{folioLimpio || "Captura el folio para rastreo."}</small>
          </div>

          <div className="pago-breakdown">
            <div>
              <span>Monto</span>
              <strong>{money(totalCobro)}</strong>
            </div>
            <div>
              <span>Emisor</span>
              <strong>{emisorLimpio || "Sin emisor"}</strong>
            </div>
            <div>
              <span>Folio</span>
              <strong>{folioLimpio || "Pendiente"}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>{puedePagar ? "Validado" : "Pendiente"}</strong>
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
              {processing ? "Registrando..." : "Confirmar vales"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PagoVales;
