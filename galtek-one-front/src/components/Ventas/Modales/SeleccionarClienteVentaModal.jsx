import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import ClienteEditorPanel from "../../Clientes/ClienteEditorPanel";
import {
  hasFiscalData,
  normalizeCliente,
  searchableText,
} from "../../Clientes/clientesUtils";
import "../../../style/components/Clientes/Clientes.css";
import "../../../style/components/Ventas/SeleccionarClienteVentaModal.css";

const money = (value) =>
  (Number(value) || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getClienteId = (cliente) => cliente?.idCliente ?? cliente?.id ?? null;

const isActiveCliente = (cliente) =>
  String(cliente?.estadoCliente || "ACTIVO").toUpperCase() === "ACTIVO";

const formatCantidad = (value) => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0";
  return Number.isInteger(number) ? String(number) : number.toFixed(3);
};

function ClienteCard({ cliente, active, onSelect, disabled }) {
  const fiscal = hasFiscalData(cliente);
  const estado = String(cliente.estadoCliente || "ACTIVO").toUpperCase();
  const initial = (cliente.nombre || "C").charAt(0).toUpperCase();
  const contact =
    cliente.telefono ||
    cliente.whatsapp ||
    cliente.email ||
    cliente.rfc ||
    "Sin contacto";

  return (
    <button
      type="button"
      className={"cliente-venta-result" + (active ? " is-active" : "")}
      onClick={() => onSelect(cliente)}
      disabled={disabled}
    >
      <span className="cliente-venta-avatar">{initial}</span>
      <span className="cliente-venta-result-main">
        <strong>{cliente.nombre || "Cliente sin nombre"}</strong>
        <small>{contact}</small>
      </span>
      <span className="cliente-venta-result-tags">
        {fiscal ? <span className="cliente-venta-fiscal-pill">Fiscal</span> : null}
        {estado !== "ACTIVO" ? (
          <span className="cliente-venta-state-pill">{estado.toLowerCase()}</span>
        ) : null}
      </span>
      <span className="cliente-venta-result-action">
        {active ? "Listo" : "Usar"}
      </span>
    </button>
  );
}

