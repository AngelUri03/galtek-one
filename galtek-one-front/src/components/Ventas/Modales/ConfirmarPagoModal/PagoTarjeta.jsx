import React, { useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import TecladoNumerico from "./TecladoNumerico";

const PagoTarjeta = ({
  total,
  metodoPago,
  onCancelar,
  onPaymentSuccess,
  processing = false,
}) => {
  const [referencia, setReferencia] = useState("");

  const handleInput = (value) => {
    if (processing) return;
    setReferencia((prev) => prev + value);
  };

  const handleDelete = () => {
    if (processing) return;
    setReferencia((prev) => prev.slice(0, -1));
  };

  const confirmarPago = () => {
    if (!referencia || processing) return;
    if (onPaymentSuccess) {
      onPaymentSuccess({
        metodo: metodoPago?.code || "TARJETA",
        metodoNombre: metodoPago?.label || "Tarjeta",
        metodoPagoId: metodoPago?.id,
        referencia: referencia,
        total: total,
      });
    }
  };

  return (
    <div className="pago-metodo">
      <p className="pago-total">
        Total: <strong>${total.toFixed(2)}</strong>
      </p>

      {/* INPUT REFERENCIA */}
      <div className="pago-input-container">
        <label htmlFor="ref-tarjeta" className="pago-input-label">
          Referencia / Autorización
        </label>
        <div className="p-inputgroup">
          <span className="p-inputgroup-addon">
            <i className="pi pi-credit-card"></i>
          </span>
          <InputText
            id="ref-tarjeta"
            placeholder="Ingrese los últimos 4 dígitos o autorización"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmarPago()}
            className="p-inputtext-lg"
            disabled={processing}
            autoFocus
          />
        </div>
      </div>

      {/* TECLADO */}
      <TecladoNumerico
        onInput={handleInput}
        onDelete={handleDelete}
      />

      {/* ACCIONES */}
      <div className="pago-acciones">
        <Button
          label="Cancelar"
          className="p-button-text"
          onClick={onCancelar}
          disabled={processing}
        />

        <Button
          label={processing ? "Registrando..." : "Confirmar pago"}
          icon={processing ? "pi pi-spin pi-spinner" : "pi pi-check"}
          className="p-button-success"
          disabled={!referencia || processing}
          onClick={confirmarPago}
        />
      </div>
    </div>
  );
};

export default PagoTarjeta;
