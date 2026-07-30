import {
  BLOCK_META,
  DEFAULT_CONFIG,
  DEFAULT_TEMPLATE,
  REQUIRED_BLOCK_TYPES,
} from "./ticketTemplateDefaults";

export const trim = (value) => (value == null ? "" : String(value).trim());

export const readApiPayload = async (response, label = "solicitud") => {
  if (!response) throw new Error(`Sin respuesta del servidor en ${label}`);
  const payload = await response.json().catch(() => null);
  const apiStatus = Number(payload?.statusCode || 0);

  if (!response.ok || apiStatus >= 400) {
    throw new Error(payload?.message || `Error HTTP ${response.status} en ${label}`);
  }

  return payload?.data;
};

export const parseTemplate = (templateJson) => {
  try {
    const parsed = typeof templateJson === "string" ? JSON.parse(templateJson) : templateJson;
    if (!parsed || !Array.isArray(parsed.blocks)) return DEFAULT_TEMPLATE;
    return ensureTemplateBlocks({
      version: Number(parsed.version || 1),
      blocks: parsed.blocks.map((item, index) => normalizeBlock(item, index)),
    });
  } catch {
    return DEFAULT_TEMPLATE;
  }
};

export const serializeTemplate = (template) =>
  JSON.stringify({
    version: Number(template?.version || 1),
    blocks: Array.isArray(template?.blocks) ? template.blocks.map(normalizeBlock) : DEFAULT_TEMPLATE.blocks,
  });

export const normalizeConfig = (payload = {}) => {
  const template = parseTemplate(payload.templateJson);
  return {
    ...DEFAULT_CONFIG,
    ...payload,
    defaultPrinterName: trim(payload.defaultPrinterName),
    footerMessage: trim(payload.footerMessage) || DEFAULT_CONFIG.footerMessage,
    copies: Number(payload.copies || 1),
    fontFamily: payload.fontFamily || DEFAULT_CONFIG.fontFamily,
    lineSpacing: payload.lineSpacing || DEFAULT_CONFIG.lineSpacing,
    marginSize: payload.marginSize || DEFAULT_CONFIG.marginSize,
    templateJson: serializeTemplate(template),
    tienda: payload.tienda || {},
  };
};

export const getTemplateFromConfig = (config) => parseTemplate(config?.templateJson);

export const patchTemplate = (config, updater) => {
  const template = getTemplateFromConfig(config);
  const nextTemplate = typeof updater === "function" ? updater(template) : template;
  return {
    ...config,
    templateJson: serializeTemplate(nextTemplate),
  };
};

export const updateBlock = (config, blockId, updater) =>
  patchTemplate(config, (template) => ({
    ...template,
    blocks: template.blocks.map((block) =>
      block.id === blockId
        ? normalizeBlock(typeof updater === "function" ? updater(block) : { ...block, ...updater })
        : block
    ),
  }));

