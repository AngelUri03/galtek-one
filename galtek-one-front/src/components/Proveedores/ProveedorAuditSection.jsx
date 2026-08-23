import React, { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { enumText, relationProductName } from "./proveedorAdvancedUtils";
import { readApiPayload } from "./proveedoresUtils";

const api = new APIfetchApi();
const TOOLTIP = { position: "top", className: "prov-action-tooltip" };

const stateSeverity = {
  ACTIVO: "success",
  INACTIVO: "warning",
  ARCHIVADO: "secondary",
};

const AUDIT_SECTION_OPTIONS = [
  { label: "Todo", value: "TODOS" },
  { label: "Editar", value: "EDITAR" },
  { label: "Productos", value: "PRODUCTOS" },
  { label: "Activos", value: "ACTIVOS" },
  { label: "Documentos", value: "DOCUMENTOS" },
];

const AUDIT_SECTION_META = {
  EDITAR: { label: "Editar", icon: "pi pi-pencil" },
  PRODUCTOS: { label: "Productos", icon: "pi pi-box" },
  ACTIVOS: { label: "Activos", icon: "pi pi-th-large" },
  DOCUMENTOS: { label: "Documentos", icon: "pi pi-file" },
};

const SOURCE_TO_SECTION = {
  Proveedor: "EDITAR",
  Contactos: "EDITAR",
  Productos: "PRODUCTOS",
  Costos: "PRODUCTOS",
  Activos: "ACTIVOS",
  Documentos: "DOCUMENTOS",
};

function valueOrDash(value) {
  return value === null || value === undefined || value === "" ? "--" : value;
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = parseDateValue(value);
  if (!date) return value ? String(value).replace("T", " ") : "--";
  const hasTime = !/^\d{4}-\d{2}-\d{2}$/.test(String(value));
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function epoch(value) {
  const date = parseDateValue(value);
  return date ? date.getTime() : 0;
}

function filterTime(value) {
  return epoch(value);
}

function sameMoment(a, b) {
  const left = epoch(a);
  const right = epoch(b);
  if (!left || !right) return false;
  return Math.abs(left - right) < 1000;
}

function firstValue(...values) {
  return values.find((value) => value !== null && value !== undefined && value !== "") || "";
}

function cleanFacts(facts = []) {
  return facts
    .map((fact) => String(fact || "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

function moneyValue(value) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return number.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });
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
    beforeRows,
    afterRows,
  };
}

function event({
  source,
  section,
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
  facts,
}) {
  const resolvedSection = section || SOURCE_TO_SECTION[source] || "EDITAR";
  return {
    key: [source, title, entity, date, status, detail].map(valueOrDash).join("|"),
    source,
    section: resolvedSection,
    title,
    entity,
    icon,
    user,
    date,
    detail,
    status,
    facts: cleanFacts(facts),
    diff: compactDiff(before, after, beforeLabel, afterLabel),
  };
}

function getCostHistoryUrl(idProveedor, idProveedorProducto) {
  return `${endpoints.proveedores}/${idProveedor}/productos/${idProveedorProducto}/historial-costos`;
}

function getAssetHistoryUrl(idProveedor, idProveedorActivo) {
  return `${endpoints.proveedores}/${idProveedor}/activos/${idProveedorActivo}/historial`;
}

function normalizeHistoryPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.historial)) return payload.historial;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function proveedorEvents(proveedor, raw, estadoActual) {
  const name = proveedor?.nombreProveedor || raw.nombreProveedor || "Proveedor";
  const estadoAnterior = raw.estadoProveedorAnterior || "";
  const cambioEstado = raw.ultimaAccionEstado || estadoAnterior;
  const events = [
    event({
      source: "Proveedor",
      title: "Alta del proveedor",
      entity: name,
      icon: "pi pi-plus",
      user: raw.usuarioCreacion,
      date: raw.fechaCreacion,
      detail: "Registro inicial de la relacion comercial.",
      status: "Creacion",
      facts: [
        raw.tipoProveedor ? `Tipo ${enumText(raw.tipoProveedor)}` : "",
        raw.modalidadAbastecimiento ? `Modalidad ${enumText(raw.modalidadAbastecimiento)}` : "",
        raw.formaPagoPrincipal ? `Pago ${enumText(raw.formaPagoPrincipal)}` : "",
      ],
    }),
  ];

  if (raw.fechaModificacion && !sameMoment(raw.fechaModificacion, raw.fechaCreacion)) {
    events.push(event({
      source: "Proveedor",
      title: "Datos generales editados",
      entity: name,
      icon: "pi pi-pencil",
      user: raw.usuarioModificacion,
      date: raw.fechaModificacion,
      detail: "Actualizacion de datos comerciales, abastecimiento, pago o notas.",
      status: "Edicion",
    }));
  }

  if (cambioEstado || raw.motivoCambioEstado) {
    events.push(event({
      source: "Proveedor",
      title: "Estado del proveedor actualizado",
      entity: name,
      icon: estadoActual === "ARCHIVADO" ? "pi pi-folder" : estadoActual === "ACTIVO" ? "pi pi-play" : "pi pi-pause",
      user: raw.usuarioCambioEstado || raw.usuarioModificacion,
      date: raw.fechaCambioEstado || raw.fechaModificacion,
      detail: raw.motivoCambioEstado || "Sin motivo registrado por backend.",
      status: enumText(raw.ultimaAccionEstado || estadoActual),
      before: estadoAnterior ? `Estado: ${estadoAnterior}` : "",
      after: `Estado: ${estadoActual}`,
    }));
  }

  return events;
}

