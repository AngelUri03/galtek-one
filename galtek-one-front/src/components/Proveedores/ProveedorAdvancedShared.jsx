import React from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

export function AdvancedSection({ title, subtitle, icon, onAdd, addLabel, children }) {
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

export function AdvancedCardActions({ onEdit, onArchive, archiveLabel = "Archivar", extra }) {
  return (
    <div className="prov-adv-card-actions">
      {extra}
      {onEdit ? (
        <Button
          icon="pi pi-pencil"
          className="prov-row-action"
          onClick={onEdit}
          aria-label="Editar"
          tooltip="Editar"
          tooltipOptions={{ position: "top" }}
        />
      ) : null}
      {onArchive ? (
        <Button
          icon="pi pi-ban"
          className="prov-row-action"
          onClick={onArchive}
          aria-label={archiveLabel}
          tooltip={archiveLabel}
          tooltipOptions={{ position: "top" }}
        />
      ) : null}
    </div>
  );
}

export function TextField({ label, value, onChange, error, className = "", ...props }) {
  return (
    <label className={`prov-field ${className}`}>
      <span>{label}</span>
      <InputText value={value || ""} onChange={(event) => onChange(event.target.value)} {...props} />
      {error ? <small className="prov-field-error">{error}</small> : null}
    </label>
  );
}

export function TextAreaField({ label, value, onChange, className = "", ...props }) {
  return (
    <label className={`prov-field ${className}`}>
      <span>{label}</span>
      <InputTextarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        autoResize
        rows={2}
        {...props}
      />
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
    <Dialog
      header={title || ""}
      visible={visible}
      onHide={onCancel}
      modal
      draggable={false}
      dismissableMask
      className="prov-confirm-dialog"
      style={{ width: "32rem" }}
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
    </Dialog>
  );
}

export function AdvancedFormActions({ editing, saving, onCancel, onSave }) {
  return (
    <div className="prov-adv-form-actions">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text prov-text-btn"
        onClick={onCancel}
        disabled={saving}
      />
      <Button
        label={editing ? "Guardar" : "Agregar"}
        icon="pi pi-check"
        className="prov-primary-btn"
        onClick={onSave}
        loading={saving}
      />
    </div>
  );
}
