import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import TecladoNumerico from "./TecladoNumerico";
import TicketPreview from "./TicketPreview";

import { imprimirTicket } from "../../../../utils/ticketService";

const MONTOS_RAPIDOS = [50, 100, 200];

const PagoEfectivo = ({ total, carrito = [], onCancelar, onPaymentSuccess }) => {
  const [recibido, setRecibido]     = useState("");
  const [imprimiendo, setImprimiendo] = useState(false);
  const [errorImpresion, setErrorImpresion] = useState(null);

  const recibidoNum = parseFloat(recibido || 0);
  const cambio      = Math.max(recibidoNum - total, 0);
  const puedePagar  = recibidoNum >= total && recibidoNum > 0;

  // ===============================
  // TECLADO FÍSICO
  // ===============================
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  });

  // ===============================
  // TECLADO VISUAL
  // ===============================

  const handleInput  = (value) => {
    if (value === "." && recibido.includes(".")) return;
    setRecibido((prev) => prev + value);
  };
  const handleDelete = () => setRecibido((prev) => prev.slice(0, -1));

  const agregarMontoRapido = (monto) => setRecibido(String(monto));

  // ===============================
  // CONFIRMAR PAGO + IMPRIMIR
  // ===============================
  const confirmarPago = async () => {
    if (!puedePagar) return;

    setImprimiendo(true);
    setErrorImpresion(null);

    // Intentar imprimir (no bloquea el flujo si falla)
    const resultado = await imprimirTicket({
      carrito,
      total,
      recibido: recibidoNum,
      cambio,
      metodoPago: "EFECTIVO",
    });

    if (!resultado.ok) {
      setErrorImpresion("⚠️ No se pudo imprimir el ticket: " + resultado.mensaje);
    }

    setImprimiendo(false);

    // Siempre continúa el flujo de venta, con o sin impresión
    if (onPaymentSuccess) {
      onPaymentSuccess({
        metodo:   "EFECTIVO",
        recibido: recibidoNum,
        cambio,
        total,
      });
    }
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
            metodoPago="EFECTIVO"
          />

          {/* Aviso de error de impresión */}
          {errorImpresion && (
            <p className="ticket-error-msg">{errorImpresion}</p>
          )}

          {/* ACCIONES */}
          <div className="pago-acciones" style={{ marginTop: "auto" }}>
            <Button
              label="Cancelar"
              className="p-button-text"
              onClick={onCancelar}

              disabled={imprimiendo}
            />
            <Button
              label={imprimiendo ? "Imprimiendo…" : "Confirmar"}
              icon={imprimiendo ? "pi pi-spin pi-spinner" : "pi pi-check"}
              className="p-button-success"
              disabled={!puedePagar || imprimiendo}
              onClick={confirmarPago}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default PagoEfectivo;