export const moveBlock = (config, blockId, direction) =>
  patchTemplate(config, (template) => {
    const blocks = [...template.blocks];
    const index = blocks.findIndex((blockItem) => blockItem.id === blockId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return template;
    const [blockItem] = blocks.splice(index, 1);
    blocks.splice(nextIndex, 0, blockItem);
    return { ...template, blocks };
  });

export const addBlock = (config, type) =>
  patchTemplate(config, (template) => {
    const meta = BLOCK_META[type];
    if (!meta) return template;
    const id = `${type.toLowerCase().replace(/_/g, "-")}-${Date.now()}`;
    return {
      ...template,
      blocks: [
        ...template.blocks,
        normalizeBlock({
          id,
          type,
          label: meta.label,
          visible: true,
          required: REQUIRED_BLOCK_TYPES.has(type),
          settings: {
          align: "CENTRO",
          fontSize: "NORMAL",
          bold: false,
          italic: false,
          uppercase: false,
          separatorAfter: true,
          text: "",
          },
        }),
      ],
    };
  });

export const removeBlock = (config, blockId) =>
  patchTemplate(config, (template) => ({
    ...template,
    blocks: template.blocks.filter((block) => block.id !== blockId || block.required),
  }));

export const storeLogoSrc = (store = {}) => {
  const logo = trim(store.logoBase64);
  if (!logo) return "";
  if (logo.startsWith("data:")) return logo;
  return `data:${store.logoMimeType || "image/png"};base64,${logo}`;
};

export const buildAddress = (store = {}) => {
  const structured = [
    store.direccionCalle,
    withLabel("No.", store.direccionNumeroExterior),
    withLabel("Int.", store.direccionNumeroInterior),
    store.direccionColonia,
    store.direccionMunicipio,
    store.direccionEstado,
    withLabel("CP", store.direccionCodigoPostal),
  ]
    .map(trim)
    .filter(Boolean)
    .join(", ");

  return structured || trim(store.direccion);
};

export const currency = (value, code = "MXN") => {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: code || "MXN",
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

const normalizeBlock = (item = {}, index = 0) => {
  const type = item.type || "CUSTOM_TEXT";
  const meta = BLOCK_META[type] || BLOCK_META.CUSTOM_TEXT;
  const required = Boolean(item.required || REQUIRED_BLOCK_TYPES.has(type));
  return {
    id: item.id || `${String(type).toLowerCase()}-${index}`,
    type,
    label: trim(item.label) || meta?.label || "Bloque",
    visible: required ? true : item.visible !== false,
    required,
    settings: {
      align: item.settings?.align || "CENTRO",
      fontSize: item.settings?.fontSize || "NORMAL",
      bold: Boolean(item.settings?.bold),
      italic: Boolean(item.settings?.italic),
      uppercase: Boolean(item.settings?.uppercase),
      nameBold: Boolean(item.settings?.nameBold),
      nameItalic: Boolean(item.settings?.nameItalic),
      nameUnderline: Boolean(item.settings?.nameUnderline),
      nameUppercase: Boolean(item.settings?.nameUppercase),
      fiscalBold: Boolean(item.settings?.fiscalBold),
      fiscalItalic: Boolean(item.settings?.fiscalItalic),
      fiscalUnderline: Boolean(item.settings?.fiscalUnderline),
      fiscalUppercase: Boolean(item.settings?.fiscalUppercase),
      addressBold: Boolean(item.settings?.addressBold),
      addressItalic: Boolean(item.settings?.addressItalic),
      addressUnderline: Boolean(item.settings?.addressUnderline),
      addressUppercase: Boolean(item.settings?.addressUppercase),
      contactBold: Boolean(item.settings?.contactBold),
      contactItalic: Boolean(item.settings?.contactItalic),
      contactUnderline: Boolean(item.settings?.contactUnderline),
      contactUppercase: Boolean(item.settings?.contactUppercase),
      labelBold: Boolean(item.settings?.labelBold),
      labelItalic: Boolean(item.settings?.labelItalic),
      labelUnderline: Boolean(item.settings?.labelUnderline),
      labelUppercase: Boolean(item.settings?.labelUppercase),
      valueBold: item.settings?.valueBold !== false,
      valueItalic: Boolean(item.settings?.valueItalic),
      valueUnderline: Boolean(item.settings?.valueUnderline),
      valueUppercase: Boolean(item.settings?.valueUppercase),
      separatorAfter: item.settings?.separatorAfter !== false,
      text: trim(item.settings?.text).slice(0, 180),
      logoSize: item.settings?.logoSize || "MEDIANO",
      showStoreName: item.settings?.showStoreName !== false,
      showFiscal: item.settings?.showFiscal !== false,
      showAddress: item.settings?.showAddress !== false,
      showContact: item.settings?.showContact !== false,
      contactLayout: item.settings?.contactLayout || "LINEA",
      showPhone: item.settings?.showPhone !== false,
      showWhatsapp: item.settings?.showWhatsapp !== false,
      showEmail: item.settings?.showEmail !== false,
      showWhatsappIcon: item.settings?.showWhatsappIcon !== false,
      showItemDetail: item.settings?.showItemDetail !== false,
      highlightTotal: item.settings?.highlightTotal !== false,
    },
  };
};

const ensureTemplateBlocks = (template) => {
  const blocks = Array.isArray(template?.blocks) ? [...template.blocks] : DEFAULT_TEMPLATE.blocks;
  const hasLogo = blocks.some((block) => block.type === "LOGO");

  if (hasLogo) {
    return { ...template, blocks };
  }

  const headerIndex = blocks.findIndex((block) => block.type === "STORE_HEADER");
  const headerBlock = blocks[headerIndex];
  const logoBlock = normalizeBlock({
    id: "store-logo",
    type: "LOGO",
    label: BLOCK_META.LOGO?.label || "Logo",
    visible: true,
    required: false,
    settings: {
      align: "CENTRO",
      fontSize: "NORMAL",
      bold: false,
      italic: false,
      uppercase: false,
      separatorAfter: false,
      logoSize: headerBlock?.settings?.logoSize || "MEDIANO",
    },
  });

  if (headerIndex < 0) {
    return { ...template, blocks: [logoBlock, ...blocks] };
  }

  const nextBlocks = [...blocks];
  nextBlocks.splice(headerIndex, 0, logoBlock);
  return { ...template, blocks: nextBlocks };
};

const withLabel = (label, value) => {
  const text = trim(value);
  return text ? `${label} ${text}` : "";
};
