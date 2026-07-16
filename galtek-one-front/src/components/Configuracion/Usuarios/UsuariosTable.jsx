import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { getRoleName, initialsFromName, isCurrentSessionUser } from "./usuariosUtils";

const ROW_OPTIONS = [5, 10, 15];

function UserAvatar({ user }) {
  return (
    <span className="au-avatar-mini" aria-hidden="true">
      {user.imagen ? (
        <img src={user.imagen} alt="" onError={(event) => event.currentTarget.remove()} />
      ) : (
        initialsFromName(user.nombreUsuario, user.usuario?.slice(0, 2) || "US")
      )}
    </span>
  );
}

function LoadingRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index}>
      <td>
        <div className="au-table-user">
          <Skeleton shape="circle" width="2.2rem" height="2.2rem" />
          <div>
            <Skeleton width="9rem" height="0.9rem" />
            <Skeleton width="6rem" height="0.75rem" />
          </div>
        </div>
      </td>
      <td>
        <Skeleton width="5rem" height="1rem" />
      </td>
      <td>
        <Skeleton width="7rem" height="1rem" />
      </td>
      <td>
        <Skeleton width="10rem" height="1rem" />
      </td>
      <td>
        <Skeleton width="4.5rem" height="1.4rem" />
      </td>
      <td>
        <Skeleton width="7rem" height="2rem" />
      </td>
    </tr>
  ));
}

