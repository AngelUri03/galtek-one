import React, { useCallback, useEffect, useRef, useState } from "react";
import Shell from "../common/Shell";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Tooltip } from "primereact/tooltip";
import { ModalSurface } from "../common/OverlaySurfaces";
import ClienteEditorPanel from "./ClienteEditorPanel";
import ClienteWorkspaceDrawer from "./ClienteWorkspaceDrawer";
import ClientesFilters from "./ClientesFilters";
import ClientesSummary from "./ClientesSummary";
import ClientesTable from "./ClientesTable";
import {
  emptyFilters,
  getListPayload,
  normalizeCliente,
  readApiPayload,
} from "./clientesUtils";
import "../../style/components/Clientes/Clientes.css";

const api = new APIfetchApi();

const INITIAL_DYNAMIC_ROWS = 7;
const FIXED_TABLE_ROW_OPTIONS = [10, 20];
const INITIAL_STATS = {
  total: 0,
  activos: 0,
  inactivos: 0,
  archivados: 0,
  conFiscales: 0,
  conDireccion: 0,
};
const INITIAL_TABLE_STATE = {
  first: 0,
  page: 0,
  rows: INITIAL_DYNAMIC_ROWS,
  sortField: "nombre",
  sortOrder: 1,
};

const getDetailUrl = (idCliente) => `${endpoints.clientes}/${idCliente}`;
const getDeleteReviewUrl = (idCliente) =>
  `${endpoints.clientes}/${idCliente}/eliminacion-segura`;

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeDirectorySummary = (summary = {}, totalRecords = 0) => ({
  total: toNumber(summary.total, totalRecords),
  activos: toNumber(summary.activos),
  inactivos: toNumber(summary.inactivos),
  archivados: toNumber(summary.archivados),
  conFiscales: toNumber(summary.conFiscales),
  conDireccion: toNumber(summary.conDireccion),
});

