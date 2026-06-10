import React from "react";
import "../../../../style/components/Ventas/TicketPreview.css";

/**
 * Vista previa del ticket de 58mm dentro del modal de pago.
 * Muestra todos los items del carrito, totales, recibido y cambio.
 */
const TicketPreview = ({
  carrito = [],
  total = 0,
  recibido = 0,
  cambio = 0,
  metodoPago = "EFECTIVO",
}) => {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const hora = ahora.toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit",
  });

  const folio = `#${Date.now().toString().slice(-6)}`;

  return (
    <div className="ticket-wrap">
      <div className="ticket-paper">

        {/* ── ENCABEZADO ── */}
        <div className="ticket-header">
          <p className="ticket-negocio">Mi Tienda</p>
          <p className="ticket-sub">Tel: 55 1234-5678</p>
        </div>

        <div className="ticket-sep">{'─'.repeat(26)}</div>

        {/* ── FOLIO Y FECHA ── */}
        <div className="ticket-row">
          <span className="ticket-label">Folio</span>
          <span className="ticket-value">{folio}</span>
        </div>
        <div className="ticket-row">
          <span className="ticket-label">{fecha}</span>
          <span className="ticket-value">{hora}</span>
        </div>
        <div className="ticket-row">
          <span className="ticket-label">Pago</span>
          <span className="ticket-value ticket-badge">{metodoPago}</span>
        </div>

        <div className="ticket-sep">{'─'.repeat(26)}</div>

        {/* ── ENCABEZADO COLUMNAS ── */}
        <div className="ticket-col-header">
          <span className="ticket-col-desc">Descripción</span>
          <span className="ticket-col-qty">Cant</span>
          <span className="ticket-col-price">Total</span>
        </div>

        <div className="ticket-sep-light">{'· '.repeat(13)}</div>

        {/* ── PRODUCTOS ── */}
        {carrito.length === 0 ? (
          <p className="ticket-empty">Sin productos</p>
        ) : (
          carrito.map((item, idx) => {
            const subtotalItem = (item.precio || 0) * (item.cantidad || 1);
            return (
              <div key={item.id ?? idx} className="ticket-item">
                <span className="ticket-item-name">{item.nombre}</span>
                <span className="ticket-item-qty">×{Number(item.cantidad).toFixed(item.unidad === "kg" ? 2 : 0)}</span>
                <span className="ticket-item-total">${subtotalItem.toFixed(2)}</span>
              </div>
            );
          })
        )}

        <div className="ticket-sep">{'─'.repeat(26)}</div>

        {/* ── TOTALES ── */}
        <div className="ticket-row">
          <span className="ticket-label">Subtotal</span>
          <span className="ticket-value">${total.toFixed(2)}</span>
        </div>

        <div className="ticket-row ticket-total-row">
          <span className="ticket-label-bold">TOTAL</span>
          <span className="ticket-value-bold">${total.toFixed(2)}</span>
        </div>

        {recibido > 0 && (
          <>
            <div className="ticket-sep-light">{'· '.repeat(13)}</div>
            <div className="ticket-row">
              <span className="ticket-label">Recibido</span>
              <span className="ticket-value">${recibido.toFixed(2)}</span>
            </div>
            <div className="ticket-row ticket-cambio-row">
              <span className="ticket-label-bold">Cambio</span>
              <span className="ticket-value-bold ticket-cambio">${cambio.toFixed(2)}</span>
            </div>
          </>
        )}

        <div className="ticket-sep">{'─'.repeat(26)}</div>

        {/* ── PIE ── */}
        <p className="ticket-footer">¡Gracias por su compra!</p>


      </div>
    </div>
  );
};

export default TicketPreview;
