import React, { useEffect, useMemo, useRef, useState } from "react";
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
import {
  MX_STATE_OPTIONS,
  appendCurrentOption,
  getColoniaOptions,
  getMunicipioOptions,
  hasColoniaForMunicipio,
  hasMunicipioForEstado,
  lookupPostalCodeMx,
} from "./proveedorAddressCatalog";

const tipoOptions = TIPO_OPTIONS.filter((option) => option.value !== "TODOS");
const modalidadOptions = MODALIDAD_OPTIONS.filter((option) => option.value !== "TODOS");
const pagoOptions = PAGO_OPTIONS.filter((option) => option.value !== "TODOS");

const orderChannels = [
  { field: "pedidoWhatsapp", label: "WhatsApp", icon: "pi pi-whatsapp" },
  { field: "pedidoLlamada", label: "Llamada", icon: "pi pi-phone" },
  { field: "pedidoApp", label: "App", icon: "pi pi-mobile" },
  { field: "visitaRuta", label: "Ruta", icon: "pi pi-truck" },
  { field: "compraMostrador", label: "Mostrador", icon: "pi pi-shopping-bag" },
];

const commercialFlags = [
  { field: "permiteDevoluciones", label: "Devoluciones", icon: "pi pi-replay" },
  { field: "cambiosCaducidad", label: "Cambios por caducidad", icon: "pi pi-calendar-times" },
  { field: "bonificaciones", label: "Bonificaciones", icon: "pi pi-gift" },
  { field: "descuentosFrecuentes", label: "Descuentos frecuentes", icon: "pi pi-percentage" },
];

const rfcPattern = /^[A-Z&\u00D1]{3,4}[0-9]{6}[A-Z0-9]{3}$/;

const FORMAL_PROVIDER_TYPE = "DISTRIBUIDOR_FORMAL";
const ACTIVATION_ONLY_ESTADO_OPTIONS = [
  { label: "Inactivo", value: "INACTIVO", disabled: true },
  { label: "Activo", value: "ACTIVO" },
];

const ERROR_FIELD_ORDER = [
  "tipoProveedor",
  "razonSocial",
  "rfc",
  "nombreProveedor",
  "estadoProveedor",
  "direccionCodigoPostal",
  "direccionEstado",
  "direccionMunicipio",
  "direccionColonia",
  "direccionCalle",
  "contactos.",
  "contactos",
  "modalidadAbastecimiento",
  "diasVisitaEntrega",
  "horarioHabitual",
  "anticipacionCantidad",
  "pedidoMinimo",
  "costoEnvio",
  "formaPagoPrincipal",
  "diasCredito",
  "limiteCredito",
];

const sanitizeRfcInput = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9&\u00D1]/g, "")
    .slice(0, 13);

