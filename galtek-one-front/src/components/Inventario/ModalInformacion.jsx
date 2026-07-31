import React, { useMemo } from "react";
import { Sidebar } from "primereact/sidebar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import "../../style/components/Inventario/ModalInformacion.css";

const getStockFromLotes = (lotes) =>
  Array.isArray(lotes)
    ? lotes.reduce((sum, l) => sum + (Number(l.cantidad) || 0), 0)
    : 0;

const getStockEstadoBase = (producto) => {
  const stock = producto?.stock ?? getStockFromLotes(producto?.lotes);
  const c = producto?.umbrales?.critico ?? 5;
  const b = producto?.umbrales?.bajo ?? 12;

  if (stock <= 0) return "AGOTADO";
  if (stock <= c) return "CRITICO";
  if (stock <= b) return "BAJO";
  return "OPTIMO";
};

const formatMoney = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
};

export default function ModalInformacion({ open, producto, onHide }) {
  const stock = useMemo(() => {
    if (!producto) return 0;
    return producto.stock ?? getStockFromLotes(producto.lotes);
  }, [producto]);

  const estado = useMemo(() => {
    if (!producto) return "—";
    return getStockEstadoBase({ ...producto, stock });
  }, [producto, stock]);

  const lotes = Array.isArray(producto?.lotes) ? producto.lotes : [];

  const customHeader = (
    <div className="prov-detail-panel-title">
      <span>HOJA DE DETALLE</span>
      <strong>{producto?.nombre || "Información de Producto"}</strong>
    </div>
  );

  return (
    <Sidebar
      visible={open}
      position="right"
      onHide={() => onHide?.()}
      header={customHeader}
      className="prov-detail-sidebar p-sidebar-md"
      dismissable={false}
    >
      <div className="prov-detail-panel">
        <div className="prov-detail-panel-body">
          {/* HERO SUMMARY */}
          <div className="prov-detail-hero">
            <div>
              <span className="prov-eyebrow">SKU: {producto?.sku || "—"}</span>
              <h2>{producto?.nombre}</h2>
              <p>{producto?.categoria || "Sin categoría"}</p>
            </div>
            <div className="prov-detail-hero-contact">
              <span>Stock Actual</span>
              <strong>{stock} Unidades</strong>
            </div>
          </div>

          {/* METRICAS Y DATOS CLAVE */}
          <div className="prov-detail-info-grid is-four" style={{ marginTop: "16px" }}>
            <div className="prov-detail-info-item">
              <span>Estado Stock</span>
              <strong style={{ color: "#0a7463" }}>{estado}</strong>
            </div>
            <div className="prov-detail-info-item">
              <span>Proveedor</span>
              <strong>{producto?.proveedor || "—"}</strong>
            </div>
            <div className="prov-detail-info-item">
              <span>Precio Compra</span>
              <strong>{formatMoney(producto?.precioCompra)}</strong>
            </div>
            <div className="prov-detail-info-item">
              <span>Precio Venta</span>
              <strong>{formatMoney(producto?.precioVenta)}</strong>
            </div>
          </div>

          {/* SECCIÓN UMBRALES */}
          <div className="prov-detail-section">
            <div className="prov-detail-section-head">
              <div className="prov-detail-section-title">
                <i className="pi pi-sliders-h prov-detail-section-icon" />
                <h3>Configuración de Alertas</h3>
              </div>
            </div>

            <div className="prov-detail-info-grid is-two">
              <div className="prov-detail-info-item">
                <span>Umbral Crítico</span>
                <strong>≤ {producto?.umbrales?.critico ?? 5} Unidades</strong>
              </div>
              <div className="prov-detail-info-item">
                <span>Umbral Bajo</span>
                <strong>≤ {producto?.umbrales?.bajo ?? 12} Unidades</strong>
              </div>
            </div>
          </div>

          {/* SECCIÓN LOTES REGISTRADOS */}
          <div className="prov-detail-section">
            <div className="prov-detail-section-head">
              <div className="prov-detail-section-title">
                <i className="pi pi-box prov-detail-section-icon" />
                <h3>Lotes en Existencia ({lotes.length})</h3>
              </div>
            </div>

            <DataTable value={lotes} size="small" className="prov-table" emptyMessage="Sin lotes registrados.">
              <Column field="lote" header="Lote" body={(l) => <span>{l?.lote ?? l?.id ?? "—"}</span>} />
              <Column field="cantidad" header="Cantidad" body={(l) => <strong>{l?.cantidad || 0}</strong>} />
              <Column
                field="fechaExp"
                header="Caducidad"
                body={(l) => (l?.fechaExp ? new Date(l.fechaExp).toLocaleDateString("es-MX") : "—")}
              />
              <Column field="ubicacion" header="Ubicación" body={(l) => <span>{l?.ubicacion || "—"}</span>} />
            </DataTable>
          </div>
        </div>

        {/* FOOTER */}
        <div className="prov-editor-footer">
          <Button label="Cerrar" className="prov-primary-btn" onClick={onHide} />
        </div>
      </div>
    </Sidebar>
  );
}