import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { ModalSurface, WorkspaceDrawer } from "../common/OverlaySurfaces";
import ProveedorActivosSection, { ProveedorActivoFormView } from "./ProveedorActivosSection";
import { ProveedorActivoHistoryContent } from "./ProveedorActivoHistoryModal";
import ProveedorAuditSection from "./ProveedorAuditSection";
import ProveedorDocumentosSection, {
  DocumentoHistoryContent,
  DocumentoPreviewDialog,
  ProveedorDocumentoFormView,
} from "./ProveedorDocumentosSection";
import { ProveedorDetailContent } from "./ProveedorDetailPanel";
import ProveedorProductoCostHistory from "./ProveedorProductoCostHistory";
import ProveedorProductosSection from "./ProveedorProductosSection";
import { relationProductName } from "./proveedorAdvancedUtils";
import { readApiPayload } from "./proveedoresUtils";

const api = new APIfetchApi();

const SECTION_TITLES = {
  productos: "Productos asociados",
  activos: "Activos prestados",
  documentos: "Documentos",
  auditoria: "Auditoria",
};

function initialStack(initialSection) {
  const stack = [{ view: "detail" }];
  if (initialSection && SECTION_TITLES[initialSection]) {
    stack.push({ view: initialSection });
  }
  return stack;
}

function itemId(item, keys) {
  return keys.map((key) => item?.[key]).find(Boolean) || "nuevo";
}

function viewKey(view) {
  if (!view) return "detail";
  if (view.view === "activo-form" || view.view === "activo-history") {
    return `${view.view}:${itemId(view.item, ["idProveedorActivo"])}`;
  }
  if (view.view === "producto-history") {
    return `${view.view}:${itemId(view.item, ["idProveedorProducto"])}`;
  }
  if (view.view === "documento-form" || view.view === "documento-history") {
    return `${view.view}:${itemId(view.item, ["idProveedorDocumento"])}`;
  }
  return view.view;
}

function resolveTitle(view, proveedor) {
  if (!view || view.view === "detail") {
    return proveedor?.nombreProveedor || "Proveedor";
  }
  if (SECTION_TITLES[view.view]) return SECTION_TITLES[view.view];
  if (view.view === "activo-form") {
    return view.item?.idProveedorActivo ? "Editar activo" : "Nuevo activo";
  }
  if (view.view === "activo-history") return "Historial del activo";
  if (view.view === "producto-history") return "Historial de costos";
  if (view.view === "documento-form") {
    return view.item?.idProveedorDocumento ? "Editar documento" : "Nuevo documento";
  }
  if (view.view === "documento-history") return "Historial del documento";
  return "Proveedor";
}

function resolveSize(view) {
  if (!view || view.view === "detail") return "detail";
  if (view.view === "producto-history") return "detail";
  if (view.view.endsWith("-form")) return "form";
  return "workspace";
}

function resolveSubtitle(view, proveedor) {
  if (!view || view.view === "detail") return "Relacion comercial y contexto";
  if (view.view === "productos") return "Relacion comercial de surtido, preferencia y costos";
  if (view.view === "activos") return "Equipo, exhibidores, evidencias e historial de uso";
  if (view.view === "producto-history") {
    return view.item ? relationProductName(view.item) : "Producto asociado";
  }
  if (view.view === "documentos") return "Contratos, comodatos, listas y evidencias";
  if (view.view === "auditoria") return "Trazabilidad completa del proveedor";
  return proveedor?.nombreProveedor || "Proveedor";
}