function contactosEvents(contactos = []) {
  return contactos.flatMap((contacto) => {
    const name = contacto.nombre || contacto.contacto || "Contacto";
    const events = [];

    if (contacto.fechaCreacion) {
      events.push(event({
        source: "Contactos",
        title: "Contacto registrado",
        entity: name,
        icon: "pi pi-user-plus",
        user: contacto.usuarioCreacion,
        date: contacto.fechaCreacion,
        detail: contacto.notas || "Contacto agregado al proveedor.",
        status: contacto.contactoPrincipal ? "Principal" : enumText(contacto.estadoContacto || "ACTIVO"),
        facts: [
          contacto.rol ? enumText(contacto.rol) : "",
          contacto.telefono ? `Tel ${contacto.telefono}` : "",
          contacto.whatsapp ? `WA ${contacto.whatsapp}` : "",
          contacto.correo,
        ],
      }));
    }

    if (contacto.fechaModificacion && !sameMoment(contacto.fechaModificacion, contacto.fechaCreacion)) {
      events.push(event({
        source: "Contactos",
        title: "Contacto actualizado",
        entity: name,
        icon: "pi pi-user-edit",
        user: contacto.usuarioModificacion,
        date: contacto.fechaModificacion,
        detail: contacto.notas || "Actualizacion de informacion del contacto.",
        status: enumText(contacto.estadoContacto),
      }));
    }

    return events;
  });
}

