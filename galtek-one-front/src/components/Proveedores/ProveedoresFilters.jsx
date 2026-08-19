import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { ModalSurface } from "../common/OverlaySurfaces";
import {
  ACTIVOS_OPTIONS,
  ESTADO_OPTIONS,
  MODALIDAD_OPTIONS,
  PAGO_OPTIONS,
  PRODUCTOS_OPTIONS,
  TIPO_OPTIONS,
  emptyFilters,
} from "./proveedoresUtils";

const fields = [
  { key: "estado", label: "Estado", options: ESTADO_OPTIONS },
  { key: "tipo", label: "Tipo", options: TIPO_OPTIONS },
  { key: "modalidad", label: "Modalidad", options: MODALIDAD_OPTIONS },
  { key: "productos", label: "Productos", options: PRODUCTOS_OPTIONS },
  { key: "activos", label: "Activos", options: ACTIVOS_OPTIONS },
  { key: "pago", label: "Pago", options: PAGO_OPTIONS },
];

function FilterField({ field, filters, onFilterChange }) {
  return (
    <label className="prov-filter" key={field.key}>
      <span>{field.label}</span>
      <Dropdown
        value={filters[field.key]}
        options={field.options}
        onChange={(event) => onFilterChange(field.key, event.value)}
        className="prov-filter-dropdown"
        panelClassName="prov-filter-panel"
      />
    </label>
  );
}

export default function ProveedoresFilters({
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
  const draftHasChanges = fields.some(
    ({ key }) => draftFilters[key] !== filters[key]
  );

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
      <div className="prov-controls">
        <div className="prov-search-wrap">
          <i className="pi pi-search" />
          <InputText
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar proveedor, contacto, telefono, WhatsApp, RFC o direccion"
            aria-label="Buscar proveedores"
          />
        </div>

        <div className="prov-filter-grid">
          {fields.map((field) => (
            <FilterField
              key={field.key}
              field={field}
              filters={filters}
              onFilterChange={onFilterChange}
            />
          ))}
        </div>

        <div className="prov-control-actions">
          <Button
            icon="pi pi-refresh"
            className="prov-icon-btn"
            onClick={onRefresh}
            loading={loading}
            aria-label="Actualizar proveedores"
            tooltip="Actualizar"
            tooltipOptions={{ position: "top" }}
          />
          <Button
            label="Limpiar"
            icon="pi pi-filter-slash"
            className="prov-soft-btn"
            onClick={onClear}
            disabled={!hasFilters}
          />
          <Button
            label="Filtros"
            icon="pi pi-sliders-h"
            badge={activeFilterCount ? String(activeFilterCount) : null}
            className="prov-soft-btn prov-filter-modal-btn"
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
        title="Filtros de proveedores"
        size="medium"
        onHide={closeFiltersModal}
        className="prov-filters-dialog"
        footer={
          <div className="prov-dialog-footer">
            <Button
              label="Limpiar"
              icon="pi pi-filter-slash"
              className="p-button-text prov-text-btn"
              onClick={clearDraftFilters}
              disabled={!draftFilterCount}
            />
            <Button
              label="Aplicar filtros"
              icon="pi pi-check"
              className="prov-primary-btn"
              onClick={applyDraftFilters}
            />
          </div>
        }
      >
        <div className="prov-filters-modal-body">
          <div className="prov-filters-modal-hero">
            <span>
              <i className="pi pi-sliders-h" />
            </span>
            <div>
              <strong>Refina la relacion comercial</strong>
              <small>
                {draftHasChanges
                  ? "Cambios listos para aplicar"
                  : draftFilterCount
                  ? `${draftFilterCount} filtros seleccionados`
                  : "Sin filtros avanzados activos"}
              </small>
            </div>
          </div>
          <div className="prov-filter-modal-grid">
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
