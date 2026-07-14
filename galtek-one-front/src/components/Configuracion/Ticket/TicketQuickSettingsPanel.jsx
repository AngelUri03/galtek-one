import React, { useCallback, useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { APIfetchApi } from "../../../API/APIfetch";
import { endpoints } from "../../../API/api";
import {
  ALIGN_OPTIONS,
  BLOCK_LIBRARY,
  CONTACT_LAYOUT_OPTIONS,
  COPY_OPTIONS,
  DENSITY_OPTIONS,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  LINE_SPACING_OPTIONS,
  LOGO_SIZE_OPTIONS,
  MARGIN_OPTIONS,
  PAPER_OPTIONS,
  SEPARATOR_OPTIONS,
} from "./ticketTemplateDefaults";
import { ReceiptBlock } from "./TicketCanvasPreview";
import {
  getTemplateFromConfig,
  moveBlock,
  readApiPayload,
  storeLogoSrc,
  updateBlock,
} from "./ticketTemplateUtils";

const api = new APIfetchApi();

export default function TicketQuickSettingsPanel({
  config,
  selectedBlockId,
  activeTicketEditor,
  onActiveEditorChange,
  onConfigChange,
  onSelectBlock,
  onRestore,
  onSave,
  onPrintExample,
  saving,
  printingExample,
  dirty,
}) {
  const [logoOpen, setLogoOpen] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(false);
  const [blocksOpen, setBlocksOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [textEditor, setTextEditor] = useState(null);
  const [textDraft, setTextDraft] = useState("");
  const [printers, setPrinters] = useState([]);
  const [defaultPrinter, setDefaultPrinter] = useState("");
  const [printersLoading, setPrintersLoading] = useState(false);
  const [printersError, setPrintersError] = useState("");

  const template = getTemplateFromConfig(config);
  const selectedIndex = template.blocks.findIndex((block) => block.id === selectedBlockId);
  const selectedBlock = template.blocks[selectedIndex] || template.blocks[0];
  const logoBlock = template.blocks.find((block) => block.type === "LOGO");
  const logoSettings = logoBlock?.settings || {};
  const headerBlock = template.blocks.find((block) => block.type === "STORE_HEADER");
  const headerSettings = headerBlock?.settings || {};
  const visibleBlocks = template.blocks.filter((block) => block.visible);
  const hiddenBlocks = template.blocks.length - visibleBlocks.length;
  const store = config.tienda || {};

  const setField = (field, value) => {
    onConfigChange({ ...config, [field]: value });
  };

  const loadPrinters = useCallback(async () => {
    setPrintersLoading(true);
    setPrintersError("");
    try {
      const response = await api.fetchApi({}, "GET", null, endpoints.ticketPrinters, {
        logoutOnUnauthorized: false,
      });
      const payload = await readApiPayload(response, "impresoras de ticket");
      const detected = Array.isArray(payload?.printers) ? payload.printers : [];
      setPrinters(detected);
      setDefaultPrinter(payload?.defaultPrinter || "");
    } catch (requestError) {
      setPrinters([]);
      setDefaultPrinter("");
      setPrintersError(requestError.message || "No se pudieron detectar impresoras.");
    } finally {
      setPrintersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (outputOpen) {
      loadPrinters();
    }
  }, [loadPrinters, outputOpen]);

  useEffect(() => {
    if (!activeTicketEditor?.type) return;

    if (activeTicketEditor.type === "logo") {
      setLogoOpen(true);
    } else if (activeTicketEditor.type === "header") {
      setHeaderOpen(true);
    } else {
      setStyleOpen(true);
    }

    onActiveEditorChange?.(null);
  }, [activeTicketEditor, onActiveEditorChange]);

  const setSelectedBlock = (updater) => {
    if (!selectedBlock) return;
    onConfigChange(
      updateBlock(config, selectedBlock.id, (current) =>
        typeof updater === "function" ? updater(current) : { ...current, ...updater }
      )
    );
  };

  const setSetting = (field, value) => {
    setSelectedBlock((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [field]: value,
      },
    }));
  };

  const setHeaderSetting = (field, value) => {
    if (!headerBlock) return;
    onConfigChange(
      updateBlock(config, headerBlock.id, (current) => ({
        ...current,
        settings: {
          ...current.settings,
          [field]: value,
        },
      }))
    );
  };

  const setLogoSetting = (field, value) => {
    if (!logoBlock) return;
    onConfigChange(
      updateBlock(config, logoBlock.id, (current) => ({
        ...current,
        settings: {
          ...current.settings,
          [field]: value,
        },
      }))
    );
  };

  const toggleBlock = (block) => {
    if (block.required) return;
    onConfigChange(updateBlock(config, block.id, { ...block, visible: !block.visible }));
  };

  const handleMove = (direction) => {
    if (!selectedBlockId) return;
    onConfigChange(moveBlock(config, selectedBlockId, direction));
  };

  const openTextEditor = (target) => {
    setTextEditor(target);
    setTextDraft(
      target === "custom"
        ? selectedBlock?.settings?.text || ""
        : config.footerMessage || ""
    );
  };

  const applyTextEditor = () => {
    if (textEditor === "custom") {
      setSetting("text", textDraft.slice(0, 180));
    } else {
      setField("footerMessage", textDraft.slice(0, 120));
    }
    setTextEditor(null);
  };

  const outputDetail = [
    config.defaultPrinterName || defaultPrinter || "Sin impresora",
    config.autoPrint ? "Auto imprimir" : "Manual",
    config.askBeforePrint ? "Confirmar" : "Sin confirmar",
    config.allowReprint ? "Reimprimir" : "Sin reimprimir",
  ].join(" - ");
  const printerOptions = printers.map((printer) => ({
    label: printer.defaultPrinter ? `${printer.name} - predeterminada` : printer.name,
    value: printer.name,
  }));
  const selectedPrinter = config.defaultPrinterName || defaultPrinter || printerOptions[0]?.value || "";

  return (
    <aside className="tck-panel tck-left-panel">
      <div className="tck-config-body">
        <section className="tck-inline-card tck-base-card">
          <div className="tck-mini-title">
            <div>
              <strong>Formato base</strong>
              <span>58 mm recomendado, division visible por bloque y copias.</span>
            </div>
          </div>
          <div className="tck-control-grid tck-base-inline-grid">
            <SelectField label="Papel" value={config.paperSize} options={PAPER_OPTIONS} onChange={(value) => setField("paperSize", value)} />
            <SelectField label="Tipografia" value={config.fontFamily || "KODCHASAN"} options={FONT_FAMILY_OPTIONS} onChange={(value) => setField("fontFamily", value)} />
            <SelectField label="Densidad" value={config.density} options={DENSITY_OPTIONS} onChange={(value) => setField("density", value)} />
            <SelectField label="Letra" value={config.fontSize} options={FONT_SIZE_OPTIONS} onChange={(value) => setField("fontSize", value)} />
            <SelectField label="Espaciado" value={config.lineSpacing || "NORMAL"} options={LINE_SPACING_OPTIONS} onChange={(value) => setField("lineSpacing", value)} />
            <SelectField label="Margen" value={config.marginSize || "NORMAL"} options={MARGIN_OPTIONS} onChange={(value) => setField("marginSize", value)} />
            <SelectField label="Alineacion base" value={config.alignment || "CENTRO"} options={ALIGN_OPTIONS} onChange={(value) => setField("alignment", value)} />
            <SelectField label="Division" value={config.separatorStyle} options={SEPARATOR_OPTIONS} onChange={(value) => setField("separatorStyle", value)} />
            <SelectField label="Copias" value={config.copies} options={COPY_OPTIONS} onChange={(value) => setField("copies", value)} />
          </div>
        </section>

        <div className="tck-selected-note">
          <i className="pi pi-hand-pointer" />
          <span>Selecciona Logo, Encabezado o cualquier bloque directamente en el ticket para abrir su configuracion.</span>
        </div>

        <div className="tck-action-summary-grid">
          <SummaryCard
            icon="pi pi-list-check"
            title="Ordenar bloques"
            detail={`${visibleBlocks.length} activos, ${hiddenBlocks} ocultos`}
            actionLabel="Gestionar orden"
            onAction={() => setBlocksOpen(true)}
          />
          <SummaryCard
            icon="pi pi-print"
            title="Salida"
            detail={outputDetail}
            actionLabel="Configurar salida"
            onAction={() => setOutputOpen(true)}
          />
        </div>
      </div>

      <div className="tck-config-footer">
        <div className="tck-config-footer-left">
          <Button
            type="button"
            icon={printingExample ? "pi pi-spin pi-spinner" : "pi pi-print"}
            label={printingExample ? "Imprimiendo" : "Imprimir ejemplo"}
            className="tck-text-button"
            disabled={printingExample}
            onClick={onPrintExample}
          />
        </div>
        <div className="tck-config-footer-right">
          <Button
            type="button"
            icon="pi pi-refresh"
            label="Restaurar base"
            className="tck-text-button"
            onClick={onRestore}
          />
          <Button
            type="button"
            icon="pi pi-check"
            label={saving ? "Guardando" : "Guardar"}
            className="tck-primary-button"
            disabled={saving || !dirty}
            onClick={onSave}
          />
        </div>
      </div>

      <Dialog
        visible={logoOpen}
        className="tck-config-dialog tck-logo-dialog"
        header="Configurar logo"
        modal
        draggable={false}
        resizable={false}
        onHide={() => setLogoOpen(false)}
        footer={<DialogDone onClick={() => setLogoOpen(false)} />}
      >
        <ModalHero
          icon="pi pi-image"
          title="Logo del ticket"
          detail="Bloque independiente. La imagen se toma de Tienda y aqui defines su presencia en el ticket."
        />
        <div className="tck-modal-two-col tck-logo-editor-grid">
          <div className="tck-modal-controls">
            <div className="tck-control-grid tck-logo-modal-grid">
              <SelectField label="Alineacion" value={logoSettings.align || "CENTRO"} options={ALIGN_OPTIONS} onChange={(value) => setLogoSetting("align", value)} />
            </div>
            <div className="tck-logo-size-picks">
              {LOGO_SIZE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={["tck-logo-size-pick", (logoSettings.logoSize || "MEDIANO") === option.value ? "is-active" : ""].filter(Boolean).join(" ")}
                  onClick={() => setLogoSetting("logoSize", option.value)}
                >
                  <span>{option.label}</span>
                  <i className="pi pi-image" />
                </button>
              ))}
            </div>
          </div>
          <ExactBlockPreview block={logoBlock} config={config} store={store} title="Preview del logo" />
        </div>
      </Dialog>

      <Dialog
        visible={headerOpen}
        className="tck-config-dialog tck-header-dialog"
        header="Configurar encabezado"
        modal
        draggable={false}
        resizable={false}
        onHide={() => setHeaderOpen(false)}
        footer={<DialogDone onClick={() => setHeaderOpen(false)} />}
      >
        <ModalHero
          icon="pi pi-shop"
          title="Datos de tienda"
          detail="Encabezado de informacion. El logo se edita como bloque separado."
        />
        <div className="tck-modal-two-col tck-header-editor-grid">
          <div className="tck-modal-controls">
            <div className="tck-header-data-grid">
              <ReadOnlyData label="Nombre" value={store.nombre || "Abarrotes La Esquina"} />
              <ReadOnlyData label="Razon social" value={store.razonSocial || "Sin razon social"} />
              <ReadOnlyData label="RFC" value={store.rfc || "Sin RFC"} />
              <ReadOnlyData label="Contacto" value={[store.telefono, store.whatsapp, store.correo].filter(Boolean).join(" | ") || "Sin contacto"} />
            </div>
            <div className="tck-control-grid tck-header-style-grid">
              <SelectField label="Alineacion" value={headerSettings.align || "CENTRO"} options={ALIGN_OPTIONS} onChange={(value) => setHeaderSetting("align", value)} />
              <SelectField label="Contacto" value={headerSettings.contactLayout || "LINEA"} options={CONTACT_LAYOUT_OPTIONS} onChange={(value) => setHeaderSetting("contactLayout", value)} />
            </div>
            <div className="tck-toggle-strip tck-header-modal-toggles">
              <ToggleChip label="Nombre" checked={headerSettings.showStoreName !== false} onChange={() => setHeaderSetting("showStoreName", headerSettings.showStoreName === false)} />
              <ToggleChip label="Fiscal" checked={headerSettings.showFiscal !== false} onChange={() => setHeaderSetting("showFiscal", headerSettings.showFiscal === false)} />
              <ToggleChip label="Direccion" checked={headerSettings.showAddress !== false} onChange={() => setHeaderSetting("showAddress", headerSettings.showAddress === false)} />
              <ToggleChip label="Contacto" checked={headerSettings.showContact !== false} onChange={() => setHeaderSetting("showContact", headerSettings.showContact === false)} />
              <ToggleChip label="Telefono" checked={headerSettings.showPhone !== false} onChange={() => setHeaderSetting("showPhone", headerSettings.showPhone === false)} />
              <ToggleChip label="WhatsApp" checked={headerSettings.showWhatsapp !== false} onChange={() => setHeaderSetting("showWhatsapp", headerSettings.showWhatsapp === false)} />
              <ToggleChip label="Correo" checked={headerSettings.showEmail !== false} onChange={() => setHeaderSetting("showEmail", headerSettings.showEmail === false)} />
              <ToggleChip label="Icono WA" checked={headerSettings.showWhatsappIcon !== false} onChange={() => setHeaderSetting("showWhatsappIcon", headerSettings.showWhatsappIcon === false)} />
            </div>
            <div className="tck-header-style-groups">
              <HeaderPartStyle title="Nombre" prefix="name" settings={headerSettings} onChange={setHeaderSetting} />
              <HeaderPartStyle title="Fiscal" prefix="fiscal" settings={headerSettings} onChange={setHeaderSetting} />
              <HeaderPartStyle title="Direccion" prefix="address" settings={headerSettings} onChange={setHeaderSetting} />
              <HeaderPartStyle title="Contacto" prefix="contact" settings={headerSettings} onChange={setHeaderSetting} />
            </div>
          </div>
          <ExactBlockPreview block={headerBlock} config={config} store={store} title="Preview del encabezado" />
        </div>
      </Dialog>

      <Dialog
        visible={blocksOpen}
        className="tck-config-dialog tck-blocks-dialog"
        header="Gestionar bloques"
        modal
        draggable={false}
        resizable={false}
        onHide={() => setBlocksOpen(false)}
        footer={<DialogDone onClick={() => setBlocksOpen(false)} />}
      >
        <div className="tck-dialog-toolbar">
          <div>
            <strong>{visibleBlocks.length} de {template.blocks.length} bloques activos</strong>
            <span>La lista marca el orden de impresion. Selecciona una fila y usa subir o bajar.</span>
          </div>
          <div className="tck-mini-actions">
            <Button type="button" icon="pi pi-arrow-up" className="tck-icon-btn" disabled={selectedIndex <= 0} onClick={() => handleMove(-1)} tooltip="Subir bloque" />
            <Button type="button" icon="pi pi-arrow-down" className="tck-icon-btn" disabled={selectedIndex < 0 || selectedIndex >= template.blocks.length - 1} onClick={() => handleMove(1)} tooltip="Bajar bloque" />
          </div>
        </div>

        <div className="tck-block-list tck-block-list-dialog">
          {template.blocks.map((block, index) => (
            <BlockRow
              key={block.id}
              block={block}
              index={index}
              selected={block.id === selectedBlockId}
              onSelect={() => onSelectBlock(block.id, "block")}
              onToggle={(event) => {
                event.stopPropagation();
                toggleBlock(block);
              }}
              onToggleKey={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleBlock(block);
                }
              }}
            />
          ))}
        </div>
      </Dialog>

      <Dialog
        visible={styleOpen}
        className="tck-config-dialog tck-style-dialog"
        header={`Editar ${selectedBlock?.label || "bloque"}`}
        modal
        draggable={false}
        resizable={false}
        onHide={() => setStyleOpen(false)}
        footer={<DialogDone onClick={() => setStyleOpen(false)} />}
      >
        <ModalHero
          icon={BLOCK_LIBRARY.find((item) => item.type === selectedBlock?.type)?.icon || "pi pi-ticket"}
          title={selectedBlock?.label || "Bloque seleccionado"}
          detail={blockModalDetail(selectedBlock)}
        />
        <ExactBlockPreview block={selectedBlock} config={config} store={store} title="Preview del bloque" />
        {renderBlockEditor(selectedBlock, {
          setSetting,
          openTextEditor,
          footerMessage: config.footerMessage,
        })}
      </Dialog>

      <Dialog
        visible={outputOpen}
        className="tck-config-dialog tck-output-dialog"
        header="Configurar salida"
        modal
        draggable={false}
        resizable={false}
        onHide={() => setOutputOpen(false)}
        footer={<DialogDone onClick={() => setOutputOpen(false)} />}
      >
        <ModalHero
          icon="pi pi-print"
          title="Impresion local"
          detail="Selecciona la impresora del equipo y define el comportamiento de salida."
        />
        <div className="tck-output-layout">
          <section className="tck-output-card tck-output-printer-card">
            <span className="tck-summary-icon">
              <i className="pi pi-print" />
            </span>
            <span className="tck-output-copy">
              <strong>Impresora local</strong>
              <small>
                {printersLoading
                  ? "Detectando impresoras del equipo."
                  : defaultPrinter
                    ? `Predeterminada: ${defaultPrinter}`
                    : "Usa la predeterminada o selecciona una detectada."}
              </small>
            </span>
            <div className="tck-printer-control">
              <SelectField
                label="Impresora"
                value={selectedPrinter}
                options={printerOptions}
                onChange={(value) => setField("defaultPrinterName", value)}
                disabled={printersLoading}
              />
              <Button
                type="button"
                icon={printersLoading ? "pi pi-spin pi-spinner" : "pi pi-refresh"}
                className="tck-icon-btn"
                disabled={printersLoading}
                onClick={loadPrinters}
                tooltip="Detectar impresoras"
              />
            </div>
            {printersError ? (
              <small className="tck-printer-error">{printersError}</small>
            ) : (
              <small className="tck-printer-hint">
                {printers.length ? `${printers.length} impresora${printers.length === 1 ? "" : "s"} detectada${printers.length === 1 ? "" : "s"}.` : "Sin impresoras detectadas por ahora."}
              </small>
            )}
          </section>

          <div className="tck-output-options">
            <OutputOption
              icon="pi pi-bolt"
              title="Auto imprimir"
              detail="Imprime al cerrar la venta."
              checked={config.autoPrint}
              onChange={() => setField("autoPrint", !config.autoPrint)}
            />
            <OutputOption
              icon="pi pi-question-circle"
              title="Confirmar antes"
              detail="Pide autorizacion antes de imprimir."
              checked={config.askBeforePrint}
              onChange={() => setField("askBeforePrint", !config.askBeforePrint)}
            />
            <OutputOption
              icon="pi pi-history"
              title="Reimpresion"
              detail="Permite volver a emitir un ticket."
              checked={config.allowReprint}
              onChange={() => setField("allowReprint", !config.allowReprint)}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={Boolean(textEditor)}
        className="tck-text-dialog"
        header={textEditor === "custom" ? "Editar texto del bloque" : "Editar mensaje final"}
        modal
        draggable={false}
        resizable={false}
        onHide={() => setTextEditor(null)}
        footer={
          <div className="tck-dialog-footer">
            <Button type="button" label="Cancelar" className="tck-dialog-cancel" onClick={() => setTextEditor(null)} />
            <Button type="button" icon="pi pi-check" label="Aplicar" className="tck-dialog-apply" onClick={applyTextEditor} />
          </div>
        }
      >
        <label className="tck-field">
          <span>{textEditor === "custom" ? "Texto libre" : "Mensaje impreso al final"}</span>
          <InputTextarea
            value={textDraft}
            onChange={(event) => setTextDraft(event.target.value.slice(0, textEditor === "custom" ? 180 : 120))}
            rows={5}
            autoFocus
          />
        </label>
        <small className="tck-text-limit">{textDraft.length}/{textEditor === "custom" ? 180 : 120}</small>
      </Dialog>
    </aside>
  );
}

