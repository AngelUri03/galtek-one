import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import {
  OVERRIDE_ROW_OPTIONS,
  userAvatarContent,
} from "./overridesUtils";

function UserAvatar({ user }) {
  const initials = userAvatarContent(user);
  const hasImage = Boolean(user?.imagen);
  return (
    <span className={`uov-avatar-mini ${hasImage ? "has-image" : "has-initials"}`} aria-hidden="true">
      {hasImage ? (
        <img src={user.imagen} alt="" onError={(event) => event.currentTarget.remove()} />
      ) : (
        initials
      )}
    </span>
  );
}

function LoadingRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index}>
      <td>
        <div className="uov-table-user">
          <Skeleton shape="circle" width="2.2rem" height="2.2rem" />
          <div>
            <Skeleton width="9rem" height="0.9rem" />
            <Skeleton width="6rem" height="0.75rem" />
          </div>
        </div>
      </td>
      <td><Skeleton width="8rem" height="1.3rem" /></td>
      <td><Skeleton width="5rem" height="1.3rem" /></td>
      <td><Skeleton width="6rem" height="1.3rem" /></td>
      <td><Skeleton width="7rem" height="2rem" /></td>
    </tr>
  ));
}

export default function OverridesUsersTable({
  users,
  loading,
  error,
  selectedId,
  onRetry,
  onSelect,
  onManage,
  onClear,
}) {
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(users.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const first = users.length ? (safePage - 1) * rowsPerPage : 0;
  const last = Math.min(first + rowsPerPage, users.length);
  const visibleUsers = useMemo(() => users.slice(first, last), [first, last, users]);
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
      if (!pageSizeRef.current?.contains(event.target)) setPageSizeOpen(false);
    };

    document.addEventListener("mousedown", closePageSize);
    return () => document.removeEventListener("mousedown", closePageSize);
  }, []);

  if (error) {
    return (
      <section className="uov-table-shell">
        <div className="uov-error-state">
          <i className="pi pi-exclamation-triangle" />
          <strong>No se pudieron cargar overrides</strong>
          <span>{error}</span>
          <Button label="Reintentar" icon="pi pi-refresh" className="uov-soft-btn" onClick={onRetry} />
        </div>
      </section>
    );
  }

  const hasUsers = users.length > 0;
  const pageReport = hasUsers ? `${first + 1}-${last} de ${users.length}` : "0 de 0";

  return (
    <section className="uov-table-shell">
      <div className="uov-table-head">
        <div>
          <strong>Usuarios y excepciones</strong>
          <span>{loading ? "Actualizando..." : `${users.length} usuarios visibles`}</span>
        </div>
      </div>

      <div className="uov-table-scroll">
        <table className="uov-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol y estado</th>
              <th>Overrides</th>
              <th>Riesgo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && !hasUsers ? (
              <LoadingRows />
            ) : (
              visibleUsers.map((user) => {
                const selected = Number(user.idUsuario) === Number(selectedId);
                const protectedUser = user.rolProtegido;

                return (
                  <tr key={user.idUsuario} className={selected ? "is-selected" : ""}>
                    <td>
                      <div className="uov-table-user">
                        <UserAvatar user={user} />
                        <div>
                          <strong>{user.nombreUsuario || "Sin nombre"}</strong>
                          <span>@{user.usuario || "-"} - {user.correo || "Sin correo"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="uov-role-cell">
                        <span className={`uov-chip ${protectedUser ? "is-protected" : ""}`}>
                          {user.nombreRol || "Sin rol"}
                        </span>
                        <span className={`uov-status-tag ${user.activo ? "is-on" : "is-off"}`}>
                          {user.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="uov-override-count">
                        <span>{user.overridesPermitidos} permitir - {user.overridesDenegados} denegar</span>
                      </div>
                    </td>
                    <td>
                      <span className={`uov-risk-pill ${user.overridesCriticos > 0 ? "is-critico" : "is-consulta"}`}>
                        {user.overridesCriticos > 0 ? `${user.overridesCriticos} criticos` : "Controlado"}
                      </span>
                    </td>
                    <td>
                      <div className="uov-row-actions">
                        <Button
                          icon="pi pi-eye"
                          className="uov-row-action"
                          tooltip="Ver permisos efectivos"
                          tooltipOptions={{ position: "top" }}
                          aria-label="Ver permisos efectivos"
                          onClick={() => onSelect(user)}
                          disabled={loading}
                        />
                        <Button
                          icon="pi pi-sliders-h"
                          className="uov-row-action"
                          tooltip={protectedUser ? "Administrador protegido: solo lectura" : "Gestionar overrides"}
                          tooltipOptions={{ position: "top" }}
                          aria-label="Gestionar overrides"
                          onClick={() => onManage(user)}
                          disabled={loading || protectedUser}
                        />
                        <Button
                          icon="pi pi-eraser"
                          className="uov-row-action"
                          tooltip={user.overridesActivos ? "Limpiar overrides" : "Sin overrides activos"}
                          tooltipOptions={{ position: "top" }}
                          aria-label="Limpiar overrides"
                          onClick={() => onClear(user)}
                          disabled={loading || protectedUser || !user.overridesActivos}
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
        <div className="uov-empty-state">
          <i className="pi pi-shield" />
          <strong>Sin usuarios para mostrar</strong>
          <span>Ajusta la busqueda o limpia filtros para revisar excepciones.</span>
        </div>
      ) : null}

      {hasUsers ? (
        <footer className="uov-table-footer">
          <div className={`uov-page-size ${pageSizeOpen ? "is-open" : ""}`} ref={pageSizeRef}>
            <button
              type="button"
              className="uov-page-size-control"
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
              <div className="uov-page-size-menu" role="listbox" aria-label="Usuarios por pagina">
                {OVERRIDE_ROW_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={option === rowsPerPage}
                    className={`uov-page-size-option ${option === rowsPerPage ? "is-selected" : ""}`}
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

          <div className="uov-pager" aria-label="Paginacion de overrides">
            <Button
              icon="pi pi-angle-double-left"
              className="uov-page-btn"
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
              aria-label="Primera pagina"
            />
            <Button
              icon="pi pi-angle-left"
              className="uov-page-btn"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={safePage <= 1}
              aria-label="Pagina anterior"
            />
            {pageNumbers.map((pageNumber) => (
              <Button
                key={pageNumber}
                label={String(pageNumber)}
                className={`uov-page-btn uov-page-number ${pageNumber === safePage ? "is-current" : ""}`}
                onClick={() => setPage(pageNumber)}
                aria-current={pageNumber === safePage ? "page" : undefined}
                aria-label={`Pagina ${pageNumber}`}
              />
            ))}
            <Button
              icon="pi pi-angle-right"
              className="uov-page-btn"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={safePage >= totalPages}
              aria-label="Pagina siguiente"
            />
            <Button
              icon="pi pi-angle-double-right"
              className="uov-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              aria-label="Ultima pagina"
            />
          </div>

          <span className="uov-page-report">{pageReport}</span>
        </footer>
      ) : null}
    </section>
  );
}
