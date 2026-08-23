import React from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import {
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

function LoadingTable({ rows = 7 }) {
  return (
    <div className="cli-table-skeleton">
      {Array.from({ length: Math.max(3, Math.min(rows, 10)) }).map((_, index) => (
        <div className="cli-skeleton-row" key={index}>
          <Skeleton width="24%" height="1.1rem" />
          <Skeleton width="12%" height="1.1rem" />
          <Skeleton width="18%" height="1.1rem" />
          <Skeleton width="14%" height="1.1rem" />
          <Skeleton width="10%" height="1.1rem" />
        </div>
      ))}
    </div>
  );
}

function clienteTemplate(row) {
  return (
    <div className="cli-name-cell">
      <strong title={row.nombre}>{row.nombre || "Sin nombre"}</strong>
      <span title={row.alias || row.email || row.rfc}>
        {row.alias || row.email || row.rfc || "Publico identificable"}
      </span>
    </div>
  );
}

function contactoTemplate(row) {
  return (
    <div className="cli-channel-cell">
      <span title={row.telefono}>{row.telefono || "Sin telefono"}</span>
      <small title={row.whatsapp}>{row.whatsapp ? `WA ${row.whatsapp}` : "Sin WhatsApp"}</small>
    </div>
  );
}

function tipoTemplate(row) {
  return (
    <span className="cli-muted-pill">
      {labelFromOptions(TIPO_OPTIONS, row.tipoCliente, "Persona")}
    </span>
  );
}

function correoTemplate(row) {
  const contacto = row.email || row.correoFiscal || "Sin correo";
  const referencia = row.alias || row.razonSocial || "Sin referencia";
  return (
    <div className="cli-compact-cell">
      <strong title={contacto}>{contacto}</strong>
      <span title={referencia}>{referencia}</span>
    </div>
  );
}

function ultimaCompraTemplate(row) {
  const compra = row.ultimaCompra;
  if (!compra) {
    return <span className="cli-pending">Sin compras</span>;
  }

  return (
    <div className="cli-activity-cell">
      <span>{moneyOrDash(compra.importeTotal)}</span>
      <small>
        {formatDate(compra.fecha)}
        {compra.metodoPago ? ` - ${compra.metodoPago}` : ""}
      </small>
    </div>
  );
}

function comprasTemplate(row) {
  const totalCompras = Number(row.comprasRegistradas ?? 0);
  return (
    <span className={totalCompras ? "cli-count-pill" : "cli-count-pill is-empty"}>
      {totalCompras}
    </span>
  );
}

function estadoTemplate(row) {
  const estado = row.estadoCliente || "ACTIVO";
  return (
    <Tag
      value={estado.toLowerCase()}
      severity={severityByEstado[estado] || "info"}
      className="cli-state-tag"
    />
  );
}

function RowActions({ row, loading, onView, onEdit, onRemove }) {
  const isArchived = String(row?.estadoCliente || "").toUpperCase() === "ARCHIVADO";

  return (
    <div className="cli-row-actions is-compact">
      <Button
        icon="pi pi-eye"
        className="cli-row-action"
        onClick={() => onView(row)}
        disabled={loading}
        aria-label="Ver detalle"
        tooltip="Ver detalle"
        tooltipOptions={{ position: "top", className: "cli-action-tooltip" }}
      />
      <Button
        icon="pi pi-pencil"
        className="cli-row-action"
        onClick={() => onEdit(row)}
        disabled={loading || isArchived}
        aria-label="Editar"
        tooltip={isArchived ? "Archivado: solo consulta" : "Editar"}
        tooltipOptions={{ position: "top", className: "cli-action-tooltip" }}
      />
      <Button
        icon="pi pi-trash"
        className="cli-row-action is-danger"
        onClick={() => onRemove(row)}
        disabled={loading || isArchived}
        aria-label="Resolver salida del cliente"
        tooltip={isArchived ? "Archivado: baja historica" : "Resolver salida"}
        tooltipOptions={{ position: "top", className: "cli-action-tooltip" }}
      />
    </div>
  );
}

export default function ClientesTable({
  rows,
  loading,
  hasClientes,
  first,
  rowsPerPage,
  rowsPerPageOptions,
  totalRecords,
  sortField,
  sortOrder,
  onPage,
  onSort,
  onView,
  onEdit,
  onRemove,
}) {
  const pageStart = totalRecords && rows.length ? first + 1 : 0;
  const pageEnd = totalRecords && rows.length ? Math.min(first + rows.length, totalRecords) : 0;
  const paginatorLeft = (
    <span className="cli-paginator-caption">
      <i className="pi pi-list" />
      Filas
    </span>
  );
  const paginatorRight = (
    <span className="cli-paginator-report">
      <span>{pageStart}-{pageEnd}</span>
      <strong>de {totalRecords}</strong>
    </span>
  );
  const emptyMessage = (
    <div className="cli-empty">
      <i className={hasClientes ? "pi pi-search" : "pi pi-inbox"} />
      <strong>{hasClientes ? "Sin resultados" : "Sin clientes"}</strong>
      <span>
        {hasClientes
          ? "Ajusta la busqueda o cambia los filtros."
          : "Agrega compradores frecuentes sin volverlo obligatorio para vender."}
      </span>
    </div>
  );

  const actionsTemplate = (row) => (
    <RowActions
      row={row}
      loading={loading}
      onView={onView}
      onEdit={onEdit}
      onRemove={onRemove}
    />
  );

  if (loading && !rows.length) {
    return <LoadingTable rows={rowsPerPage} />;
  }

  return (
    <DataTable
      value={rows}
      dataKey="idCliente"
      className="cli-table p-datatable-sm"
      lazy
      paginator
      first={first}
      rows={rowsPerPage}
      rowsPerPageOptions={rowsPerPageOptions}
      totalRecords={totalRecords}
      onPage={onPage}
      onSort={onSort}
      sortField={sortField}
      sortOrder={sortOrder}
      loading={loading}
      emptyMessage={emptyMessage}
      paginatorLeft={paginatorLeft}
      paginatorRight={paginatorRight}
      paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
    >
      <Column header="Cliente" body={clienteTemplate} sortable sortField="nombre" style={{ width: "15.4%" }} />
      <Column header="Tipo" body={tipoTemplate} sortable sortField="tipoCliente" style={{ width: "12.1%" }} />
      <Column header="Contacto principal" body={correoTemplate} sortable sortField="email" style={{ width: "15.9%" }} />
      <Column header="Telefono / WhatsApp" body={contactoTemplate} style={{ width: "14.9%" }} />
      <Column header="Ultima compra" body={ultimaCompraTemplate} style={{ width: "14.5%" }} />
      <Column header="Compras" body={comprasTemplate} style={{ width: "9%" }} />
      <Column header="Estado" body={estadoTemplate} sortable sortField="estadoCliente" style={{ width: "9.3%" }} />
      <Column header="Acciones" body={actionsTemplate} headerClassName="cli-actions-header" style={{ width: "8.9%" }} frozen alignFrozen="right" />
    </DataTable>
  );
}
