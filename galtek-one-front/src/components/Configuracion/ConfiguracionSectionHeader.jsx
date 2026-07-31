import React from "react";
import { Button } from "primereact/button";
import ConfiguracionStatusPill from "./ConfiguracionStatusPill";

export default function ConfiguracionSectionHeader({
  section,
  canRefresh,
  refreshing,
  onRefresh,
  helpAvailable,
  onHelp,
}) {
  return (
    <header className="ajx-content-head">
      <div className="ajx-head-main">
        <span className="ajx-section-icon" aria-hidden="true">
          <i className={section.icon} />
        </span>

        <div className="ajx-content-left">
          <div className="ajx-head-meta">
            <span className="ajx-chip">{section.group}</span>
            <ConfiguracionStatusPill status={section.status} />
          </div>

          <div className="ajx-section-title-row">
            <h2>{section.label}</h2>
          </div>

          <p>{section.desc}</p>
        </div>
      </div>

      {canRefresh || helpAvailable ? (
        <div className="ajx-content-actions">
          {helpAvailable ? (
            <Button
              icon="pi pi-question-circle"
              className="ajx-icon-btn ajx-help-btn"
              onClick={onHelp}
              tooltip="Ayuda guiada"
              tooltipOptions={{ position: "top" }}
              aria-label="Abrir ayuda guiada"
              type="button"
            />
          ) : null}
          {canRefresh ? (
            <Button
              icon={refreshing ? "pi pi-spin pi-spinner" : "pi pi-refresh"}
              className="ajx-icon-btn"
              onClick={onRefresh}
              tooltip="Refrescar seccion"
              tooltipOptions={{ position: "top" }}
              disabled={refreshing}
              aria-label="Refrescar seccion activa"
              type="button"
            />
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
