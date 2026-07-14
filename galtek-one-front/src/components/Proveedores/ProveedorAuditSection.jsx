import React, { useEffect, useMemo, useState } from "react";
import { Tag } from "primereact/tag";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { enumText, relationProductName } from "./proveedorAdvancedUtils";
import { readApiPayload } from "./proveedoresUtils";

const api = new APIfetchApi();

const stateSeverity = {
  ACTIVO: "success",
  INACTIVO: "warning",
  ARCHIVADO: "secondary",
};

function valueOrDash(value) {
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

function firstValue(...values) {
  return values.find((value) => value !== null && value !== undefined && value !== "") || "";
}

function parseDetail(detail) {
  return String(detail || "")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const index = row.indexOf(":");
      if (index < 0) return { label: "Detalle", value: row };
      return { label: row.slice(0, index).trim(), value: row.slice(index + 1).trim() };
    });
}

function compactDiff(before, after, beforeLabel = "Antes", afterLabel = "Despues") {
  const beforeRows = parseDetail(before);
  const afterRows = parseDetail(after);
  if (!beforeRows.length && !afterRows.length) return null;
  return {
    beforeLabel,
    afterLabel,
    beforeRows: beforeRows.length ? beforeRows : [{ label: beforeLabel, value: "--" }],
    afterRows: afterRows.length ? afterRows : [{ label: afterLabel, value: "--" }],
  };
}

function event({
  source,
  title,
  entity,
  icon,
  user,
  date,
  detail,
  status,
  before,
  after,
  beforeLabel,
  afterLabel,
}) {
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
    diff: compactDiff(before, after, beforeLabel, afterLabel),
  };
}

function proveedorEvents(proveedor, raw, estadoActual) {
  const estadoAnterior = raw.estadoProveedorAnterior || "";
  const cambioEstado = raw.ultimaAccionEstado || estadoAnterior;
  const events = [
    event({
      source: "Proveedor",
      title: "Alta del proveedor",
      entity: proveedor?.nombreProveedor || raw.nombreProveedor,
      icon: "pi pi-plus",
      user: raw.usuarioCreacion,
      date: raw.fechaCreacion,
      detail: "Registro inicial de la relacion comercial.",
      status: "Creacion",
    }),
  ];

  if (raw.fechaModificacion) {
    events.push(event({
      source: "Proveedor",
      title: "Ultima edicion general",
      entity: proveedor?.nombreProveedor || raw.nombreProveedor,
      icon: "pi pi-pencil",
      user: raw.usuarioModificacion,
      date: raw.fechaModificacion,
      detail: "Actualizacion de datos comerciales, contactos o condiciones.",
      status: "Edicion",
    }));
  }

  if (cambioEstado || raw.motivoCambioEstado) {
    events.push(event({
      source: "Proveedor",
      title: "Cambio de estado",
      entity: proveedor?.nombreProveedor || raw.nombreProveedor,
      icon: "pi pi-refresh",
      user: raw.usuarioCambioEstado || raw.usuarioModificacion,
      date: raw.fechaCambioEstado || raw.fechaModificacion,
      detail: raw.motivoCambioEstado || "Sin motivo registrado por backend.",
      status: valueOrDash(raw.ultimaAccionEstado),
      before: estadoAnterior ? `Estado: ${estadoAnterior}` : "",
      after: `Estado: ${estadoActual}`,
    }));
  }

  return events;
}

function contactosEvents(contactos = []) {
  return contactos.flatMap((contacto) => {
    const name = contacto.nombre || contacto.contacto || "Contacto";
    return [
      contacto.fechaCreacion ? event({
        source: "Contactos",
        title: "Contacto registrado",
        entity: name,
        icon: "pi pi-user-plus",
        user: contacto.usuarioCreacion,
        date: contacto.fechaCreacion,
        detail: `${valueOrDash(contacto.rol)} - ${valueOrDash(contacto.telefono || contacto.whatsapp || contacto.correo)}`,
        status: contacto.contactoPrincipal ? "Principal" : "Contacto",
      }) : null,
      contacto.fechaModificacion ? event({
        source: "Contactos",
        title: "Contacto modificado",
        entity: name,
        icon: "pi pi-user-edit",
        user: contacto.usuarioModificacion,
        date: contacto.fechaModificacion,
        detail: contacto.notas || "Actualizacion de informacion del contacto.",
        status: enumText(contacto.estadoContacto),
      }) : null,
    ].filter(Boolean);
  });
}

