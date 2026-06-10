import { useLocation, useNavigate, useParams } from "react-router-dom";
import Shell from "../common/Shell";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import "../../style/components/Clientes/ClienteSeleccionado.css";
import { useState, useEffect, useMemo } from "react";
import useLockBodyScroll from "../../Hooks/UseLockBodyScroll";
import { APIfetchApi } from "../../API/APIfetch";
import { endpoints } from "../../API/api";

const api = new APIfetchApi();

const getClienteId = (cliente) => cliente?.idCliente ?? cliente?.id ?? null;

const normalizeCliente = (cliente) => {
  if (!cliente) return null;
  return {
    ...cliente,
    id: getClienteId(cliente),
    pedidos: Array.isArray(cliente.pedidos) ? cliente.pedidos : [],
  };
};

export default function ClienteSeleccionado() {
  useLockBodyScroll(true);
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState(normalizeCliente(state?.cliente));
  const [loading, setLoading] = useState(!state?.cliente);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  useEffect(() => {
    let activo = true;

    async function obtenerCliente() {
      setLoading(true);
      try {
        const response = await api.fetchApi({}, "GET", undefined, `${endpoints.clientes}/${id}`);
        if (!response?.ok) {
          if (activo) setCliente(null);
          return;
        }

        const payload = await response.json();
        if (activo) setCliente(normalizeCliente(payload?.data || payload));
      } catch (error) {
        console.error("Error al obtener el cliente:", error);
        if (activo) setCliente(null);
      } finally {
        if (activo) setLoading(false);
      }
    }

    obtenerCliente();
    return () => {
      activo = false;
    };
  }, [id]);

  const ultimoPedido = useMemo(() => {
    const pedidos = [...(cliente?.pedidos || [])];
    pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return pedidos[0] || null;
  }, [cliente]);

  const abrirDetallePedido = () => {
    if (!ultimoPedido) return;
    setPedidoDetalle(ultimoPedido);
    setDetalleVisible(true);
  };

  if (loading) {
    return (
      <Shell>
        <p>Cargando cliente...</p>
      </Shell>
    );
  }

  if (!cliente) {
    return (
      <Shell>
        <div className="cliente-sel-wrapper">
          <h1 className="cliente-sel-title">Clientes</h1>
          <p>No se encontro el cliente en la base de datos.</p>
          <Button label="Volver" className="btn-gris" onClick={() => navigate("/clientes")} />
        </div>
      </Shell>
    );
  }

  const handleEliminar = (clienteId) => {
    navigate("/clientes", { state: { eliminarClienteId: clienteId } });
  };

  return (
    <Shell>
      <div className="cliente-sel-wrapper">
        <h1 className="cliente-sel-title">
          Cliente Seleccionado: <span>{cliente.nombre}</span>
        </h1>

        <div className="cliente-sel-card">
          <button className="close-btn" onClick={() => navigate("/clientes")} aria-label="Cerrar">
            <i className="pi pi-times"></i>
          </button>

          <div className="cliente-sel-avatar">
            {cliente.avatar ? (
              <img
                src={cliente.avatar}
                alt="avatar"
                style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <i className="pi pi-user" />
            )}
          </div>

          <div className="cliente-sel-pill">{cliente.nombre || "Sin nombre"}</div>
          <div className="cliente-sel-pill">{cliente.email || "Sin correo"}</div>
          <div className="cliente-sel-pill">{cliente.telefono || "Sin telefono"}</div>
          <div className="cliente-sel-pill">{cliente.direccion || "Sin direccion"}</div>

          <div className="cliente-sel-actions">
            <Button
              label="Editar"
              icon="pi pi-pencil"
              className="btn-verde"
              onClick={() => navigate(`/clientes/${cliente.id}/editar`, { state: { cliente } })}
            />
            <Button
              label="Eliminar"
              icon="pi pi-trash"
              className="btn-verde"
              onClick={() => handleEliminar(cliente.id)}
            />
            <Button
              label="Ver Pedido"
              icon="pi pi-shopping-bag"
              className="btn-verde"
              disabled={!ultimoPedido}
              onClick={abrirDetallePedido}
            />
          </div>
        </div>
      </div>

      <Dialog
        visible={detalleVisible}
        onHide={() => setDetalleVisible(false)}
        header={<div className="pd-header-title">Pedido realizado</div>}
        dismissableMask
        modal
        blockScroll
        className="pedido-detalle-dialog"
        breakpoints={{ "960px": "70vw", "640px": "95vw" }}
        style={{ width: "45vw" }}
      >
        {pedidoDetalle && (
          <div className="pd-wrap">
            <div className="pd-bar">
              <div>No. Orden: <strong>{pedidoDetalle.noOrden}</strong></div>
              <div>Fecha: <strong>{pedidoDetalle.fecha}</strong></div>
            </div>

            <div className="pedido-panel">
              <div className="pedido-row">
                <div className="pedido-cell">
                  <span className="label">Productos Totales:</span>
                  <span className="value">{pedidoDetalle.productosTotales}</span>
                </div>
                <div className="pedido-cell pedido-cell--right">
                  <span className="label">Importe total:</span>
                  <span className="value">{money(pedidoDetalle.importeTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </Shell>
  );
}
