import React, { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from "primereact/multiselect";
import { Sidebar } from "primereact/sidebar";
import { Skeleton } from "primereact/skeleton";
import {
  CATEGORY_OTHER_VALUE,
  LEAD_TIME_CONTEXT_OPTIONS,
  LEAD_TIME_UNIT_OPTIONS,
  MONTH_DAY_OPTIONS,
  SCHEDULE_MODE_OPTIONS,
  VISIT_DAY_MODE_OPTIONS,
  WEEK_DAY_OPTIONS,
  buildAddressText,
  buildLeadTimeText,
  buildScheduleText,
  buildVisitDaysText,
  dateToTimeString,
  isValidEmail,
  isValidPhone,
  sanitizeEmailInput,
  sanitizePhoneInput,
  timeStringToDate,
} from "./proveedorEditorUtils";
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

const resolveCategoryValue = (value, options = []) => {
  const category = String(value || "").trim();
  if (!category) return "";
  return options.some((option) => option.value === category) ? category : CATEGORY_OTHER_VALUE;
};

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
    <label className={`prov-field ${error ? "has-error" : ""} ${className}`}>
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
  categoriaOptions = [],
  categoriasLoading = false,
  onHide,
  onSave,
}) {
  const [form, setForm] = useState(() => createProveedorForm());
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [deletedContactIds, setDeletedContactIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [confirmClose, setConfirmClose] = useState(false);
  const [categoryValue, setCategoryValue] = useState("");

  useEffect(() => {
    if (!visible || loading) return;

    const nextForm = createProveedorForm(proveedor);
    setForm(nextForm);
    setCategoryValue(resolveCategoryValue(nextForm.categoriaPrincipal));
    setDeletedContactIds([]);
    setErrors({});
    setInitialSnapshot(normalizeSnapshot(nextForm, []));
  }, [loading, proveedor, visible]);

  useEffect(() => {
    if (!visible || loading) return;
    if (categoryValue === CATEGORY_OTHER_VALUE && !form.categoriaPrincipal) return;
    setCategoryValue(resolveCategoryValue(form.categoriaPrincipal, categoriaOptions));
  }, [categoriaOptions, categoryValue, form.categoriaPrincipal, loading, visible]);

  const categoryOptionsWithOther = useMemo(
    () => [
      ...categoriaOptions,
      { label: "Otro", value: CATEGORY_OTHER_VALUE },
    ],
    [categoriaOptions]
  );

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

  const updateAddressField = (field, value) => {
    const nextValue =
      field === "direccionCodigoPostal"
        ? String(value || "").replace(/\D/g, "").slice(0, 5)
        : value;

    setForm((prev) => {
      const next = {
        ...prev,
        [field]: nextValue,
        direccionEsLegacy: false,
      };
      return {
        ...next,
        direccion: buildAddressText(next),
      };
    });
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

  const updatePhoneContact = (index, field, value) => {
    updateContact(index, field, sanitizePhoneInput(value));
  };

  const updateEmailContact = (index, value) => {
    updateContact(index, "correo", sanitizeEmailInput(value));
  };

  const updateCategory = (value) => {
    setCategoryValue(value);
    updateField("categoriaPrincipal", value === CATEGORY_OTHER_VALUE ? "" : value);
  };

  const updateVisitSchedule = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "diasVisitaModo") {
        next.diasSemanaVisita = value === "SEMANA" ? prev.diasSemanaVisita : [];
        next.diasMesVisita = value === "MES" ? prev.diasMesVisita : [];
      }
      next.diasVisitaEntrega = buildVisitDaysText(
        next.diasVisitaModo,
        next.diasSemanaVisita,
        next.diasMesVisita
      );
      return next;
    });
  };

  const updateSchedule = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "horarioModo" && value === "SIN_HORARIO") {
        next.horarioInicio = "";
        next.horarioFin = "";
      }
      if (field === "horarioModo" && value === "HORA") {
        next.horarioFin = "";
      }
      next.horarioHabitual = buildScheduleText(
        next.horarioModo,
        next.horarioInicio,
        next.horarioFin
      );
      return next;
    });
  };

  const updateLeadTime = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      next.tiempoEstimadoEntrega = buildLeadTimeText(
        next.anticipacionCantidad,
        next.anticipacionUnidad,
        next.anticipacionContexto
      );
      return next;
    });
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

    // Dentro de la función validate() en ProveedorEditorPanel.jsx:

      if (form.razonSocial && form.razonSocial.trim().length > 100) {
        nextErrors.razonSocial = "La razón social no puede exceder los 100 caracteres.";
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
      if (!isValidPhone(contacto.telefono)) {
        nextErrors[`contactos.${index}.telefono`] =
          "Usa 10 digitos o formato + lada y 10 digitos.";
      }
      if (!isValidPhone(contacto.whatsapp)) {
        nextErrors[`contactos.${index}.whatsapp`] =
          "Usa 10 digitos o formato + lada y 10 digitos.";
      }
      if (!isValidEmail(contacto.correo)) {
        nextErrors[`contactos.${index}.correo`] = "Captura un correo valido.";
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
                    placeholder="Ej. Abarrotes Central"
                    className="prov-field-wide"
                    autoFocus
                  />
                  <TextField
                    label="Razon social"
                    value={form.razonSocial}
                    onChange={(value) => updateField("razonSocial", value)}
                    error={errors.razonSocial}
                    placeholder="Ej. Comercial Central SA de CV"
                    maxLength={100}
                  />
                  <TextField
                    label="RFC"
                    value={form.rfc}
                    onChange={(value) => updateField("rfc", value.toUpperCase())}
                    error={errors.rfc}
                    placeholder="Ej. CEC010101AB1"
                    maxLength={13}
                  />
                  <label className="prov-field">
                    <span>Tipo de proveedor</span>
                    <Dropdown
                      value={form.tipoProveedor}
                      options={tipoOptions}
                      onChange={(event) => updateField("tipoProveedor", event.value)}
                      placeholder="Selecciona tipo"
                    />
                  </label>
                  <label className="prov-field">
                    <span>Categoria principal</span>
                    <Dropdown
                      value={categoryValue}
                      options={categoryOptionsWithOther}
                      onChange={(event) => updateCategory(event.value)}
                      loading={categoriasLoading}
                      placeholder={
                        categoriasLoading ? "Cargando categorias" : "Selecciona categoria"
                      }
                      panelClassName="prov-category-panel"
                      filter
                    />
                  </label>
                  {categoryValue === CATEGORY_OTHER_VALUE ? (
                    <TextField
                      label="Otra categoria"
                      value={form.categoriaPrincipal}
                      onChange={(value) => updateField("categoriaPrincipal", value)}
                      placeholder="Ej. Cremeria local"
                      maxLength={50}
                    />
                  ) : null}
                  <label className="prov-field">
                    <span>Estado</span>
                    <Dropdown
                      value={form.estadoProveedor}
                      options={ESTADO_PROVEEDOR_FORM_OPTIONS}
                      onChange={(event) => updateField("estadoProveedor", event.value)}
                      placeholder="Selecciona estado"
                    />
                  </label>
<div className="prov-address-block prov-field-wide">
                    <div className="prov-address-title">Direccion o zona</div>
                    <div className="prov-address-grid">
                      <TextField
                        label="Calle o avenida"
                        value={form.direccionCalle}
                        onChange={(value) => updateAddressField("direccionCalle", value)}
                        placeholder="Ej. Av. Central"
                        maxLength={120}
                      />
                      <TextField
                        label="No. exterior"
                        value={form.direccionNumeroExterior}
                        onChange={(value) =>
                          updateAddressField("direccionNumeroExterior", value)
                        }
                        placeholder="Ej. 120"
                        maxLength={15}
                      />
                      <TextField
                        label="No. interior"
                        value={form.direccionNumeroInterior}
                        onChange={(value) =>
                          updateAddressField("direccionNumeroInterior", value)
                        }
                        placeholder="Ej. Local 4"
                        maxLength={15}
                      />
                      <TextField
                        label="Colonia o zona"
                        value={form.direccionColonia}
                        onChange={(value) => updateAddressField("direccionColonia", value)}
                        placeholder="Ej. Centro"
                        maxLength={100}
                      />
                      <TextField
                        label="Municipio o ciudad"
                        value={form.direccionMunicipio}
                        onChange={(value) => updateAddressField("direccionMunicipio", value)}
                        placeholder="Ej. Queretaro"
                        maxLength={100}
                      />
                      <TextField
                        label="Estado"
                        value={form.direccionEstado}
                        onChange={(value) => updateAddressField("direccionEstado", value)}
                        placeholder="Ej. Queretaro"
                        maxLength={100}
                      />
                      <TextField
                        label="Codigo postal"
                        value={form.direccionCodigoPostal}
                        onChange={(value) =>
                          updateAddressField("direccionCodigoPostal", value)
                        }
                        placeholder="Ej. 76000"
                        inputMode="numeric"
                        maxLength={5}
                      />
                      <TextField
                        label="Referencia"
                        value={form.direccionReferencia}
                        onChange={(value) => updateAddressField("direccionReferencia", value)}
                        placeholder="Ej. Nave A-12, atras de cremeria"
                        maxLength={200}
                      />
                    </div>
                  </div>
                  <label className="prov-field prov-field-wide">
                    <span>Notas internas</span>
                    <InputTextarea
                      value={form.notasInternas}
                      onChange={(event) => updateField("notasInternas", event.target.value)}
                      autoResize
                      rows={2}
                      placeholder="Ej. Atiende rapido por WhatsApp, confirmar disponibilidad antes de pedir."
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
                          placeholder="Ej. Martha Gomez"
                        />
                        <label className="prov-field">
                          <span>Rol</span>
                          <Dropdown
                            value={contacto.rol}
                            options={ROL_CONTACTO_OPTIONS}
                            onChange={(event) => updateContact(index, "rol", event.value)}
                            placeholder="Selecciona rol"
                          />
                        </label>
                        <TextField
                          label="Telefono"
                          value={contacto.telefono}
                          onChange={(value) => updatePhoneContact(index, "telefono", value)}
                          error={errors[`contactos.${index}.telefono`]}
                          placeholder="5551234567 o +525551234567"
                          inputMode="tel"
                          maxLength={14}
                        />
                        <TextField
                          label="WhatsApp"
                          value={contacto.whatsapp}
                          onChange={(value) => updatePhoneContact(index, "whatsapp", value)}
                          error={errors[`contactos.${index}.whatsapp`]}
                          placeholder="5551234567 o +525551234567"
                          inputMode="tel"
                          maxLength={14}
                        />
                          <TextField
                          label="Contacto"
                          value={contacto.nombre}
                          onChange={(value) => updateContact(index, "nombre", value)}
                          error={errors[`contactos.${index}.nombre`]}
                          placeholder="Ej. Martha Gomez"
                          maxLength={100}
                        />
                        <TextField
                          label="Notas"
                          value={contacto.notas}
                          onChange={(value) => updateContact(index, "notas", value)}
                          placeholder="Ej. Responde mejor por la tarde"
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
                      placeholder="Selecciona modalidad"
                    />
                  </label>
                  <label className="prov-field">
                    <span>Frecuencia de visita</span>
                    <Dropdown
                      value={form.diasVisitaModo}
                      options={VISIT_DAY_MODE_OPTIONS}
                      onChange={(event) => updateVisitSchedule("diasVisitaModo", event.value)}
                      placeholder="Selecciona frecuencia"
                    />
                  </label>
                  <label className="prov-field prov-field-wide">
                    <span>
                      {form.diasVisitaModo === "MES"
                        ? "Dias del mes"
                        : "Dias de visita o entrega"}
                    </span>
                    <MultiSelect
                      value={
                        form.diasVisitaModo === "MES"
                          ? form.diasMesVisita
                          : form.diasSemanaVisita
                      }
                      options={
                        form.diasVisitaModo === "MES"
                          ? MONTH_DAY_OPTIONS
                          : WEEK_DAY_OPTIONS
                      }
                      onChange={(event) =>
                        updateVisitSchedule(
                          form.diasVisitaModo === "MES"
                            ? "diasMesVisita"
                            : "diasSemanaVisita",
                          event.value
                        )
                      }
                      display="chip"
                      maxSelectedLabels={4}
                      showSelectAll={false}
                      placeholder={
                        form.diasVisitaModo === "MES"
                          ? "Selecciona dias del mes"
                          : "Lunes, Miercoles, Viernes"
                      }
                      panelClassName="prov-select-panel"
                    />
                  </label>
                  <div className="prov-field prov-field-wide">
                    <span>Horario habitual</span>
                    <div className="prov-time-box">
                      <Dropdown
                        value={form.horarioModo}
                        options={SCHEDULE_MODE_OPTIONS}
                        onChange={(event) => updateSchedule("horarioModo", event.value)}
                        placeholder="Selecciona horario"
                      />
                      {form.horarioModo !== "SIN_HORARIO" ? (
                        <div
                          className={`prov-time-range ${
                            form.horarioModo === "HORA" ? "is-single" : ""
                          }`}
                        >
                          <Calendar
                            value={timeStringToDate(form.horarioInicio)}
                            onChange={(event) =>
                              updateSchedule("horarioInicio", dateToTimeString(event.value))
                            }
                            timeOnly
                            hourFormat="24"
                            showIcon
                            icon="pi pi-clock"
                            placeholder="09:00"
                            className="prov-time-calendar"
                            panelClassName="prov-time-panel"
                          />
                          {form.horarioModo === "RANGO" ? (
                            <>
                              <span className="prov-time-separator">a</span>
                              <Calendar
                                value={timeStringToDate(form.horarioFin)}
                                onChange={(event) =>
                                  updateSchedule("horarioFin", dateToTimeString(event.value))
                                }
                                timeOnly
                                hourFormat="24"
                                showIcon
                                icon="pi pi-clock"
                                placeholder="13:00"
                                className="prov-time-calendar"
                                panelClassName="prov-time-panel"
                              />
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="prov-field prov-field-wide">
                    <span>Anticipacion requerida para recibir el pedido</span>
                    <div className="prov-lead-grid">
                      <InputNumber
                        value={form.anticipacionCantidad}
                        onValueChange={(event) =>
                          updateLeadTime("anticipacionCantidad", event.value)
                        }
                        min={0}
                        max={365}
                        placeholder="Ej. 24"
                      />
                      <Dropdown
                        value={form.anticipacionUnidad}
                        options={LEAD_TIME_UNIT_OPTIONS}
                        onChange={(event) =>
                          updateLeadTime("anticipacionUnidad", event.value)
                        }
                        placeholder="Unidad"
                      />
                      <Dropdown
                        value={form.anticipacionContexto}
                        options={LEAD_TIME_CONTEXT_OPTIONS}
                        onChange={(event) =>
                          updateLeadTime("anticipacionContexto", event.value)
                        }
                        placeholder="Contexto"
                      />
                    </div>
                    <small className="prov-field-hint">
                      Define si se pide horas o dias antes de la entrega, o si es espera en mostrador.
                    </small>
                  </div>
                  <label className="prov-field">
                    <span>Pedido minimo</span>
                    <InputNumber
                      value={form.pedidoMinimo}
                      onValueChange={(event) => updateField("pedidoMinimo", event.value)}
                      mode="currency"
                      currency="MXN"
                      locale="es-MX"
                      min={0}
                      placeholder="$0.00"
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
                      placeholder="$0.00"
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
                    placeholder="Ej. Pedir antes de mediodia para recibir al dia siguiente."
                  />
                </label>
              </Section>

              <Section eyebrow="04" title="Condiciones comerciales">
                <div className="prov-form-grid prov-commercial-grid">
                  <label className="prov-field">
                    <span>Condicion de pago</span>
                    <Dropdown
                      value={form.formaPagoPrincipal}
                      options={pagoOptions}
                      onChange={(event) => updateField("formaPagoPrincipal", event.value)}
                      placeholder="Selecciona pago"
                    />
                  </label>
                  <label className="prov-field">
                    <span>Dias de credito</span>
                    <InputNumber
                      value={form.diasCredito}
                      onValueChange={(event) => updateField("diasCredito", event.value)}
                      min={0}
                      max={365}
                      placeholder="Ej. 7"
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
                      placeholder="$0.00"
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

                <div className="prov-chip-grid prov-commercial-flags">
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
                    placeholder="Ej. Cambia producto caducado solo con ticket y empaque cerrado."
                  />
                </label>
              </Section>
            </div>
          )}

          <div className="prov-editor-footer">
            <Button
              label="Cancelar"
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
