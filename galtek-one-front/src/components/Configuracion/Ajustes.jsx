import React, { useEffect, useMemo, useRef, useState } from "react";
import Shell from "../common/Shell";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Badge } from "primereact/badge";

// EXISTENTES
import StoreConfigForm from "./ConfTienda";
import ExportarDatos from "./ExportarDatos";
import AjustesUsuarios from "./AjustesUsuarios";
import Promociones from "./Promociones";
import AjustesRoles from "./AjustesRoles";

// import ImpuestosYFacturacion from "../Ajustes/ImpuestosYFacturacion";
// import PagosYTerminales from "../Ajustes/PagosYTerminales";
// import Notificaciones from "../Ajustes/Notificaciones";
// import AparienciaTicket from "../Ajustes/AparienciaTicket";
// import AuditoriaActividad from "../Ajustes/AuditoriaActividad";
// import Integraciones from "../Ajustes/Integraciones";

import "../../style/components/Configuracion/Ajustes.css";

const SECTIONS = [
  {
    group: "Operación",
    items: [
      {
        key: "tienda",
        label: "Tienda",
        icon: "pi pi-shop",
        desc: "Identidad, horarios, moneda, configuración base.",
      },
      {
        key: "promociones",
        label: "Promociones",
        icon: "pi pi-tags",
        desc: "Cupones, reglas, descuentos por volumen.",
      },
      {
        key: "usuarios",
        label: "Usuarios",
        icon: "pi pi-users",
        desc: "Roles, permisos, accesos y auditoría.",
      },
      {
        key: "roles",
        label: "Roles",
        icon: "pi pi-sitemap",
        desc: "Crea roles y define permisos default.",
      },
    ],
  },
  {
    group: "Finanzas",
    items: [
      {
        key: "impuestos",
        label: "Impuestos",
        icon: "pi pi-percentage",
        desc: "IVA, redondeos, reglas fiscales.",
      },
      {
        key: "pagos",
        label: "Pagos / Terminal",
        icon: "pi pi-credit-card",
        desc: "Métodos, comisiones, bancos, TPV.",
      },
    ],
  },
  {
    group: "Sistema",
    items: [
      {
        key: "notificaciones",
        label: "Notificaciones",
        icon: "pi pi-bell",
        desc: "Alertas, correo/WhatsApp, reglas.",
      },
      {
        key: "apariencia",
        label: "Apariencia",
        icon: "pi pi-palette",
        desc: "Ticket, logo, formatos, textos.",
      },
      {
        key: "auditoria",
        label: "Auditoría",
        icon: "pi pi-shield",
        desc: "Actividad, cambios, bitácora.",
      },
      {
        key: "integraciones",
        label: "Integraciones",
        icon: "pi pi-link",
        desc: "Webhooks, API keys, conectores.",
      },
      {
        key: "exportar",
        label: "Exportar / Respaldo",
        icon: "pi pi-download",
        desc: "CSV/Excel, backups, migraciones.",
      },
    ],
  },
];

const ALL_TABS = SECTIONS.flatMap((s) => s.items);

