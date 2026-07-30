import React from "react";
import { Skeleton } from "primereact/skeleton";

const cards = [
  { key: "total", label: "Total", icon: "pi pi-sitemap" },
  { key: "activos", label: "Activos", icon: "pi pi-check-circle" },
  { key: "inactivos", label: "Inactivos", icon: "pi pi-ban" },
  { key: "protegidos", label: "Protegidos", icon: "pi pi-shield" },
  { key: "permisos", label: "Permisos sistema", icon: "pi pi-lock" },
];

export default function RolesSummary({ stats, loading }) {
  return (
    <section className="ar-summary" aria-label="Resumen operativo de roles">
      {cards.map((card) => (
        <article className="ar-summary-card" key={card.key}>
          <i className={card.icon} />
          <div>
            <span>{card.label}</span>
            {loading ? (
              <Skeleton width="3rem" height="1.4rem" />
            ) : (
              <strong>{stats?.[card.key] ?? 0}</strong>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
