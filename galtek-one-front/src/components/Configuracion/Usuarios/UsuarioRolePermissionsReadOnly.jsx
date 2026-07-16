import React from "react";
import { groupPermissions } from "./usuariosUtils";

export default function UsuarioRolePermissionsReadOnly({ role }) {
  const permisos = role?.permisos || [];
  const grouped = groupPermissions(permisos);
  const modules = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "es"));

  return (
    <section className="au-permissions-card">
      <div className="au-card-head">
        <div>
          <h3>Permisos heredados</h3>
          <p>{role?.nombreRol || "Selecciona un rol"}</p>
        </div>
        <span className="au-count-pill">{permisos.length}</span>
      </div>

      {!role ? (
        <div className="au-inline-empty">
          <i className="pi pi-lock" />
          <span>Selecciona un rol para ver permisos heredados.</span>
        </div>
      ) : !permisos.length ? (
        <div className="au-inline-empty">
          <i className="pi pi-info-circle" />
          <span>Este rol no tiene permisos asociados.</span>
        </div>
      ) : (
        <div className="au-permission-groups">
          {modules.map((module) => (
            <article className="au-permission-group" key={module}>
              <header>
                <strong>{module}</strong>
                <span>{grouped[module].length}</span>
              </header>
              <p>{grouped[module].map((permission) => permission.nombre || permission.clave).join(", ")}</p>
            </article>
          ))}
        </div>
      )}

      <div className="au-readonly-note">
        <i className="pi pi-shield" />
        <span>Usuarios solo asigna rol. Los cambios de permisos van en Roles u Overrides.</span>
      </div>
    </section>
  );
}
