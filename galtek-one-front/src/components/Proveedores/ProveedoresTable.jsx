import React from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import {
  MODALIDAD_OPTIONS,
  TIPO_OPTIONS,
  hasKnownCount,
  labelFromOptions,
} from "./proveedoresUtils";

const severityByEstado = {
  ACTIVO: "success",
  INACTIVO: "warning",
  ARCHIVADO: "secondary",
};

function LoadingTable({ rows = 7 }) {
  return (
    <div className="prov-table-skeleton">
      {Array.from({ length: Math.max(3, Math.min(rows, 10)) }).map((_, index) => (
        <div className="prov-skeleton-row" key={index}>
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

function proveedorTemplate(row) {
  return (
    <div className="prov-name-cell">
      <strong title={row.nombreProveedor}>{row.nombreProveedor || "Sin nombre"}</strong>
      <span title={row.rfc || row.direccion}>
        {row.rfc || row.direccion || "Sin RFC o direccion"}
      </span>
    </div>
  );
}

function tipoTemplate(row) {
  return (
    <span className="prov-muted-pill">
      {labelFromOptions(TIPO_OPTIONS, row.tipoProveedor, "Sin tipo")}
    </span>
  );
}

function contactoTemplate(row) {
  const contacto = row.contactoPrincipal?.nombre || row.contacto || "Sin contacto";
  const rol = row.contactoPrincipal?.rol || row.correo || "";
  return (
    <div className="prov-compact-cell">
      <strong title={contacto}>{contacto}</strong>
      <span title={rol}>{rol || "Sin rol"}</span>
    </div>
  );
}

function telefonoTemplate(row) {
  return (
    <div className="prov-channel-cell">
      <span title={row.telefono}>{row.telefono || "Sin telefono"}</span>
      <small title={row.whatsapp}>
        {row.whatsapp ? `WA ${row.whatsapp}` : "Sin WhatsApp"}
      </small>
    </div>
  );
}

function modalidadTemplate(row) {
  return (
    <span className="prov-muted-text">
      {labelFromOptions(MODALIDAD_OPTIONS, row.modalidadAbastecimiento, "Sin dato")}
    </span>
  );
}

function productosTemplate(row) {
  if (!hasKnownCount(row.productosAsociadosCount)) {
    return <span className="prov-pending">--</span>;
  }

  return (
    <span className={row.productosAsociadosCount ? "prov-count-pill" : "prov-count-pill is-empty"}>
      {row.productosAsociadosCount}
    </span>
  );
}

function estadoTemplate(row) {
  const estado = row.estadoProveedor || "ACTIVO";
  return (
    <Tag
      value={estado.toLowerCase()}
      severity={severityByEstado[estado] || "info"}
      className="prov-state-tag"
    />
  );
}

function RowActions({ row, loading, onView, onEdit, onRemove }) {
  const isArchived = String(row?.estadoProveedor || "").toUpperCase() === "ARCHIVADO";

  return (
    <div className="prov-row-actions is-compact">
      <Button
        icon="pi pi-eye"
        className="prov-row-action"
        onClick={() => onView(row)}
        disabled={loading}
        aria-label="Ver detalle"
        tooltip="Ver detalle"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-pencil"
        className="prov-row-action"
        onClick={() => onEdit(row)}
        disabled={loading || isArchived}
        aria-label="Editar"
        tooltip={isArchived ? "Archivado: solo consulta" : "Editar"}
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-trash"
        className="prov-row-action is-danger"
        onClick={() => onRemove(row)}
        disabled={loading || isArchived}
        aria-label="Resolver salida del proveedor"
        tooltip={isArchived ? "Archivado: baja historica" : "Resolver salida"}
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );
}

export default function ProveedoresTable({
  rows,
  loading,
  hasProviders,
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
    <span className="prov-paginator-caption">
      <i className="pi pi-list" />
      Filas
    </span>
  );
  const paginatorRight = (
    <span className="prov-paginator-report">
      <span>{pageStart}-{pageEnd}</span>
      <strong>de {totalRecords}</strong>
    </span>
  );
  const emptyMessage = (
    <div className="prov-empty">
      <i className={hasProviders ? "pi pi-search" : "pi pi-inbox"} />
      <strong>{hasProviders ? "Sin resultados" : "Sin proveedores"}</strong>
      <span>
        {hasProviders
          ? "Ajusta la busqueda o cambia los filtros."
          : "Agrega tu primer proveedor para empezar a ordenar el abastecimiento."}
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
      dataKey="idProveedor"
      className="prov-table p-datatable-sm"
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
      <Column header="Proveedor" body={proveedorTemplate} sortable sortField="nombreProveedor" style={{ minWidth: "12.5rem" }} />
      <Column header="Tipo" body={tipoTemplate} sortable sortField="tipoProveedor" style={{ minWidth: "7rem" }} />
      <Column header="Contacto principal" body={contactoTemplate} sortable sortField="contacto" style={{ minWidth: "10.5rem" }} />
      <Column header="Telefono / WhatsApp" body={telefonoTemplate} style={{ minWidth: "8.5rem" }} />
      <Column header="Modalidad" body={modalidadTemplate} sortable sortField="modalidadAbastecimiento" style={{ minWidth: "8rem" }} />
      <Column header="Productos" body={productosTemplate} style={{ minWidth: "5.5rem" }} />
      <Column header="Estado" body={estadoTemplate} sortable sortField="estadoProveedor" style={{ minWidth: "6rem" }} />
      <Column header="Acciones" body={actionsTemplate} headerClassName="prov-actions-header" style={{ minWidth: "6.5rem" }} frozen alignFrozen="right" />
    </DataTable>
  );
}