function renderBlockEditor(block, helpers) {
  const settings = block?.settings || {};
  const setSetting = helpers.setSetting;

  if (block?.type === "LOGO") {
    return (
      <div className="tck-block-editor">
        <SpecificNote title="Bloque independiente" detail="La visibilidad se controla desde Gestionar bloques. El separador se define globalmente en Formato base." />
      </div>
    );
  }

  if (["SALE_INFO", "CUSTOMER", "PAYMENT", "CASHIER"].includes(block?.type)) {
    return <PairBlockEditor settings={settings} setSetting={setSetting} />;
  }

  if (block?.type === "PRODUCTS") {
    return (
      <div className="tck-block-editor tck-products-editor">
        <SpecificNote title="Estructura fija" detail="Productos siempre imprime concepto a la izquierda e importe a la derecha para conservar lectura y suma rapida." />
        <div className="tck-control-grid tck-modal-style-grid">
          <SelectField label="Letra productos" value={settings.fontSize || "NORMAL"} options={FONT_SIZE_OPTIONS} onChange={(value) => setSetting("fontSize", value)} />
          <div className="tck-toggle-strip">
            <ToggleChip label="Detalle cantidad" checked={settings.showItemDetail !== false} onChange={() => setSetting("showItemDetail", settings.showItemDetail === false)} />
          </div>
        </div>
      </div>
    );
  }

  if (block?.type === "TOTALS") {
    return (
      <div className="tck-block-editor">
        <SpecificNote title="Totales en pares" detail="Subtotal, descuentos y total se mantienen con etiqueta izquierda e importe derecho." />
        <PairBlockEditor settings={settings} setSetting={setSetting} compact />
        <div className="tck-control-grid tck-modal-style-grid">
          <div className="tck-toggle-strip">
            <ToggleChip label="Resaltar total" checked={settings.highlightTotal !== false} onChange={() => setSetting("highlightTotal", settings.highlightTotal === false)} />
          </div>
        </div>
      </div>
    );
  }

  if (block?.type === "STORE_HEADER") {
    return (
      <div className="tck-block-editor">
        <SpecificNote title="Encabezado especializado" detail="Este bloque se configura desde el modal de Encabezado al seleccionarlo en el ticket." />
      </div>
    );
  }

  return (
    <div className="tck-block-editor">
      {genericStyleControls(settings, setSetting)}
      {block?.type === "CUSTOM_TEXT" ? (
        <Button type="button" icon="pi pi-pencil" label="Editar texto del bloque" className="tck-wide-text-btn" onClick={() => helpers.openTextEditor("custom")} />
      ) : null}
      {block?.type === "FOOTER_MESSAGE" ? (
        <Button type="button" icon="pi pi-pencil" label="Editar mensaje final" className="tck-wide-text-btn" onClick={() => helpers.openTextEditor("footer")} />
      ) : null}
    </div>
  );
}