function getCostHistoryUrl(idProveedor, idProveedorProducto) {
  return `${endpoints.proveedores}/${idProveedor}/productos/${idProveedorProducto}/historial-costos`;
}

function normalizeCostHistoryPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.historial)) return payload.historial;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function productosEvents(productos = [], costHistories = {}) {
  return productos.flatMap((producto) => {
    const name = relationProductName(producto);
    const historyRows =
      producto.historialCostos ||
      producto.historial ||
      costHistories[producto.idProveedorProducto] ||
      [];
    const baseDetail = [
      producto.skuProveedor ? `SKU proveedor ${producto.skuProveedor}` : "",
      producto.ultimoCosto != null ? `Ultimo costo $${producto.ultimoCosto}` : "",
      producto.proveedorPreferido ? "Proveedor preferido" : "",
    ].filter(Boolean).join(" - ");

    const events = [];
    if (producto.fechaCreacion) {
      events.push(event({
        source: "Productos",
        title: "Relacion producto-proveedor creada",
        entity: name,
        icon: "pi pi-box",
        user: producto.usuarioCreacion,
        date: producto.fechaCreacion,
        detail: baseDetail || "Relacion comercial registrada.",
        status: enumText(producto.estadoRelacion || "ACTIVA"),
      }));
    }
    if (producto.fechaModificacion) {
      events.push(event({
        source: "Productos",
        title: "Relacion producto-proveedor modificada",
        entity: name,
        icon: "pi pi-pencil",
        user: producto.usuarioModificacion,
        date: producto.fechaModificacion,
        detail: baseDetail || "Actualizacion de relacion comercial.",
        status: enumText(producto.estadoRelacion || "ACTIVA"),
      }));
    }
    historyRows.forEach((history) => {
      const costValue = history.costoNuevo ?? history.costo ?? history.precioCompra;
      events.push(event({
        source: "Costos",
        title: "Costo registrado",
        entity: name,
        icon: "pi pi-chart-line",
        user: history.usuarioCreacion || history.usuarioModificacion,
        date: history.fechaCosto || history.fechaCreacion || history.fechaModificacion,
        detail: history.motivo || history.observaciones || "Movimiento de costo del proveedor.",
        status: costValue != null ? `$${costValue}` : "Costo",
        before: history.costoAnterior != null ? `Costo: $${history.costoAnterior}` : "",
        after: costValue != null ? `Costo: $${costValue}` : "",
      }));
    });
    return events;
  });
}

function activosEvents(activos = []) {
  return activos.flatMap((activo) => {
    const name = activo.nombre || "Activo prestado";
    const events = [];
    if (activo.fechaCreacion || activo.fechaEntrega) {
      events.push(event({
        source: "Activos",
        title: "Activo registrado",
        entity: name,
        icon: "pi pi-th-large",
        user: activo.usuarioCreacion,
        date: activo.fechaEntrega || activo.fechaCreacion,
        detail: `${enumText(activo.tipo)} - ${valueOrDash(activo.ubicacionTienda)}`,
        status: enumText(activo.estadoActivo || "RECIBIDO"),
      }));
    }
    (activo.historial || []).forEach((history) => {
      events.push(event({
        source: "Activos",
        title: enumText(history.tipoEvento || "Movimiento de activo"),
        entity: name,
        icon: history.tipoEvento === "INCIDENTE" ? "pi pi-exclamation-triangle" : "pi pi-history",
        user: history.usuarioCreacion || history.usuarioModificacion,
        date: history.fechaEvento || history.fechaCreacion || history.fechaModificacion,
        detail: history.descripcion || "Movimiento registrado en activo prestado.",
        status: enumText(history.estadoNuevo || history.tipoEvento),
        before: firstValue(history.detalleAnterior, history.estadoAnterior ? `Estado: ${history.estadoAnterior}` : ""),
        after: firstValue(history.detalleNuevo, history.estadoNuevo ? `Estado: ${history.estadoNuevo}` : ""),
      }));
    });
    return events;
  });
}

