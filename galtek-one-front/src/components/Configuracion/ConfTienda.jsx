import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import "../../style/components/Configuracion/Tienda.css";

const api = new APIfetchApi();
const MAX_LOGO_BYTES = 500 * 1024;

const FALLBACK_CURRENCIES = [
  "MXN",
  "USD",
  "CAD",
  "EUR",
  "GBP",
  "JPY",
  "BRL",
  "ARS",
  "CLP",
  "COP",
  "PEN",
  "GTQ",
  "CRC",
  "DOP",
  "UYU",
];

const FALLBACK_TIME_ZONES = [
  "America/Mexico_City",
  "America/Cancun",
  "America/Monterrey",
  "America/Mazatlan",
  "America/Tijuana",
  "America/Hermosillo",
  "America/Chihuahua",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "UTC",
];

const preferredCurrencies = ["MXN", "USD", "CAD", "EUR", "GBP"];
const preferredTimeZones = [
  "America/Mexico_City",
  "America/Cancun",
  "America/Monterrey",
  "America/Mazatlan",
  "America/Tijuana",
  "America/Hermosillo",
  "America/Chihuahua",
  "UTC",
];

const safeSupportedValues = (type, fallback) => {
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf(type);
    }
  } catch {
    return fallback;
  }
  return fallback;
};

const currencyDisplay = (() => {
  try {
    if (typeof Intl.DisplayNames === "function") {
      return new Intl.DisplayNames(["es-MX"], { type: "currency" });
    }
  } catch {
    return null;
  }
  return null;
})();

const buildCurrencyOptions = () => {
  const values = safeSupportedValues("currency", FALLBACK_CURRENCIES);
  const unique = Array.from(
    new Set([...preferredCurrencies, ...values].map((code) => String(code).toUpperCase()))
  );
  return unique
    .filter(Boolean)
    .map((code) => ({
      value: code,
      label: `${code} - ${currencyDisplay?.of(code) || code}`,
    }));
};

const buildTimeZoneOptions = () => {
  const values = safeSupportedValues("timeZone", FALLBACK_TIME_ZONES);
  const unique = Array.from(new Set([...preferredTimeZones, ...values]));
  return unique
    .filter(Boolean)
    .map((zone) => ({
      value: zone,
      label: zone.replace(/_/g, " "),
    }));
};

const CURRENCY_OPTIONS = buildCurrencyOptions();
const TIME_ZONE_OPTIONS = buildTimeZoneOptions();
const CURRENCY_VALUES = new Set(CURRENCY_OPTIONS.map((option) => option.value));
const TIME_ZONE_VALUES = new Set(TIME_ZONE_OPTIONS.map((option) => option.value));

const WEEK_DAYS = [
  { key: "mon", label: "Lunes", short: "Lun" },
  { key: "tue", label: "Martes", short: "Mar" },
  { key: "wed", label: "Miercoles", short: "Mie" },
  { key: "thu", label: "Jueves", short: "Jue" },
  { key: "fri", label: "Viernes", short: "Vie" },
  { key: "sat", label: "Sabado", short: "Sab" },
  { key: "sun", label: "Domingo", short: "Dom" },
];

const DAY_KEYS = WEEK_DAYS.map((day) => day.key);
const WEEKEND_KEYS = new Set(["sat", "sun"]);

const SCHEDULE_MODE_OPTIONS = [
  { label: "24 horas todos los dias", value: "ALWAYS_OPEN" },
  { label: "Cerrado temporalmente", value: "TEMP_CLOSED" },
  { label: "Todos los dias igual", value: "ALL_DAYS" },
  { label: "Lunes a viernes y fin de semana", value: "WEEKDAY_WEEKEND" },
  { label: "Base con excepciones", value: "EXCEPTIONS" },
  { label: "Personalizado por dia", value: "CUSTOM" },
];

const RULE_STATUS_OPTIONS = [
  { label: "Abierto con horario", value: "OPEN" },
  { label: "Cerrado", value: "CLOSED" },
  { label: "24 horas", value: "24H" },
];

const DEFAULT_SCHEDULE_CONFIG = {
  mode: "WEEKDAY_WEEKEND",
  base: { status: "OPEN", open: "08:00", close: "20:00" },
  weekdays: { status: "OPEN", open: "08:00", close: "20:00" },
  weekend: { status: "OPEN", open: "09:00", close: "16:00" },
  exceptions: {},
  days: {},
};

const initialForm = {
  nombre: "",
  razonSocial: "",
  rfc: "",
  direccion: "",
  direccionCalle: "",
  direccionNumeroExterior: "",
  direccionNumeroInterior: "",
  direccionColonia: "",
  direccionMunicipio: "",
  direccionEstado: "",
  direccionCodigoPostal: "",
  direccionReferencia: "",
  telefono: "",
  whatsapp: "",
  correo: "",
  horarioOperacion: "",
  horarioConfig: DEFAULT_SCHEDULE_CONFIG,
  horarioLunesViernesApertura: "08:00",
  horarioLunesViernesCierre: "20:00",
  horarioSabadoDomingoApertura: "09:00",
  horarioSabadoDomingoCierre: "16:00",
  horarioSabadoDomingoCerrado: false,
  horarioNotas: "",
  moneda: "MXN",
  zonaHoraria: "America/Mexico_City",
  logoNombre: "",
  logoMimeType: "",
  logoBase64: "",
};

const trim = (value) => (value == null ? "" : String(value).trim());
const trimOrNull = (value) => {
  const normalized = trim(value);
  return normalized || null;
};

const onlyPhoneChars = (value) => {
  const text = trim(value);
  const prefix = text.startsWith("+") ? "+" : "";
  return prefix + text.replace(/[^\d]/g, "").slice(0, prefix ? 13 : 10);
};

const readApiPayload = async (response, label = "solicitud") => {
  if (!response) throw new Error(`Sin respuesta del servidor en ${label}`);
  const payload = await response.json().catch(() => null);
  const apiStatus = Number(payload?.statusCode || 0);

  if (!response.ok || apiStatus >= 400) {
    throw new Error(payload?.message || `Error HTTP ${response.status} en ${label}`);
  }

  return payload?.data;
};

