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
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { APIfetchApi } from "../../../API/APIfetch";
import { endpoints } from "../../../API/api";
import TicketCanvasPreview from "./TicketCanvasPreview";
import TicketQuickSettingsPanel from "./TicketQuickSettingsPanel";
import { DEFAULT_CONFIG } from "./ticketTemplateDefaults";
import {
  getTemplateFromConfig,
  normalizeConfig,
  readApiPayload,
  serializeTemplate,
} from "./ticketTemplateUtils";
import { imprimirTicket } from "../../../utils/ticketService";
import "../../../style/components/Configuracion/Ticket.css";

const api = new APIfetchApi();

const TicketConfig = forwardRef(function TicketConfig(_props, ref) {
  const [config, setConfig] = useState(() => normalizeConfig(DEFAULT_CONFIG));
  const [savedConfig, setSavedConfig] = useState(() => normalizeConfig(DEFAULT_CONFIG));
  const [selectedBlockId, setSelectedBlockId] = useState("store-header");
  const [activeTicketEditor, setActiveTicketEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printingExample, setPrintingExample] = useState(false);
  const [confirmPrintOpen, setConfirmPrintOpen] = useState(false);
  const [error, setError] = useState("");
  const toastRef = useRef(null);

  const dirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(savedConfig),
    [config, savedConfig]
  );

  const template = useMemo(() => getTemplateFromConfig(config), [config]);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.fetchApi({}, "GET", null, endpoints.ticketConfig);
      const payload = await readApiPayload(response, "configuracion de ticket");
      const nextConfig = normalizeConfig(payload);
      setConfig(nextConfig);
      setSavedConfig(nextConfig);
      setSelectedBlockId(getTemplateFromConfig(nextConfig).blocks[0]?.id || null);
    } catch (requestError) {
      setError(requestError.message || "No se pudo cargar la configuracion de ticket.");
    } finally {
      setLoading(false);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: loadConfig,
  }));

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (!template.blocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(template.blocks[0]?.id || null);
    }
  }, [selectedBlockId, template.blocks]);

  const selectTicketBlock = useCallback((blockId) => {
    setSelectedBlockId(blockId);
  }, []);

  const openTicketEditor = useCallback((blockId, area = "block") => {
    setSelectedBlockId(blockId);
    setActiveTicketEditor({ blockId, type: area, stamp: Date.now() });
  }, []);

  const showToast = (severity, summary, detail) => {
    toastRef.current?.show({ severity, summary, detail, life: 3200 });
  };

  const saveConfig = async () => {
    setSaving(true);
    setError("");
    try {
      const body = {
        ...config,
        templateJson: serializeTemplate(getTemplateFromConfig(config)),
      };
      const response = await api.fetchApi({}, "PUT", body, endpoints.ticketConfig);
      const payload = await readApiPayload(response, "guardar ticket");
      const nextConfig = normalizeConfig(payload);
      setConfig(nextConfig);
      setSavedConfig(nextConfig);
      showToast("success", "Ticket", "Configuracion guardada.");
    } catch (requestError) {
      setError(requestError.message || "No se pudo guardar la configuracion.");
      showToast("error", "Ticket", requestError.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const restoreBase = () => {
    confirmDialog({
      header: "Restaurar ticket base",
      message:
        "Se reemplazara la plantilla actual por el formato base de Galtek One.",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Restaurar",
      rejectLabel: "Cancelar",
      acceptClassName: "tck-confirm-accept",
      rejectClassName: "tck-confirm-reject",
      accept: async () => {
        setSaving(true);
        try {
          const response = await api.fetchApi({}, "POST", {}, endpoints.ticketConfigRestore);
          const payload = await readApiPayload(response, "restaurar ticket");
          const nextConfig = normalizeConfig(payload);
          setConfig(nextConfig);
          setSavedConfig(nextConfig);
          setSelectedBlockId(getTemplateFromConfig(nextConfig).blocks[0]?.id || null);
          showToast("success", "Ticket", "Plantilla base restaurada.");
        } catch (requestError) {
          setError(requestError.message || "No se pudo restaurar la plantilla.");
          showToast("error", "Ticket", requestError.message || "No se pudo restaurar.");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const buildExampleTicketPayload = () => ({
    carrito: [
      { nombre: "Cafe molido 500 g", cantidad: 1, precio: 86 },
      { nombre: "Leche entera 1 L", cantidad: 2, precio: 24.5 },
      { nombre: "Pan dulce surtido", cantidad: 3, precio: 12 },
    ],
    subtotal: 171,
    descuento: 5,
    total: 166,
    recibido: 200,
    cambio: 34,
    metodoPago: "EFECTIVO",
    folio: "VTA-000284",
    fecha: "12 jul 2026 14:32",
    caja: "Caja principal",
    cajero: "Laura Martinez",
    printerName: config.defaultPrinterName || "",
  });

  const sendExampleToPrinter = async () => {
    setPrintingExample(true);
    try {
      const resultado = await imprimirTicket(buildExampleTicketPayload());

      showToast(
        resultado.ok ? "success" : "warn",
        "Ticket",
        resultado.mensaje || "Prueba de impresion procesada."
      );
      if (resultado.ok) {
        setConfirmPrintOpen(false);
      }
    } catch (requestError) {
      showToast("error", "Ticket", requestError.message || "No se pudo imprimir el ejemplo.");
    } finally {
      setPrintingExample(false);
    }
  };

  const printExample = async () => {
    if (config.askBeforePrint) {
      setConfirmPrintOpen(true);
      return;
    }
    await sendExampleToPrinter();
  };

  if (loading) {
    return (
      <div className="tck-page">
        <Toast ref={toastRef} />
        <div className="tck-loading-grid">
          <Skeleton height="100%" />
          <Skeleton height="100%" />
          <Skeleton height="100%" />
        </div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="tck-page">
        <Toast ref={toastRef} />
        <section className="tck-error">
          <i className="pi pi-exclamation-triangle" />
          <strong>No se pudo cargar Ticket e impresion</strong>
          <span>{error}</span>
          <Button icon="pi pi-refresh" label="Reintentar" onClick={loadConfig} />
        </section>
      </div>
    );
  }

  return (
    <div className="tck-page">
      <Toast ref={toastRef} />
      <ConfirmDialog className="tck-confirm-dialog" />
      <Dialog
        visible={confirmPrintOpen}
        className="tck-config-dialog tck-print-confirm-dialog"
        header="Confirmar impresion"
        modal
        draggable={false}
        resizable={false}
        onHide={() => setConfirmPrintOpen(false)}
        footer={
          <div className="tck-dialog-footer">
            <Button
              type="button"
              label="Cancelar"
              className="tck-dialog-cancel"
              disabled={printingExample}
              onClick={() => setConfirmPrintOpen(false)}
            />
            <Button
              type="button"
              icon={printingExample ? "pi pi-spin pi-spinner" : "pi pi-print"}
              label={printingExample ? "Imprimiendo" : "Imprimir"}
              className="tck-dialog-apply"
              disabled={printingExample}
              onClick={sendExampleToPrinter}
            />
          </div>
        }
      >
        <div className="tck-print-confirm-body">
          <div className="tck-print-confirm-copy">
            <span className="tck-summary-icon">
              <i className="pi pi-print" />
            </span>
            <div>
              <strong>Vista previa interna</strong>
              <span>
                Esta confirmacion no depende del tamano A4 de Brave. Al imprimir se envia directo
                a la impresora configurada.
              </span>
            </div>
          </div>
          <div className="tck-print-confirm-preview">
            <TicketCanvasPreview
              config={config}
              selectedBlockId={selectedBlockId}
              onSelectBlock={() => {}}
            />
          </div>
        </div>
      </Dialog>

      {error ? (
        <div className="tck-inline-error">
          <i className="pi pi-exclamation-triangle" />
          <span>{error}</span>
          <Button type="button" icon="pi pi-times" text onClick={() => setError("")} />
        </div>
      ) : null}

      <div className="tck-editor-grid">
        <TicketQuickSettingsPanel
          config={config}
          selectedBlockId={selectedBlockId}
          activeTicketEditor={activeTicketEditor}
          onActiveEditorChange={setActiveTicketEditor}
          onConfigChange={setConfig}
          onSelectBlock={selectTicketBlock}
          onRestore={restoreBase}
          onSave={saveConfig}
          onPrintExample={printExample}
          saving={saving}
          printingExample={printingExample}
          dirty={dirty}
        />

        <TicketCanvasPreview
          config={config}
          selectedBlockId={selectedBlockId}
          onSelectBlock={openTicketEditor}
        />
      </div>
    </div>
  );
});

export default TicketConfig;
