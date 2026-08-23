import React, { useCallback, useEffect, useRef, useState } from "react";
import Shell from "../common/Shell";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Tooltip } from "primereact/tooltip";
import { ModalSurface } from "../common/OverlaySurfaces";
import ProveedorEditorPanel from "./ProveedorEditorPanel";
import ProveedorWorkspaceDrawer from "./ProveedorWorkspaceDrawer";
import ProveedoresFilters from "./ProveedoresFilters";
import ProveedoresSummary from "./ProveedoresSummary";
import ProveedoresTable from "./ProveedoresTable";
import {
  emptyFilters,
  getListPayload,
  normalizeProveedor,
  readApiPayload,
} from "./proveedoresUtils";
import "../../style/components/Proveedores/Proveedores.css";

const api = new APIfetchApi();

const INITIAL_DYNAMIC_ROWS = 7;
const FIXED_TABLE_ROW_OPTIONS = [10, 20];
const INITIAL_STATS = {
  total: 0,
  activos: 0,
  inactivos: 0,
  archivados: 0,
  sinProductos: 0,
  conActivos: 0,
};
const INITIAL_TABLE_STATE = {
  first: 0,
  page: 0,
  rows: INITIAL_DYNAMIC_ROWS,
  sortField: "nombreProveedor",
  sortOrder: 1,
};

const getDetailUrl = (idProveedor) => `${endpoints.proveedores}/${idProveedor}`;
const getEditDetailUrl = (idProveedor) => `${getDetailUrl(idProveedor)}?include=edicion`;
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
  },
  archivar: {
    title: "Archivar proveedor",
    success: "Proveedor archivado como baja historica definitiva.",
    confirmLabel: "Archivar",
    placeholder: "Ej. Baja definitiva; se conserva solo por historial.",
    detail: "El proveedor queda como baja historica definitiva: no se reactiva ni acepta nuevas relaciones.",
  },
  reactivar: {
    title: "Reactivar proveedor",
    success: "Proveedor reactivado.",
    confirmLabel: "Reactivar",
    placeholder: "Ej. Vuelve a surtir la tienda esta semana.",
    detail: "El proveedor volvera a estar disponible para operacion diaria.",
  },
  eliminar: {
    title: "Eliminar proveedor fisicamente",
    success: "Proveedor eliminado.",
    confirmLabel: "Eliminar fisicamente",
    placeholder: "Ej. Alta capturada por error y sin uso real.",
    detail: "Esta accion solo procede si el backend confirma que el proveedor no tiene uso ni historial relevante.",
  },
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const expectedSubresourceCount = (key, proveedor = {}, detail = {}) => {
  const data = detail?.proveedor ? { ...(proveedor || {}), ...detail.proveedor } : {
    ...(proveedor || {}),
    ...(detail || {}),
  };

  if (key === "productos") {
    return toNumber(
      data.productosAsociadosCount ?? data.productosCount ?? data.productosAsociados,
      0
    );
  }
  if (key === "activos") {
    return toNumber(data.activosPrestadosCount ?? data.activosCount, 0);
  }
  if (key === "documentos") {
    return toNumber(data.documentosCount, 0);
  }
  return 0;
};

const shouldFetchSubresource = (key, proveedor, detail) => {
  const embedded = detail?.[key];
  if (!Array.isArray(embedded)) return true;
  const expected = expectedSubresourceCount(key, proveedor, detail);
  return expected > embedded.length;
};

