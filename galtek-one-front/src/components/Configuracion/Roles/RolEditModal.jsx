import React, { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { confirmDialog } from "primereact/confirmdialog";
import {
  createEmptyRoleEditor,
  isProtectedRole,
  roleSnapshot,
  validateRoleEditor,
} from "./rolesUtils";

const STATUS_OPTIONS = [
  { label: "Activo", value: true },
  { label: "Inactivo", value: false },
];

function Field({ label, children, wide = false }) {
  return (
    <label className={`ar-field ${wide ? "is-wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function RolEditModal({
  visible,
  role,
  roles,
  saving,
  onHide,
  onSave,
}) {
  const isNew = !role?.idRol;
  const protectedRole = isProtectedRole(role);
  const [editor, setEditor] = useState(createEmptyRoleEditor());
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!visible) return;
    const next = role
      ? {
          idRol: role.idRol,
          nombreRol: role.nombreRol || "",
          activo: role.activo !== false,
        }
      : createEmptyRoleEditor();
    setEditor(next);
    setInitialSnapshot(roleSnapshot(next));
    setLocalError("");
  }, [role, visible]);

  const dirty = useMemo(
    () => Boolean(initialSnapshot && roleSnapshot(editor) !== initialSnapshot),
    [editor, initialSnapshot]
  );

  const requestHide = () => {
    if (!dirty || protectedRole) {
      onHide();
      return;
    }

    confirmDialog({
      header: "Descartar cambios",
      message: "Hay cambios sin guardar en el rol. Si continuas se perderan.",
      icon: "pi pi-exclamation-triangle",
      className: "ar-confirm-dialog",
      acceptClassName: "ar-primary-btn",
      rejectClassName: "ar-text-btn",
      acceptLabel: "Descartar",
      rejectLabel: "Cancelar",
      accept: onHide,
    });
  };

  const submit = async () => {
    const validation = validateRoleEditor(editor, roles);
    if (validation.message) {
      setLocalError(validation.message);
      return;
    }
    setLocalError("");
    const ok = await onSave(editor);
    if (ok) onHide();
  };

  return (
    <Dialog
      header={isNew ? "Agregar rol" : "Editar rol"}
      visible={visible}
      onHide={requestHide}
      modal
      draggable={false}
      dismissableMask
      className="ar-dialog ar-role-dialog"
      style={{ width: "42rem", maxWidth: "94vw" }}
    >
      <div className="ar-role-modal-body">
        <section className="ar-modal-hero">
          <span className="ar-editor-icon">
            <i className={protectedRole ? "pi pi-shield" : "pi pi-sitemap"} />
          </span>
          <div>
            <span className="ar-section-kicker">{protectedRole ? "Rol protegido" : isNew ? "Nuevo rol" : "Rol base"}</span>
            <strong>{editor.nombreRol || "Rol sin nombre"}</strong>
            <small>
              {protectedRole
                ? "El rol Administrador solo puede consultarse."
                : "Define el perfil base del negocio."}
            </small>
          </div>
          <span className={`ar-status-tag ${editor.activo ? "is-on" : "is-off"}`}>
            {editor.activo ? "Activo" : "Inactivo"}
          </span>
        </section>

        {protectedRole ? (
          <div className="ar-protected-note">
            <i className="pi pi-shield" />
            <span>El rol Administrador es critico para el sistema y no puede editarse.</span>
          </div>
        ) : null}

        <div className="ar-role-modal-grid">
          <Field label="Nombre del rol" wide>
            <InputText
              value={editor.nombreRol}
              onChange={(event) => setEditor((prev) => ({ ...prev, nombreRol: event.target.value }))}
              placeholder="Ej. Cajero"
              disabled={saving || protectedRole}
            />
          </Field>

          <Field label="Estado" wide>
            <Dropdown
              value={editor.activo}
              options={STATUS_OPTIONS}
              onChange={(event) => setEditor((prev) => ({ ...prev, activo: event.value }))}
              disabled={saving || protectedRole}
              panelClassName="ar-select-panel"
            />
          </Field>
        </div>

        {localError ? <div className="ar-form-error">{localError}</div> : null}

        <footer className="ar-dialog-footer">
          <Button
            label="Cancelar"
            className="ar-text-btn"
            onClick={requestHide}
            disabled={saving}
            type="button"
          />
          {!protectedRole ? (
            <Button
              label={saving ? "Guardando..." : "Guardar cambios"}
              icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
              className="ar-primary-btn"
              onClick={submit}
              disabled={saving || !dirty}
              type="button"
            />
          ) : null}
        </footer>
      </div>
    </Dialog>
  );
}
