import React, { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Sidebar } from "primereact/sidebar";
import { Skeleton } from "primereact/skeleton";
import {
  ESTADO_PROVEEDOR_FORM_OPTIONS,
  MODALIDAD_OPTIONS,
  PAGO_OPTIONS,
  ROL_CONTACTO_OPTIONS,
  TIPO_OPTIONS,
  buildContactoPayload,
  buildProveedorPayload,
  createEmptyContact,
  createProveedorForm,
} from "./proveedoresUtils";

const tipoOptions = TIPO_OPTIONS.filter((option) => option.value !== "TODOS");
const modalidadOptions = MODALIDAD_OPTIONS.filter((option) => option.value !== "TODOS");
const pagoOptions = PAGO_OPTIONS.filter((option) => option.value !== "TODOS");

const orderChannels = [
  { field: "pedidoWhatsapp", label: "Pedido por WhatsApp", icon: "pi pi-whatsapp" },
  { field: "pedidoLlamada", label: "Pedido por llamada", icon: "pi pi-phone" },
  { field: "pedidoApp", label: "Pedido por app", icon: "pi pi-mobile" },
  { field: "visitaRuta", label: "Visita de ruta", icon: "pi pi-truck" },
  { field: "compraMostrador", label: "Compra en mostrador", icon: "pi pi-shopping-bag" },
];

const commercialFlags = [
  { field: "permiteDevoluciones", label: "Devoluciones" },
  { field: "cambiosCaducidad", label: "Cambios por caducidad" },
  { field: "bonificaciones", label: "Bonificaciones" },
  { field: "descuentosFrecuentes", label: "Descuentos frecuentes" },
];

const rfcPattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;

function normalizeSnapshot(form, deletedContactIds) {
  return JSON.stringify({ form, deletedContactIds });
}

function hasContactData(contacto) {
  return [
    contacto.nombre,
    contacto.telefono,
    contacto.whatsapp,
    contacto.correo,
    contacto.notas,
  ].some((value) => String(value || "").trim());
}

function Section({ eyebrow, title, children }) {
  return (
    <section className="prov-editor-section">
      <div className="prov-editor-section-head">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FieldError({ value }) {
  return value ? <small className="prov-field-error">{value}</small> : null;
}

function TextField({ label, value, onChange, error, className = "", ...props }) {
  return (
    <label className={`prov-field ${className}`}>
      <span>{label}</span>
      <InputText value={value || ""} onChange={(event) => onChange(event.target.value)} {...props} />
      <FieldError value={error} />
    </label>
  );
}

function LoadingEditor() {
  return (
    <div className="prov-editor-loading">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="prov-editor-loading-card" key={index}>
          <Skeleton width="9rem" height="1rem" />
          <Skeleton width="100%" height="2.5rem" />
          <Skeleton width="76%" height="2.5rem" />
        </div>
      ))}
    </div>
  );
}

