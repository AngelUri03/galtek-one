import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Sidebar } from "primereact/sidebar";
import { Skeleton } from "primereact/skeleton";
import {
  ESTADO_FORM_OPTIONS,
  TIPO_FORM_OPTIONS,
  buildAddressText,
  buildClientePayload,
  createClienteForm,
  isValidEmail,
  isValidPhone,
  isValidRfc,
  sanitizeEmailInput,
  sanitizePhoneInput,
} from "./clientesUtils";
import {
  MX_STATE_OPTIONS,
  appendCurrentOption,
  getColoniaOptions,
  getMunicipioOptions,
  hasColoniaForMunicipio,
  hasMunicipioForEstado,
  lookupPostalCodeMx,
} from "../Proveedores/proveedorAddressCatalog";

const rfcHint = "Ej. XAXX010101000";
const ACTIVATION_ONLY_ESTADO_OPTIONS = ESTADO_FORM_OPTIONS.map((option) => ({
  ...option,
  disabled: option.value !== "ACTIVO",
}));

const ERROR_FIELD_ORDER = [
  "nombre",
  "tipoCliente",
  "contacto",
  "telefono",
  "whatsapp",
  "email",
  "direccionCodigoPostal",
  "direccionEstado",
  "direccionMunicipio",
  "direccionColonia",
  "direccionCalle",
  "rfc",
  "razonSocial",
  "codigoPostalFiscal",
  "correoFiscal",
  "regimenFiscal",
  "usoCfdi",
];

function normalizeSnapshot(form) {
  return JSON.stringify(form);
}

const normalizeEstadoClienteValue = (value) =>
  String(value || "ACTIVO").trim().toUpperCase();