function productosEvents(productos = [], costHistories = {}) {
  return productos.flatMap((producto) => {
    const name = relationProductName(producto);
    const historyRows =
      producto.historialCostos ||
      producto.historial ||
      costHistories[producto.idProveedorProducto] ||
      [];
    const cost = moneyValue(producto.ultimoCosto ?? producto.precioCompra);
    const facts = [
      producto.skuProveedor ? `SKU ${producto.skuProveedor}` : "",
      cost ? `Costo ${cost}` : "",
      producto.presentacionCompra ? `Presentacion ${producto.presentacionCompra}` : "",
      producto.proveedorPreferido ? "Proveedor preferido" : "",
    ];

    const events = [];
    if (producto.fechaCreacion) {
      events.push(event({
        source: "Productos",
        title: "Relacion producto-proveedor creada",
        entity: name,
        icon: "pi pi-box",
        user: producto.usuarioCreacion,
        date: producto.fechaCreacion,
        detail: "Producto habilitado para surtirse con este proveedor.",
        status: enumText(producto.estadoRelacion || "ACTIVA"),
        facts,
      }));
    }
    if (producto.fechaModificacion && !sameMoment(producto.fechaModificacion, producto.fechaCreacion)) {
      events.push(event({
        source: "Productos",
        title: "Relacion producto-proveedor actualizada",
        entity: name,
        icon: "pi pi-pencil",
        user: producto.usuarioModificacion,
        date: producto.fechaModificacion,
        detail: "Cambios en datos de surtido, preferencia, costo o estado de la relacion.",
        status: enumText(producto.estadoRelacion || "ACTIVA"),
        facts,
      }));
    }
    historyRows.forEach((history) => {
      const costValue = history.costoNuevo ?? history.costo ?? history.precioCompra;
      events.push(event({
        source: "Costos",
        title: "Costo registrado",
        entity: name,
        icon: "pi pi-chart-line",
        user: history.usuario || history.usuarioCreacion || history.usuarioModificacion,
        date: history.fechaCambio || history.fechaCosto || history.fechaCreacion || history.fechaModificacion,
        detail: history.motivo || history.observaciones || history.referencia || "Movimiento de costo del proveedor.",
        status: costValue != null ? moneyValue(costValue) : "Costo",
        before: history.costoAnterior != null ? `Costo: ${moneyValue(history.costoAnterior)}` : "",
        after: costValue != null ? `Costo: ${moneyValue(costValue)}` : "",
        facts: [history.referencia ? `Ref ${history.referencia}` : ""],
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
        date: activo.fechaCreacion || activo.fechaEntrega,
        detail: activo.condicionesPrestamo || activo.notas || "Activo prestado registrado al proveedor.",
        status: enumText(activo.estadoActivoPrestado || activo.estadoActivo || "RECIBIDO"),
        facts: [
          activo.tipo ? enumText(activo.tipo) : "",
          activo.numeroSerie ? `Serie ${activo.numeroSerie}` : "",
          activo.ubicacionTienda,
          activo.fechaEntrega ? `Entrega ${formatDateTime(activo.fechaEntrega)}` : "",
        ],
      }));
    }
    (activo.historial || []).forEach((history) => {
      const evidenciaCount = Array.isArray(history.evidencias)
        ? history.evidencias.length
        : history.evidenciaNombre
          ? 1
          : 0;
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
        facts: [
          evidenciaCount ? `${evidenciaCount} evidencia${evidenciaCount === 1 ? "" : "s"}` : "",
          history.evidenciaNombre,
        ],
      }));
    });
    return events;
  });
}

