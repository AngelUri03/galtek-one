import React from "react";

const CompraExitosa = ({ venta, onClose }) => {
  const { items, total, pago, fecha } = venta;

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
            <p>{fecha.toLocaleString()}</p>
          </div>

          <hr className="ticket-divider" />

          {/* LISTA DE ITEMS */}
          <div className="ticket-items">
            {items.map((item) => (
              <div key={item.id} className="ticket-item-row">
                <div className="ticket-item-name">
                  {item.cantidad} x {item.nombre}
                </div>
                <div className="ticket-item-price">
                  ${(item.precio * item.cantidad).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <hr className="ticket-divider" />

          {/* TOTALES */}
          <div className="ticket-totals">
            <div className="ticket-line">
              <strong>TOTAL</strong>
              <strong>${total.toFixed(2)}</strong>
            </div>

            <div className="ticket-line">
              <span>Método:</span>
              <span>{pago.metodo}</span>
            </div>

            {pago.metodo === "EFECTIVO" && (
              <>
                <div className="ticket-line">
                  <span>Recibido:</span>
                  <span>${pago.recibido?.toFixed(2)}</span>
                </div>
                <div className="ticket-line">
                  <span>Cambio:</span>
                  <span>${pago.cambio?.toFixed(2)}</span>
                </div>
              </>
            )}

            {pago.metodo === "TARJETA" && (
              <div className="ticket-line">
                <span>Ref:</span>
                <span>{pago.referencia}</span>
              </div>
            )}

            {pago.metodo === "TRANSFERENCIA" && (
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