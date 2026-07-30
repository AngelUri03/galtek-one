import React, { useMemo } from "react";
import { Dialog } from "primereact/dialog";
import { Skeleton } from "primereact/skeleton";
import ClienteAuditSection from "./ClienteAuditSection";
import { formatDate, moneyOrDash } from "./clientesUtils";

const titles = {
  compras: "Ultimas compras",
  auditoria: "Auditoria del cliente",
};

function EmptyState({ text }) {
  return (
    <div className="cli-advanced-empty">
      <i className="pi pi-inbox" />
      <span>{text}</span>
    </div>
  );
}

function PurchaseMetric({ label, value, accent }) {
  const displayValue = value === 0 ? "0" : value || "--";
  return (
    <div className={accent ? "cli-purchase-metric is-accent" : "cli-purchase-metric"}>
      <span>{label}</span>
      <strong title={String(displayValue)}>{displayValue}</strong>
    </div>
  );
}

function quantityText(value, unidad, esPesaje) {
  const number = Number(value);
  const display = Number.isFinite(number)
    ? number.toLocaleString("es-MX", {
        minimumFractionDigits: esPesaje ? 3 : 0,
        maximumFractionDigits: esPesaje ? 3 : 2,
      })
    : value || "--";
  return [display, unidad].filter(Boolean).join(" ");
}

function ProductRow({ producto }) {
  return (
    <div className="cli-purchase-product-row">
      <div>
        <strong title={producto.nombreProducto || "Producto"}>
          {producto.nombreProducto || "Producto"}
        </strong>
        <span title={producto.codigoBarras || ""}>
          {producto.codigoBarras || "Sin codigo"}
        </span>
      </div>
      <span>{quantityText(producto.cantidad, producto.unidad, producto.esPesaje)}</span>
      <span>{moneyOrDash(producto.precioUnitario)}</span>
      <strong>{moneyOrDash(producto.subtotal)}</strong>
    </div>
  );
}

function PurchaseRow({ pedido }) {
  const productos = Array.isArray(pedido.productos) ? pedido.productos : [];
  return (
    <article className="cli-purchase-modal-card">
      <div className="cli-purchase-modal-row">
        <span className="cli-purchase-row-icon">
          <i className="pi pi-shopping-bag" />
        </span>
        <div className="cli-purchase-row-main">
          <strong>{pedido.noOrden || "Venta"}</strong>
          <span>
            {formatDate(pedido.fecha)}
            {pedido.metodoPago ? ` - ${pedido.metodoPago}` : ""}
          </span>
        </div>
        <div className="cli-purchase-row-meta">
          <strong>{moneyOrDash(pedido.importeTotal)}</strong>
          <span>
            {pedido.productosTotales != null ? `${pedido.productosTotales} productos` : ""}
            {pedido.estado ? ` - ${pedido.estado}` : ""}
          </span>
        </div>
      </div>

      {productos.length ? (
        <div className="cli-purchase-product-list">
          <div className="cli-purchase-product-head">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Precio</span>
            <span>Subtotal</span>
          </div>
          {productos.map((producto, index) => (
            <ProductRow
              producto={producto}
              key={`${pedido.noOrden || "venta"}-${producto.idProducto || index}`}
            />
          ))}
        </div>
      ) : (
        <div className="cli-purchase-product-empty">
          <i className="pi pi-info-circle" />
          <span>Esta venta no trae detalle de productos en la respuesta.</span>
        </div>
      )}
    </article>
  );
}

function PurchasesSection({ cliente, loading }) {
  const pedidos = useMemo(
    () =>
      [...(cliente?.pedidos || [])].sort(
        (a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)
      ),
    [cliente]
  );
  const total = pedidos.reduce((sum, pedido) => sum + (Number(pedido.importeTotal) || 0), 0);
  const ticketPromedio = pedidos.length ? total / pedidos.length : null;
  const ultimaCompra = pedidos[0];

  if (loading && !cliente?.detailLoaded) {
    return (
      <section className="cli-advanced-section">
        <Skeleton width="18rem" height="2rem" />
        <div className="cli-purchase-metrics">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height="4.6rem" />
          ))}
        </div>
        <Skeleton height="5rem" />
        <Skeleton height="5rem" />
      </section>
    );
  }

  return (
    <section className="cli-advanced-section">
      <div className="cli-advanced-hero">
        <span className="cli-advanced-icon">
          <i className="pi pi-shopping-bag" />
        </span>
        <div>
          <h3>{cliente?.nombre || "Cliente"}</h3>
          <span>{pedidos.length} compras registradas</span>
        </div>
      </div>

      <div className="cli-purchase-metrics">
        <PurchaseMetric label="Compras" value={pedidos.length} accent />
        <PurchaseMetric label="Importe acumulado" value={moneyOrDash(total)} />
        <PurchaseMetric
          label="Ticket promedio"
          value={ticketPromedio == null ? "--" : moneyOrDash(ticketPromedio)}
        />
        <PurchaseMetric label="Ultima compra" value={formatDate(ultimaCompra?.fecha)} accent />
      </div>

      {pedidos.length ? (
        <div className="cli-purchase-modal-list">
          {pedidos.map((pedido, index) => (
            <PurchaseRow
              pedido={pedido}
              key={`${pedido.noOrden || "venta"}-${pedido.fecha || index}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState text="Todavia no hay compras registradas para este cliente." />
      )}
    </section>
  );
}

export default function ClienteAdvancedModals({ section, cliente, loading, onHide }) {
  if (!cliente) return null;

  return (
    <Dialog
      header={titles[section] || "Cliente"}
      visible={Boolean(section)}
      onHide={onHide}
      modal
      draggable={false}
      dismissableMask
      focusOnShow={false}
      closeButtonProps={{ tabIndex: -1 }}
      className="cli-advanced-dialog"
      style={{ width: "min(980px, calc(100vw - 72px))" }}
    >
      <div className={section === "auditoria" ? "cli-advanced-dialog-body is-audit" : "cli-advanced-dialog-body"}>
        {section === "compras" ? (
          <PurchasesSection cliente={cliente} loading={loading} />
        ) : null}
        {section === "auditoria" ? <ClienteAuditSection cliente={cliente} /> : null}
      </div>
    </Dialog>
  );
}
