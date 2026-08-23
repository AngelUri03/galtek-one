import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { ModalSurface } from "../common/OverlaySurfaces";
import {
  COMPRAS_OPTIONS,
  DIRECCION_OPTIONS,
  ESTADO_OPTIONS,
  FISCAL_OPTIONS,
  TIPO_OPTIONS,
  ULTIMA_COMPRA_OPTIONS,
  emptyFilters,
} from "./clientesUtils";

const fields = [
  { key: "estado", label: "Estado", options: ESTADO_OPTIONS },
  { key: "tipo", label: "Tipo", options: TIPO_OPTIONS },
  { key: "fiscales", label: "Fiscales", options: FISCAL_OPTIONS },
  { key: "direccion", label: "Direccion", options: DIRECCION_OPTIONS },
  { key: "compras", label: "Compras", options: COMPRAS_OPTIONS },
  { key: "ultimaCompra", label: "Ultima", options: ULTIMA_COMPRA_OPTIONS },
];

function FilterField({ field, filters, onFilterChange }) {
  return (
    <label className="cli-filter" key={field.key}>
      <span>{field.label}</span>
      <Dropdown
        value={filters[field.key]}
        options={field.options}
        onChange={(event) => onFilterChange(field.key, event.value)}
        className="cli-filter-dropdown"
        panelClassName="cli-filter-panel"
      />
    </label>
  );
}

export default function ClientesFilters({
  search,
  filters,
  loading,
  onSearchChange,
  onFilterChange,
  onClear,
  onRefresh,
}) {
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const hasFilters =
    search.trim() ||
    Object.entries(filters).some(([key, value]) => value !== emptyFilters[key]);
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value !== emptyFilters[key]
  ).length;
  const draftFilterCount = Object.entries(draftFilters).filter(
    ([key, value]) => value !== emptyFilters[key]
  ).length;
  const draftHasChanges = fields.some(({ key }) => draftFilters[key] !== filters[key]);

  const openFiltersModal = () => {
    setDraftFilters({ ...filters });
    setFiltersModalVisible(true);
  };

  const closeFiltersModal = () => {
    setDraftFilters({ ...filters });
    setFiltersModalVisible(false);
  };

  const updateDraftFilter = (field, value) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearDraftFilters = () => {
    setDraftFilters({ ...emptyFilters });
  };

  const applyDraftFilters = () => {
    fields.forEach(({ key }) => {
      if (filters[key] !== draftFilters[key]) {
        onFilterChange(key, draftFilters[key]);
      }
    });
    setFiltersModalVisible(false);
  };

  return (
    <>
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
            <FilterField
              key={field.key}
              field={field}
              filters={filters}
              onFilterChange={onFilterChange}
            />
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
            tooltipOptions={{ position: "top", className: "cli-action-tooltip" }}
          />
          <Button
            label="Limpiar"
            icon="pi pi-filter-slash"
            className="cli-soft-btn"
            onClick={onClear}
            disabled={!hasFilters}
          />
          <Button
            label="Filtros"
            icon="pi pi-sliders-h"
            badge={activeFilterCount ? String(activeFilterCount) : null}
            className="cli-soft-btn cli-filter-modal-btn"
            onClick={openFiltersModal}
            aria-label={
              activeFilterCount
                ? `Abrir filtros, ${activeFilterCount} activos`
                : "Abrir filtros"
            }
          />
        </div>
      </div>

      <ModalSurface
        visible={filtersModalVisible}
        title="Filtros de clientes"
        size="medium"
        onHide={closeFiltersModal}
        className="cli-filters-dialog"
        footer={
          <div className="cli-dialog-footer">
            <Button
              label="Limpiar"
              icon="pi pi-filter-slash"
              className="p-button-text cli-text-btn"
              onClick={clearDraftFilters}
              disabled={!draftFilterCount}
            />
            <Button
              label="Aplicar filtros"
              icon="pi pi-check"
              className="cli-primary-btn"
              onClick={applyDraftFilters}
            />
          </div>
        }
      >
        <div className="cli-filters-modal-body">
          <div className="cli-filters-modal-hero">
            <span>
              <i className="pi pi-sliders-h" />
            </span>
            <div>
              <strong>Refina el directorio</strong>
              <small>
                {draftHasChanges
                  ? "Cambios listos para aplicar"
                  : draftFilterCount
                  ? `${draftFilterCount} filtros seleccionados`
                  : "Sin filtros avanzados activos"}
              </small>
            </div>
          </div>
          <div className="cli-filter-modal-grid">
            {fields.map((field) => (
              <FilterField
                key={field.key}
                field={field}
                filters={draftFilters}
                onFilterChange={updateDraftFilter}
              />
            ))}
          </div>
        </div>
      </ModalSurface>
    </>
  );
}
