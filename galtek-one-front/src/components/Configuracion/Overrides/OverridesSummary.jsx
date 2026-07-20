import React from "react";
import { Skeleton } from "primereact/skeleton";

const cards = [
  { key: "usuariosConOverrides", label: "Con overrides", icon: "pi pi-user-edit" },
  { key: "overridesActivos", label: "Overrides activos", icon: "pi pi-sliders-h" },
  { key: "permitidosPorExcepcion", label: "Permitidos", icon: "pi pi-check-circle" },
  { key: "denegadosPorExcepcion", label: "Denegados", icon: "pi pi-ban" },
];

export default function OverridesSummary({ stats, loading }) {
  return (
    <section className="uov-summary" aria-label="Resumen operativo de overrides">
      {cards.map((card) => (
        <article className="uov-summary-card" key={card.key}>
          <i className={card.icon} />
          <div>
            <span>{card.label}</span>
            {loading ? (
              <Skeleton width="2.6rem" height="1.3rem" />
            ) : (
              <strong>{stats?.[card.key] ?? 0}</strong>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
