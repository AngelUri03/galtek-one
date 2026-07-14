import React from "react";
import ConfiguracionStatusPill from "./ConfiguracionStatusPill";

export default function ConfiguracionSidebar({
  sections,
  activeKey,
  visibleCount,
  totalCount,
  query,
  onSelect,
  onClearSearch,
}) {
  const hasResults = visibleCount > 0;
  const isSearching = query.trim().length > 0;

  return (
    <aside className="ajx-rail" aria-label="Secciones de configuracion">
      <div className="ajx-rail-head">
        <div>
          <span>{isSearching ? "Resultados" : "Secciones"}</span>
          {isSearching ? <strong>{visibleCount} de {totalCount}</strong> : null}
        </div>
        {isSearching ? (
          <button className="ajx-rail-clear" type="button" onClick={onClearSearch}>
            Limpiar
          </button>
        ) : null}
      </div>

      <div className="ajx-nav-wrap">
        <nav className="ajx-nav">
          {sections.map((sectionGroup) => (
            <div className="ajx-group-block" key={sectionGroup.group}>
              <div className="ajx-group">{sectionGroup.group}</div>

              {sectionGroup.items.map((item) => {
                const active = activeKey === item.key;
                return (
                  <button
                    key={item.key}
                    className={`ajx-nav-item ${active ? "is-active" : ""}`}
                    onClick={() => onSelect(item.key)}
                    type="button"
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="ajx-nav-icon">
                      <i className={item.icon} />
                    </span>

                    <span className="ajx-nav-text">
                      <span className="ajx-nav-topline">
                        <span className="ajx-nav-label">{item.label}</span>
                        <ConfiguracionStatusPill status={item.status} compact />
                      </span>
                      <span className="ajx-nav-desc">{item.desc}</span>
                    </span>

                    <span className="ajx-nav-chevron">
                      <i className="pi pi-angle-right" />
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {!hasResults ? (
            <div className="ajx-empty">
              <span className="ajx-empty-icon">
                <i className="pi pi-search" />
              </span>
              <div>
                <strong>Sin resultados</strong>
                <span>
                  No encontre secciones para "{query}". Ajusta la busqueda para continuar.
                </span>
                <button type="button" onClick={onClearSearch}>
                  Limpiar busqueda
                </button>
              </div>
            </div>
          ) : null}
        </nav>
      </div>
    </aside>
  );
}