function documentosEvents(documentos = []) {
  return documentos.flatMap((documento) => {
    const name = documento.nombre || documento.archivoNombre || "Documento";
    const events = [];
    if (documento.fechaCreacion) {
      events.push(event({
        source: "Documentos",
        title: "Documento registrado",
        entity: name,
        icon: "pi pi-file",
        user: documento.usuarioCreacion,
        date: documento.fechaCreacion,
        detail: `${enumText(documento.tipo)} - ${valueOrDash(documento.archivoNombre)}`,
        status: enumText(documento.estadoDocumento || "ACTIVO"),
      }));
    }
    (documento.historial || []).forEach((history) => {
      events.push(event({
        source: "Documentos",
        title: enumText(history.tipoEvento || "Movimiento de documento"),
        entity: name,
        icon: history.tipoEvento === "NUEVA_VERSION" ? "pi pi-refresh" : "pi pi-file-edit",
        user: history.usuarioCreacion || history.usuarioModificacion,
        date: history.fechaEvento || history.fechaCreacion || history.fechaModificacion,
        detail: history.descripcion || "Movimiento registrado en documento.",
        status: enumText(history.tipoEvento),
        before: history.detalleAnterior,
        after: history.detalleNuevo,
      }));
    });
    return events;
  });
}

function buildAuditEvents(proveedor, raw, estadoActual, costHistories = {}) {
  return [
    ...proveedorEvents(proveedor, raw, estadoActual),
    ...contactosEvents(proveedor?.contactos),
    ...productosEvents(proveedor?.productosAsociados, costHistories),
    ...activosEvents(proveedor?.activosPrestados),
    ...documentosEvents(proveedor?.documentos),
  ]
    .filter((item) => item.date || item.detail)
    .sort((a, b) => epoch(b.date) - epoch(a.date));
}

function AuditMetric({ label, value, accent }) {
  return (
    <div className={accent ? "prov-audit-metric is-accent" : "prov-audit-metric"}>
      <span>{label}</span>
      <strong title={String(valueOrDash(value))}>{valueOrDash(value)}</strong>
    </div>
  );
}

