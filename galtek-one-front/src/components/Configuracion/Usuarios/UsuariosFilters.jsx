import React from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { CONTACT_OPTIONS, STATUS_OPTIONS } from "./usuariosUtils";

export default function UsuariosFilters({
  search,
  filters,
  roles,
  loading,
  onSearchChange,
  onFilterChange,
  onClear,
  onCreate,
}) {
  const roleOptions = [
    { label: "Todos", value: "TODOS" },
    ...roles.map((role) => ({ label: role.nombreRol, value: role.idRol })),
    { label: "Sin rol", value: "SIN_ROL" },
  ];
  const hasFilters =
    search.trim() ||
    filters.estado !== "TODOS" ||
    filters.rol !== "TODOS" ||
    filters.contacto !== "TODOS";

  return (
    <section className="au-controls" aria-label="Filtros de usuarios">
      <label className="au-filter au-filter--search">
        <span>Buscador</span>
        <div className="au-search-wrap">
          <i className="pi pi-search" />
          <InputText
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar nombre, usuario, correo, telefono o rol"
            disabled={loading}
          />
        </div>
      </label>

      <div className="au-filter-grid">
        <label className="au-filter">
          <span>Estado</span>
          <Dropdown
            value={filters.estado}
            options={STATUS_OPTIONS}
            onChange={(event) => onFilterChange("estado", event.value)}
            disabled={loading}
            panelClassName="au-select-panel"
          />
        </label>

        <label className="au-filter">
          <span>Rol</span>
          <Dropdown
            value={filters.rol}
            options={roleOptions}
            onChange={(event) => onFilterChange("rol", event.value)}
            disabled={loading}
            panelClassName="au-select-panel"
          />
        </label>

        <label className="au-filter">
          <span>Contacto</span>
          <Dropdown
            value={filters.contacto}
            options={CONTACT_OPTIONS}
            onChange={(event) => onFilterChange("contacto", event.value)}
            disabled={loading}
            panelClassName="au-select-panel"
          />
        </label>
      </div>

      <div className="au-control-actions">
        <Button
          icon="pi pi-filter-slash"
          className="au-icon-btn au-tip"
          tooltip="Limpiar filtros"
          aria-label="Limpiar filtros"
          onClick={onClear}
          disabled={loading || !hasFilters}
          type="button"
        />
        <Button
          label="Agregar usuario"
          icon="pi pi-user-plus"
          className="au-primary-btn au-create-action"
          onClick={onCreate}
          disabled={loading}
          type="button"
        />
      </div>
    </section>
  );
}
