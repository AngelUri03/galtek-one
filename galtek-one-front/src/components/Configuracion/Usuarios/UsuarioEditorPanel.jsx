import React from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import UsuarioRolePermissionsReadOnly from "./UsuarioRolePermissionsReadOnly";
import {
  getRoleName,
  initialsFromName,
  isCurrentSessionUser,
  validateImageFile,
} from "./usuariosUtils";

function Field({ label, children, wide = false }) {
  return (
    <label className={`au-field ${wide ? "is-wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function UsuarioEditorPanel({
  user,
  editor,
  roles,
  selectedRole,
  loading,
  saving,
  dirty,
  imagePreview,
  onChange,
  onImageChange,
  onSave,
  onPassword,
  canResetPasswords,
  onToggleStatus,
}) {
  const roleOptions = roles.map((role) => ({ label: role.nombreRol, value: role.idRol }));
  const statusOptions = [
    { label: "Activo", value: true },
    { label: "Inactivo", value: false },
  ];
  const current = isCurrentSessionUser(user);

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    onImageChange(file, error);
    event.target.value = "";
  };

  if (!user) {
    return (
      <aside className="au-editor-shell">
        <div className="au-empty-editor">
          <i className="pi pi-user" />
          <strong>Selecciona un usuario</strong>
          <span>El detalle aparecera aqui cuando exista una cuenta seleccionada.</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="au-editor-shell">
      <section className="au-editor-card">
        <div className="au-card-head">
          <div>
            <span className="au-section-kicker">Cuenta</span>
            <h3>Detalle de usuario</h3>
          </div>
          <span className={`au-status-tag ${editor.activo ? "is-on" : "is-off"}`}>
            {editor.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className="au-editor-profile">
          <label className="au-avatar-picker" title="Cambiar avatar">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} hidden />
            <span className="au-avatar-large">
              {imagePreview || editor.imagen ? (
                <img src={imagePreview || editor.imagen} alt="Avatar" />
              ) : (
                initialsFromName(editor.nombreUsuario, editor.usuario?.slice(0, 2) || "US")
              )}
            </span>
            <span className="au-avatar-overlay">
              <i className="pi pi-camera" />
            </span>
          </label>

          <div className="au-editor-identity">
            <strong>{editor.nombreUsuario || "Sin nombre"}</strong>
            <span>@{editor.usuario || "-"}</span>
            {current ? <em>Sesion actual</em> : null}
          </div>
        </div>

        <div className="au-editor-grid">
          <Field label="Nombre completo" wide>
            <InputText
              value={editor.nombreUsuario}
              onChange={(event) => onChange({ nombreUsuario: event.target.value })}
              disabled={loading || saving}
            />
          </Field>

          <Field label="Usuario / login">
            <InputText
              value={editor.usuario}
              onChange={(event) => onChange({ usuario: event.target.value })}
              disabled={loading || saving}
            />
          </Field>

          <Field label="Rol">
            <Dropdown
              value={editor.idRol}
              options={roleOptions}
              onChange={(event) => onChange({ idRol: event.value })}
              placeholder="Selecciona rol"
              disabled={loading || saving}
              panelClassName="au-select-panel"
            />
          </Field>

          <Field label="Correo">
            <InputText
              value={editor.correo || ""}
              onChange={(event) => onChange({ correo: event.target.value })}
              disabled={loading || saving}
              placeholder="correo@dominio.com"
            />
          </Field>

          <Field label="Telefono">
            <InputText
              value={editor.telefono || ""}
              onChange={(event) => onChange({ telefono: event.target.value })}
              disabled={loading || saving}
              placeholder="5551234567"
            />
          </Field>

          <Field label="Estado">
            <Dropdown
              value={editor.activo}
              options={statusOptions}
              onChange={(event) => onChange({ activo: event.value })}
              disabled={loading || saving || current}
              panelClassName="au-select-panel"
            />
          </Field>

          <div className="au-field au-field-actions">
            <span>Password</span>
            <Button
              icon="pi pi-key"
              label="Administrar"
              className="au-soft-btn"
              onClick={() => onPassword(user)}
              disabled={loading || saving || !canResetPasswords}
            />
          </div>
        </div>

        <div className="au-editor-meta">
          <span>Rol actual: {getRoleName(roles, editor.idRol, "Sin rol")}</span>
          <span>{current ? "La cuenta actual no puede desactivarse desde aqui." : "Cuenta operativa"}</span>
        </div>

        <div className="au-editor-footer">
          <Button
            label={editor.activo ? "Desactivar" : "Reactivar"}
            icon={editor.activo ? "pi pi-ban" : "pi pi-check-circle"}
            className="au-soft-btn"
            onClick={() => onToggleStatus(user)}
            disabled={loading || saving || current}
          />
          <Button
            label={saving ? "Guardando..." : "Guardar cambios"}
            icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
            className="au-primary-btn"
            onClick={onSave}
            disabled={loading || saving || !dirty}
          />
        </div>
      </section>

      <UsuarioRolePermissionsReadOnly role={selectedRole} />
    </aside>
  );
}