function AuditDiff({ diff }) {
  if (!diff) return null;
  return (
    <div className="prov-audit-diff">
      <div>
        <small>{diff.beforeLabel}</small>
        {diff.beforeRows.map((row) => (
          <span key={`before-${row.label}-${row.value}`}>
            <b>{row.label}</b>
            {valueOrDash(row.value)}
          </span>
        ))}
      </div>
      <div>
        <small>{diff.afterLabel}</small>
        {diff.afterRows.map((row) => (
          <span key={`after-${row.label}-${row.value}`}>
            <b>{row.label}</b>
            {valueOrDash(row.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

function AuditEvent({ item, detailed }) {
  const statusPrefix = ["Activos", "Productos"].includes(item.source) ? "Estado" : "Accion";
  return (
    <article className={detailed ? "prov-audit-event is-rich" : "prov-audit-event"}>
      <span className="prov-audit-event-icon">
        <i className={item.icon || "pi pi-history"} />
      </span>
      <div>
        <div className="prov-audit-event-head">
          <div>
            <strong>{item.title}</strong>
            <span>{valueOrDash(item.user)} - {formatDateTime(item.date)}</span>
          </div>
          <div className="prov-audit-event-tags">
            {detailed ? <em>Origen: {item.source}</em> : null}
            {item.status ? <b>{statusPrefix}: {item.status}</b> : null}
          </div>
        </div>
        {item.entity ? <small className="prov-audit-entity">{item.entity}</small> : null}
        {item.detail ? <p>{item.detail}</p> : null}
        {detailed ? <AuditDiff diff={item.diff} /> : null}
      </div>
    </article>
  );
}

export default function ProveedorAuditSection({ proveedor, detailed = false }) {
  const raw = useMemo(() => proveedor?.raw || proveedor || {}, [proveedor]);
  const [costHistories, setCostHistories] = useState({});
  const [costLoading, setCostLoading] = useState(false);
  const estadoActual = proveedor?.estadoProveedor || raw.estadoProveedor || "ACTIVO";
  const estadoAnterior = raw.estadoProveedorAnterior || "";
  const cambioEstado =
    raw.ultimaAccionEstado || estadoAnterior
      ? `${valueOrDash(raw.ultimaAccionEstado)} ${estadoAnterior ? `de ${estadoAnterior} a ${estadoActual}` : ""}`
      : "--";
  const events = useMemo(
    () => buildAuditEvents(proveedor, raw, estadoActual, costHistories),
    [proveedor, raw, estadoActual, costHistories]
  );
  const visibleEvents = detailed ? events : events.slice(0, 3);

  useEffect(() => {
    const productos = proveedor?.productosAsociados || [];
    if (!detailed || !proveedor?.idProveedor || !productos.length) {
      setCostHistories({});
      setCostLoading(false);
      return undefined;
    }

    let active = true;
    setCostLoading(true);
    Promise.allSettled(
      productos
        .filter((producto) => producto?.idProveedorProducto)
        .map(async (producto) => {
          const response = await api.fetchApi(
            {},
            "GET",
            undefined,
            getCostHistoryUrl(proveedor.idProveedor, producto.idProveedorProducto)
          );
          const payload = await readApiPayload(response, "historial de costos");
          return [producto.idProveedorProducto, normalizeCostHistoryPayload(payload)];
        })
    )
      .then((results) => {
        if (!active) return;
        const next = {};
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            const [id, rows] = result.value;
            next[id] = rows;
          }
        });
        setCostHistories(next);
      })
      .finally(() => {
        if (active) setCostLoading(false);
      });

    return () => {
      active = false;
    };
  }, [detailed, proveedor]);

  return (
    <section className={detailed ? "prov-audit-section is-detailed" : "prov-audit-section"}>
      <div className="prov-audit-head">
        <div>
          <span className="prov-audit-kicker">Auditoria del proveedor</span>
          <h3>{detailed ? "Trazabilidad completa" : "Quien hizo que y cuando"}</h3>
        </div>
        <Tag
          value={estadoActual.toLowerCase()}
          severity={stateSeverity[estadoActual] || "info"}
          className="prov-state-tag"
        />
      </div>

      <div className="prov-audit-metrics">
        <AuditMetric label="Creado por" value={raw.usuarioCreacion} accent />
        <AuditMetric label="Fecha alta" value={formatDateTime(raw.fechaCreacion)} />
        <AuditMetric label="Ultima edicion" value={formatDateTime(raw.fechaModificacion)} />
        <AuditMetric label="Cambio de estado" value={cambioEstado} accent />
      </div>

      {detailed ? (
        <div className="prov-audit-source-grid">
          <AuditMetric label="Eventos totales" value={events.length} accent />
          <AuditMetric label="Contactos" value={proveedor?.contactos?.length || 0} />
          <AuditMetric label="Productos" value={proveedor?.productosAsociados?.length || 0} />
          <AuditMetric label="Costos" value={costLoading ? "Cargando..." : Object.values(costHistories).reduce((sum, rows) => sum + rows.length, 0)} />
          <AuditMetric label="Activos" value={proveedor?.activosPrestados?.length || 0} />
          <AuditMetric label="Documentos" value={proveedor?.documentos?.length || 0} />
        </div>
      ) : null}

      <div className="prov-audit-timeline">
        {visibleEvents.length ? (
          visibleEvents.map((item) => (
            <AuditEvent item={item} detailed={detailed} key={item.key} />
          ))
        ) : (
          <article className="prov-audit-event">
            <span className="prov-audit-event-icon">
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
