export const CATEGORY_OTHER_VALUE = "__OTRA_CATEGORIA__";

export const VISIT_DAY_MODE_OPTIONS = [
  { label: "Dias de la semana", value: "SEMANA" },
  { label: "Dias del mes", value: "MES" },
];

export const WEEK_DAY_OPTIONS = [
  { label: "Lunes", value: "LUNES" },
  { label: "Martes", value: "MARTES" },
  { label: "Miercoles", value: "MIERCOLES" },
  { label: "Jueves", value: "JUEVES" },
  { label: "Viernes", value: "VIERNES" },
  { label: "Sabado", value: "SABADO" },
  { label: "Domingo", value: "DOMINGO" },
];

export const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;
  return { label: `Dia ${day}`, value: day };
});

export const SCHEDULE_MODE_OPTIONS = [
  { label: "Rango de horario", value: "RANGO" },
  { label: "Hora especifica", value: "HORA" },
  { label: "Sin horario fijo", value: "SIN_HORARIO" },
];

export const LEAD_TIME_UNIT_OPTIONS = [
  { label: "Minutos", value: "MINUTOS" },
  { label: "Horas", value: "HORAS" },
  { label: "Dias", value: "DIAS" },
];

export const LEAD_TIME_CONTEXT_OPTIONS = [
  { label: "Entrega recurrente", value: "ENTREGA_RECURRENTE" },
  { label: "Entrega a domicilio", value: "ENTREGA_DOMICILIO" },
  { label: "Compra en mostrador", value: "COMPRA_MOSTRADOR" },
];

const trim = (value) => (value == null ? "" : String(value).trim());

const emptyAddressFields = {
  direccionCalle: "",
  direccionNumeroExterior: "",
  direccionNumeroInterior: "",
  direccionColonia: "",
  direccionMunicipio: "",
  direccionEstado: "",
  direccionCodigoPostal: "",
  direccionReferencia: "",
  direccionEsLegacy: false,
};

const normalizeComparable = (value) =>
  trim(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const sanitizePhoneInput = (value) => {
  const raw = String(value || "").replace(/[^\d+]/g, "");
  const hasPlus = raw.includes("+");
  const digits = raw.replace(/\+/g, "");
  const maxDigits = hasPlus ? 13 : 10;
  return `${hasPlus ? "+" : ""}${digits.slice(0, maxDigits)}`;
};

export const isValidPhone = (value) => {
  const text = trim(value);
  return !text || /^\d{10}$/.test(text) || /^\+\d{11,13}$/.test(text);
};

export const sanitizeEmailInput = (value) =>
  String(value || "").replace(/\s/g, "").toLowerCase().slice(0, 120);

export const isValidEmail = (value) => {
  const text = trim(value);
  return !text || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text);
};

const resolveAddressKey = (label) => {
  const normalized = normalizeComparable(label);
  const compact = normalized.replace(/[.\s]/g, "");
  if (normalized.includes("calle") || normalized.includes("avenida")) return "direccionCalle";
  if (
    normalized.includes("exterior") ||
    normalized === "no ext" ||
    compact === "noext" ||
    compact === "numext" ||
    normalized === "no"
  ) {
    return "direccionNumeroExterior";
  }
  if (
    normalized.includes("interior") ||
    normalized === "no int" ||
    compact === "noint" ||
    compact === "numint"
  ) {
    return "direccionNumeroInterior";
  }
  if (normalized.includes("colonia") || normalized.includes("zona")) return "direccionColonia";
  if (normalized.includes("municipio") || normalized.includes("ciudad")) {
    return "direccionMunicipio";
  }
  if (normalized.includes("estado")) return "direccionEstado";
  if (normalized === "cp" || normalized.includes("codigo postal")) {
    return "direccionCodigoPostal";
  }
  if (normalized.includes("referencia")) return "direccionReferencia";
  return "";
};

export const parseAddressText = (value) => {
  const text = trim(value);
  if (!text) return { ...emptyAddressFields };

  const fields = { ...emptyAddressFields };
  let matched = false;

  text.split(/\s*[|;]\s*/).forEach((part) => {
    const separatorIndex = part.indexOf(":");
    if (separatorIndex < 0) return;

    const key = resolveAddressKey(part.slice(0, separatorIndex));
    const nextValue = trim(part.slice(separatorIndex + 1));
    if (!key || !nextValue) return;

    fields[key] = nextValue;
    matched = true;
  });

  if (matched) return fields;
  return {
    ...fields,
    direccionReferencia: text,
    direccionEsLegacy: true,
  };
};

