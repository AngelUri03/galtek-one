import React from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import RolPermissionsPanel from "./RolPermissionsPanel";

const STATUS_OPTIONS = [
  { label: "Activo", value: true },
  { label: "Inactivo", value: false },
];

function Field({ label, children }) {
  return (
    <label className="ar-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function RolEditorPanel({
  editor,
  selectedRole,
  permisos,
  selectedPermIds,
  loading,
  saving,
  deleting,
  roleDirty,
  permsDirty,
  onChange,
  onSave,
  onDiscard,
  onDelete,
  onTogglePermission,
  onSelectModule,
  onClearModule,
  onSelectAllPermissions,
  onClearPermissions,
}) {
  const isNew = !editor?.idRol;
  const dirty = roleDirty || permsDirty;
  const disabled = loading || saving || deleting;
  const permissionCount = selectedPermIds.size;

  if (!editor) {
    return (
      <aside className="ar-editor-shell">
        <div className="ar-empty-editor">
          <i className="pi pi-sitemap" />
          <strong>Selecciona un rol</strong>
          <span>El detalle y los permisos apareceran aqui.</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="ar-editor-shell">
      <section className="ar-editor-card">
        <div className="ar-card-head">
          <div>
            <span className="ar-section-kicker">{isNew ? "Nuevo rol" : "Rol base"}</span>
            <h3>{isNew ? "Agregar rol" : "Detalle del rol"}</h3>
            <p>
              {isNew
                ? "Crea el perfil y asigna permisos iniciales."
                : "Edita nombre, estado y permisos base."}
            </p>
          </div>

          <span className={`ar-status-tag ${editor.activo ? "is-on" : "is-off"}`}>
            {editor.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className="ar-editor-hero">
          <span className="ar-editor-icon">
            <i className="pi pi-sitemap" />
          </span>
          <div>
            <strong>{editor.nombreRol || "Rol sin nombre"}</strong>
            <span>
              {permissionCount} {permissionCount === 1 ? "permiso" : "permisos"} asignados
            </span>
          </div>
          {dirty ? <span className="ar-pending-pill">Sin guardar</span> : null}
        </div>

        <div className="ar-editor-grid">
          <Field label="Nombre del rol">
            <InputText
              value={editor.nombreRol}
              onChange={(event) => onChange({ nombreRol: event.target.value })}
              placeholder="Ej. Cajero"
              disabled={disabled}
            />
          </Field>

          <Field label="Estado">
            <Dropdown
              value={editor.activo}
              options={STATUS_OPTIONS}
              onChange={(event) => onChange({ activo: event.value })}
              disabled={disabled}
              panelClassName="ar-select-panel"
            />
          </Field>
        </div>

        {isNew && permissionCount === 0 ? (
          <div className="ar-notice">
            <i className="pi pi-info-circle" />
            <span>Puede crearse sin permisos, pero no tendra accesos hasta asignarlos.</span>
          </div>
        ) : null}

        {!isNew && !selectedRole?.permisos?.length ? (
          <div className="ar-notice">
            <i className="pi pi-exclamation-circle" />
            <span>Este rol existe pero no tiene permisos asignados.</span>
          </div>
        ) : null}

        <div className="ar-editor-footer">
          {!isNew ? (
            <Button
              label="Eliminar"
              icon="pi pi-trash"
              className="ar-text-danger-btn"
              onClick={onDelete}
              disabled={disabled}
              type="button"
            />
          ) : null}
          <Button
            label="Descartar"
            icon="pi pi-undo"
            className="ar-soft-btn"
            onClick={onDiscard}
            disabled={disabled || !dirty}
            type="button"
          />
          <Button
            label={saving ? "Guardando..." : "Guardar cambios"}
            icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
            className="ar-primary-btn"
            onClick={onSave}
            disabled={disabled || !dirty}
            type="button"
          />
        </div>
      </section>

      <RolPermissionsPanel
        permisos={permisos}
        selectedIds={selectedPermIds}
        disabled={disabled}
        dirty={permsDirty}
        onTogglePermission={onTogglePermission}
        onSelectModule={onSelectModule}
        onClearModule={onClearModule}
        onSelectAll={onSelectAllPermissions}
        onClearAll={onClearPermissions}
      />
    </aside>
  );
}