export default function SeleccionarClienteVentaModal({
  visible,
  onHide,
  total = 0,
  carrito = [],
  clientes = [],
  loading = false,
  saving = false,
  error = "",
  selectedCliente = null,
  onRefreshClientes,
  onCreateCliente,
  onContinue,
}) {
  const [step, setStep] = useState("choice");
  const [search, setSearch] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!visible) return;

    setStep(selectedCliente ? "client" : "choice");
    setSearch("");
    const normalizado = selectedCliente ? normalizeCliente(selectedCliente) : null;
    setClienteSeleccionado(normalizado && isActiveCliente(normalizado) ? normalizado : null);
    setEditorVisible(false);
  }, [selectedCliente, visible]);

  useEffect(() => {
    if (!visible || step !== "client") return;

    const id = window.setTimeout(() => {
      searchRef.current?.focus?.();
    }, 80);

    return () => window.clearTimeout(id);
  }, [step, visible]);

  const clientesNormalizados = useMemo(
    () =>
      clientes
        .map((cliente) => normalizeCliente(cliente))
        .filter(isActiveCliente),
    [clientes]
  );

  const clientesFiltrados = useMemo(() => {
    const q = normalize(search);
    return q
      ? clientesNormalizados.filter((cliente) =>
          normalize(searchableText(cliente)).includes(q)
        )
      : clientesNormalizados;
  }, [clientesNormalizados, search]);

  const selectedId = getClienteId(clienteSeleccionado);
  const totalLineas = carrito.length;
  const totalUnidades = carrito.reduce(
    (acc, item) => acc + Number(item.cantidad || 0),
    0
  );

  const close = () => {
    if (saving) return;
    onHide?.();
  };

  const continuarRapido = () => {
    if (saving) return;
    onContinue?.(null);
  };

  const abrirCliente = () => {
    setStep("client");
    if (!loading) {
      onRefreshClientes?.();
    }
  };

  const continuarConCliente = () => {
    if (!clienteSeleccionado || saving || !isActiveCliente(clienteSeleccionado)) return;
    onContinue?.(clienteSeleccionado);
  };

  const guardarCliente = async (payload) => {
    const cliente = await onCreateCliente?.(payload);
    const normalizado = normalizeCliente(cliente);
    setClienteSeleccionado(normalizado);
    setEditorVisible(false);
    onContinue?.(normalizado);
  };

  return (
    <>
      <Dialog
        header={null}
        visible={visible}
        onHide={close}
        modal
        draggable={false}
        dismissableMask
        className="cliente-venta-modal-dialog"
      >
        <div className="cliente-venta-flow">
          <header className="cliente-venta-topbar">
            <div>
              <span>Venta actual</span>
              <h2>
                {step === "choice"
                  ? "Elige el camino de cobro"
                  : "Cliente para esta venta"}
              </h2>
            </div>
            <div className="cliente-venta-stepper" aria-hidden="true">
              <span className="is-active">Cliente</span>
              <span>Pago</span>
            </div>
            <button
              type="button"
              className="cliente-venta-close"
              onClick={close}
              disabled={saving}
              aria-label="Cerrar"
            >
              <i className="pi pi-times" />
            </button>
          </header>

          <section className="cliente-venta-total">
            <div>
              <span>Total a cobrar</span>
              <strong>{money(total)}</strong>
            </div>
            <small>
              {totalLineas} linea{totalLineas === 1 ? "" : "s"} -{" "}
              {formatCantidad(totalUnidades)} unidades
            </small>
          </section>

          {step === "choice" ? (
            <section className="cliente-venta-choice">
              <button
                type="button"
                className="cliente-venta-choice-card is-primary"
                onClick={continuarRapido}
                disabled={saving}
              >
                <span className="cliente-venta-choice-icon">
                  <i className="pi pi-bolt" />
                </span>
                <span>
                  <strong>Continuar rapido</strong>
                  <small>Cobrar ahora, sin asociar cliente.</small>
                </span>
                <i className="pi pi-arrow-right" />
              </button>

              <button
                type="button"
                className="cliente-venta-choice-card"
                onClick={abrirCliente}
                disabled={saving}
              >
                <span className="cliente-venta-choice-icon">
                  <i className="pi pi-user-plus" />
                </span>
                <span>
                  <strong>Usar cliente</strong>
                  <small>Buscar o crear para historial y factura.</small>
                </span>
                <i className="pi pi-arrow-right" />
              </button>
            </section>
          ) : (
            <section className="cliente-venta-client-step">
              <div className="cliente-venta-client-head">
                <div>
                  <strong>Busqueda rapida</strong>
                  <small>
                    {loading
                      ? "Actualizando clientes..."
                      : `${clientesFiltrados.length} de ${clientesNormalizados.length} clientes`}
                  </small>
                </div>
              </div>

              <div className="cliente-venta-client-actions">
                <button
                  type="button"
                  className="cliente-venta-primary-action"
                  onClick={() => setEditorVisible(true)}
                  disabled={saving}
                >
                  <i className="pi pi-plus" />
                  <span>Crear cliente</span>
                </button>
                <div className="cliente-venta-action-group">
                  <button
                    type="button"
                    className="cliente-venta-soft-action"
                    onClick={onRefreshClientes}
                    disabled={saving || loading}
                  >
                    <i className={loading ? "pi pi-spin pi-spinner" : "pi pi-refresh"} />
                    <span>Actualizar</span>
                  </button>
                  <button
                    type="button"
                    className="cliente-venta-soft-action"
                    onClick={() => setStep("choice")}
                    disabled={saving}
                  >
                    <i className="pi pi-arrow-left" />
                    <span>Volver</span>
                  </button>
                </div>
              </div>

              <label className="cliente-venta-search">
                <i className="pi pi-search" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, telefono, correo o RFC"
                  disabled={saving}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Limpiar busqueda"
                    disabled={saving}
                  >
                    <i className="pi pi-times" />
                  </button>
                ) : null}
              </label>

              {error ? (
                <div className="cliente-venta-error" role="alert">
                  <i className="pi pi-exclamation-triangle" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="cliente-venta-results">
                {loading ? (
                  <div className="cliente-venta-empty">
                    <i className="pi pi-spin pi-spinner" />
                    <span>Cargando clientes...</span>
                  </div>
                ) : clientesFiltrados.length ? (
                  clientesFiltrados.map((cliente) => (
                    <ClienteCard
                      key={getClienteId(cliente) || cliente.nombre}
                      cliente={cliente}
                      active={
                        Boolean(selectedId) &&
                        String(getClienteId(cliente)) === String(selectedId)
                      }
                      onSelect={setClienteSeleccionado}
                      disabled={saving}
                    />
                  ))
                ) : (
                  <div className="cliente-venta-empty">
                    <i className="pi pi-search" />
                    <span>Sin resultados</span>
                    <button
                      type="button"
                      onClick={() => setEditorVisible(true)}
                      disabled={saving}
                    >
                      Crear cliente
                    </button>
                  </div>
                )}
              </div>

              <footer className="cliente-venta-footer">
                <button
                  type="button"
                  className="cliente-venta-soft-action"
                  onClick={continuarRapido}
                  disabled={saving}
                >
                  Cobrar sin cliente
                </button>
                <button
                  type="button"
                  className="cliente-venta-primary-action"
                  onClick={continuarConCliente}
                  disabled={!clienteSeleccionado || saving}
                >
                  <span>Continuar con cliente</span>
                  <i className="pi pi-arrow-right" />
                </button>
              </footer>
            </section>
          )}
        </div>
      </Dialog>

      <ClienteEditorPanel
        visible={editorVisible}
        mode="create"
        cliente={null}
        loading={false}
        saving={saving}
        onHide={() => setEditorVisible(false)}
        onSave={guardarCliente}
      />
    </>
  );
}
