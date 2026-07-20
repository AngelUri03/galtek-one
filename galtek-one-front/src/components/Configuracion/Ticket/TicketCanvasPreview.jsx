import React from "react";
import { BLOCK_META } from "./ticketTemplateDefaults";
import {
  buildAddress,
  currency,
  getTemplateFromConfig,
  storeLogoSrc,
  trim,
} from "./ticketTemplateUtils";

const DEMO_ITEMS = [
  { nombre: "Cafe molido 500 g", cantidad: 1, precio: 86 },
  { nombre: "Leche entera 1 L", cantidad: 2, precio: 24.5 },
  { nombre: "Pan dulce surtido", cantidad: 3, precio: 12 },
];

export default function TicketCanvasPreview({
  config,
  selectedBlockId,
  onSelectBlock,
}) {
  const template = getTemplateFromConfig(config);
  const store = config.tienda || {};
  const logoSrc = storeLogoSrc(store);
  const subtotal = DEMO_ITEMS.reduce((acc, item) => acc + item.cantidad * item.precio, 0);
  const descuento = 5;
  const total = subtotal - descuento;

  return (
    <section className="tck-preview-zone">
      <div className="tck-receipt-stage">
        <span className="tck-paper-shadow" />
        <div
          className={[
            "tck-receipt",
            config.paperSize === "58" ? "is-58" : "is-80",
            `density-${String(config.density || "NORMAL").toLowerCase()}`,
            `font-${String(config.fontSize || "NORMAL").toLowerCase()}`,
            `print-font-${String(config.fontFamily || "KODCHASAN").toLowerCase()}`,
            `spacing-${String(config.lineSpacing || "NORMAL").toLowerCase()}`,
            `margin-${String(config.marginSize || "NORMAL").toLowerCase()}`,
          ].join(" ")}
        >
          {template.blocks
            .filter((block) => block.visible)
            .map((block) => (
              <ReceiptBlock
                key={block.id}
                block={block}
                store={store}
                logoSrc={logoSrc}
                config={config}
                subtotal={subtotal}
                descuento={descuento}
                total={total}
                selected={block.id === selectedBlockId}
                onSelect={(area) => onSelectBlock(block.id, area)}
              />
            ))}
        </div>
      </div>
    </section>
  );
}

