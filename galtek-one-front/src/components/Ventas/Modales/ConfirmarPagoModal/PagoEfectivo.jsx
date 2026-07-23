import React, { useCallback, useEffect, useState } from "react";
import { Button } from "primereact/button";
import TecladoNumerico from "./TecladoNumerico";
import TicketPreview from "./TicketPreview";

const MONTOS_RAPIDOS = [50, 100, 200];

const PagoEfectivo = ({
  total,
  carrito = [],
  metodoPago,
  onCancelar,
  onPaymentSuccess,
  processing = false,
}) => {
  const [recibido, setRecibido]     = useState("");

  const recibidoNum = parseFloat(recibido || 0);
  const cambio      = Math.max(recibidoNum - total, 0);
  const puedePagar  = recibidoNum >= total && recibidoNum > 0;

  const confirmarPago = useCallback(() => {
    if (!puedePagar || processing) return;

    onPaymentSuccess?.({
      metodo: metodoPago?.code || "EFECTIVO",
      metodoNombre: metodoPago?.label || "Efectivo",
      metodoPagoId: metodoPago?.id,
      recibido: recibidoNum,
      cambio,
      total,
    });
  }, [cambio, metodoPago, onPaymentSuccess, processing, puedePagar, recibidoNum, total]);

  // ===============================
  // TECLADO FÍSICO
  // ===============================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (processing) return;
      const { key } = e;

      if (key >= "0" && key <= "9") {
        setRecibido((prev) => prev + key);
        return;
      }

      if (key === "." || key === ",") {
        setRecibido((prev) => (prev.includes(".") ? prev : prev + "."));
        return;
      }
      if (key === "Backspace") {
        setRecibido((prev) => prev.slice(0, -1));
        return;
      }

      if (key === "Enter") {
        confirmarPago();
        return;
      }

      if (key === "Escape") {
        onCancelar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmarPago, onCancelar, processing]);

  // ===============================
  // TECLADO VISUAL
  // ===============================

  const handleInput  = (value) => {
    if (processing) return;
    if (value === "." && recibido.includes(".")) return;
    setRecibido((prev) => prev + value);
  };
  const handleDelete = () => {
    if (processing) return;
    setRecibido((prev) => prev.slice(0, -1));
  };

  const agregarMontoRapido = (monto) => {
    if (processing) return;
    setRecibido(String(monto));
  };

  return (
    <div className="pago-metodo">
      <div className="pago-efectivo-layout">


        {/* ── COLUMNA IZQUIERDA: TECLADO ── */}
        <div className="pago-col-left">
          <div className="montos-rapidos">
            {MONTOS_RAPIDOS.map((monto) => (
              <Button
                key={monto}
                label={`$${monto}`}
                className="monto-rapido-btn"
                onClick={() => agregarMontoRapido(monto)}
                disabled={processing}
              />
            ))}
          </div>

          <TecladoNumerico onInput={handleInput} onDelete={handleDelete} />
        </div>

        {/* ── COLUMNA DERECHA: RESUMEN Y TICKET ── */}
        <div className="pago-col-right">
          <p className="pago-total">
            Total: <strong>${total.toFixed(2)}</strong>
          </p>


          {/* Preview del ticket con todos los items */}
          <TicketPreview
            carrito={carrito}
            total={total}
            recibido={recibidoNum}
            cambio={cambio}
            metodoPago={metodoPago?.label || "EFECTIVO"}
          />

          {/* ACCIONES */}
          <div className="pago-acciones" style={{ marginTop: "auto" }}>
            <Button
              label="Cancelar"
              className="p-button-text"
              onClick={onCancelar}
              disabled={processing}
            />
            <Button
              label={processing ? "Registrando..." : "Confirmar"}
              icon={processing ? "pi pi-spin pi-spinner" : "pi pi-check"}
              className="p-button-success"
              disabled={!puedePagar || processing}
              onClick={confirmarPago}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default PagoEfectivo;
