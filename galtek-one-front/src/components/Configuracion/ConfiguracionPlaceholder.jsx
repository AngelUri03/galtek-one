import React from "react";
import ConfiguracionStatusPill from "./ConfiguracionStatusPill";

export default function ConfiguracionPlaceholder({ section }) {
  return (
    <div className="ajx-placeholder">
      <div className="ajx-placeholder-icon">
        <i className={section.icon || "pi pi-cog"} />
      </div>

      <div className="ajx-placeholder-copy">
        <ConfiguracionStatusPill status={section.status} />
        <h3>Pendiente de activar</h3>
        <p>{section.placeholder || section.desc}</p>
      </div>

      <div className="ajx-placeholder-note">
        <i className="pi pi-info-circle" />
        <span>
          Se muestra como pendiente para evitar confundirla con funcionalidad productiva.
        </span>
      </div>
    </div>
  );
}
