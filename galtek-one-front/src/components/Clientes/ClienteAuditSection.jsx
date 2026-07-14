import React, { useMemo } from "react";
import { Tag } from "primereact/tag";
import { moneyOrDash } from "./clientesUtils";

const stateSeverity = {
  ACTIVO: "success",
  INACTIVO: "warning",
  ARCHIVADO: "secondary",
};

function valueOrDash(value) {
  if (value === 0) return "0";
  return value === null || value === undefined || value === "" ? "--" : value;
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ");
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function epoch(value) {
  const date = new Date(value || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function auditEvent({ source, title, entity, icon, user, date, detail, status }) {
  return {
    key: `${source}-${entity || title}-${date || Math.random()}`,
    source,
    title,
    entity,
    icon,
    user,
    date,
    detail,
    status,
  };
}

function buildAuditEvents(cliente, raw, estadoActual) {
  const pedidos = cliente?.pedidos || [];
  const events = [
    auditEvent({
      source: "Cliente",
      title: "Alta del cliente",
      entity: cliente?.nombre || raw.nombre,
      icon: "pi pi-plus",
      user: raw.usuarioCreacion,
      date: raw.fechaCreacion,
      detail: "Registro inicial del cliente.",
      status: "Creacion",
    }),
  ];

  if (raw.fechaModificacion) {
    events.push(
      auditEvent({
        source: "Cliente",
        title: "Ultima edicion general",
        entity: cliente?.nombre || raw.nombre,
        icon: "pi pi-pencil",
        user: raw.usuarioModificacion,
        date: raw.fechaModificacion,
        detail: "Actualizacion de datos generales, contacto, direccion o fiscales.",
        status: "Edicion",
      })
    );
  }

  if (raw.ultimaAccionEstado || raw.motivoCambioEstado || raw.fechaCambioEstado) {
    events.push(
      auditEvent({
        source: "Cliente",
        title: "Cambio de estado",
        entity: cliente?.nombre || raw.nombre,
        icon: "pi pi-refresh",
        user: raw.usuarioCambioEstado || raw.usuarioModificacion,
        date: raw.fechaCambioEstado || raw.fechaModificacion,
        detail: raw.motivoCambioEstado || "Sin motivo registrado por backend.",
        status: valueOrDash(raw.ultimaAccionEstado || estadoActual),
      })
    );
  }

  pedidos.forEach((pedido) => {
    events.push(
      auditEvent({
        source: "Ventas",
        title: "Compra registrada",
        entity: pedido.noOrden || "Venta",
        icon: "pi pi-shopping-bag",
        user: "",
        date: pedido.fecha,
        detail: [
          pedido.productosTotales != null ? `${pedido.productosTotales} productos` : "",
          pedido.metodoPago || "",
          pedido.estado || "",
        ]
          .filter(Boolean)
          .join(" - "),
        status: moneyOrDash(pedido.importeTotal),
      })
    );
  });

  return events
    .filter((item) => item.date || item.detail)
    .sort((a, b) => epoch(b.date) - epoch(a.date));
}

function AuditMetric({ label, value, accent }) {
  return (
    <div className={accent ? "cli-audit-metric is-accent" : "cli-audit-metric"}>
      <span>{label}</span>
      <strong title={String(valueOrDash(value))}>{valueOrDash(value)}</strong>
    </div>
  );
}

function AuditEvent({ item }) {
  return (
    <article className="cli-audit-event is-rich">
      <span className="cli-audit-event-icon">
        <i className={item.icon || "pi pi-history"} />
      </span>
      <div>
        <div className="cli-audit-event-head">
          <div>
            <strong>{item.title}</strong>
            <span>
              {valueOrDash(item.user)}
              {" - "}
              {formatDateTime(item.date)}
            </span>
          </div>
          <div className="cli-audit-event-tags">
            <em>Origen: {item.source}</em>
            {item.status ? <b>Accion: {item.status}</b> : null}
          </div>
        </div>
        {item.entity ? <small className="cli-audit-entity">{item.entity}</small> : null}
        {item.detail ? <p>{item.detail}</p> : null}
      </div>
    </article>
  );
}

export default function ClienteAuditSection({ cliente }) {
  const raw = useMemo(() => cliente?.raw || cliente || {}, [cliente]);
  const estadoActual = cliente?.estadoCliente || raw.estadoCliente || "ACTIVO";
  const cambioEstado =
    raw.ultimaAccionEstado || raw.motivoCambioEstado
      ? valueOrDash(raw.ultimaAccionEstado || raw.motivoCambioEstado)
      : "--";
  const events = useMemo(
    () => buildAuditEvents(cliente, raw, estadoActual),
    [cliente, raw, estadoActual]
  );

  return (
    <section className="cli-audit-section is-detailed">
      <div className="cli-audit-head">
        <div>
          <span className="cli-audit-kicker">Auditoria del cliente</span>
          <h3>Trazabilidad completa</h3>
        </div>
        <Tag
          value={String(estadoActual).toLowerCase()}
          severity={stateSeverity[estadoActual] || "info"}
          className="cli-state-tag"
        />
      </div>

      <div className="cli-audit-metrics">
        <AuditMetric label="Creado por" value={raw.usuarioCreacion} accent />
        <AuditMetric label="Fecha alta" value={formatDateTime(raw.fechaCreacion)} />
        <AuditMetric label="Ultima edicion" value={formatDateTime(raw.fechaModificacion)} />
        <AuditMetric label="Cambio de estado" value={cambioEstado} accent />
      </div>

      <div className="cli-audit-source-grid">
        <AuditMetric label="Eventos totales" value={events.length} accent />
        <AuditMetric label="Compras" value={cliente?.pedidos?.length || 0} />
        <AuditMetric label="Datos fiscales" value={cliente?.tieneDatosFiscales ? "Si" : "No"} />
        <AuditMetric label="Direccion" value={cliente?.tieneDireccion ? "Si" : "No"} />
      </div>

      <div className="cli-audit-timeline">
        {events.length ? (
          events.map((item) => <AuditEvent item={item} key={item.key} />)
        ) : (
          <article className="cli-audit-event">
            <span className="cli-audit-event-icon">
              <i className="pi pi-inbox" />
            </span>
            <div>
              <strong>Sin eventos registrados</strong>
              <span>--</span>
              <p>Cuando backend entregue historial, aqui se mostrara la trazabilidad.</p>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
