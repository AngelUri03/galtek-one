import React from "react";
import { getStatusConfig } from "./configuracionSections";

export default function ConfiguracionStatusPill({ status, compact = false }) {
  const config = getStatusConfig(status);

  return (
    <span className={`ajx-status ajx-status--${config.tone} ${compact ? "is-compact" : ""}`}>
      <i className={config.icon} />
      <span>{config.label}</span>
    </span>
  );
}
