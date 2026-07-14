import React, { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { confirmDialog } from "primereact/confirmdialog";
import RolPermissionsPanel from "./RolPermissionsPanel";
import {
  isProtectedRole,
  moduleNamesFromRole,
  permissionsSnapshot,
  removedCriticalPermissions,
  rolePermissionIds,
} from "./rolesUtils";

export default function RolPermissionsModal({
  visible,
  role,
  permisos,
  saving,
  onHide,
  onSave,
}) {
  const protectedRole = isProtectedRole(role);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [initialSnapshot, setInitialSnapshot] = useState("");

  useEffect(() => {
    if (!visible) return;
    const ids = rolePermissionIds(role);
    setSelectedIds(ids);
    setInitialSnapshot(permissionsSnapshot(ids));
  }, [role, visible]);

  const dirty = useMemo(
    () => Boolean(initialSnapshot && permissionsSnapshot(selectedIds) !== initialSnapshot),
    [initialSnapshot, selectedIds]
  );

  const modules = useMemo(() => {
    const roleLike = {
      ...role,
      permisos: permisos.filter((permission) => selectedIds.has(Number(permission.idPermiso))),
    };
    return moduleNamesFromRole(roleLike);
  }, [permisos, role, selectedIds]);

  const requestHide = () => {
    if (!dirty || protectedRole) {
      onHide();
      return;
    }

    confirmDialog({
      header: "Descartar cambios",
      message: "Hay cambios sin guardar en los permisos del rol. Si continuas se perderan.",
      icon: "pi pi-exclamation-triangle",
      className: "ar-confirm-dialog",
      acceptClassName: "ar-primary-btn",
      rejectClassName: "ar-text-btn",
      acceptLabel: "Descartar",
      rejectLabel: "Cancelar",
      accept: onHide,
    });
  };

  const discardChanges = () => {
    const ids = rolePermissionIds(role);
    setSelectedIds(ids);
    setInitialSnapshot(permissionsSnapshot(ids));
  };

  const togglePermission = (permission) => {
    const id = Number(permission?.idPermiso);
    if (!Number.isFinite(id) || protectedRole) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectModule = (group) => {
    if (protectedRole) return;
    const ids = (group?.items || [])
      .map((permission) => Number(permission.idPermiso))
      .filter((id) => Number.isFinite(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearModule = (group) => {
    if (protectedRole) return;
    const ids = new Set(
      (group?.items || [])
        .map((permission) => Number(permission.idPermiso))
        .filter((id) => Number.isFinite(id))
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const selectAll = () => {
    if (protectedRole) return;
    setSelectedIds(new Set(permisos.map((permission) => Number(permission.idPermiso))));
  };

  const clearAll = () => {
    if (protectedRole) return;
    setSelectedIds(new Set());
  };

  const submit = () => {
    if (protectedRole || !role?.idRol || !dirty) return;

    const removedCritical = removedCriticalPermissions(rolePermissionIds(role), selectedIds, permisos);
    const doSave = async () => {
      const ok = await onSave(role, selectedIds);
      if (ok) onHide();
    };

    if (removedCritical.length) {
      confirmDialog({
        header: "Quitar permisos criticos",
        message: (
          <div className="ar-confirm-copy">
            <strong>Vas a retirar permisos sensibles de este rol.</strong>
            <span>
              Revisa que el usuario con este rol no pierda acceso operativo necesario.
            </span>
          </div>
        ),
        icon: "pi pi-exclamation-triangle",
        className: "ar-confirm-dialog",
        acceptClassName: "ar-primary-btn",
        rejectClassName: "ar-text-btn",
        acceptLabel: "Guardar",
        rejectLabel: "Cancelar",
        accept: doSave,
      });
      return;
    }

    doSave();
  };

  return (
    <Dialog
      header={protectedRole ? "Ver permisos" : "Gestionar permisos"}
      visible={visible}
      onHide={requestHide}
      modal
      draggable={false}
      dismissableMask
      className="ar-dialog ar-permissions-dialog"
      style={{ width: "78rem", maxWidth: "96vw" }}
    >
      <div className={`ar-permissions-modal-body ${protectedRole ? "has-protected-note" : ""}`}>
        <section className="ar-permission-modal-head">
          <div className="ar-modal-hero">
            <span className="ar-editor-icon">
              <i className={protectedRole ? "pi pi-shield" : "pi pi-lock"} />
            </span>
            <div>
              <span className="ar-section-kicker">{protectedRole ? "Rol protegido" : "Permisos base"}</span>
              <strong>{role?.nombreRol || "Sin rol"}</strong>
              <small>{protectedRole ? "Solo lectura" : "Asignacion de permisos existentes"}</small>
            </div>
            <span className={`ar-status-tag ${role?.activo ? "is-on" : "is-off"}`}>
              {role?.activo ? "Activo" : "Inactivo"}
            </span>
          </div>

          <div className="ar-permission-stats">
            <div>
              <span>Seleccionados</span>
              <strong>{selectedIds.size}</strong>
            </div>
            <div>
              <span>Modulos</span>
              <strong>{modules.length}</strong>
            </div>
            <div>
              <span>Catalogo</span>
              <strong>{permisos.length}</strong>
            </div>
          </div>
        </section>

        {protectedRole ? (
          <div className="ar-protected-note">
            <i className="pi pi-shield" />
            <span>El rol Administrador es critico para el sistema. Sus permisos no pueden modificarse.</span>
          </div>
        ) : null}

        <RolPermissionsPanel
          permisos={permisos}
          selectedIds={selectedIds}
          disabled={saving}
          readOnly={protectedRole}
          dirty={dirty}
          onTogglePermission={togglePermission}
          onSelectModule={selectModule}
          onClearModule={clearModule}
          onSelectAll={selectAll}
          onClearAll={clearAll}
        />

        <footer className="ar-dialog-footer ar-permissions-footer">
          <Button
            label={protectedRole ? "Cerrar" : "Cancelar"}
            className="ar-text-btn"
            onClick={requestHide}
            disabled={saving}
            type="button"
          />
          {!protectedRole && dirty ? (
            <Button
              label="Descartar cambios"
              icon="pi pi-refresh"
              className="ar-soft-btn"
              onClick={discardChanges}
              disabled={saving}
              type="button"
            />
          ) : null}
          <Button
            label={saving ? "Guardando..." : "Guardar permisos"}
            icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
            className="ar-primary-btn"
            onClick={submit}
            disabled={saving || protectedRole || !dirty}
            tooltip={protectedRole ? "No puedes modificar permisos del Administrador" : undefined}
            tooltipOptions={{ position: "top" }}
            type="button"
          />
        </footer>
      </div>
    </Dialog>
  );
}
