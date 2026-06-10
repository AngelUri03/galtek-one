import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { Avatar } from "primereact/avatar";
import { Menu } from "primereact/menu";
import { ConfirmPopup } from "primereact/confirmpopup";
import { useAuth } from "../../auth/AuthContext";
import "../../style/components/common/UserProfileMenu.css";

import CambiarPerfil from "./CambiarPerfil";

function resolveAvatarImage(avatarB64) {
  if (!avatarB64) return null;
  return `data:image/png;base64,${avatarB64}`;
}

export default function UserProfileMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const logoutBtnRef = useRef(null);

  const lastAlignEventRef = useRef(null);

  const [cpVisible, setCpVisible] = useState(false);
  const [cpTarget, setCpTarget] = useState(null);
  const [openSelPerfil, setOpenSelPerfil] = useState(false);

  const go = (path) => navigate(path, { replace: false });

  const askLogout = (e) => {
    setCpTarget(e.currentTarget || logoutBtnRef.current);
    setCpVisible(true);
  };

  const userName = user?.nombreUsuario || user?.usuario || "Usuario";
  const userRole = user?.rol || "Empleado";
  const empresaNombre = user?.nombreEmpresa || null;

  const avatarImage = resolveAvatarImage(user?.avatarUrl);
  const hasAvatar = Boolean(user?.avatarUrl);

  const realignPanel = (ev = null) => {
    const panel = panelRef.current;
    if (!panel) return;

    const el = panel.getElement?.();
    if (!el) return;

    const isVisible = el.offsetParent !== null;
    if (!isVisible) return;

    const eventToUse =
      ev ||
      lastAlignEventRef.current ||
      { currentTarget: triggerRef.current };

    requestAnimationFrame(() => {
      try {
        panel.align?.(eventToUse);
      } catch {
        el.style.left = el.style.left;
      }
    });
  };

  const handleToggle = (e) => {
    lastAlignEventRef.current = e;

    panelRef.current?.toggle(e);

    requestAnimationFrame(() => realignPanel(e));
  };

  const headerTemplate = useMemo(
    () => (
      <div className="upm-header">
        <div className="upm-avatar-wrap">
          {hasAvatar ? (
            <Avatar
              image={avatarImage}
              shape="circle"
              size="large"
              className="upm-avatar"
            />
          ) : (
            <Avatar
              icon="pi pi-user"
              shape="circle"
              size="large"
              className="upm-avatar upm-avatar-fallback"
            />
          )}
        </div>

        <div className="upm-header-info">
          <div className="upm-username" title={userName} aria-label={userName}>
            {userName}
          </div>

          <small className="upm-role">{userRole}</small>

          {empresaNombre ? (
            <div
              className="upm-company"
              title={empresaNombre}
              aria-label={empresaNombre}
            >
              <i className="pi pi-building upm-company-icon" />
              <span className="upm-company-name">{empresaNombre}</span>
            </div>
          ) : null}
        </div>
      </div>
    ),
    [hasAvatar, avatarImage, userName, userRole, empresaNombre]
  );

  const menuModel = useMemo(
    () => [
      {
        template: () => headerTemplate,
        className: "pointer-events-none select-none",
      },
      { separator: true },
      {
        label: "Cuenta",
        items: [
          {
            label: "Cambiar perfil",
            icon: "pi pi-user-edit",
            command: () => {
              panelRef.current?.hide();
              setOpenSelPerfil(true);
            },
          },
        ],
      },
      {
        label: "Configuración",
        items: [
          {
            label: "Configuración de la tienda",
            icon: "pi pi-cog",
            command: () => go("/ajustes"),
          },
          {
            label: "Soporte",
            icon: "pi pi-headphones",
            command: () => go("/soporte"),
          },
        ],
      },
      { separator: true },
    ],
    [go, headerTemplate]
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      const overlay = panelRef.current?.getElement?.();
      const popup = document.querySelector(".p-confirm-popup");

      if (overlay && !overlay.contains(e.target) && popup && !popup.contains(e.target)) {
        setCpVisible(false);
        panelRef.current?.hide();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const realign = () => realignPanel();

    window.addEventListener("resize", realign);

    const ro = new ResizeObserver(() => realign());
    ro.observe(document.documentElement);

    return () => {
      window.removeEventListener("resize", realign);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="user-profile-menu">
      <Button
        ref={triggerRef}
        type="button"
        className="upm-trigger"
        aria-label="Menú de usuario"
        onClick={handleToggle}
      >
        {hasAvatar ? (
          <Avatar
            image={avatarImage}
            shape="circle"
            size="large"
            className="upm-avatar"
          />
        ) : (
          <Avatar
            icon="pi pi-user"
            shape="circle"
            size="large"
            className="upm-avatar upm-avatar-fallback"
          />
        )}
      </Button>

      <OverlayPanel
        ref={panelRef}
        dismissable
        showCloseIcon={false}
        className="upm-panel"
        onShow={(e) => {
          const ev = e?.originalEvent || e || lastAlignEventRef.current;
          requestAnimationFrame(() => realignPanel(ev));
        }}
        onHide={() => {
          const el = panelRef.current?.getElement?.();
          if (el) {
            el.style.left = "";
            el.style.top = "";
          }
          setCpVisible(false);
        }}
      >
        <div className="upm-panel-content">
          <Menu model={menuModel} className="upm-menu" />

          <div className="upm-footer">
            <Button
              ref={logoutBtnRef}
              label="Cerrar sesión"
              icon="pi pi-sign-out"
              className="p-button-danger upm-logout-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={askLogout}
            />
          </div>

          <ConfirmPopup
            target={cpTarget}
            visible={cpVisible}
            onHide={() => setCpVisible(false)}
            message="¿Seguro que quieres cerrar sesión?"
            icon="pi pi-sign-out"
            acceptLabel="Sí, salir"
            rejectLabel="Cancelar"
            acceptClassName="p-button-danger"
            rejectClassName="p-button-text"
            className="upm-confirmpopup"
            accept={async () => {
              setCpVisible(false);
              panelRef.current?.hide();
              await logout();
              navigate("/login", { replace: true });
            }}
            reject={() => setCpVisible(false)}
          />
        </div>
      </OverlayPanel>

      <CambiarPerfil
        visible={openSelPerfil}
        onHide={() => setOpenSelPerfil(false)}
        onSuccess={() => setOpenSelPerfil(false)}
      />
    </div>
  );
}