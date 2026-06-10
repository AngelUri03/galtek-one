import React, { useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import TecladoNumerico from "./TecladoNumerico";

const PagoTarjeta = ({ total, onCancelar, onPaymentSuccess }) => {
  const [referencia, setReferencia] = useState("");

  const handleInput = (value) => {
    setReferencia((prev) => prev + value);
  };

  const handleDelete = () => {
    setReferencia((prev) => prev.slice(0, -1));
  };

  const confirmarPago = () => {
    if (!referencia) return;
    // Aquí iría la lógica real de confirmación
    console.log("Pago con tarjeta confirmado", { referencia });
    if (onPaymentSuccess) {
      onPaymentSuccess({
        metodo: "TARJETA",
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
        />

        <Button
          label="Confirmar pago"
          icon="pi pi-check"
          className="p-button-success"
          disabled={!referencia}
          onClick={confirmarPago}
        />
      </div>
    </div>
  );
};

export default PagoTarjeta;