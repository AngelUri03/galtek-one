import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";
import "../../style/components/Compras/HistorialCompras.css";

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
  importe: (Number(row?.cantidad) || 0) * (Number(row?.precioUnitario) || 0)
});

export default function HistorialCompras() {
  const [historial, setHistorial] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    const api = new APIfetchApi();

    async function cargarHistorial() {
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

        if (activo) {
          setHistorial(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error al cargar el historial:", error);
        if (activo) setLoading(false);
      }
    }

    cargarHistorial();
    return () => { activo = false; };
  }, []);

  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  const abrirDetalle = (ticket) => {
    setSelectedTicket(ticket);
    setVisible(true);
  };

  const detalleTemplate = (rowData) => (
    <Button
      label="Ver Detalle"
      icon="pi pi-search"
      className="btn-verde p-button-sm"
      onClick={() => abrirDetalle(rowData)}
    />
  );

  return (
    <div className="historial-wrapper">
      <div className="historial-card">
        <div className="historial-header">
          <h2>Registro General de Compras</h2>
          <span className="p-input-icon-right buscador-historial">
            <i className="pi pi-search" />
            <InputText
              placeholder="Buscar por ticket, proveedor o fecha..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </span>
        </div>

        {/* AQUÍ APLICAMOS EL CONTENEDOR CON SCROLL */}
        <div className="hc-tabla-contenedor">
          <DataTable
            value={historial}
            paginator
            rows={10}
            stripedRows
            responsiveLayout="scroll"
            globalFilter={globalFilter}
            emptyMessage="No se encontraron compras registradas."
            loading={loading}
            className="tabla-historial"
          >
            <Column field="ticketId" header="Ticket ID" sortable />
            <Column field="fechaTexto" header="Fecha" sortable />
            <Column field="proveedor" header="Proveedor" sortable />
            <Column field="productos" header="No. Productos" sortable align="center" />
            <Column field="total" header="Total Compra" body={(r) => money(r.total)} sortable />
            <Column body={detalleTemplate} header="Acciones" align="center" />
          </DataTable>
        </div>
      </div>

      <Dialog
        header="Detalle del Ticket"
        visible={visible}
        onHide={() => setVisible(false)}
        style={{ width: "50vw" }}
        breakpoints={{ '960px': '75vw', '641px': '100vw' }}
        dismissableMask
      >
        {selectedTicket ? (
          <div className="ticket-detalle-modal">
            <div className="ticket-info-grid">
              <div>
                <p className="ticket-label">Ticket ID</p>
                <p className="ticket-value">{selectedTicket.ticketId}</p>
              </div>
              <div>
                <p className="ticket-label">Proveedor</p>
                <p className="ticket-value">{selectedTicket.proveedor}</p>
              </div>
              <div>
                <p className="ticket-label">Fecha</p>
                <p className="ticket-value">{selectedTicket.fechaTexto}</p>
              </div>
            </div>
            
            <hr className="divider" />
            
            <DataTable value={selectedTicket.items} responsiveLayout="scroll" stripedRows size="small">
              <Column field="nombre" header="Producto" />
              <Column field="cantidad" header="Cantidad" align="center" />
              <Column field="precioUnitario" header="Precio U." body={(r) => money(r.precioUnitario)} />
              <Column field="importe" header="Importe" body={(r) => money(r.importe)} />
            </DataTable>
            
            <div className="ticket-total-modal">
              <span>Total de la compra:</span>
              <span className="total-monto">{money(selectedTicket.total)}</span>
            </div>
          </div>
        ) : (
          <p>No se encontró información del ticket.</p>
        )}
      </Dialog>
    </div>
  );
}