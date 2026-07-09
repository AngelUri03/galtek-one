import React from "react";
import { Sidebar } from "primereact/sidebar";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import ProveedorAdvancedSummary from "./ProveedorAdvancedSummary";
import ProveedorAuditSection from "./ProveedorAuditSection";
import { enumText } from "./proveedorAdvancedUtils";
import { parseAddressText } from "./proveedorEditorUtils";
import {
  MODALIDAD_OPTIONS,
  PAGO_OPTIONS,
  ROL_CONTACTO_OPTIONS,
  TIPO_OPTIONS,
  ESTADO_PROVEEDOR_FORM_OPTIONS,
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

function valueOrDash(value) {
  if (value === 0) return "0";
  if (value === true) return "Si";
  if (value === false) return "No";
  return value || "--";
}

function InfoItem({ label, value, className = "", long = false }) {
  const displayValue = valueOrDash(value);
  return (
    <div className={`prov-detail-info-item ${long ? "is-long" : ""} ${className}`}>
      <span>{label}</span>
      <strong title={String(displayValue)}>{displayValue}</strong>
    </div>
  );
}

function DetailSection({ title, icon, children }) {
  return (
    <section className="prov-detail-section">
      <div className="prov-detail-section-head">
        <div className="prov-detail-section-title">
          {icon ? (
            <span className="prov-detail-section-icon">
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

function DetailChipRow({ items }) {
  return (
    <div className="prov-detail-chip-row">
      {items.map(({ label, icon, active }) => (
        <span className={active ? "is-on" : ""} key={label}>
          {icon ? <i className={icon} /> : null}
          {label}
        </span>
      ))}
    </div>
  );
}

function DetailNote({ label, value }) {
  if (!value) return null;
  return (
    <div className="prov-detail-note">
      {label ? <strong>{label}</strong> : null}
      <p>{value}</p>
    </div>
  );
}

function visitFrequencyText(value) {
  const text = String(value || "").toLowerCase();
  if (!text) return "";
  return text.includes("mes") ? "Dias del mes" : "Dias de la semana";
}

function ContactCard({ contacto }) {
  const estado = contacto.estadoContacto || (contacto.estatus === false ? "INACTIVO" : "ACTIVO");

  return (
    <article className="prov-detail-contact-card">
      <div className="prov-detail-contact-head">
        <div>
          <strong>{contacto.nombre || "Sin nombre"}</strong>
          <span>
            {labelFromOptions(ROL_CONTACTO_OPTIONS, contacto.rol, "Otro")}
            {contacto.contactoPrincipal ? " - Principal" : ""}
          </span>
        </div>
        <Tag
          value={enumText(estado)}
          severity={estado === "ACTIVO" ? "success" : "secondary"}
          className="prov-state-tag"
        />
      </div>
      <div className="prov-detail-contact-grid">
        <InfoItem label="Telefono" value={contacto.telefono} />
        <InfoItem label="WhatsApp" value={contacto.whatsapp} />
        <InfoItem label="Correo" value={contacto.correo} />
        <InfoItem label="Principal" value={contacto.contactoPrincipal} />
      </div>
      <DetailNote label="Notas del contacto" value={contacto.notas} />
    </article>
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

export default function ProveedorDetailPanel({
  visible,
  proveedor,
  loading,
  onHide,
}) {
  const estado = proveedor?.estadoProveedor || "ACTIVO";
  const contactos = proveedor?.contactos || [];
  const productos = proveedor?.productosAsociados || [];
  const activos = proveedor?.activosPrestados || [];
  const documentos = proveedor?.documentos || [];
  const direccion = parseAddressText(proveedor?.direccion || "");
  const addressItems = direccion.direccionEsLegacy
    ? [
        ["Direccion o referencia", proveedor?.direccion],
        ["Calle o avenida", ""],
        ["No. exterior", ""],
        ["No. interior", ""],
        ["Colonia o zona", ""],
        ["Municipio o ciudad", ""],
        ["Estado", ""],
        ["Codigo postal", ""],
      ]
    : [
        ["Calle o avenida", direccion.direccionCalle],
        ["No. exterior", direccion.direccionNumeroExterior],
        ["No. interior", direccion.direccionNumeroInterior],
        ["Colonia o zona", direccion.direccionColonia],
        ["Municipio o ciudad", direccion.direccionMunicipio],
        ["Estado", direccion.direccionEstado],
        ["Codigo postal", direccion.direccionCodigoPostal],
        ["Referencia", direccion.direccionReferencia],
      ];

  const header = (
    <div className="prov-detail-panel-title">
      <span>Proveedor</span>
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

            <DetailSection title="Datos generales" icon="pi pi-id-card">
              <div className="prov-detail-info-grid is-four">
                <InfoItem label="Nombre comercial" value={proveedor.nombreProveedor} />
                <InfoItem label="Razon social" value={proveedor.razonSocial} />
                <InfoItem label="RFC" value={proveedor.rfc || "Sin RFC"} />
                <InfoItem
                  label="Estado"
                  value={labelFromOptions(ESTADO_PROVEEDOR_FORM_OPTIONS, estado, enumText(estado))}
                />
                <InfoItem
                  label="Tipo de proveedor"
                  value={labelFromOptions(TIPO_OPTIONS, proveedor.tipoProveedor, "Sin tipo")}
                />
                <InfoItem label="Categoria principal" value={proveedor.categoriaPrincipal} />
                <InfoItem label="Contacto principal" value={proveedor.contacto} />
                <InfoItem label="Correo principal" value={proveedor.correo} />
                <InfoItem label="Telefono principal" value={proveedor.telefono} />
                <InfoItem label="WhatsApp principal" value={proveedor.whatsapp} />
              </div>
              <DetailNote label="Notas internas" value={proveedor.notasInternas} />
            </DetailSection>

            <DetailSection title="Direccion o zona" icon="pi pi-map-marker">
              <div className="prov-detail-info-grid is-address">
                {addressItems.map(([label, value], index) => (
                  <InfoItem
                    key={`${label}-${index}`}
                    label={label}
                    value={value}
                    long={label === "Direccion o referencia" || label === "Referencia"}
                    className={
                      label === "Direccion o referencia" || label === "Referencia"
                        ? "is-wide"
                        : ""
                    }
                  />
                ))}
              </div>
            </DetailSection>

            <DetailSection title="Contactos" icon="pi pi-users">
              {contactos.length ? (
                <div className="prov-detail-list">
                  {contactos.map((contacto) => (
                    <ContactCard
                      contacto={contacto}
                      key={contacto.idProveedorContacto || contacto.tempId || contacto.nombre}
                    />
                  ))}
                </div>
              ) : (
                <EmptySection text="Todavia no hay contactos capturados." />
              )}
            </DetailSection>

            <DetailSection title="Abastecimiento" icon="pi pi-truck">
              <div className="prov-detail-info-grid is-three">
                <InfoItem
                  label="Modalidad"
                  value={labelFromOptions(
                    MODALIDAD_OPTIONS,
                    proveedor.modalidadAbastecimiento,
                    "Sin dato"
                  )}
                />
                <InfoItem
                  label="Frecuencia de visita"
                  value={visitFrequencyText(proveedor.diasVisitaEntrega)}
                />
                <InfoItem label="Dias de visita" value={proveedor.diasVisitaEntrega} />
                <InfoItem label="Horario habitual" value={proveedor.horarioHabitual} />
                <InfoItem label="Pedido minimo" value={moneyOrDash(proveedor.pedidoMinimo)} />
                <InfoItem
                  label="Anticipacion requerida"
                  value={proveedor.tiempoEstimadoEntrega}
                  long
                />
                <InfoItem label="Costo de envio" value={moneyOrDash(proveedor.costoEnvio)} />
              </div>
              <DetailChipRow
                items={[
                  { label: "Pedido por WhatsApp", icon: "pi pi-whatsapp", active: proveedor.pedidoWhatsapp },
                  { label: "Pedido por llamada", icon: "pi pi-phone", active: proveedor.pedidoLlamada },
                  { label: "Pedido por app", icon: "pi pi-mobile", active: proveedor.pedidoApp },
                  { label: "Visita de ruta", icon: "pi pi-truck", active: proveedor.visitaRuta },
                  { label: "Compra en mostrador", icon: "pi pi-shopping-bag", active: proveedor.compraMostrador },
                ]}
              />
              <DetailNote
                label="Observaciones de abastecimiento"
                value={proveedor.observacionesAbastecimiento}
              />
            </DetailSection>

            <DetailSection title="Condiciones comerciales" icon="pi pi-briefcase">
              <div className="prov-detail-info-grid is-four">
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
              <DetailChipRow
                items={[
                  { label: "Devoluciones", icon: "pi pi-refresh", active: proveedor.permiteDevoluciones },
                  { label: "Cambios por caducidad", icon: "pi pi-calendar-times", active: proveedor.cambiosCaducidad },
                  { label: "Bonificaciones", icon: "pi pi-gift", active: proveedor.bonificaciones },
                  { label: "Descuentos frecuentes", icon: "pi pi-percentage", active: proveedor.descuentosFrecuentes },
                ]}
              />
              <DetailNote label="Notas comerciales" value={proveedor.notasComerciales} />
            </DetailSection>

            <ProveedorAdvancedSummary
              productos={productos}
              activos={activos}
              documentos={documentos}
            />

            <ProveedorAuditSection proveedor={proveedor} />
          </div>
        ) : (
          <EmptySection text="Selecciona un proveedor para ver el detalle." />
        )}
      </div>
    </Sidebar>
  );
}
