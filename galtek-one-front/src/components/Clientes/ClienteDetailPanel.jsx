import React from "react";
import { Sidebar } from "primereact/sidebar";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import {
  ESTADO_FORM_OPTIONS,
  TIPO_OPTIONS,
  formatDate,
  labelFromOptions,
  moneyOrDash,
} from "./clientesUtils";

const severityByEstado = {
  ACTIVO: "success",
  INACTIVO: "warning",
  ARCHIVADO: "secondary",
};

function valueOrDash(value) {
  if (value === 0) return "0";
  if (value === true) return "Si";
  if (value === false) return "No";
  return value || "--";
}

function EmptySection({ text }) {
  return (
    <div className="cli-detail-empty">
      <i className="pi pi-inbox" />
      <span>{text}</span>
    </div>
  );
}

function InfoItem({ label, value, className = "", long = false }) {
  const displayValue = valueOrDash(value);
  return (
    <div className={`cli-detail-info-item ${long ? "is-long" : ""} ${className}`}>
      <span>{label}</span>
      <strong title={String(displayValue)}>{displayValue}</strong>
    </div>
  );
}

function DetailSection({ title, icon, children }) {
  return (
    <section className="cli-detail-section">
      <div className="cli-detail-section-head">
        <div className="cli-detail-section-title">
          {icon ? (
            <span className="cli-detail-section-icon">
              <i className={icon} />
            </span>
          ) : null}
          <h3>{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function DetailNote({ label, value }) {
  if (!value) return null;
  return (
    <div className="cli-detail-note">
      {label ? <strong>{label}</strong> : null}
      <p>{value}</p>
    </div>
  );
}

function LoadingDetail() {
  return (
    <div className="cli-detail-loading">
      <Skeleton width="18rem" height="2rem" />
      <div className="cli-detail-metric-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} height="5rem" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} height="7rem" />
      ))}
    </div>
  );
}

function PurchaseRow({ pedido }) {
  return (
    <article className="cli-purchase-row">
      <div>
        <strong>{pedido.noOrden || "Venta"}</strong>
        <span>
          {formatDate(pedido.fecha)}
          {pedido.metodoPago ? ` - ${pedido.metodoPago}` : ""}
        </span>
      </div>
      <div>
        <strong>{moneyOrDash(pedido.importeTotal)}</strong>
        <span>{pedido.estado || "Sin estado"}</span>
      </div>
    </article>
  );
}

