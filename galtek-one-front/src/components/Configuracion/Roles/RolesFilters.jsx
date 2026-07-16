import React from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { ROLE_STATUS_OPTIONS, ROLE_TYPE_OPTIONS } from "./rolesUtils";

export default function RolesFilters({
  search,
  filters,
  moduleOptions,
  loading,
  onSearchChange,
  onFilterChange,
  onClear,
  onCreate,
}) {
  const hasFilters =
    search.trim() ||
    filters.estado !== "TODOS" ||
    filters.tipo !== "TODOS" ||
    filters.modulo !== "TODOS";

  return (
    <section className="ar-controls" aria-label="Filtros de roles">
      <label className="ar-filter ar-filter--search">
        <span>Buscador</span>
        <div className="ar-search-wrap">
          <i className="pi pi-search" />
          <InputText
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar rol, modulo o permiso"
            disabled={loading}
          />
        </div>
      </label>

      <div className="ar-filter-grid">
        <label className="ar-filter">
          <span>Estado</span>
          <Dropdown
            value={filters.estado}
            options={ROLE_STATUS_OPTIONS}
            onChange={(event) => onFilterChange("estado", event.value)}
            disabled={loading}
            panelClassName="ar-select-panel"
          />
        </label>

        <label className="ar-filter">
          <span>Tipo</span>
          <Dropdown
            value={filters.tipo}
            options={ROLE_TYPE_OPTIONS}
            onChange={(event) => onFilterChange("tipo", event.value)}
            disabled={loading}
            panelClassName="ar-select-panel"
          />
        </label>

        <label className="ar-filter">
          <span>Modulo</span>
          <Dropdown
            value={filters.modulo}
            options={moduleOptions}
            onChange={(event) => onFilterChange("modulo", event.value)}
            disabled={loading}
            panelClassName="ar-select-panel"
          />
        </label>
      </div>

      <div className="ar-control-actions">
        <Button
          icon="pi pi-filter-slash"
          className="ar-icon-btn"
          tooltip="Limpiar filtros"
          tooltipOptions={{ position: "top" }}
          aria-label="Limpiar filtros"
          onClick={onClear}
          disabled={loading || !hasFilters}
          type="button"
        />
        <Button
          label="Agregar rol"
          icon="pi pi-plus"
          className="ar-primary-btn ar-create-action"
          onClick={onCreate}
          disabled={loading}
          type="button"
        />
      </div>
    </section>
  );
}