const hasStructuredAddress = (data = {}) =>
  [
    "direccionCalle",
    "direccionNumeroExterior",
    "direccionNumeroInterior",
    "direccionColonia",
    "direccionMunicipio",
    "direccionEstado",
    "direccionCodigoPostal",
    "direccionReferencia",
  ].some((key) => trim(data[key]));

const joinParts = (...values) =>
  values.map(trimOrNull).filter(Boolean).join(", ");

const withLabel = (label, value) => {
  const text = trimOrNull(value);
  return text ? `${label} ${text}` : "";
};

const composeDireccion = (form = {}) => {
  const structured = joinParts(
    form.direccionCalle,
    withLabel("No.", form.direccionNumeroExterior),
    withLabel("Int.", form.direccionNumeroInterior),
    form.direccionColonia,
    form.direccionMunicipio,
    form.direccionEstado,
    withLabel("CP", form.direccionCodigoPostal),
    form.direccionReferencia
  );
  return structured || trim(form.direccion);
};

const timeToMinutes = (time = "") => {
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const timeStringToDate = (value) => {
  const text = trim(value);
  if (!text) return null;
  const [hours, minutes] = text.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const dateToTimeString = (date) => {
  if (!date) return "";
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const createRule = (status = "OPEN", open = "08:00", close = "20:00") => ({
  status,
  open: status === "OPEN" ? open : "",
  close: status === "OPEN" ? close : "",
});

const cloneRule = (rule, fallback = DEFAULT_SCHEDULE_CONFIG.base) =>
  createRule(
    rule?.status || fallback.status,
    rule?.open || fallback.open,
    rule?.close || fallback.close
  );

const normalizeRule = (rule, fallback = DEFAULT_SCHEDULE_CONFIG.base) => {
  const status = ["OPEN", "CLOSED", "24H"].includes(rule?.status)
    ? rule.status
    : fallback.status || "OPEN";
  if (status !== "OPEN") return createRule(status);
  return createRule("OPEN", trim(rule?.open) || fallback.open || "08:00", trim(rule?.close) || fallback.close || "20:00");
};

const createDaysFromRules = (weekdays, weekend) =>
  DAY_KEYS.reduce((acc, key) => {
    acc[key] = cloneRule(WEEKEND_KEYS.has(key) ? weekend : weekdays);
    return acc;
  }, {});

const createDefaultScheduleConfig = () => ({
  mode: DEFAULT_SCHEDULE_CONFIG.mode,
  base: cloneRule(DEFAULT_SCHEDULE_CONFIG.base),
  weekdays: cloneRule(DEFAULT_SCHEDULE_CONFIG.weekdays),
  weekend: cloneRule(DEFAULT_SCHEDULE_CONFIG.weekend),
  exceptions: {},
  days: createDaysFromRules(
    DEFAULT_SCHEDULE_CONFIG.weekdays,
    DEFAULT_SCHEDULE_CONFIG.weekend
  ),
});

const normalizeScheduleConfig = (config = {}) => {
  const defaults = createDefaultScheduleConfig();
  const raw = config && typeof config === "object" ? config : {};
  const mode = SCHEDULE_MODE_OPTIONS.some((option) => option.value === raw.mode)
    ? raw.mode
    : defaults.mode;
  const base = normalizeRule(raw.base, defaults.base);
  const weekdays = normalizeRule(raw.weekdays, defaults.weekdays);
  const weekend = normalizeRule(raw.weekend, defaults.weekend);
  const exceptions = {};
  const rawExceptions =
    raw.exceptions && typeof raw.exceptions === "object" && !Array.isArray(raw.exceptions)
      ? raw.exceptions
      : {};
  DAY_KEYS.forEach((key) => {
    if (rawExceptions[key]) {
      exceptions[key] = normalizeRule(rawExceptions[key], base);
    }
  });

  const rawDays = raw.days && typeof raw.days === "object" && !Array.isArray(raw.days)
    ? raw.days
    : {};
  const days = DAY_KEYS.reduce((acc, key) => {
    const fallback = WEEKEND_KEYS.has(key) ? weekend : weekdays;
    acc[key] = normalizeRule(rawDays[key], fallback);
    return acc;
  }, {});

  return { mode, base, weekdays, weekend, exceptions, days };
};

const buildScheduleFromLegacy = (empresa = {}) => {
  const config = createDefaultScheduleConfig();
  const weekdays = normalizeRule(
    {
      status: "OPEN",
      open: empresa.horarioLunesViernesApertura,
      close: empresa.horarioLunesViernesCierre,
    },
    config.weekdays
  );
  const weekend = empresa.horarioSabadoDomingoCerrado
    ? createRule("CLOSED")
    : normalizeRule(
        {
          status: "OPEN",
          open: empresa.horarioSabadoDomingoApertura,
          close: empresa.horarioSabadoDomingoCierre,
        },
        config.weekend
      );
  return normalizeScheduleConfig({
    ...config,
    base: cloneRule(weekdays),
    weekdays,
    weekend,
    days: createDaysFromRules(weekdays, weekend),
  });
};

const parseScheduleConfig = (value, empresa = {}) => {
  if (value && typeof value === "object") return normalizeScheduleConfig(value);
  const text = trim(value);
  if (text) {
    try {
      return normalizeScheduleConfig(JSON.parse(text));
    } catch {
      return buildScheduleFromLegacy(empresa);
    }
  }
  return buildScheduleFromLegacy(empresa);
};

const dayLabel = (key) => WEEK_DAYS.find((day) => day.key === key)?.short || key;

const scheduleRuleText = (rule = {}) => {
  const normalized = normalizeRule(rule);
  if (normalized.status === "CLOSED") return "cerrado";
  if (normalized.status === "24H") return "24 horas";
  return `${normalized.open}-${normalized.close}`;
};

const composeHorario = (form = {}) => {
  const config = normalizeScheduleConfig(form.horarioConfig);
  const summary = (() => {
    if (config.mode === "ALWAYS_OPEN") return "Abierto 24 horas todos los dias";
    if (config.mode === "TEMP_CLOSED") return "Cerrado temporalmente";
    if (config.mode === "ALL_DAYS") return `Todos los dias ${scheduleRuleText(config.base)}`;
    if (config.mode === "WEEKDAY_WEEKEND") {
      return joinParts(
        `Lun a Vie ${scheduleRuleText(config.weekdays)}`,
        `Sab y Dom ${scheduleRuleText(config.weekend)}`
      );
    }
    if (config.mode === "EXCEPTIONS") {
      const exceptionText = Object.entries(config.exceptions)
        .map(([key, rule]) => `${dayLabel(key)} ${scheduleRuleText(rule)}`)
        .join(", ");
      return exceptionText
        ? `Base ${scheduleRuleText(config.base)}; excepciones: ${exceptionText}`
        : `Base ${scheduleRuleText(config.base)}`;
    }
    if (config.mode === "CUSTOM") {
      return WEEK_DAYS.map((day) => `${day.short} ${scheduleRuleText(config.days[day.key])}`).join(", ");
    }
    return trim(form.horarioOperacion);
  })();
  return joinParts(summary, form.horarioNotas) || trim(form.horarioOperacion);
};

const normalizeEmpresa = (data = {}) => ({
  idEmpresa: data.idEmpresa ?? data.id_empresa ?? data.id ?? null,
  nombre: data.nombreEmpresa ?? data.nombre ?? "",
  razonSocial: data.razonSocial ?? "",
  rfc: data.rfc ?? "",
  direccion: data.direccion ?? "",
  direccionCalle: data.direccionCalle ?? "",
  direccionNumeroExterior: data.direccionNumeroExterior ?? "",
  direccionNumeroInterior: data.direccionNumeroInterior ?? "",
  direccionColonia: data.direccionColonia ?? "",
  direccionMunicipio: data.direccionMunicipio ?? "",
  direccionEstado: data.direccionEstado ?? "",
  direccionCodigoPostal: data.direccionCodigoPostal ?? "",
  direccionReferencia: data.direccionReferencia ?? "",
  telefono: data.telefono ?? "",
  whatsapp: data.whatsapp ?? "",
  correo: data.correo ?? "",
  horarioOperacion: data.horarioOperacion ?? "",
  horarioConfig: data.horarioConfig ?? "",
  horarioLunesViernesApertura: data.horarioLunesViernesApertura ?? "",
  horarioLunesViernesCierre: data.horarioLunesViernesCierre ?? "",
  horarioSabadoDomingoApertura: data.horarioSabadoDomingoApertura ?? "",
  horarioSabadoDomingoCierre: data.horarioSabadoDomingoCierre ?? "",
  horarioSabadoDomingoCerrado: Boolean(data.horarioSabadoDomingoCerrado),
  horarioNotas: data.horarioNotas ?? "",
  moneda: data.moneda || "MXN",
  zonaHoraria: data.zonaHoraria || "America/Mexico_City",
  logoNombre: data.logoNombre ?? "",
  logoMimeType: data.logoMimeType ?? "",
  logoBase64: data.logoBase64 ?? "",
  fechaModificacion: data.fechaModificacion ?? "",
  tipoSuscripcion:
    data.tipoSuscripcion?.nombre ??
    data.tipoSuscripcion?.nombreTipoSuscripcion ??
    data.tipoSuscripcion?.descripcion ??
    "Local escritorio",
});

const toForm = (empresa = {}) => {
  const structuredAddress = hasStructuredAddress(empresa);
  const scheduleConfig = parseScheduleConfig(empresa.horarioConfig, empresa);
  const hasStoredScheduleConfig = Boolean(trim(empresa.horarioConfig));
  const hasStructuredSchedule =
    empresa.horarioLunesViernesApertura ||
    empresa.horarioLunesViernesCierre ||
    empresa.horarioSabadoDomingoApertura ||
    empresa.horarioSabadoDomingoCierre ||
    empresa.horarioSabadoDomingoCerrado;

  return {
    nombre: empresa.nombre ?? "",
    razonSocial: empresa.razonSocial ?? "",
    rfc: empresa.rfc ?? "",
    direccion: empresa.direccion ?? "",
    direccionCalle: structuredAddress ? empresa.direccionCalle ?? "" : empresa.direccion ?? "",
    direccionNumeroExterior: empresa.direccionNumeroExterior ?? "",
    direccionNumeroInterior: empresa.direccionNumeroInterior ?? "",
    direccionColonia: empresa.direccionColonia ?? "",
    direccionMunicipio: empresa.direccionMunicipio ?? "",
    direccionEstado: empresa.direccionEstado ?? "",
    direccionCodigoPostal: empresa.direccionCodigoPostal ?? "",
    direccionReferencia: empresa.direccionReferencia ?? "",
    telefono: empresa.telefono ?? "",
    whatsapp: empresa.whatsapp ?? "",
    correo: empresa.correo ?? "",
    horarioOperacion: empresa.horarioOperacion ?? "",
    horarioConfig: scheduleConfig,
    horarioLunesViernesApertura: scheduleConfig.weekdays.open || "",
    horarioLunesViernesCierre: scheduleConfig.weekdays.close || "",
    horarioSabadoDomingoApertura: scheduleConfig.weekend.open || "",
    horarioSabadoDomingoCierre: scheduleConfig.weekend.close || "",
    horarioSabadoDomingoCerrado: scheduleConfig.weekend.status === "CLOSED",
    horarioNotas:
      empresa.horarioNotas ??
      (!hasStructuredSchedule && !hasStoredScheduleConfig ? empresa.horarioOperacion ?? "" : ""),
    moneda: CURRENCY_VALUES.has(empresa.moneda) ? empresa.moneda : "MXN",
    zonaHoraria: TIME_ZONE_VALUES.has(empresa.zonaHoraria)
      ? empresa.zonaHoraria
      : "America/Mexico_City",
    logoNombre: empresa.logoNombre ?? "",
    logoMimeType: empresa.logoMimeType ?? "",
    logoBase64: empresa.logoBase64 ?? "",
  };
};

const buildPayload = (form = {}) => {
  const horarioConfig = normalizeScheduleConfig(form.horarioConfig);
  const legacyWeekendClosed = horarioConfig.weekend.status === "CLOSED";
  return {
    nombre: trim(form.nombre),
    razonSocial: trim(form.razonSocial),
    rfc: trim(form.rfc).toUpperCase(),
    direccion: composeDireccion(form),
    direccionCalle: trim(form.direccionCalle),
    direccionNumeroExterior: trim(form.direccionNumeroExterior),
    direccionNumeroInterior: trim(form.direccionNumeroInterior),
    direccionColonia: trim(form.direccionColonia),
    direccionMunicipio: trim(form.direccionMunicipio),
    direccionEstado: trim(form.direccionEstado),
    direccionCodigoPostal: trim(form.direccionCodigoPostal),
    direccionReferencia: trim(form.direccionReferencia),
    telefono: onlyPhoneChars(form.telefono),
    whatsapp: onlyPhoneChars(form.whatsapp),
    correo: trim(form.correo).toLowerCase(),
    horarioOperacion: composeHorario({ ...form, horarioConfig }),
    horarioConfig: JSON.stringify(horarioConfig),
    horarioLunesViernesApertura:
      horarioConfig.weekdays.status === "OPEN" ? trim(horarioConfig.weekdays.open) : "",
    horarioLunesViernesCierre:
      horarioConfig.weekdays.status === "OPEN" ? trim(horarioConfig.weekdays.close) : "",
    horarioSabadoDomingoApertura:
      horarioConfig.weekend.status === "OPEN" ? trim(horarioConfig.weekend.open) : "",
    horarioSabadoDomingoCierre:
      horarioConfig.weekend.status === "OPEN" ? trim(horarioConfig.weekend.close) : "",
    horarioSabadoDomingoCerrado: legacyWeekendClosed,
    horarioNotas: trim(form.horarioNotas),
    moneda: trim(form.moneda).toUpperCase() || "MXN",
    zonaHoraria: trim(form.zonaHoraria) || "America/Mexico_City",
    logoNombre: trim(form.logoNombre),
    logoMimeType: trim(form.logoMimeType),
    logoBase64: trim(form.logoBase64),
  };
};

const getInitials = (name = "") => {
  const parts = trim(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return "GO";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const logoSrc = (form = {}) => {
  if (!form.logoBase64 || !form.logoMimeType) return "";
  if (form.logoBase64.startsWith("data:image/")) return form.logoBase64;
  return `data:${form.logoMimeType};base64,${form.logoBase64}`;
};

const formatDate = (value) => {
  if (!value) return "Sin cambios";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin cambios";
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StoreConfigForm = forwardRef(function StoreConfigForm(_, ref) {
  const toast = useRef(null);
  const fileInputRef = useRef(null);
  const [empresa, setEmpresa] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [savedForm, setSavedForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
  const [referenceDraft, setReferenceDraft] = useState("");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [logoPreviewOpen, setLogoPreviewOpen] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(buildPayload(form)) !== JSON.stringify(buildPayload(savedForm)),
    [form, savedForm]
  );
  const initials = useMemo(() => getInitials(form.nombre), [form.nombre]);
  const currentLogo = useMemo(() => logoSrc(form), [form]);
  const horarioResumen = useMemo(() => composeHorario(form), [form]);
  const direccionResumen = useMemo(() => composeDireccion(form), [form]);

  const applyEmpresa = useCallback((raw) => {
    const normalized = normalizeEmpresa(raw);
    const nextForm = toForm(normalized);
    setEmpresa(normalized);
    setForm(nextForm);
    setSavedForm(nextForm);
    setErrors({});
  }, []);

  const loadTienda = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.fetchApi({}, "GET", undefined, endpoints.empresaActual);
      const payload = await readApiPayload(response, "empresa actual");
      applyEmpresa(payload);
    } catch (error) {
      console.error("No se pudo cargar la tienda:", error);
      setLoadError(error?.message || "No se pudo cargar la configuracion de tienda.");
    } finally {
      setLoading(false);
    }
  }, [applyEmpresa]);

  useImperativeHandle(ref, () => ({ refresh: loadTienda }), [loadTienda]);

  useEffect(() => {
    loadTienda();
  }, [loadTienda]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!dirty) return undefined;
      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const updateScheduleMode = (mode) => {
    setForm((current) => ({
      ...current,
      horarioConfig: {
        ...normalizeScheduleConfig(current.horarioConfig),
        mode,
      },
    }));
    setErrors({});
  };

  const updateScheduleRule = (section, key, patch) => {
    setForm((current) => {
      const config = normalizeScheduleConfig(current.horarioConfig);
      if (section === "days") {
        config.days = {
          ...config.days,
          [key]: normalizeRule({ ...config.days[key], ...patch }, config.days[key]),
        };
      } else if (section === "exceptions") {
        config.exceptions = {
          ...config.exceptions,
          [key]: normalizeRule({ ...config.exceptions[key], ...patch }, config.base),
        };
      } else {
        config[section] = normalizeRule({ ...config[section], ...patch }, config[section]);
        if (section === "weekdays" || section === "weekend") {
          config.days = createDaysFromRules(config.weekdays, config.weekend);
        }
        if (section === "base" && config.mode === "EXCEPTIONS") {
          config.base = normalizeRule({ ...config.base, ...patch }, config.base);
        }
      }
      return { ...current, horarioConfig: config };
    });
    setErrors({});
  };

  const toggleExceptionDay = (dayKey) => {
    setForm((current) => {
      const config = normalizeScheduleConfig(current.horarioConfig);
      const exceptions = { ...config.exceptions };
      if (exceptions[dayKey]) {
        delete exceptions[dayKey];
      } else {
        exceptions[dayKey] =
          config.base.status === "OPEN"
            ? createRule("CLOSED")
            : createRule("OPEN", "09:00", "16:00");
      }
      return {
        ...current,
        horarioConfig: { ...config, exceptions },
      };
    });
    setErrors({});
  };

  const validateScheduleRule = (rule, openKey, closeKey) => {
    const normalized = normalizeRule(rule);
    if (normalized.status !== "OPEN") return {};
    const result = {};
    if (!normalized.open) result[openKey] = "Falta apertura.";
    if (!normalized.close) result[closeKey] = "Falta cierre.";
    if (normalized.open && normalized.close && timeToMinutes(normalized.close) <= timeToMinutes(normalized.open)) {
      result[closeKey] = "Cierre posterior a apertura.";
    }
    return result;
  };

  const validate = () => {
    const nextErrors = {};
    const payload = buildPayload(form);

    if (!payload.nombre) nextErrors.nombre = "Obligatorio.";
    if (payload.telefono && !/^\+?\d{10,13}$/.test(payload.telefono)) {
      nextErrors.telefono = "10 a 13 digitos.";
    }
    if (payload.whatsapp && !/^\+?\d{10,13}$/.test(payload.whatsapp)) {
      nextErrors.whatsapp = "10 a 13 digitos.";
    }
    if (payload.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correo)) {
      nextErrors.correo = "Correo no valido.";
    }
    if (payload.rfc && !/^[A-Z&\u00d1]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(payload.rfc)) {
      nextErrors.rfc = "RFC no valido.";
    }
    if (!CURRENCY_VALUES.has(payload.moneda)) {
      nextErrors.moneda = "Moneda no valida.";
    }
    if (!TIME_ZONE_VALUES.has(payload.zonaHoraria)) {
      nextErrors.zonaHoraria = "Zona no valida.";
    }

    const scheduleConfig = normalizeScheduleConfig(form.horarioConfig);
    if (scheduleConfig.mode === "ALL_DAYS") {
      Object.assign(
        nextErrors,
        validateScheduleRule(scheduleConfig.base, "schedule.base.open", "schedule.base.close")
      );
    }
    if (scheduleConfig.mode === "WEEKDAY_WEEKEND") {
      Object.assign(
        nextErrors,
        validateScheduleRule(
          scheduleConfig.weekdays,
          "schedule.weekdays.open",
          "schedule.weekdays.close"
        ),
        validateScheduleRule(scheduleConfig.weekend, "schedule.weekend.open", "schedule.weekend.close")
      );
    }
    if (scheduleConfig.mode === "EXCEPTIONS") {
      Object.assign(
        nextErrors,
        validateScheduleRule(scheduleConfig.base, "schedule.base.open", "schedule.base.close")
      );
      Object.entries(scheduleConfig.exceptions).forEach(([day, rule]) => {
        Object.assign(
          nextErrors,
          validateScheduleRule(rule, `schedule.exceptions.${day}.open`, `schedule.exceptions.${day}.close`)
        );
      });
    }
    if (scheduleConfig.mode === "CUSTOM") {
      WEEK_DAYS.forEach((day) => {
        Object.assign(
          nextErrors,
          validateScheduleRule(
            scheduleConfig.days[day.key],
            `schedule.days.${day.key}.open`,
            `schedule.days.${day.key}.close`
          )
        );
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (!validate()) {
      toast.current?.show({
        severity: "warn",
        summary: "Revisa Tienda",
        detail: "Hay campos con formato pendiente.",
        life: 2800,
      });
      return;
    }

    setSaving(true);
    try {
      const response = await api.fetchApi({}, "PUT", buildPayload(form), endpoints.empresaActual);
      const payload = await readApiPayload(response, "guardar tienda");
      applyEmpresa(payload);
      toast.current?.show({
        severity: "success",
        summary: "Tienda actualizada",
        detail: "La configuracion quedo persistida.",
        life: 2800,
      });
    } catch (error) {
      console.error("No se pudo guardar la tienda:", error);
      toast.current?.show({
        severity: "error",
        summary: "No se guardo",
        detail: error?.message || "No se pudo actualizar Tienda.",
        life: 4200,
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmReset = () => {
    if (!dirty) {
      setForm(savedForm);
      setErrors({});
      return;
    }

    confirmDialog({
      header: "Descartar cambios",
      message: "Hay cambios sin guardar. Si continuas, se perderan.",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Descartar",
      rejectLabel: "Volver",
      acceptClassName: "tda-danger-btn",
      rejectClassName: "tda-text-btn",
      accept: () => {
        setForm(savedForm);
        setErrors({});
      },
    });
  };

  const handleLogoFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) {
      toast.current?.show({
        severity: "warn",
        summary: "Logo no valido",
        detail: "Usa PNG, JPG, WEBP o SVG.",
        life: 3000,
      });
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      toast.current?.show({
        severity: "warn",
        summary: "Logo muy pesado",
        detail: "Usa una imagen menor a 500 KB.",
        life: 3000,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      setForm((current) => ({
        ...current,
        logoNombre: file.name,
        logoMimeType: file.type,
        logoBase64: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setForm((current) => ({
      ...current,
      logoNombre: "",
      logoMimeType: "",
      logoBase64: "",
    }));
  };

  const openReferenceDialog = () => {
    setReferenceDraft(form.direccionReferencia || "");
    setReferenceDialogOpen(true);
  };

  const saveReferenceDialog = () => {
    updateField("direccionReferencia", referenceDraft);
    setReferenceDialogOpen(false);
  };

  const renderFieldError = (name) =>
    errors[name] ? <small className="tda-field-error">{errors[name]}</small> : null;

  const dropdownProps = {
    filter: true,
    optionLabel: "label",
    optionValue: "value",
    panelClassName: "tda-select-panel",
    emptyFilterMessage: "Sin resultados",
  };

  const simpleDropdownProps = {
    optionLabel: "label",
    optionValue: "value",
    panelClassName: "tda-select-panel",
  };

  const scheduleConfig = normalizeScheduleConfig(form.horarioConfig);
  const currentScheduleModeLabel =
    SCHEDULE_MODE_OPTIONS.find((option) => option.value === scheduleConfig.mode)?.label ||
    "Horario operativo";

  const renderScheduleRule = (title, section, key, rule) => {
    const path = key ? `schedule.${section}.${key}` : `schedule.${section}`;
    const normalized = normalizeRule(rule);
    const updateRule = (patch) => updateScheduleRule(section, key, patch);

    return (
      <div className={`tda-rule-card ${normalized.status !== "OPEN" ? "is-static" : ""}`}>
        <div className="tda-rule-name">
          <strong>{title}</strong>
          <span>{normalized.status === "OPEN" ? "Horario activo" : scheduleRuleText(normalized)}</span>
        </div>
        <Dropdown
          value={normalized.status}
          options={RULE_STATUS_OPTIONS}
          onChange={(event) => updateRule({ status: event.value })}
          className="tda-rule-status"
          {...simpleDropdownProps}
        />
        {normalized.status === "OPEN" ? (
          <div className="tda-time-range">
            <label className="tda-time-field">
              <span>Apertura</span>
              <Calendar
                value={timeStringToDate(normalized.open)}
                onChange={(event) => updateRule({ open: dateToTimeString(event.value) })}
                timeOnly
                hourFormat="24"
                showIcon
                icon="pi pi-clock"
                placeholder="08:00"
                className={`tda-time-calendar ${errors[`${path}.open`] ? "p-invalid" : ""}`}
                panelClassName="tda-time-panel"
              />
              {renderFieldError(`${path}.open`)}
            </label>
            <label className="tda-time-field">
              <span>Cierre</span>
              <Calendar
                value={timeStringToDate(normalized.close)}
                onChange={(event) => updateRule({ close: dateToTimeString(event.value) })}
                timeOnly
                hourFormat="24"
                showIcon
                icon="pi pi-clock"
                placeholder="20:00"
                className={`tda-time-calendar ${errors[`${path}.close`] ? "p-invalid" : ""}`}
                panelClassName="tda-time-panel"
              />
              {renderFieldError(`${path}.close`)}
            </label>
          </div>
        ) : (
          <div className="tda-rule-static">{scheduleRuleText(normalized)}</div>
        )}
      </div>
    );
  };

  const renderScheduleBody = () => {
    if (scheduleConfig.mode === "ALWAYS_OPEN") {
      return (
        <div className="tda-schedule-state-card">
          <i className="pi pi-clock" />
          <div>
            <strong>Abierto 24 horas todos los dias</strong>
            <span>Sin apertura ni cierre por capturar.</span>
          </div>
        </div>
      );
    }

    if (scheduleConfig.mode === "TEMP_CLOSED") {
      return (
        <div className="tda-schedule-state-card is-closed">
          <i className="pi pi-ban" />
          <div>
            <strong>Cerrado temporalmente</strong>
            <span>La tienda queda marcada sin horario operativo.</span>
          </div>
        </div>
      );
    }

    if (scheduleConfig.mode === "ALL_DAYS") {
      return (
        <div className="tda-rule-grid is-single">
          {renderScheduleRule("Todos los dias", "base", null, scheduleConfig.base)}
        </div>
      );
    }

    if (scheduleConfig.mode === "EXCEPTIONS") {
      return (
        <div className="tda-exception-flow">
          {renderScheduleRule("Horario base", "base", null, scheduleConfig.base)}
          <div className="tda-day-picker">
            {WEEK_DAYS.map((day) => (
              <button
                key={day.key}
                type="button"
                className={`tda-day-chip ${scheduleConfig.exceptions[day.key] ? "is-active" : ""}`}
                onClick={() => toggleExceptionDay(day.key)}
              >
                {day.short}
              </button>
            ))}
          </div>
          {Object.keys(scheduleConfig.exceptions).length ? (
            <div className="tda-custom-days">
              {WEEK_DAYS.filter((day) => scheduleConfig.exceptions[day.key]).map((day) =>
                renderScheduleRule(day.label, "exceptions", day.key, scheduleConfig.exceptions[day.key])
              )}
            </div>
          ) : null}
        </div>
      );
    }

    if (scheduleConfig.mode === "CUSTOM") {
      return (
        <div className="tda-custom-days">
          {WEEK_DAYS.map((day) =>
            renderScheduleRule(day.label, "days", day.key, scheduleConfig.days[day.key])
          )}
        </div>
      );
    }

    return (
      <div className="tda-rule-grid">
        {renderScheduleRule("Lunes a viernes", "weekdays", null, scheduleConfig.weekdays)}
        {renderScheduleRule("Sabado y domingo", "weekend", null, scheduleConfig.weekend)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tda-page">
        <div className="tda-form-shell">
          <div className="tda-workspace">
            <Skeleton height="100%" borderRadius="12px" />
            <Skeleton height="100%" borderRadius="12px" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="tda-page">
        <div className="tda-error">
          <span className="tda-error-icon">
            <i className="pi pi-cloud-slash" />
          </span>
          <div>
            <strong>No se pudo cargar Tienda</strong>
            <p>{loadError}</p>
          </div>
          <Button
            label="Reintentar"
            icon="pi pi-refresh"
            className="tda-secondary-btn"
            onClick={loadTienda}
            type="button"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="tda-page tda-page--ready">
      <Toast ref={toast} />
      <ConfirmDialog className="tda-confirm-dialog" />
      <Dialog
        header="Referencia operativa"
        visible={referenceDialogOpen}
        onHide={() => setReferenceDialogOpen(false)}
        className="tda-reference-dialog"
        draggable={false}
        resizable={false}
        modal
        footer={
          <div className="tda-dialog-actions">
            <Button
              label="Cancelar"
              className="tda-text-btn"
              onClick={() => setReferenceDialogOpen(false)}
              type="button"
            />
            <Button
              label="Guardar referencia"
              icon="pi pi-check"
              className="tda-primary-btn"
              onClick={saveReferenceDialog}
              type="button"
            />
          </div>
        }
      >
        <label className="tda-field tda-reference-modal-field">
          <span>Detalle operativo</span>
          <InputTextarea
            value={referenceDraft}
            onChange={(event) => setReferenceDraft(event.target.value)}
            placeholder="Entre calles, punto de entrega, acceso para proveedores o nota interna."
            rows={7}
            maxLength={500}
          />
        </label>
      </Dialog>
      <Dialog
        header="Horario operativo"
        visible={scheduleDialogOpen}
        onHide={() => setScheduleDialogOpen(false)}
        className="tda-schedule-dialog"
        draggable={false}
        resizable={false}
        modal
        footer={
          <div className="tda-dialog-actions">
            <Button
              label="Listo"
              icon="pi pi-check"
              className="tda-primary-btn"
              onClick={() => setScheduleDialogOpen(false)}
              type="button"
            />
          </div>
        }
      >
        <div className="tda-schedule-modal">
          <div className="tda-schedule-toolbar">
            <label className="tda-field">
              <span>Flujo de horario</span>
              <Dropdown
                value={scheduleConfig.mode}
                options={SCHEDULE_MODE_OPTIONS}
                onChange={(event) => updateScheduleMode(event.value)}
                placeholder="Selecciona flujo"
                {...simpleDropdownProps}
              />
            </label>
            <div className="tda-schedule-preview">
              <i className="pi pi-clock" />
              <span>{horarioResumen || "Sin horario definido"}</span>
            </div>
          </div>

          {renderScheduleBody()}

          <label className="tda-field tda-schedule-notes">
            <span>Notas de horario</span>
            <InputTextarea
              value={form.horarioNotas}
              onChange={(event) => updateField("horarioNotas", event.target.value)}
              placeholder="Ej. Festivos, entregas o excepciones temporales."
              rows={2}
              maxLength={255}
            />
          </label>
        </div>
      </Dialog>
      <Dialog
        header="Vista previa del logo"
        visible={logoPreviewOpen}
        onHide={() => setLogoPreviewOpen(false)}
        className="tda-logo-dialog"
        draggable={false}
        resizable={false}
        modal
      >
        <div className="tda-logo-preview-modal">
          <div className="tda-logo-preview-mark">
            {currentLogo ? <img src={currentLogo} alt="" /> : <span>{initials}</span>}
          </div>
          <div>
            <strong>{form.nombre || "Galtek One"}</strong>
            <span>{form.logoNombre || "Sin archivo cargado"}</span>
          </div>
        </div>
      </Dialog>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="tda-file-input"
        onChange={handleLogoFile}
      />

      <form className="tda-form-shell" onSubmit={save}>
        <div className="tda-workspace">
          <section className="tda-panel tda-section-card tda-identity-card">
            <div className="tda-panel-head">
              <span className="tda-step">01</span>
              <div>
                <h4>Datos de tienda</h4>
                <p>Identidad, contacto y direccion operativa.</p>
              </div>
            </div>

            <div className="tda-grid">
              <label className="tda-field span-2">
                <span>Nombre comercial</span>
                <InputText
                  value={form.nombre}
                  onChange={(event) => updateField("nombre", event.target.value)}
                  className={errors.nombre ? "p-invalid" : ""}
                  placeholder="Abarrotes La Esquina"
                  maxLength={120}
                />
                {renderFieldError("nombre")}
              </label>

              <label className="tda-field span-2">
                <span>Razon social</span>
                <InputText
                  value={form.razonSocial}
                  onChange={(event) => updateField("razonSocial", event.target.value)}
                  placeholder="Opcional"
                  maxLength={160}
                />
              </label>

              <label className="tda-field">
                <span>RFC</span>
                <InputText
                  value={form.rfc}
                  onChange={(event) => updateField("rfc", event.target.value.toUpperCase())}
                  className={errors.rfc ? "p-invalid" : ""}
                  placeholder="Opcional"
                  maxLength={13}
                />
                {renderFieldError("rfc")}
              </label>

              <label className="tda-field">
                <span>Telefono</span>
                <InputText
                  value={form.telefono}
                  onChange={(event) => updateField("telefono", onlyPhoneChars(event.target.value))}
                  className={errors.telefono ? "p-invalid" : ""}
                  placeholder="5551234567"
                />
                {renderFieldError("telefono")}
              </label>

              <label className="tda-field">
                <span>WhatsApp</span>
                <InputText
                  value={form.whatsapp}
                  onChange={(event) => updateField("whatsapp", onlyPhoneChars(event.target.value))}
                  className={errors.whatsapp ? "p-invalid" : ""}
                  placeholder="5551234567"
                />
                {renderFieldError("whatsapp")}
              </label>

              <label className="tda-field">
                <span>Correo</span>
                <InputText
                  value={form.correo}
                  onChange={(event) => updateField("correo", event.target.value)}
                  className={errors.correo ? "p-invalid" : ""}
                  placeholder="tienda@correo.com"
                  maxLength={160}
                />
                {renderFieldError("correo")}
              </label>
            </div>
          </section>

          <section className="tda-panel tda-section-card tda-address-card">
            <div className="tda-panel-head">
              <span className="tda-step">02</span>
              <div>
                <h4>Direccion</h4>
                <p>{direccionResumen || "Sin direccion capturada"}</p>
              </div>
            </div>

            <div className="tda-grid tda-address-grid">
              <label className="tda-field span-2">
                <span>Calle o avenida</span>
                <InputText
                  value={form.direccionCalle}
                  onChange={(event) => updateField("direccionCalle", event.target.value)}
                  placeholder="Ej. Av. Central"
                  maxLength={160}
                />
              </label>

              <label className="tda-field">
                <span>No. exterior</span>
                <InputText
                  value={form.direccionNumeroExterior}
                  onChange={(event) => updateField("direccionNumeroExterior", event.target.value)}
                  placeholder="120"
                  maxLength={60}
                />
              </label>

              <label className="tda-field">
                <span>No. interior</span>
                <InputText
                  value={form.direccionNumeroInterior}
                  onChange={(event) => updateField("direccionNumeroInterior", event.target.value)}
                  placeholder="4B"
                  maxLength={60}
                />
              </label>

              <label className="tda-field">
                <span>Colonia o zona</span>
                <InputText
                  value={form.direccionColonia}
                  onChange={(event) => updateField("direccionColonia", event.target.value)}
                  placeholder="Centro"
                  maxLength={120}
                />
              </label>

              <label className="tda-field">
                <span>Municipio o ciudad</span>
                <InputText
                  value={form.direccionMunicipio}
                  onChange={(event) => updateField("direccionMunicipio", event.target.value)}
                  placeholder="Cuauhtemoc"
                  maxLength={120}
                />
              </label>

              <label className="tda-field">
                <span>Estado</span>
                <InputText
                  value={form.direccionEstado}
                  onChange={(event) => updateField("direccionEstado", event.target.value)}
                  placeholder="Ciudad de Mexico"
                  maxLength={120}
                />
              </label>

              <label className="tda-field">
                <span>Codigo postal</span>
                <InputText
                  value={form.direccionCodigoPostal}
                  onChange={(event) => updateField("direccionCodigoPostal", event.target.value)}
                  placeholder="06000"
                  maxLength={30}
                />
              </label>

              <div className="tda-reference-row">
                <div>
                  <span>Referencia operativa</span>
                  <strong>{trim(form.direccionReferencia) || "Sin referencia operativa"}</strong>
                </div>
                <Button
                  label={trim(form.direccionReferencia) ? "Editar" : "Agregar"}
                  icon="pi pi-pencil"
                  className="tda-secondary-btn tda-reference-btn"
                  onClick={openReferenceDialog}
                  type="button"
                />
              </div>
            </div>
          </section>

          <section className="tda-panel tda-section-card tda-schedule-summary-card">
            <div className="tda-panel-head">
              <span className="tda-step">03</span>
              <div>
                <h4>Horario operativo</h4>
                <p>{horarioResumen || "Sin horario definido"}</p>
              </div>
            </div>

            <div className="tda-schedule-overview-card">
              <div className="tda-overview-row">
                <i className="pi pi-calendar" />
                <div>
                  <span>Flujo actual</span>
                  <strong>{currentScheduleModeLabel}</strong>
                </div>
              </div>
              <div className="tda-overview-row">
                <i className="pi pi-clock" />
                <div>
                  <span>Resumen operativo</span>
                  <strong>{horarioResumen || "Sin horario definido"}</strong>
                </div>
              </div>
              <Button
                label="Configurar horario"
                icon="pi pi-pencil"
                className="tda-secondary-btn tda-schedule-config-btn"
                onClick={() => setScheduleDialogOpen(true)}
                type="button"
              />
            </div>
          </section>

          <section className="tda-panel tda-section-card tda-logo-card">
            <div className="tda-panel-head">
              <span className="tda-step">04</span>
              <div>
                <h4>Logo</h4>
                <p>PNG, JPG, WEBP o SVG.</p>
              </div>
            </div>

            <div className="tda-logo-panel">
              <button
                className="tda-logo-preview-card"
                type="button"
                onClick={() => setLogoPreviewOpen(true)}
              >
                <span className="tda-logo-preview-image">
                  {currentLogo ? <img src={currentLogo} alt="" /> : initials}
                </span>
                <span className="tda-logo-preview-copy">
                  <small>Vista previa</small>
                  <strong>{form.nombre || "Galtek One"}</strong>
                  <em>{form.logoNombre || "Sin archivo cargado"}</em>
                </span>
              </button>
              <div className="tda-logo-large" aria-hidden="true">
                {currentLogo ? <img src={currentLogo} alt="" /> : <span>{initials}</span>}
              </div>
              <div className="tda-logo-actions">
                <Button
                  label="Cambiar"
                  icon="pi pi-image"
                  className="tda-secondary-btn"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                />
                <Button
                  icon="pi pi-times"
                  className="tda-icon-btn"
                  onClick={removeLogo}
                  disabled={!form.logoBase64}
                  type="button"
                  aria-label="Quitar logo"
                />
              </div>
              <small>{form.logoNombre || "Sin archivo cargado"}</small>
            </div>
          </section>

          <section className="tda-panel tda-section-card tda-regional-card">
            <div className="tda-panel-head">
              <span className="tda-step">05</span>
              <div>
                <h4>Regional</h4>
                <p>Moneda y zona horaria.</p>
              </div>
            </div>

            <div className="tda-side-grid">
              <label className="tda-field">
                <span>Moneda</span>
                <Dropdown
                  value={form.moneda}
                  options={CURRENCY_OPTIONS}
                  onChange={(event) => updateField("moneda", event.value)}
                  className={errors.moneda ? "p-invalid" : ""}
                  placeholder="Selecciona moneda"
                  {...dropdownProps}
                />
                {renderFieldError("moneda")}
              </label>

              <label className="tda-field">
                <span>Zona horaria</span>
                <Dropdown
                  value={form.zonaHoraria}
                  options={TIME_ZONE_OPTIONS}
                  onChange={(event) => updateField("zonaHoraria", event.value)}
                  className={errors.zonaHoraria ? "p-invalid" : ""}
                  placeholder="Selecciona zona"
                  {...dropdownProps}
                />
                {renderFieldError("zonaHoraria")}
              </label>
            </div>
          </section>
        </div>

        <footer className="tda-footer">
          <div className="tda-meta">
            <span className={`tda-sync-state ${dirty ? "is-dirty" : ""}`}>
              <i className={dirty ? "pi pi-pencil" : "pi pi-check-circle"} />
              {dirty ? "Sin guardar" : "Guardado"}
            </span>
            <span>{empresa?.tipoSuscripcion || "Local escritorio"}</span>
            <span>Empresa #{empresa?.idEmpresa || "--"}</span>
            <span>Ultimo cambio: {formatDate(empresa?.fechaModificacion)}</span>
          </div>

          <div className="tda-actions">
            <Button
              label="Cancelar"
              className="tda-text-btn"
              onClick={confirmReset}
              disabled={saving || !dirty}
              type="button"
            />
            <Button
              label={saving ? "Guardando" : "Guardar cambios"}
              icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
              className="tda-primary-btn"
              disabled={saving || !dirty}
              type="submit"
            />
          </div>
        </footer>
      </form>
    </div>
  );
});

export default StoreConfigForm;
