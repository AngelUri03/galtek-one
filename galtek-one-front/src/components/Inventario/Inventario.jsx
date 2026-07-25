import React, { useMemo, useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Tooltip } from "primereact/tooltip";
import Shell from "../common/Shell";

import ModalEditarProducto from "./ModalEditarProducto";
import ModalAjusteStock from "./ModalAjusteStock";
import ModalAlertasStock from "./ModalAlertasStock";
import ModalEliminarProducto from "./ModalEliminarProducto";
import ModalAgregarProducto from "./ModalAgregarProducto";
import ModalInformacion from "./ModalInformacion";

import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

import "../../style/components/Proveedores/Proveedores.css";
import "../../style/components/Inventario/Inventario.css";

const api = new APIfetchApi();

function useDebouncedValue(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

const getStockFromLotes = (lotes) =>
  Array.isArray(lotes) ? lotes.reduce((sum, l) => sum + (Number(l.cantidad) || 0), 0) : 0;

const mapProductosFromBackend = (data) =>
  (Array.isArray(data) ? data : []).map((p) => {
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
      umbrales: { critico: p.critico ?? 5, bajo: p.bajo ?? 12 },
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

export function getStockEstado(producto) {
  const stock = producto.stock ?? getStockFromLotes(producto.lotes);
  const c = producto.umbrales?.critico ?? 5;
  const b = producto.umbrales?.bajo ?? 12;
  if (stock <= 0) return "AGOTADO";
  if (stock <= c) return "CRITICO";
  if (stock <= b) return "BAJO";
  return "OPTIMO";
}

const applySearch = (rows, search) => {
  const q = search?.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => 
    r.nombre?.toLowerCase().includes(q) ||
    r.sku?.toLowerCase().includes(q) ||
    r.categoria?.toLowerCase().includes(q) ||
    r.proveedor?.toLowerCase().includes(q)
  );
};

const readApiPayload = async (response, label = "solicitud") => {
  if (!response) throw new Error(`Sin respuesta del servidor en ${label}`);
  const payload = await response.json().catch(() => null);
  if (!response.ok || Number(payload?.statusCode || 0) >= 400) {
    throw new Error(payload?.message || `Error HTTP ${response.status}`);
  }
  return payload;
};

export default function Inventario() {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  
  const [filters, setFilters] = useState({ estado: "TODOS", categoria: "TODOS" });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [modalAgregar, setModalAgregar] = useState(false);
  const [modalEditar, setModalEditar] = useState({ open: false, producto: null });
  const [modalAjuste, setModalAjuste] = useState({ open: false, producto: null });
  const [modalAlertas, setModalAlertas] = useState({ open: false, producto: null });
  const [modalEliminar, setModalEliminar] = useState({ open: false, producto: null });
  const [modalInfo, setModalInfo] = useState({ open: false, producto: null });

  const [categoriasOptions, setCategoriasOptions] = useState([]);
  const [proveedoresOptions, setProveedoresOptions] = useState([]);
  const [almacenesOptions, setAlmacenesOptions] = useState([]);
  const [unidadesOptions, setUnidadesOptions] = useState([]);

  const loadCatalogs = async () => {
    try {
      const res = await Promise.allSettled([
        api.fetchApi({"Content-Type":"application/json"}, "GET", undefined, endpoints.categorias),
        api.fetchApi({"Content-Type":"application/json"}, "GET", undefined, endpoints.proveedores),
        api.fetchApi({"Content-Type":"application/json"}, "GET", undefined, endpoints.almacen),
        api.fetchApi({"Content-Type":"application/json"}, "GET", undefined, endpoints.unidades),
      ]);
      if (res[0].status === "fulfilled") {
        const js = await res[0].value.json();
        setCategoriasOptions((js.data || []).map(c => ({ label: c.nombreCategoria || c.nombre, value: c.idCategoria })));
      }
      if (res[1].status === "fulfilled") {
        const js = await res[1].value.json();
        setProveedoresOptions((js.data || []).map(p => ({ label: p.nombreProveedor || p.nombreEmpresa, value: p.idProveedor })));
      }
      if (res[2].status === "fulfilled") {
        const js = await res[2].value.json();
        setAlmacenesOptions((js.data || []).map(a => ({ label: a.nombre, value: a.idAlmacen })));
      }
      if (res[3].status === "fulfilled") {
        const js = await res[3].value.json();
        setUnidadesOptions((js.data || []).map(u => ({ label: u.nombreUnidad, value: u.idUnidad })));
      }
    } catch (e) { console.error(e); }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await api.fetchApi({ "Content-Type": "application/json" }, "GET", undefined, endpoints.inventario);
      const json = await readApiPayload(res, "inventario");
      setRows(mapProductosFromBackend(json.data));
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo cargar el inventario." });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadCatalogs(); fetchProductos(); }, []);

  const handleCreateProducto = async (nuevo) => {
    try {
      setLoading(true);
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

      if (nuevo.proveedor && nuevo.precioCompra !== undefined) {
        await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
          producto: { idProducto },
          proveedor: { idProveedor: nuevo.proveedor },
          precioCompra: nuevo.precioCompra
        }, endpoints.proveedorProducto);
      }

      await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
        idProducto: idProducto,
        critico: nuevo.umbrales?.critico ?? 5,
        bajo: nuevo.umbrales?.bajo ?? 12
      }, endpoints.configurarUmbrales);

      if (nuevo.lotes && nuevo.lotes.length > 0 && nuevo.almacen) {
        for (const lote of nuevo.lotes) {
          await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
            producto: { idProducto },
            almacen: { idAlmacen: nuevo.almacen },
            cantidad: lote.cantidad,
            fechaCaducidad: lote.fechaExp ? (lote.fechaExp instanceof Date ? lote.fechaExp.toISOString().slice(0, 10) : String(lote.fechaExp).slice(0, 10)) : null,
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

      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Producto creado correctamente", life: 2000 });
      setModalAgregar(false);
      fetchProductos();
    } catch (e) {
      console.error("Error en creación:", e);
      toast.current?.show({ severity: "error", summary: "Error", detail: e.message || "Error al crear producto", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const data = useMemo(() => {
    let result = applySearch(rows, debouncedSearch);
    if (filters.estado !== "TODOS") {
      result = result.filter(r => getStockEstado(r) === filters.estado);
    }
    if (filters.categoria !== "TODOS") {
      result = result.filter(r => r.categoriaId === filters.categoria);
    }
    return result;
  }, [rows, debouncedSearch, filters]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      optimos: rows.filter(r => getStockEstado(r) === "OPTIMO").length,
      bajos: rows.filter(r => getStockEstado(r) === "BAJO").length,
      criticos: rows.filter(r => getStockEstado(r) === "CRITICO").length,
      agotados: rows.filter(r => getStockEstado(r) === "AGOTADO").length,
    };
  }, [rows]);

  const imagenBody = (row) => {
    if (!row.imagen) return <i className="pi pi-image" style={{fontSize: '1.5rem', color: '#65736f'}}/>;
    const src = row.imagen.startsWith("data:") || row.imagen.startsWith("http") ? row.imagen : `data:image/png;base64,${row.imagen}`;
    return <img src={src} alt={row.nombre} className="inv-thumb" />;
  };

  const accionesBody = (row) => (
    <div className="prov-row-actions">
      <Button icon="pi pi-eye" className="prov-row-action" tooltip="Información" onClick={() => setModalInfo({ open: true, producto: row })} />
      <Button icon="pi pi-pencil" className="prov-row-action" tooltip="Editar" onClick={() => setModalEditar({ open: true, producto: row })} />
      <Button icon="pi pi-sliders-h" className="prov-row-action" tooltip="Umbrales" onClick={() => setModalAlertas({ open: true, producto: row })} />
      <Button icon="pi pi-sync" className="prov-row-action" tooltip="Ajustar" onClick={() => setModalAjuste({ open: true, producto: row })} />
      <div className="prov-row-action-separator" />
      <Button icon="pi pi-trash" className="prov-row-action prov-menu-danger" tooltip="Eliminar" onClick={() => setModalEliminar({ open: true, producto: row })} />
    </div>
  );

  const rowExpansionTemplate = (data) => (
    <div className="p-3 inv-lotes-container">
      <DataTable value={data.lotes} size="small" className="prov-table inv-lotes-table" responsive>
        <Column field="id" header="Lote ID" />
        <Column field="cantidad" header="Cantidad" body={(l) => <strong>{l.cantidad}</strong>} />
        <Column header="Costo Compra" body={() => <span>${Number(data.precioCompra || 0).toFixed(2)}</span>} />
        <Column field="fechaExp" header="Caducidad" body={(l) => {
            if (!l.fechaExp) return "—";
            const d = new Date(l.fechaExp);
            return <span>{d.toLocaleDateString("es-MX", { dateStyle: "medium" })}</span>;
        }} />
        <Column field="ubicacion" header="Ubicación" />
        <Column header="Última Act." body={() => <span>{data.updatedAt.toLocaleDateString("es-MX", { dateStyle: "short" })}</span>} />
      </DataTable>
    </div>
  );

  return (
    <Shell>
      <Toast ref={toast} className="prov-toast" />
      <Tooltip />
      <ConfirmDialog />

      <main className="proveedores-page">
        {/* HEADER BAR SIMPLIFICADO */}
        <section className="prov-header">
          <div className="prov-header-title">
            <i className="pi pi-box" />
            <h1>Inventario</h1>
          </div>
          <Button
            label="Nuevo Producto"
            icon="pi pi-plus"
            className="prov-primary-btn"
            onClick={() => setModalAgregar(true)}
          />
        </section>

        {/* SUMMARY CARDS */}
        <section className="prov-summary">
          <div className="prov-summary-card">
            <i className="pi pi-box" />
            <div>
              <span>Total Ítems</span>
              <strong>{stats.total}</strong>
            </div>
          </div>
          <div className="prov-summary-card">
            <i className="pi pi-check-circle" style={{color: '#0a7463'}} />
            <div>
              <span>Stock Óptimo</span>
              <strong>{stats.optimos}</strong>
            </div>
          </div>
          <div className="prov-summary-card">
            <i className="pi pi-exclamation-triangle" style={{color: '#b91c1c'}} />
            <div>
              <span>Críticos / Bajos</span>
              <strong>{stats.criticos + stats.bajos}</strong>
            </div>
          </div>
          <div className="prov-summary-card">
            <i className="pi pi-times-circle" style={{color: '#9f3f3f'}} />
            <div>
              <span>Agotados</span>
              <strong>{stats.agotados}</strong>
            </div>
          </div>
        </section>

        {/* CONTROLES */}
        <section className="prov-controls">
          <div className="prov-search-wrap">
            <i className="pi pi-search" />
            <InputText 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar por nombre, SKU, categoría o proveedor..." 
            />
          </div>

          <div className="prov-filter-grid">
            <div className="prov-filter">
              <span>Estado Stock</span>
              <Dropdown
                value={filters.estado}
                options={[
                  { label: "Todos", value: "TODOS" },
                  { label: "Óptimo", value: "OPTIMO" },
                  { label: "Bajo", value: "BAJO" },
                  { label: "Crítico", value: "CRITICO" },
                  { label: "Agotado", value: "AGOTADO" }
                ]}
                onChange={(e) => setFilters(prev => ({ ...prev, estado: e.value }))}
              />
            </div>

            <div className="prov-filter">
              <span>Categoría</span>
              <Dropdown
                value={filters.categoria}
                options={[{ label: "Todas", value: "TODOS" }, ...categoriasOptions]}
                onChange={(e) => setFilters(prev => ({ ...prev, categoria: e.value }))}
                placeholder="Seleccionar"
              />
            </div>
          </div>

          <div className="prov-control-actions">
            <Button icon="pi pi-refresh" className="prov-icon-btn" onClick={fetchProductos} />
            <Button icon="pi pi-filter-slash" className="prov-icon-btn" onClick={() => { setSearch(""); setFilters({ estado: "TODOS", categoria: "TODOS" }); }} />
          </div>
        </section>

        {/* TABLA PRINCIPAL */}
        <section className="prov-table-shell">
          <div className="prov-table-head">
            <div>
              <strong>Existencias en Sistema</strong>
              <span>{data.length} de {rows.length} productos filtrados</span>
            </div>
          </div>

          <DataTable
            value={data}
            selectionMode="single"
            selection={selected}
            onSelectionChange={(e) => setSelected(e.value)}
            dataKey="id"
            paginator
            rows={10}
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            rowExpansionTemplate={rowExpansionTemplate}
            className="prov-table p-datatable-sm"
            scrollable
            scrollHeight="calc(100vh - 390px)"
            emptyMessage="No se encontraron productos."
          >
            <Column expander style={{ width: '3em' }} />
            <Column header="Ref" body={imagenBody} style={{ width: '60px' }} />
            
            <Column 
              field="nombre" 
              header="Nombre" 
              sortable 
              body={(row) => <strong>{row.nombre}</strong>} 
            />
            
            <Column 
              field="sku" 
              header="SKU" 
              sortable 
              body={(row) => <span className="prov-muted-pill">{row.sku || '—'}</span>} 
            />

            <Column field="categoria" header="Categoría" sortable body={(row) => <span className="prov-muted-text">{row.categoria}</span>} />
            <Column field="proveedor" header="Proveedor" sortable body={(row) => <span className="prov-muted-text">{row.proveedor}</span>} />
            <Column field="stock" header="Existencia" sortable body={(row) => <strong>{row.stock}</strong>} />
            
            <Column 
              field="estadoStock" 
              header="Estado" 
              sortable 
              body={(row) => {
                const est = getStockEstado(row);
                let sev = "prov-state-tag p-tag-secondary";
                if (est === "OPTIMO") sev = "prov-state-tag p-tag-success";
                if (est === "BAJO" || est === "CRITICO") sev = "prov-state-tag p-tag-warning";
                if (est === "AGOTADO") sev = "prov-state-tag p-tag-danger";
                return <Tag value={est} className={sev} />;
              }}
            />
            
            <Column field="precioVenta" header="P. Venta" sortable body={(row) => <strong>${Number(row.precioVenta || 0).toFixed(2)}</strong>} />
            <Column header="Acciones" body={accionesBody} frozen alignFrozen="right" style={{ width: '180px' }} />
          </DataTable>
        </section>

        {/* MODALES Y SIDEBAR */}
        <ModalInformacion open={modalInfo.open} producto={modalInfo.producto} onHide={() => setModalInfo({ open: false, producto: null })} onEdit={(p) => setModalEditar({ open: true, producto: p })} onAlertas={(p) => setModalAlertas({ open: true, producto: p })} onAjuste={(p) => setModalAjuste({ open: true, producto: p })} />
        <ModalEditarProducto open={modalEditar.open} producto={modalEditar.producto} onHide={() => setModalEditar({ open: false, producto: null })} onSave={() => { fetchProductos(); setModalEditar({ open: false, producto: null }); }} categoriasOptions={categoriasOptions} proveedoresOptions={proveedoresOptions} unidadesOptions={unidadesOptions} almacenesOptions={almacenesOptions} />
        <ModalAjusteStock open={modalAjuste.open} producto={modalAjuste.producto} onHide={() => setModalAjuste({ open: false, producto: null })} onApply={() => { fetchProductos(); setModalAjuste({ open: false, producto: null }); }} almacenesOptions={almacenesOptions} />
        <ModalAlertasStock open={modalAlertas.open} producto={modalAlertas.producto} onHide={() => setModalAlertas({ open: false, producto: null })} onSave={() => { fetchProductos(); setModalAlertas({ open: false, producto: null }); }} />
        <ModalEliminarProducto open={modalEliminar.open} producto={modalEliminar.producto} onHide={() => setModalEliminar({ open: false, producto: null })} onConfirm={() => { fetchProductos(); setModalEliminar({ open: false, producto: null }); }} />
        
        <ModalAgregarProducto 
          open={modalAgregar} 
          onHide={() => setModalAgregar(false)} 
          onCreate={handleCreateProducto} 
          categoriasOptions={categoriasOptions} 
          proveedoresOptions={proveedoresOptions} 
          almacenesOptions={almacenesOptions} 
          unidadesOptions={unidadesOptions} 
        />
      </main>
    </Shell>
  );
}