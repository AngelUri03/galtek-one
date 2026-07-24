import React, { useEffect, useMemo, useRef, useState } from "react";
import Shell from "../common/Shell";

import StoreConfigForm from "./ConfTienda";
import TicketConfig from "./Ticket/TicketConfig";
import ExportarDatos from "./ExportarDatos";
import AjustesUsuarios from "./AjustesUsuarios";
import Promociones from "./Promociones";
import AjustesRoles from "./AjustesRoles";
import AjustesOverrides from "./AjustesOverrides";
import AjustesCaja from "./AjustesCaja";
import AjustesPagos from "./AjustesPagos";
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
const HELP_STEPS = {
  caja: [
    {
      target: "summary",
      title: "Resumen de politica",
      body: "Estas tarjetas resumen como se comporta Caja con la politica actual antes de que alguien abra, cierre o entregue un turno.",
      details: [
        "Politica indica si el sistema prioriza continuidad operativa o exige supervision antes de seguir.",
        "Conteo muestra si el responsable captura a ciegas o si puede ver el esperado antes de contar.",
        "Incidencias indica si una diferencia pendiente permite seguir operando o bloquea el siguiente paso.",
      ],
      placement: "bottom-right",
    },
    {
      target: "handoff",
      title: "Modo de cierre y relevo",
      body: "Define que pasa cuando cambia el responsable de caja o se cierra un corte con diferencia.",
      details: [
        "Continuidad primero deja terminar el relevo y crea una incidencia para resolver despues sin frenar ventas.",
        "Estricto supervisado bloquea el cierre o relevo hasta que alguien autorizado revise el conteo.",
        "Usa estricto cuando quieras control fuerte; usa continuidad cuando la prioridad sea no detener operacion.",
      ],
      placement: "bottom-right",
    },
    {
      target: "visibility",
      title: "Visibilidad del esperado",
      body: "Controla quien puede ver cuanto deberia haber antes o durante el conteo de caja.",
      details: [
        "Permiso requerido oculta el esperado al cajero y solo lo muestra a perfiles autorizados.",
        "Visible para el responsable permite que quien tiene el turno vea el esperado antes de capturar.",
        "Ciego hasta revelar oculta el esperado hasta confirmar el conteo y despues muestra la diferencia.",
      ],
      placement: "bottom-left",
    },
    {
      target: "toggles",
      title: "Reglas del turno",
      body: "Estos interruptores afinan que evidencia se exige en cada cambio de responsable y cierre.",
      details: [
        "Conteo entrante pide registrar el efectivo recibido al iniciar o relevar la caja.",
        "Conteo saliente obliga a declarar efectivo al entregar o cerrar el turno.",
        "Continuar con incidencia pendiente decide si se puede trabajar aunque exista un faltante o sobrante abierto.",
        "Conteo ciego evita que el esperado influya en el numero que captura el cajero.",
      ],
      placement: "top-right",
    },
    {
      target: "save",
      title: "Aplicar cambios",
      body: "Estos botones controlan si los cambios quedan solo en pantalla o se convierten en la nueva politica operativa.",
      details: [
        "Restaurar descarta lo modificado y vuelve a la ultima configuracion guardada.",
        "Guardar politica aplica las reglas para los siguientes cortes, relevos y conteos.",
        "Las incidencias ya creadas conservan su evidencia; la politica nueva afecta las acciones posteriores.",
      ],
      placement: "top-left",
    },
  ],
};

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpIndex, setHelpIndex] = useState(0);
  const [helpRect, setHelpRect] = useState(null);

  const tiendaRef = useRef(null);
  const ticketRef = useRef(null);
  const cajaRef = useRef(null);
  const pagosRef = useRef(null);
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

  const activeHelpSteps = HELP_STEPS[active] || [];
  const activeHelpStep = activeHelpSteps[helpIndex] || activeHelpSteps[0];

  useEffect(() => {
    setHelpOpen(false);
    setHelpIndex(0);
    setHelpRect(null);
  }, [active]);

  useEffect(() => {
    if (!helpOpen || !activeHelpStep?.target) {
      setHelpRect(null);
      return undefined;
    }

    let frameId = 0;
    const updateRect = () => {
      const element = document.querySelector(".ajx-surface .is-help-focus");
      if (!element) {
        setHelpRect(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const padding = 18;
      const x = Math.max(10, rect.left - padding);
      const y = Math.max(10, rect.top - padding);
      setHelpRect({
        x,
        y,
        width: Math.max(1, Math.min(window.innerWidth - x - 10, rect.width + padding * 2)),
        height: Math.max(1, Math.min(window.innerHeight - y - 10, rect.height + padding * 2)),
      });
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateRect);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [activeHelpStep?.target, helpOpen]);

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

      case "caja":
        return renderRealSection(<AjustesCaja ref={cajaRef} helpStep={helpOpen ? activeHelpStep?.target : ""} />);

      case "pagos":
        return renderRealSection(<AjustesPagos ref={pagosRef} />);

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
  const canShowHelp = activeHelpSteps.length > 0;

  const openHelp = () => {
    if (!canShowHelp) return;
    setHelpIndex(0);
    setHelpOpen(true);
  };

  const refreshActiveSection = async () => {
    if (!canRefresh || refreshing) return;

    const refs = {
      tienda: tiendaRef,
      ticket: ticketRef,
      caja: cajaRef,
      pagos: pagosRef,
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
              helpAvailable={canShowHelp}
              onHelp={openHelp}
            />

            <div
              className={[
                "ajx-surface",
                helpOpen ? "has-help-tour" : "",
                active === "tienda" ? "is-tienda" : "",
                active === "ticket" ? "is-ticket" : "",
                active === "caja" ? "is-caja" : "",
                active === "pagos" ? "is-pagos" : "",
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

        {helpOpen && activeHelpStep ? (
          <ConfiguracionHelpOverlay
            step={activeHelpStep}
            spotlightRect={helpRect}
            index={helpIndex}
            total={activeHelpSteps.length}
            onPrev={() => setHelpIndex((current) => Math.max(0, current - 1))}
            onNext={() => {
              if (helpIndex + 1 >= activeHelpSteps.length) {
                setHelpOpen(false);
                setHelpIndex(0);
                return;
              }
              setHelpIndex((current) => current + 1);
            }}
            onClose={() => {
              setHelpOpen(false);
              setHelpIndex(0);
            }}
          />
        ) : null}
      </main>
    </Shell>
  );
}

function ConfiguracionHelpOverlay({ step, spotlightRect, index, total, onPrev, onNext, onClose }) {
  const spotlightStyle = spotlightRect
    ? {
        "--ajx-help-x": `${spotlightRect.x}px`,
        "--ajx-help-y": `${spotlightRect.y}px`,
        "--ajx-help-w": `${spotlightRect.width}px`,
        "--ajx-help-h": `${spotlightRect.height}px`,
      }
    : undefined;

  return (
    <div className="ajx-help-overlay" role="dialog" aria-modal="true" aria-labelledby="ajx-help-title" style={spotlightStyle}>
      <div className="ajx-help-backdrop" onClick={onClose} />
      <aside className={`ajx-help-card ${step.placement ? `is-${step.placement}` : ""}`}>
        <span>Paso {index + 1} de {total}</span>
        <h3 id="ajx-help-title">{step.title}</h3>
        <p>{step.body}</p>
        {step.details?.length ? (
          <ul>
            {step.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
        <div className="ajx-help-progress" aria-hidden="true">
          {Array.from({ length: total }).map((_, itemIndex) => (
            <i key={itemIndex} className={itemIndex === index ? "is-active" : ""} />
          ))}
        </div>
        <footer>
          <button type="button" onClick={onClose}>Cerrar</button>
          <div>
            <button type="button" onClick={onPrev} disabled={index === 0}>Anterior</button>
            <button type="button" onClick={onNext}>{index + 1 >= total ? "Terminar" : "Siguiente"}</button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
