import React, { useState, useEffect, useMemo } from "react";
import Shell from "../common/Shell";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import "../../style/components/Compras/ComprasTicket.css";
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

const providerName = (compra) =>
  compra?.idProveedor?.nombreProveedor ||
  compra?.idProveedor?.nombre ||
  compra?.IdProveedor?.nombreProveedor ||
  compra?.proveedor?.nombreProveedor ||
  "Sin proveedor";

const mapDetalle = (row) => ({
  idCompra: row?.compra?.idCompra,
  nombre: row?.producto?.nombreProducto || row?.producto?.nombre || "Producto sin nombre",
  cantidad: Number(row?.cantidad) || 0,
  precioUnitario: Number(row?.precioUnitario) || 0,
});

export default function ComprasTicket() {
  const [tickets, setTickets] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [visible, setVisible] = useState(false);
  const [proveedorFiltro, setProveedorFiltro] = useState("Todos");
  const { productos: sugerencias, getStockColor } = useInventarioSugerencias();
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;
    const api = new APIfetchApi();

    async function cargarTickets() {
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

        const data = compras
          .map((compra) => {
            const fecha = asDate(compra?.fechaCompra || compra?.fechaCreacion);
            const items = detallesPorCompra.get(compra?.idCompra) || [];
            return {
              id: compra?.idCompra,
              ticketId: compra?.idCompra ? `CP-${compra.idCompra}` : "Sin ticket",
              productos: items.length,
              total: Number(compra?.totalCompra) || 0,
              fecha,
              fechaTexto: fecha ? fecha.toLocaleDateString("es-MX") : "Sin fecha",
              proveedor: providerName(compra),
              items,
            };
          })
          .sort((a, b) => (b.fecha?.getTime() || 0) - (a.fecha?.getTime() || 0));

        if (activo) setTickets(data);
      } catch (error) {
        console.error("Error al cargar compras por ticket:", error);
        if (activo) setTickets([]);
      }
    }

    cargarTickets();
    return () => {
      activo = false;
    };
  }, []);

  const proveedoresUnicos = useMemo(() => {
    const set = new Set([
      ...tickets.map((c) => c.proveedor).filter(Boolean),
      ...sugerencias.map((s) => s.proveedor).filter(Boolean),
    ]);
    return ["Todos", ...Array.from(set).sort()];
  }, [tickets, sugerencias]);

  const sugerenciasFiltradas = useMemo(() => {
    if (proveedorFiltro === "Todos") return sugerencias;
    return sugerencias.filter((s) => s.proveedor === proveedorFiltro);
  }, [sugerencias, proveedorFiltro]);

  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  const abrirDetalle = (ticket) => {
    setSelectedTicket(ticket);
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
      <div className="compras-prod-wrapper">
        <div className="compras-prod-header">
          <Button
            icon="pi pi-arrow-left"
            className="btn-verde regresar-btn"
            onClick={() => navigate("/compras")}
          />
          <h1>Por Ticket</h1>
        </div>

        <div className="compras-content">
          <div className="compras-table-section">
            <div className="compras-search">
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
              value={tickets}
              paginator
              rows={5}
              stripedRows
              responsiveLayout="scroll"
              globalFilter={globalFilter}
              emptyMessage="Sin compras registradas"
            >
              <Column field="ticketId" header="Ticket ID" sortable />
              <Column field="productos" header="No. Productos" sortable />
              <Column field="total" header="Total Compra" body={(r) => money(r.total)} />
              <Column field="fechaTexto" header="Fecha" sortable />
              <Column field="proveedor" header="Proveedor" sortable />
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
          header="Detalle del Ticket"
          visible={visible}
          onHide={() => setVisible(false)}
          style={{ width: "45vw" }}
          dismissableMask
        >
          {selectedTicket ? (
            <div className="pedido-panel">
              <h3>{selectedTicket.ticketId}</h3>
              <p><b>Proveedor:</b> {selectedTicket.proveedor}</p>
              <p><b>Fecha:</b> {selectedTicket.fechaTexto}</p>
              <hr />
              <table className="sugerencia-tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio U.</th>
                    <th>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTicket.items.length > 0 ? (
                    selectedTicket.items.map((it, i) => (
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
            <p>No se encontro informacion del ticket.</p>
          )}
        </Dialog>
      </div>
    </Shell>
  );
}
