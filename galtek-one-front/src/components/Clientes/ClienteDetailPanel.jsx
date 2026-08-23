import React from "react";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import {
  ESTADO_FORM_OPTIONS,
  TIPO_OPTIONS,
  labelFromOptions,
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

function DetailWorkspaceActions({ cliente, pedidos, onNavigateSection }) {
  if (!onNavigateSection || !cliente) return null;

  const actions = [
    {
      key: "compras",
      label: "Ultimas compras",
      icon: "pi pi-shopping-bag",
      meta: `${cliente.comprasRegistradas ?? pedidos.length} compras`,
    },
    {
      key: "auditoria",
      label: "Auditoria",
      icon: "pi pi-history",
      meta: "Trazabilidad",
    },
  ];

  return (
    <section className="cli-detail-workspace-nav" aria-label="Navegacion del cliente">
      {actions.map((action) => (
        <Button
          key={action.key}
          className="cli-detail-workspace-action"
          onClick={() => onNavigateSection(action.key)}
          aria-label={action.label}
        >
          <i className={action.icon} />
          <span>
            <strong>{action.label}</strong>
            <small>{action.meta}</small>
          </span>
          <i className="pi pi-arrow-right" />
        </Button>
      ))}
    </section>
  );
}

export function ClienteDetailContent({
  cliente,
  loading,
  onNavigateSection,
  onStateAction,
}) {
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

  return (
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
              <strong>
                {cliente.whatsapp ? `WA ${cliente.whatsapp}` : cliente.email || "Sin contacto"}
              </strong>
            </div>
          </section>

          {estado === "ARCHIVADO" ? (
            <div className="cli-state-explain is-archived">
              <i className="pi pi-lock" />
              <div>
                <strong>Cliente archivado</strong>
                <span>Solo queda disponible para consulta e historial.</span>
              </div>
            </div>
          ) : estado === "INACTIVO" ? (
            <div className="cli-state-explain is-inactive">
              <i className="pi pi-pause" />
              <div>
                <strong>Cliente pausado</strong>
                <span>No debe estar disponible para nuevas compras hasta reactivarse.</span>
              </div>
              {onStateAction ? (
                <Button
                  icon="pi pi-play"
                  label="Reactivar"
                  className="cli-state-action"
                  onClick={() => onStateAction("reactivar", cliente)}
                />
              ) : null}
            </div>
          ) : null}

          <div className="cli-detail-metric-grid">
            <InfoItem
              label="Tipo"
              value={labelFromOptions(TIPO_OPTIONS, cliente.tipoCliente, "Persona")}
            />
            <InfoItem
              label="Estado"
              value={labelFromOptions(ESTADO_FORM_OPTIONS, estado, estado)}
            />
            <InfoItem
              label="Compras registradas"
              value={cliente.comprasRegistradas ?? pedidos.length}
            />
            <InfoItem
              label="Datos fiscales"
              value={cliente.tieneDatosFiscales ? "Preparados" : "Sin capturar"}
            />
          </div>

          <DetailWorkspaceActions
            cliente={cliente}
            pedidos={pedidos}
            onNavigateSection={onNavigateSection}
          />

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
        </div>
      ) : (
        <EmptySection text="Selecciona un cliente para ver el detalle." />
      )}
    </div>
  );
}

export default function ClienteDetailPanel({
  visible,
  cliente,
  loading,
  onHide,
  onManage,
  onStateAction,
}) {
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
      <ClienteDetailContent
        cliente={cliente}
        loading={loading}
        onNavigateSection={onManage ? (section) => onManage(cliente, section) : null}
        onStateAction={onStateAction}
      />
    </Sidebar>
  );
}