const dataFieldSelector = (key) =>
  `[data-field-key="${String(key).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;

const firstErrorKey = (errors) => {
  const keys = Object.keys(errors || {});
  if (!keys.length) return "";

  for (const field of ERROR_FIELD_ORDER) {
    const match = keys.find((key) => key === field);
    if (match) return match;
  }

  return keys[0];
};

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

function FieldLabel({ children, required = false }) {
  return (
    <span className={required ? "cli-required-label" : ""}>
      {children}
      {required ? <b aria-hidden="true">*</b> : null}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  className = "",
  fieldKey,
  required = false,
  ...props
}) {
  return (
    <label
      className={`cli-field ${error ? "has-error" : ""} ${className}`}
      data-field-key={fieldKey}
    >
      <FieldLabel required={required}>{label}</FieldLabel>
      <InputText
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        aria-required={required || undefined}
        {...props}
      />
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
  const [postalColoniaSuggestions, setPostalColoniaSuggestions] = useState([]);
  const editorBodyRef = useRef(null);

  useEffect(() => {
    if (!visible || loading) return;

    const nextForm = createClienteForm(cliente);
    setForm(nextForm);
    setErrors({});
    setPostalColoniaSuggestions([]);
    setInitialSnapshot(normalizeSnapshot(nextForm));
  }, [cliente, loading, visible]);

  useEffect(() => {
    const postalCode = String(form.direccionCodigoPostal || "").replace(/\D/g, "");
    if (!visible || loading || !form.tieneDireccion) {
      setPostalColoniaSuggestions([]);
      return undefined;
    }
    if (postalCode.length !== 5) {
      setPostalColoniaSuggestions([]);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const result = await lookupPostalCodeMx(postalCode);
        if (!active) return;
        if (!result) {
          setPostalColoniaSuggestions([]);
          return;
        }

        setPostalColoniaSuggestions(result.colonias || (result.colonia ? [result.colonia] : []));
        setForm((prev) => {
          if (!prev.tieneDireccion || prev.direccionCodigoPostal !== postalCode) return prev;

          const next = {
            ...prev,
            direccionColonia: result.colonia || prev.direccionColonia,
            direccionMunicipio: result.municipio || prev.direccionMunicipio,
            direccionEstado: result.estado || prev.direccionEstado,
          };

          return {
            ...next,
            direccion: buildAddressText(next),
          };
        });
        setErrors((prev) => {
          const nextErrors = { ...prev };
          if (result.colonia) delete nextErrors.direccionColonia;
          if (result.municipio) delete nextErrors.direccionMunicipio;
          if (result.estado) delete nextErrors.direccionEstado;
          return nextErrors;
        });
      } catch (error) {
        setPostalColoniaSuggestions([]);
      }
    }, 320);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [form.direccionCodigoPostal, form.tieneDireccion, loading, visible]);

  const isEditing = mode === "edit";
  const isActivationOnly =
    isEditing && normalizeEstadoClienteValue(cliente?.estadoCliente) === "INACTIVO";
  const currentSnapshot = useMemo(() => normalizeSnapshot(form), [form]);
  const isDirty = Boolean(initialSnapshot && currentSnapshot !== initialSnapshot);
  const addressStateOptions = useMemo(
    () => appendCurrentOption(MX_STATE_OPTIONS, form.direccionEstado),
    [form.direccionEstado]
  );
  const addressMunicipioOptions = useMemo(
    () => getMunicipioOptions(form.direccionEstado, form.direccionMunicipio),
    [form.direccionEstado, form.direccionMunicipio]
  );
  const addressColoniaOptions = useMemo(
    () =>
      getColoniaOptions(
        form.direccionEstado,
        form.direccionMunicipio,
        form.direccionColonia,
        postalColoniaSuggestions
      ),
    [
      form.direccionColonia,
      form.direccionEstado,
      form.direccionMunicipio,
      postalColoniaSuggestions,
    ]
  );

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "tieneContacto" && !value) {
        next.telefono = "";
        next.whatsapp = "";
        next.email = "";
      }
      if (field === "tieneDireccion" && !value) {
        next.direccion = "";
        next.direccionCalle = "";
        next.direccionNumeroExterior = "";
        next.direccionNumeroInterior = "";
        next.direccionColonia = "";
        next.direccionMunicipio = "";
        next.direccionEstado = "";
        next.direccionCodigoPostal = "";
        next.direccionReferencia = "";
      }
      if (field === "tieneDatosFiscales" && !value) {
        next.rfc = "";
        next.razonSocial = "";
        next.codigoPostalFiscal = "";
        next.correoFiscal = "";
        next.regimenFiscal = "";
        next.usoCfdi = "";
      }
      return next;
    });
    setErrors((prev) => {
      const nextErrors = { ...prev, [field]: "" };
      if (field === "tieneContacto" && !value) {
        ["telefono", "whatsapp", "email"].forEach((key) => delete nextErrors[key]);
        delete nextErrors.contacto;
      }
      if (["telefono", "whatsapp", "email"].includes(field)) {
        delete nextErrors.contacto;
      }
      if (field === "tieneDireccion" && !value) {
        [
          "direccionCodigoPostal",
          "direccionCalle",
          "direccionColonia",
          "direccionMunicipio",
          "direccionEstado",
        ].forEach((key) => delete nextErrors[key]);
      }
      if (field === "tieneDatosFiscales" && !value) {
        [
          "rfc",
          "razonSocial",
          "codigoPostalFiscal",
          "correoFiscal",
          "regimenFiscal",
          "usoCfdi",
        ].forEach((key) => delete nextErrors[key]);
      }
      return nextErrors;
    });
  };

  const updatePhoneField = (field, value) => updateField(field, sanitizePhoneInput(value));

  const updatePostalField = (field, value) =>
    updateField(field, String(value || "").replace(/\D/g, "").slice(0, 5));

  const updateAddressField = (field, value) => {
    const nextValue =
      field === "direccionCodigoPostal"
        ? String(value || "").replace(/\D/g, "").slice(0, 5)
        : value;

    setForm((prev) => {
      const next = {
        ...prev,
        [field]: nextValue,
      };
      return {
        ...next,
        direccion: buildAddressText(next),
      };
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const updateAddressSelect = (field, value) => {
    const nextValue = String(value || "").trim();

    setForm((prev) => {
      const next = {
        ...prev,
        [field]: nextValue,
      };

      if (
        field === "direccionEstado" &&
        !hasMunicipioForEstado(nextValue, prev.direccionMunicipio)
      ) {
        next.direccionMunicipio = "";
        next.direccionColonia = "";
      }

      if (
        field === "direccionMunicipio" &&
        !hasColoniaForMunicipio(
          prev.direccionEstado,
          nextValue,
          prev.direccionColonia,
          postalColoniaSuggestions
        )
      ) {
        next.direccionColonia = "";
      }

      return {
        ...next,
        direccion: buildAddressText(next),
      };
    });

    if (field !== "direccionColonia") {
      setPostalColoniaSuggestions([]);
    }

    setErrors((prev) => {
      const nextErrors = { ...prev, [field]: "" };
      if (field === "direccionEstado") {
        delete nextErrors.direccionMunicipio;
        delete nextErrors.direccionColonia;
      }
      if (field === "direccionMunicipio") {
        delete nextErrors.direccionColonia;
      }
      return nextErrors;
    });
  };

  const scrollToFirstError = (nextErrors) => {
    const key = firstErrorKey(nextErrors);
    if (!key) return;

    window.setTimeout(() => {
      const root = editorBodyRef.current;
      const target = root?.querySelector(dataFieldSelector(key));
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusTarget = target.querySelector(
        "input:not([type='hidden']), textarea, .p-dropdown, button"
      );
      focusTarget?.focus?.({ preventScroll: true });
    }, 0);
  };

  const validate = () => {
    const payload = buildClientePayload(form);
    const nextErrors = {};

    if (!payload.nombre) {
      nextErrors.nombre = "El nombre es obligatorio.";
    }

    if (!payload.tipoCliente) {
      nextErrors.tipoCliente = "Selecciona el tipo de cliente.";
    }

    if (form.tieneContacto) {
      if (!payload.telefono && !payload.whatsapp && !payload.email) {
        nextErrors.contacto = "Captura al menos un medio de contacto.";
      }
    }

    if (payload.email && !isValidEmail(payload.email)) {
      nextErrors.email = "Captura un correo valido.";
    }

    if (payload.telefono && !isValidPhone(payload.telefono)) {
      nextErrors.telefono = "Usa 10 digitos o formato + lada.";
    }

    if (payload.whatsapp && !isValidPhone(payload.whatsapp)) {
      nextErrors.whatsapp = "Usa 10 digitos o formato + lada.";
    }

    if (form.tieneDireccion) {
      if (!payload.direccionCodigoPostal) {
        nextErrors.direccionCodigoPostal = "Captura el codigo postal.";
      }
      if (!payload.direccionEstado) {
        nextErrors.direccionEstado = "Captura el estado.";
      }
      if (!payload.direccionMunicipio) {
        nextErrors.direccionMunicipio = "Captura el municipio.";
      }
      if (!payload.direccionColonia) {
        nextErrors.direccionColonia = "Captura la colonia o zona.";
      }
      if (!payload.direccionCalle) {
        nextErrors.direccionCalle = "Captura la calle o avenida.";
      }
    }

    if (form.tieneDatosFiscales) {
      if (!payload.rfc) {
        nextErrors.rfc = "Captura el RFC.";
      }
      if (!payload.razonSocial) {
        nextErrors.razonSocial = "Captura la razon social.";
      }
      if (!payload.codigoPostalFiscal) {
        nextErrors.codigoPostalFiscal = "Captura el CP fiscal.";
      }
      if (!payload.correoFiscal) {
        nextErrors.correoFiscal = "Captura el correo fiscal.";
      }
      if (!payload.regimenFiscal) {
        nextErrors.regimenFiscal = "Captura el regimen fiscal.";
      }
      if (!payload.usoCfdi) {
        nextErrors.usoCfdi = "Captura el uso CFDI.";
      }
    }

    if (payload.correoFiscal && !isValidEmail(payload.correoFiscal)) {
      nextErrors.correoFiscal = "Captura un correo fiscal valido.";
    }

    if (payload.rfc && !isValidRfc(payload.rfc)) {
      nextErrors.rfc = "El RFC no tiene formato valido.";
    }

    setErrors(nextErrors);
    const valid = Object.keys(nextErrors).length === 0;
    if (!valid) {
      scrollToFirstError(nextErrors);
    }
    return valid;
  };

  const submit = async () => {
    if (isActivationOnly) {
      if (form.estadoCliente !== "ACTIVO") {
        const nextErrors = {
          estadoCliente: "Selecciona Activo para reactivar el cliente.",
        };
        setErrors(nextErrors);
        scrollToFirstError(nextErrors);
        return;
      }

      await onSave({
        activateOnly: true,
        motivo: "Reactivado desde edicion de cliente",
      });
      return;
    }

    if (!validate()) return;
    await onSave({ payload: buildClientePayload(form) });
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
      <span>
        {isActivationOnly ? "Reactivacion" : isEditing ? "Edicion de cliente" : "Nuevo cliente"}
      </span>
      <strong>
        {isActivationOnly ? "Activar cliente" : isEditing ? "Editar cliente" : "Agregar cliente"}
      </strong>
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
            <div className="cli-editor-body" ref={editorBodyRef}>
              {isActivationOnly ? (
                <>
                  <div className="cli-state-explain is-inactive cli-editor-state-explain">
                    <i className="pi pi-pause-circle" />
                    <div>
                      <strong>Cliente inactivo</strong>
                      <span>Reactivalo antes de cambiar sus datos.</span>
                    </div>
                  </div>

                  <Section eyebrow="01" title="Estado del cliente">
                    <div className="cli-form-grid">
                      <label
                        className={`cli-field ${errors.estadoCliente ? "has-error" : ""}`}
                        data-field-key="estadoCliente"
                      >
                        <FieldLabel required>Estado</FieldLabel>
                        <Dropdown
                          value={form.estadoCliente}
                          options={ACTIVATION_ONLY_ESTADO_OPTIONS}
                          optionDisabled="disabled"
                          onChange={(event) => updateField("estadoCliente", event.value)}
                          placeholder="Selecciona estado"
                          panelClassName="cli-select-panel"
                          aria-required
                        />
                        <FieldError value={errors.estadoCliente} />
                      </label>
                    </div>
                  </Section>
                </>
              ) : (
                <>
              <Section eyebrow="01" title="Datos generales">
                <div className="cli-form-grid">
                  <TextField
                    label="Nombre"
                    value={form.nombre}
                    onChange={(value) => updateField("nombre", value)}
                    error={errors.nombre}
                    placeholder="Ej. Maria Lopez"
                    className="cli-field-wide"
                    fieldKey="nombre"
                    required
                    autoFocus
                  />
                  <TextField
                    label="Alias"
                    value={form.alias}
                    onChange={(value) => updateField("alias", value)}
                    placeholder="Ej. Mari"
                    fieldKey="alias"
                  />
                  <label
                    className={`cli-field ${errors.tipoCliente ? "has-error" : ""}`}
                    data-field-key="tipoCliente"
                  >
                    <FieldLabel required>Tipo</FieldLabel>
                    <Dropdown
                      value={form.tipoCliente}
                      options={TIPO_FORM_OPTIONS}
                      onChange={(event) => updateField("tipoCliente", event.value)}
                      placeholder="Selecciona tipo"
                      panelClassName="cli-select-panel"
                      aria-required
                    />
                    <FieldError value={errors.tipoCliente} />
                  </label>
                  <label className={`cli-option-toggle cli-field-wide ${form.tieneDireccion ? "is-selected" : ""}`}>
                    <Checkbox
                      checked={Boolean(form.tieneDireccion)}
                      onChange={(event) => updateField("tieneDireccion", event.checked)}
                    />
                    <i className="pi pi-map-marker" />
                    <span>Tiene direccion</span>
                  </label>
                  {form.tieneDireccion ? (
                    <div className="cli-address-block cli-field-wide">
                      <div className="cli-address-title">Direccion o zona</div>
                      <div className="cli-address-grid">
                        <TextField
                          label="Codigo postal"
                          value={form.direccionCodigoPostal}
                          onChange={(value) =>
                            updateAddressField("direccionCodigoPostal", value)
                          }
                          error={errors.direccionCodigoPostal}
                          placeholder="Ej. 76000"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          fieldKey="direccionCodigoPostal"
                          required
                          maxLength={5}
                        />
                        <label
                        className={`cli-field ${errors.direccionEstado ? "has-error" : ""}`}
                        data-field-key="direccionEstado"
                      >
                          <FieldLabel required>Estado</FieldLabel>
                          <Dropdown
                            value={form.direccionEstado || ""}
                            options={addressStateOptions}
                            onChange={(event) =>
                              updateAddressSelect("direccionEstado", event.value)
                            }
                            placeholder="Selecciona estado"
                            panelClassName="cli-select-panel"
                            filter
                            editable
                            aria-required
                          />
                          <FieldError value={errors.direccionEstado} />
                        </label>
                        <label
                        className={`cli-field ${errors.direccionMunicipio ? "has-error" : ""}`}
                        data-field-key="direccionMunicipio"
                      >
                          <FieldLabel required>Municipio</FieldLabel>
                          <Dropdown
                            value={form.direccionMunicipio || ""}
                            options={addressMunicipioOptions}
                            onChange={(event) =>
                              updateAddressSelect("direccionMunicipio", event.value)
                            }
                            placeholder={
                              form.direccionEstado
                                ? "Selecciona municipio"
                                : "Primero el estado"
                            }
                            panelClassName="cli-select-panel"
                            filter
                            editable
                            disabled={!form.direccionEstado}
                            aria-required
                          />
                          <FieldError value={errors.direccionMunicipio} />
                        </label>
                        <label
                        className={`cli-field ${errors.direccionColonia ? "has-error" : ""}`}
                        data-field-key="direccionColonia"
                      >
                          <FieldLabel required>Colonia o zona</FieldLabel>
                          <Dropdown
                            value={form.direccionColonia || ""}
                            options={addressColoniaOptions}
                            onChange={(event) =>
                              updateAddressSelect("direccionColonia", event.value)
                            }
                            placeholder={
                              form.direccionMunicipio
                                ? "Selecciona colonia"
                                : "Primero el municipio"
                            }
                            panelClassName="cli-select-panel"
                            filter
                            editable
                            disabled={!form.direccionMunicipio}
                            aria-required
                          />
                          <FieldError value={errors.direccionColonia} />
                        </label>
                        <TextField
                          label="Calle o avenida"
                          value={form.direccionCalle}
                          onChange={(value) => updateAddressField("direccionCalle", value)}
                          error={errors.direccionCalle}
                          placeholder="Ej. Av. Central"
                          fieldKey="direccionCalle"
                          required
                          maxLength={100}
                        />
                        <TextField
                          label="No. exterior"
                          value={form.direccionNumeroExterior}
                          onChange={(value) =>
                            updateAddressField("direccionNumeroExterior", value)
                          }
                          placeholder="Ej. 120"
                          fieldKey="direccionNumeroExterior"
                          maxLength={12}
                        />
                        <TextField
                          label="No. interior"
                          value={form.direccionNumeroInterior}
                          onChange={(value) =>
                            updateAddressField("direccionNumeroInterior", value)
                          }
                          placeholder="Ej. Local 4"
                          fieldKey="direccionNumeroInterior"
                          maxLength={12}
                        />
                        <TextField
                          label="Referencia"
                          value={form.direccionReferencia}
                          onChange={(value) => updateAddressField("direccionReferencia", value)}
                          placeholder="Ej. Casa azul junto a farmacia"
                          fieldKey="direccionReferencia"
                          maxLength={160}
                        />
                      </div>
                    </div>
                  ) : null}
                  <label
                    className={`cli-option-toggle cli-field-wide ${
                      form.tieneContacto ? "is-selected" : ""
                    }`}
                  >
                    <Checkbox
                      checked={Boolean(form.tieneContacto)}
                      onChange={(event) => updateField("tieneContacto", event.checked)}
                    />
                    <i className="pi pi-phone" />
                    <span>Tiene contacto</span>
                  </label>
                  {form.tieneContacto ? (
                    <div
                      className={`cli-contact-block cli-field-wide ${
                        errors.contacto ? "has-error" : ""
                      }`}
                      data-field-key="contacto"
                    >
                      <div className="cli-block-title-row">
                        <div className="cli-address-title">Contacto</div>
                        <small>Minimo uno</small>
                      </div>
                      <FieldError value={errors.contacto} />
                      <div className="cli-contact-grid">
                        <TextField
                          label="Telefono"
                          value={form.telefono}
                          onChange={(value) => updatePhoneField("telefono", value)}
                          error={errors.telefono}
                          placeholder="5551234567"
                          inputMode="tel"
                          fieldKey="telefono"
                          maxLength={14}
                        />
                        <TextField
                          label="WhatsApp"
                          value={form.whatsapp}
                          onChange={(value) => updatePhoneField("whatsapp", value)}
                          error={errors.whatsapp}
                          placeholder="5551234567"
                          inputMode="tel"
                          fieldKey="whatsapp"
                          maxLength={14}
                        />
                        <TextField
                          label="Correo"
                          value={form.email}
                          onChange={(value) => updateField("email", sanitizeEmailInput(value))}
                          error={errors.email}
                          placeholder="cliente@correo.com"
                          inputMode="email"
                          fieldKey="email"
                        />
                      </div>
                    </div>
                  ) : null}
                  <label
                    className={`cli-option-toggle cli-field-wide ${
                      form.tieneDatosFiscales ? "is-selected" : ""
                    }`}
                  >
                    <Checkbox
                      checked={Boolean(form.tieneDatosFiscales)}
                      onChange={(event) =>
                        updateField("tieneDatosFiscales", event.checked)
                      }
                    />
                    <i className="pi pi-file" />
                    <span>Tiene datos fiscales</span>
                  </label>
                  {form.tieneDatosFiscales ? (
                    <div className="cli-fiscal-block cli-field-wide">
                      <div className="cli-address-title">Datos fiscales</div>
                      <div className="cli-fiscal-grid">
                        <TextField
                          label="RFC"
                          value={form.rfc}
                          onChange={(value) => updateField("rfc", value.toUpperCase())}
                          error={errors.rfc}
                          placeholder={rfcHint}
                          fieldKey="rfc"
                          required
                          maxLength={13}
                        />
                        <TextField
                          label="Razon social"
                          value={form.razonSocial}
                          onChange={(value) => updateField("razonSocial", value)}
                          placeholder="Ej. Maria Lopez"
                          fieldKey="razonSocial"
                          required
                        />
                        <TextField
                          label="CP fiscal"
                          value={form.codigoPostalFiscal}
                          onChange={(value) => updatePostalField("codigoPostalFiscal", value)}
                          placeholder="76000"
                          inputMode="numeric"
                          fieldKey="codigoPostalFiscal"
                          required
                          maxLength={5}
                        />
                        <TextField
                          label="Correo fiscal"
                          value={form.correoFiscal}
                          onChange={(value) =>
                            updateField("correoFiscal", sanitizeEmailInput(value))
                          }
                          error={errors.correoFiscal}
                          placeholder="facturas@correo.com"
                          inputMode="email"
                          fieldKey="correoFiscal"
                          required
                        />
                        <TextField
                          label="Regimen fiscal"
                          value={form.regimenFiscal}
                          onChange={(value) => updateField("regimenFiscal", value)}
                          placeholder="Ej. 612"
                          fieldKey="regimenFiscal"
                          required
                        />
                        <TextField
                          label="Uso CFDI"
                          value={form.usoCfdi}
                          onChange={(value) => updateField("usoCfdi", value.toUpperCase())}
                          placeholder="Ej. G03"
                          fieldKey="usoCfdi"
                          required
                        />
                      </div>
                    </div>
                  ) : null}
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

                </>
              )}
            </div>
          )}

          <div className="cli-editor-footer">
            <div className="cli-editor-footer-actions">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-text cli-text-btn"
                onClick={requestClose}
                disabled={saving}
              />
              <Button
                label={
                  isActivationOnly
                    ? "Activar cliente"
                    : isEditing
                    ? "Guardar cambios"
                    : "Crear cliente"
                }
                icon={isActivationOnly ? "pi pi-play" : "pi pi-check"}
                className="cli-primary-btn"
                onClick={submit}
                loading={saving}
                disabled={loading || (isActivationOnly && form.estadoCliente !== "ACTIVO")}
              />
            </div>
          </div>
        </div>
      </Sidebar>

      <Dialog
        header="Cambios sin guardar"
        visible={confirmClose}
        onHide={() => setConfirmClose(false)}
        modal
        draggable={false}
        dismissableMask={false}
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