export const buildAddressText = (fields = {}) => {
  const parts = [
    ["Calle", fields.direccionCalle],
    ["No. ext.", fields.direccionNumeroExterior],
    ["No. int.", fields.direccionNumeroInterior],
    ["Colonia", fields.direccionColonia],
    ["Municipio", fields.direccionMunicipio],
    ["Estado", fields.direccionEstado],
    ["CP", fields.direccionCodigoPostal],
  ].filter(([, value]) => trim(value));

  if ((!fields.direccionEsLegacy || parts.length > 0) && trim(fields.direccionReferencia)) {
    parts.push(["Referencia", fields.direccionReferencia]);
  }

  return parts.map(([label, value]) => `${label}: ${trim(value)}`).join(" | ");
};

export const buildVisitDaysText = (mode, weekDays = [], monthDays = []) => {
  if (mode === "MES") {
    const days = [...new Set(monthDays)]
      .map((day) => Number(day))
      .filter((day) => day >= 1 && day <= 31)
      .sort((a, b) => a - b);
    return days.length ? `Dias ${days.join(", ")} del mes` : "";
  }

  const selected = WEEK_DAY_OPTIONS.filter((day) => weekDays.includes(day.value)).map(
    (day) => day.label
  );
  return selected.join(", ");
};

export const parseVisitDaysText = (value) => {
  const text = trim(value);
  const normalized = normalizeComparable(text);

  if (normalized.includes("mes")) {
    const diasMes = [...text.matchAll(/\d{1,2}/g)]
      .map((match) => Number(match[0]))
      .filter((day) => day >= 1 && day <= 31);
    return {
      diasVisitaModo: "MES",
      diasSemanaVisita: [],
      diasMesVisita: [...new Set(diasMes)],
    };
  }

  const diasSemanaVisita = WEEK_DAY_OPTIONS.filter((day) =>
    normalized.includes(normalizeComparable(day.label))
  ).map((day) => day.value);

  return {
    diasVisitaModo: "SEMANA",
    diasSemanaVisita,
    diasMesVisita: [],
  };
};

export const buildScheduleText = (mode, startTime, endTime) => {
  if (mode === "SIN_HORARIO") return "Sin horario fijo";
  if (mode === "HORA") return trim(startTime);
  if (startTime && endTime) return `${startTime} a ${endTime}`;
  return "";
};

export const parseScheduleText = (value) => {
  const text = trim(value);
  const normalized = normalizeComparable(text);
  if (!text) {
    return { horarioModo: "RANGO", horarioInicio: "", horarioFin: "" };
  }

  if (normalized.includes("sin horario")) {
    return { horarioModo: "SIN_HORARIO", horarioInicio: "", horarioFin: "" };
  }

  const times = text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || [];
  if (times.length >= 2) {
    return { horarioModo: "RANGO", horarioInicio: times[0], horarioFin: times[1] };
  }
  if (times.length === 1) {
    return { horarioModo: "HORA", horarioInicio: times[0], horarioFin: "" };
  }
  return { horarioModo: "RANGO", horarioInicio: "", horarioFin: "" };
};

export const timeStringToDate = (value) => {
  const match = trim(value).match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
};

export const dateToTimeString = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const unitLabel = (unit, amount) => {
  const plural = Number(amount) !== 1;
  if (unit === "MINUTOS") return plural ? "minutos" : "minuto";
  if (unit === "DIAS") return plural ? "dias" : "dia";
  return plural ? "horas" : "hora";
};

const contextLabel = (context) =>
  LEAD_TIME_CONTEXT_OPTIONS.find((option) => option.value === context)?.label.toLowerCase() ||
  "entrega recurrente";

export const buildLeadTimeText = (amount, unit, context) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return "";

  const phrase =
    context === "COMPRA_MOSTRADOR"
      ? "Considerar espera de"
      : "Pedir con anticipacion de";
  return `${phrase} ${numericAmount} ${unitLabel(unit, numericAmount)} para ${contextLabel(
    context
  )}`;
};

export const parseLeadTimeText = (value) => {
  const text = trim(value);
  const normalized = normalizeComparable(text);
  const amountMatch = text.match(/\d+(\.\d+)?/);

  return {
    anticipacionCantidad: amountMatch ? Number(amountMatch[0]) : null,
    anticipacionUnidad: normalized.includes("dia")
      ? "DIAS"
      : normalized.includes("minuto")
      ? "MINUTOS"
      : "HORAS",
    anticipacionContexto: normalized.includes("mostrador")
      ? "COMPRA_MOSTRADOR"
      : normalized.includes("domicilio")
      ? "ENTREGA_DOMICILIO"
      : "ENTREGA_RECURRENTE",
  };
};
