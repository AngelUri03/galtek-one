import React, { useCallback, useEffect, useMemo, useState } from "react";
import TecladoNumerico from "./TecladoNumerico";

const money = (value) =>
  (Number(value) || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const roundUpToHalf = (value) => Number((Math.ceil((Number(value) || 0) * 2) / 2).toFixed(2));

const formatInputAmount = (value) => {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
};

const appendAmountDigit = (current, value) => {
  if (value === "." && current.includes(".")) return current;

  const next = `${current}${value}`;
  if (!/^\d{0,7}(\.\d{0,2})?$/.test(next)) return current;
  return next;
};

const buildQuickAmounts = (totalCobro) => {
  const total = Number(totalCobro) || 0;
  const nextFive = Math.ceil(total / 5) * 5;
  const nextTen = Math.ceil(total / 10) * 10;
  const commonBills = [20, 50, 100, 200, 500, 1000, 1500, 2000];
  const firstBill = commonBills.find((amount) => amount >= total) || Math.ceil(total / 500) * 500;
  const secondBill =
    commonBills.find((amount) => amount > firstBill) || firstBill + 500;

  return [total, nextFive, nextTen, firstBill, secondBill]
    .filter((amount) => amount > 0)
    .map((amount) => Number(amount.toFixed(2)))
    .filter((amount, index, list) => list.indexOf(amount) === index)
    .slice(0, 4);
};

const PagoEfectivo = ({
  total,
  metodoPago,
  onCancelar,
  onPaymentSuccess,
  processing = false,
  paymentConfig = null,
}) => {
  const [recibido, setRecibido] = useState("");
  const [redondeoActivo, setRedondeoActivo] = useState(
    paymentConfig?.cashRoundingDefaultEnabled !== false
  );

  useEffect(() => {
    setRedondeoActivo(paymentConfig?.cashRoundingDefaultEnabled !== false);
  }, [paymentConfig?.cashRoundingDefaultEnabled]);

  const totalOriginal = Number(total) || 0;
  const totalCobro = useMemo(
    () => (redondeoActivo ? roundUpToHalf(totalOriginal) : Number(totalOriginal.toFixed(2))),
    [redondeoActivo, totalOriginal]
  );
  const redondeo = Number(Math.max(totalCobro - totalOriginal, 0).toFixed(2));
  const recibidoNum = Number.parseFloat(recibido || "0") || 0;
  const cambio = Number(Math.max(recibidoNum - totalCobro, 0).toFixed(2));
  const falta = Number(Math.max(totalCobro - recibidoNum, 0).toFixed(2));
  const puedePagar = recibidoNum >= totalCobro && recibidoNum > 0;
  const montosRapidos = useMemo(() => buildQuickAmounts(totalCobro), [totalCobro]);

  const confirmarPago = useCallback(() => {
    if (!puedePagar || processing) return;

    onPaymentSuccess?.({
      metodo: metodoPago?.code || "EFECTIVO",
      metodoNombre: metodoPago?.label || "Efectivo",
      metodoTipo: metodoPago?.type || "CASH",
      metodoPagoId: metodoPago?.id,
      total: totalCobro,
      totalOriginal,
      totalCobrado: totalCobro,
      redondeoActivo,
      redondeoAplicado: redondeo,
      recibido: recibidoNum,
      cambio,
    });
  }, [
    cambio,
    metodoPago,
    onPaymentSuccess,
    processing,
    puedePagar,
    recibidoNum,
    redondeo,
    redondeoActivo,
    totalCobro,
    totalOriginal,
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (processing) return;

      if (e.key >= "0" && e.key <= "9") {
        setRecibido((prev) => appendAmountDigit(prev, e.key));
        return;
      }

      if (e.key === "." || e.key === ",") {
        setRecibido((prev) => appendAmountDigit(prev, "."));
        return;
      }

      if (e.key === "Backspace") {
        setRecibido((prev) => prev.slice(0, -1));
        return;
      }

      if (e.key === "Enter") {
        confirmarPago();
        return;
      }

      if (e.key === "Escape") {
        onCancelar?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmarPago, onCancelar, processing]);

  const handleInput = (value) => {
    if (processing) return;
    setRecibido((prev) => appendAmountDigit(prev, value));
  };

  const handleDelete = () => {
    if (processing) return;
    setRecibido((prev) => prev.slice(0, -1));
  };

  const usarMontoRapido = (amount) => {
    if (processing) return;
    setRecibido(formatInputAmount(amount));
  };

  const limpiarRecibido = () => {
    if (processing) return;
    setRecibido("");
  };

  return (
    <div className="pago-metodo pago-screen pago-screen--cash">
      <section className="pago-cash-hero">
        <div className="pago-hero-total">
          <span>Total en efectivo</span>
          <strong>{money(totalCobro)}</strong>
          <small>Venta original {money(totalOriginal)}</small>
        </div>

        <button
          type="button"
          className={`pago-rounding-toggle ${redondeoActivo ? "is-on" : ""}`}
          onClick={() => setRedondeoActivo((prev) => !prev)}
          disabled={processing}
          aria-pressed={redondeoActivo}
        >
          <i className={redondeoActivo ? "pi pi-check" : "pi pi-circle"} />
          <span>
            <strong>Redondeo a favor</strong>
            <small>
              {redondeoActivo
                ? `+${money(redondeo)} al siguiente multiplo de $0.50`
                : "Cobrar importe exacto"}
            </small>
          </span>
        </button>
      </section>

      <div className="pago-screen-grid">
        <section className="pago-panel pago-panel--keypad">
          <div className="pago-panel-head">
            <span>
              <small>Recibido</small>
              <strong>{money(recibidoNum)}</strong>
            </span>
            <button type="button" onClick={limpiarRecibido} disabled={!recibido || processing}>
              Limpiar
            </button>
          </div>

          <div className="pago-quick-grid">
            {montosRapidos.map((amount, index) => (
              <button
                key={amount}
                type="button"
                className={index === 0 ? "is-exact" : ""}
                onClick={() => usarMontoRapido(amount)}
                disabled={processing}
              >
                <span>{index === 0 ? "Exacto" : "Rapido"}</span>
                <strong>{money(amount)}</strong>
              </button>
            ))}
          </div>

          <TecladoNumerico onInput={handleInput} onDelete={handleDelete} />
        </section>

        <aside className="pago-panel pago-panel--summary">
          <div className={`pago-status-card ${puedePagar ? "is-ready" : "is-pending"}`}>
            <span>{puedePagar ? "Cambio a entregar" : "Falta por recibir"}</span>
            <strong>{money(puedePagar ? cambio : falta)}</strong>
            <small>
              {puedePagar
                ? "Listo para cerrar con efectivo."
                : "Captura el efectivo recibido por el cajero."}
            </small>
          </div>

          <div className="pago-breakdown">
            <div>
              <span>Venta</span>
              <strong>{money(totalOriginal)}</strong>
            </div>
            <div>
              <span>Redondeo</span>
              <strong>{redondeoActivo ? money(redondeo) : "$0.00"}</strong>
            </div>
            <div>
              <span>A cobrar</span>
              <strong>{money(totalCobro)}</strong>
            </div>
            <div>
              <span>Recibido</span>
              <strong>{money(recibidoNum)}</strong>
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
              {processing ? "Registrando..." : "Confirmar efectivo"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PagoEfectivo;