const dataFieldSelector = (key) =>
  `[data-field-key="${String(key).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;

const firstErrorKey = (errors) => {
  const keys = Object.keys(errors || {});
  if (!keys.length) return "";

  for (const field of ERROR_FIELD_ORDER) {
    const match = field.endsWith(".")
      ? keys.find((key) => key.startsWith(field))
      : keys.find((key) => key === field);
    if (match) return match;
  }

  return keys[0];
};

const resolveCategoryValue = (value, options = []) => {
  const category = String(value || "").trim();
  if (!category) return "";
  return options.some((option) => option.value === category) ? category : CATEGORY_OTHER_VALUE;
};

const normalizeEstadoProveedorValue = (value) =>
  String(value || "ACTIVO").trim().toUpperCase();

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

function hasContactMethod(contacto) {
  return [contacto.telefono, contacto.whatsapp, contacto.correo].some((value) =>
    String(value || "").trim()
  );
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

function FieldLabel({ children, required = false }) {
  return (
    <span className={required ? "prov-required-label" : ""}>
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
      className={`prov-field ${error ? "has-error" : ""} ${className}`}
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
  const [postalColoniaSuggestions, setPostalColoniaSuggestions] = useState([]);
  const editorBodyRef = useRef(null);

  useEffect(() => {
    if (!visible || loading) return;

    const nextForm = createProveedorForm(proveedor);
    setForm(nextForm);
    setCategoryValue(resolveCategoryValue(nextForm.categoriaPrincipal));
    setPostalColoniaSuggestions([]);
    setDeletedContactIds([]);
    setErrors({});
    setInitialSnapshot(normalizeSnapshot(nextForm, []));
  }, [loading, proveedor, visible]);

  useEffect(() => {
    if (!visible || loading) return;
    if (categoryValue === CATEGORY_OTHER_VALUE && !form.categoriaPrincipal) return;
    setCategoryValue(resolveCategoryValue(form.categoriaPrincipal, categoriaOptions));
  }, [categoriaOptions, categoryValue, form.categoriaPrincipal, loading, visible]);

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
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const result = await lookupPostalCodeMx(postalCode, controller.signal);
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
            direccionEsLegacy: false,
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
        if (error?.name !== "AbortError") setPostalColoniaSuggestions([]);
      }
    }, 320);

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.direccionCodigoPostal, form.tieneDireccion, loading, visible]);

  const categoryOptionsWithOther = useMemo(
    () => [
      ...categoriaOptions,
      { label: "Otro", value: CATEGORY_OTHER_VALUE },
    ],
    [categoriaOptions]
  );

  const isEditing = mode === "edit";
  const isActivationOnly =
    isEditing && normalizeEstadoProveedorValue(proveedor?.estadoProveedor) === "INACTIVO";
  const currentSnapshot = useMemo(
    () => normalizeSnapshot(form, deletedContactIds),
    [deletedContactIds, form]
  );
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
      if (field === "formaPagoPrincipal") {
        const usesCredit = value === "CREDITO" || value === "MIXTO";
        next.manejaCredito = usesCredit;
        if (!usesCredit) {
          next.diasCredito = null;
          next.limiteCredito = null;
        }
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
        next.direccionEsLegacy = false;
      }
      if (field === "requiereRecurrencia" && !value) {
        next.diasVisitaEntrega = "";
        next.diasSemanaVisita = [];
        next.diasMesVisita = [];
        next.horarioHabitual = "";
        next.horarioInicio = "";
        next.horarioFin = "";
        next.horarioModo = "RANGO";
      }
      if (field === "requiereAnticipacion" && !value) {
        next.tiempoEstimadoEntrega = "";
        next.anticipacionCantidad = null;
        next.anticipacionUnidad = "HORAS";
        next.anticipacionContexto = "ENTREGA_RECURRENTE";
      }
      return next;
    });
    setErrors((prev) => {
      const nextErrors = { ...prev, [field]: "" };
      if (field === "tieneDireccion" && !value) {
        [
          "direccionCodigoPostal",
          "direccionCalle",
          "direccionColonia",
          "direccionMunicipio",
          "direccionEstado",
        ].forEach((key) => delete nextErrors[key]);
      }
      if (field === "requiereRecurrencia" && !value) {
        delete nextErrors.diasVisitaEntrega;
        delete nextErrors.horarioHabitual;
      }
      if (field === "requiereAnticipacion" && !value) {
        delete nextErrors.anticipacionCantidad;
      }
      if (
        field === "formaPagoPrincipal" &&
        value !== "CREDITO" &&
        value !== "MIXTO"
      ) {
        delete nextErrors.diasCredito;
        delete nextErrors.limiteCredito;
      }
      if (field === "tipoProveedor" && value !== FORMAL_PROVIDER_TYPE) {
        delete nextErrors.razonSocial;
        delete nextErrors.rfc;
      }
      return nextErrors;
    });
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
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const updateAddressSelect = (field, value) => {
    const nextValue = String(value || "").trim();

    setForm((prev) => {
      const next = {
        ...prev,
        [field]: nextValue,
        direccionEsLegacy: false,
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
    setErrors((prev) => ({ ...prev, diasVisitaEntrega: "" }));
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
    setErrors((prev) => ({ ...prev, horarioHabitual: "" }));
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
    setErrors((prev) => ({ ...prev, anticipacionCantidad: "" }));
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

  const scrollToFirstError = (nextErrors) => {
    const key = firstErrorKey(nextErrors);
    if (!key) return;

    window.setTimeout(() => {
      const root = editorBodyRef.current;
      const target = root?.querySelector(dataFieldSelector(key));
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusTarget = target.querySelector(
        "input:not([type='hidden']), textarea, .p-dropdown, .p-multiselect, button"
      );
      focusTarget?.focus?.({ preventScroll: true });
    }, 0);
  };

  const validate = () => {
    const nextErrors = {};
    const payload = buildProveedorPayload(form);

    if (!payload.nombreProveedor) {
      nextErrors.nombreProveedor = "El nombre comercial es obligatorio.";
    }

    if (!payload.tipoProveedor) {
      nextErrors.tipoProveedor = "Selecciona el tipo de proveedor.";
    }

    if (!payload.estadoProveedor) {
      nextErrors.estadoProveedor = "Selecciona el estado.";
    }

    const isFormalProvider = form.tipoProveedor === FORMAL_PROVIDER_TYPE;

    if (isFormalProvider && !payload.razonSocial) {
      nextErrors.razonSocial = "Captura la razon social.";
    }

    if (isFormalProvider && !payload.rfc) {
      nextErrors.rfc = "Captura el RFC.";
    }

    if (payload.rfc && !rfcPattern.test(payload.rfc)) {
      nextErrors.rfc = "El RFC no tiene un formato valido.";
    }

    if (form.tieneDireccion) {
      if (!String(form.direccionCodigoPostal || "").trim()) {
        nextErrors.direccionCodigoPostal = "Captura el codigo postal.";
      }
      if (!String(form.direccionEstado || "").trim()) {
        nextErrors.direccionEstado = "Captura el estado.";
      }
      if (!String(form.direccionMunicipio || "").trim()) {
        nextErrors.direccionMunicipio = "Captura el municipio.";
      }
      if (!String(form.direccionColonia || "").trim()) {
        nextErrors.direccionColonia = "Captura la colonia o zona.";
      }
      if (!String(form.direccionCalle || "").trim()) {
        nextErrors.direccionCalle = "Captura la calle o avenida.";
      }
    }

    if (!payload.modalidadAbastecimiento) {
      nextErrors.modalidadAbastecimiento = "Selecciona la modalidad.";
    }

    if (!payload.formaPagoPrincipal) {
      nextErrors.formaPagoPrincipal = "Selecciona la condicion de pago.";
    }

    const usesCredit = form.formaPagoPrincipal === "CREDITO" || form.formaPagoPrincipal === "MIXTO";

    if (form.requiereRecurrencia) {
      const hasVisitDays =
        form.diasVisitaModo === "MES"
          ? form.diasMesVisita.length > 0
          : form.diasSemanaVisita.length > 0;
      if (!hasVisitDays) {
        nextErrors.diasVisitaEntrega = "Selecciona al menos un dia.";
      }
      if (form.horarioModo !== "SIN_HORARIO" && !form.horarioInicio) {
        nextErrors.horarioHabitual = "Captura el horario.";
      }
      if (form.horarioModo === "RANGO" && (!form.horarioInicio || !form.horarioFin)) {
        nextErrors.horarioHabitual = "Captura el rango de horario.";
      }
    }

    if (form.requiereAnticipacion && Number(form.anticipacionCantidad || 0) <= 0) {
      nextErrors.anticipacionCantidad = "Captura una anticipacion mayor a cero.";
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
    if (usesCredit && Number(form.diasCredito || 0) <= 0) {
      nextErrors.diasCredito = "Captura los dias de credito.";
    }
    if (usesCredit && Number(form.limiteCredito || 0) <= 0) {
      nextErrors.limiteCredito = "Captura el limite de credito.";
    }

    const contactosConDatos = form.contactos.filter(hasContactData);
    const contactosCompletos = form.contactos.filter(
      (contacto) => String(contacto.nombre || "").trim() && hasContactMethod(contacto)
    );
    form.contactos.forEach((contacto, index) => {
      if (!hasContactData(contacto)) return;
      if (!String(contacto.nombre || "").trim()) {
        nextErrors[`contactos.${index}.nombre`] = "Captura el nombre del contacto.";
      }
      if (!hasContactMethod(contacto)) {
        nextErrors[`contactos.${index}.telefono`] =
          "Captura telefono, WhatsApp o correo.";
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

    if (contactosCompletos.length === 0) {
      const firstContactIndex = Math.max(form.contactos.findIndex(hasContactData), 0);
      const contactWithNameIndex = form.contactos.findIndex((contacto) =>
        String(contacto.nombre || "").trim()
      );
      const hasAnyName = contactWithNameIndex >= 0;
      const hasAnyMethod = form.contactos.some(hasContactMethod);

      if (!hasAnyName) {
        nextErrors[`contactos.${firstContactIndex}.nombre`] =
          nextErrors[`contactos.${firstContactIndex}.nombre`] || "Captura un contacto.";
      }
      if (!hasAnyMethod) {
        nextErrors[`contactos.${firstContactIndex}.telefono`] =
          nextErrors[`contactos.${firstContactIndex}.telefono`] ||
          "Captura telefono, WhatsApp o correo.";
      }
      if (hasAnyName && hasAnyMethod) {
        nextErrors[`contactos.${contactWithNameIndex}.telefono`] =
          nextErrors[`contactos.${contactWithNameIndex}.telefono`] ||
          "Captura telefono, WhatsApp o correo.";
      }
    }

    if (
      contactosConDatos.length > 0 &&
      !contactosConDatos.some((contacto) => contacto.contactoPrincipal)
    ) {
      nextErrors.contactos = "Marca un contacto principal.";
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
      if (form.estadoProveedor !== "ACTIVO") {
        const nextErrors = {
          estadoProveedor: "Selecciona Activo para reactivar el proveedor.",
        };
        setErrors(nextErrors);
        scrollToFirstError(nextErrors);
        return;
      }

      await onSave({
        activateOnly: true,
        motivo: "Reactivado desde edicion de proveedor",
      });
      return;
    }

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
      <span>
        {isActivationOnly ? "Reactivacion" : isEditing ? "Edicion comercial" : "Nuevo proveedor"}
      </span>
      <strong>
        {isActivationOnly ? "Activar proveedor" : isEditing ? "Editar proveedor" : "Agregar proveedor"}
      </strong>
    </div>
  );
  const usesCredit = form.formaPagoPrincipal === "CREDITO" || form.formaPagoPrincipal === "MIXTO";
  const isFormalProvider = form.tipoProveedor === FORMAL_PROVIDER_TYPE;

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
            <div className="prov-editor-body" ref={editorBodyRef}>
              {isActivationOnly ? (
                <>
                  <div className="prov-state-explain is-inactive prov-editor-state-explain">
                    <i className="pi pi-pause-circle" />
                    <div>
                      <strong>Proveedor inactivo</strong>
                      <span>Reactivalo antes de cambiar sus datos comerciales.</span>
                    </div>
                  </div>

                  <Section eyebrow="01" title="Estado del proveedor">
                    <div className="prov-form-grid">
                      <label
                        className={`prov-field ${errors.estadoProveedor ? "has-error" : ""}`}
                        data-field-key="estadoProveedor"
                      >
                        <FieldLabel required>Estado</FieldLabel>
                        <Dropdown
                          value={form.estadoProveedor}
                          options={ACTIVATION_ONLY_ESTADO_OPTIONS}
                          optionDisabled="disabled"
                          onChange={(event) => updateField("estadoProveedor", event.value)}
                          placeholder="Selecciona estado"
                          aria-required
                        />
                        <FieldError value={errors.estadoProveedor} />
                      </label>
                    </div>
                  </Section>
                </>
              ) : (
                <>
              <Section eyebrow="01" title="Datos generales">
                <div className="prov-form-grid">
                  <label
                    className={`prov-field prov-field-wide ${
                      errors.tipoProveedor ? "has-error" : ""
                    }`}
                    data-field-key="tipoProveedor"
                  >
                    <FieldLabel required>Tipo de proveedor</FieldLabel>
                    <Dropdown
                      value={form.tipoProveedor}
                      options={tipoOptions}
                      onChange={(event) => updateField("tipoProveedor", event.value)}
                      placeholder="Selecciona tipo"
                      aria-required
                    />
                    <FieldError value={errors.tipoProveedor} />
                  </label>
                  <TextField
                    label="Razon social"
                    value={form.razonSocial}
                    onChange={(value) => updateField("razonSocial", value)}
                    error={errors.razonSocial}
                    placeholder="Ej. Comercial Central SA de CV"
                    fieldKey="razonSocial"
                    required={isFormalProvider}
                    maxLength={160}
                  />
                  <TextField
                    label="RFC"
                    value={form.rfc}
                    onChange={(value) => updateField("rfc", sanitizeRfcInput(value))}
                    error={errors.rfc}
                    placeholder="Ej. CEC010101AB1"
                    fieldKey="rfc"
                    required={isFormalProvider}
                    maxLength={13}
                  />
                  <TextField
                    label="Nombre comercial"
                    value={form.nombreProveedor}
                    onChange={(value) => updateField("nombreProveedor", value)}
                    error={errors.nombreProveedor}
                    placeholder="Ej. Abarrotes Central"
                    className="prov-field-wide"
                    fieldKey="nombreProveedor"
                    required
                    maxLength={100}
                  />
                  <label className="prov-field" data-field-key="categoriaPrincipal">
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
                      fieldKey="categoriaPrincipal"
                      maxLength={80}
                    />
                  ) : null}
                  <label
                    className={`prov-field ${errors.estadoProveedor ? "has-error" : ""}`}
                    data-field-key="estadoProveedor"
                  >
                    <FieldLabel required>Estado</FieldLabel>
                    <Dropdown
                      value={form.estadoProveedor}
                      options={ESTADO_PROVEEDOR_FORM_OPTIONS}
                      onChange={(event) => updateField("estadoProveedor", event.value)}
                      placeholder="Selecciona estado"
                      aria-required
                    />
                    <FieldError value={errors.estadoProveedor} />
                  </label>
                  <label className={`prov-option-toggle prov-field-wide ${form.tieneDireccion ? "is-selected" : ""}`}>
                    <Checkbox
                      checked={Boolean(form.tieneDireccion)}
                      onChange={(event) => updateField("tieneDireccion", event.checked)}
                    />
                    <i className="pi pi-map-marker" />
                    <span>Tiene direccion</span>
                  </label>
                  {form.tieneDireccion ? (
                  <div className="prov-address-block prov-field-wide">
                    <div className="prov-address-title">Direccion o zona</div>
                    <div className="prov-address-grid">
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
                        className={`prov-field ${errors.direccionEstado ? "has-error" : ""}`}
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
                          panelClassName="prov-select-panel"
                          filter
                          editable
                          aria-required
                        />
                        <FieldError value={errors.direccionEstado} />
                      </label>
                      <label
                        className={`prov-field ${errors.direccionMunicipio ? "has-error" : ""}`}
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
                          panelClassName="prov-select-panel"
                          filter
                          editable
                          disabled={!form.direccionEstado}
                          aria-required
                        />
                        <FieldError value={errors.direccionMunicipio} />
                      </label>
                      <label
                        className={`prov-field ${errors.direccionColonia ? "has-error" : ""}`}
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
                          panelClassName="prov-select-panel"
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
                        placeholder="Ej. Nave A-12, atras de cremeria"
                        fieldKey="direccionReferencia"
                        maxLength={160}
                      />
                    </div>
                  </div>
                  ) : null}
                  <label className="prov-field prov-field-wide">
                    <span>Notas internas</span>
                    <InputTextarea
                      value={form.notasInternas}
                      onChange={(event) => updateField("notasInternas", event.target.value)}
                      autoResize
                      rows={2}
                      maxLength={500}
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
                          fieldKey={`contactos.${index}.nombre`}
                          required={index === 0}
                          maxLength={100}
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
                          fieldKey={`contactos.${index}.telefono`}
                          maxLength={14}
                        />
                        <TextField
                          label="WhatsApp"
                          value={contacto.whatsapp}
                          onChange={(value) => updatePhoneContact(index, "whatsapp", value)}
                          error={errors[`contactos.${index}.whatsapp`]}
                          placeholder="5551234567 o +525551234567"
                          inputMode="tel"
                          fieldKey={`contactos.${index}.whatsapp`}
                          maxLength={14}
                        />
                        <TextField
                          label="Correo"
                          value={contacto.correo}
                          onChange={(value) => updateEmailContact(index, value)}
                          error={errors[`contactos.${index}.correo`]}
                          placeholder="ventas@proveedor.com"
                          inputMode="email"
                          fieldKey={`contactos.${index}.correo`}
                          maxLength={120}
                        />
                        <TextField
                          label="Notas"
                          value={contacto.notas}
                          onChange={(value) => updateContact(index, "notas", value)}
                          placeholder="Ej. Responde mejor por la tarde"
                          fieldKey={`contactos.${index}.notas`}
                          maxLength={180}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div data-field-key="contactos">
                  <FieldError value={errors.contactos} />
                </div>
                <Button
                  label="Agregar contacto"
                  icon="pi pi-plus"
                  className="prov-soft-btn prov-section-action"
                  onClick={addContact}
                />
              </Section>

              <Section eyebrow="03" title="Abastecimiento">
                <div className="prov-form-grid">
                  <label
                    className={`prov-field ${errors.modalidadAbastecimiento ? "has-error" : ""}`}
                    data-field-key="modalidadAbastecimiento"
                  >
                    <FieldLabel required>Modalidad</FieldLabel>
                    <Dropdown
                      value={form.modalidadAbastecimiento}
                      options={modalidadOptions}
                      onChange={(event) =>
                        updateField("modalidadAbastecimiento", event.value)
                      }
                      placeholder="Selecciona modalidad"
                      aria-required
                    />
                    <FieldError value={errors.modalidadAbastecimiento} />
                  </label>
                  <label className={`prov-option-toggle prov-field-wide ${form.requiereRecurrencia ? "is-selected" : ""}`}>
                    <Checkbox
                      checked={Boolean(form.requiereRecurrencia)}
                      onChange={(event) => updateField("requiereRecurrencia", event.checked)}
                    />
                    <i className="pi pi-calendar" />
                    <span>Tiene visitas o entregas programadas</span>
                  </label>
                  {form.requiereRecurrencia ? (
                  <>
                  <label
                    className="prov-field"
                    data-field-key="diasVisitaModo"
                  >
                    <span>Frecuencia de visita</span>
                    <Dropdown
                      value={form.diasVisitaModo}
                      options={VISIT_DAY_MODE_OPTIONS}
                      onChange={(event) => updateVisitSchedule("diasVisitaModo", event.value)}
                      placeholder="Selecciona frecuencia"
                    />
                  </label>
                  <label
                    className={`prov-field prov-field-wide ${errors.diasVisitaEntrega ? "has-error" : ""}`}
                    data-field-key="diasVisitaEntrega"
                  >
                    <FieldLabel required>
                      {form.diasVisitaModo === "MES"
                        ? "Dias del mes"
                        : "Dias de visita o entrega"}
                    </FieldLabel>
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
                          : "Selecciona dias de la semana"
                      }
                      panelClassName="prov-select-panel"
                    />
                    <FieldError value={errors.diasVisitaEntrega} />
                  </label>
                  <div
                    className={`prov-field prov-field-wide ${errors.horarioHabitual ? "has-error" : ""}`}
                    data-field-key="horarioHabitual"
                  >
                    <FieldLabel required>Horario habitual</FieldLabel>
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
                    <FieldError value={errors.horarioHabitual} />
                  </div>
                  </>
                  ) : null}
                  <label className={`prov-option-toggle prov-field-wide ${form.requiereAnticipacion ? "is-selected" : ""}`}>
                    <Checkbox
                      checked={Boolean(form.requiereAnticipacion)}
                      onChange={(event) => updateField("requiereAnticipacion", event.checked)}
                    />
                    <i className="pi pi-clock" />
                    <span>Requiere anticipacion para pedir</span>
                  </label>
                  {form.requiereAnticipacion ? (
                  <div
                    className={`prov-field prov-field-wide ${errors.anticipacionCantidad ? "has-error" : ""}`}
                    data-field-key="anticipacionCantidad"
                  >
                    <FieldLabel required>Anticipacion requerida</FieldLabel>
                    <div className="prov-lead-grid">
                      <InputNumber
                        value={form.anticipacionCantidad}
                        onValueChange={(event) =>
                          updateLeadTime("anticipacionCantidad", event.value)
                        }
                        min={0}
                        max={365}
                        maxFractionDigits={0}
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
                    <FieldError value={errors.anticipacionCantidad} />
                  </div>
                  ) : null}
                  <label className="prov-field">
                    <span>Pedido minimo</span>
                    <InputNumber
                      value={form.pedidoMinimo}
                      onValueChange={(event) => updateField("pedidoMinimo", event.value)}
                      mode="currency"
                      currency="MXN"
                      locale="es-MX"
                      min={0}
                      max={9999999.99}
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
                      max={99999.99}
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
                    maxLength={500}
                    placeholder="Ej. Pedir antes de mediodia para recibir al dia siguiente."
                  />
                </label>
              </Section>

              <Section eyebrow="04" title="Condiciones comerciales">
                <div className="prov-form-grid prov-commercial-grid">
                  <label
                    className={`prov-field prov-field-wide ${
                      errors.formaPagoPrincipal ? "has-error" : ""
                    }`}
                    data-field-key="formaPagoPrincipal"
                  >
                    <FieldLabel required>Condicion de pago</FieldLabel>
                    <Dropdown
                      value={form.formaPagoPrincipal}
                      options={pagoOptions}
                      onChange={(event) => updateField("formaPagoPrincipal", event.value)}
                      placeholder="Selecciona pago"
                      aria-required
                    />
                    <FieldError value={errors.formaPagoPrincipal} />
                  </label>
                  {usesCredit ? (
                    <div className="prov-credit-fields prov-field-wide">
                      <label
                        className={`prov-field ${errors.diasCredito ? "has-error" : ""}`}
                        data-field-key="diasCredito"
                      >
                        <FieldLabel required>Dias de credito</FieldLabel>
                        <InputNumber
                          value={form.diasCredito}
                          onValueChange={(event) => updateField("diasCredito", event.value)}
                          min={0}
                          max={365}
                          maxFractionDigits={0}
                          placeholder="Ej. 7"
                        />
                        <FieldError value={errors.diasCredito} />
                      </label>
                      <label
                        className={`prov-field ${errors.limiteCredito ? "has-error" : ""}`}
                        data-field-key="limiteCredito"
                      >
                        <FieldLabel required>Limite de credito</FieldLabel>
                        <InputNumber
                          value={form.limiteCredito}
                          onValueChange={(event) => updateField("limiteCredito", event.value)}
                          mode="currency"
                          currency="MXN"
                          locale="es-MX"
                          min={0}
                          max={9999999.99}
                          placeholder="$0.00"
                        />
                        <FieldError value={errors.limiteCredito} />
                      </label>
                    </div>
                  ) : null}
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
                      <i className={flag.icon} />
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
                    maxLength={500}
                    placeholder="Ej. Cambia producto caducado solo con ticket y empaque cerrado."
                  />
                </label>
              </Section>
                </>
              )}
            </div>
          )}

          <div className="prov-editor-footer">
            <div className="prov-editor-footer-actions">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-text prov-text-btn"
                onClick={requestClose}
                disabled={saving}
              />
              <Button
                label={
                  isActivationOnly
                    ? "Activar proveedor"
                    : isEditing
                    ? "Guardar cambios"
                    : "Crear proveedor"
                }
                icon={isActivationOnly ? "pi pi-play" : "pi pi-check"}
                className="prov-primary-btn"
                onClick={submit}
                loading={saving}
                disabled={loading || (isActivationOnly && form.estadoProveedor !== "ACTIVO")}
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
