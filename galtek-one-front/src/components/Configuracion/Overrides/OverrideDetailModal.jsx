import React from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Skeleton } from "primereact/skeleton";
import {
  effectLabel,
  riskClass,
  userAvatarContent,
} from "./overridesUtils";

function Avatar({ user }) {
  const initials = userAvatarContent(user);
  const image = user?.imagen || user?.avatarUrl;
  return (
    <span className={`uov-avatar-large ${image ? "has-image" : "has-initials"}`}>
      {image ? (
        <img src={image} alt="Avatar" />
      ) : (
        initials
      )}
    </span>
  );
}

export default function OverrideDetailModal({
  visible,
  user,
  detail,
  loading,
  error,
  onHide,
  onRetry,
}) {
  const overrides = detail?.overridesActivos || [];

  return (
    <Dialog
      header="Overrides existentes"
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      dismissableMask
      className="uov-dialog uov-detail-dialog"
      style={{ width: "54rem", maxWidth: "94vw" }}
    >
      <div className="uov-detail-body">
        <section className="uov-detail-hero">
          <Avatar user={user} />
          <div>
            <span className="uov-section-kicker">
              {user?.rolProtegido ? "Protegido" : "Usuario"}
            </span>
            <h3>{user?.nombreUsuario || "Sin nombre"}</h3>
            <p>@{user?.usuario || "-"} - {user?.nombreRol || "Sin rol"}</p>
          </div>
          <span className={`uov-status-tag ${user?.activo ? "is-on" : "is-off"}`}>
            {user?.activo ? "Activo" : "Inactivo"}
          </span>
        </section>

        <div className="uov-detail-content">
          {loading ? (
            <div className="uov-detail-loading">
              <Skeleton height="5rem" />
              <Skeleton height="9rem" />
            </div>
          ) : error ? (
            <div className="uov-error-state is-compact">
              <i className="pi pi-exclamation-triangle" />
              <strong>No se pudo cargar detalle</strong>
              <span>{error}</span>
              <Button label="Reintentar" icon="pi pi-refresh" className="uov-soft-btn" onClick={() => onRetry(user)} />
            </div>
          ) : overrides.length ? (
            <section className="uov-panel-card uov-detail-overrides-card">
              <div className="uov-card-head">
                <div>
                  <h3>Excepciones guardadas</h3>
                </div>
                <span className="uov-count-pill">{overrides.length}</span>
              </div>

              <div className="uov-active-list">
                {overrides.map((override) => (
                  <article className="uov-active-override is-readonly" key={`${override.idPermiso}-${override.efecto}`}>
                    <div>
                      <strong>{override.nombre || override.clave}</strong>
                      <span>{override.modulo} - {effectLabel(override.efecto)}</span>
                      <small>{override.motivo || "Sin motivo capturado"}</small>
                    </div>
                    <span className={`uov-risk-pill ${riskClass(override.riesgo)}`}>{override.riesgo}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <div className="uov-inline-empty">
              <i className="pi pi-check-circle" />
              <strong>Sin overrides activos</strong>
              <span>Este usuario opera solo con los permisos heredados de su rol.</span>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
