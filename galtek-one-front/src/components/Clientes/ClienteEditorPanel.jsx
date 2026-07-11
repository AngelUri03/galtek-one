import React, { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Sidebar } from "primereact/sidebar";
import { Skeleton } from "primereact/skeleton";
import {
  ESTADO_FORM_OPTIONS,
  TIPO_FORM_OPTIONS,
  buildClientePayload,
  createClienteForm,
  isValidEmail,
  isValidPhone,
  isValidRfc,
  sanitizeEmailInput,
  sanitizePhoneInput,
} from "./clientesUtils";

const rfcHint = "Ej. XAXX010101000";

function normalizeSnapshot(form) {
  return JSON.stringify(form);
}

function Section({ eyebrow, title, children }) {
  return (
    <section className="cli-editor-section">
      <div className="cli-editor-section-head">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FieldError({ value }) {
  return value ? <small className="cli-field-error">{value}</small> : null;
}

function TextField({ label, value, onChange, error, className = "", ...props }) {
  return (
    <label className={`cli-field ${error ? "has-error" : ""} ${className}`}>
      <span>{label}</span>
      <InputText value={value || ""} onChange={(event) => onChange(event.target.value)} {...props} />
      <FieldError value={error} />
    </label>
  );
}

function LoadingEditor() {
  return (
    <div className="cli-editor-loading">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="cli-editor-loading-card" key={index}>
          <Skeleton width="9rem" height="1rem" />
          <Skeleton width="100%" height="2.5rem" />
          <Skeleton width="76%" height="2.5rem" />
        </div>
      ))}
    </div>
  );
}

