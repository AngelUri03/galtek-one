import React from "react";
import ConfiguracionStatusPill from "./ConfiguracionStatusPill";

export default function ConfiguracionSectionNotice({ section }) {
  if (!section?.notice) return null;

  return (
    <div className="ajx-section-notice">
      <span className="ajx-section-notice-icon">
        <i className="pi pi-info-circle" />
      </span>
      <div>
        <strong>{section.label}</strong>
        <span>{section.notice}</span>
      </div>
      <ConfiguracionStatusPill status={section.status} compact />
    </div>
  );
}
