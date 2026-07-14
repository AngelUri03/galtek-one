        import React, { useMemo, useRef, useState, useEffect } from "react";
        import { DataTable } from "primereact/datatable";
        import { Column } from "primereact/column";
        import { Button } from "primereact/button";
        import { Toast } from "primereact/toast";
        import { ConfirmDialog } from "primereact/confirmdialog";
        import { InputText } from "primereact/inputtext";

        import Shell from "../common/Shell";
        import InventarioHeader from "./InventarioHeader";
        import InventarioToolbarFilter from "./InventarioToolbarFilter";

        import ModalEditarProducto from "./ModalEditarProducto";
        import ModalAjusteStock from "./ModalAjusteStock";
        import ModalAlertasStock from "./ModalAlertasStock";
        import ModalEliminarProducto from "./ModalEliminarProducto";
        import ModalAgregarProducto from "./ModalAgregarProducto";
        import ModalInformacion from "./ModalInformacion";
        import { Tag } from "primereact/tag";

        import "../../style/components/Inventario/Inventario.css";

        import { APIfetchApi } from "../../API/APIfetch";
        import { endpoints } from "../../API/api";

        const api = new APIfetchApi();

        /* ===========================
        * Hook: valor con debounce
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
        * Helpers de dominio
        * =========================== */

        const STOCK_ESTADOS_CONFIG = []; 

        const getStockFromLotes = (lotes) =>
          Array.isArray(lotes)
            ? lotes.reduce((sum, l) => sum + (Number(l.cantidad) || 0), 0)
            : 0;

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
            throw new Error(`Respuesta inválida en ${label}`);
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
        * COMPONENTE MAIN
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

          useEffect(() => {
            setFirst(0);
          }, [debouncedSearch, filters]);

          const [modalAgregar, setModalAgregar] = useState(false);
          const [modalEditar, setModalEditar] = useState({ open: false, producto: null });
          const [modalAjuste, setModalAjuste] = useState({ open: false, producto: null });
          const [modalAlertas, setModalAlertas] = useState({ open: false, producto: null });
          const [modalEliminar, setModalEliminar] = useState({ open: false, producto: null });
          const [modalInfo, setModalInfo] = useState({ open: false, producto: null });

          // --- Catálogos ---
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
                readOptionalCatalog(catalogResponses[0], "categorías"),
                readOptionalCatalog(catalogResponses[1], "proveedores"),
                readOptionalCatalog(catalogResponses[2], "almacenes"),
                readOptionalCatalog(catalogResponses[3], "estados de stock"),
                readOptionalCatalog(catalogResponses[4], "unidades"),
              ]);

              if (resCat?.data) {
                setCategoriasOptions(resCat.data.filter(c => c.estatus !== false).map(c => ({ label: c.nombreCategoria || c.nombre || String(c.idCategoria), value: c.idCategoria })));
              }
              if (resProv?.data) {
                setProveedoresOptions(resProv.data.filter(p => p.estatus !== false).map(p => ({ label: p.nombreProveedor || p.nombreEmpresa || String(p.idProveedor || p.idEmpresa), value: p.idProveedor || p.idEmpresa })));
              }
              if (resAlm?.data) {
                setAlmacenesOptions(resAlm.data.filter(a => a.estatus !== false).map(a => ({ label: a.nombre || a.direccion || String(a.idAlmacen), value: a.idAlmacen })));
              }
              if (resStock?.data) {
                setStockEstadosOptions(resStock.data.map(s => ({ label: s.nombreEstado || s.label, value: s.nombreEstado || s.label, id: s.idEstadoStock })));
              }
              if (resUnidades?.data) {
                setUnidadesOptions(resUnidades.data.filter(u => u.estatus !== false).map(u => ({ label: u.nombreUnidad || String(u.idUnidad), value: u.idUnidad })));
              }
            } catch (e) {
              console.error("Error al cargar catálogos globales:", e);
            }
          };

          const fetchProductos = async ({ filtros = {}, page = 0, size = rowsPerPage } = {}) => {
            try {
              setLoading(true);
              const hasFilters = Object.values(filtros).some((v) => {
                if (v === null || v === undefined) return false;
                if (Array.isArray(v)) return v.length > 0;
                if (typeof v === "string") return v.trim().length > 0;
                return true; 
              });

              let res;
              if (hasFilters) {
                res = await api.fetchApi({ "Content-Type": "application/json" }, "POST", filtros, `${endpoints.inventario}/filtrar`);
              } else {
                res = await api.fetchApi({ "Content-Type": "application/json" }, "GET", undefined, endpoints.inventario);
              }

              const json = await readApiPayload(res, "inventario");
              if (!json || !json.data) throw new Error(json?.message || "Respuesta inválida");

              setRows(mapProductosFromBackend(json.data));
              setExpandedRows({});

              if (!firstLoadRef.current) {
                toast.current?.show({ severity: "success", summary: "Inventario", detail: "Lista actualizada", life: 1800 });
              } else {
                firstLoadRef.current = false;
              }
            } catch (err) {
              console.error("Error al cargar inventario:", err);
              toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo cargar el inventario.", life: 2200 });
            } finally {
              setLoading(false);
            }
          };

          useEffect(() => {
            loadCatalogs();
            fetchProductos({ filtros: filters, page: 0, size: rowsPerPage });
          }, []);

          const data = useMemo(() => applySearch(rows, debouncedSearch), [rows, debouncedSearch]);

          const handleRefresh = () => {
            const currentPage = Math.floor(first / rowsPerPage);
            fetchProductos({ filtros: filters, page: currentPage, size: rowsPerPage });
          };

          const clearAllFilters = () => {
            setFilters({});
            setSearch("");
            setFirst(0);
            fetchProductos({ filtros: {}, page: 0, size: rowsPerPage });
          };

          const upsertProductoLocal = async (p, originalLotes = []) => {
            try {
              setLoading(true);
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
                    fechaCaducidad: lote.fechaExp ? (lote.fechaExp instanceof Date ? lote.fechaExp.toISOString().slice(0, 10) : String(lote.fechaExp).slice(0, 10)) : null,
                  }, endpoints.lotes);
                }
              } else if (lotesToCreate.length > 0) {
                console.warn("No se pudo mapear el ID del Almacén, por lo tanto no se crearon los lotes. Almacén string:", p.almacen);
                toast.current?.show({ severity: "warn", summary: "Almacén", detail: "No se pudieron crear lotes porque no se encontró el ID de almacén.", life: 3000 });
              }

              for (const lote of lotesToUpdate) {
                const original = originalLotes.find(ol => ol.id === lote.id);
                const getTime = (d) => d ? new Date(d).getTime() : 0;
                if (original && (original.cantidad !== lote.cantidad || getTime(original.fechaExp) !== getTime(lote.fechaExp) || original.ubicacion !== lote.ubicacion)) {
                    await api.fetchApi({ "Content-Type": "application/json" }, "PUT", {
                        cantidad: lote.cantidad,
                        ubicacion: lote.ubicacion || "",
                        fechaCaducidad: lote.fechaExp ? (lote.fechaExp instanceof Date ? lote.fechaExp.toISOString().slice(0, 10) : String(lote.fechaExp).slice(0, 10)) : null,
                    }, `${endpoints.lotes}/${lote.id}`);
                }
              }

              for (const lote of lotesToDelete) {
                await api.fetchApi({ "Content-Type": "application/json" }, "DELETE", undefined, `${endpoints.lotes}/${lote.id}`);
              }

              if (p.idInventario && (originalLotes.length > 0 || currentLotes.length > 0)) {
                await api.fetchApi({ "Content-Type": "application/json" }, "PUT", { existencia: p.stock }, `${endpoints.inventario}/${p.idInventario}`);
              }

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
            const ESTADO_PESO = {
              "AGOTADO": 1,
              "CRITICO": 2,
              "BAJO": 3,
              "OPTIMO": 4
            };
          const handleAjusteStock = async (p, meta) => {
            try {
              setLoading(true);
              if (meta && meta.scope === "NUEVO_LOTE") {
                await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
                  producto: { idProducto: p.idProducto },
                  almacen: { idAlmacen: meta.ubicacion },
                  cantidad: meta.cantidad,
                  fechaCaducidad: meta.fechaExp ? (meta.fechaExp instanceof Date ? meta.fechaExp.toISOString().slice(0, 10) : String(meta.fechaExp).slice(0, 10)) : null,
                }, endpoints.lotes);
              } else if (meta && meta.scope === "LOTE") {
                await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
                  idLote: meta.loteSel,
                  delta: meta.delta,
                  motivo: meta.motivo
                }, `${endpoints.lotes}/ajuste`);
              } else {
                await api.fetchApi({ "Content-Type": "application/json" }, "PUT", { existencia: p.stock }, `${endpoints.inventario}/${p.id}`);
              }

              toast.current?.show({ severity: "success", summary: "Inventario", detail: "Ajuste aplicado exitosamente", life: 1400 });
              handleRefresh();
            } catch (e) {
              console.error("Error en ajuste de stock:", e);
              toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo aplicar el ajuste de stock", life: 2000 });
            } finally {
              setLoading(false);
            }
          };

          const handleConfigurarUmbrales = async (p) => {
            try {
              setLoading(true);
              await api.fetchApi({ "Content-Type": "application/json" }, "POST", {
                idProducto: p.idProducto,
                critico: p.umbrales.critico,
                bajo: p.umbrales.bajo
              }, endpoints.configurarUmbrales);

              toast.current?.show({ severity: "success", summary: "Alertas", detail: "Umbrales configurados exitosamente", life: 1400 });
              handleRefresh();
            } catch (e) {
              console.error("Error al configurar umbrales:", e);
              toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudieron configurar los umbrales", life: 2000 });
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
            if (!row.imagen) return <i className="pi pi-image inv-thumb-placeholder" style={{fontSize: '2rem', color: '#94a3b8'}}/>;
            const src = row.imagen.startsWith("data:") || row.imagen.startsWith("http") ? row.imagen : `data:image/png;base64,${row.imagen}`;
            return <img src={src} alt={row.nombre} className="inv-thumb" loading="lazy" />;
          };

          const stockBody = (row) => <span className="tabular stock-simple">{row.stock ?? 0}</span>;

          const accionesBody = (row) => (
            <div className="table-actions">
              <Button icon="pi pi-eye" className="inv-action-btn" tooltip="Más información" tooltipOptions={{ position: "top" }} onClick={() => setModalInfo({ open: true, producto: row })} />
              <Button icon="pi pi-pencil" className="inv-action-btn" tooltip="Editar producto" tooltipOptions={{ position: "top" }} onClick={() => setModalEditar({ open: true, producto: row })} />
              <Button icon="pi pi-sliders-h" className="inv-action-btn" tooltip="Alertas de stock" tooltipOptions={{ position: "top" }} onClick={() => setModalAlertas({ open: true, producto: row })} />
              <Button icon="pi pi-sync" className="inv-action-btn" tooltip="Ajustar stock" tooltipOptions={{ position: "top" }} onClick={() => setModalAjuste({ open: true, producto: row })} />
              <Button icon="pi pi-trash" className="inv-action-btn danger" tooltip="Eliminar producto" tooltipOptions={{ position: "top" }} onClick={() => setModalEliminar({ open: true, producto: row })} />
            </div>
          );
          const rowExpansionTemplate = (data) => (
            <div className="p-3">
              <DataTable value={data.lotes} size="small" className="inv-lotes-table" responsive>
                <Column field="id" header="Lote" />
                <Column field="cantidad" header="Cantidad" body={(l) => <span className="tabular">{l.cantidad}</span>} />
                <Column header="Costo Compra" body={() => <span className="tabular">${Number(data.precioCompra || 0).toFixed(2)}</span>} />
                <Column field="fechaExp" header="Caducidad" body={(l) => {
                    if (!l.fechaExp) return "—";
                    const d = new Date(l.fechaExp);
                    return <span>{d.toLocaleDateString("es-MX", { dateStyle: "medium" })}</span>;
                }} />
                
                {/* AQUÍ ESTÁ TU UBICACIÓN DENTRO DEL DESGLOSE */}
                <Column field="ubicacion" header="Ubicación" />
                
                <Column header="Actualizado" body={() => <span>{data.updatedAt.toLocaleDateString("es-MX", { dateStyle: "short" })}</span>} />
              </DataTable>
            </div>
          );

          return (
            <Shell>
              <div className="inv-page">
                <Toast ref={toast} className="inv-toast" />
                <ConfirmDialog />

                {/* 1. HEADER ESTILO REPORTES */}
                <div className="inv-header-bar">
                    <div className="inv-header-title">
                        <i className="pi pi-box" /> INVENTARIO GLOBAL
                    </div>

                      {/* 2. KPIS ORIGINALES */}
                  <InventarioHeader rows={rows} getStockEstado={getStockEstado} />
                </div>

              

                {/* 3. TOOLBAR Y BUSCADOR MEJORADO (LIQUID GLASS) */}
                <div className="inv-toolbar-glass">
                    <span className="p-input-icon-left inv-search-wrapper">
                        <i className="pi pi-search" />
                        <InputText 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Buscar por nombre, SKU, categoría o proveedor..." 
                            className="inv-search-input"
                        />
                    </span>
                    
                    <div className="inv-toolbar-actions">
                        <Button 
                            icon="pi pi-filter" 
                            label="Filtros" 
                            className="inv-btn inv-btn--ghost" 
                            onClick={() => setFilterOpen(true)} 
                        />
                        <Button 
                            icon="pi pi-sync" 
                            className="inv-btn inv-btn--ghost inv-icon-btn" 
                            onClick={handleRefresh} 
                            tooltip="Actualizar Lista"
                            tooltipOptions={{ position: "top" }}
                        />
                        <Button 
                            icon="pi pi-plus" 
                            label="Nuevo Producto" 
                            className="inv-btn inv-btn--primary" 
                            onClick={() => setModalAgregar(true)} 
                        />
                    </div>
                </div>

                <InventarioToolbarFilter
                  visible={filterOpen}
                  onHide={() => setFilterOpen(false)}
                  onApply={(f) => {
                    const newFilters = f || {};
                    setFilters(newFilters);
                    setFilterOpen(false);
                    setFirst(0);
                    fetchProductos({ filtros: newFilters, page: 0, size: rowsPerPage });
                  }}
                  initialFilters={filters}
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
                rows={rowsPerPage}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
                className="inv-table p-datatable-sm"
                scrollable
                scrollHeight="calc(100vh - 380px)"
                emptyMessage="No se encontraron productos en el inventario."
            >
                <Column expander style={{ width: '3em' }} className="inv-col inv-col--expander" />
                <Column header="Imagen" body={imagenBody} className="inv-col inv-col--imagen" />
                <Column field="nombre" header="Nombre" sortable className="inv-col inv-col--nombre text-truncate" body={(row) => <span title={row.nombre}>{row.nombre}</span>} />
                <Column field="sku" header="SKU" className="inv-col inv-col--sku" />
                <Column field="proveedor" header="Proveedor" sortable className="inv-col inv-col--proveedor text-truncate" body={(row) => <span title={row.proveedor}>{row.proveedor}</span>} />
                <Column field="stock" header="Stock" sortable className="inv-col inv-col--stock" body={stockBody} />
                <Column field="estadoStock" header="Estado" sortable body={(row) => {
                    const estado = getStockEstado(row);
                    const severity = estado === "OPTIMO" ? "success" : estado === "BAJO" ? "info" : "danger";
                    return <Tag value={estado} severity={severity} rounded />;
                }} />
                <Column field="precioVenta" header="P. Venta" sortable body={(row) => (<span className="inv-price">${(Number(row.precioVenta) || 0).toFixed(2)}</span>)} />

                <Column header="Acciones" body={accionesBody} className="inv-col inv-col--acciones" frozen />
            </DataTable>
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