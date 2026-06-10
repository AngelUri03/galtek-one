import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { Badge } from "primereact/badge";
import { Divider } from "primereact/divider";
import "../../style/components/common/NotificationBell.css";

const STORAGE_KEY =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_NOTICES_KEY) ||
  "GaltekOne_notices";

const makeId = (index) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `n-${index}-${Date.now()}`;
};

const normalize = (arr = []) =>
  arr.filter(Boolean).map((n, i) => ({
    id: n?.id ?? makeId(i),
    text: n?.text ?? String(n ?? ""),
    type: ["urgent", "warning", "info"].includes(n?.type) ? n.type : "info",
  }));

export default function NotificationBell() {
  const panelRef = useRef(null);
  const [items, setItems] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? normalize(JSON.parse(raw)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          setItems(normalize(JSON.parse(e.newValue || "[]")));
        } catch {
          setItems([]);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const handler = () => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        setItems(raw ? normalize(JSON.parse(raw)) : []);
      } catch {
        setItems([]);
      }
    };
    window.addEventListener("GaltekOne:noticesUpdated", handler);
    return () => window.removeEventListener("GaltekOne:noticesUpdated", handler);
  }, []);

  const persist = (next) => {
    setItems(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("GaltekOne:noticesUpdated"));
    } catch {}
  };

  const unreadCount = useMemo(() => items.length, [items]);

  const markAllAsRead = () => {
    persist([]);
  };

  const removeOne = (id) => {
    persist(items.filter((n) => n.id !== id));
  };

  return (
    <div className="relative notification-bell">
      <Button
        type="button"
        className={`p-button-text bell-button ${
          unreadCount ? "has-notices" : ""
        }`}
        onClick={(e) => panelRef.current?.toggle(e)}
        aria-label="Notificaciones"
        icon="pi pi-bell"
      />
      {unreadCount > 0 && (
        <Badge value={unreadCount} className="bell-badge" severity="danger" />
      )}

      <OverlayPanel
        ref={panelRef}
        dismissable
        showCloseIcon={false}
        className="bell-panel"
        breakpoints={{ "1200px": "28rem", "992px": "24rem", "768px": "20rem" }}
      >
        <div className="bell-header">
          <div className="bell-title">Notificaciones</div>
          <Button
            className="p-button-text p-button-sm"
            label="Marcar leídas"
            onClick={markAllAsRead}
            disabled={!unreadCount}
          />
        </div>

        <Divider />

        {items.length === 0 ? (
          <div className="bell-empty">Nada por ahora ✨</div>
        ) : (
          <div>
            {items.map((n) => (
              <div key={n.id} className={`bell-row ${n.type}`}>
                <div className="bell-left">
                  <i
                    className={`pi ${
                      n.type === "urgent"
                        ? "pi-times-circle"
                        : n.type === "warning"
                        ? "pi-exclamation-triangle"
                        : "pi-info-circle"
                    } sev-icon ${n.type}`}
                    aria-hidden="true"
                  />
                  <span className="bell-text">{n.text}</span>
                </div>

                <Button
                  type="button"
                  className="p-button-text p-button-sm bell-remove"
                  icon="pi pi-times"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOne(n.id);
                  }}
                  aria-label="Eliminar notificación"
                  tooltip="Eliminar"
                  tooltipOptions={{ position: "right" }}
                />
              </div>
            ))}
          </div>
        )}
      </OverlayPanel>
    </div>
  );
}