export default function Ajustes() {
  const [active, setActive] = useState("tienda");
  const [q, setQ] = useState("");
  const [spinning, setSpinning] = useState(false);

  const tiendaRef = useRef(null);
  const promosRef = useRef(null);
  const usuariosRef = useRef(null);
  const exportarRef = useRef(null);
  const rolesRef = useRef(null);

  const onRefreshClick = async (e) => {
    if (spinning) return;
    e.currentTarget.blur();
    setSpinning(true);

    try {
      const target =
        active === "tienda"
          ? tiendaRef.current
          : active === "promociones"
          ? promosRef.current
          : active === "usuarios"
          ? usuariosRef.current
          : active === "exportar"
          ? exportarRef.current
          : active === "roles"
          ? rolesRef.current
          : null;

      await target?.refresh?.();
    } catch (err) {
      console.error(err);
    }
  };

  const onSpinEnd = (e) => {
    if (e.animationName !== "ajx-refresh-spin") return;
    setSpinning(false);
  };

  const filteredSections = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return SECTIONS;

    return SECTIONS.map((sec) => {
      const items = sec.items.filter((t) =>
        (t.label + " " + t.desc).toLowerCase().includes(qq)
      );
      return { ...sec, items };
    }).filter((sec) => sec.items.length > 0);
  }, [q]);

  const filteredTabsFlat = useMemo(
    () => filteredSections.flatMap((s) => s.items),
    [filteredSections]
  );

  const activeTab = useMemo(
    () => ALL_TABS.find((t) => t.key === active) || ALL_TABS[0],
    [active]
  );

  useEffect(() => {
    if (!q.trim()) return;
    const exists = filteredTabsFlat.some((t) => t.key === active);
    if (!exists && filteredTabsFlat.length) setActive(filteredTabsFlat[0].key);
  }, [q, filteredTabsFlat, active]);

  const renderContent = () => {
    switch (active) {
      case "tienda":
        return <StoreConfigForm ref={tiendaRef} />;

      case "promociones":
        return <Promociones ref={promosRef} />;

      case "usuarios":
        return <AjustesUsuarios ref={usuariosRef} />;

      case "roles":
        return <AjustesRoles ref={rolesRef} />;

      case "exportar":
        return <ExportarDatos ref={exportarRef} />;

      case "impuestos":
        return (
          <div className="ajx-placeholder">
            <div className="ajx-ph-title">Impuestos</div>
            <div className="ajx-ph-sub">
              Aquí van reglas fiscales, IVA, redondeo, etc.
            </div>
          </div>
        );
      case "pagos":
        return (
          <div className="ajx-placeholder">
            <div className="ajx-ph-title">Pagos / Terminal</div>
            <div className="ajx-ph-sub">
              Métodos de pago, comisiones, cuentas, TPV.
            </div>
          </div>
        );
      case "notificaciones":
        return (
          <div className="ajx-placeholder">
            <div className="ajx-ph-title">Notificaciones</div>
            <div className="ajx-ph-sub">
              Alertas, canales y reglas (stock bajo, ventas, cortes).
            </div>
          </div>
        );
      case "apariencia":
        return (
          <div className="ajx-placeholder">
            <div className="ajx-ph-title">Apariencia</div>
            <div className="ajx-ph-sub">
              Ticket: logo, textos, formatos, colores.
            </div>
          </div>
        );
      case "auditoria":
        return (
          <div className="ajx-placeholder">
            <div className="ajx-ph-title">Auditoría</div>
            <div className="ajx-ph-sub">
              Bitácora de cambios y actividad por usuario.
            </div>
          </div>
        );
      case "integraciones":
        return (
          <div className="ajx-placeholder">
            <div className="ajx-ph-title">Integraciones</div>
            <div className="ajx-ph-sub">
              API keys, webhooks, conectores externos.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Shell>
      <div className="ajx-page">
        <div className="ajx-header">
          <div className="ajx-title">
            <i className="pi pi-cog ajx-gear" /> AJUSTES
          </div>
          <div className="ajx-header-right">
            <span className="ajx-search">
              <i className="pi pi-search" />
              <InputText
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar sección…"
                aria-label="Buscar sección"
              />
            </span>
          </div>
        </div>

        <div className="ajx-layout">
          <aside className="ajx-rail">
            <div className="ajx-rail-head">
              SECCIONES
              <div className="ajx-rail-head-visible">
                {filteredTabsFlat.length} VISIBLES
              </div>
            </div>

            <div className="ajx-nav-wrap">
              <nav className="ajx-nav">
                {filteredSections.map((sec) => (
                  <div key={sec.group}>
                    <div className="ajx-group">{sec.group}</div>

                    {sec.items.map((it) => (
                      <button
                        key={it.key}
                        className={`ajx-nav-item ${
                          active === it.key ? "is-active" : ""
                        }`}
                        onClick={() => setActive(it.key)}
                        type="button"
                      >
                        <span className="ajx-nav-icon">
                          <i className={it.icon} />
                        </span>

                        <span className="ajx-nav-text">
                          <span className="ajx-nav-label">{it.label}</span>
                          <span className="ajx-nav-desc">{it.desc}</span>
                        </span>

                        <span className="ajx-nav-chevron">
                          <i className="pi pi-angle-right" />
                        </span>
                      </button>
                    ))}
                  </div>
                ))}

                {!filteredTabsFlat.length && (
                  <div className="ajx-empty">
                    <i className="pi pi-search" />
                    <div>
                      <div className="ajx-emptyTitle">Sin resultados</div>
                      <div className="ajx-emptySub">Prueba otra palabra.</div>
                    </div>
                  </div>
                )}
              </nav>
            </div>

            <Divider className="ajx-divider" />

            <div className="ajx-rail-foot">
              <div className="ajx-rail-foot-title">Acciones rápidas</div>

              <div className="ajx-rail-foot-grid">
                <Button
                  icon="pi pi-shield"
                  label="Usuarios"
                  className="ajx-foot-btn"
                  onClick={() => setActive("usuarios")}
                />
                <Button
                  icon="pi pi-download"
                  label="Respaldo"
                  className="ajx-foot-btn ajx-footBtn--primary"
                  onClick={() => setActive("exportar")}
                />
                <Button
                  icon="pi pi-credit-card"
                  label="Pagos"
                  className="ajx-foot-btn"
                  onClick={() => setActive("pagos")}
                />
                <Button
                  icon="pi pi-bell"
                  label="Alertas"
                  className="ajx-foot-btn"
                  onClick={() => setActive("notificaciones")}
                />
              </div>
            </div>
          </aside>

          <main className="ajx-content">
            <div className="ajx-content-head">
              <div className="ajx-content-left">
                <span className="ajx-chip">
                  <i className={activeTab.icon} />
                  {activeTab.label}
                </span>
                <div className="ajx-content-desc">{activeTab.desc}</div>
              </div>

              <div className="ajx-content-actions">
                <Button
                  icon="pi pi-refresh"
                  className={`ajx-icon-btn ${spinning ? "is-spinning" : ""}`}
                  onClick={onRefreshClick}
                  tooltip="Refrescar"
                  tooltipOptions={{ position: "top" }}
                  type="button"
                  aria-busy={spinning}
                  pt={{ icon: { onAnimationEnd: onSpinEnd } }}
                />
              </div>
            </div>
            <div className="ajx-surface">{renderContent()}</div>
          </main>
        </div>
      </div>
    </Shell>
  );
}
