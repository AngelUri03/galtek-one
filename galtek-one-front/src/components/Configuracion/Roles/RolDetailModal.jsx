import React, { useMemo } from "react";
import { Dialog } from "primereact/dialog";
import {
  MODULE_ICON,
  groupPermissions,
  isProtectedRole,
  moduleNamesFromRole,
} from "./rolesUtils";

function DetailItem({ label, value }) {
  return (
    <div className="ar-detail-item">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

export default function RolDetailModal({ visible, role, onHide }) {
  const protectedRole = isProtectedRole(role);
  const groups = useMemo(() => groupPermissions(role?.permisos || []), [role?.permisos]);
  const modules = moduleNamesFromRole(role);

  return (
    <Dialog
      header="Detalle del rol"
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      dismissableMask
      className="ar-dialog ar-detail-dialog"
      style={{ width: "58rem", maxWidth: "94vw" }}
    >
      <div className="ar-detail-body">
        <section className="ar-modal-hero">
          <span className="ar-editor-icon">
            <i className={protectedRole ? "pi pi-shield" : "pi pi-sitemap"} />
          </span>
          <div>
            <span className="ar-section-kicker">{protectedRole ? "Rol protegido" : "Rol editable"}</span>
            <strong>{role?.nombreRol || "Sin nombre"}</strong>
            <small>{modules.length ? modules.join(", ") : "Sin modulos asignados"}</small>
          </div>
          <span className={`ar-status-tag ${role?.activo ? "is-on" : "is-off"}`}>
            {role?.activo ? "Activo" : "Inactivo"}
          </span>
        </section>

        <section className="ar-detail-grid">
          <DetailItem label="Tipo" value={protectedRole ? "Protegido" : "Editable"} />
          <DetailItem label="Estado" value={role?.activo ? "Activo" : "Inactivo"} />
          <DetailItem label="Permisos asignados" value={String(role?.permisos?.length || 0)} />
          <DetailItem label="Modulos con acceso" value={String(modules.length)} />
        </section>

        {protectedRole ? (
          <div className="ar-protected-note">
            <i className="pi pi-shield" />
            <span>El rol Administrador es critico para el sistema. Sus permisos no pueden modificarse.</span>
          </div>
        ) : null}

        <section className="ar-view-permissions">
          <div className="ar-card-head">
            <div>
              <span className="ar-section-kicker">Permisos</span>
              <h3>Modulos con acceso</h3>
              <p>{role?.permisos?.length || 0} permisos asignados</p>
            </div>
          </div>

          {!groups.length ? (
            <div className="ar-inline-empty">
              <i className="pi pi-lock" />
              <strong>Sin permisos asignados</strong>
              <span>Este rol no tiene accesos operativos.</span>
            </div>
          ) : (
            <div className="ar-view-module-grid">
              {groups.map((group) => (
                <article className="ar-view-module" key={group.module}>
                  <i className={MODULE_ICON[group.module] || "pi pi-folder"} />
                  <div>
                    <strong>{group.module}</strong>
                    <span>{group.items.length} permisos</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Dialog>
  );
}
