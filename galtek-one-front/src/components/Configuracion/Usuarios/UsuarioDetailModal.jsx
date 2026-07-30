import React from "react";
import { Dialog } from "primereact/dialog";
import { getRoleName, groupPermissions, initialsFromName } from "./usuariosUtils";

function DetailItem({ label, value }) {
  return (
    <div className="au-detail-item">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

export default function UsuarioDetailModal({ visible, user, role, roles, onHide }) {
  const permisos = role?.permisos || [];
  const grouped = groupPermissions(permisos);
  const modules = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "es"));

  return (
    <Dialog
      header="Detalle de usuario"
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      dismissableMask
      className="au-dialog au-view-dialog"
      style={{ width: "58rem" }}
    >
      <div className="au-view-body">
        <section className="au-view-hero">
          <span className="au-avatar-large">
            {user?.imagen ? (
              <img src={user.imagen} alt="Avatar" />
            ) : (
              initialsFromName(user?.nombreUsuario, user?.usuario?.slice(0, 2) || "US")
            )}
          </span>
          <div>
            <span className="au-section-kicker">Cuenta</span>
            <h3>{user?.nombreUsuario || "Sin nombre"}</h3>
            <p>@{user?.usuario || "-"}</p>
          </div>
          <span className={`au-status-tag ${user?.activo ? "is-on" : "is-off"}`}>
            {user?.activo ? "Activo" : "Inactivo"}
          </span>
        </section>

        <section className="au-detail-grid">
          <DetailItem label="Rol" value={getRoleName(roles, user?.idRol, user?.rolNombre || "Sin rol")} />
          <DetailItem label="Correo" value={user?.correo || "Sin correo"} />
          <DetailItem label="Telefono" value={user?.telefono || "Sin telefono"} />
          <DetailItem label="Login" value={user?.usuario ? `@${user.usuario}` : "-"} />
        </section>

        <section className="au-view-permissions">
          <div className="au-card-head">
            <div>
              <h3>Permisos heredados</h3>
              <p>{role?.nombreRol || "Sin rol asignado"}</p>
            </div>
            <span className="au-count-pill">{permisos.length}</span>
          </div>

          {!role ? (
            <div className="au-inline-empty">
              <i className="pi pi-lock" />
              <span>Este usuario no tiene rol asignado.</span>
            </div>
          ) : !modules.length ? (
            <div className="au-inline-empty">
              <i className="pi pi-info-circle" />
              <span>El rol no tiene permisos asociados.</span>
            </div>
          ) : (
            <div className="au-view-module-grid">
              {modules.map((module) => (
                <article className="au-view-module" key={module}>
                  <strong>{module}</strong>
                  <span>{grouped[module].length} permisos</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Dialog>
  );
}