export default function ProveedorEditorPanel({
  visible,
  mode,
  proveedor,
  loading,
  saving,
  onHide,
  onSave,
}) {
  const [form, setForm] = useState(() => createProveedorForm());
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [deletedContactIds, setDeletedContactIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!visible || loading) return;

    const nextForm = createProveedorForm(proveedor);
    setForm(nextForm);
    setDeletedContactIds([]);
    setErrors({});
    setInitialSnapshot(normalizeSnapshot(nextForm, []));
  }, [loading, proveedor, visible]);

  const isEditing = mode === "edit";
  const currentSnapshot = useMemo(
    () => normalizeSnapshot(form, deletedContactIds),
    [deletedContactIds, form]
  );
  const isDirty = Boolean(initialSnapshot && currentSnapshot !== initialSnapshot);

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "formaPagoPrincipal") {
        next.manejaCredito = value === "CREDITO" || value === "MIXTO";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const updateContact = (index, field, value) => {
    setForm((prev) => {
      const contactos = prev.contactos.map((contacto, contactoIndex) => {
        if (contactoIndex !== index) {
          return field === "contactoPrincipal" && value
            ? { ...contacto, contactoPrincipal: false }
            : contacto;
        }
        return { ...contacto, [field]: value };
      });
      return { ...prev, contactos };
    });
    setErrors((prev) => ({ ...prev, [`contactos.${index}.${field}`]: "", contactos: "" }));
  };

  const addContact = () => {
    setForm((prev) => ({
      ...prev,
      contactos: [...prev.contactos, createEmptyContact(prev.contactos.length === 0)],
    }));
  };

  const removeContact = (index) => {
    const removed = form.contactos[index];
    if (removed?.idProveedorContacto) {
      setDeletedContactIds((ids) =>
        ids.includes(removed.idProveedorContacto) ? ids : [...ids, removed.idProveedorContacto]
      );
    }

    setForm((prev) => {
      const contactos = prev.contactos.filter((_, contactoIndex) => contactoIndex !== index);
      if (!contactos.some((contacto) => contacto.contactoPrincipal) && contactos[0]) {
        contactos[0] = { ...contactos[0], contactoPrincipal: true };
      }
      return { ...prev, contactos };
    });
  };

  const validate = () => {
    const nextErrors = {};
    const payload = buildProveedorPayload(form);

    if (!payload.nombreProveedor) {
      nextErrors.nombreProveedor = "El nombre comercial es obligatorio.";
    }

    if (payload.rfc && !rfcPattern.test(payload.rfc)) {
      nextErrors.rfc = "El RFC no tiene un formato valido.";
    }

    if (Number(form.pedidoMinimo || 0) < 0) {
      nextErrors.pedidoMinimo = "No puede ser negativo.";
    }
    if (Number(form.costoEnvio || 0) < 0) {
      nextErrors.costoEnvio = "No puede ser negativo.";
    }
    if (Number(form.diasCredito || 0) < 0) {
      nextErrors.diasCredito = "No puede ser negativo.";
    }
    if (Number(form.limiteCredito || 0) < 0) {
      nextErrors.limiteCredito = "No puede ser negativo.";
    }

    const contactosConDatos = form.contactos.filter(hasContactData);
    form.contactos.forEach((contacto, index) => {
      if (!hasContactData(contacto)) return;
      if (!String(contacto.nombre || "").trim()) {
        nextErrors[`contactos.${index}.nombre`] = "Captura el nombre del contacto.";
      }
    });

    if (
      contactosConDatos.length > 0 &&
      !contactosConDatos.some((contacto) => contacto.contactoPrincipal)
    ) {
      nextErrors.contactos = "Marca un contacto principal.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;

    const contactRefs = form.contactos.filter(hasContactData);
    const hasPrincipal = contactRefs.some((contacto) => contacto.contactoPrincipal);
    const contactos = contactRefs
      .map((contacto, index) => ({
        ...contacto,
        contactoPrincipal: contacto.contactoPrincipal || (!hasPrincipal && index === 0),
      }))
      .map(buildContactoPayload);

    await onSave({
      proveedor: buildProveedorPayload(form),
      contactos,
      contactRefs,
      deletedContactIds,
    });
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
    <div className="prov-editor-header">
      <span>{isEditing ? "Edicion comercial" : "Nuevo proveedor"}</span>
      <strong>{isEditing ? "Editar proveedor" : "Agregar proveedor"}</strong>
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
        className="prov-editor-sidebar"
        header={header}
      >
        <div className="prov-editor">
          <div className="prov-editor-topbar">
            <button className="prov-editor-close" type="button" onClick={requestClose}>
              <i className="pi pi-times" />
            </button>
          </div>

          {loading ? (
            <LoadingEditor />
          ) : (
            <div className="prov-editor-body">
              <Section eyebrow="01" title="Datos generales">
                <div className="prov-form-grid">
                  <TextField
                    label="Nombre comercial"
                    value={form.nombreProveedor}
                    onChange={(value) => updateField("nombreProveedor", value)}
                    error={errors.nombreProveedor}
                    className="prov-field-wide"
                    autoFocus
                  />
                  <TextField
                    label="Razon social"
                    value={form.razonSocial}
                    onChange={(value) => updateField("razonSocial", value)}
                  />
                  <TextField
                    label="RFC"
                    value={form.rfc}
                    onChange={(value) => updateField("rfc", value.toUpperCase())}
                    error={errors.rfc}
                  />
                  <label className="prov-field">
                    <span>Tipo de proveedor</span>
                    <Dropdown
                      value={form.tipoProveedor}
                      options={tipoOptions}
                      onChange={(event) => updateField("tipoProveedor", event.value)}
                    />
                  </label>
                  <TextField
                    label="Categoria principal"
                    value={form.categoriaPrincipal}
                    onChange={(value) => updateField("categoriaPrincipal", value)}
                  />
                  <label className="prov-field">
                    <span>Estado</span>
                    <Dropdown
                      value={form.estadoProveedor}
                      options={ESTADO_PROVEEDOR_FORM_OPTIONS}
                      onChange={(event) => updateField("estadoProveedor", event.value)}
                    />
                  </label>
                  <TextField
                    label="Direccion o zona"
                    value={form.direccion}
                    onChange={(value) => updateField("direccion", value)}
                  />
                  <label className="prov-field prov-field-wide">
                    <span>Notas internas</span>
                    <InputTextarea
                      value={form.notasInternas}
                      onChange={(event) => updateField("notasInternas", event.target.value)}
                      autoResize
                      rows={2}
                    />
                  </label>
                </div>
              </Section>

              <Section eyebrow="02" title="Contactos">
                <div className="prov-contact-list">
                  {form.contactos.map((contacto, index) => (
                    <div className="prov-contact-card" key={contacto.tempId}>
                      <div className="prov-contact-card-head">
                        <label className="prov-principal-check">
                          <Checkbox
                            checked={contacto.contactoPrincipal}
                            onChange={(event) =>
                              updateContact(index, "contactoPrincipal", event.checked)
                            }
                          />
                          <span>Principal</span>
                        </label>
                        <Button
                          icon="pi pi-trash"
                          className="prov-row-action"
                          onClick={() => removeContact(index)}
                          aria-label="Quitar contacto"
                          disabled={form.contactos.length === 1 && !hasContactData(contacto)}
                        />
                      </div>
                      <div className="prov-contact-grid">
                        <TextField
                          label="Contacto"
                          value={contacto.nombre}
                          onChange={(value) => updateContact(index, "nombre", value)}
                          error={errors[`contactos.${index}.nombre`]}
                        />
                        <label className="prov-field">
                          <span>Rol</span>
                          <Dropdown
                            value={contacto.rol}
                            options={ROL_CONTACTO_OPTIONS}
                            onChange={(event) => updateContact(index, "rol", event.value)}
                          />
                        </label>
                        <TextField
                          label="Telefono"
                          value={contacto.telefono}
                          onChange={(value) => updateContact(index, "telefono", value)}
                        />
                        <TextField
                          label="WhatsApp"
                          value={contacto.whatsapp}
                          onChange={(value) => updateContact(index, "whatsapp", value)}
                        />
                        <TextField
                          label="Correo"
                          value={contacto.correo}
                          onChange={(value) => updateContact(index, "correo", value)}
                        />
                        <TextField
                          label="Notas"
                          value={contacto.notas}
                          onChange={(value) => updateContact(index, "notas", value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <FieldError value={errors.contactos} />
                <Button
                  label="Agregar contacto"
                  icon="pi pi-plus"
                  className="prov-soft-btn prov-section-action"
                  onClick={addContact}
                />
              </Section>

              <Section eyebrow="03" title="Abastecimiento">
                <div className="prov-form-grid">
                  <label className="prov-field">
                    <span>Modalidad</span>
                    <Dropdown
                      value={form.modalidadAbastecimiento}
                      options={modalidadOptions}
                      onChange={(event) =>
                        updateField("modalidadAbastecimiento", event.value)
                      }
                    />
                  </label>
                  <TextField
                    label="Dias de visita o entrega"
                    value={form.diasVisitaEntrega}
                    onChange={(value) => updateField("diasVisitaEntrega", value)}
                    placeholder="Lunes, miercoles y viernes"
                  />
                  <TextField
                    label="Horario habitual"
                    value={form.horarioHabitual}
                    onChange={(value) => updateField("horarioHabitual", value)}
                    placeholder="9:00 a 13:00"
                  />
                  <TextField
                    label="Tiempo estimado de entrega"
                    value={form.tiempoEstimadoEntrega}
                    onChange={(value) => updateField("tiempoEstimadoEntrega", value)}
                    placeholder="24 horas"
                  />
                  <label className="prov-field">
                    <span>Pedido minimo</span>
                    <InputNumber
                      value={form.pedidoMinimo}
                      onValueChange={(event) => updateField("pedidoMinimo", event.value)}
                      mode="currency"
                      currency="MXN"
                      locale="es-MX"
                      min={0}
                    />
                    <FieldError value={errors.pedidoMinimo} />
                  </label>
                  <label className="prov-field">
                    <span>Costo de envio</span>
                    <InputNumber
                      value={form.costoEnvio}
                      onValueChange={(event) => updateField("costoEnvio", event.value)}
                      mode="currency"
                      currency="MXN"
                      locale="es-MX"
                      min={0}
                    />
                    <FieldError value={errors.costoEnvio} />
                  </label>
                </div>

                <div className="prov-chip-grid">
                  {orderChannels.map((channel) => (
                    <label
                      className={`prov-check-chip ${
                        form[channel.field] ? "is-selected" : ""
                      }`}
                      key={channel.field}
                    >
                      <Checkbox
                        checked={form[channel.field]}
                        onChange={(event) => updateField(channel.field, event.checked)}
                      />
                      <i className={channel.icon} />
                      <span>{channel.label}</span>
                    </label>
                  ))}
                </div>

                <label className="prov-field prov-field-wide">
                  <span>Observaciones de abastecimiento</span>
                  <InputTextarea
                    value={form.observacionesAbastecimiento}
                    onChange={(event) =>
                      updateField("observacionesAbastecimiento", event.target.value)
                    }
                    autoResize
                    rows={2}
                  />
                </label>
              </Section>

              <Section eyebrow="04" title="Condiciones comerciales">
                <div className="prov-form-grid">
                  <label className="prov-field">
                    <span>Condicion de pago</span>
                    <Dropdown
                      value={form.formaPagoPrincipal}
                      options={pagoOptions}
                      onChange={(event) => updateField("formaPagoPrincipal", event.value)}
                    />
                  </label>
                  <label className="prov-field">
                    <span>Dias de credito</span>
                    <InputNumber
                      value={form.diasCredito}
                      onValueChange={(event) => updateField("diasCredito", event.value)}
                      min={0}
                      disabled={!form.manejaCredito}
                    />
                    <FieldError value={errors.diasCredito} />
                  </label>
                  <label className="prov-field">
                    <span>Limite de credito</span>
                    <InputNumber
                      value={form.limiteCredito}
                      onValueChange={(event) => updateField("limiteCredito", event.value)}
                      mode="currency"
                      currency="MXN"
                      locale="es-MX"
                      min={0}
                      disabled={!form.manejaCredito}
                    />
                    <FieldError value={errors.limiteCredito} />
                  </label>
                  <label className={`prov-credit-switch ${form.manejaCredito ? "is-selected" : ""}`}>
                    <Checkbox
                      checked={form.manejaCredito}
                      onChange={(event) => updateField("manejaCredito", event.checked)}
                    />
                    <span>Maneja credito</span>
                  </label>
                </div>

                <div className="prov-chip-grid">
                  {commercialFlags.map((flag) => (
                    <label
                      className={`prov-check-chip ${form[flag.field] ? "is-selected" : ""}`}
                      key={flag.field}
                    >
                      <Checkbox
                        checked={form[flag.field]}
                        onChange={(event) => updateField(flag.field, event.checked)}
                      />
                      <span>{flag.label}</span>
                    </label>
                  ))}
                </div>

                <label className="prov-field prov-field-wide">
                  <span>Notas comerciales</span>
                  <InputTextarea
                    value={form.notasComerciales}
                    onChange={(event) => updateField("notasComerciales", event.target.value)}
                    autoResize
                    rows={2}
                  />
                </label>
              </Section>
            </div>
          )}

          <div className="prov-editor-footer">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text prov-text-btn"
              onClick={requestClose}
              disabled={saving}
            />
            <Button
              label={isEditing ? "Guardar cambios" : "Crear proveedor"}
              icon="pi pi-check"
              className="prov-primary-btn"
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
        className="prov-confirm-dialog"
        style={{ width: "32rem" }}
        footer={
          <div className="prov-dialog-footer">
            <Button
              label="Seguir editando"
              className="p-button-text prov-text-btn"
              onClick={() => setConfirmClose(false)}
            />
            <Button
              label="Descartar"
              icon="pi pi-check"
              className="prov-primary-btn"
              onClick={forceClose}
            />
          </div>
        }
      >
        <p className="prov-confirm-text">
          Hay cambios en el proveedor que todavia no se han guardado.
        </p>
      </Dialog>
    </>
  );
}
