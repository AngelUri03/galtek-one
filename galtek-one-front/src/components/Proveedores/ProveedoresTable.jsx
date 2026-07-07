import React from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import {
  MODALIDAD_OPTIONS,
  TIPO_OPTIONS,
  formatDate,
  hasKnownCount,
  labelFromOptions,
} from "./proveedoresUtils";

const severityByEstado = {
  ACTIVO: "success",
  INACTIVO: "warning",
  ARCHIVADO: "secondary",
};

function LoadingTable() {
  return (
    <div className="prov-table-skeleton">
      {Array.from({ length: 7 }).map((_, index) => (
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

function actividadTemplate(row) {
  return (
    <div className="prov-activity-cell">
      <span>{formatDate(row.ultimaCompra || row.ultimaActividad)}</span>
      <small>{row.ultimaCompra ? "Ultima compra" : "Actividad"}</small>
    </div>
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

export default function ProveedoresTable({
  rows,
  loading,
  hasProviders,
  onView,
  onEdit,
  onMore,
}) {
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
    <div className="prov-row-actions">
      <Button
        icon="pi pi-eye"
        className="prov-row-action"
        onClick={() => onView(row)}
        aria-label="Ver detalle"
        tooltip="Ver detalle"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-pencil"
        className="prov-row-action"
        onClick={() => onEdit(row)}
        aria-label="Editar"
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-ellipsis-h"
        className="prov-row-action"
        onClick={(event) => onMore(event, row)}
        aria-label="Mas opciones"
        tooltip="Mas opciones"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  if (loading && !rows.length) {
    return <LoadingTable />;
  }

  return (
    <DataTable
      value={rows}
      dataKey="idProveedor"
      className="prov-table p-datatable-sm"
      paginator
      rows={10}
      rowsPerPageOptions={[10, 20, 30]}
      sortMode="multiple"
      emptyMessage={emptyMessage}
      scrollable
      scrollHeight="calc(100vh - 430px)"
      currentPageReportTemplate="{first}-{last} de {totalRecords}"
      paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
    >
      <Column header="Proveedor" body={proveedorTemplate} sortable sortField="nombreProveedor" style={{ minWidth: "16rem" }} />
      <Column header="Tipo" body={tipoTemplate} sortable sortField="tipoProveedor" style={{ minWidth: "10rem" }} />
      <Column header="Contacto principal" body={contactoTemplate} sortable sortField="contacto" style={{ minWidth: "13rem" }} />
      <Column header="Telefono / WhatsApp" body={telefonoTemplate} style={{ minWidth: "12rem" }} />
      <Column header="Modalidad" body={modalidadTemplate} sortable sortField="modalidadAbastecimiento" style={{ minWidth: "11rem" }} />
      <Column header="Productos" body={productosTemplate} sortable sortField="productosAsociadosCount" style={{ minWidth: "7rem" }} />
      <Column header="Ultima actividad" body={actividadTemplate} sortable sortField="ultimaActividad" style={{ minWidth: "10rem" }} />
      <Column header="Estado" body={estadoTemplate} sortable sortField="estadoProveedor" style={{ minWidth: "8rem" }} />
      <Column header="Acciones" body={actionsTemplate} headerClassName="prov-actions-header" style={{ minWidth: "7rem" }} frozen alignFrozen="right" />
    </DataTable>
  );
}
