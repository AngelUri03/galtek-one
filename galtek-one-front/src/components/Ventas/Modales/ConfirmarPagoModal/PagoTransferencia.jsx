import React, { useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import TecladoNumerico from "./TecladoNumerico";

const PagoTransferencia = ({
  total,
  metodoPago,
  onCancelar,
  onPaymentSuccess,
  processing = false,
}) => {
  const [folio, setFolio] = useState("");

  const handleInput = (value) => {
    if (processing) return;
    setFolio((prev) => prev + value);
  };

  const handleDelete = () => {
    if (processing) return;
    setFolio((prev) => prev.slice(0, -1));
  };

  const confirmarPago = () => {
    if (!folio || processing) return;
    if (onPaymentSuccess) {
      onPaymentSuccess({
        metodo: metodoPago?.code || "TRANSFERENCIA",
        metodoNombre: metodoPago?.label || "Transferencia",
        metodoPagoId: metodoPago?.id,
        folio: folio,
        total: total,
      });
    }
  };

  return (
    <div className="pago-metodo">
      <p className="pago-total">
        Total: <strong>${total.toFixed(2)}</strong>
      </p>

      {/* INPUT FOLIO */}
      <div className="pago-input-container">
        <label htmlFor="ref-transferencia" className="pago-input-label">
          Folio de transferencia / Referencia
        </label>
        <div className="p-inputgroup">
          <span className="p-inputgroup-addon">
            <i className="pi pi-receipt"></i>
          </span>
          <InputText
            id="ref-transferencia"
            placeholder="Ingrese el folio o referencia"
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
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
          label={processing ? "Registrando..." : "Confirmar transferencia"}
          icon={processing ? "pi pi-spin pi-spinner" : "pi pi-check"}
          className="p-button-success"
          disabled={!folio || processing}
          onClick={confirmarPago}
        />
      </div>
    </div>
  );
};

export default PagoTransferencia;
