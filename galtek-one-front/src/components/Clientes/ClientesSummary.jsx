import React from "react";
import { Skeleton } from "primereact/skeleton";

const valueOrDash = (value) => (value === null || value === undefined ? "--" : value);

export default function ClientesSummary({ stats, loading }) {
  const cards = [
    { label: "Total", value: stats.total, icon: "pi pi-users" },
    { label: "Activos", value: stats.activos, icon: "pi pi-check-circle" },
    { label: "Inactivos", value: stats.inactivos, icon: "pi pi-pause-circle" },
    { label: "Archivados", value: stats.archivados, icon: "pi pi-folder" },
    { label: "Con fiscales", value: stats.conFiscales, icon: "pi pi-id-card" },
    { label: "Con direccion", value: stats.conDireccion, icon: "pi pi-map-marker" },
  ];

  return (
    <div className="cli-summary" aria-label="Resumen operativo de clientes">
      {cards.map((card) => (
        <div className="cli-summary-card" key={card.label}>
          <i className={card.icon} />
          <div>
            <span>{card.label}</span>
            {loading ? (
              <Skeleton width="3rem" height="1.4rem" />
            ) : (
              <strong>{valueOrDash(card.value)}</strong>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
