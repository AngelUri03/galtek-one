import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";

import PagoEfectivo from "./PagoEfectivo";
import PagoTarjeta from "./PagoTarjeta";
import PagoTarjetaCliente from "./PagoTarjetaCliente";
import PagoVales from "./PagoVales";

import "../../../../style/components/Ventas/ConfirmarPagoModal.css";

const PAYMENT_ICONS = {
  EFECTIVO: "pi pi-money-bill",
  TARJETA: "pi pi-credit-card",
  VALES: "pi pi-ticket",
  CASH: "pi pi-money-bill",
  TERMINAL: "pi pi-credit-card",
  CARD: "pi pi-credit-card",
  VOUCHER: "pi pi-ticket",
};

const PAYMENT_DESCRIPTIONS = {
  EFECTIVO: "Recibido y cambio inmediato",
  TARJETA: "Referencia o autorizacion",
  VALES: "Referencia del vale",
  CASH: "Recibido y cambio inmediato",
  TERMINAL: "Terminal y autorizacion",
  CARD: "Datos de tarjeta configurada",
  VOUCHER: "Referencia del vale",
};

const normalizePaymentCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizePaymentType = (value) => {
  const code = normalizePaymentCode(value);
  if (["CASH", "TERMINAL", "CARD", "VOUCHER"].includes(code)) return code;
  if (code.includes("EFECTIVO") || code.includes("CASH")) return "CASH";
  if (code.includes("TERMINAL") || code.includes("MERCADO_PAGO")) return "TERMINAL";
  if (code.includes("TARJETA") || code.includes("CREDITO") || code.includes("DEBITO") || code.includes("CARD")) return "CARD";
  if (code.includes("VALE") || code.includes("VOUCHER")) return "VOUCHER";
  return "CARD";
};

const money = (value) =>
  (Number(value) || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });

const formatCantidad = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0";
  return Number.isInteger(number) ? String(number) : number.toFixed(3);
};