export default function ProveedorWorkspaceDrawer({
  visible,
  proveedor,
  loading,
  initialSection,
  onHide,
  onRefresh,
  showToast,
}) {
  const bodyRef = useRef(null);
  const pendingActionRef = useRef(null);
  const hydrationKeyRef = useRef("");
  const [stack, setStack] = useState(() => initialStack(initialSection));
  const [direction, setDirection] = useState("forward");
  const [dirty, setDirty] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const [scrollPositions, setScrollPositions] = useState({});
  const [highlightedActivoId, setHighlightedActivoId] = useState(null);
  const [highlightedDocumentoId, setHighlightedDocumentoId] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [assetHistoryById, setAssetHistoryById] = useState({});
  const [assetHistoryLoading, setAssetHistoryLoading] = useState({});

  const current = useMemo(() => stack[stack.length - 1] || { view: "detail" }, [stack]);
  const previous = stack.length > 1 ? stack[stack.length - 2] : null;
  const currentKey = viewKey(current);

  const productos = useMemo(() => proveedor?.productosAsociados || [], [proveedor]);
  const activos = useMemo(() => proveedor?.activosPrestados || [], [proveedor]);
  const documentos = useMemo(() => proveedor?.documentos || [], [proveedor]);
  const estadoProveedor = String(proveedor?.estadoProveedor || "ACTIVO").toUpperCase();
  const readOnly = estadoProveedor !== "ACTIVO";

  const resolvedAsset = useMemo(() => {
    if (!current?.item?.idProveedorActivo) return current?.item || null;
    return (
      activos.find(
        (item) => Number(item.idProveedorActivo) === Number(current.item.idProveedorActivo)
      ) || current.item
    );
  }, [activos, current]);

  const resolvedDocument = useMemo(() => {
    if (!current?.item?.idProveedorDocumento) return current?.item || null;
    return (
      documentos.find(
        (item) =>
          Number(item.idProveedorDocumento) === Number(current.item.idProveedorDocumento)
      ) || current.item
    );
  }, [current, documentos]);

  const resolvedProduct = useMemo(() => {
    if (!current?.item?.idProveedorProducto) return current?.item || null;
    return (
      productos.find(
        (item) => Number(item.idProveedorProducto) === Number(current.item.idProveedorProducto)
      ) || current.item
    );
  }, [current, productos]);

  const resolvedAssetId = resolvedAsset?.idProveedorActivo || null;
  const resolvedAssetWithHistory = useMemo(() => {
    if (!resolvedAsset) return null;
    const history = assetHistoryById[resolvedAsset.idProveedorActivo];
    return Array.isArray(history) ? { ...resolvedAsset, historial: history } : resolvedAsset;
  }, [assetHistoryById, resolvedAsset]);

  useEffect(() => {
    if (!visible) return;
    setStack(initialStack(initialSection));
    setDirection("forward");
    setDirty(false);
    setScrollPositions({});
    setHighlightedActivoId(null);
    setHighlightedDocumentoId(null);
    setAssetHistoryById({});
    setAssetHistoryLoading({});
    hydrationKeyRef.current = "";
  }, [initialSection, proveedor?.idProveedor, visible]);

  useEffect(() => {
    if (!visible || loading || current.view !== "activos") return;
    const expectedActivos = Number(proveedor?.activosPrestadosCount || 0);
    if (!expectedActivos || activos.length >= expectedActivos) return;

    const hydrationKey = `${proveedor?.idProveedor || "proveedor"}:activos:${expectedActivos}:${activos.length}`;
    if (hydrationKeyRef.current === hydrationKey) return;

    hydrationKeyRef.current = hydrationKey;
    onRefresh?.();
  }, [
    activos.length,
    current.view,
    loading,
    onRefresh,
    proveedor?.activosPrestadosCount,
    proveedor?.idProveedor,
    visible,
  ]);

  useEffect(() => {
    if (!visible || current.view !== "activo-history") return undefined;
    if (!proveedor?.idProveedor || !resolvedAssetId) return undefined;

    let cancelled = false;
    setAssetHistoryLoading((prev) => ({ ...prev, [resolvedAssetId]: true }));

    api
      .fetchApi(
        {},
        "GET",
        undefined,
        `${endpoints.proveedores}/${proveedor.idProveedor}/activos/${resolvedAssetId}/historial`
      )
      .then((response) => readApiPayload(response, "historial de activo"))
      .then((payload) => {
        if (cancelled) return;
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.historial)
            ? payload.historial
            : [];
        setAssetHistoryById((prev) => ({ ...prev, [resolvedAssetId]: rows }));
      })
      .catch((error) => {
        if (cancelled) return;
        setAssetHistoryById((prev) => ({ ...prev, [resolvedAssetId]: [] }));
        showToast?.(
          "error",
          "Historial del activo",
          error?.message || "No se pudo cargar el historial."
        );
      })
      .finally(() => {
        if (cancelled) return;
        setAssetHistoryLoading((prev) => ({ ...prev, [resolvedAssetId]: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [
    current.view,
    currentKey,
    proveedor?.idProveedor,
    resolvedAssetId,
    showToast,
    visible,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTop = scrollPositions[currentKey] || 0;
      }
    }, 30);
    return () => window.clearTimeout(timer);
  }, [currentKey, scrollPositions]);

  const rememberScroll = () => {
    const scrollTop = bodyRef.current?.scrollTop || 0;
    setScrollPositions((prev) => ({ ...prev, [currentKey]: scrollTop }));
  };

  const runOrConfirm = (action) => {
    if (dirty) {
      pendingActionRef.current = action;
      setDiscardVisible(true);
      return;
    }
    action();
  };

  const pushView = (view) => {
    runOrConfirm(() => {
      rememberScroll();
      setDirection("forward");
      setDirty(false);
      setStack((prev) => [...prev, view]);
    });
  };

  const popView = () => {
    runOrConfirm(() => {
      rememberScroll();
      if (stack.length <= 1) {
        onHide?.();
        return;
      }
      setDirection("back");
      setDirty(false);
      setStack((prev) => prev.slice(0, -1));
    });
  };

  const closeDrawer = () => {
    runOrConfirm(() => {
      setDirty(false);
      onHide?.();
    });
  };

  const confirmDiscard = () => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setDirty(false);
    setDiscardVisible(false);
    action?.();
  };

  const returnAfterSave = async ({ activoId, documentoId } = {}) => {
    if (activoId) setHighlightedActivoId(activoId);
    if (documentoId) setHighlightedDocumentoId(documentoId);
    await onRefresh?.();
    setDirty(false);
    setDirection("back");
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const title = resolveTitle(current, proveedor);
  const subtitle = resolveSubtitle(current, proveedor);
  const backLabel = previous ? resolveTitle(previous, proveedor) : null;

  const content = (() => {
    if (current.view === "detail") {
      return (
        <ProveedorDetailContent
          proveedor={proveedor}
          loading={loading}
          readOnly={readOnly}
          onNavigateSection={(section) => pushView({ view: section })}
        />
      );
    }

    if (current.view === "productos") {
      return (
        <ProveedorProductosSection
          proveedor={proveedor}
          items={productos}
          loading={loading}
          onRefresh={onRefresh}
          onOpenCostHistory={(item) => pushView({ view: "producto-history", item })}
          showToast={showToast}
          readOnly={readOnly}
        />
      );
    }

    if (current.view === "producto-history") {
      return (
        <ProveedorProductoCostHistory
          proveedor={proveedor}
          item={resolvedProduct}
          showToast={showToast}
        />
      );
    }

    if (current.view === "activos") {
      return (
        <ProveedorActivosSection
          proveedor={proveedor}
          items={activos}
          documentos={documentos}
          onRefresh={onRefresh}
          showToast={showToast}
          highlightedActivoId={highlightedActivoId}
          readOnly={readOnly}
          onOpenForm={(item) => pushView({ view: "activo-form", item })}
          onOpenHistory={(item) => pushView({ view: "activo-history", item })}
        />
      );
    }

    if (current.view === "activo-form") {
      return (
        <ProveedorActivoFormView
          proveedor={proveedor}
          item={resolvedAsset}
          showToast={showToast}
          onCancel={popView}
          onDirtyChange={setDirty}
          onSaved={(saved) =>
            returnAfterSave({
              activoId:
                saved?.idProveedorActivo ||
                saved?.id ||
                resolvedAsset?.idProveedorActivo ||
                null,
            })
          }
        />
      );
    }

    if (current.view === "activo-history") {
      const historyLoaded = Array.isArray(assetHistoryById[resolvedAssetId]);
      const historyLoading = Boolean(assetHistoryLoading[resolvedAssetId]);
      if (historyLoading && !historyLoaded) {
        return (
          <div className="prov-adv-sync prov-history-loading">
            <i className="pi pi-spin pi-spinner" />
            <span>Cargando historial...</span>
          </div>
        );
      }

      return (
        <ProveedorActivoHistoryContent activo={resolvedAssetWithHistory} documentos={documentos} />
      );
    }

    if (current.view === "documentos") {
      return (
        <ProveedorDocumentosSection
          proveedor={proveedor}
          items={documentos}
          onRefresh={onRefresh}
          showToast={showToast}
          highlightedDocumentoId={highlightedDocumentoId}
          readOnly={readOnly}
          onOpenForm={(item) => pushView({ view: "documento-form", item })}
          onOpenHistory={(item) => pushView({ view: "documento-history", item })}
        />
      );
    }

    if (current.view === "documento-form") {
      return (
        <ProveedorDocumentoFormView
          proveedor={proveedor}
          item={resolvedDocument}
          showToast={showToast}
          onCancel={popView}
          onDirtyChange={setDirty}
          onSaved={(saved) =>
            returnAfterSave({
              documentoId:
                saved?.idProveedorDocumento ||
                saved?.id ||
                resolvedDocument?.idProveedorDocumento ||
                null,
            })
          }
        />
      );
    }

    if (current.view === "documento-history") {
      return (
        <>
          <DocumentoHistoryContent
            documento={resolvedDocument}
            onPreview={setDocumentPreview}
          />
          <DocumentoPreviewDialog
            documento={documentPreview}
            onHide={() => setDocumentPreview(null)}
          />
        </>
      );
    }

    if (current.view === "auditoria") {
      return <ProveedorAuditSection proveedor={proveedor} detailed showToast={showToast} />;
    }

    return null;
  })();

  return (
    <>
      <WorkspaceDrawer
        visible={visible}
        eyebrow="Proveedor"
        title={title}
        subtitle={
          estadoProveedor === "ARCHIVADO"
            ? "Proveedor archivado: no se puede usar ni editar"
            : estadoProveedor === "INACTIVO"
            ? "Proveedor inactivo: reactivalo antes de editar"
            : subtitle
        }
        backLabel={backLabel}
        onBack={previous ? popView : null}
        onClose={closeDrawer}
        onDismiss={popView}
        size={resolveSize(current)}
        direction={direction}
        focusTitle={false}
        bodyRef={bodyRef}
        className="prov-workspace-drawer"
      >
        {content}
      </WorkspaceDrawer>

      <ModalSurface
        visible={discardVisible}
        title="Descartar cambios"
        size="small"
        onHide={() => setDiscardVisible(false)}
        className="prov-confirm-dialog"
        footer={
          <div className="prov-dialog-footer">
            <Button
              label="Seguir editando"
              className="p-button-text prov-text-btn"
              onClick={() => setDiscardVisible(false)}
            />
            <Button
              label="Descartar"
              icon="pi pi-check"
              className="prov-primary-btn"
              onClick={confirmDiscard}
            />
          </div>
        }
      >
        <p className="prov-confirm-text">
          Hay cambios sin guardar en esta vista del proveedor.
        </p>
      </ModalSurface>
    </>
  );
}
