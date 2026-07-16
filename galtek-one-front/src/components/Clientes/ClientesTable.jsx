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

function LoadingTable() {
  return (
    <div className="cli-table-skeleton">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="cli-skeleton-row" key={index}>
          <Skeleton width="24%" height="1.1rem" />
          <Skeleton width="16%" height="1.1rem" />
          <Skeleton width="10%" height="1.1rem" />
          <Skeleton width="14%" height="1.1rem" />
          <Skeleton width="12%" height="1.1rem" />
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

function fiscalesTemplate(row) {
  return row.tieneDatosFiscales ? (
    <div className="cli-compact-cell">
      <strong title={row.rfc}>{row.rfc || "Fiscal"}</strong>
      <span title={row.razonSocial}>{row.razonSocial || "Datos preparados"}</span>
    </div>
  ) : (
    <span className="cli-muted-text">Sin fiscales</span>
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

export default function ClientesTable({
  rows,
  loading,
  hasClientes,
  onView,
  onEdit,
  onManage,
  onAction,
}) {
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

  const stateActions = (row) => {
    const estado = String(row.estadoCliente || "ACTIVO").toUpperCase();
    const actions = [];

    if (estado === "ACTIVO") {
      actions.push(["desactivar", "pi pi-pause-circle", "Desactivar"]);
      actions.push(["archivar", "pi pi-folder", "Archivar"]);
    } else if (estado === "INACTIVO") {
      actions.push(["reactivar", "pi pi-check-circle", "Reactivar"]);
      actions.push(["archivar", "pi pi-folder", "Archivar"]);
    } else {
      actions.push(["reactivar", "pi pi-check-circle", "Reactivar"]);
    }

    actions.push(["eliminar", "pi pi-shield", "Eliminar si no tiene uso"]);
    return actions;
  };

  const actionsTemplate = (row) => (
    <div className="cli-row-actions">
      <Button
        icon="pi pi-eye"
        className="cli-row-action"
        onClick={() => onView(row)}
        disabled={loading}
        aria-label="Ver detalle"
        tooltip="Ver detalle"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-pencil"
        className="cli-row-action"
        onClick={() => onEdit(row)}
        disabled={loading}
        aria-label="Editar"
        tooltip="Editar"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-shopping-bag"
        className="cli-row-action"
        onClick={() => onManage(row, "compras")}
        disabled={loading}
        aria-label="Ultimas compras"
        tooltip="Ultimas compras"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-history"
        className="cli-row-action cli-row-action-advanced"
        onClick={() => onManage(row, "auditoria")}
        disabled={loading}
        aria-label="Auditoria"
        tooltip="Auditoria"
        tooltipOptions={{ position: "top" }}
      />
      <span className="cli-row-action-separator" />
      {stateActions(row).map(([action, icon, label]) => (
        <Button
          key={action}
          icon={icon}
          className="cli-row-action cli-row-action-state"
          onClick={() => onAction(action, row)}
          disabled={loading}
          aria-label={label}
          tooltip={label}
          tooltipOptions={{ position: "top" }}
        />
      ))}
    </div>
  );

  if (loading && !rows.length) {
    return <LoadingTable />;
  }

  return (
    <DataTable
      value={rows}
      dataKey="idCliente"
      className="cli-table p-datatable-sm"
      paginator
      rows={6}
      rowsPerPageOptions={[6, 8, 10]}
      sortMode="multiple"
      emptyMessage={emptyMessage}
      currentPageReportTemplate="{first}-{last} de {totalRecords}"
      paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
    >
      <Column header="Cliente" body={clienteTemplate} sortable sortField="nombre" style={{ minWidth: "13rem" }} />
      <Column header="Telefono / WhatsApp" body={contactoTemplate} style={{ minWidth: "9rem" }} />
      <Column header="Tipo" body={tipoTemplate} sortable sortField="tipoCliente" style={{ minWidth: "7rem" }} />
      <Column header="Datos fiscales" body={fiscalesTemplate} sortable sortField="rfc" style={{ minWidth: "10rem" }} />
      <Column header="Ultima compra" body={ultimaCompraTemplate} sortable sortField="comprasRegistradas" style={{ minWidth: "9rem" }} />
      <Column header="Estado" body={estadoTemplate} sortable sortField="estadoCliente" style={{ minWidth: "6rem" }} />
      <Column header="Acciones" body={actionsTemplate} headerClassName="cli-actions-header" style={{ minWidth: "14.5rem" }} frozen alignFrozen="right" />
    </DataTable>
  );
}
