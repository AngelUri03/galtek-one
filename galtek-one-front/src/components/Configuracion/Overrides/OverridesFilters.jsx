import React from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import {
  OVERRIDE_EFFECT_OPTIONS,
  OVERRIDE_SCOPE_OPTIONS,
  OVERRIDE_STATUS_OPTIONS,
} from "./overridesUtils";

export default function OverridesFilters({
  search,
  filters,
  roleOptions,
  loading,
  onSearchChange,
  onFilterChange,
  onClear,
}) {
  const hasFilters =
    search.trim() ||
    filters.scope !== "TODOS" ||
    filters.rol !== "TODOS" ||
    filters.estado !== "TODOS" ||
    filters.efecto !== "TODOS";

  return (
    <section className="uov-controls" aria-label="Filtros de overrides">
      <label className="uov-filter uov-filter--search">
        <span>Buscador</span>
        <div className="uov-search-wrap">
          <i className="pi pi-search" />
          <InputText
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar usuario, rol, contacto o permiso"
            disabled={loading}
          />
        </div>
      </label>

      <div className="uov-filter-grid">
        <label className="uov-filter">
          <span>Vista</span>
          <Dropdown
            value={filters.scope}
            options={OVERRIDE_SCOPE_OPTIONS}
            onChange={(event) => onFilterChange("scope", event.value)}
            disabled={loading}
            panelClassName="uov-select-panel"
          />
        </label>

        <label className="uov-filter">
          <span>Rol</span>
          <Dropdown
            value={filters.rol}
            options={roleOptions}
            onChange={(event) => onFilterChange("rol", event.value)}
            disabled={loading}
            panelClassName="uov-select-panel"
          />
        </label>

        <label className="uov-filter">
          <span>Estado</span>
          <Dropdown
            value={filters.estado}
            options={OVERRIDE_STATUS_OPTIONS}
            onChange={(event) => onFilterChange("estado", event.value)}
            disabled={loading}
            panelClassName="uov-select-panel"
          />
        </label>

        <label className="uov-filter">
          <span>Efecto</span>
          <Dropdown
            value={filters.efecto}
            options={OVERRIDE_EFFECT_OPTIONS}
            onChange={(event) => onFilterChange("efecto", event.value)}
            disabled={loading}
            panelClassName="uov-select-panel"
          />
        </label>
      </div>

      <div className="uov-control-actions">
        <Button
          icon="pi pi-times"
          className="uov-icon-btn"
          tooltip="Limpiar filtros"
          tooltipOptions={{ position: "top" }}
          aria-label="Limpiar filtros"
          onClick={onClear}
          disabled={loading || !hasFilters}
          type="button"
        />
      </div>
    </section>
  );
}
