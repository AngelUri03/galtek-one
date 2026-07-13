import React, { useEffect, useMemo, useRef, useState } from "react";
import Shell from "../common/Shell";

import StoreConfigForm from "./ConfTienda";
import TicketConfig from "./Ticket/TicketConfig";
import ExportarDatos from "./ExportarDatos";
import AjustesUsuarios from "./AjustesUsuarios";
import Promociones from "./Promociones";
import AjustesRoles from "./AjustesRoles";
import AjustesOverrides from "./AjustesOverrides";
import ConfiguracionPlaceholder from "./ConfiguracionPlaceholder";
import ConfiguracionQuickActions from "./ConfiguracionQuickActions";
import ConfiguracionSearch from "./ConfiguracionSearch";
import ConfiguracionSectionHeader from "./ConfiguracionSectionHeader";
import ConfiguracionSectionNotice from "./ConfiguracionSectionNotice";
import ConfiguracionSidebar from "./ConfiguracionSidebar";
import {
  CONFIG_SECTION_GROUPS,
  QUICK_ACTIONS,
  flattenSections,
} from "./configuracionSections";

import "../../style/components/Configuracion/Ajustes.css";

const ALL_SECTIONS = flattenSections();
const DEFAULT_SECTION = "tienda";

function filterSections(groups, query) {
  const value = query.trim().toLowerCase();
  if (!value) return groups;

  return groups
    .map((group) => {
      const items = group.items.filter((item) =>
        [item.label, item.desc, group.group]
          .join(" ")
          .toLowerCase()
          .includes(value)
      );

      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);
}

export default function Ajustes() {
  const [active, setActive] = useState(DEFAULT_SECTION);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const tiendaRef = useRef(null);
  const ticketRef = useRef(null);
  const usuariosRef = useRef(null);
  const rolesRef = useRef(null);
  const overridesRef = useRef(null);

  const filteredSections = useMemo(
    () => filterSections(CONFIG_SECTION_GROUPS, query),
    [query]
  );

  const visibleSections = useMemo(
    () => flattenSections(filteredSections),
    [filteredSections]
  );

  const activeSection = useMemo(
    () =>
      ALL_SECTIONS.find((section) => section.key === active) ||
      ALL_SECTIONS.find((section) => section.key === DEFAULT_SECTION),
    [active]
  );

  useEffect(() => {
    if (!query.trim() || !visibleSections.length) return;
    const activeStillVisible = visibleSections.some(
      (section) => section.key === active
    );

    if (!activeStillVisible) {
      setActive(visibleSections[0].key);
    }
  }, [active, query, visibleSections]);

  const clearSearch = () => setQuery("");

  const renderRealSection = (children) => (
    <>
      <ConfiguracionSectionNotice section={activeSection} />
      <div className="ajx-section-body">{children}</div>
    </>
  );

  const renderContent = () => {
    switch (active) {
      case "tienda":
        return renderRealSection(<StoreConfigForm ref={tiendaRef} />);

      case "ticket":
        return renderRealSection(<TicketConfig ref={ticketRef} />);

      case "promociones":
        return renderRealSection(<Promociones />);

      case "usuarios":
        return renderRealSection(<AjustesUsuarios ref={usuariosRef} />);

      case "roles":
        return renderRealSection(<AjustesRoles ref={rolesRef} />);

      case "overrides":
        return renderRealSection(<AjustesOverrides ref={overridesRef} />);

      case "exportar":
        return renderRealSection(<ExportarDatos />);

      default:
        return <ConfiguracionPlaceholder section={activeSection} />;
    }
  };

  const canRefresh = Boolean(activeSection?.refreshable);

  const refreshActiveSection = async () => {
    if (!canRefresh || refreshing) return;

    const refs = {
      tienda: tiendaRef,
      ticket: ticketRef,
      usuarios: usuariosRef,
      roles: rolesRef,
      overrides: overridesRef,
    };
    const refresh = refs[active]?.current?.refresh;
    if (typeof refresh !== "function") return;

    setRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.error("No se pudo refrescar la seccion:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Shell>
      <main className="ajx-page">
        <section className="ajx-header">
          <div className="ajx-title-wrap">
            <div className="ajx-title">
              <i className="pi pi-cog" />
              <span>CONFIGURACION</span>
            </div>
          </div>

          <ConfiguracionSearch
            value={query}
            onChange={setQuery}
            onClear={clearSearch}
          />
        </section>

        <section className="ajx-layout">
          <div className="ajx-sidebar-stack">
            <ConfiguracionSidebar
              sections={filteredSections}
              activeKey={active}
              visibleCount={visibleSections.length}
              totalCount={ALL_SECTIONS.length}
              query={query}
              onSelect={setActive}
              onClearSearch={clearSearch}
            />

            <ConfiguracionQuickActions
              actions={QUICK_ACTIONS}
              onSelect={setActive}
            />
          </div>

          <section className="ajx-content" aria-live="polite">
            <ConfiguracionSectionHeader
              section={activeSection}
              canRefresh={canRefresh}
              refreshing={refreshing}
              onRefresh={refreshActiveSection}
            />

            <div
              className={[
                "ajx-surface",
                active === "tienda" ? "is-tienda" : "",
                active === "ticket" ? "is-ticket" : "",
                active === "usuarios" ? "is-usuarios" : "",
                active === "roles" ? "is-roles" : "",
                active === "overrides" ? "is-overrides" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {renderContent()}
            </div>
          </section>
        </section>
      </main>
    </Shell>
  );
}
