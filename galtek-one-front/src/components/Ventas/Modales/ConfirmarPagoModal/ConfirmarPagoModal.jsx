import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

import PagoEfectivo from "./PagoEfectivo";
import PagoTarjeta from "./PagoTarjeta";
import PagoTransferencia from "./PagoTransferencia";

import "../../../../style/components/Ventas/ConfirmarPagoModal.css";

const PAYMENT_ICONS = {
  EFECTIVO: "pi pi-money-bill",
  TARJETA: "pi pi-credit-card",
  TRANSFERENCIA: "pi pi-send",
};

const normalizePaymentCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const PagoGenerico = ({ metodo, total, onCancelar, onPaymentSuccess }) => {
  const [referencia, setReferencia] = useState("");

  const confirmarPago = () => {
    onPaymentSuccess?.({
      metodo,
      referencia,
      total,
    });
  };

  return (
    <div className="pago-metodo">
      <p className="pago-total">
        Total: <strong>${total.toFixed(2)}</strong>
      </p>
      <div className="pago-input-container">
        <label htmlFor="ref-generica" className="pago-input-label">
          Referencia
        </label>
        <div className="p-inputgroup">
          <span className="p-inputgroup-addon">
            <i className="pi pi-wallet" />
          </span>
          <InputText
            id="ref-generica"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmarPago()}
            autoFocus
          />
        </div>
      </div>
      <div className="pago-acciones">
        <Button label="Cancelar" className="p-button-text" onClick={onCancelar} />
        <Button
          label="Confirmar pago"
          icon="pi pi-check"
          className="p-button-success"
          onClick={confirmarPago}
        />
      </div>
    </div>
  );
};

const ConfirmarPagoModal = ({
  visible,
  onHide,
  total,
  carrito = [],
  metodosPago = [],
  onPaymentSuccess,
}) => {
  const [metodo, setMetodo] = useState(null);
  const paymentOptions = metodosPago.map((m) => {
    const nombre = m.nombreMetodoPago || m.nombre || "";
    const codigo = normalizePaymentCode(nombre);
    return {
      id: m.idMetodoPago || m.id || codigo,
      label: nombre,
      value: codigo,
      icon: PAYMENT_ICONS[codigo] || "pi pi-wallet",
    };
  });

  useEffect(() => {
    if (!visible) {
      setMetodo(null);
    }
  }, [visible]);


  const resetAndClose = () => {
    setMetodo(null);
    onHide();
  };

  return (
    <Dialog
      header="Selecciona un método de pago"
      visible={visible}
      onHide={resetAndClose}
      modal
      draggable={false}
      className="confirmar-pago-modal-dialog"
    >
      {/* ===============================
          SELECCIÓN DE MÉTODO
         =============================== */}
      {!metodo && (
        <div className="confirmar-pago-modal">
          <p className="confirmar-pago-total">
            Total a pagar: <strong>${total.toFixed(2)}</strong>
          </p>

          <div className="confirmar-pago-opciones">
            {paymentOptions.length > 0 ? (
              paymentOptions.map((option) => (
                <Button
                  key={option.id}
                  label={option.label}
                  icon={option.icon}
                  className="pago-btn"
                  onClick={() => setMetodo(option.value)}
                />
              ))
            ) : (
              <p>No hay metodos de pago activos.</p>
            )}
          </div>
        </div>
      )}

      {/* ===============================
          CONTENIDO SEGÚN MÉTODO
         =============================== */}
      {metodo === "EFECTIVO" && (
        <PagoEfectivo
          total={total}
          carrito={carrito}
          onCancelar={resetAndClose}
          onPaymentSuccess={onPaymentSuccess}
        />
      )}

      {metodo === "TARJETA" && (
        <PagoTarjeta
          total={total}
          carrito={carrito}
          onCancelar={resetAndClose}
          onPaymentSuccess={onPaymentSuccess}
        />
      )}

      {metodo === "TRANSFERENCIA" && (
        <PagoTransferencia
          total={total}
          carrito={carrito}
          onCancelar={resetAndClose}
          onPaymentSuccess={onPaymentSuccess}
        />
      )}

      {metodo &&
        !["EFECTIVO", "TARJETA", "TRANSFERENCIA"].includes(metodo) && (
          <PagoGenerico
            metodo={metodo}
            total={total}
            onCancelar={resetAndClose}
            onPaymentSuccess={onPaymentSuccess}
          />
        )}
    </Dialog>
  );
};

export default ConfirmarPagoModal;