const normalizeDirectoryPage = (data = {}) => {
  const items = getListPayload(data);
  const totalRecords = toNumber(data.totalRecords ?? data.totalElements, items.length);

  return {
    items,
    totalRecords,
    page: toNumber(data.page ?? data.number),
    size: toNumber(data.size, items.length),
    summary: normalizeDirectorySummary(data.summary, totalRecords),
  };
};

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
    success: "Cliente archivado como baja historica definitiva.",
    confirmLabel: "Archivar",
    placeholder: "Ej. Cliente historico, conservar solo para consulta.",
    detail: "El cliente queda como baja historica definitiva: no se reactiva ni acepta nuevas compras.",
    consequences: [
      "Se retira del uso diario.",
      "El historial permanece disponible para consulta.",
      "No se puede reactivar desde operacion normal.",
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

const clienteEstado = (cliente) =>
  String(cliente?.estadoCliente || "ACTIVO").toUpperCase();

const defaultRemovalResolution = (cliente) => {
  const estado = clienteEstado(cliente);
  if (estado === "ACTIVO") return "desactivar";
  if (estado === "INACTIVO") return "archivar";
  return null;
};

const removalSummaryText = (action) => {
  if (!action) return "";
  if (action.loadingPolicy) return "Revisando si existen compras, datos fiscales o auditoria...";
  if (action.deletePolicy?.puedeEliminar) {
    return "No tiene movimientos ni relaciones. Puedes borrarlo por completo.";
  }
  if (clienteEstado(action.cliente) === "ACTIVO") {
    return "Elige si solo dejara de comprar por ahora o si ya no se usara nunca mas.";
  }
  if (clienteEstado(action.cliente) === "INACTIVO") {
    return "Esta pausado. Puedes quitarlo definitivamente del uso diario.";
  }
  return "Este cliente ya esta archivado y solo queda disponible para historial.";
};

const resolveConfirmTargetAction = (action) => {
  if (!action) return null;
  if (action.action !== "salida") return action.action;
  if (action.loadingPolicy) return null;
  if (action.deletePolicy?.puedeEliminar) return "eliminar";
  return action.selectedResolution || null;
};

const mergeClienteResult = (current, result) =>
  normalizeCliente({
    ...(current?.raw || {}),
    ...(current || {}),
    ...(result || {}),
    pedidos: current?.pedidos || result?.pedidos,
    comprasRegistradas: current?.comprasRegistradas ?? result?.comprasRegistradas,
  });

const estimateRowsForShell = (shell) => {
  if (!shell) return null;

  const shellRect = shell.getBoundingClientRect();
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight || 0 : 0;
  const viewportAvailableHeight =
    viewportHeight && shellRect.top ? viewportHeight - shellRect.top - 16 : 0;
  const shellHeight = Math.max(shellRect.height || 0, viewportAvailableHeight);
  const headHeight =
    shell.querySelector(".cli-table-head")?.getBoundingClientRect().height || 48;
  const tableHeaderHeight =
    shell.querySelector(".p-datatable-thead")?.getBoundingClientRect().height || 42;
  const paginatorHeight =
    shell.querySelector(".p-paginator")?.getBoundingClientRect().height || 64;
  const rowHeight =
    shell.querySelector(".p-datatable-tbody > tr")?.getBoundingClientRect().height || 56;
  const usableHeight = shellHeight - headHeight - tableHeaderHeight - paginatorHeight - 6;
  const estimatedRows = Math.floor(usableHeight / rowHeight);

  if (!Number.isFinite(estimatedRows) || estimatedRows < 1) return null;
  return Math.max(3, Math.min(estimatedRows, 20));
};

export default function Clientes() {
  const toast = useRef(null);
  const tableShellRef = useRef(null);
  const listRequestRef = useRef(0);
  const userSelectedRowsRef = useRef(false);
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [totalRecords, setTotalRecords] = useState(0);
  const [tableBaseRows, setTableBaseRows] = useState(INITIAL_DYNAMIC_ROWS);
  const [tableState, setTableState] = useState(INITIAL_TABLE_STATE);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [editorCliente, setEditorCliente] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionPreparing, setActionPreparing] = useState(false);
  const [workspaceVisible, setWorkspaceVisible] = useState(false);
  const [workspaceInitialSection, setWorkspaceInitialSection] = useState(null);

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
    const requestId = listRequestRef.current + 1;
    listRequestRef.current = requestId;
    setLoading(true);
    setLoadError("");

    try {
      const params = new URLSearchParams({
        page: String(tableState.page),
        size: String(tableState.rows),
        sort: tableState.sortField || "nombre",
        direction: tableState.sortOrder === -1 ? "desc" : "asc",
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      Object.entries(filters).forEach(([key, value]) => {
        const normalizedValue = String(value || "").trim();
        if (normalizedValue && normalizedValue !== "TODOS") {
          params.set(key, normalizedValue);
        }
      });

      const response = await api.fetchApi(
        {},
        "GET",
        undefined,
        `${endpoints.clientes}/page?${params.toString()}`
      );
      const payloadData = await readApiPayload(response, "clientes");
      const pageData = normalizeDirectoryPage(payloadData);
      const rows = pageData.items.map((cliente) => normalizeCliente(cliente));

      if (requestId !== listRequestRef.current) return;

      if (!rows.length && pageData.totalRecords > 0 && tableState.page > 0) {
        setTableState((prev) => ({ ...prev, page: 0, first: 0 }));
        return;
      }

      setClientes(rows);
      setTotalRecords(pageData.totalRecords);
      setStats(pageData.summary);
    } catch (error) {
      if (requestId !== listRequestRef.current) return;
      console.error("Error al obtener clientes:", error);
      setClientes([]);
      setTotalRecords(0);
      setStats(INITIAL_STATS);
      setLoadError(error?.message || "No se pudo cargar clientes.");
      showToast("error", "Clientes", "No se pudo cargar la lista.");
    } finally {
      if (requestId === listRequestRef.current) {
        setLoading(false);
      }
    }
  }, [
    debouncedSearch,
    filters,
    showToast,
    tableState.page,
    tableState.rows,
    tableState.sortField,
    tableState.sortOrder,
  ]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 260);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    let animationFrame = null;
    const timers = [];

    const updateRowsFromShell = () => {
      if (!active) return;
      const nextRows = estimateRowsForShell(tableShellRef.current);
      if (!nextRows) return;

      setTableBaseRows(nextRows);

      if (userSelectedRowsRef.current) return;

      setTableState((prev) =>
        prev.rows === nextRows
          ? prev
          : { ...prev, rows: nextRows, page: 0, first: 0 }
      );
    };

    const scheduleRowsMeasure = () => {
      if (!active) return;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateRowsFromShell);
    };

    [0, 90, 220, 420, 720].forEach((delay) => {
      timers.push(window.setTimeout(scheduleRowsMeasure, delay));
    });

    document.fonts?.ready?.then?.(scheduleRowsMeasure);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleRowsMeasure)
        : null;

    if (tableShellRef.current && observer) {
      observer.observe(tableShellRef.current);
    }

    window.addEventListener("resize", scheduleRowsMeasure);
    window.addEventListener("focus", scheduleRowsMeasure);
    document.addEventListener("visibilitychange", scheduleRowsMeasure);

    return () => {
      active = false;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      timers.forEach((timer) => window.clearTimeout(timer));
      observer?.disconnect();
      window.removeEventListener("resize", scheduleRowsMeasure);
      window.removeEventListener("focus", scheduleRowsMeasure);
      document.removeEventListener("visibilitychange", scheduleRowsMeasure);
    };
  }, []);

  const openCreate = () => {
    setEditorMode("create");
    setEditorCliente(null);
    setEditorLoading(false);
    setEditorVisible(true);
  };

  const openEdit = async (cliente) => {
    if (!cliente) return;
    if (clienteEstado(cliente) === "ARCHIVADO") {
      showToast("info", "Cliente archivado", "Este cliente ya no se puede editar.");
      return;
    }

    setWorkspaceVisible(false);
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
    setWorkspaceInitialSection(null);
    setWorkspaceVisible(true);

    if (!cliente.detailLoaded) {
      setDetailLoading(true);
      const enriched = await fetchClienteDetail(cliente);
      setSelectedCliente(enriched);
      updateClienteInList(enriched);
      setDetailLoading(false);
    }
  };

  const saveCliente = async ({ payload, activateOnly = false, motivo } = {}) => {
    setSaving(true);
    try {
      const editing = editorMode === "edit" && editorCliente?.idCliente;
      if (activateOnly) {
        if (!editing) {
          throw new Error("No se encontro el cliente para reactivar.");
        }

        const response = await api.fetchApi(
          {},
          "PUT",
          { motivo: motivo || "Reactivado desde edicion de cliente" },
          `${endpoints.clientes}/${editorCliente.idCliente}/reactivar`
        );
        await readApiPayload(response, "reactivar cliente");

        showToast("success", "Cliente reactivado", "Ahora puedes editar sus datos.");
        setEditorVisible(false);
        setEditorCliente(null);
        await fetchClientes();
        return;
      }

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

  const openRemovalAction = async (cliente) => {
    if (!cliente?.idCliente) return;

    const baseAction = {
      action: "salida",
      cliente,
      motivo: "",
      selectedResolution: defaultRemovalResolution(cliente),
      archiveConfirmed: false,
      deletePolicy: null,
      loadingPolicy: true,
      title: "Resolver salida del cliente",
      placeholder: "Ej. Ya no debe comprar temporalmente o se dara de baja.",
      detail:
        "Se revisa si el cliente puede eliminarse fisicamente. Si tiene compras, datos fiscales o auditoria, se conserva la informacion y se retira de operacion.",
    };

    setActionPreparing(true);
    setConfirmAction(baseAction);
    try {
      const deletePolicy = await fetchDeletePolicy(cliente);
      setConfirmAction((prev) =>
        prev?.cliente?.idCliente === cliente.idCliente
          ? {
              ...prev,
              deletePolicy,
              loadingPolicy: false,
              selectedResolution: deletePolicy?.puedeEliminar
                ? "eliminar"
                : defaultRemovalResolution(cliente),
              archiveConfirmed: false,
            }
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
              selectedResolution: defaultRemovalResolution(cliente),
              archiveConfirmed: false,
            }
          : prev
      );
      showToast("error", "Clientes", "No se pudo revisar la eliminacion segura.");
    } finally {
      setActionPreparing(false);
    }
  };

  const openClienteStateAction = (action, cliente) => {
    if (!cliente || !actionMessages[action]) return;
    setConfirmAction({
      action,
      cliente,
      motivo: "",
      deletePolicy: null,
      ...actionMessages[action],
    });
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
    const targetAction = resolveConfirmTargetAction(confirmAction);
    if (!targetAction) {
      showToast("warn", "Accion no disponible", "No hay una salida segura disponible para este cliente.");
      return;
    }
    if (!confirmAction.motivo?.trim()) {
      showToast("warn", "Motivo requerido", "Captura el motivo para continuar.");
      return;
    }
    if (targetAction === "archivar" && !confirmAction.archiveConfirmed) {
      showToast("warn", "Confirmacion requerida", "Confirma que este cliente ya no se usara.");
      return;
    }

    setSaving(true);
    try {
      const result = await runClienteAction(
        targetAction,
        confirmAction.cliente,
        confirmAction.motivo
      );
      if (targetAction === "eliminar") {
        setClientes((prev) =>
          prev.filter((item) => item.idCliente !== confirmAction.cliente.idCliente)
        );
        if (selectedCliente?.idCliente === confirmAction.cliente.idCliente) {
          setWorkspaceVisible(false);
          setSelectedCliente(null);
        }
      } else {
        const updated = mergeClienteResult(confirmAction.cliente, result);
        updateClienteInList(updated);
        updateSelectedFromAction(confirmAction.cliente, result);
      }
      setConfirmAction(null);
      await fetchClientes();
      showToast(
        "success",
        "Clientes",
        confirmAction.success || actionMessages[targetAction]?.success || "Accion completada."
      );
    } catch (error) {
      console.error("Error en accion de cliente:", error);
      showToast("error", "Clientes", error?.message || "No se pudo completar la accion.");
    } finally {
      setSaving(false);
    }
  };

  const resetTableToFirstPage = useCallback(() => {
    setTableState((prev) =>
      prev.first === 0 && prev.page === 0 ? prev : { ...prev, first: 0, page: 0 }
    );
  }, []);

  const handleSearchChange = (value) => {
    setSearch(value);
    resetTableToFirstPage();
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    resetTableToFirstPage();
  };

  const clearFilters = () => {
    setSearch("");
    setFilters(emptyFilters);
    resetTableToFirstPage();
  };

  const handleTablePage = (event) => {
    if (event.rows !== tableState.rows) {
      userSelectedRowsRef.current = event.rows !== tableBaseRows;
    }

    setTableState((prev) => ({
      ...prev,
      first: event.first,
      page: event.page ?? Math.floor(event.first / event.rows),
      rows: event.rows,
    }));
  };

  const handleTableSort = (event) => {
    setTableState((prev) => ({
      ...prev,
      sortField: event.sortField || INITIAL_TABLE_STATE.sortField,
      sortOrder: event.sortOrder || INITIAL_TABLE_STATE.sortOrder,
      first: 0,
      page: 0,
    }));
  };

  const isRemovalFlow = confirmAction?.action === "salida";
  const targetAction = resolveConfirmTargetAction(confirmAction);
  const removalPolicyReady = isRemovalFlow && !confirmAction?.loadingPolicy;
  const removalCanDelete = removalPolicyReady && confirmAction?.deletePolicy?.puedeEliminar;
  const removalNeedsPreserve = removalPolicyReady && !confirmAction?.deletePolicy?.puedeEliminar;
  const removalAlreadyArchived =
    removalNeedsPreserve && clienteEstado(confirmAction?.cliente) === "ARCHIVADO";
  const confirmLabel = isRemovalFlow
    ? removalAlreadyArchived
      ? "Sin accion disponible"
      : removalCanDelete
      ? "Eliminar definitivamente"
      : targetAction === "archivar"
      ? "Archivar cliente"
      : "Desactivar cliente"
    : confirmAction?.confirmLabel || "Confirmar";
  const confirmIcon =
    targetAction === "eliminar"
      ? "pi pi-trash"
      : targetAction === "archivar"
      ? "pi pi-folder"
      : targetAction === "reactivar"
      ? "pi pi-play"
      : "pi pi-pause";
  const confirmDisabled =
    saving ||
    actionPreparing ||
    confirmAction?.loadingPolicy ||
    (targetAction === "archivar" && !confirmAction?.archiveConfirmed) ||
    !confirmAction?.motivo?.trim() ||
    !targetAction ||
    removalAlreadyArchived;
  const hasActiveDirectoryQuery =
    search.trim() ||
    Object.entries(filters).some(([key, value]) => value !== emptyFilters[key]);
  const rowOptions = Array.from(
    new Set([tableBaseRows, ...FIXED_TABLE_ROW_OPTIONS])
  ).sort((a, b) => a - b);
  const pageStart = totalRecords && clientes.length ? tableState.first + 1 : 0;
  const pageEnd = totalRecords && clientes.length
    ? Math.min(tableState.first + clientes.length, totalRecords)
    : 0;

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
          loading={loading}
          onSearchChange={handleSearchChange}
          onFilterChange={updateFilter}
          onClear={clearFilters}
          onRefresh={fetchClientes}
        />

        <section className="cli-table-shell" ref={tableShellRef}>
          <div className="cli-table-head">
            <div>
              <strong>Directorio de compradores</strong>
              <span>
                {pageStart}-{pageEnd} de {totalRecords} clientes
              </span>
            </div>
            {loading && clientes.length ? <small>Actualizando listado...</small> : null}
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
              rows={clientes}
              loading={loading || saving || actionPreparing}
              hasClientes={totalRecords > 0 || Boolean(hasActiveDirectoryQuery)}
              first={tableState.first}
              rowsPerPage={tableState.rows}
              rowsPerPageOptions={rowOptions}
              totalRecords={totalRecords}
              sortField={tableState.sortField}
              sortOrder={tableState.sortOrder}
              onPage={handleTablePage}
              onSort={handleTableSort}
              onView={openDetail}
              onEdit={openEdit}
              onRemove={openRemovalAction}
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

      <ClienteWorkspaceDrawer
        cliente={selectedCliente}
        visible={workspaceVisible}
        loading={detailLoading}
        initialSection={workspaceInitialSection}
        onHide={() => setWorkspaceVisible(false)}
        onStateAction={openClienteStateAction}
      />

      <ModalSurface
        title={confirmAction?.title || ""}
        visible={Boolean(confirmAction)}
        onHide={() => setConfirmAction(null)}
        size="small"
        className="cli-confirm-dialog"
        footer={
          <div className="cli-dialog-footer">
            <Button
              label="Cancelar"
              className="p-button-text cli-text-btn"
              onClick={() => setConfirmAction(null)}
              disabled={saving || actionPreparing}
            />
            <Button
              label={confirmLabel}
              icon={confirmIcon}
              className={
                targetAction === "eliminar" || targetAction === "archivar"
                  ? "cli-danger-btn"
                  : "cli-primary-btn"
              }
              onClick={confirmClienteAction}
              loading={saving}
              disabled={confirmDisabled}
            />
          </div>
        }
      >
        <div className="cli-safe-action-body">
          {!isRemovalFlow && confirmAction?.detail ? (
            <p className="cli-confirm-text">{confirmAction.detail}</p>
          ) : null}

          {(isRemovalFlow || confirmAction?.action === "eliminar") ? (
            <>
              <div
                className={
                  targetAction === "archivar"
                    ? "cli-delete-policy is-danger"
                    : removalNeedsPreserve
                    ? "cli-delete-policy is-blocked"
                    : "cli-delete-policy"
                }
              >
                <i
                  className={
                    confirmAction?.loadingPolicy
                      ? "pi pi-spin pi-spinner"
                      : removalCanDelete
                      ? "pi pi-trash"
                      : "pi pi-shield"
                  }
                />
                <div>
                  <strong>
                    {confirmAction?.loadingPolicy
                      ? "Revisando cliente"
                      : removalCanDelete
                      ? "Eliminar definitivamente"
                      : targetAction === "archivar"
                      ? "Archivar cliente"
                      : "Elegir salida"}
                  </strong>
                  <p>{removalSummaryText(confirmAction)}</p>
                </div>
              </div>

              {removalNeedsPreserve ? (
                <>
                  <div
                    className={`cli-removal-options ${
                      clienteEstado(confirmAction?.cliente) !== "ACTIVO" ? "is-single" : ""
                    }`}
                    aria-label="Opciones de salida del cliente"
                  >
                    {clienteEstado(confirmAction?.cliente) === "ACTIVO" ? (
                      <button
                        type="button"
                        className={
                          confirmAction.selectedResolution === "desactivar"
                            ? "is-selected"
                            : ""
                        }
                        onClick={() =>
                          setConfirmAction((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedResolution: "desactivar",
                                  archiveConfirmed: false,
                                }
                              : prev
                          )
                        }
                        disabled={saving || actionPreparing}
                      >
                        <i className="pi pi-pause" />
                        <span>
                          <strong>Desactivar</strong>
                          <small>Pausa compras temporalmente</small>
                        </span>
                      </button>
                    ) : null}
                    {clienteEstado(confirmAction?.cliente) !== "ARCHIVADO" ? (
                      <button
                        type="button"
                        className={
                          confirmAction.selectedResolution === "archivar"
                            ? "is-danger is-selected"
                            : "is-danger"
                        }
                        onClick={() =>
                          setConfirmAction((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  selectedResolution: "archivar",
                                  archiveConfirmed: false,
                                }
                              : prev
                          )
                        }
                        disabled={saving || actionPreparing}
                      >
                        <i className="pi pi-folder" />
                        <span>
                          <strong>Archivar</strong>
                          <small>Baja historica definitiva</small>
                        </span>
                      </button>
                    ) : null}
                    {clienteEstado(confirmAction?.cliente) === "ARCHIVADO" ? (
                      <div className="cli-removal-locked">
                        <i className="pi pi-lock" />
                        <span>No hay accion disponible</span>
                      </div>
                    ) : null}
                  </div>

                  {targetAction === "archivar" ? (
                    <label className="cli-archive-confirm">
                      <span>
                        <i className="pi pi-exclamation-triangle" />
                      </span>
                      <div>
                        <strong>No se podra usar este cliente.</strong>
                        <small>
                          No podra comprar ni editarse; solo quedara disponible para historial.
                        </small>
                        <em>
                          <input
                            type="checkbox"
                            checked={Boolean(confirmAction?.archiveConfirmed)}
                            onChange={(event) =>
                              setConfirmAction((prev) =>
                                prev
                                  ? { ...prev, archiveConfirmed: event.target.checked }
                                  : prev
                              )
                            }
                            disabled={saving || actionPreparing}
                          />
                          Confirmo que ya no se usara este cliente.
                        </em>
                      </div>
                    </label>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}

          {!removalAlreadyArchived ? (
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
      </ModalSurface>
    </Shell>
  );
}
