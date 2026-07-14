import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

export default function ConfiguracionSearch({ value, onChange, onClear }) {
  const hasValue = value.trim().length > 0;

  return (
    <div className="ajx-search" role="search">
      <i className="pi pi-search" />
      <InputText
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar seccion"
        aria-label="Buscar seccion de configuracion"
      />
      {hasValue ? (
        <Button
          icon="pi pi-times"
          className="ajx-search-clear"
          onClick={onClear}
          aria-label="Limpiar busqueda"
          type="button"
        />
      ) : null}
    </div>
  );
}
