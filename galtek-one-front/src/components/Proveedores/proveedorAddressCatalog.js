import sepomexCatalog from "./sepomexCatalog.json";

const toOption = (value) => ({ label: value, value });

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeKey = (value) => normalizeText(value).toLowerCase();

const uniqueSorted = (values = []) =>
  [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es-MX")
  );

const optionsFromValues = (values = []) => uniqueSorted(values).map(toOption);

const findInsensitive = (values = [], target) => {
  const normalizedTarget = normalizeKey(target);
  if (!normalizedTarget) return "";
  return values.find((value) => normalizeKey(value) === normalizedTarget) || "";
};

const addressKey = (estado, municipio) => `${estado}|${municipio}`;

export const MX_STATE_OPTIONS = sepomexCatalog.s.map(toOption);
export const SEPOMEX_UPDATED = sepomexCatalog.updated;

export const appendCurrentOption = (options = [], currentValue) => {
  const current = String(currentValue || "").trim();
  if (!current || options.some((option) => option.value === current)) return options;
  return [toOption(current), ...options];
};

export const resolveStateName = (estado) => findInsensitive(sepomexCatalog.s, estado);

export const resolveMunicipioName = (estado, municipio) => {
  const officialState = resolveStateName(estado);
  if (!officialState) return "";
  return findInsensitive(sepomexCatalog.m[officialState] || [], municipio);
};

export const resolveColoniaName = (estado, municipio, colonia, extraColonias = []) => {
  const officialState = resolveStateName(estado);
  const officialMunicipio = resolveMunicipioName(officialState, municipio);
  if (!officialState || !officialMunicipio) return "";

  const colonias = [
    ...(sepomexCatalog.a[addressKey(officialState, officialMunicipio)] || []),
    ...extraColonias,
  ];
  return findInsensitive(colonias, colonia);
};

export const getMunicipioOptions = (estado, currentValue) => {
  const officialState = resolveStateName(estado);
  const municipios = officialState ? sepomexCatalog.m[officialState] || [] : [];
  return appendCurrentOption(optionsFromValues(municipios), currentValue);
};

export const getColoniaOptions = (estado, municipio, currentValue, extraColonias = []) => {
  const officialState = resolveStateName(estado);
  const officialMunicipio = resolveMunicipioName(officialState, municipio);
  const catalogColonias =
    officialState && officialMunicipio
      ? sepomexCatalog.a[addressKey(officialState, officialMunicipio)] || []
      : [];

  return appendCurrentOption(optionsFromValues([...catalogColonias, ...extraColonias]), currentValue);
};

export const hasMunicipioForEstado = (estado, municipio) =>
  Boolean(resolveMunicipioName(estado, municipio));

export const hasColoniaForMunicipio = (estado, municipio, colonia, extraColonias = []) =>
  Boolean(resolveColoniaName(estado, municipio, colonia, extraColonias));

const normalizePostalEntry = (entry) => {
  const firstEntry = Array.isArray(entry) ? entry[0] : entry;
  if (!firstEntry) return null;

  const colonias = Array.isArray(firstEntry.a) ? firstEntry.a : [];
  return {
    colonia: colonias[0] || "",
    colonias,
    municipio: firstEntry.m || "",
    estado: firstEntry.e || "",
  };
};

export const lookupPostalCodeMx = async (postalCode) =>
  normalizePostalEntry(sepomexCatalog.z[String(postalCode || "").trim()]);
