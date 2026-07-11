import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Shell from "../common/Shell";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Tooltip } from "primereact/tooltip";
import ClienteDetailPanel from "./ClienteDetailPanel";
import ClienteEditorPanel from "./ClienteEditorPanel";
import ClienteAdvancedModals from "./ClienteAdvancedModals";
import ClientesFilters from "./ClientesFilters";
import ClientesSummary from "./ClientesSummary";
import ClientesTable from "./ClientesTable";
import {
  emptyFilters,
  getListPayload,
  hasAddressData,
  hasFiscalData,
  normalizeCliente,
  readApiPayload,
  searchableText,
} from "./clientesUtils";
import "../../style/components/Clientes/Clientes.css";

const api = new APIfetchApi();

const DETAIL_ENRICH_LIMIT = 80;

const getDetailUrl = (idCliente) => `${endpoints.clientes}/${idCliente}`;
const getDeleteReviewUrl = (idCliente) =>
  `${endpoints.clientes}/${idCliente}/eliminacion-segura`;

const actionMessages = {
  desactivar: {
    title: "Desactivar cliente",
    success: "Cliente desactivado.",
    confirmLabel: "Desactivar",
    placeholder: "Ej. Cliente duplicado o temporalmente fuera de uso.",
    detail: "El cliente deja de estar disponible por defecto, pero conserva historial y datos registrados.",
    consequences: [
      "No deberia aparecer por defecto en seleccion operativa.",
      "Sus ventas y datos fiscales se conservan.",
      "Puede reactivarse cuando vuelva a operar.",
    ],
  },
  archivar: {
    title: "Archivar cliente",
    success: "Cliente archivado.",
    confirmLabel: "Archivar",
    placeholder: "Ej. Cliente historico, conservar solo para consulta.",
    detail: "El cliente queda fuera de operacion normal y se conserva como referencia historica.",
    consequences: [
      "Se retira del uso diario.",
      "El historial permanece disponible para consulta.",
      "Puede reactivarse si vuelve a comprar.",
    ],
  },
  reactivar: {
    title: "Reactivar cliente",
    success: "Cliente reactivado.",
    confirmLabel: "Reactivar",
    placeholder: "Ej. Volvio a comprar y se confirma informacion.",
    detail: "El cliente vuelve a quedar disponible para operacion diaria.",
    consequences: [
      "Aparecera como cliente activo.",
      "Conserva su historial previo.",
      "Sus datos fiscales siguen siendo opcionales.",
    ],
  },
  eliminar: {
    title: "Eliminar cliente fisicamente",
    success: "Cliente eliminado.",
    confirmLabel: "Eliminar fisicamente",
    placeholder: "Ej. Alta capturada por error y sin ventas.",
    detail: "Esta accion solo procede si el backend confirma que no tiene ventas, datos fiscales ni auditoria relevante.",
    consequences: [
      "Solo aplica a altas creadas por error.",
      "No procede si tiene ventas o datos fiscales capturados.",
      "Si tiene historial, usa desactivar o archivar.",
    ],
  },
};

const dependencyLabels = {
  ventasHistoricas: "Ventas historicas",
  datosFiscales: "Datos fiscales",
  auditoriaRelevante: "Auditoria relevante",
};

const isDeleteBlocked = (action) =>
  action?.action === "eliminar" && action?.deletePolicy?.puedeEliminar === false;

const mergeClienteResult = (current, result) =>
  normalizeCliente({
    ...(current?.raw || {}),
    ...(current || {}),
    ...(result || {}),
    pedidos: current?.pedidos || result?.pedidos,
    comprasRegistradas: current?.comprasRegistradas ?? result?.comprasRegistradas,
  });

