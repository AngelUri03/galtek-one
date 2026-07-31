import React from "react";

const CompraExitosa = ({ venta, onClose }) => {
  const {
    items = [],
    total = 0,
    pago = {},
    fecha,
    folio,
    ticket = {},
    cliente = null,
  } = venta || {};
  const fechaTicket = fecha instanceof Date ? fecha : new Date(fecha || Date.now());
  const metodo = pago.metodo || pago.metodoPago || ticket.metodoPago || "";
  const metodoCode = String(metodo || "").toUpperCase();
  const metodoTipo = pago.metodoTipo || inferMetodoTipo(metodoCode);
  const clienteTicket = cliente || ticket?.cliente || null;
  const clienteNombre =
    clienteTicket?.nombre || clienteTicket?.razonSocial || ticket?.clienteNombre || "";
  const totalVenta = Number(pago.totalOriginal ?? total ?? 0);
  const totalCobrado = Number(pago.totalCobrado ?? pago.total ?? total ?? 0);
  const redondeoAplicado = Number(pago.redondeoAplicado || 0);
  const comisionMonto = Number(pago.comisionMonto || 0);
  const comisionPorcentaje = Number(pago.comisionPorcentaje || 0);
  const tieneAjuste = redondeoAplicado > 0 || comisionMonto > 0;

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
            {tieneAjuste ? (
              <div className="ticket-line">
                <span>Venta:</span>
                <span>${totalVenta.toFixed(2)}</span>
              </div>
            ) : null}

            {redondeoAplicado > 0 ? (
              <div className="ticket-line">
                <span>Redondeo:</span>
                <span>${redondeoAplicado.toFixed(2)}</span>
              </div>
            ) : null}

            {comisionMonto > 0 ? (
              <div className="ticket-line">
                <span>Comision{comisionPorcentaje > 0 ? ` ${comisionPorcentaje.toFixed(2)}%` : ""}:</span>
                <span>${comisionMonto.toFixed(2)}</span>
              </div>
            ) : null}

            <div className="ticket-line">
              <strong>{tieneAjuste ? "TOTAL COBRADO" : "TOTAL"}</strong>
              <strong>${totalCobrado.toFixed(2)}</strong>
            </div>

            <div className="ticket-line">
              <span>Método:</span>
              <span>{pago.metodoNombre || ticket.metodoPago || metodo}</span>
            </div>

            {clienteNombre ? (
              <div className="ticket-line">
                <span>Cliente:</span>
                <span>{clienteNombre}</span>
              </div>
            ) : null}

            {metodoTipo === "CASH" && (
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

            {metodoTipo === "TERMINAL" && pago.referencia && (
              <div className="ticket-line">
                <span>Ref:</span>
                <span>{pago.referencia}</span>
              </div>
            )}

            {metodoTipo === "TRANSFER" && (pago.folio || pago.referencia) && (
              <div className="ticket-line">
                <span>Folio:</span>
                <span>{pago.folio || pago.referencia}</span>
              </div>
            )}

            {metodoTipo === "CARD" && (pago.folio || pago.referencia) && (
              <div className="ticket-line">
                <span>Ref tarjeta:</span>
                <span>{pago.folio || pago.referencia}</span>
              </div>
            )}

            {metodoTipo === "VOUCHER" && (pago.folio || pago.referencia) && (
              <div className="ticket-line">
                <span>Folio vale:</span>
                <span>{pago.folio || pago.referencia}</span>
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

function inferMetodoTipo(value) {
  const code = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  if (code.includes("EFECTIVO") || code.includes("CASH")) return "CASH";
  if (code.includes("TERMINAL") || code.includes("MERCADO")) {
    return "TERMINAL";
  }
  if (code.includes("TARJETA") || code.includes("CREDITO") || code.includes("DEBITO") || code.includes("CARD")) return "CARD";
  if (code.includes("TRANSFER") || code.includes("SPEI")) return "TRANSFER";
  if (code.includes("VALE") || code.includes("VOUCHER")) return "VOUCHER";
  return "OTHER";
}

export default CompraExitosa;