function PairBlockEditor({ settings, setSetting, compact = false }) {
  return (
    <div className={["tck-pair-editor", compact ? "is-compact" : ""].filter(Boolean).join(" ")}>
      <SpecificNote title="Estructura fija" detail="La etiqueta queda a la izquierda y el valor a la derecha para lectura rapida en ticket." />
      <div className="tck-pair-style-grid">
        <StyleGroup title="Etiquetas" prefix="label" settings={settings} onChange={setSetting} />
        <StyleGroup title="Valores" prefix="value" settings={settings} onChange={setSetting} />
      </div>
    </div>
  );
}

function genericStyleControls(settings, setSetting) {
  return (
    <div className="tck-control-grid tck-modal-style-grid">
      <SelectField label="Alineacion" value={settings.align || "CENTRO"} options={ALIGN_OPTIONS} onChange={(value) => setSetting("align", value)} />
      <SelectField label="Letra bloque" value={settings.fontSize || "NORMAL"} options={FONT_SIZE_OPTIONS} onChange={(value) => setSetting("fontSize", value)} />
      <div className="tck-toggle-strip">
        <ToggleChip label="Negrita" checked={Boolean(settings.bold)} onChange={() => setSetting("bold", !settings.bold)} />
        <ToggleChip label="Cursiva" checked={Boolean(settings.italic)} onChange={() => setSetting("italic", !settings.italic)} />
        <ToggleChip label="Mayusculas" checked={Boolean(settings.uppercase)} onChange={() => setSetting("uppercase", !settings.uppercase)} />
      </div>
    </div>
  );
}

