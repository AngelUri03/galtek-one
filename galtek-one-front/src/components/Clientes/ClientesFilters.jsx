import React from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import {
  COMPRAS_OPTIONS,
  DIRECCION_OPTIONS,
  ESTADO_OPTIONS,
  FISCAL_OPTIONS,
  TIPO_OPTIONS,
  emptyFilters,
} from "./clientesUtils";

const fields = [
  { key: "estado", label: "Estado", options: ESTADO_OPTIONS },
  { key: "tipo", label: "Tipo", options: TIPO_OPTIONS },
  { key: "fiscales", label: "Fiscales", options: FISCAL_OPTIONS },
  { key: "direccion", label: "Direccion", options: DIRECCION_OPTIONS },
  { key: "compras", label: "Compras", options: COMPRAS_OPTIONS },
];

export default function ClientesFilters({
  search,
  filters,
  loading,
  onSearchChange,
  onFilterChange,
  onClear,
  onRefresh,
}) {
  const hasFilters =
    search.trim() ||
    Object.entries(filters).some(([key, value]) => value !== emptyFilters[key]);

  return (
    <div className="cli-controls">
      <div className="cli-search-wrap">
        <i className="pi pi-search" />
        <InputText
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar nombre, alias, telefono, WhatsApp, correo, RFC o direccion"
          aria-label="Buscar clientes"
        />
      </div>

      <div className="cli-filter-grid">
        {fields.map((field) => (
          <label className="cli-filter" key={field.key}>
            <span>{field.label}</span>
            <Dropdown
              value={filters[field.key]}
              options={field.options}
              onChange={(event) => onFilterChange(field.key, event.value)}
              className="cli-filter-dropdown"
            />
          </label>
        ))}
      </div>

      <div className="cli-control-actions">
        <Button
          icon="pi pi-refresh"
          className="cli-icon-btn"
          onClick={onRefresh}
          loading={loading}
          aria-label="Actualizar clientes"
          tooltip="Actualizar"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          label="Limpiar"
          icon="pi pi-filter-slash"
          className="cli-soft-btn"
          onClick={onClear}
          disabled={!hasFilters}
        />
      </div>
    </div>
  );
}