export function ReceiptBlock({
  block,
  store,
  logoSrc,
  config,
  subtotal,
  descuento,
  total,
  selected,
  onSelect,
}) {
  const meta = BLOCK_META[block.type] || {};
  const settings = block.settings || {};
  const fixedLayout = ["PRODUCTS", "TOTALS"].includes(block.type);
  const alignClass = `align-${String(fixedLayout ? "IZQUIERDA" : settings.align || config.alignment || "CENTRO").toLowerCase()}`;
  const fontClass = `block-font-${String(settings.fontSize || "NORMAL").toLowerCase()}`;
  const separatorStyle = String(config.separatorStyle || "SIMPLE");
  const separatorClass = separatorStyle === "DOBLE" ? "is-double" : separatorStyle === "PUNTEADO" ? "is-dotted" : "is-simple";
  const showSeparator = settings.separatorAfter && separatorStyle !== "NINGUNO";
  const handleSelect = (event) => {
    const area = event.target.closest("[data-ticket-area]")?.getAttribute("data-ticket-area");
    if (block.type === "LOGO") {
      onSelect("logo");
      return;
    }
    if (block.type === "STORE_HEADER") {
      onSelect(area || "header");
      return;
    }
    onSelect("block");
  };

  return (
    <button
      type="button"
      className={[
        "tck-receipt-block",
        `type-${String(block.type || "block").toLowerCase().replace(/_/g, "-")}`,
        alignClass,
        fontClass,
        settings.bold ? "is-bold" : "",
        settings.italic ? "is-italic" : "",
        settings.uppercase ? "is-uppercase" : "",
        selected ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleSelect}
      aria-label={`Editar ${block.label}`}
    >
      <span className="tck-block-watermark">
        <i className={meta.icon || "pi pi-ticket"} />
      </span>
      {renderBlock(block, { store, logoSrc, config, subtotal, descuento, total })}
      {showSeparator ? <span className={`tck-receipt-separator ${separatorClass}`} /> : null}
    </button>
  );
}

function renderBlock(block, data) {
  const { store, logoSrc, config, subtotal, descuento, total } = data;
  const moneda = store.moneda || "MXN";

  switch (block.type) {
    case "LOGO":
      return logoSrc ? (
        <img
          className={[
            "tck-receipt-logo",
            `logo-${String(block.settings?.logoSize || "MEDIANO").toLowerCase()}`,
          ].join(" ")}
          src={logoSrc}
          alt=""
        />
      ) : (
        <span className="tck-receipt-muted">Logo oculto</span>
      );

    case "STORE_HEADER":
      return (
        <>
          {block.settings?.showStoreName !== false ? <strong className={["tck-store-name", headerPartClass(block.settings, "name")].filter(Boolean).join(" ")} data-ticket-area="header">{store.nombre || "Abarrotes La Esquina"}</strong> : null}
          {block.settings?.showFiscal !== false && store.razonSocial ? <span className={["tck-receipt-muted", headerPartClass(block.settings, "fiscal")].filter(Boolean).join(" ")} data-ticket-area="header">{store.razonSocial}</span> : null}
          {block.settings?.showFiscal !== false && store.rfc ? <span className={["tck-receipt-muted", headerPartClass(block.settings, "fiscal")].filter(Boolean).join(" ")} data-ticket-area="header">RFC {store.rfc}</span> : null}
          {block.settings?.showAddress ? <span className={["tck-receipt-muted", headerPartClass(block.settings, "address")].filter(Boolean).join(" ")} data-ticket-area="header">{buildAddress(store) || "Direccion de tienda"}</span> : null}
          {block.settings?.showContact ? renderContactLine(store, block.settings) : null}
        </>
      );

    case "SALE_INFO":
      return (
        <div className="tck-receipt-lines">
          <Line label="Folio" value="VTA-000284" settings={block.settings} />
          <Line label="Fecha" value="12 jul 2026 14:32" settings={block.settings} />
        </div>
      );

    case "CUSTOMER":
      return (
        <div className="tck-receipt-lines">
          <Line label="Cliente" value="Maria Lopez" settings={block.settings} />
          <Line label="Telefono" value="5551234567" settings={block.settings} />
        </div>
      );

    case "PRODUCTS":
      return (
        <div className="tck-items">
          <div className="tck-items-head">
            <span>Producto</span>
            <span>Imp.</span>
          </div>
          {DEMO_ITEMS.map((item) => (
            <div className="tck-item" key={item.nombre}>
              <span>{item.nombre}</span>
              <span>{currency(item.cantidad * item.precio, moneda)}</span>
              {block.settings?.showItemDetail !== false ? (
                <small>
                  {item.cantidad} x {currency(item.precio, moneda)}
                </small>
              ) : null}
            </div>
          ))}
        </div>
      );

    case "TOTALS":
      return (
        <div className={["tck-receipt-lines tck-total-lines", block.settings?.highlightTotal === false ? "is-plain" : ""].filter(Boolean).join(" ")}>
          <Line label="Subtotal" value={currency(subtotal, moneda)} settings={block.settings} />
          <Line label="Descuento" value={`-${currency(descuento, moneda)}`} settings={block.settings} />
          <Line label="Total" value={currency(total, moneda)} settings={block.settings} strong />
        </div>
      );

    case "PAYMENT":
      return (
        <div className="tck-receipt-lines">
          <Line label="Pago" value="Efectivo" settings={block.settings} />
          <Line label="Recibido" value={currency(200, moneda)} settings={block.settings} />
          <Line label="Cambio" value={currency(200 - total, moneda)} settings={block.settings} />
        </div>
      );

    case "CASHIER":
      return (
        <div className="tck-receipt-lines">
          <Line label="Caja" value="Caja principal" settings={block.settings} />
          <Line label="Cajero" value="Laura Martinez" settings={block.settings} />
        </div>
      );

    case "FOOTER_MESSAGE":
      return <span className="tck-footer-message">{config.footerMessage || store.ticketMensaje || "Gracias por su compra"}</span>;

    case "FOLIO_CODE":
      return (
        <div className="tck-code-block">
          <span className="tck-code-bars" aria-hidden="true" />
          <small>VTA-000284</small>
        </div>
      );

    case "CUSTOM_TEXT":
      return <span>{block.settings?.text || "Texto libre del ticket"}</span>;

    default:
      return <span>{block.label}</span>;
  }
}

function renderContactLine(store, settings = {}) {
  const contactParts = [
    settings.showPhone !== false && trim(store.telefono) ? { key: "telefono", value: trim(store.telefono) } : null,
    settings.showWhatsapp !== false && trim(store.whatsapp)
      ? { key: "whatsapp", value: `${settings.showWhatsappIcon !== false ? "WhatsApp " : ""}${trim(store.whatsapp)}` }
      : null,
    settings.showEmail !== false && trim(store.correo) ? { key: "correo", value: trim(store.correo) } : null,
  ].filter(Boolean);

  if (contactParts.length === 0) {
    return <span className={["tck-receipt-muted", headerPartClass(settings, "contact")].filter(Boolean).join(" ")} data-ticket-area="header">Contacto de tienda</span>;
  }

  if (settings.contactLayout === "SALTO") {
    return (
      <span className={["tck-receipt-contact-stack", headerPartClass(settings, "contact")].filter(Boolean).join(" ")} data-ticket-area="header">
        {contactParts.map((part) => (
          <span key={part.key}>{part.value}</span>
        ))}
      </span>
    );
  }

  return (
    <span className={["tck-receipt-muted", headerPartClass(settings, "contact")].filter(Boolean).join(" ")} data-ticket-area="header">
      {contactParts.map((part) => part.value).join(" | ")}
    </span>
  );
}

function headerPartClass(settings, prefix) {
  return [
    settings?.[`${prefix}Bold`] ? "is-part-bold" : "",
    settings?.[`${prefix}Italic`] ? "is-part-italic" : "",
    settings?.[`${prefix}Underline`] ? "is-part-underline" : "",
    settings?.[`${prefix}Uppercase`] ? "is-part-uppercase" : "",
  ].filter(Boolean).join(" ");
}

function Line({ label, value, strong, settings = {} }) {
  return (
    <div className={strong ? "is-strong" : ""}>
      <span className={pairTextClass(settings, "label")}>{label}</span>
      <span className={pairTextClass(settings, "value")}>{value}</span>
    </div>
  );
}

function pairTextClass(settings, prefix) {
  return [
    settings?.[`${prefix}Bold`] ? "is-part-bold" : "",
    settings?.[`${prefix}Italic`] ? "is-part-italic" : "",
    settings?.[`${prefix}Underline`] ? "is-part-underline" : "",
    settings?.[`${prefix}Uppercase`] ? "is-part-uppercase" : "",
  ].filter(Boolean).join(" ");
}