function documentIcon(tipoEvento) {
  if (tipoEvento === "NUEVA_VERSION") return "pi pi-refresh";
  if (tipoEvento === "ARCHIVADO") return "pi pi-folder";
  if (tipoEvento === "REACTIVACION") return "pi pi-play";
  if (tipoEvento === "INACTIVACION") return "pi pi-pause";
  return "pi pi-file-edit";
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
        detail: documento.descripcion || "Documento agregado al proveedor.",
        status: enumText(documento.estadoDocumento || "ACTIVO"),
        facts: [
          documento.tipo ? enumText(documento.tipo) : "",
          documento.archivoNombre,
          documento.mimeType,
        ],
      }));
    }
    (documento.historial || []).forEach((history) => {
      events.push(event({
        source: "Documentos",
        title: enumText(history.tipoEvento || "Movimiento de documento"),
        entity: name,
        icon: documentIcon(history.tipoEvento),
        user: history.usuarioCreacion || history.usuarioModificacion,
        date: history.fechaEvento || history.fechaCreacion || history.fechaModificacion,
        detail: history.descripcion || "Movimiento registrado en documento.",
        status: enumText(history.tipoEvento),
        before: history.detalleAnterior,
        after: history.detalleNuevo,
        facts: [
          history.archivoAnteriorNombre ? `Anterior ${history.archivoAnteriorNombre}` : "",
          history.archivoNuevoNombre ? `Nuevo ${history.archivoNuevoNombre}` : "",
        ],
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
    .sort((a, b) => epoch(b.date) - epoch(a.date))
    .map((item, index) => ({ ...item, key: `${item.key}|${index}` }));
}

function eventMatchesDate(item, start, end) {
  if (!start && !end) return true;
  const time = epoch(item.date);
  if (!time) return false;
  const startTime = filterTime(start);
  const endTime = filterTime(end);
  if (startTime && time < startTime) return false;
  if (endTime && time > endTime) return false;
  return true;
}

function filterEvents(events, sectionFilter, start, end) {
  return events.filter((item) => {
    const matchesSection = sectionFilter === "TODOS" || item.section === sectionFilter;
    return matchesSection && eventMatchesDate(item, start, end);
  });
}

function sectionCounts(events) {
  return events.reduce((acc, item) => {
    acc[item.section] = (acc[item.section] || 0) + 1;
    return acc;
  }, {});
}

function AuditMetric({ label, value, accent }) {
  return (
    <div className={accent ? "prov-audit-metric is-accent" : "prov-audit-metric"}>
      <span>{label}</span>
      <strong title={String(valueOrDash(value))}>{valueOrDash(value)}</strong>
    </div>
  );
}

function AuditFacts({ facts }) {
  if (!facts?.length) return null;
  return (
    <div className="prov-audit-facts">
      {facts.map((fact) => (
        <span key={fact}>{fact}</span>
      ))}
    </div>
  );
}

function AuditDiff({ diff }) {
  if (!diff) return null;
  return (
    <div className="prov-audit-diff">
      <div>
        <small>{diff.beforeLabel}</small>
        {diff.beforeRows.length ? diff.beforeRows.map((row) => (
          <span key={`before-${row.label}-${row.value}`}>
            <b>{row.label}</b>
            {valueOrDash(row.value)}
          </span>
        )) : <em>Sin valor anterior</em>}
      </div>
      <div>
        <small>{diff.afterLabel}</small>
        {diff.afterRows.length ? diff.afterRows.map((row) => (
          <span key={`after-${row.label}-${row.value}`}>
            <b>{row.label}</b>
            {valueOrDash(row.value)}
          </span>
        )) : <em>Sin cambio detallado</em>}
      </div>
    </div>
  );
}

function AuditEvent({ item, detailed }) {
  const meta = AUDIT_SECTION_META[item.section] || { label: item.source };
  const rich = detailed && item.diff;
  return (
    <article className={`prov-audit-event ${rich ? "is-rich" : "is-compact"} is-${String(item.section).toLowerCase()}`}>
      <span className="prov-audit-event-icon">
        <i className={item.icon || meta.icon || "pi pi-history"} />
      </span>
      <div className="prov-audit-event-main">
        <div className="prov-audit-event-head">
          <div>
            <strong>{item.title}</strong>
            <span>{valueOrDash(item.user)} - {formatDateTime(item.date)}</span>
          </div>
          <div className="prov-audit-event-tags">
            {detailed ? <em>{meta.label}</em> : null}
            {item.status ? <b>{item.status}</b> : null}
          </div>
        </div>
        {item.entity ? <small className="prov-audit-entity">{item.entity}</small> : null}
        <AuditFacts facts={item.facts} />
        {item.detail ? <p>{item.detail}</p> : null}
        {rich ? <AuditDiff diff={item.diff} /> : null}
      </div>
    </article>
  );
}

function AuditFilters({
  sectionFilter,
  dateStart,
  dateEnd,
  options,
  hasFilters,
  onSectionChange,
  onDateStartChange,
  onDateEndChange,
  onClear,
}) {
  return (
    <div className="prov-audit-filter-bar">
      <label className="prov-audit-filter">
        <span>Apartado</span>
        <Dropdown
          value={sectionFilter}
          options={options}
          onChange={(event) => onSectionChange(event.value)}
          className="prov-audit-dropdown"
          panelClassName="prov-filter-panel"
        />
      </label>
      <label className="prov-audit-filter is-date" htmlFor="prov-audit-start">
        <span>Fecha inicio</span>
        <Calendar
          inputId="prov-audit-start"
          value={dateStart}
          onChange={(event) => onDateStartChange(event.value || null)}
          dateFormat="dd/mm/yy"
          showTime
          hourFormat="12"
          showIcon
          icon="pi pi-calendar"
          showButtonBar
          readOnlyInput
          placeholder="Sin limite inicial"
          className="prov-date-calendar prov-audit-date-calendar"
          panelClassName="prov-date-panel prov-audit-date-panel"
          maxDate={dateEnd || undefined}
        />
      </label>
      <label className="prov-audit-filter is-date" htmlFor="prov-audit-end">
        <span>Fecha final</span>
        <Calendar
          inputId="prov-audit-end"
          value={dateEnd}
          onChange={(event) => onDateEndChange(event.value || null)}
          dateFormat="dd/mm/yy"
          showTime
          hourFormat="12"
          showIcon
          icon="pi pi-calendar"
          showButtonBar
          readOnlyInput
          placeholder="Sin limite final"
          className="prov-date-calendar prov-audit-date-calendar"
          panelClassName="prov-date-panel prov-audit-date-panel"
          minDate={dateStart || undefined}
        />
      </label>
      <Button
        icon="pi pi-filter-slash"
        className="prov-row-action prov-audit-clear"
        onClick={onClear}
        disabled={!hasFilters}
        aria-label="Limpiar filtros"
        tooltip="Limpiar filtros"
        tooltipOptions={TOOLTIP}
      />
    </div>
  );
}

export default function ProveedorAuditSection({ proveedor, detailed = false, showToast }) {
  const raw = useMemo(() => proveedor?.raw || proveedor || {}, [proveedor]);
  const [costHistories, setCostHistories] = useState({});
  const [assetHistories, setAssetHistories] = useState({});
  const [costLoading, setCostLoading] = useState(false);
  const [assetLoading, setAssetLoading] = useState(false);
  const [sectionFilter, setSectionFilter] = useState("TODOS");
  const [dateStart, setDateStart] = useState(null);
  const [dateEnd, setDateEnd] = useState(null);
  const activos = useMemo(() => proveedor?.activosPrestados || [], [proveedor]);
  const estadoActual = proveedor?.estadoProveedor || raw.estadoProveedor || "ACTIVO";
  const estadoAnterior = raw.estadoProveedorAnterior || "";
  const cambioEstado =
    raw.ultimaAccionEstado || estadoAnterior
      ? `${valueOrDash(raw.ultimaAccionEstado)} ${estadoAnterior ? `de ${estadoAnterior} a ${estadoActual}` : ""}`
      : "--";

  const activosWithHistory = useMemo(
    () =>
      activos.map((activo) => {
        const loaded = assetHistories[activo.idProveedorActivo];
        return Array.isArray(loaded) ? { ...activo, historial: loaded } : activo;
      }),
    [activos, assetHistories]
  );

  const auditProveedor = useMemo(
    () => (proveedor ? { ...proveedor, activosPrestados: activosWithHistory } : proveedor),
    [activosWithHistory, proveedor]
  );

  const events = useMemo(
    () => buildAuditEvents(auditProveedor, raw, estadoActual, costHistories),
    [auditProveedor, raw, estadoActual, costHistories]
  );
  const counts = useMemo(() => sectionCounts(events), [events]);
  const dateFilteredEvents = useMemo(
    () => filterEvents(events, "TODOS", dateStart, dateEnd),
    [dateEnd, dateStart, events]
  );
  const dateFilteredCounts = useMemo(() => sectionCounts(dateFilteredEvents), [dateFilteredEvents]);
  const filterOptions = useMemo(
    () =>
      AUDIT_SECTION_OPTIONS.map((option) => ({
        ...option,
        label:
          option.value === "TODOS"
            ? `Todo (${dateFilteredEvents.length})`
            : `${option.label} (${dateFilteredCounts[option.value] || 0})`,
      })),
    [dateFilteredCounts, dateFilteredEvents.length]
  );
  const hasFilters = sectionFilter !== "TODOS" || Boolean(dateStart || dateEnd);
  const filteredEvents = useMemo(
    () => filterEvents(events, sectionFilter, dateStart, dateEnd),
    [dateEnd, dateStart, events, sectionFilter]
  );
  const visibleEvents = detailed ? filteredEvents : events.slice(0, 3);

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
          return [producto.idProveedorProducto, normalizeHistoryPayload(payload)];
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

  useEffect(() => {
    const activosPendientes = activos.filter((activo) => {
      if (!activo?.idProveedorActivo) return false;
      if (Array.isArray(activo.historial) && activo.historial.length) return false;
      const expected = Number(activo.historialCount ?? activo.historialEventosCount ?? 0);
      return expected > 0;
    });

    if (!detailed || !proveedor?.idProveedor || !activosPendientes.length) {
      setAssetHistories({});
      setAssetLoading(false);
      return undefined;
    }

    let active = true;
    setAssetLoading(true);
    Promise.allSettled(
      activosPendientes.map(async (activo) => {
        const response = await api.fetchApi(
          {},
          "GET",
          undefined,
          getAssetHistoryUrl(proveedor.idProveedor, activo.idProveedorActivo)
        );
        const payload = await readApiPayload(response, "historial de activo");
        return [activo.idProveedorActivo, normalizeHistoryPayload(payload)];
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
        setAssetHistories(next);
      })
      .catch((error) => {
        showToast?.("error", "Auditoria", error?.message || "No se pudo cargar historial de activos.");
      })
      .finally(() => {
        if (active) setAssetLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activos, detailed, proveedor?.idProveedor, showToast]);

  const clearFilters = () => {
    setSectionFilter("TODOS");
    setDateStart(null);
    setDateEnd(null);
  };

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
        <AuditMetric label="Eventos mostrados" value={detailed ? `${visibleEvents.length} de ${events.length}` : events.length} accent />
        <AuditMetric label="Creado por" value={raw.usuarioCreacion} />
        <AuditMetric label="Ultima edicion" value={formatDateTime(raw.fechaModificacion)} />
        <AuditMetric label="Cambio de estado" value={cambioEstado} accent />
      </div>

      {detailed ? (
        <>
          <div className="prov-audit-source-grid">
            <AuditMetric label="Editar" value={counts.EDITAR || 0} accent />
            <AuditMetric label="Productos" value={counts.PRODUCTOS || 0} />
            <AuditMetric label="Costos" value={costLoading ? "Cargando..." : Object.values(costHistories).reduce((sum, rows) => sum + rows.length, 0)} />
            <AuditMetric label="Activos" value={assetLoading ? "Cargando..." : counts.ACTIVOS || 0} />
            <AuditMetric label="Documentos" value={counts.DOCUMENTOS || 0} />
          </div>
          <AuditFilters
            sectionFilter={sectionFilter}
            dateStart={dateStart}
            dateEnd={dateEnd}
            options={filterOptions}
            hasFilters={hasFilters}
            onSectionChange={setSectionFilter}
            onDateStartChange={setDateStart}
            onDateEndChange={setDateEnd}
            onClear={clearFilters}
          />
        </>
      ) : null}

      <div
        className="prov-audit-timeline"
        key={`${sectionFilter}-${epoch(dateStart)}-${epoch(dateEnd)}-${visibleEvents.length}`}
      >
        {visibleEvents.length ? (
          visibleEvents.map((item) => (
            <AuditEvent item={item} detailed={detailed} key={item.key} />
          ))
        ) : (
          <article className="prov-audit-empty">
            <i className="pi pi-inbox" />
            <strong>Sin eventos para los filtros seleccionados</strong>
            <span>Ajusta apartado o fecha para revisar otra parte del historial.</span>
          </article>
        )}
      </div>
    </section>
  );
}
