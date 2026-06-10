import React, { useEffect, useState } from "react";
import Shell from "../common/Shell";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import "../../style/components/Clientes/Clientes.css";
import { useLocation, useNavigate } from "react-router-dom";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

const api = new APIfetchApi();

const normalizeCliente = (cliente) => ({
  ...cliente,
  id: cliente?.idCliente ?? cliente?.id,
  pedidos: Array.isArray(cliente?.pedidos) ? cliente.pedidos : [],
});

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pedidoVisible, setPedidoVisible] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  async function fetchClientes() {
    try {
      const response = await api.fetchApi({}, "GET", undefined, endpoints.clientes);
      if (!response?.ok) {
        setClientes([]);
        return;
      }

      const payload = await response.json();
      setClientes((payload?.data || []).map(normalizeCliente));
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      setClientes([]);
    }
  }

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    const actualizado = location.state?.actualizadoCliente;
    if (actualizado) {
      const normalized = normalizeCliente(actualizado);
      setClientes((prev) =>
        prev.map((c) => (String(c.id) === String(normalized.id) ? { ...c, ...normalized } : c))
      );
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const eliminarId = location.state?.eliminarClienteId;
    if (eliminarId) {
      setClientes((prev) => prev.filter((c) => String(c.id) !== String(eliminarId)));
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  const abrirModalPedidos = (cliente) => {
    const pedidos = [...(cliente?.pedidos || [])];
    pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const pedido = pedidos[0] || null;
    if (!pedido) return;
    setPedidoSeleccionado(pedido);
    setPedidoVisible(true);
  };

  const handleEliminarCliente = async (id) => {
    if (!window.confirm("Estas seguro de que deseas eliminar este cliente permanentemente?")) return;

    try {
      const response = await api.fetchApi({}, "DELETE", undefined, `${endpoints.clientes}/${id}`);
      if (response?.ok) {
        setClientes((prev) => prev.filter((c) => String(c.id) !== String(id)));
      }
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
    }
  };

  const pedidosTemplate = (rowData) => (
    <Button
      label="Mostrar"
      className="p-button-rounded p-button-sm btn-verde"
      onClick={() => abrirModalPedidos(rowData)}
      disabled={!rowData?.pedidos?.length}
      data-pr-tooltip="Ver pedido"
      tooltipOptions={{ position: "top" }}
    />
  );

  const accionesTemplate = (rowData) => (
    <div className="acciones-cell">
      <Tooltip />
      <Button
        icon="pi pi-check"
        className="p-button-rounded p-button-sm p-button-icon-only btn-seleccionar"
        onClick={() => navigate(`/clientes/${rowData.id}`, { state: { cliente: rowData } })}
        aria-label="Seleccionar"
        data-pr-tooltip="Seleccionar"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-sm p-button-secondary"
        onClick={() => navigate(`/clientes/${rowData.id}/editar`, { state: { cliente: rowData } })}
        aria-label="Editar"
        data-pr-tooltip="Editar"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-sm p-button-danger"
        onClick={() => handleEliminarCliente(rowData.id)}
        aria-label="Eliminar"
        data-pr-tooltip="Eliminar"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  const headerPedidos = (
    <div className="modal-header">
      <span>Pedidos Realizados</span>
    </div>
  );

  return (
    <Shell>
      <Tooltip />
      <div className="clientes-container">
        <div className="clientes-header">
          <div className="search-box">
            <span className="p-input-icon-left clientes-search">
              <i className="pi pi-search" />
              <InputText
                placeholder="Buscar un cliente"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </span>
          </div>

          <div className="acciones-header">
            <Button
              label="Agregar Cliente"
              icon="pi pi-plus"
              className="p-button-sm btn-verde"
              onClick={() => navigate("/clientes/crear")}
            />
          </div>
        </div>

        <div className="clientes-table">
          <DataTable
            value={clientes}
            paginator
            rows={5}
            stripedRows
            responsiveLayout="scroll"
            globalFilter={globalFilter}
            emptyMessage="Sin clientes registrados"
          >
            <Column field="nombre" header="NOMBRE" sortable />
            <Column field="email" header="CORREO" />
            <Column field="telefono" header="TELEFONO" />
            <Column field="pedidos" header="PEDIDOS" body={pedidosTemplate} />
            <Column body={accionesTemplate} header="ACCIONES" headerClassName="acciones-header-cell" />
          </DataTable>
        </div>
      </div>

      <Dialog
        header={headerPedidos}
        visible={pedidoVisible}
        onHide={() => setPedidoVisible(false)}
        dismissableMask
        modal
        blockScroll
        className="pedido-dialog"
        breakpoints={{ "960px": "70vw", "640px": "95vw" }}
        style={{ width: "45vw" }}
      >
        {pedidoSeleccionado && (
          <div className="pedido-panel">
            <div className="pedido-row pedido-row--top">
              <div className="pedido-cell">
                <span className="label">No. Orden:</span>
                <span className="value">{pedidoSeleccionado.noOrden}</span>
              </div>
              <div className="pedido-cell pedido-cell--right">
                <span className="label">Fecha:</span>
                <span className="value">{pedidoSeleccionado.fecha}</span>
              </div>
            </div>

            <div className="pedido-row">
              <div className="pedido-cell">
                <span className="label">Productos Totales:</span>
                <span className="value">{pedidoSeleccionado.productosTotales}</span>
              </div>
              <div className="pedido-cell pedido-cell--right">
                <span className="label">Importe total:</span>
                <span className="value">{money(pedidoSeleccionado.importeTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </Shell>
  );
}
