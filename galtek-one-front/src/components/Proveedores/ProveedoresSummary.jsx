import React from "react";
import { Skeleton } from "primereact/skeleton";

const renderValue = (value) => (value === null || value === undefined ? "--" : value);

export default function ProveedoresSummary({ stats, loading }) {
  const cards = [
    { label: "Total", value: stats.total, icon: "pi pi-building" },
    { label: "Activos", value: stats.activos, icon: "pi pi-check-circle" },
    { label: "Inactivos", value: stats.inactivos, icon: "pi pi-pause-circle" },
    { label: "Archivados", value: stats.archivados, icon: "pi pi-folder" },
    {
      label: "Sin productos",
      value: stats.sinProductos,
      icon: "pi pi-box",
      hint: stats.sinProductos == null ? "Requiere detalle" : "",
    },
    {
      label: "Con activos",
      value: stats.conActivos,
      icon: "pi pi-th-large",
      hint: stats.conActivos == null ? "Requiere detalle" : "",
    },
  ];

  return (
    <div className="prov-summary" aria-label="Resumen operativo de proveedores">
      {cards.map((card) => (
        <div className="prov-summary-card" key={card.label}>
          <i className={card.icon} />
          <div>
            <span>{card.label}</span>
            {loading ? (
              <Skeleton width="3rem" height="1.4rem" />
            ) : (
              <strong>{renderValue(card.value)}</strong>
            )}
            {card.hint && !loading ? <small>{card.hint}</small> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
