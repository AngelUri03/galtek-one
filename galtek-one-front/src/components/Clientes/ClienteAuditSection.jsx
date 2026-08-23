import React, { useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { moneyOrDash } from "./clientesUtils";

const TOOLTIP = { position: "top", className: "cli-action-tooltip" };

const stateSeverity = {
  ACTIVO: "success",
  INACTIVO: "warning",
  ARCHIVADO: "secondary",
};

const AUDIT_SECTION_OPTIONS = [
  { label: "Todo", value: "TODOS" },
  { label: "Edicion", value: "EDITAR" },
  { label: "Compra", value: "COMPRA" },
];

const AUDIT_SECTION_META = {
  EDITAR: { label: "Edicion", icon: "pi pi-pencil" },
  COMPRA: { label: "Compra", icon: "pi pi-shopping-bag" },
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

function cleanFacts(facts = []) {
  return facts
    .map((fact) => String(fact || "").trim())
    .filter(Boolean)
    .slice(0, 5);
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
  section = "EDITAR",
  title,
  entity,
  icon,
  user,
  date,
  detail,
  status,
  before,
  after,
  facts,
}) {
  return {
    key: [section, title, entity, date, status, detail].map(valueOrDash).join("|"),
    section,
    title,
    entity,
    icon,
    user,
    date,
    detail,
    status,
    facts: cleanFacts(facts),
    diff: compactDiff(before, after),
  };
}

function clienteEvents(cliente, raw, estadoActual) {
  const name = cliente?.nombre || raw.nombre || "Cliente";
  const estadoAnterior = raw.estadoClienteAnterior || "";
  const cambioEstado = raw.ultimaAccionEstado || estadoAnterior;
  const events = [
    event({
      title: "Alta del cliente",
      entity: name,
      icon: "pi pi-plus",
      user: raw.usuarioCreacion,
      date: raw.fechaCreacion,
      detail: "Registro inicial del cliente.",
      status: "Creacion",
      facts: [
        raw.tipoCliente ? `Tipo ${raw.tipoCliente}` : "",
        raw.email ? `Correo ${raw.email}` : "",
        raw.telefono ? `Tel ${raw.telefono}` : "",
      ],
    }),
  ];

  if (raw.fechaModificacion && !sameMoment(raw.fechaModificacion, raw.fechaCreacion)) {
    events.push(
      event({
        title: "Datos del cliente editados",
        entity: name,
        icon: "pi pi-pencil",
        user: raw.usuarioModificacion,
        date: raw.fechaModificacion,
        detail: "Actualizacion de datos generales, contacto, direccion o fiscales.",
        status: "Edicion",
      })
    );
  }

  if (cambioEstado || raw.motivoCambioEstado) {
    events.push(
      event({
        title: "Estado del cliente actualizado",
        entity: name,
        icon:
          estadoActual === "ARCHIVADO"
            ? "pi pi-folder"
            : estadoActual === "ACTIVO"
              ? "pi pi-play"
              : "pi pi-pause",
        user: raw.usuarioCambioEstado || raw.usuarioModificacion,
        date: raw.fechaCambioEstado || raw.fechaModificacion,
        detail: raw.motivoCambioEstado || "Sin motivo registrado por backend.",
        status: valueOrDash(raw.ultimaAccionEstado || estadoActual),
        before: estadoAnterior ? `Estado: ${estadoAnterior}` : "",
        after: `Estado: ${estadoActual}`,
      })
    );
  }

  return events;
}

function compraEvents(pedidos = []) {
  return pedidos.map((pedido) =>
    event({
      section: "COMPRA",
      title: "Compra registrada",
      entity: pedido.noOrden || "Venta",
      icon: "pi pi-shopping-bag",
      user: pedido.usuarioCreacion || pedido.usuarioModificacion || "",
      date: pedido.fecha || pedido.fechaCreacion || pedido.fechaModificacion,
      detail: [
        pedido.productosTotales != null ? `${pedido.productosTotales} productos` : "",
        pedido.metodoPago || "",
        pedido.estado || "",
      ]
        .filter(Boolean)
        .join(" - "),
      status: moneyOrDash(pedido.importeTotal),
      facts: [
        pedido.metodoPago ? `Pago ${pedido.metodoPago}` : "",
        pedido.estado ? `Estado ${pedido.estado}` : "",
      ],
    })
  );
}

function buildAuditEvents(cliente, raw, estadoActual) {
  return [...clienteEvents(cliente, raw, estadoActual), ...compraEvents(cliente?.pedidos || [])]
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
    <div className={accent ? "cli-audit-metric is-accent" : "cli-audit-metric"}>
      <span>{label}</span>
      <strong title={String(valueOrDash(value))}>{valueOrDash(value)}</strong>
    </div>
  );
}

function AuditFacts({ facts }) {
  if (!facts?.length) return null;
  return (
    <div className="cli-audit-facts">
      {facts.map((fact) => (
        <span key={fact}>{fact}</span>
      ))}
    </div>
  );
}

function AuditDiff({ diff }) {
  if (!diff) return null;
  return (
    <div className="cli-audit-diff">
      <div>
        <small>{diff.beforeLabel}</small>
        {diff.beforeRows.length ? (
          diff.beforeRows.map((row) => (
            <span key={`before-${row.label}-${row.value}`}>
              <b>{row.label}</b>
              {valueOrDash(row.value)}
            </span>
          ))
        ) : (
          <em>Sin valor anterior</em>
        )}
      </div>
      <div>
        <small>{diff.afterLabel}</small>
        {diff.afterRows.length ? (
          diff.afterRows.map((row) => (
            <span key={`after-${row.label}-${row.value}`}>
              <b>{row.label}</b>
              {valueOrDash(row.value)}
            </span>
          ))
        ) : (
          <em>Sin cambio detallado</em>
        )}
      </div>
    </div>
  );
}

