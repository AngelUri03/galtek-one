import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import {
  MODULE_ICON,
  ROLE_ROW_OPTIONS,
  describeRoleModules,
  isProtectedRole,
  moduleNamesFromRole,
} from "./rolesUtils";

function RoleAvatar({ role }) {
  const name = String(role?.nombreRol || "RO");
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return <span className="ar-role-avatar">{initials || "RO"}</span>;
}

function LoadingRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index}>
      <td>
        <div className="ar-table-role">
          <Skeleton shape="circle" width="2.2rem" height="2.2rem" />
          <div>
            <Skeleton width="8rem" height="0.9rem" />
            <Skeleton width="6rem" height="0.75rem" />
          </div>
        </div>
      </td>
      <td>
        <Skeleton width="4.5rem" height="1.35rem" />
      </td>
      <td>
        <Skeleton width="4.5rem" height="1.35rem" />
      </td>
      <td>
        <Skeleton width="4rem" height="1.35rem" />
      </td>
      <td>
        <Skeleton width="11rem" height="1rem" />
      </td>
      <td>
        <Skeleton width="7rem" height="2rem" />
      </td>
    </tr>
  ));
}

function ModuleChips({ modules }) {
  if (!modules.length) return <span className="ar-muted">Sin modulos</span>;

  const visible = modules.slice(0, 3);
  const hidden = modules.slice(3);

  return (
    <div className="ar-module-stack" title={modules.join(", ")}>
      {visible.map((module) => (
        <span className="ar-module-pill" key={module}>
          <i className={MODULE_ICON[module] || "pi pi-folder"} />
          <span>{module}</span>
        </span>
      ))}
      {hidden.length ? (
        <span
          className="ar-module-more"
          title={hidden.join(", ")}
          aria-label={`Modulos adicionales: ${hidden.join(", ")}`}
        >
          +{hidden.length}
        </span>
      ) : null}
    </div>
  );
}

