import React, { useMemo, useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";

import Shell from "../common/Shell";
import InventarioHeader from "./InventarioHeader";
import InventarioToolbar from "./InventarioToolbar";
import InventarioToolbarFilter from "./InventarioToolbarFilter";

import ModalEditarProducto from "./ModalEditarProducto";
import ModalAjusteStock from "./ModalAjusteStock";
import ModalAlertasStock from "./ModalAlertasStock";
import ModalEliminarProducto from "./ModalEliminarProducto";
import ModalAgregarProducto from "./ModalAgregarProducto";

import "../../style/components/Inventario/Inventario.css";

import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import ModalInformacion from "./ModalInformacion";

const api = new APIfetchApi();
/* ===========================
 *  Hook: valor con debounce
 * =========================== */
function useDebouncedValue(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/* ===========================
 *  Helpers de dominio
 * =========================== */

const STOCK_ESTADOS_CONFIG = []; // Se carga dinámicamente si es necesario

const getStockFromLotes = (lotes) =>
  Array.isArray(lotes)
    ? lotes.reduce((sum, l) => sum + (Number(l.cantidad) || 0), 0)
    : 0;

const mapProductosFromBackend = (data) =>
  (Array.isArray(data) ? data : []).map((p) => {
    // El backend InventarioDTO devuelve:
    // idInventario, idProducto, nombreProducto, existencia, estadoStock, almacen,
    // codigoBarras, precioVenta, imagen, categoriaNombre, proveedorNombre, precioCompra, estatus, fechaActualizacion
    const lotes = Array.isArray(p.lotes)
      ? p.lotes.map((l) => ({
          id: l.idLote,
          lote: l.numeroLote,
          cantidad: Number(l.cantidad) || 0,
          fechaExp: l.fechaExpiracion ? new Date(l.fechaExpiracion) : null,
          ubicacion: l.ubicacion || "",
        }))
      : [];

    const stock = p.existencia != null ? Number(p.existencia) : getStockFromLotes(lotes);

    return {
      id: p.idInventario ?? p.idProducto,
      idInventario: p.idInventario,
      idProducto: p.idProducto,
      sku: p.sku || p.codigoBarras || "",
      nombre: p.nombreProducto || "",
      categoriaId: p.idCategoria || null,
      categoria: p.categoriaNombre || p.categoria || "",
      proveedorId: p.idProveedor || null,
      proveedor: p.proveedorNombre || p.proveedor || "",
      precioCompra: Number(p.precioCompra) || 0,
      precioVenta: Number(p.precioVenta) || 0,
      umbrales: {
        critico: p.critico ?? 5,
        bajo: p.bajo ?? 12,
      },
      activo: p.estatus !== false,
      esPesaje: !!p.esPesaje,
      updatedAt: p.fechaActualizacion ? new Date(p.fechaActualizacion) : new Date(),
      imagen: p.urlImagen || p.imagen || null,
      almacen: p.almacen || "",
      unidadId: p.idUnidad || null,
      estadoStock: p.estadoStock || null,
      lotes,
      stock,
    };
  });

function getStockEstadoBase(producto) {
  const stock = producto.stock ?? getStockFromLotes(producto.lotes);
  const c = producto.umbrales?.critico ?? 5;
  const b = producto.umbrales?.bajo ?? 12;

  if (stock <= 0) return "AGOTADO";
  if (stock <= c) return "CRITICO";
  if (stock <= b) return "BAJO";
  return "OPTIMO";
}

function getStockEstadoWithConfig(producto, config) {
  const base = getStockEstadoBase(producto);
  const stock = producto.stock ?? getStockFromLotes(producto.lotes);
  const codesDisponibles = Array.isArray(config)
    ? config.map((e) => e.claveEstado || e.value)
    : [];

  if (!codesDisponibles.length) return base;

  if (codesDisponibles.includes(base)) return base;

  if (stock <= 0 && codesDisponibles.includes("AGOTADO")) return "AGOTADO";
  if (stock > 0 && codesDisponibles.includes("OPTIMO")) return "OPTIMO";

  return codesDisponibles[0];
}

export function getStockEstado(producto) {
  return getStockEstadoWithConfig(producto, STOCK_ESTADOS_CONFIG);
}

const applySearch = (rows, search) => {
  const q = search?.trim().toLowerCase();
  if (!q) return rows;

  return rows.filter((r) => {
    const nombre = r.nombre?.toLowerCase() || "";
    const sku = r.sku?.toLowerCase() || "";
    const cat = r.categoria?.toLowerCase() || "";
    const prov = r.proveedor?.toLowerCase() || "";

    return (
      nombre.includes(q) ||
      sku.includes(q) ||
      cat.includes(q) ||
      prov.includes(q)
    );
  });
};

const readApiPayload = async (response, label = "solicitud") => {
  if (!response) throw new Error(`Sin respuesta del servidor en ${label}`);

  const payload = await response.json().catch(() => null);
  const apiStatus = Number(payload?.statusCode || 0);

  if (!response.ok || apiStatus >= 400) {
    throw new Error(payload?.message || `Error HTTP ${response.status} en ${label}`);
  }

  if (!payload || !Object.prototype.hasOwnProperty.call(payload, "data")) {
    throw new Error(`Respuesta invÃ¡lida en ${label}`);
  }

  return payload;
};

const readOptionalCatalog = async (settledResult, label) => {
  try {
    if (settledResult.status === "rejected") throw settledResult.reason;
    return await readApiPayload(settledResult.value, label);
  } catch (error) {
    console.warn(`No se pudo cargar ${label}:`, error);
    return null;
  }
};

/* ===========================
 *       COMPONENTE MAIN
 * =========================== */

export default function Inventario() {
  const toast = useRef(null);
  const firstLoadRef = useRef(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ activo: true });
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [first, setFirst] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const formatDate = (date) =>
    date instanceof Date ? date.toISOString().slice(0, 10) : "";
  const boolToString = (val) =>
    typeof val === "boolean" ? (val ? "true" : "false") : "";

  useEffect(() => {
    setFirst(0);
  }, [debouncedSearch, filters]);

  const [modalAgregar, setModalAgregar] = useState(false);

  const [modalEditar, setModalEditar] = useState({
    open: false,
    producto: null,
  });
  const [modalAjuste, setModalAjuste] = useState({
    open: false,
    producto: null,
  });
  const [modalAlertas, setModalAlertas] = useState({
    open: false,
    producto: null,
  });
  const [modalEliminar, setModalEliminar] = useState({
    open: false,
    producto: null,
  });

  const [modalInfo, setModalInfo] = useState({ open: false, producto: null });

  // --- Catálogos (Prioridad 1) ---
  const [categoriasOptions, setCategoriasOptions] = useState([]);
  const [proveedoresOptions, setProveedoresOptions] = useState([]);
  const [almacenesOptions, setAlmacenesOptions] = useState([]);
  const [stockEstadosOptions, setStockEstadosOptions] = useState([]);
  const [unidadesOptions, setUnidadesOptions] = useState([]);

  const loadCatalogs = async () => {
    try {
      const catalogResponses = await Promise.allSettled([
        api.fetchApi({ "Content-Type": "application/json" }, "GET", undefined, endpoints.categorias),
        api.fetchApi({ "Content-Type": "application/json" }, "GET", undefined, endpoints.proveedores),
        api.fetchApi({ "Content-Type": "application/json" }, "GET", undefined, endpoints.almacen),
        api.fetchApi({ "Content-Type": "application/json" }, "GET", undefined, endpoints.estadoStock),
        api.fetchApi({ "Content-Type": "application/json" }, "GET", undefined, endpoints.unidades),
      ]);

      const [resCat, resProv, resAlm, resStock, resUnidades] = await Promise.all([
        readOptionalCatalog(catalogResponses[0], "categorÃ­as"),
        readOptionalCatalog(catalogResponses[1], "proveedores"),
        readOptionalCatalog(catalogResponses[2], "almacenes"),
        readOptionalCatalog(catalogResponses[3], "estados de stock"),
        readOptionalCatalog(catalogResponses[4], "unidades"),
      ]);

      if (resCat?.data) {
        setCategoriasOptions(
          resCat.data
            .filter(c => c.estatus !== false)
            .map(c => ({ label: c.nombreCategoria || c.nombre || String(c.idCategoria), value: c.idCategoria }))
        );
      }
      if (resProv?.data) {
        setProveedoresOptions(
          resProv.data
            .filter(p => p.estatus !== false)
            .map(p => ({ label: p.nombreProveedor || p.nombreEmpresa || String(p.idProveedor || p.idEmpresa), value: p.idProveedor || p.idEmpresa }))
        );
      }
      if (resAlm?.data) {
        setAlmacenesOptions(
          resAlm.data
            .filter(a => a.estatus !== false)
            .map(a => ({ label: a.nombre || a.direccion || String(a.idAlmacen), value: a.idAlmacen }))
        );
      }
      if (resStock?.data) {
        setStockEstadosOptions(
          resStock.data.map(s => ({
             label: s.nombreEstado || s.label, 
             value: s.nombreEstado || s.label, 
             id: s.idEstadoStock 
          }))
        );
      }
      if (resUnidades?.data) {
        setUnidadesOptions(
          resUnidades.data
            .filter(u => u.estatus !== false)
            .map(u => ({ label: u.nombreUnidad || String(u.idUnidad), value: u.idUnidad }))
        );
      }
    } catch (e) {
      console.error("Error al cargar catálogos globales:", e);
    }
  };

  const fetchProductos = async ({
    filtros = {},
    page = 0,
    size = rowsPerPage,
  } = {}) => {
    try {
      setLoading(true);

      // Determinar si hay filtros activos revisando si algún campo tiene valor real
      const hasFilters = Object.values(filtros).some((v) => {
        if (v === null || v === undefined) return false;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "string") return v.trim().length > 0;
        return true; // boolean o number
      });

      let res;

      if (hasFilters) {
        // El objeto filtros ya viene con los nombres y tipos
        // que coinciden con InventarioFilterDTO.java gracias al
        // buildRequestParams del InventarioToolbarFilter
        res = await api.fetchApi(
          { "Content-Type": "application/json" },
          "POST",
          filtros,
          `${endpoints.inventario}/filtrar`
        );
      } else {
        // Sin filtros: GET simple
        res = await api.fetchApi(
          { "Content-Type": "application/json" },
          "GET",
          undefined,
          endpoints.inventario
        );
      }

      const json = await readApiPayload(res, "inventario");
      if (!json || !json.data) throw new Error(json?.message || "Respuesta inválida");

      setRows(mapProductosFromBackend(json.data));
      setExpandedRows({});

      if (!firstLoadRef.current) {
        toast.current?.show({
          severity: "success",
          summary: "Inventario",
          detail: "Lista actualizada",
          life: 1800,
        });
      } else {
        firstLoadRef.current = false;
      }
    } catch (err) {
      console.error("Error al cargar inventario:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el inventario.",
        life: 2200,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
    fetchProductos({ filtros: filters, page: 0, size: rowsPerPage });
  }, []);

  const data = useMemo(
    () => applySearch(rows, debouncedSearch),
    [rows, debouncedSearch]
  );

  /* ===========================
   *  Acciones
   * =========================== */

  const handleRefresh = () => {
    const currentPage = Math.floor(first / rowsPerPage);
    fetchProductos({
      filtros: filters,
      page: currentPage,
      size: rowsPerPage,
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearch("");
    setFirst(0);

    fetchProductos({
      filtros: {},
      page: 0,
      size: rowsPerPage,
    });
  };

  const upsertProductoLocal = async (p, originalLotes = []) => {
    try {
      setLoading(true);
      // PUT /productos/{id}
      await api.fetchApi({ "Content-Type": "application/json" }, "PUT", {
        idProducto: p.idProducto,
        codigoBarras: p.sku || p.codigoBarras,
        nombreProducto: p.nombre || p.nombreProducto,
        descripcion: p.descripcion || p.nombre || p.nombreProducto,
        esPesaje: p.esPesaje || false,
        precioVenta: p.precioVenta,
        categoria: p.categoriaId ? { idCategoria: p.categoriaId } : undefined,
        unidad: p.unidadId ? { idUnidad: p.unidadId } : undefined,
        idProveedor: p.proveedorId || undefined,
        precioCompra: p.precioCompra || undefined,
        direccion: p.direccion || "ND",
        imagen: p.imagen,
        estatus: p.activo ?? p.estatus
      }, `${endpoints.ventasProductos}/${p.idProducto}`);

      // Manejo de Lotes
      const currentLotes = p.lotes || [];
      const almacenOption = almacenesOptions.find(a => a.label === p.almacen);
      const idAlmacen = almacenOption ? almacenOption.value : null;

      const lotesToCreate = currentLotes.filter(l => l.tempId && String(l.tempId).startsWith("temp-"));
      const lotesToUpdate = currentLotes.filter(l => typeof l.id === "number");
      const lotesToDelete = originalLotes.filter(ol => !currentLotes.find(cl => cl.id === ol.id));

      if (idAlmacen) {
        for (const lote of lotesToCreate) {
          await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
            producto: { idProducto: p.idProducto },
            almacen: { idAlmacen },
            cantidad: lote.cantidad,
            fechaCaducidad: lote.fechaExp
              ? (lote.fechaExp instanceof Date
                  ? lote.fechaExp.toISOString().slice(0, 10)
                  : String(lote.fechaExp).slice(0, 10))
              : null,
          }, endpoints.lotes);
        }
      } else if (lotesToCreate.length > 0) {
        console.warn("No se pudo mapear el ID del Almacén, por lo tanto no se crearon los lotes. Almacén string:", p.almacen);
        toast.current?.show({ severity: "warn", summary: "Almacén", detail: "No se pudieron crear lotes porque no se encontró el ID de almacén.", life: 3000 });
      }

      for (const lote of lotesToUpdate) {
        const original = originalLotes.find(ol => ol.id === lote.id);
        const getTime = (d) => d ? new Date(d).getTime() : 0;
        if (original && (original.cantidad !== lote.cantidad || 
           getTime(original.fechaExp) !== getTime(lote.fechaExp) ||
           original.ubicacion !== lote.ubicacion)) {
            await api.fetchApi({ "Content-Type": "application/json" }, "PUT", {
                cantidad: lote.cantidad,
                ubicacion: lote.ubicacion || "",
                fechaCaducidad: lote.fechaExp
                    ? (lote.fechaExp instanceof Date
                        ? lote.fechaExp.toISOString().slice(0, 10)
                        : String(lote.fechaExp).slice(0, 10))
                    : null,
            }, `${endpoints.lotes}/${lote.id}`);
        }
      }

      for (const lote of lotesToDelete) {
        await api.fetchApi({ "Content-Type": "application/json" }, "DELETE", undefined, `${endpoints.lotes}/${lote.id}`);
      }

      // Sincronizar el inventario global para que coincida con la suma de lotes resultante
      // Solo sincronizamos si el producto tiene o tenía lotes, para no sobreescribir productos manejados sin lotes
      if (p.idInventario && (originalLotes.length > 0 || currentLotes.length > 0)) {
        await api.fetchApi(
          { "Content-Type": "application/json" },
          "PUT",
          { existencia: p.stock },
          `${endpoints.inventario}/${p.idInventario}`
        );
      }

      // Si se editó algo que afecta el inventario (almacen, etc), en teoría hay que actualizarlo
      // Por ahora recargamos
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Producto y lotes actualizados", life: 1400 });
      handleRefresh();
    } catch (e) {
      console.error(e);
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo actualizar el producto", life: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const eliminarProductoLocal = async (id) => {
    try {
      setLoading(true);
      await api.fetchApi({ "Content-Type": "application/json" }, "DELETE", undefined, `${endpoints.ventasProductos}/${id}`);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Producto eliminado", life: 1400 });
      handleRefresh();
    } catch (e) {
      console.error(e);
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo eliminar el producto", life: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProducto = async (nuevo) => {
    try {
      setLoading(true);
      // 1. Crear el producto base
      const prodRes = await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
        nombreProducto: nuevo.nombreProducto,
        codigoBarras: nuevo.codigoBarras,
        descripcion: nuevo.descripcion || nuevo.nombreProducto,
        esPesaje: nuevo.esPesaje || false,
        precioVenta: nuevo.precioVenta,
        categoria: { idCategoria: nuevo.categoria },
        unidad: { idUnidad: nuevo.unidad },
        direccion: nuevo.direccion || "ND",
        imagen: nuevo.imagen || null,
        estatus: nuevo.estatus !== false,
      }, endpoints.ventasProductos);

      if (!prodRes) throw new Error("Fallo al crear producto");
      const prodJson = await prodRes.json();
      const idProducto = prodJson.data?.idProducto;
      if (!idProducto) throw new Error("No se obtuvo el ID del producto creado.");

      // 2. Vincular proveedor (precio compra)
      if (nuevo.proveedor && nuevo.precioCompra !== undefined) {
        await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
          producto: { idProducto },
          proveedor: { idProveedor: nuevo.proveedor },
          precioCompra: nuevo.precioCompra
        }, endpoints.proveedorProducto);
      }

      // 3. Configurar Umbrales
      await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
        idProducto: idProducto,
        critico: nuevo.umbrales?.critico ?? 5,
        bajo: nuevo.umbrales?.bajo ?? 12
      }, endpoints.configurarUmbrales);

      // 4. Crear Lotes o Inventario base
      if (nuevo.lotes && nuevo.lotes.length > 0 && nuevo.almacen) {
        // El back sincroniza el inventario automáticamente al crear lotes
        for (const lote of nuevo.lotes) {
          await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
            producto: { idProducto },
            almacen: { idAlmacen: nuevo.almacen },
            cantidad: lote.cantidad,
            fechaCaducidad: lote.fechaExp
              ? (lote.fechaExp instanceof Date
                  ? lote.fechaExp.toISOString().slice(0, 10)
                  : String(lote.fechaExp).slice(0, 10))
              : null,
          }, endpoints.lotes);
        }
      } else if (nuevo.almacen) {
        await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
          producto: { idProducto },
          almacen: { idAlmacen: nuevo.almacen },
          existencia: 0,
          fechaUltimaCompra: new Date().toISOString()
        }, endpoints.inventario);
      }

      toast.current?.show({ severity: "success", summary: "Producto", detail: "Producto creado exitosamente", life: 1400 });
      setModalAgregar(false);
      handleRefresh();

    } catch (e) {
      console.error("Error en creación:", e);
      toast.current?.show({ severity: "error", summary: "Error", detail: "Ocurrió un error al crear el producto", life: 2400 });
    } finally {
      setLoading(false);
    }
  };

  const handleAjusteStock = async (p, meta) => {
    try {
      setLoading(true);
      
      if (meta && meta.scope === "NUEVO_LOTE") {
        await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
          producto: { idProducto: p.idProducto },
          almacen: { idAlmacen: meta.ubicacion },
          cantidad: meta.cantidad,
          fechaCaducidad: meta.fechaExp
            ? (meta.fechaExp instanceof Date
                ? meta.fechaExp.toISOString().slice(0, 10)
                : String(meta.fechaExp).slice(0, 10))
            : null,
        }, endpoints.lotes);
      } else if (meta && meta.scope === "LOTE") {
        await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
          idLote: meta.loteSel,
          delta: meta.delta,
          motivo: meta.motivo
        }, `${endpoints.lotes}/ajuste`);
      } else {
        // Fallback: Si el producto NO tiene lotes y se ajusta el total,
        // modificamos la existencia directamente en inventario
        await api.fetchApi(
          { "Content-Type": "application/json" },
          "PUT",
          { existencia: p.stock },
          `${endpoints.inventario}/${p.id}`
        );
      }

      toast.current?.show({
        severity: "success",
        summary: "Inventario",
        detail: "Ajuste aplicado exitosamente",
        life: 1400,
      });
      handleRefresh();
    } catch (e) {
      console.error("Error en ajuste de stock:", e);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo aplicar el ajuste de stock",
        life: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurarUmbrales = async (p) => {
    try {
      setLoading(true);
      const payload = {
        idProducto: p.idProducto,
        critico: p.umbrales.critico,
        bajo: p.umbrales.bajo
      };

      await api.fetchApi(
        { "Content-Type": "application/json" },
        "POST",
        payload,
        endpoints.configurarUmbrales
      );

      toast.current?.show({
        severity: "success",
        summary: "Alertas",
        detail: "Umbrales configurados exitosamente",
        life: 1400,
      });
      handleRefresh();
    } catch (e) {
      console.error("Error al configurar umbrales:", e);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron configurar los umbrales",
        life: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const rowClassName = (row) => {
    if (!row.activo) return "row-inactive";
    const est = getStockEstado(row);
    if (est === "AGOTADO" || est === "CRITICO") return "row-low";
    return "";
  };

  const imagenBody = (row) => {
    if (!row.imagen) {
      return <i className="pi pi-image inv-thumb-placeholder" />;
    }

    // Si ya tiene prefijo data: o es una URL http, úsalo directo
    const src = row.imagen.startsWith("data:") || row.imagen.startsWith("http")
      ? row.imagen
      : `data:image/png;base64,${row.imagen}`;

    return (
      <img
        src={src}
        alt={row.nombre}
        className="inv-thumb"
        loading="lazy"
      />
    );
  };

  const stockBody = (row) => (
    <span className="tabular stock-simple">{row.stock ?? 0}</span>
  );

  const accionesBody = (row) => (
    <div className="table-actions">
      <Button
        icon="pi pi-eye"
        className="inv-action-btn"
        tooltip="Más información"
        tooltipOptions={{ position: "top" }}
        onClick={() => setModalInfo({ open: true, producto: row })}
      />
      <Button
        icon="pi pi-pencil"
        className="inv-action-btn"
        tooltip="Editar producto"
        tooltipOptions={{ position: "top" }}
        onClick={() => setModalEditar({ open: true, producto: row })}
      />
      <Button
        icon="pi pi-sliders-h"
        className="inv-action-btn"
        tooltip="Alertas de stock"
        tooltipOptions={{ position: "top" }}
        onClick={() => setModalAlertas({ open: true, producto: row })}
      />
      <Button
        icon="pi pi-sync"
        className="inv-action-btn"
        tooltip="Ajustar stock"
        tooltipOptions={{ position: "top" }}
        onClick={() => setModalAjuste({ open: true, producto: row })}
      />
      <Button
        icon="pi pi-trash"
        className="inv-action-btn danger"
        tooltip="Eliminar producto"
        tooltipOptions={{ position: "top" }}
        onClick={() => setModalEliminar({ open: true, producto: row })}
      />
    </div>
  );

  const rowExpansionTemplate = (data) => {
    return (
      <div className="p-3">
        <DataTable
          value={data.lotes}
          size="small"
          className="inv-lotes-table"
          responsive
        >
          <Column field="id" header="Lote" />

          <Column
            field="cantidad"
            header="Cantidad"
            body={(l) => <span className="tabular">{l.cantidad}</span>}
          />

          <Column
            field="fechaExp"
            header="Caducidad"
            body={(l) => {
              if (!l.fechaExp) return "—";
              const d = new Date(l.fechaExp);
              const time = d.getTime();
              const now = Date.now();
              const soon = now + 15 * 24 * 60 * 60 * 1000;

              let cls = "lote-exp-ok";
              if (time < now) cls = "lote-exp-bad";
              else if (time <= soon) cls = "lote-exp-soon";

              return (
                <span className={cls}>
                  {d.toLocaleDateString("es-MX", { dateStyle: "medium" })}
                </span>
              );
            }}
          />

          <Column field="ubicacion" header="Ubicación" />
        </DataTable>
      </div>
    );
  };

  return (
    <Shell>
      <div className="inv-page">
        <Toast ref={toast} className="inv-toast" />
        <ConfirmDialog />

        <InventarioHeader rows={rows} getStockEstado={getStockEstado} />

        <InventarioToolbar
          search={search}
          onSearchChange={setSearch}
          onOpenFilters={() => setFilterOpen(true)}
          onClearFilters={clearAllFilters}
          onRefresh={handleRefresh}
          loading={loading}
          onAddProduct={() => setModalAgregar(true)}
        />

        <InventarioToolbarFilter
          visible={filterOpen}
          onHide={() => setFilterOpen(false)}
          onApply={(f) => {
            const newFilters = f || {};
            setFilters(newFilters);
            setFilterOpen(false);
            setFirst(0);
            fetchProductos({
              filtros: newFilters,
              page: 0,
              size: rowsPerPage,
            });
          }}
          initialFilters={filters}
          // Pasamos catálogos para optimizar (opcional)
          categoriasOptions={categoriasOptions}
          proveedoresOptions={proveedoresOptions}
          almacenesOptions={almacenesOptions}
          stockEstadosOptions={stockEstadosOptions}
        />

        <DataTable
          value={data}
          loading={loading}
          selection={selected}
          onSelectionChange={(e) => setSelected(e.value)}
          dataKey="id"
          paginator
          first={first}
          rows={rowsPerPage}
          onPage={(e) => {
            setFirst(e.first);
            setRowsPerPage(e.rows);
            // Aquí, cuando tengas backend paginado, puedes llamar a fetchProductos
            // const page = e.first / e.rows;
            // fetchProductos({ filtros: filters, page, size: e.rows });
          }}
          rowsPerPageOptions={[10, 20, 30]}
          totalRecords={data.length}
          currentPageReportTemplate="Mostrando {first} - {last} de {totalRecords}"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
          className="inv-table p-datatable-sm"
          rowClassName={rowClassName}
          sortMode="multiple"
          scrollable
          scrollHeight="calc(100vh - 380px)"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column
            expander
            className="inv-col inv-col--expander"
            headerClassName="inv-col-header inv-col-header--expander"
          />

          <Column
            header="Imagen"
            body={imagenBody}
            className="inv-col inv-col--imagen"
            headerClassName="inv-col-header inv-col-header--imagen"
            sortable={false}
          />

          <Column
            field="nombre"
            header="Nombre"
            sortable
            className="inv-col inv-col--nombre"
            headerClassName="inv-col-header inv-col-header--nombre"
          />

          <Column
            field="sku"
            header="SKU"
            className="inv-col inv-col--sku"
            headerClassName="inv-col-header inv-col-header--sku"
          />

          <Column
            field="stock"
            header="Stock"
            sortable
            className="inv-col inv-col--stock"
            headerClassName="inv-col-header inv-col-header--stock"
          />

          <Column
            field="precioCompra"
            header="P. compra"
            sortable
            body={(row) => (
              <span className="inv-price">${(Number(row.precioCompra) || 0).toFixed(2)}</span>
            )}
            className="inv-col inv-col--precioCompra"
            headerClassName="inv-col-header inv-col-header--precioCompra"
          />

          <Column
            field="precioVenta"
            header="P. venta"
            sortable
            body={(row) => (
              <span className="inv-price">${(Number(row.precioVenta) || 0).toFixed(2)}</span>
            )}
            className="inv-col inv-col--precioVenta"
            headerClassName="inv-col-header inv-col-header--precioVenta"
          />

          <Column
            header="Acciones"
            body={accionesBody}
            className="inv-col inv-col--acciones"
            headerClassName="inv-col-header inv-col-header--acciones"
            frozen
          />
        </DataTable>

        {/* Modales */}
        <ModalInformacion
          open={modalInfo.open}
          producto={modalInfo.producto}
          onHide={() => setModalInfo({ open: false, producto: null })}
          onEdit={(p) => setModalEditar({ open: true, producto: p })}
          onAlertas={(p) => setModalAlertas({ open: true, producto: p })}
          onAjuste={(p) => setModalAjuste({ open: true, producto: p })}
        />

        <ModalEditarProducto
          open={modalEditar.open}
          producto={modalEditar.producto}
          onHide={() => setModalEditar({ open: false, producto: null })}
          onSave={(p) => {
            upsertProductoLocal(p, modalEditar.producto?.lotes || []);
            setModalEditar({ open: false, producto: null });
          }}
          categoriasOptions={categoriasOptions}
          proveedoresOptions={proveedoresOptions}
          unidadesOptions={unidadesOptions}
          almacenesOptions={almacenesOptions}
        />

        <ModalAjusteStock
          open={modalAjuste.open}
          producto={modalAjuste.producto}
          onHide={() => setModalAjuste({ open: false, producto: null })}
          onApply={(p, meta) => {
            handleAjusteStock(p, meta);
            setModalAjuste({ open: false, producto: null });
          }}
          almacenesOptions={almacenesOptions}
        />

        <ModalAlertasStock
          open={modalAlertas.open}
          producto={modalAlertas.producto}
          onHide={() => setModalAlertas({ open: false, producto: null })}
          onSave={(p) => {
            handleConfigurarUmbrales(p);
            setModalAlertas({ open: false, producto: null });
          }}
        />

        <ModalEliminarProducto
          open={modalEliminar.open}
          producto={modalEliminar.producto}
          onHide={() => setModalEliminar({ open: false, producto: null })}
          onConfirm={(id) => {
            eliminarProductoLocal(id);
            setModalEliminar({ open: false, producto: null });
          }}
        />

        <ModalAgregarProducto
          open={modalAgregar}
          onHide={() => setModalAgregar(false)}
          onCreate={handleCreateProducto}
          categoriasOptions={categoriasOptions}
          proveedoresOptions={proveedoresOptions}
          almacenesOptions={almacenesOptions}
          unidadesOptions={unidadesOptions}
        />
      </div>
    </Shell>
  );
}
