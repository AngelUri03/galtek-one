import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Shell from "../common/Shell";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Tooltip } from "primereact/tooltip";
import ProveedorAdvancedModals from "./ProveedorAdvancedModals";
import ProveedorDetailPanel from "./ProveedorDetailPanel";
import ProveedorEditorPanel from "./ProveedorEditorPanel";
import ProveedoresFilters from "./ProveedoresFilters";
import ProveedoresSummary from "./ProveedoresSummary";
import ProveedoresTable from "./ProveedoresTable";
import {
  emptyFilters,
  getListPayload,
  hasKnownCount,
  normalizeProveedor,
  readApiPayload,
  searchableText,
} from "./proveedoresUtils";
import "../../style/components/Proveedores/Proveedores.css";

const api = new APIfetchApi();

const DETAIL_ENRICH_LIMIT = 80;

const getDetailUrl = (idProveedor) => `${endpoints.proveedores}/${idProveedor}`;
const getDeleteReviewUrl = (idProveedor) =>
  `${endpoints.proveedores}/${idProveedor}/eliminacion-segura`;
const getContactUrl = (idProveedor, idContacto) =>
  idContacto
    ? `${endpoints.proveedores}/${idProveedor}/contactos/${idContacto}`
    : `${endpoints.proveedores}/${idProveedor}/contactos`;
const getSubresourceUrl = (idProveedor, resource) =>
  `${endpoints.proveedores}/${idProveedor}/${resource}`;

const proveedorSubresourceKeys = ["contactos", "productos", "activos", "documentos"];

const pickSubresourceKeys = (mode) => {
  if (Array.isArray(mode)) return mode;
  if (mode === "summary") return ["productos", "activos"];
  return proveedorSubresourceKeys;
};

const actionMessages = {
  desactivar: {
    title: "Desactivar proveedor",
    success: "Proveedor desactivado.",
    confirmLabel: "Desactivar",
    placeholder: "Ej. Ya no surte temporalmente la tienda.",
    detail: "El proveedor queda fuera de la operacion diaria, pero conserva historial, compras, productos, activos y documentos.",
    consequences: [
      "No aparecera por defecto para nuevas operaciones.",
      "Su historial comercial se conserva para consulta.",
      "Puede reactivarse cuando vuelva a surtir.",
    ],
  },
  archivar: {
    title: "Archivar proveedor",
    success: "Proveedor archivado.",
    confirmLabel: "Archivar",
    placeholder: "Ej. Relacion cerrada, se conserva para historial.",
    detail: "El proveedor se retira de la operacion normal y queda disponible solo como consulta historica.",
    consequences: [
      "No aparece en flujos operativos normales.",
      "Se conservan compras, productos, activos y documentos.",
      "Puede reactivarse si la relacion comercial vuelve a operar.",
    ],
  },
  reactivar: {
    title: "Reactivar proveedor",
    success: "Proveedor reactivado.",
    confirmLabel: "Reactivar",
    placeholder: "Ej. Vuelve a surtir la tienda esta semana.",
    detail: "El proveedor volvera a estar disponible para operacion diaria.",
    consequences: [
      "Aparecera como proveedor activo.",
      "Se mantiene todo el historial previo.",
      "Podra asociarse a productos y usarse en abastecimiento.",
    ],
  },
  eliminar: {
    title: "Eliminar proveedor fisicamente",
    success: "Proveedor eliminado.",
    confirmLabel: "Eliminar fisicamente",
    placeholder: "Ej. Alta capturada por error y sin uso real.",
    detail: "Esta accion solo procede si el backend confirma que el proveedor no tiene uso ni historial relevante.",
    consequences: [
      "Solo aplica a proveedores creados por error.",
      "No procede si tiene compras, productos, activos, documentos, contactos o auditoria.",
      "Si tiene historial, usa desactivar o archivar.",
    ],
  },
};

const dependencyLabels = {
  comprasHistoricas: "Compras historicas",
  productosAsociados: "Productos asociados",
  contactos: "Contactos",
  activosPrestados: "Activos prestados",
  documentosAnexos: "Documentos anexos",
  auditoriaRelevante: "Auditoria relevante",
};

const hiddenDependencyKeys = new Set([["acu", "erdos", "Comerciales"].join("")]);

