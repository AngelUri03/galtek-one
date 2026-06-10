import React, { useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import Shell from "../common/Shell";
import "../../style/components/Compras/ComprasProducto.css";
import useInventarioSugerencias from "../../Hooks/UseInventarioSugerencias";
import { useNavigate } from "react-router-dom";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

const getPayloadData = async (response) => {
  if (!response?.ok) return [];
  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
};

const asDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const productName = (row) =>
  row?.producto?.nombreProducto || row?.producto?.nombre || "Producto sin nombre";

const providerName = (row) =>
  row?.compra?.idProveedor?.nombreProveedor ||
  row?.compra?.idProveedor?.nombre ||
  row?.compra?.IdProveedor?.nombreProveedor ||
  row?.compra?.proveedor?.nombreProveedor ||
  "Sin proveedor";

const mapDetalle = (row) => {
  const cantidad = Number(row?.cantidad) || 0;
  const precio = Number(row?.precioUnitario) || 0;
  const fecha = asDate(row?.compra?.fechaCompra || row?.fechaCreacion);

  return {
    id: row?.idCompraDetalle,
    ticketId: row?.compra?.idCompra ? `CP-${row.compra.idCompra}` : "Sin ticket",
    producto: productName(row),
    cantidad,
    precio,
    fecha,
    fechaTexto: fecha ? fecha.toLocaleDateString("es-MX") : "Sin fecha",
    proveedor: providerName(row),
    importe: Number(row?.subtotal) || cantidad * precio,
  };
};

export default function ComprasProducto() {
  const [compras, setCompras] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [proveedorFiltro, setProveedorFiltro] = useState("Todos");
  const [visible, setVisible] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const navigate = useNavigate();
  const { productos: sugerencias, getStockColor } = useInventarioSugerencias();

  useEffect(() => {
    let activo = true;
    const api = new APIfetchApi();

    async function cargarCompras() {
      try {
        const response = await api.fetchApi({}, "GET", undefined, endpoints.compraDetalle);
        const data = (await getPayloadData(response)).map(mapDetalle);
        if (activo) setCompras(data);
      } catch (error) {
        console.error("Error al cargar compras por producto:", error);
        if (activo) setCompras([]);
      }
    }

    cargarCompras();
    return () => {
      activo = false;
    };
  }, []);

  const proveedoresUnicos = useMemo(() => {
    const set = new Set([
      ...compras.map((c) => c.proveedor).filter(Boolean),
      ...sugerencias.map((s) => s.proveedor).filter(Boolean),
    ]);
    return ["Todos", ...Array.from(set).sort()];
  }, [compras, sugerencias]);

  const sugerenciasFiltradas = useMemo(() => {
    if (proveedorFiltro === "Todos") return sugerencias;
    return sugerencias.filter((s) => s.proveedor === proveedorFiltro);
  }, [sugerencias, proveedorFiltro]);

  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  const abrirDetalle = (producto) => {
    setSelectedProducto(producto);
    setVisible(true);
  };

  const accionTemplate = (rowData) => (
    <Button
      label="Ver Detalle"
      icon="pi pi-search"
      className="btn-verde"
      size="small"
      onClick={() => abrirDetalle(rowData)}
    />
  );

  return (
    <Shell>
      <div className="compras-prod-wrapper">
        <div className="compras-prod-header">
          <Button
            icon="pi pi-arrow-left"
            className="btn-verde regresar-btn"
            onClick={() => navigate("/compras")}
          />
          <h1>Por producto</h1>
        </div>

        <div className="compras-content">
          <div className="compras-table-section">
            <div className="compras-search">
              <span className="p-input-icon-right">
                <i className="pi pi-search" />
                <InputText
                  placeholder="Buscar"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </span>
            </div>

            <DataTable
              value={compras}
              stripedRows
              paginator
              rows={8}
              globalFilter={globalFilter}
              emptyMessage="Sin compras registradas"
            >
              <Column field="producto" header="Producto" sortable />
              <Column field="cantidad" header="Cantidad" sortable />
              <Column field="precio" header="Precio U." body={(row) => money(row.precio)} sortable />
              <Column field="fechaTexto" header="Fecha" sortable />
              <Column field="proveedor" header="Proveedor" sortable />
              <Column body={accionTemplate} header="Accion" />
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
          header="Detalle del Producto"
          visible={visible}
          onHide={() => setVisible(false)}
          style={{ width: "45vw" }}
          dismissableMask
        >
          {selectedProducto ? (
            <div className="pedido-panel">
              <h3>{selectedProducto.producto}</h3>
              <p><b>Proveedor:</b> {selectedProducto.proveedor}</p>
              <p><b>Fecha:</b> {selectedProducto.fechaTexto}</p>
              <hr />
              <table className="sugerencia-tabla">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Cantidad</th>
                    <th>Precio U.</th>
                    <th>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{selectedProducto.ticketId}</td>
                    <td>{selectedProducto.cantidad}</td>
                    <td>{money(selectedProducto.precio)}</td>
                    <td>{money(selectedProducto.importe)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p>No se encontro informacion del producto.</p>
          )}
        </Dialog>
      </div>
    </Shell>
  );
}
