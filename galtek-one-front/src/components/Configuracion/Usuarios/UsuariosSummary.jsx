import React from "react";
import { Skeleton } from "primereact/skeleton";

const cards = [
  { key: "total", label: "Total", icon: "pi pi-users" },
  { key: "activos", label: "Activos", icon: "pi pi-check-circle" },
  { key: "inactivos", label: "Inactivos", icon: "pi pi-ban" },
  { key: "roles", label: "Roles", icon: "pi pi-id-card" },
  { key: "sinRol", label: "Sin rol", icon: "pi pi-exclamation-circle" },
];

export default function UsuariosSummary({ stats, loading }) {
  return (
    <section className="au-summary" aria-label="Resumen operativo de usuarios">
      {cards.map((card) => (
        <article className="au-summary-card" key={card.key}>
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