export default function ClienteEditorPanel({
  visible,
  mode,
  cliente,
  loading,
  saving,
  onHide,
  onSave,
}) {
  const [form, setForm] = useState(() => createClienteForm());
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [errors, setErrors] = useState({});
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!visible || loading) return;

    const nextForm = createClienteForm(cliente);
    setForm(nextForm);
    setErrors({});
    setInitialSnapshot(normalizeSnapshot(nextForm));
  }, [cliente, loading, visible]);

  const isEditing = mode === "edit";
  const currentSnapshot = useMemo(() => normalizeSnapshot(form), [form]);
  const isDirty = Boolean(initialSnapshot && currentSnapshot !== initialSnapshot);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const updatePhoneField = (field, value) => updateField(field, sanitizePhoneInput(value));

  const updatePostalField = (field, value) =>
    updateField(field, String(value || "").replace(/\D/g, "").slice(0, 5));

  const validate = () => {
    const payload = buildClientePayload(form);
    const nextErrors = {};

    if (!payload.nombre) {
      nextErrors.nombre = "El nombre es obligatorio.";
    }

    if (!isValidEmail(payload.email)) {
      nextErrors.email = "Captura un correo valido.";
    }

    if (!isValidEmail(payload.correoFiscal)) {
      nextErrors.correoFiscal = "Captura un correo fiscal valido.";
    }

    if (!isValidPhone(payload.telefono)) {
      nextErrors.telefono = "Usa 10 digitos o formato + lada.";
    }

    if (!isValidPhone(payload.whatsapp)) {
      nextErrors.whatsapp = "Usa 10 digitos o formato + lada.";
    }

    if (!isValidRfc(payload.rfc)) {
      nextErrors.rfc = "El RFC no tiene formato valido.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    await onSave(buildClientePayload(form));
  };

  const requestClose = () => {
    if (isDirty && !saving) {
      setConfirmClose(true);
      return;
    }
    onHide();
  };

  const forceClose = () => {
    setConfirmClose(false);
    onHide();
  };

  const header = (
    <div className="cli-editor-header">
      <span>{isEditing ? "Edicion de cliente" : "Nuevo cliente"}</span>
      <strong>{isEditing ? "Editar cliente" : "Agregar cliente"}</strong>
    </div>
  );

  return (
    <>
      <Sidebar
        visible={visible}
        onHide={requestClose}
        position="right"
        blockScroll
        showCloseIcon={false}
        className="cli-editor-sidebar"
        header={header}
      >
        <div className="cli-editor">
          {loading ? (
            <LoadingEditor />
          ) : (
            <div className="cli-editor-body">
              <Section eyebrow="01" title="Datos generales">
                <div className="cli-form-grid">
                  <TextField
                    label="Nombre"
                    value={form.nombre}
                    onChange={(value) => updateField("nombre", value)}
                    error={errors.nombre}
                    placeholder="Ej. Maria Lopez"
                    className="cli-field-wide"
                    autoFocus
                  />
                  <TextField
                    label="Alias"
                    value={form.alias}
                    onChange={(value) => updateField("alias", value)}
                    placeholder="Ej. Mari"
                  />
                  <label className="cli-field">
                    <span>Tipo</span>
                    <Dropdown
                      value={form.tipoCliente}
                      options={TIPO_FORM_OPTIONS}
                      onChange={(event) => updateField("tipoCliente", event.value)}
                      placeholder="Selecciona tipo"
                    />
                  </label>
                  <label className="cli-field">
                    <span>Estado</span>
                    <Dropdown
                      value={form.estadoCliente}
                      options={ESTADO_FORM_OPTIONS}
                      onChange={(event) => updateField("estadoCliente", event.value)}
                      placeholder="Selecciona estado"
                    />
                  </label>
                  <label className="cli-field cli-field-wide">
                    <span>Notas internas</span>
                    <InputTextarea
                      value={form.notasInternas}
                      onChange={(event) => updateField("notasInternas", event.target.value)}
                      autoResize
                      rows={2}
                      maxLength={2000}
                      placeholder="Ej. Pide ticket, prefiere WhatsApp, entregar despues de las 6."
                    />
                  </label>
                </div>
              </Section>

              <Section eyebrow="02" title="Contacto">
                <div className="cli-form-grid">
                  <TextField
                    label="Telefono"
                    value={form.telefono}
                    onChange={(value) => updatePhoneField("telefono", value)}
                    error={errors.telefono}
                    placeholder="5551234567"
                    inputMode="tel"
                    maxLength={14}
                  />
                  <TextField
                    label="WhatsApp"
                    value={form.whatsapp}
                    onChange={(value) => updatePhoneField("whatsapp", value)}
                    error={errors.whatsapp}
                    placeholder="5551234567"
                    inputMode="tel"
                    maxLength={14}
                  />
                  <TextField
                    label="Correo"
                    value={form.email}
                    onChange={(value) => updateField("email", sanitizeEmailInput(value))}
                    error={errors.email}
                    placeholder="cliente@correo.com"
                    inputMode="email"
                    className="cli-field-wide"
                  />
                </div>
              </Section>

              <Section eyebrow="03" title="Direccion opcional">
                <div className="cli-address-grid">
                  <TextField
                    label="Calle"
                    value={form.direccionCalle}
                    onChange={(value) => updateField("direccionCalle", value)}
                    placeholder="Ej. Av. Central"
                  />
                  <TextField
                    label="No. exterior"
                    value={form.direccionNumeroExterior}
                    onChange={(value) => updateField("direccionNumeroExterior", value)}
                    placeholder="Ej. 120"
                  />
                  <TextField
                    label="No. interior"
                    value={form.direccionNumeroInterior}
                    onChange={(value) => updateField("direccionNumeroInterior", value)}
                    placeholder="Ej. 4B"
                  />
                  <TextField
                    label="Colonia o zona"
                    value={form.direccionColonia}
                    onChange={(value) => updateField("direccionColonia", value)}
                    placeholder="Ej. Centro"
                  />
                  <TextField
                    label="Municipio o ciudad"
                    value={form.direccionMunicipio}
                    onChange={(value) => updateField("direccionMunicipio", value)}
                    placeholder="Ej. Queretaro"
                  />
                  <TextField
                    label="Estado"
                    value={form.direccionEstado}
                    onChange={(value) => updateField("direccionEstado", value)}
                    placeholder="Ej. Queretaro"
                  />
                  <TextField
                    label="Codigo postal"
                    value={form.direccionCodigoPostal}
                    onChange={(value) => updatePostalField("direccionCodigoPostal", value)}
                    placeholder="76000"
                    inputMode="numeric"
                    maxLength={5}
                  />
                  <TextField
                    label="Referencia"
                    value={form.direccionReferencia}
                    onChange={(value) => updateField("direccionReferencia", value)}
                    placeholder="Ej. Casa azul junto a farmacia"
                  />
                </div>
              </Section>

              <Section eyebrow="04" title="Datos fiscales opcionales">
                <div className="cli-form-grid">
                  <TextField
                    label="RFC"
                    value={form.rfc}
                    onChange={(value) => updateField("rfc", value.toUpperCase())}
                    error={errors.rfc}
                    placeholder={rfcHint}
                    maxLength={13}
                  />
                  <TextField
                    label="Razon social"
                    value={form.razonSocial}
                    onChange={(value) => updateField("razonSocial", value)}
                    placeholder="Ej. Maria Lopez"
                  />
                  <TextField
                    label="CP fiscal"
                    value={form.codigoPostalFiscal}
                    onChange={(value) => updatePostalField("codigoPostalFiscal", value)}
                    placeholder="76000"
                    inputMode="numeric"
                    maxLength={5}
                  />
                  <TextField
                    label="Correo fiscal"
                    value={form.correoFiscal}
                    onChange={(value) => updateField("correoFiscal", sanitizeEmailInput(value))}
                    error={errors.correoFiscal}
                    placeholder="facturas@correo.com"
                    inputMode="email"
                  />
                  <TextField
                    label="Regimen fiscal"
                    value={form.regimenFiscal}
                    onChange={(value) => updateField("regimenFiscal", value)}
                    placeholder="Ej. 612"
                  />
                  <TextField
                    label="Uso CFDI"
                    value={form.usoCfdi}
                    onChange={(value) => updateField("usoCfdi", value.toUpperCase())}
                    placeholder="Ej. G03"
                  />
                </div>
              </Section>
            </div>
          )}

          <div className="cli-editor-footer">
            <Button
              label="Cancelar"
              className="p-button-text cli-text-btn"
              onClick={requestClose}
              disabled={saving}
            />
            <Button
              label={isEditing ? "Guardar cambios" : "Crear cliente"}
              icon="pi pi-check"
              className="cli-primary-btn"
              onClick={submit}
              loading={saving}
              disabled={loading}
            />
          </div>
        </div>
      </Sidebar>

      <Dialog
        header="Cambios sin guardar"
        visible={confirmClose}
        onHide={() => setConfirmClose(false)}
        modal
        draggable={false}
        dismissableMask
        className="cli-confirm-dialog"
        style={{ width: "32rem" }}
        footer={
          <div className="cli-dialog-footer">
            <Button
              label="Seguir editando"
              className="p-button-text cli-text-btn"
              onClick={() => setConfirmClose(false)}
            />
            <Button
              label="Descartar"
              icon="pi pi-check"
              className="cli-primary-btn"
              onClick={forceClose}
            />
          </div>
        }
      >
        <p className="cli-confirm-text">
          Hay cambios en el cliente que todavia no se han guardado.
        </p>
      </Dialog>
    </>
  );
}
