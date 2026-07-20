export const PAPER_OPTIONS = [
  { label: "58 mm", value: "58", desc: "Rollo compacto para impresoras chicas" },
  { label: "80 mm", value: "80", desc: "Mostrador y ticket con mas aire" },
];

export const DENSITY_OPTIONS = [
  { label: "Compacta", value: "COMPACTA" },
  { label: "Normal", value: "NORMAL" },
  { label: "Comoda", value: "COMODA" },
];

export const FONT_SIZE_OPTIONS = [
  { label: "Chica", value: "CHICA" },
  { label: "Normal", value: "NORMAL" },
  { label: "Grande", value: "GRANDE" },
];

export const FONT_FAMILY_OPTIONS = [
  { label: "Kodchasan", value: "KODCHASAN" },
  { label: "Arial", value: "ARIAL" },
  { label: "Courier New", value: "COURIER" },
  { label: "Consolas", value: "CONSOLAS" },
];

export const LINE_SPACING_OPTIONS = [
  { label: "Compacto", value: "COMPACTO" },
  { label: "Normal", value: "NORMAL" },
  { label: "Amplio", value: "AMPLIO" },
];

export const MARGIN_OPTIONS = [
  { label: "Estrecho", value: "ESTRECHO" },
  { label: "Normal", value: "NORMAL" },
  { label: "Amplio", value: "AMPLIO" },
];

export const CONTACT_LAYOUT_OPTIONS = [
  { label: "En una linea", value: "LINEA" },
  { label: "Uno por renglon", value: "SALTO" },
];

export const SEPARATOR_OPTIONS = [
  { label: "Sin division", value: "NINGUNO" },
  { label: "Simple", value: "SIMPLE" },
  { label: "Punteado", value: "PUNTEADO" },
  { label: "Doble", value: "DOBLE" },
];

export const ALIGN_OPTIONS = [
  { label: "Izquierda", value: "IZQUIERDA" },
  { label: "Centro", value: "CENTRO" },
  { label: "Derecha", value: "DERECHA" },
];

export const LOGO_SIZE_OPTIONS = [
  { label: "Chico", value: "CHICO" },
  { label: "Mediano", value: "MEDIANO" },
  { label: "Grande", value: "GRANDE" },
  { label: "Extra grande", value: "EXTRA" },
  { label: "Casi todo", value: "ANCHO" },
];

export const COPY_OPTIONS = [1, 2, 3, 4, 5].map((value) => ({
  label: `${value}`,
  value,
}));

export const REQUIRED_BLOCK_TYPES = new Set(["SALE_INFO", "PRODUCTS", "TOTALS"]);

export const BLOCK_LIBRARY = [
  {
    type: "LOGO",
    label: "Logo",
    icon: "pi pi-image",
    desc: "Imagen de la tienda impresa como bloque independiente.",
  },
  {
    type: "STORE_HEADER",
    label: "Encabezado de tienda",
    icon: "pi pi-shop",
    desc: "Nombre, direccion y contacto.",
  },
  {
    type: "SALE_INFO",
    label: "Datos de venta",
    icon: "pi pi-hashtag",
    desc: "Folio, fecha, caja y cajero.",
  },
  {
    type: "CUSTOMER",
    label: "Cliente",
    icon: "pi pi-user",
    desc: "Cliente frecuente o publico general.",
  },
  {
    type: "PRODUCTS",
    label: "Productos",
    icon: "pi pi-list",
    desc: "Detalle de articulos vendidos.",
  },
  {
    type: "TOTALS",
    label: "Totales",
    icon: "pi pi-calculator",
    desc: "Subtotal, descuentos, impuestos y total.",
  },
  {
    type: "PAYMENT",
    label: "Pago y cambio",
    icon: "pi pi-wallet",
    desc: "Metodo de pago, recibido y cambio.",
  },
  {
    type: "CASHIER",
    label: "Cajero",
    icon: "pi pi-id-card",
    desc: "Usuario que atendio la venta.",
  },
  {
    type: "FOOTER_MESSAGE",
    label: "Mensaje final",
    icon: "pi pi-comment",
    desc: "Agradecimiento, politicas o aviso corto.",
  },
  {
    type: "FOLIO_CODE",
    label: "Folio y codigo",
    icon: "pi pi-qrcode",
    desc: "Referencia visual para localizar la venta.",
  },
  {
    type: "CUSTOM_TEXT",
    label: "Texto libre",
    icon: "pi pi-pencil",
    desc: "Nota especial configurable.",
  },
];

export const BLOCK_META = BLOCK_LIBRARY.reduce((acc, item) => {
  acc[item.type] = item;
  return acc;
}, {});

const block = (id, type, visible = true, required = false, settings = {}) => ({
  id,
  type,
  label: BLOCK_META[type]?.label || "Bloque",
  visible,
  required,
  settings: {
    align: type === "PRODUCTS" || type === "TOTALS" ? "IZQUIERDA" : "CENTRO",
    fontSize: "NORMAL",
    bold: false,
    italic: false,
    uppercase: false,
    nameBold: false,
    nameItalic: false,
    nameUnderline: false,
    nameUppercase: false,
    fiscalBold: false,
    fiscalItalic: false,
    fiscalUnderline: false,
    fiscalUppercase: false,
    addressBold: false,
    addressItalic: false,
    addressUnderline: false,
    addressUppercase: false,
    contactBold: false,
    contactItalic: false,
    contactUnderline: false,
    contactUppercase: false,
    labelBold: false,
    labelItalic: false,
    labelUnderline: false,
    labelUppercase: false,
    valueBold: true,
    valueItalic: false,
    valueUnderline: false,
    valueUppercase: false,
    separatorAfter: !["FOLIO_CODE"].includes(type),
    text: "",
    ...settings,
  },
});

export const DEFAULT_TEMPLATE = {
  version: 1,
  blocks: [
    block("store-logo", "LOGO", true, false, {
      logoSize: "MEDIANO",
      separatorAfter: false,
    }),
    block("store-header", "STORE_HEADER", true, false, {
      bold: true,
      nameBold: true,
      showAddress: true,
      showContact: true,
      contactLayout: "LINEA",
      showPhone: true,
      showWhatsapp: true,
      showEmail: true,
      showWhatsappIcon: true,
    }),
    block("sale-info", "SALE_INFO", true, true),
    block("customer", "CUSTOMER", false, false),
    block("products", "PRODUCTS", true, true, { separatorAfter: true }),
    block("totals", "TOTALS", true, true, { bold: true, highlightTotal: true }),
    block("payment", "PAYMENT", true, false),
    block("cashier", "CASHIER", true, false),
    block("footer-message", "FOOTER_MESSAGE", true, false, { bold: true }),
    block("folio-code", "FOLIO_CODE", false, false, { separatorAfter: false }),
  ],
};

export const DEFAULT_CONFIG = {
  paperSize: "58",
  density: "NORMAL",
  fontSize: "NORMAL",
  fontFamily: "KODCHASAN",
  lineSpacing: "NORMAL",
  marginSize: "NORMAL",
  separatorStyle: "SIMPLE",
  alignment: "CENTRO",
  defaultPrinterName: "",
  copies: 1,
  autoPrint: false,
  askBeforePrint: true,
  allowReprint: true,
  showLogo: true,
  footerMessage: "Gracias por su compra",
  templateJson: JSON.stringify(DEFAULT_TEMPLATE),
  tienda: {},
};