export default function Clientes() {
  const toast = useRef(null);
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [editorCliente, setEditorCliente] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionPreparing, setActionPreparing] = useState(false);
  const [advancedSection, setAdvancedSection] = useState(null);

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3200 });
  }, []);

  const updateClienteInList = useCallback((cliente) => {
    setClientes((prev) =>
      prev.map((item) => (item.idCliente === cliente.idCliente ? cliente : item))
    );
  }, []);

  const fetchClienteDetail = useCallback(async (cliente) => {
    if (!cliente?.idCliente) return cliente;

    try {
      const response = await api.fetchApi(
        {},
        "GET",
        undefined,
        getDetailUrl(cliente.idCliente),
        { logoutOnUnauthorized: false }
      );
      const detail = await readApiPayload(response, "detalle de cliente");
      return normalizeCliente(cliente, detail);
    } catch (error) {
      console.warn("No se pudo cargar detalle de cliente:", error);
      return normalizeCliente(cliente);
    }
  }, []);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.fetchApi({}, "GET", undefined, endpoints.clientes);
      const payloadData = await readApiPayload(response, "clientes");
      const baseRows = getListPayload(payloadData).map((cliente) =>
        normalizeCliente(cliente)
      );

      setClientes(baseRows);

      if (baseRows.length && baseRows.length <= DETAIL_ENRICH_LIMIT) {
        setDetailLoading(true);
        const enriched = await Promise.all(baseRows.map(fetchClienteDetail));
        setClientes(enriched);
      }
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      setClientes([]);
      setLoadError(error?.message || "No se pudo cargar clientes.");
      showToast("error", "Clientes", "No se pudo cargar la lista.");
    } finally {
      setLoading(false);
      setDetailLoading(false);
    }
  }, [fetchClienteDetail, showToast]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const stats = useMemo(
    () => ({
      total: clientes.length,
      activos: clientes.filter((cliente) => cliente.estadoCliente === "ACTIVO").length,
      inactivos: clientes.filter((cliente) => cliente.estadoCliente === "INACTIVO").length,
      archivados: clientes.filter((cliente) => cliente.estadoCliente === "ARCHIVADO").length,
      conFiscales: clientes.filter(hasFiscalData).length,
      conDireccion: clientes.filter(hasAddressData).length,
    }),
    [clientes]
  );

  const filteredClientes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clientes.filter((cliente) => {
      const matchesSearch = !query || searchableText(cliente).includes(query);
      const matchesEstado =
        filters.estado === "TODOS" || cliente.estadoCliente === filters.estado;
      const matchesTipo = filters.tipo === "TODOS" || cliente.tipoCliente === filters.tipo;
      const matchesFiscal =
        filters.fiscales === "TODOS" ||
        (filters.fiscales === "CON_FISCALES" && hasFiscalData(cliente)) ||
        (filters.fiscales === "SIN_FISCALES" && !hasFiscalData(cliente));
      const matchesDireccion =
        filters.direccion === "TODOS" ||
        (filters.direccion === "CON_DIRECCION" && hasAddressData(cliente)) ||
        (filters.direccion === "SIN_DIRECCION" && !hasAddressData(cliente));
      const comprasCount = Number(cliente.comprasRegistradas || 0);
      const matchesCompras =
        filters.compras === "TODOS" ||
        (filters.compras === "CON_COMPRAS" && comprasCount > 0) ||
        (filters.compras === "SIN_COMPRAS" && comprasCount === 0);

      return (
        matchesSearch &&
        matchesEstado &&
        matchesTipo &&
        matchesFiscal &&
        matchesDireccion &&
        matchesCompras
      );
    });
  }, [clientes, filters, search]);

  const openCreate = () => {
    setEditorMode("create");
    setEditorCliente(null);
    setEditorLoading(false);
    setEditorVisible(true);
  };

  const openEdit = async (cliente) => {
    if (!cliente) return;

    setDetailVisible(false);
    setEditorMode("edit");
    setEditorCliente(cliente);
    setEditorVisible(true);

    if (!cliente.detailLoaded) {
      setEditorLoading(true);
      const enriched = await fetchClienteDetail(cliente);
      setEditorCliente(enriched);
      updateClienteInList(enriched);
      setEditorLoading(false);
    }
  };

  const openDetail = async (cliente) => {
    setSelectedCliente(cliente);
    setDetailVisible(true);

    if (!cliente.detailLoaded) {
      setDetailLoading(true);
      const enriched = await fetchClienteDetail(cliente);
      setSelectedCliente(enriched);
      updateClienteInList(enriched);
      setDetailLoading(false);
    }
  };

  const openAdvancedSectionForCliente = async (cliente, section) => {
    if (!cliente?.idCliente) return;

    setSelectedCliente(cliente);
    let target = cliente;
    if (!cliente.detailLoaded) {
      setDetailLoading(true);
      target = await fetchClienteDetail(cliente);
      setSelectedCliente(target);
      updateClienteInList(target);
      setDetailLoading(false);
    }
    setDetailVisible(false);
    setAdvancedSection(section);
  };

  const saveCliente = async (payload) => {
    setSaving(true);
    try {
      const editing = editorMode === "edit" && editorCliente?.idCliente;
      const url = editing
        ? `${endpoints.clientes}/${editorCliente.idCliente}`
        : endpoints.clientes;
      const method = editing ? "PUT" : "POST";
      const response = await api.fetchApi({}, method, payload, url);
      await readApiPayload(response, "guardar cliente");

      showToast(
        "success",
        "Cliente guardado",
        editing ? "Cliente actualizado correctamente." : "Cliente creado correctamente."
      );
      setEditorVisible(false);
      setEditorCliente(null);
      await fetchClientes();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      showToast("error", "Clientes", error?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const fetchDeletePolicy = async (cliente) => {
    const response = await api.fetchApi(
      {},
      "GET",
      undefined,
      getDeleteReviewUrl(cliente.idCliente)
    );
    return readApiPayload(response, "revisar eliminacion");
  };

  const openClienteAction = async (action, cliente) => {
    if (!cliente || !actionMessages[action]) return;

    const baseAction = {
      action,
      cliente,
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
      const deletePolicy = await fetchDeletePolicy(cliente);
      setConfirmAction((prev) =>
        prev?.cliente?.idCliente === cliente.idCliente
          ? { ...prev, deletePolicy, loadingPolicy: false }
          : prev
      );
    } catch (error) {
      console.error("Error al revisar eliminacion:", error);
      setConfirmAction((prev) =>
        prev?.cliente?.idCliente === cliente.idCliente
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
      showToast("error", "Clientes", "No se pudo revisar la eliminacion segura.");
    } finally {
      setActionPreparing(false);
    }
  };

  const updateSelectedFromAction = useCallback((cliente, result) => {
    setSelectedCliente((prev) => {
      if (!prev || prev.idCliente !== cliente.idCliente) return prev;
      return mergeClienteResult(prev, result);
    });
  }, []);

  const runClienteAction = async (action, cliente, motivo) => {
    const urls = {
      desactivar: `${endpoints.clientes}/${cliente.idCliente}/desactivar`,
      archivar: `${endpoints.clientes}/${cliente.idCliente}/archivar`,
      reactivar: `${endpoints.clientes}/${cliente.idCliente}/reactivar`,
      eliminar: `${endpoints.clientes}/${cliente.idCliente}`,
    };

    const method = action === "eliminar" ? "DELETE" : "PUT";
    const response = await api.fetchApi({}, method, { motivo }, urls[action]);
    return readApiPayload(response, action);
  };

  const confirmClienteAction = async () => {
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
      const result = await runClienteAction(
        confirmAction.action,
        confirmAction.cliente,
        confirmAction.motivo
      );
      if (confirmAction.action === "eliminar") {
        setClientes((prev) =>
          prev.filter((item) => item.idCliente !== confirmAction.cliente.idCliente)
        );
        if (selectedCliente?.idCliente === confirmAction.cliente.idCliente) {
          setDetailVisible(false);
          setSelectedCliente(null);
        }
      } else {
        const updated = mergeClienteResult(confirmAction.cliente, result);
        updateClienteInList(updated);
        updateSelectedFromAction(confirmAction.cliente, result);
      }
      setConfirmAction(null);
      showToast("success", "Clientes", confirmAction.success);
    } catch (error) {
      console.error("Error en accion de cliente:", error);
      showToast("error", "Clientes", error?.message || "No se pudo completar la accion.");
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
  const deleteDependencyEntries = Object.entries(deleteDependencies).filter(
    ([, value]) => Number(value) > 0
  );

  return (
    <Shell>
      <Toast ref={toast} className="cli-toast" />
      <Tooltip />

      <main className="clientes-page">
        <section className="cli-header">
          <div>
            <div className="cli-header-title">
              <i className="pi pi-users" />
              <span>CLIENTES</span>
            </div>
          </div>
          <Button
            label="Agregar cliente"
            icon="pi pi-plus"
            className="cli-primary-btn"
            onClick={openCreate}
          />
        </section>

        <ClientesSummary stats={stats} loading={loading && !clientes.length} />

        <ClientesFilters
          search={search}
          filters={filters}
          loading={loading || detailLoading}
          onSearchChange={setSearch}
          onFilterChange={updateFilter}
          onClear={clearFilters}
          onRefresh={fetchClientes}
        />

        <section className="cli-table-shell">
          <div className="cli-table-head">
            <div>
              <strong>Directorio de compradores</strong>
              <span>
                {filteredClientes.length} de {clientes.length} clientes
              </span>
            </div>
            {detailLoading ? <small>Actualizando ultimas compras...</small> : null}
          </div>

          {loadError ? (
            <div className="cli-error-state">
              <i className="pi pi-exclamation-triangle" />
              <strong>No se pudo cargar clientes</strong>
              <span>{loadError}</span>
              <Button
                label="Reintentar"
                icon="pi pi-refresh"
                className="cli-soft-btn"
                onClick={fetchClientes}
              />
            </div>
          ) : (
            <ClientesTable
              rows={filteredClientes}
              loading={loading || detailLoading || saving || actionPreparing}
              hasClientes={clientes.length > 0}
              onView={openDetail}
              onEdit={openEdit}
              onManage={openAdvancedSectionForCliente}
              onAction={openClienteAction}
            />
          )}
        </section>
      </main>

      <ClienteEditorPanel
        visible={editorVisible}
        mode={editorMode}
        cliente={editorCliente}
        loading={editorLoading}
        saving={saving}
        onHide={() => setEditorVisible(false)}
        onSave={saveCliente}
      />

      <ClienteDetailPanel
        cliente={selectedCliente}
        visible={detailVisible}
        loading={detailLoading}
        onHide={() => setDetailVisible(false)}
      />

      <ClienteAdvancedModals
        section={advancedSection}
        cliente={selectedCliente}
        loading={detailLoading}
        onHide={() => setAdvancedSection(null)}
      />

      <Dialog
        header={confirmAction?.title || ""}
        visible={Boolean(confirmAction)}
        onHide={() => setConfirmAction(null)}
        modal
        draggable={false}
        dismissableMask
        className="cli-confirm-dialog"
        style={{ width: "34rem" }}
        footer={
          <div className="cli-dialog-footer">
            <Button
              label={deleteBlocked ? "Cerrar" : "Cancelar"}
              className="p-button-text cli-text-btn"
              onClick={() => setConfirmAction(null)}
              disabled={saving || actionPreparing}
            />
            {!deleteBlocked ? (
              <Button
                label={confirmAction?.confirmLabel || "Confirmar"}
                icon={confirmAction?.action === "eliminar" ? "pi pi-trash" : "pi pi-check"}
                className={
                  confirmAction?.action === "eliminar"
                    ? "cli-danger-btn"
                    : "cli-primary-btn"
                }
                onClick={confirmClienteAction}
                loading={saving}
                disabled={confirmDisabled}
              />
            ) : null}
          </div>
        }
      >
        <div className="cli-safe-action-body">
          <p className="cli-confirm-text">{confirmAction?.detail}</p>

          {confirmAction?.consequences?.length ? (
            <div className="cli-safe-box">
              <strong>Consecuencias</strong>
              <ul>
                {confirmAction.consequences.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {confirmAction?.action === "eliminar" ? (
            <div className={deleteBlocked ? "cli-delete-policy is-blocked" : "cli-delete-policy"}>
              {confirmAction.loadingPolicy ? (
                <span>Revisando ventas, datos fiscales y auditoria del cliente...</span>
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
                    <div className="cli-delete-counts">
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
            <label className="cli-field cli-safe-reason">
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
              <small>Este motivo queda asociado a la auditoria del cliente.</small>
            </label>
          ) : null}
        </div>
      </Dialog>
    </Shell>
  );
}