const normalizeCategoriaOptions = (rows = []) =>
  rows
    .filter((row) => row?.estatus !== false)
    .map((row) => {
      const label = row?.nombreCategoria || row?.nombre || row?.label || "";
      return label ? { label, value: label } : null;
    })
    .filter(Boolean)
    .filter(
      (option, index, options) =>
        options.findIndex((candidate) => candidate.value === option.value) === index
    )
    .sort((a, b) => a.label.localeCompare(b.label, "es"));

const isDeleteBlocked = (action) =>
  action?.action === "eliminar" && action?.deletePolicy?.puedeEliminar === false;

const mergeProveedorResult = (current, result) => {
  if (!current && !result) return null;
  return normalizeProveedor({
    ...(current?.raw || {}),
    ...(current || {}),
    ...(result || {}),
    contactos: current?.contactos || result?.contactos,
    productosAsociados: current?.productosAsociados || result?.productosAsociados,
    activosPrestados: current?.activosPrestados || result?.activosPrestados,
    documentos: current?.documentos || result?.documentos,
  });
};

export default function Proveedores() {
  const toast = useRef(null);
  const [proveedores, setProveedores] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [editorProveedor, setEditorProveedor] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionPreparing, setActionPreparing] = useState(false);
  const [advancedSection, setAdvancedSection] = useState(null);
  const [categoriaOptions, setCategoriaOptions] = useState([]);
  const [categoriasLoading, setCategoriasLoading] = useState(false);

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3200 });
  }, []);

  const fetchProveedorSubresources = useCallback(async (idProveedor, mode = "all") => {
    const keys = pickSubresourceKeys(mode);
    const responses = await Promise.allSettled(
      keys.map(async (key) => {
        const response = await api.fetchApi(
          {},
          "GET",
          undefined,
          getSubresourceUrl(idProveedor, key),
          { logoutOnUnauthorized: false }
        );
        return [key, getListPayload(await readApiPayload(response, key))];
      })
    );

    return responses.reduce((acc, result) => {
      if (result.status === "fulfilled") {
        const [key, rows] = result.value;
        acc[key] = rows;
      } else {
        console.warn("No se pudo cargar subrecurso de proveedor:", result.reason);
      }
      return acc;
    }, {});
  }, []);

  const fetchProveedorDetail = useCallback(async (proveedor, options = {}) => {
    if (!proveedor?.idProveedor) return proveedor;

    try {
      let detail = null;
      try {
        const response = await api.fetchApi(
          {},
          "GET",
          undefined,
          getDetailUrl(proveedor.idProveedor),
          { logoutOnUnauthorized: false }
        );
        detail = await readApiPayload(response, "detalle de proveedor");
      } catch (error) {
        console.warn("No se pudo cargar detalle base de proveedor:", error);
      }

      const subresources = options?.subresources
        ? await fetchProveedorSubresources(proveedor.idProveedor, options.subresources)
        : {};

      if (!detail && !Object.keys(subresources).length) {
        return normalizeProveedor(proveedor);
      }

      return normalizeProveedor(proveedor, { ...(detail || {}), ...subresources });
    } catch (error) {
      console.warn("No se pudo enriquecer proveedor:", error);
      return normalizeProveedor(proveedor);
    }
  }, [fetchProveedorSubresources]);

  const fetchCategorias = useCallback(async () => {
    setCategoriasLoading(true);
    try {
      const response = await api.fetchApi(
        {},
        "GET",
        undefined,
        endpoints.categorias,
        { logoutOnUnauthorized: false }
      );
      const payloadData = await readApiPayload(response, "categorias");
      setCategoriaOptions(normalizeCategoriaOptions(getListPayload(payloadData)));
    } catch (error) {
      console.warn("No se pudo cargar categorias para proveedores:", error);
      setCategoriaOptions([]);
    } finally {
      setCategoriasLoading(false);
    }
  }, []);

  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.fetchApi({}, "GET", undefined, endpoints.proveedores);
      const payloadData = await readApiPayload(response, "proveedores");
      const baseRows = getListPayload(payloadData).map((proveedor) =>
        normalizeProveedor(proveedor)
      );

      setProveedores(baseRows);

      if (baseRows.length && baseRows.length <= DETAIL_ENRICH_LIMIT) {
        setDetailLoading(true);
        const enriched = await Promise.all(
          baseRows.map((proveedor) => fetchProveedorDetail(proveedor, { subresources: "all" }))
        );
        setProveedores(enriched);
      }
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      setProveedores([]);
      setLoadError(error?.message || "No se pudo cargar proveedores.");
      showToast("error", "Proveedores", "No se pudo cargar la lista.");
    } finally {
      setLoading(false);
      setDetailLoading(false);
    }
  }, [fetchProveedorDetail, showToast]);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const stats = useMemo(() => {
    const knownProducts = proveedores.every((proveedor) =>
      hasKnownCount(proveedor.productosAsociadosCount)
    );
    const knownAssets = proveedores.every((proveedor) =>
      hasKnownCount(proveedor.activosPrestadosCount)
    );

    return {
      total: proveedores.length,
      activos: proveedores.filter((proveedor) => proveedor.estadoProveedor === "ACTIVO").length,
      inactivos: proveedores.filter((proveedor) => proveedor.estadoProveedor === "INACTIVO").length,
      archivados: proveedores.filter((proveedor) => proveedor.estadoProveedor === "ARCHIVADO").length,
      sinProductos: knownProducts
        ? proveedores.filter((proveedor) => Number(proveedor.productosAsociadosCount) === 0).length
        : null,
      conActivos: knownAssets
        ? proveedores.filter((proveedor) => Number(proveedor.activosPrestadosCount) > 0).length
        : null,
    };
  }, [proveedores]);

  const filteredProveedores = useMemo(() => {
    const query = search.trim().toLowerCase();

    return proveedores.filter((proveedor) => {
      const matchesSearch = !query || searchableText(proveedor).includes(query);
      const matchesEstado =
        filters.estado === "TODOS" || proveedor.estadoProveedor === filters.estado;
      const matchesTipo =
        filters.tipo === "TODOS" || proveedor.tipoProveedor === filters.tipo;
      const matchesModalidad =
        filters.modalidad === "TODOS" ||
        proveedor.modalidadAbastecimiento === filters.modalidad;
      const matchesPago =
        filters.pago === "TODOS" || proveedor.formaPagoPrincipal === filters.pago;
      const matchesProductos =
        filters.productos === "TODOS" ||
        (hasKnownCount(proveedor.productosAsociadosCount) &&
          ((filters.productos === "CON_PRODUCTOS" &&
            Number(proveedor.productosAsociadosCount) > 0) ||
            (filters.productos === "SIN_PRODUCTOS" &&
              Number(proveedor.productosAsociadosCount) === 0)));
      const matchesActivos =
        filters.activos === "TODOS" ||
        (hasKnownCount(proveedor.activosPrestadosCount) &&
          Number(proveedor.activosPrestadosCount) > 0);

      return (
        matchesSearch &&
        matchesEstado &&
        matchesTipo &&
        matchesModalidad &&
        matchesPago &&
        matchesProductos &&
        matchesActivos
      );
    });
  }, [filters, proveedores, search]);

  const openCreate = () => {
    setEditorMode("create");
    setEditorProveedor(null);
    setEditorLoading(false);
    setEditorVisible(true);
  };

  const updateProveedorInList = useCallback((proveedor) => {
    setProveedores((prev) =>
      prev.map((item) => (item.idProveedor === proveedor.idProveedor ? proveedor : item))
    );
  }, []);

  const openEdit = async (proveedor) => {
    if (!proveedor) return;

    setDetailVisible(false);
    setEditorMode("edit");
    setEditorProveedor(proveedor);
    setEditorVisible(true);

    if (!proveedor.detailLoaded) {
      setEditorLoading(true);
      const enriched = await fetchProveedorDetail(proveedor, { subresources: "all" });
      setEditorProveedor(enriched);
      updateProveedorInList(enriched);
      setEditorLoading(false);
    }
  };

  const openDetail = async (proveedor) => {
    setSelectedProveedor(proveedor);
    setDetailVisible(true);

    if (!proveedor.detailLoaded) {
      setDetailLoading(true);
      const enriched = await fetchProveedorDetail(proveedor, { subresources: "all" });
      setSelectedProveedor(enriched);
      updateProveedorInList(enriched);
      setDetailLoading(false);
    }
  };

  const openAdvancedSectionForProveedor = async (proveedor, section) => {
    if (!proveedor?.idProveedor) return;

    setSelectedProveedor(proveedor);
    let target = proveedor;
    if (!proveedor.detailLoaded) {
      setDetailLoading(true);
      target = await fetchProveedorDetail(proveedor, { subresources: "all" });
      setSelectedProveedor(target);
      updateProveedorInList(target);
      setDetailLoading(false);
    }
    setDetailVisible(false);
    setAdvancedSection(section);
  };

  const refreshSelectedProveedor = useCallback(async () => {
    if (!selectedProveedor?.idProveedor) return;

    setDetailLoading(true);
    const enriched = await fetchProveedorDetail(selectedProveedor, { subresources: "all" });
    setSelectedProveedor(enriched);
    updateProveedorInList(enriched);
    setDetailLoading(false);
  }, [fetchProveedorDetail, selectedProveedor, updateProveedorInList]);

  const syncContactos = async (idProveedor, contactos, contactRefs, deletedContactIds) => {
    if (!idProveedor) return;

    for (const idContacto of deletedContactIds) {
      const response = await api.fetchApi(
        {},
        "DELETE",
        undefined,
        getContactUrl(idProveedor, idContacto)
      );
      await readApiPayload(response, "eliminar contacto");
    }

    for (let index = 0; index < contactos.length; index += 1) {
      const payload = contactos[index];
      const ref = contactRefs[index];
      const idContacto = ref?.idProveedorContacto;
      const method = idContacto ? "PUT" : "POST";
      const response = await api.fetchApi(
        {},
        method,
        payload,
        getContactUrl(idProveedor, idContacto)
      );
      await readApiPayload(response, "guardar contacto");
    }
  };

  const saveProveedor = async ({ proveedor, contactos, contactRefs, deletedContactIds }) => {
    setSaving(true);
    try {
      const editing = editorMode === "edit" && editorProveedor?.idProveedor;
      const url = editing
        ? `${endpoints.proveedores}/${editorProveedor.idProveedor}`
        : endpoints.proveedores;
      const method = editing ? "PUT" : "POST";
      const response = await api.fetchApi({}, method, proveedor, url);
      const saved = await readApiPayload(response, "guardar proveedor");
      const savedId =
        saved?.idProveedor || saved?.id || editorProveedor?.idProveedor || proveedor?.idProveedor;

      await syncContactos(savedId, contactos, contactRefs, deletedContactIds);

      showToast(
        "success",
        "Proveedor guardado",
        editing ? "Proveedor actualizado correctamente." : "Proveedor creado correctamente."
      );
      setEditorVisible(false);
      setEditorProveedor(null);
      await fetchProveedores();
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      showToast("error", "Proveedores", error?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const fetchDeletePolicy = async (proveedor) => {
    const response = await api.fetchApi(
      {},
      "GET",
      undefined,
      getDeleteReviewUrl(proveedor.idProveedor)
    );
    return readApiPayload(response, "revisar eliminacion");
  };

  const openProveedorAction = async (action, proveedor) => {
    if (!proveedor || !actionMessages[action]) return;

    const baseAction = {
      action,
      proveedor,
      motivo: "",
      deletePolicy: null,
      ...actionMessages[action],
    };

    if (action !== "eliminar") {
      setConfirmAction(baseAction);
      return;
    }

    setActionPreparing(true);
    setConfirmAction({ ...baseAction, loadingPolicy: true });
    try {
      const deletePolicy = await fetchDeletePolicy(proveedor);
      setConfirmAction((prev) =>
        prev?.proveedor?.idProveedor === proveedor.idProveedor
          ? { ...prev, deletePolicy, loadingPolicy: false }
          : prev
      );
    } catch (error) {
      console.error("Error al revisar eliminacion:", error);
      setConfirmAction((prev) =>
        prev?.proveedor?.idProveedor === proveedor.idProveedor
          ? {
              ...prev,
              deletePolicy: {
                puedeEliminar: false,
                motivos: [error?.message || "No se pudo revisar la eliminacion segura."],
                mensaje: "No se puede confirmar eliminacion sin validacion del backend.",
              },
              loadingPolicy: false,
            }
          : prev
      );
      showToast("error", "Proveedores", "No se pudo revisar la eliminacion segura.");
    } finally {
      setActionPreparing(false);
    }
  };

  const updateSelectedFromAction = useCallback((proveedor, result) => {
    setSelectedProveedor((prev) => {
      if (!prev || prev.idProveedor !== proveedor.idProveedor) return prev;
      return mergeProveedorResult(prev, result);
    });
  }, []);

  const runProveedorAction = async (action, proveedor, motivo) => {
    const urls = {
      desactivar: `${endpoints.proveedores}/${proveedor.idProveedor}/desactivar`,
      archivar: `${endpoints.proveedores}/${proveedor.idProveedor}/archivar`,
      reactivar: `${endpoints.proveedores}/${proveedor.idProveedor}/reactivar`,
      eliminar: `${endpoints.proveedores}/${proveedor.idProveedor}`,
    };

    const method = action === "eliminar" ? "DELETE" : "PUT";
    const response = await api.fetchApi({}, method, { motivo }, urls[action]);
    return readApiPayload(response, action);
  };

  const confirmProveedorAction = async () => {
    if (!confirmAction) return;
    if (!confirmAction.motivo?.trim()) {
      showToast("warn", "Motivo requerido", "Captura el motivo para continuar.");
      return;
    }
    if (isDeleteBlocked(confirmAction)) {
      showToast("warn", "Eliminacion bloqueada", "Usa desactivar o archivar para conservar historial.");
      return;
    }

    setSaving(true);
    try {
      const result = await runProveedorAction(
        confirmAction.action,
        confirmAction.proveedor,
        confirmAction.motivo
      );
      if (confirmAction.action === "eliminar") {
        setProveedores((prev) =>
          prev.filter((item) => item.idProveedor !== confirmAction.proveedor.idProveedor)
        );
        if (selectedProveedor?.idProveedor === confirmAction.proveedor.idProveedor) {
          setDetailVisible(false);
          setSelectedProveedor(null);
        }
      } else {
        const updated = mergeProveedorResult(confirmAction.proveedor, result);
        updateProveedorInList(updated);
        updateSelectedFromAction(confirmAction.proveedor, result);
      }
      setConfirmAction(null);
      showToast("success", "Proveedores", confirmAction.success);
    } catch (error) {
      console.error("Error en accion de proveedor:", error);
      showToast("error", "Proveedores", error?.message || "No se pudo completar la accion.");
    } finally {
      setSaving(false);
    }
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearch("");
    setFilters(emptyFilters);
  };

  const deleteBlocked = isDeleteBlocked(confirmAction);
  const confirmDisabled =
    saving ||
    actionPreparing ||
    confirmAction?.loadingPolicy ||
    !confirmAction?.motivo?.trim() ||
    deleteBlocked;
  const deleteDependencies = confirmAction?.deletePolicy?.dependencias || {};
  const deleteReasons = Array.isArray(confirmAction?.deletePolicy?.motivos)
    ? confirmAction.deletePolicy.motivos
    : [];
  const deleteDependencyEntries = Object.entries(deleteDependencies)
    .filter(([key]) => !hiddenDependencyKeys.has(key))
    .filter(([, value]) => Number(value) > 0);

  return (
    <Shell>
      <Toast ref={toast} className="prov-toast" />
      <Tooltip />

      <main className="proveedores-page">
        <section className="prov-header">
          <div className="prov-header-title">
            <i className="pi pi-truck" />
            <span>PROVEEDORES</span>
          </div>
          <Button
            label="Agregar proveedor"
            icon="pi pi-plus"
            className="prov-primary-btn"
            onClick={openCreate}
          />
        </section>

        <ProveedoresSummary stats={stats} loading={loading && !proveedores.length} />

        <ProveedoresFilters
          search={search}
          filters={filters}
          loading={loading || detailLoading}
          onSearchChange={setSearch}
          onFilterChange={updateFilter}
          onClear={clearFilters}
          onRefresh={fetchProveedores}
        />

        <section className="prov-table-shell">
          <div className="prov-table-head">
            <div>
              <strong>Relacion comercial</strong>
              <span>
                {filteredProveedores.length} de {proveedores.length} proveedores
              </span>
            </div>
            {detailLoading ? <small>Actualizando datos comerciales...</small> : null}
          </div>

          {loadError ? (
            <div className="prov-error-state">
              <i className="pi pi-exclamation-triangle" />
              <strong>No se pudo cargar proveedores</strong>
              <span>{loadError}</span>
              <Button
                label="Reintentar"
                icon="pi pi-refresh"
                className="prov-soft-btn"
                onClick={fetchProveedores}
              />
            </div>
          ) : (
            <ProveedoresTable
              rows={filteredProveedores}
              loading={loading || detailLoading || saving || actionPreparing}
              hasProviders={proveedores.length > 0}
              onView={openDetail}
              onEdit={openEdit}
              onManage={openAdvancedSectionForProveedor}
              onAction={openProveedorAction}
            />
          )}
        </section>
      </main>

      <ProveedorEditorPanel
        visible={editorVisible}
        mode={editorMode}
        proveedor={editorProveedor}
        loading={editorLoading}
        saving={saving}
        categoriaOptions={categoriaOptions}
        categoriasLoading={categoriasLoading}
        onHide={() => setEditorVisible(false)}
        onSave={saveProveedor}
      />

      <ProveedorDetailPanel
        proveedor={selectedProveedor}
        visible={detailVisible}
        loading={detailLoading}
        onHide={() => setDetailVisible(false)}
      />

      <ProveedorAdvancedModals
        section={advancedSection}
        proveedor={selectedProveedor}
        onHide={() => setAdvancedSection(null)}
        onRefresh={refreshSelectedProveedor}
        showToast={showToast}
      />

      <Dialog
        header={confirmAction?.title || ""}
        visible={Boolean(confirmAction)}
        onHide={() => setConfirmAction(null)}
        modal
        draggable={false}
        dismissableMask
        className="prov-confirm-dialog"
        style={{ width: "34rem" }}
        footer={
          <div className="prov-dialog-footer">
            <Button
              label={deleteBlocked ? "Cerrar" : "Cancelar"}
              className="p-button-text prov-text-btn"
              onClick={() => setConfirmAction(null)}
              disabled={saving || actionPreparing}
            />
            {!deleteBlocked ? (
              <Button
                label={confirmAction?.confirmLabel || "Confirmar"}
                icon={confirmAction?.action === "eliminar" ? "pi pi-trash" : "pi pi-check"}
                className={
                  confirmAction?.action === "eliminar"
                    ? "prov-danger-btn"
                    : "prov-primary-btn"
                }
                onClick={confirmProveedorAction}
                loading={saving}
                disabled={confirmDisabled}
              />
            ) : null}
          </div>
        }
      >
        <div className="prov-safe-action-body">
          <p className="prov-confirm-text">{confirmAction?.detail}</p>

          {confirmAction?.consequences?.length ? (
            <div className="prov-safe-box">
              <strong>Consecuencias</strong>
              <ul>
                {confirmAction.consequences.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {confirmAction?.action === "eliminar" ? (
            <div className={deleteBlocked ? "prov-delete-policy is-blocked" : "prov-delete-policy"}>
              {confirmAction.loadingPolicy ? (
                <span>Revisando historial y relaciones del proveedor...</span>
              ) : (
                <>
                  <strong>
                    {confirmAction.deletePolicy?.puedeEliminar
                      ? "Eliminacion permitida"
                      : "Eliminacion bloqueada"}
                  </strong>
                  <p>
                    {confirmAction.deletePolicy?.mensaje ||
                      "El backend debe validar que no exista uso antes de eliminar."}
                  </p>
                  {deleteReasons.length ? (
                    <ul>
                      {deleteReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  ) : null}
                  {deleteDependencyEntries.length ? (
                    <div className="prov-delete-counts">
                      {deleteDependencyEntries.map(([key, value]) => (
                          <span key={key}>
                            {dependencyLabels[key] || key}: {value}
                          </span>
                        ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {!deleteBlocked ? (
            <label className="prov-field prov-safe-reason">
              <span>Motivo</span>
              <InputTextarea
                value={confirmAction?.motivo || ""}
                onChange={(event) =>
                  setConfirmAction((prev) =>
                    prev ? { ...prev, motivo: event.target.value } : prev
                  )
                }
                rows={3}
                autoResize
                maxLength={500}
                placeholder={confirmAction?.placeholder}
                disabled={saving || actionPreparing || confirmAction?.loadingPolicy}
              />
              <small>
                Este motivo queda asociado a la auditoria del proveedor.
              </small>
            </label>
          ) : null}
        </div>
      </Dialog>
    </Shell>
  );
}
