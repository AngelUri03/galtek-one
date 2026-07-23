import React from "react";

const CompraExitosa = ({ venta, onClose }) => {
  const {
    items = [],
    total = 0,
    pago = {},
    fecha,
    folio,
    ticket = {},
  } = venta || {};
  const fechaTicket = fecha instanceof Date ? fecha : new Date(fecha || Date.now());
  const metodo = pago.metodo || pago.metodoPago || ticket.metodoPago || "";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box ticket-modal">
        <div className="ticket-container">
          {/* HEADER */}
          <div className="ticket-header">
            <h3>Galtek One</h3>
            <p>Ticket de Venta</p>
            {folio || ticket.folio ? <p>{folio || ticket.folio}</p> : null}
            <p>{fechaTicket.toLocaleString("es-MX")}</p>
          </div>

          <hr className="ticket-divider" />

          {/* LISTA DE ITEMS */}
          <div className="ticket-items">
            {items.map((item, idx) => (
              <div key={item.id ?? idx} className="ticket-item-row">
                <div className="ticket-item-name">
                  {item.cantidad} x {item.nombre}
                </div>
                <div className="ticket-item-price">
                  ${Number((item.precio || 0) * (item.cantidad || 0)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <hr className="ticket-divider" />

          {/* TOTALES */}
          <div className="ticket-totals">
            <div className="ticket-line">
              <strong>TOTAL</strong>
              <strong>${Number(total || 0).toFixed(2)}</strong>
            </div>

            <div className="ticket-line">
              <span>Método:</span>
              <span>{pago.metodoNombre || ticket.metodoPago || metodo}</span>
            </div>

            {metodo === "EFECTIVO" && (
              <>
                <div className="ticket-line">
                  <span>Recibido:</span>
                  <span>${Number(pago.recibido || 0).toFixed(2)}</span>
                </div>
                <div className="ticket-line">
                  <span>Cambio:</span>
                  <span>${Number(pago.cambio || 0).toFixed(2)}</span>
                </div>
              </>
            )}

            {metodo === "TARJETA" && (
              <div className="ticket-line">
                <span>Ref:</span>
                <span>{pago.referencia}</span>
              </div>
            )}

            {metodo === "TRANSFERENCIA" && (
              <div className="ticket-line">
                <span>Folio:</span>
                <span>{pago.folio}</span>
              </div>
            )}
          </div>

          <div className="ticket-footer">
            <p>¡Gracias por su compra!</p>
          </div>
        </div>

        {/* BOTONES */}
        <div className="ticket-actions no-print">
          <button className="pago-btn" onClick={handlePrint}>
            Imprimir Ticket
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompraExitosa;
