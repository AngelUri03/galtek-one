import React from "react";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import "../../style/components/Inventario/InventarioToolbar.css";

export default function InventarioToolbar({
  search,
  onSearchChange,
  onOpenFilters,
  onClearFilters,
  onRefresh,
  onExport,
  onImport,
  onAddProduct,
  loading = false,
}) {
  const left = (
    <div className="inv-tb-left">
      <span className="p-input-search">
        <i className="pi pi-search" />
        <InputText
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Buscar un producto por nombre, SKU, categoría, proveedor…"
          aria-label="Buscar productos"
        />
      </span>

      <Button
        className="inv-tb-btn inv-tb-btn--ghost inv-tb-btn--filter"
        icon="pi pi-filter"
        label="Filtros"
        onClick={onOpenFilters}
      />

      <Button
        className="inv-tb-btn inv-tb-btn--ghost inv-tb-btn--clear"
        icon="pi pi-times"
        label="Limpiar"
        onClick={onClearFilters}
      />
    </div>
  );

  const right = (
    <div className="inv-tb-right">
      <Button
        className="inv-tb-btn inv-tb-btn--ghost inv-tb-btn--refresh"
        icon="pi pi-refresh"
        label="Actualizar"
        onClick={onRefresh}
        loading={loading}
      />

      <span className="inv-tb-separator" />

      <Button
        className="inv-tb-btn--export"
        icon="pi pi-download"
        onClick={onExport}
        rounded
        text
        aria-label="Exportar productos"
      />

      <Button
        className="inv-tb-btn--import"
        icon="pi pi-upload"
        onClick={onImport}
        rounded
        text
        aria-label="Importar productos"
      />

      <Button
        className="inv-tb-btn inv-tb-btn--primary inv-tb-btn--add"
        icon="pi pi-plus"
        label="Agregar"
        onClick={onAddProduct}
      />
    </div>
  );

  return <Toolbar className="inv-toolbar" left={left} right={right} />;
}
