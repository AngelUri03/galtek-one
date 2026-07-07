import React from "react";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import ProveedorAcuerdosSection from "./ProveedorAcuerdosSection";
import ProveedorActivosSection from "./ProveedorActivosSection";
import ProveedorDocumentosSection from "./ProveedorDocumentosSection";
import ProveedorProductosSection from "./ProveedorProductosSection";
import {
  MODALIDAD_OPTIONS,
  PAGO_OPTIONS,
  ROL_CONTACTO_OPTIONS,
  TIPO_OPTIONS,
  formatDate,
  labelFromOptions,
  moneyOrDash,
} from "./proveedoresUtils";

const severityByEstado = {
  ACTIVO: "success",
  INACTIVO: "warning",
  ARCHIVADO: "secondary",
};

function EmptySection({ text }) {
  return (
    <div className="prov-detail-empty">
      <i className="pi pi-inbox" />
      <span>{text}</span>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="prov-detail-info-item">
      <span>{label}</span>
      <strong title={String(value || "--")}>{value || "--"}</strong>
    </div>
  );
}

function DetailSection({ title, action, children }) {
  return (
    <section className="prov-detail-section">
      <div className="prov-detail-section-head">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function LoadingDetail() {
  return (
    <div className="prov-detail-loading">
      <Skeleton width="18rem" height="2rem" />
      <div className="prov-detail-metric-grid">
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

function recentActivity(proveedor) {
  const items = [
    proveedor.ultimaCompra
      ? ["Ultima compra registrada", formatDate(proveedor.ultimaCompra)]
      : null,
    proveedor.ultimaActividad
      ? ["Actualizacion comercial", formatDate(proveedor.ultimaActividad)]
      : null,
    proveedor.raw?.fechaCreacion
      ? ["Alta de proveedor", formatDate(proveedor.raw.fechaCreacion)]
      : null,
  ].filter(Boolean);

  return items;
}

export default function ProveedorDetailPanel({
  visible,
  proveedor,
  loading,
  onHide,
  onEdit,
  onRefresh,
  showToast,
}) {
  const estado = proveedor?.estadoProveedor || "ACTIVO";
  const contactos = proveedor?.contactos || [];
  const productos = proveedor?.productosAsociados || [];
  const activos = proveedor?.activosPrestados || [];
  const documentos = proveedor?.documentos || [];
  const acuerdos = proveedor?.acuerdos || [];
  const actividad = proveedor ? recentActivity(proveedor) : [];

  const header = (
    <div className="prov-detail-panel-title">
      <span>Relacion comercial</span>
      <strong>{proveedor?.nombreProveedor || "Proveedor"}</strong>
    </div>
  );

  return (
    <Sidebar
      visible={visible}
      onHide={onHide}
      position="right"
      blockScroll
      showCloseIcon={false}
      className="prov-detail-sidebar"
      header={header}
    >
      <div className="prov-detail-panel">
        <div className="prov-detail-topbar">
          <Button
            icon="pi pi-pencil"
            label="Editar"
            className="prov-soft-btn"
            onClick={() => proveedor && onEdit(proveedor)}
            disabled={!proveedor || loading}
          />
          <button className="prov-editor-close" type="button" onClick={onHide}>
            <i className="pi pi-times" />
          </button>
        </div>

        {loading && !proveedor ? (
          <LoadingDetail />
        ) : proveedor ? (
          <div className="prov-detail-panel-body">
            <section className="prov-detail-hero">
              <div>
                <Tag
                  value={estado.toLowerCase()}
                  severity={severityByEstado[estado] || "info"}
                  className="prov-state-tag"
                />
                <h2>{proveedor.nombreProveedor || "Proveedor"}</h2>
                <p>
                  {proveedor.razonSocial ||
                    proveedor.categoriaPrincipal ||
                    "Proveedor operativo de abastecimiento"}
                </p>
              </div>
              <div className="prov-detail-hero-contact">
                <span>{proveedor.contacto || "Sin contacto principal"}</span>
                <strong>{proveedor.telefono || proveedor.whatsapp || "Sin telefono"}</strong>
              </div>
            </section>

            <div className="prov-detail-metric-grid">
              <InfoItem
                label="Tipo"
                value={labelFromOptions(TIPO_OPTIONS, proveedor.tipoProveedor, "Sin tipo")}
              />
              <InfoItem
                label="Modalidad"
                value={labelFromOptions(
                  MODALIDAD_OPTIONS,
                  proveedor.modalidadAbastecimiento,
                  "Sin dato"
                )}
              />
              <InfoItem
                label="Productos asociados"
                value={proveedor.productosAsociadosCount ?? productos.length ?? "--"}
              />
              <InfoItem
                label="Activos prestados"
                value={proveedor.activosPrestadosCount ?? activos.length ?? "--"}
              />
            </div>

            <DetailSection title="Contactos">
              {contactos.length ? (
                <div className="prov-detail-list">
                  {contactos.map((contacto) => (
                    <article className="prov-detail-list-item" key={contacto.tempId}>
                      <div>
                        <strong>{contacto.nombre || "Sin nombre"}</strong>
                        <span>
                          {labelFromOptions(ROL_CONTACTO_OPTIONS, contacto.rol, "Otro")}
                          {contacto.contactoPrincipal ? " · Principal" : ""}
                        </span>
                      </div>
                      <div>
                        <span>{contacto.telefono || "Sin telefono"}</span>
                        <small>{contacto.whatsapp ? `WA ${contacto.whatsapp}` : contacto.correo || "Sin correo"}</small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptySection text="Todavia no hay contactos capturados." />
              )}
            </DetailSection>

            <DetailSection title="Abastecimiento">
              <div className="prov-detail-info-grid">
                <InfoItem
                  label="Modalidad"
                  value={labelFromOptions(
                    MODALIDAD_OPTIONS,
                    proveedor.modalidadAbastecimiento,
                    "Sin dato"
                  )}
                />
                <InfoItem label="Dias de visita" value={proveedor.diasVisitaEntrega} />
                <InfoItem label="Horario habitual" value={proveedor.horarioHabitual} />
                <InfoItem label="Pedido minimo" value={moneyOrDash(proveedor.pedidoMinimo)} />
                <InfoItem
                  label="Tiempo de entrega"
                  value={proveedor.tiempoEstimadoEntrega}
                />
                <InfoItem label="Costo de envio" value={moneyOrDash(proveedor.costoEnvio)} />
              </div>
              <div className="prov-detail-chip-row">
                {[
                  ["WhatsApp", proveedor.pedidoWhatsapp],
                  ["Llamada", proveedor.pedidoLlamada],
                  ["App", proveedor.pedidoApp],
                  ["Ruta", proveedor.visitaRuta],
                  ["Mostrador", proveedor.compraMostrador],
                ].map(([label, active]) => (
                  <span className={active ? "is-on" : ""} key={label}>
                    {label}
                  </span>
                ))}
              </div>
              {proveedor.observacionesAbastecimiento ? (
                <p className="prov-detail-note">{proveedor.observacionesAbastecimiento}</p>
              ) : null}
            </DetailSection>

            <DetailSection title="Condiciones comerciales">
              <div className="prov-detail-info-grid">
                <InfoItem
                  label="Pago"
                  value={labelFromOptions(PAGO_OPTIONS, proveedor.formaPagoPrincipal, "Sin dato")}
                />
                <InfoItem label="Dias de credito" value={proveedor.diasCredito} />
                <InfoItem
                  label="Limite de credito"
                  value={moneyOrDash(proveedor.limiteCredito)}
                />
                <InfoItem
                  label="Credito"
                  value={proveedor.manejaCredito ? "Activo" : "No configurado"}
                />
              </div>
              <div className="prov-detail-chip-row">
                {[
                  ["Devoluciones", proveedor.permiteDevoluciones],
                  ["Caducidad", proveedor.cambiosCaducidad],
                  ["Bonificaciones", proveedor.bonificaciones],
                  ["Descuentos", proveedor.descuentosFrecuentes],
                ].map(([label, active]) => (
                  <span className={active ? "is-on" : ""} key={label}>
                    {label}
                  </span>
                ))}
              </div>
              {proveedor.notasComerciales ? (
                <p className="prov-detail-note">{proveedor.notasComerciales}</p>
              ) : null}
            </DetailSection>

            <ProveedorProductosSection
              proveedor={proveedor}
              items={productos}
              onRefresh={onRefresh}
              showToast={showToast}
            />

            <ProveedorActivosSection
              proveedor={proveedor}
              items={activos}
              onRefresh={onRefresh}
              showToast={showToast}
            />

            <ProveedorDocumentosSection
              proveedor={proveedor}
              items={documentos}
              activos={activos}
              onRefresh={onRefresh}
              showToast={showToast}
            />

            <ProveedorAcuerdosSection
              proveedor={proveedor}
              items={acuerdos}
              documentos={documentos}
              onRefresh={onRefresh}
              showToast={showToast}
            />

            <div className="prov-detail-two-col">
              <DetailSection title="Actividad reciente">
                {actividad.length ? (
                  <div className="prov-detail-timeline">
                    {actividad.map(([label, value]) => (
                      <div key={label}>
                        <i className="pi pi-circle-fill" />
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptySection text="Sin actividad reciente disponible." />
                )}
              </DetailSection>

              <DetailSection title="Auditoria">
                <div className="prov-detail-info-grid prov-detail-info-grid-audit">
                  <InfoItem label="Creado por" value={proveedor.raw?.usuarioCreacion} />
                  <InfoItem
                    label="Fecha alta"
                    value={formatDate(proveedor.raw?.fechaCreacion)}
                  />
                  <InfoItem
                    label="Editado por"
                    value={proveedor.raw?.usuarioModificacion}
                  />
                  <InfoItem
                    label="Ultima edicion"
                    value={formatDate(proveedor.raw?.fechaModificacion)}
                  />
                </div>
              </DetailSection>
            </div>
          </div>
        ) : (
          <EmptySection text="Selecciona un proveedor para ver el detalle." />
        )}
      </div>
    </Sidebar>
  );
}