const normalizeDirectorySummary = (summary = {}, totalRecords = 0) => ({
  total: toNumber(summary.total, totalRecords),
  activos: toNumber(summary.activos),
  inactivos: toNumber(summary.inactivos),
  archivados: toNumber(summary.archivados),
  sinProductos: toNumber(summary.sinProductos),
  conActivos: toNumber(summary.conActivos),
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

const estimateRowsForShell = (shell) => {
  if (!shell) return null;

  const shellRect = shell.getBoundingClientRect();
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight || 0 : 0;
  const viewportAvailableHeight =
    viewportHeight && shellRect.top ? viewportHeight - shellRect.top - 16 : 0;
  const shellHeight = Math.max(shellRect.height || 0, viewportAvailableHeight);
  const headHeight =
    shell.querySelector(".prov-table-head")?.getBoundingClientRect().height || 48;
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

const proveedorEstado = (proveedor) =>
  String(proveedor?.estadoProveedor || "ACTIVO").toUpperCase();

const defaultRemovalResolution = (proveedor) => {
  const estado = proveedorEstado(proveedor);
  if (estado === "ACTIVO") return "desactivar";
  if (estado === "INACTIVO") return "archivar";
  return null;
};

const removalSummaryText = (action) => {
  if (!action) return "";
  if (action.loadingPolicy) return "Revisando si existe historial o relaciones activas...";
  if (action.deletePolicy?.puedeEliminar) {
    return "No tiene movimientos ni relaciones. Puedes borrarlo por completo.";
  }
  if (proveedorEstado(action.proveedor) === "ACTIVO") {
    return "Elige si solo dejara de usarse por ahora o si ya no se usara nunca mas.";
  }
  if (proveedorEstado(action.proveedor) === "INACTIVO") {
    return "Esta pausado. Puedes quitarlo definitivamente del uso diario.";
  }
  return "Este proveedor ya esta archivado y no se puede usar ni editar.";
};

const resolveConfirmTargetAction = (action) => {
  if (!action) return null;
  if (action.action !== "salida") return action.action;
  if (action.loadingPolicy) return null;
  if (action.deletePolicy?.puedeEliminar) return "eliminar";
  return action.selectedResolution || null;
};

const mergeProveedorResult = (current, result) => {
  if (!current && !result) return null;
  const pickResultArray = (resultValue, currentValue) =>
    Array.isArray(resultValue) ? resultValue : currentValue;

  return normalizeProveedor({
    ...(current?.raw || {}),
    ...(current || {}),
    ...(result || {}),
    contactos: pickResultArray(result?.contactos, current?.contactos),
    productosAsociados: pickResultArray(
      result?.productosAsociados,
      current?.productosAsociados
    ),
    activosPrestados: pickResultArray(result?.activosPrestados, current?.activosPrestados),
    documentos: pickResultArray(result?.documentos, current?.documentos),
  });
};

export default function Proveedores() {
  const toast = useRef(null);
  const lastFocusRef = useRef(null);
  const tableShellRef = useRef(null);
  const listRequestRef = useRef(0);
  const editorRequestRef = useRef(0);
  const userSelectedRowsRef = useRef(false);
  const [proveedores, setProveedores] = useState([]);
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
  const [editorProveedor, setEditorProveedor] = useState(null);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionPreparing, setActionPreparing] = useState(false);
  const [workspaceVisible, setWorkspaceVisible] = useState(false);
  const [workspaceInitialSection, setWorkspaceInitialSection] = useState(null);
  const [categoriaOptions, setCategoriaOptions] = useState([]);
  const [categoriasLoading, setCategoriasLoading] = useState(false);

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3200 });
  }, []);

  const rememberFocus = useCallback(() => {
    const activeElement = document.activeElement;
    lastFocusRef.current =
      activeElement instanceof HTMLElement ? activeElement : lastFocusRef.current;
  }, []);

  const restoreFocus = useCallback(() => {
    window.setTimeout(() => {
      if (lastFocusRef.current && document.body.contains(lastFocusRef.current)) {
        lastFocusRef.current.focus();
      }
    }, 60);
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

      const requestedKeys = pickSubresourceKeys(options?.subresources);
      const missingKeys =
        options?.subresources && detail
          ? requestedKeys.filter((key) => shouldFetchSubresource(key, proveedor, detail))
          : requestedKeys;
      const subresources =
        options?.subresources && missingKeys.length
          ? await fetchProveedorSubresources(proveedor.idProveedor, missingKeys)
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

  const fetchProveedorEditDetail = useCallback(async (proveedor) => {
    if (!proveedor?.idProveedor) return normalizeProveedor(proveedor);

    try {
      const response = await api.fetchApi(
        {},
        "GET",
        undefined,
        getEditDetailUrl(proveedor.idProveedor),
        { logoutOnUnauthorized: false }
      );
      const detail = await readApiPayload(response, "edicion de proveedor");
      return {
        ...normalizeProveedor(proveedor, detail || {}),
        detailLoaded: false,
        editLoaded: true,
      };
    } catch (error) {
      console.warn("No se pudo cargar detalle ligero de proveedor:", error);
      const fallback = await fetchProveedorDetail(proveedor, { subresources: ["contactos"] });
      return { ...fallback, editLoaded: true };
    }
  }, [fetchProveedorDetail]);

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

  const fetchProveedores = useCallback(async () => {
    const requestId = listRequestRef.current + 1;
    listRequestRef.current = requestId;
    setLoading(true);
    setLoadError("");

    try {
      const params = new URLSearchParams({
        page: String(tableState.page),
        size: String(tableState.rows),
        sort: tableState.sortField || "nombreProveedor",
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
        `${endpoints.proveedores}/page?${params.toString()}`
      );
      const payloadData = await readApiPayload(response, "proveedores");
      const pageData = normalizeDirectoryPage(payloadData);
      const rows = pageData.items.map((proveedor) => normalizeProveedor(proveedor));

      if (requestId !== listRequestRef.current) return;

      if (!rows.length && pageData.totalRecords > 0 && tableState.page > 0) {
        setTableState((prev) => ({ ...prev, page: 0, first: 0 }));
        return;
      }

      setProveedores(rows);
      setTotalRecords(pageData.totalRecords);
      setStats(pageData.summary);
    } catch (error) {
      if (requestId !== listRequestRef.current) return;
      console.error("Error al obtener proveedores:", error);
      setProveedores([]);
      setTotalRecords(0);
      setStats(INITIAL_STATS);
      setLoadError(error?.message || "No se pudo cargar proveedores.");
      showToast("error", "Proveedores", "No se pudo cargar la lista.");
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
    fetchProveedores();
  }, [fetchProveedores]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const openCreate = () => {
    editorRequestRef.current += 1;
    rememberFocus();
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
    if (proveedorEstado(proveedor) === "ARCHIVADO") {
      showToast(
        "info",
        "Proveedor archivado",
        "Este proveedor ya no se puede editar."
      );
      return;
    }

    const requestId = editorRequestRef.current + 1;
    editorRequestRef.current = requestId;
    rememberFocus();
    setWorkspaceVisible(false);
    setEditorMode("edit");
    setEditorProveedor(proveedor);
    setEditorVisible(true);

    if (!proveedor.detailLoaded && !proveedor.editLoaded) {
      setEditorLoading(true);
      try {
        const enriched = await fetchProveedorEditDetail(proveedor);
        if (requestId !== editorRequestRef.current) return;
        setEditorProveedor(enriched);
        updateProveedorInList(enriched);
      } finally {
        if (requestId === editorRequestRef.current) {
          setEditorLoading(false);
        }
      }
    }
  };

  const openDetail = async (proveedor) => {
    rememberFocus();
    setSelectedProveedor(proveedor);
    setWorkspaceInitialSection(null);
    setWorkspaceVisible(true);

    if (!proveedor.detailLoaded) {
      setDetailLoading(true);
      const enriched = await fetchProveedorDetail(proveedor, { subresources: "all" });
      setSelectedProveedor(enriched);
      updateProveedorInList(enriched);
      setDetailLoading(false);
    }
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

  const saveProveedor = async ({
    proveedor,
    contactos,
    contactRefs,
    deletedContactIds,
    activateOnly = false,
    motivo,
  }) => {
    setSaving(true);
    try {
      const editing = editorMode === "edit" && editorProveedor?.idProveedor;
      if (activateOnly) {
        if (!editing) {
          throw new Error("No se encontro el proveedor para reactivar.");
        }

        const response = await api.fetchApi(
          {},
          "PUT",
          { motivo: motivo || "Reactivado desde edicion de proveedor" },
          `${endpoints.proveedores}/${editorProveedor.idProveedor}/reactivar`
        );
        await readApiPayload(response, "reactivar proveedor");

        showToast("success", "Proveedor reactivado", "Ahora puedes editar sus datos.");
        setEditorVisible(false);
        setEditorProveedor(null);
        restoreFocus();
        await fetchProveedores();
        return;
      }

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
      restoreFocus();
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

  const openRemovalAction = async (proveedor) => {
    if (!proveedor?.idProveedor) return;

    rememberFocus();
    const baseAction = {
      action: "salida",
      proveedor,
      motivo: "",
      selectedResolution: defaultRemovalResolution(proveedor),
      archiveConfirmed: false,
      deletePolicy: null,
      loadingPolicy: true,
      title: "Resolver salida del proveedor",
      placeholder: "Ej. Ya no debe permanecer en el directorio.",
      detail:
        "Se revisa si el proveedor puede eliminarse fisicamente. Si tiene historial o relaciones, se conserva la informacion y se retira de operacion.",
    };

    setActionPreparing(true);
    setConfirmAction(baseAction);
    try {
      const deletePolicy = await fetchDeletePolicy(proveedor);
      setConfirmAction((prev) =>
        prev?.proveedor?.idProveedor === proveedor.idProveedor
          ? {
              ...prev,
              deletePolicy,
              loadingPolicy: false,
              selectedResolution: deletePolicy?.puedeEliminar
                ? "eliminar"
                : defaultRemovalResolution(proveedor),
              archiveConfirmed: false,
            }
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
              selectedResolution: defaultRemovalResolution(proveedor),
              archiveConfirmed: false,
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
    const targetAction = resolveConfirmTargetAction(confirmAction);
    if (!targetAction) {
      showToast("warn", "Accion no disponible", "No hay una salida segura disponible para este proveedor.");
      return;
    }
    if (!confirmAction.motivo?.trim()) {
      showToast("warn", "Motivo requerido", "Captura el motivo para continuar.");
      return;
    }

    setSaving(true);
    try {
      const result = await runProveedorAction(
        targetAction,
        confirmAction.proveedor,
        confirmAction.motivo
      );
      if (targetAction === "eliminar") {
        setProveedores((prev) =>
          prev.filter((item) => item.idProveedor !== confirmAction.proveedor.idProveedor)
        );
        if (selectedProveedor?.idProveedor === confirmAction.proveedor.idProveedor) {
          setWorkspaceVisible(false);
          setSelectedProveedor(null);
        }
      } else {
        const updated = mergeProveedorResult(confirmAction.proveedor, result);
        updateProveedorInList(updated);
        updateSelectedFromAction(confirmAction.proveedor, result);
      }
      setConfirmAction(null);
      restoreFocus();
      await fetchProveedores();
      showToast(
        "success",
        "Proveedores",
        confirmAction.success || actionMessages[targetAction]?.success || "Accion completada."
      );
    } catch (error) {
      console.error("Error en accion de proveedor:", error);
      showToast("error", "Proveedores", error?.message || "No se pudo completar la accion.");
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

  const closeEditor = () => {
    editorRequestRef.current += 1;
    setEditorVisible(false);
    restoreFocus();
  };

  const closeWorkspace = () => {
    setWorkspaceVisible(false);
    restoreFocus();
  };

  const closeConfirmAction = () => {
    setConfirmAction(null);
    restoreFocus();
  };

  const isRemovalFlow = confirmAction?.action === "salida";
  const targetAction = resolveConfirmTargetAction(confirmAction);
  const removalPolicyReady = isRemovalFlow && !confirmAction?.loadingPolicy;
  const removalCanDelete = removalPolicyReady && confirmAction?.deletePolicy?.puedeEliminar;
  const removalNeedsPreserve = removalPolicyReady && !confirmAction?.deletePolicy?.puedeEliminar;
  const removalAlreadyArchived =
    removalNeedsPreserve && proveedorEstado(confirmAction?.proveedor) === "ARCHIVADO";
  const confirmLabel = isRemovalFlow
    ? removalAlreadyArchived
      ? "Sin accion disponible"
      : removalCanDelete
      ? "Eliminar definitivamente"
      : targetAction === "archivar"
      ? "Quitar proveedor"
      : "Desactivar proveedor"
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
    !confirmAction?.motivo?.trim() ||
    (targetAction === "archivar" && !confirmAction?.archiveConfirmed) ||
    !targetAction ||
    removalAlreadyArchived;
  const hasActiveDirectoryQuery =
    search.trim() ||
    Object.entries(filters).some(([key, value]) => value !== emptyFilters[key]);
  const rowOptions = Array.from(
    new Set([tableBaseRows, ...FIXED_TABLE_ROW_OPTIONS])
  ).sort((a, b) => a - b);
  const pageStart = totalRecords && proveedores.length ? tableState.first + 1 : 0;
  const pageEnd = totalRecords && proveedores.length
    ? Math.min(tableState.first + proveedores.length, totalRecords)
    : 0;

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
          loading={loading}
          onSearchChange={handleSearchChange}
          onFilterChange={updateFilter}
          onClear={clearFilters}
          onRefresh={fetchProveedores}
        />

        <section className="prov-table-shell" ref={tableShellRef}>
          <div className="prov-table-head">
            <div>
              <strong>Relacion comercial</strong>
              <span>
                {pageStart}-{pageEnd} de {totalRecords} proveedores
              </span>
            </div>
            {loading && proveedores.length ? <small>Actualizando listado...</small> : null}
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
              rows={proveedores}
              loading={loading || saving || actionPreparing}
              hasProviders={totalRecords > 0 || Boolean(hasActiveDirectoryQuery)}
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

      <ProveedorEditorPanel
        visible={editorVisible}
        mode={editorMode}
        proveedor={editorProveedor}
        loading={editorLoading}
        saving={saving}
        categoriaOptions={categoriaOptions}
        categoriasLoading={categoriasLoading}
        onHide={closeEditor}
        onSave={saveProveedor}
      />

      <ProveedorWorkspaceDrawer
        visible={workspaceVisible}
        proveedor={selectedProveedor}
        loading={detailLoading}
        initialSection={workspaceInitialSection}
        onHide={closeWorkspace}
        onRefresh={refreshSelectedProveedor}
        showToast={showToast}
      />

      <ModalSurface
        title={confirmAction?.title || ""}
        visible={Boolean(confirmAction)}
        onHide={closeConfirmAction}
        size="small"
        className="prov-confirm-dialog"
        footer={
          <div className="prov-dialog-footer">
            <Button
              label="Cancelar"
              className="p-button-text prov-text-btn"
              onClick={closeConfirmAction}
              disabled={saving || actionPreparing}
            />
            <Button
              label={confirmLabel}
              icon={confirmIcon}
              className={
                targetAction === "eliminar" || targetAction === "archivar"
                  ? "prov-danger-btn"
                  : "prov-primary-btn"
              }
              onClick={confirmProveedorAction}
              loading={saving}
              disabled={confirmDisabled}
            />
          </div>
        }
      >
        <div className="prov-safe-action-body">
          {(isRemovalFlow || confirmAction?.action === "eliminar") ? (
            <>
              <div
                className={
                  targetAction === "archivar"
                    ? "prov-delete-policy is-danger"
                    : removalNeedsPreserve
                    ? "prov-delete-policy is-blocked"
                    : "prov-delete-policy"
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
                      ? "Revisando proveedor"
                      : removalCanDelete
                      ? "Eliminar definitivamente"
                      : targetAction === "archivar"
                      ? "Quitar proveedor"
                      : "Elegir salida"}
                  </strong>
                  <p>{removalSummaryText(confirmAction)}</p>
                </div>
              </div>

              {removalNeedsPreserve ? (
                <>
                  <div
                    className={`prov-removal-options ${
                      proveedorEstado(confirmAction?.proveedor) !== "ACTIVO" ? "is-single" : ""
                    }`}
                    aria-label="Opciones de salida del proveedor"
                  >
                    {proveedorEstado(confirmAction?.proveedor) === "ACTIVO" ? (
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
                          <small>Pausa temporal, puede volver</small>
                        </span>
                      </button>
                    ) : null}
                    {proveedorEstado(confirmAction?.proveedor) !== "ARCHIVADO" ? (
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
                          <small>Quitar definitivamente</small>
                        </span>
                      </button>
                    ) : null}
                    {proveedorEstado(confirmAction?.proveedor) === "ARCHIVADO" ? (
                      <div className="prov-removal-locked">
                        <i className="pi pi-lock" />
                        <span>No hay accion disponible</span>
                      </div>
                    ) : null}
                  </div>

                  {targetAction === "archivar" ? (
                    <label className="prov-archive-confirm">
                      <span>
                        <i className="pi pi-exclamation-triangle" />
                      </span>
                      <div>
                        <strong>No se podra usar este proveedor.</strong>
                        <small>
                          No podras editarlo ni usarlo en compras, productos, activos, documentos o contactos.
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
                          Confirmo que ya no se usara este proveedor.
                        </em>
                      </div>
                    </label>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}

          {!removalAlreadyArchived ? (
            <label className="prov-field prov-safe-reason">
              <span>Motivo</span>
              <InputTextarea
                value={confirmAction?.motivo || ""}
                onChange={(event) =>
                  setConfirmAction((prev) =>
                    prev ? { ...prev, motivo: event.target.value } : prev
                  )
                }
                rows={2}
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
      </ModalSurface>
    </Shell>
  );
}
