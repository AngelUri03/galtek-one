import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollPanel } from "primereact/scrollpanel";
import { InputText } from "primereact/inputtext";
import {
  Box,
  CreditCard,
  Minus,
  Plus,
  ReceiptText,
  Scale,
  Trash2,
  X,
} from "lucide-react";
import "../../style/components/Ventas/VentasCarrito.css";

const money = (value) => `$${(Number(value) || 0).toFixed(2)}`;

const moneyParts = (value) => {
  const amount = Number(value) || 0;
  const fixed = Math.abs(amount).toFixed(2);
  const [whole, cents] = fixed.split(".");

  return {
    whole: `${amount < 0 ? "-" : ""}$${Number(whole).toLocaleString("es-MX")}`,
    cents,
  };
};

const formatCantidad = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(3);
};

export default function VentasCarrito({
  carrito = [],
  onAumentarProducto,
  onDisminuirProducto,
  onEliminarProducto,
  onVaciarCarrito,
  onConfirmarPago,
  onConfirmPesaje,
}) {
  const total = useMemo(
    () =>
      carrito.reduce(
        (acc, item) => acc + (item.precio || 0) * (item.cantidad || 0),
        0
      ),
    [carrito]
  );
  const totalParts = useMemo(() => moneyParts(total), [total]);
  const totalDisplayLength = `${totalParts.whole}.${totalParts.cents}`.length;
  const totalDisplaySize =
    totalDisplayLength > 13
      ? " is-very-long"
      : totalDisplayLength > 10
      ? " is-long"
      : "";

  const totalUnidades = useMemo(
    () => carrito.reduce((acc, item) => acc + Number(item.cantidad || 0), 0),
    [carrito]
  );

  const hayProductos = carrito.length > 0;

  const esItemPesaje = (item) =>
    item?.esPesaje === true || item?.unidad === "kg";

  const [pesajeDraft, setPesajeDraft] = useState({});
  const [focusPesajeId, setFocusPesajeId] = useState(null);
  const pesajeInputRefs = useRef({});

  useEffect(() => {
    setPesajeDraft((prev) => {
      const next = { ...prev };
      const idsEnCarrito = new Set(carrito.map((i) => String(i.id)));

      Object.keys(next).forEach((id) => {
        if (!idsEnCarrito.has(String(id))) delete next[id];
      });

      carrito.forEach((item) => {
        if (!esItemPesaje(item)) return;
        const id = String(item.id);
        if (focusPesajeId === id) return;

        const v =
          item.cantidad === 0 || item.cantidad == null
            ? ""
            : String(item.cantidad);
        next[id] = v;
      });

      return next;
    });
  }, [carrito, focusPesajeId]);

  const normalizarNumero = (raw) => {
    const txt = (raw ?? "").toString().trim();
    if (!txt) return 0;

    const n = parseFloat(txt.replace(",", "."));
    if (Number.isNaN(n) || n <= 0) return 0;
    return n;
  };

  const handleChangePesajeCarrito = (id, value) => {
    const limpio = (value ?? "").replace(/[^\d.,]/g, "");
    setPesajeDraft((prev) => ({ ...prev, [String(id)]: limpio }));
  };

  const handleConfirmPesajeCarrito = (item) => {
    if (!onConfirmPesaje) return;
    const id = String(item.id);

    const cantidad = normalizarNumero(pesajeDraft[id]);
    onConfirmPesaje({ ...item, cantidad, modoPesaje: true });

    setPesajeDraft((prev) => ({
      ...prev,
      [id]: cantidad > 0 ? String(cantidad) : "",
    }));
  };

  const handleKeyDownPesajeCarrito = (e, item) => {
    const key = e.key;

    if (key === "Enter" || key === "NumpadEnter" || e.keyCode === 13) {
      e.preventDefault();
      handleConfirmPesajeCarrito(item);
      e.target?.blur?.();
      return;
    }

    const controlKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Home",
      "End",
    ];
    if (controlKeys.includes(key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (key >= "0" && key <= "9") return;
    if (key === "." || key === ",") return;

    e.preventDefault();
  };

  return (
    <aside className="carrito-section">
      <header className="carrito-header">
        <div className="carrito-header-left">
          <span className="carrito-kicker">
            <ReceiptText size={15} aria-hidden="true" />
            Ticket
          </span>
          <h2 className="carrito-title">Venta actual</h2>
          <span className="carrito-subtitle">
            {hayProductos
              ? `${carrito.length} linea${carrito.length > 1 ? "s" : ""} - ${formatCantidad(totalUnidades)} unidad${totalUnidades === 1 ? "" : "es"}`
              : "Listo para capturar"}
          </span>
        </div>

        {hayProductos && (
          <button
            type="button"
            className="carrito-btn-vaciar"
            onClick={onVaciarCarrito}
            title="Vaciar ticket"
            aria-label="Vaciar ticket"
          >
            <Trash2 size={15} aria-hidden="true" />
            <span>Vaciar</span>
          </button>
        )}
      </header>

      <div className="carrito-main">
        <ScrollPanel className="carrito-scroll">
          {!hayProductos ? (
            <div className="carrito-vacio">
              <ReceiptText size={34} aria-hidden="true" />
              <strong>Ticket sin productos</strong>
              <p>Agrega articulos desde el panel de venta.</p>
            </div>
          ) : (
            <div className="carrito-contenido">
              {carrito.map((item) => {
                const pesaje = esItemPesaje(item);
                const id = String(item.id);
                const importe = (item.precio || 0) * (item.cantidad || 0);

                return (
                  <div key={item.id} className="carrito-item">
                    <button
                      type="button"
                      className="carrito-btn-eliminar"
                      onClick={() => onEliminarProducto?.(item.id)}
                      title="Quitar producto"
                      aria-label={`Quitar ${item.nombre}`}
                    >
                      <X size={15} aria-hidden="true" />
                    </button>

                    <div className="carrito-thumb">
                      {item.img ? (
                        <img
                          src={item.img}
                          alt={item.nombre}
                          className="carrito-thumb-img"
                        />
                      ) : (
                        <Box size={18} aria-hidden="true" />
                      )}
                    </div>

                    <div className="carrito-info">
                      <strong className="carrito-nombre" title={item.nombre}>
                        {item.nombre}
                      </strong>

                      <span className="carrito-precio-unit">
                        {money(item.precio)}
                        <small>/ {item.unidad}</small>
                      </span>
                    </div>

                    <div className="carrito-item-right">
                      {pesaje ? (
                        <div
                          className="carrito-pesaje-control"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const el = pesajeInputRefs.current[String(id)];
                            el?.focus?.();
                            el?.select?.();
                          }}
                        >
                          <Scale size={14} className="carrito-pesaje-icon" aria-hidden="true" />

                          <InputText
                            ref={(el) => {
                              if (el) pesajeInputRefs.current[String(id)] = el;
                            }}
                            value={pesajeDraft[id] ?? ""}
                            onFocus={() => setFocusPesajeId(id)}
                            onChange={(e) =>
                              handleChangePesajeCarrito(id, e.target.value)
                            }
                            onKeyDown={(e) =>
                              handleKeyDownPesajeCarrito(e, item)
                            }
                            onBlur={() => {
                              setFocusPesajeId(null);
                              handleConfirmPesajeCarrito(item);
                            }}
                            className="carrito-pesaje-input"
                            placeholder="0.000"
                            inputMode="decimal"
                          />
                        </div>
                      ) : (
                        <div className="carrito-cantidad-control">
                          <button
                            type="button"
                            className="carrito-btn-cantidad"
                            onClick={() => onDisminuirProducto?.(item)}
                            aria-label={`Disminuir ${item.nombre}`}
                          >
                            <Minus size={14} aria-hidden="true" />
                          </button>

                          <span className="carrito-cantidad">
                            {formatCantidad(item.cantidad)}
                          </span>

                          <button
                            type="button"
                            className="carrito-btn-cantidad"
                            onClick={() => onAumentarProducto?.(item)}
                            aria-label={`Aumentar ${item.nombre}`}
                          >
                            <Plus size={14} aria-hidden="true" />
                          </button>
                        </div>
                      )}

                      <div className="carrito-total-item">
                        <span>Importe</span>
                        <strong>{money(importe)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollPanel>

        <footer className="carrito-footer">
          <div className="carrito-checkout-card">
            <div className="carrito-checkout-head">
              <div className="carrito-total-labels">
                <span>Total a cobrar</span>
                <small>{hayProductos ? "Venta lista para cobro" : "Sin captura"}</small>
              </div>

              <div
                className={`carrito-total-display${totalDisplaySize}`}
                aria-label={`Total ${money(total)}`}
              >
                <strong>{totalParts.whole}</strong>
                <sup>.{totalParts.cents}</sup>
              </div>
            </div>

            <div className="carrito-checkout-meta">
              <span>
                <strong>{hayProductos ? carrito.length : 0}</strong>
                <small>lineas</small>
              </span>
              <span>
                <strong>{hayProductos ? formatCantidad(totalUnidades) : 0}</strong>
                <small>unidades</small>
              </span>
            </div>

            <button
              type="button"
              className="carrito-btn-pago"
              onClick={onConfirmarPago}
              disabled={!hayProductos}
            >
              <span className="carrito-btn-pago-main">
                <CreditCard size={19} aria-hidden="true" />
                <span>{hayProductos ? "Cobrar venta" : "Ticket vacio"}</span>
              </span>
            </button>
          </div>
        </footer>
      </div>
    </aside>
  );
}
