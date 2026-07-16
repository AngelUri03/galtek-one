import React from "react";
import { Tag } from "primereact/tag";
import { formatDate, moneyOrDash } from "./proveedoresUtils";
import { enumText, relationProductName, relationProductSku } from "./proveedorAdvancedUtils";

function stateSeverity(state) {
  const normalized = String(state || "").toUpperCase();
  if (normalized.includes("INACTIV")) return "secondary";
  if (normalized.includes("ACTIV") || normalized.includes("TIENDA")) return "success";
  if (normalized.includes("ARCHIV") || normalized.includes("DEVUELT")) return "secondary";
  if (normalized.includes("DAN") || normalized.includes("REPAR") || normalized.includes("PERD")) return "warning";
  return "secondary";
}

function SummaryShell({ title, icon, count, children, emptyText }) {
  return (
    <section className="prov-detail-section prov-summary-section">
      <div className="prov-detail-section-head">
        <div className="prov-summary-section-title">
          <span className="prov-summary-section-icon">
            <i className={icon} />
          </span>
          <div>
            <h3>{title}</h3>
            <p>{count} registros</p>
          </div>
        </div>
      </div>
      {count > 0 ? children : <div className="prov-detail-empty"><i className="pi pi-inbox" /><span>{emptyText}</span></div>}
    </section>
  );
}

function fileSize(value) {
  if (!value && value !== 0) return "--";
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  if (number >= 1024 * 1024) return `${(number / (1024 * 1024)).toFixed(1)} MB`;
  if (number >= 1024) return `${Math.round(number / 1024)} KB`;
  return `${number} B`;
}

function relatedName(entity, fallback = "--") {
  return entity?.nombre || entity?.nombreProveedor || entity?.descripcion || fallback;
}

function valueOrDash(value) {
  if (value === 0) return "0";
  return value || "--";
}

function SummaryItem({ title, subtitle, details = [], note, state }) {
  return (
    <article className="prov-summary-item">
      <div>
        <strong title={title}>{title}</strong>
        <span title={subtitle}>{subtitle || "--"}</span>
      </div>
      {state ? (
        <Tag value={state} severity={stateSeverity(state)} className="prov-state-tag" />
      ) : null}
      {details.length ? (
        <div className="prov-summary-meta-grid">
          {details.map(({ label, value }) => (
            <span key={label}>
              <small>{label}</small>
              <strong title={String(valueOrDash(value))}>{valueOrDash(value)}</strong>
            </span>
          ))}
        </div>
      ) : null}
      {note ? <p className="prov-summary-note">{note}</p> : null}
    </article>
  );
}

function SummaryList({ items, children }) {
  return <div className="prov-summary-list">{items.map(children)}</div>;
}

export default function ProveedorAdvancedSummary({
  productos = [],
  activos = [],
  documentos = [],
}) {
  return (
    <>
      <SummaryShell
        title="Productos asociados"
        icon="pi pi-box"
        count={productos.length}
        emptyText="Sin productos asociados."
      >
        <SummaryList items={productos}>
          {(item) => (
            <SummaryItem
              key={item.idProveedorProducto || relationProductName(item)}
              title={relationProductName(item)}
              subtitle={item.skuProveedor ? `SKU proveedor ${item.skuProveedor}` : "Sin SKU de proveedor"}
              details={[
                { label: "SKU interno", value: relationProductSku(item) || "--" },
                { label: "Ultimo costo", value: moneyOrDash(item.ultimoCosto || item.precioCompra) },
                { label: "Fecha costo", value: formatDate(item.fechaUltimoCosto) },
                { label: "Presentacion", value: item.presentacionCompra || "--" },
                { label: "Cantidad minima", value: item.cantidadMinima ?? "--" },
                { label: "Preferido", value: item.proveedorPreferido ? "Si" : "No" },
              ]}
              state={enumText(item.estadoRelacion || "ACTIVA")}
            />
          )}
        </SummaryList>
      </SummaryShell>

      <SummaryShell
        title="Activos prestados"
        icon="pi pi-th-large"
        count={activos.length}
        emptyText="Sin activos prestados."
      >
        <SummaryList items={activos}>
          {(item) => (
            <SummaryItem
              key={item.idProveedorActivo || item.nombre}
              title={item.nombre || "Activo prestado"}
              subtitle={`${enumText(item.tipo)} - ${item.numeroSerie || "Sin serie"}`}
              details={[
                { label: "Fecha entrega", value: formatDate(item.fechaEntrega) },
                { label: "Estado fisico", value: item.estadoFisico || "--" },
                { label: "Ubicacion", value: item.ubicacionTienda || "--" },
                { label: "Deposito", value: moneyOrDash(item.depositoGarantia) },
              ]}
              note={[item.condicionesPrestamo, item.notas].filter(Boolean).join(" | ")}
              state={enumText(item.estadoActivoPrestado || "EN_TIENDA")}
            />
          )}
        </SummaryList>
      </SummaryShell>

      <SummaryShell
        title="Documentos"
        icon="pi pi-file"
        count={documentos.length}
        emptyText="Sin documentos registrados."
      >
        <SummaryList items={documentos}>
          {(item) => (
            <SummaryItem
              key={item.idProveedorDocumento || item.nombre}
              title={item.nombre || "Documento"}
              subtitle={`${enumText(item.tipo)} - ${item.archivoNombre || (item.archivoBase64 ? "Base de datos" : "Sin archivo en DB")}`}
              details={[
                { label: "MIME", value: item.mimeType || "--" },
                { label: "Tamano", value: fileSize(item.tamanoBytes) },
                { label: "Activo relacionado", value: relatedName(item.activo) },
              ]}
              note={item.descripcion}
              state={enumText(item.estadoDocumento || "ACTIVO")}
            />
          )}
        </SummaryList>
      </SummaryShell>

    </>
  );
}