export default function UsuariosTable({
  users,
  roles,
  loading,
  error,
  selectedId,
  onView,
  onRetry,
  onEdit,
  onPassword,
  onToggleStatus,
  canResetPasswords,
}) {
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(users.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const first = users.length ? (safePage - 1) * rowsPerPage : 0;
  const last = Math.min(first + rowsPerPage, users.length);
  const visibleUsers = useMemo(
    () => users.slice(first, last),
    [first, last, users]
  );
  const pageNumbers = useMemo(() => {
    const visibleCount = Math.min(3, totalPages);
    let start = Math.max(1, safePage - 1);
    let end = Math.min(totalPages, start + visibleCount - 1);

    start = Math.max(1, end - visibleCount + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safePage, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [users.length, rowsPerPage]);

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
      <section className="au-table-shell">
        <div className="au-error-state">
          <i className="pi pi-exclamation-triangle" />
          <strong>No se pudo cargar usuarios</strong>
          <span>{error}</span>
          <Button label="Reintentar" icon="pi pi-refresh" className="au-soft-btn" onClick={onRetry} />
        </div>
      </section>
    );
  }

  const hasUsers = users.length > 0;
  const pageReport = hasUsers ? `${first + 1}-${last} de ${users.length}` : "0 de 0";

  return (
    <section className="au-table-shell">
      <div className="au-table-head">
        <div>
          <strong>Usuarios del sistema</strong>
          <span>{loading ? "Actualizando..." : `${users.length} usuarios visibles`}</span>
        </div>
      </div>

      <div className="au-table-scroll">
        <table className="au-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Login</th>
              <th>Rol</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && !hasUsers ? (
              <LoadingRows />
            ) : (
              visibleUsers.map((user) => {
                const selected = user.idUsuario === selectedId;
                const current = isCurrentSessionUser(user);
                const roleName = getRoleName(roles, user.idRol, user.rolNombre || "Sin rol");

                return (
                  <tr key={user.idUsuario} className={selected ? "is-selected" : ""}>
                    <td>
                      <div className="au-table-user">
                        <UserAvatar user={user} />
                        <div>
                          <strong>{user.nombreUsuario || "Sin nombre"}</strong>
                          <span>{current ? "Sesion actual" : user.correo || "Sin correo"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="au-mono">@{user.usuario || "-"}</span>
                    </td>
                    <td>
                      <span className={`au-chip ${user.idRol ? "" : "is-muted"}`}>{roleName}</span>
                    </td>
                    <td>
                      <div className="au-contact-cell">
                        <span>{user.telefono || "Sin telefono"}</span>
                        <small>{user.correo || "Sin correo"}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`au-status-tag ${user.activo ? "is-on" : "is-off"}`}>
                        {user.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="au-row-actions">
                        <Button
                          icon="pi pi-eye"
                          className="au-row-action"
                          tooltip="Ver detalle"
                          tooltipOptions={{ position: "top" }}
                          aria-label="Ver detalle"
                          onClick={() => onView(user)}
                          disabled={loading}
                        />
                        <Button
                          icon="pi pi-pencil"
                          className="au-row-action"
                          tooltip="Editar"
                          tooltipOptions={{ position: "top" }}
                          aria-label="Editar usuario"
                          onClick={() => onEdit(user)}
                          disabled={loading}
                        />
                        <Button
                          icon="pi pi-key"
                          className="au-row-action"
                          tooltip="Administrar password"
                          tooltipOptions={{ position: "top" }}
                          aria-label="Administrar password"
                          onClick={() => onPassword(user)}
                          disabled={loading || !canResetPasswords}
                        />
                        <Button
                          icon={user.activo ? "pi pi-ban" : "pi pi-check-circle"}
                          className="au-row-action au-row-action-state"
                          tooltip={user.activo ? "Desactivar" : "Reactivar"}
                          tooltipOptions={{ position: "top" }}
                          aria-label={user.activo ? "Desactivar usuario" : "Reactivar usuario"}
                          onClick={() => onToggleStatus(user)}
                          disabled={loading || current}
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

      {!loading && !hasUsers ? (
        <div className="au-empty-state">
          <i className="pi pi-users" />
          <strong>Sin usuarios para mostrar</strong>
          <span>Ajusta la busqueda o agrega una cuenta nueva.</span>
        </div>
      ) : null}

      {hasUsers ? (
        <footer className="au-table-footer">
          <div className={`au-page-size ${pageSizeOpen ? "is-open" : ""}`} ref={pageSizeRef}>
            <button
              type="button"
              className="au-page-size-control"
              onClick={() => setPageSizeOpen((value) => !value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setPageSizeOpen(false);
              }}
              aria-label="Usuarios por pagina"
              aria-haspopup="listbox"
              aria-expanded={pageSizeOpen}
            >
              <span>{rowsPerPage}</span>
              <i className="pi pi-chevron-down" aria-hidden="true" />
            </button>

            {pageSizeOpen ? (
              <div className="au-page-size-menu" role="listbox" aria-label="Usuarios por pagina">
                {ROW_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={option === rowsPerPage}
                    className={`au-page-size-option ${
                      option === rowsPerPage ? "is-selected" : ""
                    }`}
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

          <div className="au-pager" aria-label="Paginacion de usuarios">
            <Button
              icon="pi pi-angle-double-left"
              className="au-page-btn"
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
              aria-label="Primera pagina"
            />
            <Button
              icon="pi pi-angle-left"
              className="au-page-btn"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={safePage <= 1}
              aria-label="Pagina anterior"
            />
            {pageNumbers.map((pageNumber) => (
              <Button
                key={pageNumber}
                label={String(pageNumber)}
                className={`au-page-btn au-page-number ${
                  pageNumber === safePage ? "is-current" : ""
                }`}
                onClick={() => setPage(pageNumber)}
                aria-current={pageNumber === safePage ? "page" : undefined}
                aria-label={`Pagina ${pageNumber}`}
              />
              ))}
            <Button
              icon="pi pi-angle-right"
              className="au-page-btn"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={safePage >= totalPages}
              aria-label="Pagina siguiente"
            />
            <Button
              icon="pi pi-angle-double-right"
              className="au-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              aria-label="Ultima pagina"
            />
          </div>

          <span className="au-page-report">{pageReport}</span>
        </footer>
      ) : null}
    </section>
  );
}