function AuditEvent({ item, detailed }) {
  const meta = AUDIT_SECTION_META[item.section] || { label: item.section };
  const rich = detailed && item.diff;
  return (
    <article
      className={`cli-audit-event ${rich ? "is-rich" : "is-compact"} is-${String(
        item.section
      ).toLowerCase()}`}
    >
      <span className="cli-audit-event-icon">
        <i className={item.icon || meta.icon || "pi pi-history"} />
      </span>
      <div className="cli-audit-event-main">
        <div className="cli-audit-event-head">
          <div>
            <strong>{item.title}</strong>
            <span>
              {valueOrDash(item.user)} - {formatDateTime(item.date)}
            </span>
          </div>
          <div className="cli-audit-event-tags">
            {detailed ? <em>{meta.label}</em> : null}
            {item.status ? <b>{item.status}</b> : null}
          </div>
        </div>
        {item.entity ? <small className="cli-audit-entity">{item.entity}</small> : null}
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
    <div className="cli-audit-filter-bar">
      <label className="cli-audit-filter">
        <span>Apartado</span>
        <Dropdown
          value={sectionFilter}
          options={options}
          onChange={(event) => onSectionChange(event.value)}
          className="cli-audit-dropdown"
          panelClassName="cli-filter-panel"
        />
      </label>
      <label className="cli-audit-filter is-date" htmlFor="cli-audit-start">
        <span>Fecha inicio</span>
        <Calendar
          inputId="cli-audit-start"
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
          className="cli-date-calendar cli-audit-date-calendar"
          panelClassName="cli-date-panel cli-audit-date-panel"
          maxDate={dateEnd || undefined}
        />
      </label>
      <label className="cli-audit-filter is-date" htmlFor="cli-audit-end">
        <span>Fecha final</span>
        <Calendar
          inputId="cli-audit-end"
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
          className="cli-date-calendar cli-audit-date-calendar"
          panelClassName="cli-date-panel cli-audit-date-panel"
          minDate={dateStart || undefined}
        />
      </label>
      <Button
        icon="pi pi-filter-slash"
        className="cli-row-action cli-audit-clear"
        onClick={onClear}
        disabled={!hasFilters}
        aria-label="Limpiar filtros"
        tooltip="Limpiar filtros"
        tooltipOptions={TOOLTIP}
      />
    </div>
  );
}

export default function ClienteAuditSection({ cliente, detailed = false }) {
  const raw = useMemo(() => cliente?.raw || cliente || {}, [cliente]);
  const [sectionFilter, setSectionFilter] = useState("TODOS");
  const [dateStart, setDateStart] = useState(null);
  const [dateEnd, setDateEnd] = useState(null);
  const estadoActual = cliente?.estadoCliente || raw.estadoCliente || "ACTIVO";
  const estadoAnterior = raw.estadoClienteAnterior || "";
  const cambioEstado =
    raw.ultimaAccionEstado || estadoAnterior
      ? `${valueOrDash(raw.ultimaAccionEstado)} ${
          estadoAnterior ? `de ${estadoAnterior} a ${estadoActual}` : ""
        }`
      : "--";
  const events = useMemo(
    () => buildAuditEvents(cliente, raw, estadoActual),
    [cliente, raw, estadoActual]
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

  const clearFilters = () => {
    setSectionFilter("TODOS");
    setDateStart(null);
    setDateEnd(null);
  };

  return (
    <section className={detailed ? "cli-audit-section is-detailed" : "cli-audit-section"}>
      <div className="cli-audit-head">
        <div>
          <span className="cli-audit-kicker">Auditoria del cliente</span>
          <h3>{detailed ? "Trazabilidad completa" : "Quien hizo que y cuando"}</h3>
        </div>
        <Tag
          value={String(estadoActual).toLowerCase()}
          severity={stateSeverity[estadoActual] || "info"}
          className="cli-state-tag"
        />
      </div>

      <div className="cli-audit-metrics">
        <AuditMetric
          label="Eventos mostrados"
          value={detailed ? `${visibleEvents.length} de ${events.length}` : events.length}
          accent
        />
        <AuditMetric label="Creado por" value={raw.usuarioCreacion} />
        <AuditMetric label="Ultima edicion" value={formatDateTime(raw.fechaModificacion)} />
        <AuditMetric label="Cambio de estado" value={cambioEstado} accent />
      </div>

      {detailed ? (
        <>
          <div className="cli-audit-source-grid">
            <AuditMetric label="Edicion" value={counts.EDITAR || 0} accent />
            <AuditMetric label="Compra" value={counts.COMPRA || 0} />
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
        className="cli-audit-timeline"
        key={`${sectionFilter}-${epoch(dateStart)}-${epoch(dateEnd)}-${visibleEvents.length}`}
      >
        {visibleEvents.length ? (
          visibleEvents.map((item) => (
            <AuditEvent item={item} detailed={detailed} key={item.key} />
          ))
        ) : (
          <article className="cli-audit-empty">
            <i className="pi pi-inbox" />
            <strong>Sin eventos para los filtros seleccionados</strong>
            <span>Ajusta apartado o fecha para revisar otra parte del historial.</span>
          </article>
        )}
      </div>
    </section>
  );
}
