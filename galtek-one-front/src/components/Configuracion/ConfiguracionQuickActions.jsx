import React from "react";
import ConfiguracionStatusPill from "./ConfiguracionStatusPill";

export default function ConfiguracionQuickActions({ actions, onSelect }) {
  return (
    <section className="ajx-quick" aria-label="Acciones rapidas de configuracion">
      <div className="ajx-quick-head">
        <span>Accesos</span>
      </div>

      <div className="ajx-quick-grid">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            className={`ajx-quick-item ${action.disabled ? "is-disabled" : ""}`}
            onClick={() => !action.disabled && onSelect(action.target)}
            disabled={action.disabled}
            title={
              action.disabled
                ? `${action.label}: ${action.status === "coming" ? "proximamente" : "no conectado"}`
                : action.label
            }
          >
            <span className="ajx-quick-icon">
              <i className={action.icon} />
            </span>
            <span className="ajx-quick-main">
              <strong>{action.label}</strong>
              <ConfiguracionStatusPill status={action.status} compact />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