export default function RolesTable({
  roles,
  loading,
  error,
  selectedId,
  onRetry,
  onView,
  onEdit,
  onPermissions,
  onToggleStatus,
  onDelete,
}) {
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(roles.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const first = roles.length ? (safePage - 1) * rowsPerPage : 0;
  const last = Math.min(first + rowsPerPage, roles.length);
  const visibleRoles = useMemo(() => roles.slice(first, last), [first, last, roles]);
  const pageNumbers = useMemo(() => {
    const visibleCount = Math.min(3, totalPages);
    let start = Math.max(1, safePage - 1);
    let end = Math.min(totalPages, start + visibleCount - 1);
    start = Math.max(1, end - visibleCount + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safePage, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [roles.length, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    const closePageSize = (event) => {
      if (!pageSizeRef.current?.contains(event.target)) {
        setPageSizeOpen(false);
      }
    };

    document.addEventListener("mousedown", closePageSize);
    return () => document.removeEventListener("mousedown", closePageSize);
  }, []);

  if (error) {
    return (
      <section className="ar-table-shell">
        <div className="ar-error-state">
          <i className="pi pi-exclamation-triangle" />
          <strong>No se pudo cargar roles</strong>
          <span>{error}</span>
          <Button label="Reintentar" icon="pi pi-refresh" className="ar-soft-btn" onClick={onRetry} />
        </div>
      </section>
    );
  }

  const hasRoles = roles.length > 0;
  const pageReport = hasRoles ? `${first + 1}-${last} de ${roles.length}` : "0 de 0";

  return (
    <section className="ar-table-shell">
      <div className="ar-table-head">
        <div>
          <strong>Roles del sistema</strong>
          <span>{loading ? "Actualizando..." : `${roles.length} roles visibles`}</span>
        </div>
      </div>

      <div className="ar-table-scroll">
        <table className="ar-table">
          <thead>
            <tr>
              <th>Rol</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Permisos</th>
              <th>Modulos con acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && !hasRoles ? (
              <LoadingRows />
            ) : (
              visibleRoles.map((role) => {
                const selected = Number(role.idRol) === Number(selectedId);
                const protectedRole = isProtectedRole(role);
                const modules = moduleNamesFromRole(role);
                const rowClassName = [
                  selected ? "is-selected" : "",
                  protectedRole ? "is-protected" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr key={role.idRol} className={rowClassName}>
                    <td>
                      <div className="ar-table-role">
                        <RoleAvatar role={role} />
                        <div>
                          <strong>{role.nombreRol || "Sin nombre"}</strong>
                          <span>{describeRoleModules(role)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`ar-type-tag ${protectedRole ? "is-protected" : "is-editable"}`}>
                        {protectedRole ? "Protegido" : "Editable"}
                      </span>
                    </td>
                    <td>
                      <span className={`ar-status-tag ${role.activo ? "is-on" : "is-off"}`}>
                        {role.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <span className={`ar-chip ${(role.permisos?.length || 0) ? "" : "is-muted"}`}>
                        {role.permisos?.length || 0}
                      </span>
                    </td>
                    <td>
                      <ModuleChips modules={modules} />
                    </td>
                    <td>
                      <div className="ar-row-actions">
                        <Button
                          icon="pi pi-eye"
                          className="ar-row-action"
                          tooltip="Ver detalle"
                          tooltipOptions={{ position: "top" }}
                          aria-label="Ver detalle del rol"
                          onClick={() => onView(role)}
                          disabled={loading}
                        />
                        <Button
                          icon="pi pi-pencil"
                          className={`ar-row-action ${protectedRole ? "is-locked" : ""}`}
                          tooltip={protectedRole ? "Rol protegido: solo consulta" : "Editar rol"}
                          tooltipOptions={{ position: "top" }}
                          aria-label="Editar rol"
                          onClick={() => onEdit(role)}
                          disabled={loading}
                        />
                        <Button
                          icon="pi pi-lock"
                          className="ar-row-action"
                          tooltip={protectedRole ? "Ver permisos del rol protegido" : "Gestionar permisos"}
                          tooltipOptions={{ position: "top" }}
                          aria-label={protectedRole ? "Ver permisos" : "Gestionar permisos"}
                          onClick={() => onPermissions(role)}
                          disabled={loading}
                        />
                        <Button
                          icon={role.activo ? "pi pi-ban" : "pi pi-check-circle"}
                          className={`ar-row-action ${protectedRole ? "is-locked" : ""}`}
                          tooltip={
                            protectedRole
                              ? "No puedes desactivar el rol Administrador"
                              : role.activo
                                ? "Desactivar"
                                : "Reactivar"
                          }
                          tooltipOptions={{ position: "top" }}
                          aria-label={role.activo ? "Desactivar rol" : "Reactivar rol"}
                          onClick={() => onToggleStatus(role)}
                          disabled={loading}
                        />
                        <Button
                          icon="pi pi-trash"
                          className={`ar-row-action ar-row-action-danger ${protectedRole ? "is-locked" : ""}`}
                          tooltip={protectedRole ? "No puedes eliminar el rol Administrador" : "Eliminar"}
                          tooltipOptions={{ position: "top" }}
                          aria-label="Eliminar rol"
                          onClick={() => onDelete(role)}
                          disabled={loading}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && !hasRoles ? (
        <div className="ar-empty-state">
          <i className="pi pi-sitemap" />
          <strong>Sin roles para mostrar</strong>
          <span>Ajusta la busqueda o agrega un rol base.</span>
        </div>
      ) : null}

      {hasRoles ? (
        <footer className="ar-table-footer">
          <div className={`ar-page-size ${pageSizeOpen ? "is-open" : ""}`} ref={pageSizeRef}>
            <button
              type="button"
              className="ar-page-size-control"
              onClick={() => setPageSizeOpen((value) => !value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setPageSizeOpen(false);
              }}
              aria-label="Roles por pagina"
              aria-haspopup="listbox"
              aria-expanded={pageSizeOpen}
            >
              <span>{rowsPerPage}</span>
              <i className="pi pi-chevron-down" aria-hidden="true" />
            </button>

            {pageSizeOpen ? (
              <div className="ar-page-size-menu" role="listbox" aria-label="Roles por pagina">
                {ROLE_ROW_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={option === rowsPerPage}
                    className={`ar-page-size-option ${option === rowsPerPage ? "is-selected" : ""}`}
                    onClick={() => {
                      setRowsPerPage(option);
                      setPageSizeOpen(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="ar-pager" aria-label="Paginacion de roles">
            <Button
              icon="pi pi-angle-double-left"
              className="ar-page-btn"
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
              aria-label="Primera pagina"
            />
            <Button
              icon="pi pi-angle-left"
              className="ar-page-btn"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={safePage <= 1}
              aria-label="Pagina anterior"
            />
            {pageNumbers.map((pageNumber) => (
              <Button
                key={pageNumber}
                label={String(pageNumber)}
                className={`ar-page-btn ar-page-number ${pageNumber === safePage ? "is-current" : ""}`}
                onClick={() => setPage(pageNumber)}
                aria-current={pageNumber === safePage ? "page" : undefined}
                aria-label={`Pagina ${pageNumber}`}
              />
            ))}
            <Button
              icon="pi pi-angle-right"
              className="ar-page-btn"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={safePage >= totalPages}
              aria-label="Pagina siguiente"
            />
            <Button
              icon="pi pi-angle-double-right"
              className="ar-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              aria-label="Ultima pagina"
            />
          </div>

          <span className="ar-page-report">{pageReport}</span>
        </footer>
      ) : null}
    </section>
  );
}