export default function ClienteDetailPanel({ visible, cliente, loading, onHide }) {
  const estado = cliente?.estadoCliente || "ACTIVO";
  const pedidos = cliente?.pedidos || [];
  const direccionItems = [
    ["Direccion", cliente?.direccion],
    ["Calle", cliente?.direccionCalle],
    ["No. exterior", cliente?.direccionNumeroExterior],
    ["No. interior", cliente?.direccionNumeroInterior],
    ["Colonia o zona", cliente?.direccionColonia],
    ["Municipio o ciudad", cliente?.direccionMunicipio],
    ["Estado", cliente?.direccionEstado],
    ["Codigo postal", cliente?.direccionCodigoPostal],
    ["Referencia", cliente?.direccionReferencia],
  ];

  const header = (
    <div className="cli-detail-panel-title">
      <span>Cliente</span>
      <strong>{cliente?.nombre || "Cliente"}</strong>
    </div>
  );

  return (
    <Sidebar
      visible={visible}
      onHide={onHide}
      position="right"
      blockScroll
      showCloseIcon={false}
      className="cli-detail-sidebar"
      header={header}
    >
      <div className="cli-detail-panel">
        {loading && !cliente ? (
          <LoadingDetail />
        ) : cliente ? (
          <div className="cli-detail-panel-body">
            <section className="cli-detail-hero">
              <div>
                <Tag
                  value={estado.toLowerCase()}
                  severity={severityByEstado[estado] || "info"}
                  className="cli-state-tag"
                />
                <h2>{cliente.nombre || "Cliente"}</h2>
                <p>{cliente.alias || cliente.razonSocial || "Comprador registrado ligero"}</p>
              </div>
              <div className="cli-detail-hero-contact">
                <span>{cliente.telefono || "Sin telefono"}</span>
                <strong>{cliente.whatsapp ? `WA ${cliente.whatsapp}` : cliente.email || "Sin contacto"}</strong>
              </div>
            </section>

            <div className="cli-detail-metric-grid">
              <InfoItem
                label="Tipo"
                value={labelFromOptions(TIPO_OPTIONS, cliente.tipoCliente, "Persona")}
              />
              <InfoItem
                label="Estado"
                value={labelFromOptions(ESTADO_FORM_OPTIONS, estado, estado)}
              />
              <InfoItem label="Compras registradas" value={cliente.comprasRegistradas ?? pedidos.length} />
              <InfoItem label="Datos fiscales" value={cliente.tieneDatosFiscales ? "Preparados" : "Sin capturar"} />
            </div>

            <DetailSection title="Datos generales" icon="pi pi-id-card">
              <div className="cli-detail-info-grid is-four">
                <InfoItem label="Nombre" value={cliente.nombre} />
                <InfoItem label="Alias" value={cliente.alias} />
                <InfoItem
                  label="Tipo"
                  value={labelFromOptions(TIPO_OPTIONS, cliente.tipoCliente, "Persona")}
                />
                <InfoItem
                  label="Estado"
                  value={labelFromOptions(ESTADO_FORM_OPTIONS, estado, estado)}
                />
              </div>
              <DetailNote label="Notas internas" value={cliente.notasInternas} />
            </DetailSection>

            <DetailSection title="Contacto" icon="pi pi-phone">
              <div className="cli-detail-info-grid is-three">
                <InfoItem label="Telefono" value={cliente.telefono} />
                <InfoItem label="WhatsApp" value={cliente.whatsapp} />
                <InfoItem label="Correo" value={cliente.email} />
              </div>
            </DetailSection>

            <DetailSection title="Direccion" icon="pi pi-map-marker">
              <div className="cli-detail-info-grid is-address">
                {direccionItems.map(([label, value]) => (
                  <InfoItem
                    key={label}
                    label={label}
                    value={value}
                    long={label === "Direccion" || label === "Referencia"}
                    className={label === "Direccion" || label === "Referencia" ? "is-wide" : ""}
                  />
                ))}
              </div>
            </DetailSection>

            <DetailSection title="Datos fiscales" icon="pi pi-file">
              <div className="cli-detail-info-grid is-three">
                <InfoItem label="RFC" value={cliente.rfc} />
                <InfoItem label="Razon social" value={cliente.razonSocial} />
                <InfoItem label="CP fiscal" value={cliente.codigoPostalFiscal} />
                <InfoItem label="Correo fiscal" value={cliente.correoFiscal} />
                <InfoItem label="Regimen fiscal" value={cliente.regimenFiscal} />
                <InfoItem label="Uso CFDI" value={cliente.usoCfdi} />
              </div>
            </DetailSection>

            <DetailSection title="Ultimas compras" icon="pi pi-shopping-bag">
              {pedidos.length ? (
                <div className="cli-purchase-list">
                  {pedidos.slice(0, 5).map((pedido, index) => (
                    <PurchaseRow pedido={pedido} key={`${pedido.noOrden}-${pedido.fecha}-${index}`} />
                  ))}
                </div>
              ) : (
                <EmptySection text="Todavia no hay compras registradas para este cliente." />
              )}
            </DetailSection>

            <DetailSection title="Auditoria" icon="pi pi-history">
              <div className="cli-detail-info-grid is-three">
                <InfoItem label="Creado por" value={cliente.usuarioCreacion} />
                <InfoItem label="Creacion" value={formatDate(cliente.fechaCreacion)} />
                <InfoItem label="Modificado por" value={cliente.usuarioModificacion} />
                <InfoItem label="Modificacion" value={formatDate(cliente.fechaModificacion)} />
                <InfoItem label="Ultima accion" value={cliente.ultimaAccionEstado} />
                <InfoItem label="Cambio de estado" value={formatDate(cliente.fechaCambioEstado)} />
              </div>
              <DetailNote label="Motivo de estado" value={cliente.motivoCambioEstado} />
            </DetailSection>
          </div>
        ) : (
          <EmptySection text="Selecciona un cliente para ver el detalle." />
        )}
      </div>
    </Sidebar>
  );
}
