import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { ModalSurface } from "../common/OverlaySurfaces";

export function AdvancedSection({ title, subtitle, icon, onAdd, addLabel, addDisabled = false, children }) {
  return (
    <section className="prov-adv-section">
      <div className="prov-adv-section-head">
        <div>
          <span className="prov-adv-icon">
            <i className={icon || "pi pi-circle"} />
          </span>
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
        {onAdd ? (
          <Button
            label={addLabel || "Agregar"}
            icon="pi pi-plus"
            className="prov-soft-btn"
            onClick={onAdd}
            disabled={addDisabled}
          />
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function AdvancedEmpty({ text }) {
  return (
    <div className="prov-adv-empty">
      <i className="pi pi-inbox" />
      <span>{text}</span>
    </div>
  );
}

export function AdvancedCardActions({ onEdit, onArchive, archiveLabel = "Archivar", extra, disabled = false }) {
  return (
    <div className="prov-adv-card-actions">
      {extra}
      {onEdit ? (
        <Button
          icon="pi pi-pencil"
          className="prov-row-action"
          onClick={onEdit}
          disabled={disabled}
          aria-label="Editar"
          tooltip="Editar"
          tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
        />
      ) : null}
      {onArchive ? (
        <Button
          icon="pi pi-folder"
          className="prov-row-action"
          onClick={onArchive}
          disabled={disabled}
          aria-label={archiveLabel}
          tooltip={archiveLabel}
          tooltipOptions={{ position: "top", className: "prov-action-tooltip" }}
        />
      ) : null}
    </div>
  );
}

export function FieldLabel({ children, required = false }) {
  return (
    <span className={required ? "prov-required-label" : undefined}>
      {children}
      {required ? <b aria-hidden="true">*</b> : null}
    </span>
  );
}

export function TextField({
  label,
  value,
  onChange,
  error,
  className = "",
  required = false,
  fieldKey,
  ...props
}) {
  return (
    <label
      className={`prov-field ${error ? "has-error" : ""} ${className}`}
      data-field-key={fieldKey}
    >
      <FieldLabel required={required}>{label}</FieldLabel>
      <InputText
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-required={required || undefined}
        {...props}
      />
      {error ? <small className="prov-field-error">{error}</small> : null}
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  error,
  className = "",
  required = false,
  fieldKey,
  ...props
}) {
  return (
    <label
      className={`prov-field ${error ? "has-error" : ""} ${className}`}
      data-field-key={fieldKey}
    >
      <FieldLabel required={required}>{label}</FieldLabel>
      <InputTextarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-required={required || undefined}
        autoResize
        rows={2}
        {...props}
      />
      {error ? <small className="prov-field-error">{error}</small> : null}
    </label>
  );
}

export function ConfirmActionDialog({
  visible,
  title,
  detail,
  loading,
  onCancel,
  onConfirm,
}) {
  return (
    <ModalSurface
      title={title || ""}
      visible={visible}
      onHide={onCancel}
      focusOnShow={false}
      closeButtonProps={{ tabIndex: -1 }}
      size="small"
      className="prov-confirm-dialog"
      footer={
        <div className="prov-dialog-footer">
          <Button
            label="Cancelar"
            className="p-button-text prov-text-btn"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            label="Confirmar"
            icon="pi pi-check"
            className="prov-primary-btn"
            onClick={onConfirm}
            loading={loading}
          />
        </div>
      }
    >
      <p className="prov-confirm-text">{detail}</p>
    </ModalSurface>
  );
}

export function AdvancedFormActions({
  editing,
  saving,
  onCancel,
  onSave,
  className = "",
  saveLabel,
  editorStyle = false,
}) {
  const actions = (
    <>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text prov-text-btn"
        onClick={onCancel}
        disabled={saving}
      />
      <Button
        label={saveLabel || (editing ? "Guardar" : "Agregar")}
        icon="pi pi-check"
        className="prov-primary-btn"
        onClick={onSave}
        loading={saving}
      />
    </>
  );

  if (editorStyle) {
    return (
      <div className={`prov-editor-footer ${className}`}>
        <div className="prov-editor-footer-actions">{actions}</div>
      </div>
    );
  }

  return (
    <div className={`prov-adv-form-actions ${className}`}>
      {actions}
    </div>
  );
}
