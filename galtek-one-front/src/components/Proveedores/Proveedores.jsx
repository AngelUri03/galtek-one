import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Shell from "../common/Shell";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Menu } from "primereact/menu";
import { Toast } from "primereact/toast";
import { Tooltip } from "primereact/tooltip";
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

const actionMessages = {
  desactivar: {
    title: "Desactivar proveedor",
    success: "Proveedor desactivado.",
    confirmLabel: "Desactivar",
    placeholder: "Ej. Ya no surte temporalmente la tienda.",
    detail: "El proveedor queda fuera de la operacion diaria, pero conserva historial, compras, productos, activos, documentos y acuerdos.",
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
      "Se conservan compras, productos, activos, documentos y acuerdos.",
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
      "No procede si tiene compras, productos, activos, documentos, acuerdos, contactos o auditoria.",
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
  acuerdosComerciales: "Acuerdos comerciales",
  auditoriaRelevante: "Auditoria relevante",
};

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
    acuerdos: current?.acuerdos || result?.acuerdos,
  });
};

export default function Proveedores() {
  const toast = useRef(null);
  const menuRef = useRef(null);
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
  const [menuProveedor, setMenuProveedor] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionPreparing, setActionPreparing] = useState(false);

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3200 });
  }, []);

  const fetchProveedorDetail = useCallback(async (proveedor) => {
    if (!proveedor?.idProveedor) return proveedor;

    try {
      const response = await api.fetchApi(
        {},
        "GET",
        undefined,
        getDetailUrl(proveedor.idProveedor),
        { logoutOnUnauthorized: false }
      );
      const detail = await readApiPayload(response, "detalle de proveedor");
      return normalizeProveedor(proveedor, detail);
    } catch (error) {
      console.warn("No se pudo enriquecer proveedor:", error);
      return normalizeProveedor(proveedor);
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
          baseRows.map((proveedor) => fetchProveedorDetail(proveedor))
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
      const enriched = await fetchProveedorDetail(proveedor);
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
      const enriched = await fetchProveedorDetail(proveedor);
      setSelectedProveedor(enriched);
      updateProveedorInList(enriched);
      setDetailLoading(false);
    }
  };

  const refreshSelectedProveedor = useCallback(async () => {
    if (!selectedProveedor?.idProveedor) return;

    setDetailLoading(true);
    const enriched = await fetchProveedorDetail(selectedProveedor);
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

  const openMoreOptions = (event, proveedor) => {
    setMenuProveedor(proveedor);
    menuRef.current?.toggle(event);
  };

  const menuItems = (() => {
    const estado = menuProveedor?.estadoProveedor;
    const stateItems = [];

    if (estado === "ACTIVO") {
      stateItems.push(
        {
          label: "Desactivar",
          icon: "pi pi-pause-circle",
          command: () => openProveedorAction("desactivar", menuProveedor),
        },
        {
          label: "Archivar",
          icon: "pi pi-folder",
          command: () => openProveedorAction("archivar", menuProveedor),
        }
      );
    } else if (estado === "INACTIVO") {
      stateItems.push(
        {
          label: "Reactivar",
          icon: "pi pi-check-circle",
          command: () => openProveedorAction("reactivar", menuProveedor),
        },
        {
          label: "Archivar",
          icon: "pi pi-folder",
          command: () => openProveedorAction("archivar", menuProveedor),
        }
      );
    } else {
      stateItems.push({
        label: "Reactivar",
        icon: "pi pi-check-circle",
        command: () => openProveedorAction("reactivar", menuProveedor),
      });
    }

    return [
      {
        label: "Ver detalle",
        icon: "pi pi-eye",
        command: () => menuProveedor && openDetail(menuProveedor),
      },
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => menuProveedor && openEdit(menuProveedor),
      },
      { separator: true },
      ...stateItems,
      {
        label: "Eliminar si no tiene uso",
        icon: "pi pi-shield",
        className: "prov-menu-caution",
        command: () => openProveedorAction("eliminar", menuProveedor),
      },
    ];
  })();

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

  return (
    <Shell>
      <Toast ref={toast} className="prov-toast" />
      <Tooltip />
      <Menu model={menuItems} popup ref={menuRef} className="prov-row-menu" />

      <main className="proveedores-page">
        <section className="prov-header">
          <div>
            <span className="prov-eyebrow">Abastecimiento</span>
            <h1>Proveedores</h1>
            <p>
              Relacion comercial, contactos, condiciones y activos para surtir la tienda
              sin friccion.
            </p>
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
              loading={loading}
              hasProviders={proveedores.length > 0}
              onView={openDetail}
              onEdit={openEdit}
              onMore={openMoreOptions}
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
        onHide={() => setEditorVisible(false)}
        onSave={saveProveedor}
      />

      <ProveedorDetailPanel
        proveedor={selectedProveedor}
        visible={detailVisible}
        loading={detailLoading}
        onHide={() => setDetailVisible(false)}
        onEdit={openEdit}
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
                  {Object.entries(deleteDependencies).some(
                    ([, value]) => Number(value) > 0
                  ) ? (
                    <div className="prov-delete-counts">
                      {Object.entries(deleteDependencies)
                        .filter(([, value]) => Number(value) > 0)
                        .map(([key, value]) => (
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
