import React, { useMemo } from "react";
import { Dialog } from "primereact/dialog";
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

const formatDateTime = (d) => {
  if (!(d instanceof Date)) return "—";
  return d.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function ModalInformacion({
  open,
  producto,
  onHide
}) {
  const stock = useMemo(() => {
    if (!producto) return 0;
    return producto.stock ?? getStockFromLotes(producto.lotes);
  }, [producto]);

  const estado = useMemo(() => {
    if (!producto) return "—";
    return getStockEstadoBase({ ...producto, stock });
  }, [producto, stock]);

  const estadoMeta = useMemo(() => {
    const map = {
      AGOTADO: { label: "Agotado", cls: "inv-im-chip inv-im-chip--agotado" },
      CRITICO: { label: "Crítico", cls: "inv-im-chip inv-im-chip--critico" },
      BAJO: { label: "Bajo", cls: "inv-im-chip inv-im-chip--bajo" },
      OPTIMO: { label: "Óptimo", cls: "inv-im-chip inv-im-chip--optimo" },
    };
    return map[estado] || { label: String(estado), cls: "inv-im-chip" };
  }, [estado]);

  const activoLabel = producto?.activo ? "Activo" : "Descontinuado";
  const activoCls = producto?.activo
    ? "inv-im-chip inv-im-chip--activo"
    : "inv-im-chip inv-im-chip--inactivo";

  const lotes = Array.isArray(producto?.lotes) ? producto.lotes : [];

  const footer = (
    <div className="inv-im-footer">
     
    </div>
  );

  const header = (
    <div className="inv-im-header">
      <div className="inv-im-header-left">
        <span className="inv-im-title">Más información</span>
        {producto?.nombre ? (
          <span className="inv-im-subtitle" title={producto.nombre}>
            {producto.nombre}
          </span>
        ) : (
          <span className="inv-im-subtitle inv-im-subtitle--muted">
            Sin producto seleccionado
          </span>
        )}
      </div>

      <div className="inv-im-header-right">
        {producto && (
          <>
            <span className={estadoMeta.cls}>{estadoMeta.label}</span>
            <span className={activoCls}>{activoLabel}</span>
          </>
        )}
      </div>
    </div>
  );

  const caducidadBody = (l) => {
    if (!l?.fechaExp) return <span className="inv-im-muted">—</span>;
    const d = new Date(l.fechaExp);
    const time = d.getTime();
    const now = Date.now();
    const soon = now + 15 * 24 * 60 * 60 * 1000;

    let cls = "inv-im-date inv-im-date--ok";
    let hint = "En regla";
    if (time < now) {
      cls = "inv-im-date inv-im-date--bad";
      hint = "Caducado";
    } else if (time <= soon) {
      cls = "inv-im-date inv-im-date--soon";
      hint = "Próximo a caducar";
    }

    return (
      <span className={cls} title={hint}>
        {d.toLocaleDateString("es-MX", { dateStyle: "medium" })}
      </span>
    );
  };

  return (
    <Dialog
      header={header}
      visible={open}
      onHide={onHide}
      modal
      closable
      draggable={false}
      className="inv-info-dialog"
      footer={footer}
    >
      <div className="inv-im-wrap">
        {/* TOP: Imagen + resumen */}
        <div className="inv-im-top">
          <div className="inv-im-media">
            <div className="inv-im-thumbWrap">
              {producto?.imagen ? (
                <img
                  src={producto.imagen}
                  alt={producto.nombre || "Producto"}
                  className="inv-im-thumb"
                  loading="lazy"
                />
              ) : (
                <div className="inv-im-thumbPlaceholder">
                  <i className="pi pi-image" />
                </div>
              )}
            </div>

            <div className="inv-im-quick">
              <div className="inv-im-quickRow">
                <span className="inv-im-k">SKU</span>
                <span className="inv-im-v tabular">
                  {producto?.sku || "—"}
                </span>
              </div>
              <div className="inv-im-quickRow">
                <span className="inv-im-k">Stock total</span>
                <span className="inv-im-v tabular inv-im-stockBig">
                  {Number(stock) || 0}
                </span>
              </div>
              <div className="inv-im-quickRow">
                <span className="inv-im-k">Actualizado</span>
                <span className="inv-im-v">{formatDateTime(producto?.updatedAt)}</span>
              </div>

              <div className="inv-im-quickBadges">
                <span className="inv-im-chip inv-im-chip--soft">
                  Umbral crítico:{" "}
                  <b className="tabular">{producto?.umbrales?.critico ?? 5}</b>
                </span>
                <span className="inv-im-chip inv-im-chip--soft">
                  Umbral bajo:{" "}
                  <b className="tabular">{producto?.umbrales?.bajo ?? 12}</b>
                </span>
              </div>
            </div>
          </div>

          <div className="inv-im-summary">
            <div className="inv-im-card">
              <div className="inv-im-cardTitle">Detalle</div>

              <div className="inv-im-grid">
                <div className="inv-im-field">
                  <label>Categoría</label>
                  <div className="inv-im-value">{producto?.categoria || "—"}</div>
                </div>

                <div className="inv-im-field">
                  <label>Proveedor</label>
                  <div className="inv-im-value">{producto?.proveedor || "—"}</div>
                </div>

                <div className="inv-im-field">
                  <label>Precio compra</label>
                  <div className="inv-im-value tabular">
                    {formatMoney(producto?.precioCompra)}
                  </div>
                </div>

                <div className="inv-im-field">
                  <label>Precio venta</label>
                  <div className="inv-im-value tabular">
                    {formatMoney(producto?.precioVenta)}
                  </div>
                </div>
              </div>

              <div className="inv-im-divider" />

              <div className="inv-im-note">
                <i className="pi pi-info-circle" />
                <span>
                  El estado de stock se calcula con base en el stock total y los
                  umbrales (crítico/bajo).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LOTES */}
        <div className="inv-im-bottom">
          <div className="inv-im-card">
            <div className="inv-im-cardTitle">
              Lotes <span className="inv-im-cardHint">({lotes.length})</span>
            </div>

            <DataTable
              value={lotes}
              size="small"
              className="inv-im-lotesTable"
              emptyMessage="Sin lotes"
              scrollable
              scrollHeight="240px"
              responsive
            >
              <Column
                field="lote"
                header="Lote"
                body={(l) => (
                  <span className="tabular">{l?.lote ?? l?.id ?? "—"}</span>
                )}
              />
              <Column
                field="cantidad"
                header="Cantidad"
                body={(l) => (
                  <span className="tabular inv-im-qty">{Number(l?.cantidad) || 0}</span>
                )}
              />
              <Column field="fechaExp" header="Caducidad" body={caducidadBody} />
              <Column
                field="ubicacion"
                header="Ubicación"
                body={(l) => <span>{l?.ubicacion || "—"}</span>}
              />
            </DataTable>
          </div>
        </div>
      </div>
    </Dialog>
  );
}