function HeaderPartStyle({ title, prefix, settings, onChange }) {
  return (
    <StyleGroup title={title} prefix={prefix} settings={settings} onChange={onChange} compact />
  );
}

function StyleGroup({ title, prefix, settings, onChange, compact = false }) {
  const label = (suffix) => `${prefix}${suffix}`;
  return (
    <section className={["tck-style-group", compact ? "is-compact" : ""].filter(Boolean).join(" ")}>
      <strong>{title}</strong>
      <div>
        <ToggleChip label="Negrita" checked={Boolean(settings[label("Bold")])} onChange={() => onChange(label("Bold"), !settings[label("Bold")])} />
        <ToggleChip label="Cursiva" checked={Boolean(settings[label("Italic")])} onChange={() => onChange(label("Italic"), !settings[label("Italic")])} />
        <ToggleChip label="Subrayado" checked={Boolean(settings[label("Underline")])} onChange={() => onChange(label("Underline"), !settings[label("Underline")])} />
        <ToggleChip label="Mayusculas" checked={Boolean(settings[label("Uppercase")])} onChange={() => onChange(label("Uppercase"), !settings[label("Uppercase")])} />
      </div>
    </section>
  );
}

function ModalHero({ icon, title, detail }) {
  return (
    <div className="tck-modal-block-hero">
      <span className="tck-summary-icon">
        <i className={icon} />
      </span>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

function ExactBlockPreview({ block, config, store, title }) {
  if (!block) return null;
  return (
    <section className="tck-section-preview tck-exact-preview-shell">
      <span>{title}</span>
      <div
        className={[
          "tck-receipt",
          "tck-exact-receipt-preview",
          config.paperSize === "58" ? "is-58" : "is-80",
          `density-${String(config.density || "NORMAL").toLowerCase()}`,
          `font-${String(config.fontSize || "NORMAL").toLowerCase()}`,
          `print-font-${String(config.fontFamily || "KODCHASAN").toLowerCase()}`,
          `spacing-${String(config.lineSpacing || "NORMAL").toLowerCase()}`,
          `margin-${String(config.marginSize || "NORMAL").toLowerCase()}`,
        ].join(" ")}
      >
        <ReceiptBlock
          block={block}
          store={store}
          logoSrc={storeLogoSrc(store)}
          config={config}
          subtotal={171}
          descuento={5}
          total={166}
          selected={false}
          onSelect={() => {}}
        />
      </div>
    </section>
  );
}

function SpecificNote({ title, detail }) {
  return (
    <div className="tck-specific-note">
      <i className="pi pi-info-circle" />
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

function ReadOnlyData({ label, value }) {
  return (
    <div className="tck-readonly-data">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryCard({ icon, title, detail, actionLabel, onAction }) {
  return (
    <section className="tck-summary-card">
      <span className="tck-summary-icon">
        <i className={icon} />
      </span>
      <div className="tck-summary-copy">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <Button type="button" icon="pi pi-pencil" label={actionLabel} className="tck-card-action" onClick={onAction} />
    </section>
  );
}

function BlockRow({ block, index, selected, onSelect, onToggle, onToggleKey }) {
  return (
    <button
      type="button"
      className={["tck-block-row", selected ? "is-selected" : "", !block.visible ? "is-muted" : "", block.required ? "is-required" : ""].filter(Boolean).join(" ")}
      onClick={onSelect}
    >
      <span className="tck-block-order">{String(index + 1).padStart(2, "0")}</span>
      <span className="tck-block-icon">
        <i className={BLOCK_LIBRARY.find((item) => item.type === block.type)?.icon || "pi pi-ticket"} />
      </span>
      <span className="tck-block-copy">
        <strong>{block.label}</strong>
        <small>{block.required ? "Obligatorio" : block.visible ? "Visible" : "Oculto"}</small>
      </span>
      <span className="tck-block-toggle" role="switch" aria-checked={block.visible} aria-disabled={block.required} tabIndex={0} onClick={onToggle} onKeyDown={onToggleKey} />
    </button>
  );
}

function DialogDone({ onClick }) {
  return (
    <div className="tck-dialog-footer">
      <Button type="button" icon="pi pi-check" label="Listo" className="tck-dialog-apply" onClick={onClick} />
    </div>
  );
}

function SelectField({ label, value, options, onChange, disabled = false }) {
  return (
    <label className="tck-field">
      <span>{label}</span>
      <Dropdown
        value={value}
        options={options}
        panelClassName="tck-select-panel"
        disabled={disabled}
        onChange={(event) => onChange(event.value)}
      />
    </label>
  );
}

function ToggleChip({ label, checked, onChange }) {
  return (
    <button type="button" className={["tck-toggle-chip", checked ? "is-on" : ""].filter(Boolean).join(" ")} onClick={onChange} role="switch" aria-checked={checked}>
      <i className={checked ? "pi pi-check" : "pi pi-minus"} />
      <span>{label}</span>
    </button>
  );
}

function OutputOption({ icon, title, detail, checked, onChange }) {
  return (
    <button type="button" className={["tck-output-option", checked ? "is-on" : ""].filter(Boolean).join(" ")} onClick={onChange} role="switch" aria-checked={checked}>
      <span className="tck-summary-icon">
        <i className={icon} />
      </span>
      <span className="tck-output-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <i className={checked ? "pi pi-check" : "pi pi-minus"} />
    </button>
  );
}

function blockModalDetail(block) {
  if (block?.type === "LOGO") return "Imagen independiente del encabezado.";
  if (block?.type === "PRODUCTS") return "Layout fijo para productos, cantidades e importes.";
  if (block?.type === "TOTALS") return "Totales, descuentos y monto final.";
  if (block?.type === "STORE_HEADER") return "Estilo del bloque principal del ticket.";
  return "Ajustes propios del bloque seleccionado.";
}