const formatPaymentLabel = (value) => {
  const text = String(value || "").trim();
  if (!text) return "Metodo";

  return text
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const ConfirmarPagoModal = ({
  visible,
  onHide,
  total,
  carrito = [],
  metodosPago = [],
  paymentConfig = null,
  onPaymentSuccess,
  processing = false,
  error = "",
  clienteVenta = null,
  onBackToCliente,
}) => {
  const [metodo, setMetodo] = useState(null);

  const paymentOptions = metodosPago
    .map((m) => {
      const nombre = m.nombreMetodoPago || m.nombre || "";
      const codigo = normalizePaymentCode(m.codigo || nombre);
      const tipo = normalizePaymentType(m.tipo || codigo || nombre);
      return {
        ...m,
        id: m.idMetodoPago || m.id || codigo,
        label: nombre,
        code: codigo,
        type: tipo,
        icon: PAYMENT_ICONS[codigo] || PAYMENT_ICONS[tipo] || "pi pi-wallet",
        description: PAYMENT_DESCRIPTIONS[codigo] || PAYMENT_DESCRIPTIONS[tipo] || "Referencia de cobro",
        raw: m.raw || m,
        sortOrder: Number(m.orden || 999),
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (!visible) {
      setMetodo(null);
    }
  }, [visible]);

  const resetAndClose = () => {
    setMetodo(null);
    if (!processing) {
      onHide();
    }
  };

  const volverACliente = () => {
    if (processing) return;
    setMetodo(null);
    onBackToCliente?.();
  };

  const clienteNombre =
    clienteVenta?.nombre || clienteVenta?.razonSocial || "Publico general";
  const clienteDetalle =
    clienteVenta?.rfc ||
    clienteVenta?.telefono ||
    clienteVenta?.email ||
    "Sin cliente asociado";
  const totalLineas = carrito.length;
  const totalUnidades = carrito.reduce(
    (acc, item) => acc + Number(item.cantidad || 0),
    0
  );
  const preferredPayment =
    paymentOptions.find((option) => option.type === "TERMINAL" && paymentConfig?.terminalEnabled !== false) ||
    paymentOptions[0] ||
    null;
  const singlePayment = paymentOptions.length === 1;

  return (
    <Dialog
      header={null}
      visible={visible}
      onHide={resetAndClose}
      modal
      draggable={false}
      className="confirmar-pago-modal-dialog"
    >
      <div className={"confirmar-pago-shell" + (metodo ? " is-detail" : "")}>
        <header className="confirmar-pago-head">
          <div>
            <span>Pago de venta</span>
            <h2>{metodo ? formatPaymentLabel(metodo.label) : "Metodo de pago"}</h2>
          </div>
          <div className="confirmar-pago-stepper" aria-hidden="true">
            <span>Cliente</span>
            <span className="is-active">Pago</span>
          </div>
          <button
            type="button"
            className="confirmar-pago-close"
            onClick={resetAndClose}
            disabled={processing}
            aria-label="Cerrar"
          >
            <i className="pi pi-times" />
          </button>
        </header>

        {!metodo && (
          <div className="confirmar-pago-preflight">
            <section className="confirmar-pago-ticket-card">
              <div className="confirmar-pago-client-line">
                <span>
                  <small>Cliente</small>
                  <strong>{clienteNombre}</strong>
                  <em>{clienteDetalle}</em>
                </span>
                {onBackToCliente ? (
                  <button type="button" onClick={volverACliente} disabled={processing}>
                    Cambiar
                  </button>
                ) : null}
              </div>

              <div className="confirmar-pago-total-card">
                <span>Total a pagar</span>
                <strong>{money(total)}</strong>
                <small>
                  {totalLineas} linea{totalLineas === 1 ? "" : "s"} -{" "}
                  {formatCantidad(totalUnidades)} unidades
                </small>
              </div>
            </section>

            <section
              className={
                "confirmar-pago-methods" + (singlePayment ? " is-single" : "")
              }
            >
              <div className="confirmar-pago-methods-head">
                <div>
                  <strong>{singlePayment ? "Metodo disponible" : "Elige metodo"}</strong>
                  <small>
                    {singlePayment
                      ? "Solo hay un metodo activo para esta venta."
                      : `${paymentOptions.length} metodos activos`}
                  </small>
                </div>
              </div>

              <div className="confirmar-pago-method-grid">
                {paymentOptions.length > 0 ? (
                  paymentOptions.map((option) => {
                    const preferred =
                      preferredPayment &&
                      String(preferredPayment.id) === String(option.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={
                          "confirmar-pago-method-card" +
                          (preferred ? " is-preferred" : "")
                        }
                        onClick={() => setMetodo(option)}
                        disabled={processing}
                      >
                        <span className="confirmar-pago-method-icon">
                          <i className={option.icon} />
                        </span>
                        <span className="confirmar-pago-method-main">
                          <strong>{formatPaymentLabel(option.label)}</strong>
                          <small>{option.description}</small>
                        </span>
                        {singlePayment || preferred ? (
                          <em>{singlePayment ? "Activo" : "Rapido"}</em>
                        ) : null}
                        <i className="pi pi-arrow-right confirmar-pago-method-arrow" />
                      </button>
                    );
                  })
                ) : (
                  <div className="confirmar-pago-empty-methods">
                    <i className="pi pi-wallet" />
                    <strong>Sin metodos activos</strong>
                    <span>Activa al menos un metodo de pago para cobrar.</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {error ? (
          <div className="confirmar-pago-error" role="alert">
            <i className="pi pi-exclamation-triangle" />
            <span>{error}</span>
          </div>
        ) : null}

        {metodo?.type === "CASH" && (
          <PagoEfectivo
            total={total}
            carrito={carrito}
            metodoPago={metodo}
            onCancelar={resetAndClose}
            onPaymentSuccess={onPaymentSuccess}
            processing={processing}
            paymentConfig={paymentConfig}
          />
        )}

        {metodo?.type === "TERMINAL" && (
          <PagoTarjeta
            total={total}
            carrito={carrito}
            metodoPago={metodo}
            onCancelar={resetAndClose}
            onPaymentSuccess={onPaymentSuccess}
            processing={processing}
            paymentConfig={paymentConfig}
          />
        )}

        {metodo?.type === "CARD" && (
          <PagoTarjetaCliente
            total={total}
            carrito={carrito}
            metodoPago={metodo}
            onCancelar={resetAndClose}
            onPaymentSuccess={onPaymentSuccess}
            processing={processing}
            paymentConfig={paymentConfig}
          />
        )}

        {metodo?.type === "VOUCHER" && (
          <PagoVales
            total={total}
            carrito={carrito}
            metodoPago={metodo}
            onCancelar={resetAndClose}
            onPaymentSuccess={onPaymentSuccess}
            processing={processing}
            paymentConfig={paymentConfig}
          />
          )}
      </div>
    </Dialog>
  );
};

export default ConfirmarPagoModal;
