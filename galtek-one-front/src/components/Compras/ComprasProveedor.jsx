import React, { useState, useEffect, useMemo } from "react";
import Shell from "../common/Shell";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import "../../style/components/Compras/ComprasProveedor.css";
import useInventarioSugerencias from "../../Hooks/UseInventarioSugerencias";
import { useNavigate } from "react-router-dom";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

const getPayloadData = async (response) => {
  if (!response?.ok) return [];
  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
};

const providerName = (compra) =>
  compra?.idProveedor?.nombreProveedor ||
  compra?.idProveedor?.nombre ||
  compra?.IdProveedor?.nombreProveedor ||
  compra?.proveedor?.nombreProveedor ||
  "Sin proveedor";

const providerId = (compra) =>
  compra?.idProveedor?.idProveedor ||
  compra?.IdProveedor?.idProveedor ||
  compra?.proveedor?.idProveedor ||
  providerName(compra);

const compraId = (compra) => compra?.idCompra || compra?.compra?.idCompra;

const asDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const mapDetalle = (row) => ({
  idCompra: row?.compra?.idCompra,
  nombre: row?.producto?.nombreProducto || row?.producto?.nombre || "Producto sin nombre",
  cantidad: Number(row?.cantidad) || 0,
  precioUnitario: Number(row?.precioUnitario) || 0,
});

export default function ComprasProveedor() {
  const [proveedores, setProveedores] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [visible, setVisible] = useState(false);
  const [proveedorFiltro, setProveedorFiltro] = useState("Todos");
  const { productos: sugerencias, getStockColor } = useInventarioSugerencias();
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;
    const api = new APIfetchApi();

    async function cargarProveedores() {
      try {
        const [comprasResponse, detallesResponse] = await Promise.all([
          api.fetchApi({}, "GET", undefined, endpoints.compras),
          api.fetchApi({}, "GET", undefined, endpoints.compraDetalle),
        ]);

        const compras = await getPayloadData(comprasResponse);
        const detalles = (await getPayloadData(detallesResponse)).map(mapDetalle);
        const detallesPorCompra = new Map();

        detalles.forEach((detalle) => {
          if (!detallesPorCompra.has(detalle.idCompra)) detallesPorCompra.set(detalle.idCompra, []);
          detallesPorCompra.get(detalle.idCompra).push(detalle);
        });

        const agrupados = new Map();
        compras.forEach((compra) => {
          const key = providerId(compra);
          const nombre = providerName(compra);
          const fecha = asDate(compra?.fechaCompra || compra?.fechaCreacion);
          const items = detallesPorCompra.get(compraId(compra)) || [];
          const total = Number(compra?.totalCompra) || 0;

          if (!agrupados.has(key)) {
            agrupados.set(key, {
              id: key,
              nombre,
              productos: 0,
              total: 0,
              fecha: null,
              fechaTexto: "Sin compras",
              items: [],
            });
          }

          const row = agrupados.get(key);
          row.productos += items.length;
          row.total += total;
          row.items.push(...items);

          if (fecha && (!row.fecha || fecha > row.fecha)) {
            row.fecha = fecha;
            row.fechaTexto = fecha.toLocaleDateString("es-MX");
          }
        });

        const data = Array.from(agrupados.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
        if (activo) setProveedores(data);
      } catch (error) {
        console.error("Error al cargar compras por proveedor:", error);
        if (activo) setProveedores([]);
      }
    }

    cargarProveedores();
    return () => {
      activo = false;
    };
  }, []);

  const proveedoresUnicos = useMemo(() => {
    const set = new Set([
      ...proveedores.map((p) => p.nombre).filter(Boolean),
      ...sugerencias.map((s) => s.proveedor).filter(Boolean),
    ]);
    return ["Todos", ...Array.from(set).sort()];
  }, [proveedores, sugerencias]);

  const sugerenciasFiltradas = useMemo(() => {
    if (proveedorFiltro === "Todos") return sugerencias;
    return sugerencias.filter((s) => s.proveedor === proveedorFiltro);
  }, [sugerencias, proveedorFiltro]);

  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  const abrirDetalle = (proveedor) => {
    setSelectedProveedor(proveedor);
    setVisible(true);
  };

  const detalleTemplate = (rowData) => (
    <Button
      label="Ver Detalle"
      icon="pi pi-search"
      className="btn-verde"
      onClick={() => abrirDetalle(rowData)}
    />
  );

  return (
    <Shell>
      <div className="compras-prov-wrapper">
        <div className="compras-prov-header">
          <Button
            icon="pi pi-arrow-left"
            className="btn-verde regresar-btn"
            onClick={() => navigate("/compras")}
          />
          <h1>Por Proveedor</h1>
        </div>

        <div className="compras-prov-content">
          <div className="compras-prov-table">
            <div className="compras-prov-search">
              <span className="p-input-icon-right">
                <InputText
                  placeholder="Buscar"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <i className="pi pi-search" />
              </span>
            </div>

            <DataTable
              value={proveedores}
              paginator
              rows={5}
              stripedRows
              responsiveLayout="scroll"
              globalFilter={globalFilter}
              emptyMessage="Sin compras por proveedor"
            >
              <Column field="nombre" header="Proveedor" sortable />
              <Column field="productos" header="No. Productos" sortable />
              <Column field="total" header="Total Compra" body={(r) => money(r.total)} />
              <Column field="fechaTexto" header="Ultima Compra" sortable />
              <Column body={detalleTemplate} header="Accion" />
            </DataTable>
          </div>

          <div className="compras-sugerencia">
            <h3>Sugerencia de compra</h3>
            <div className="sugerencia-panel">
              <div className="sugerencia-header">
                <span>Proveedor</span>
                <select value={proveedorFiltro} onChange={(e) => setProveedorFiltro(e.target.value)}>
                  {proveedoresUnicos.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <table className="sugerencia-tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {sugerenciasFiltradas.map((sug, i) => (
                    <tr key={`${sug.producto}-${i}`}>
                      <td>
                        <div className="stock-indicador">
                          <span className={`circulo ${getStockColor(sug.stock)}`}></span>
                          <div>
                            <span>{sug.producto}</span>
                            <div className="proveedor">{sug.proveedor}</div>
                          </div>
                        </div>
                      </td>
                      <td>{sug.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Dialog
          header="Detalle del Proveedor"
          visible={visible}
          onHide={() => setVisible(false)}
          style={{ width: "45vw" }}
          dismissableMask
        >
          {selectedProveedor ? (
            <div className="proveedor-detalle">
              <h3>{selectedProveedor.nombre}</h3>
              <p><b>Fecha ultima compra:</b> {selectedProveedor.fechaTexto}</p>
              <p><b>Total acumulado:</b> {money(selectedProveedor.total)}</p>
              <hr />
              <table className="detalle-tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio U.</th>
                    <th>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProveedor.items.length > 0 ? (
                    selectedProveedor.items.map((it, i) => (
                      <tr key={`${it.nombre}-${i}`}>
                        <td>{it.nombre}</td>
                        <td>{it.cantidad}</td>
                        <td>{money(it.precioUnitario)}</td>
                        <td>{money(it.cantidad * it.precioUnitario)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>Sin detalle de productos capturado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No se encontro informacion del proveedor.</p>
          )}
        </Dialog>
      </div>
    </Shell>
  );
}
