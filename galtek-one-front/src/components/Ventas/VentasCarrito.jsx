import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { ScrollPanel } from "primereact/scrollpanel";
import { InputText } from "primereact/inputtext";
import "../../style/components/Ventas/VentasCarrito.css";

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
          <h2 className="carrito-title">Carrito</h2>
          <span className="carrito-subtitle">
            {hayProductos
              ? `${carrito.length} producto${carrito.length > 1 ? "s" : ""
              } en la venta`
              : "Sin productos aún"}
          </span>
        </div>

        {hayProductos && (
          <Button
            type="button"
            className="carrito-btn-vaciar p-button-text p-button-rounded"
            icon="pi pi-trash"
            label="Vaciar"
            onClick={onVaciarCarrito}
          />
        )}
      </header>

      <div className="carrito-main">
        <ScrollPanel className="carrito-scroll">
          {!hayProductos ? (
            <div className="carrito-vacio">
              <span className="carrito-vacio-icon pi pi-shopping-bag" />
              <p className="carrito-vacio-text">
                Agrega productos desde el catálogo para comenzar una venta.
              </p>
            </div>
          ) : (
            <div className="carrito-contenido">
              {carrito.map((item) => {
                const pesaje = esItemPesaje(item);
                const id = String(item.id);

                return (
                  <div key={item.id} className="carrito-item">
                    <div className="carrito-item-left">
                      <Button
                        type="button"
                        className="carrito-btn-eliminar p-button-rounded p-button-text"
                        icon="pi pi-times"
                        onClick={() => onEliminarProducto?.(item.id)}
                        aria-label="Quitar producto"
                      />

                      <div className="carrito-thumb">
                        {item.img ? (
                          <img
                            src={item.img}
                            alt={item.nombre}
                            className="carrito-thumb-img"
                          />
                        ) : (
                          <div className="carrito-thumb-placeholder">
                            <span className="pi pi-box" />
                          </div>
                        )}
                      </div>

                      <div className="carrito-info">
                        <strong className="carrito-nombre">
                          {item.nombre}
                        </strong>

                        <span className="carrito-precio-unit">
                          ${(item.precio || 0).toFixed(2)}{" "}
                          <span className="carrito-precio-unit-unidad">
                            / {item.unidad}
                          </span>
                        </span>

                        {pesaje && (
                          <span className="carrito-peso-info">
                            Peso: {(item.cantidad || 0).toFixed(3)} kg
                          </span>
                        )}
                      </div>
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
                          <span
                            className="pi pi-pencil carrito-pesaje-icon"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const el = pesajeInputRefs.current[String(id)];
                              el?.focus?.();
                              el?.select?.();
                            }}
                          />

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
                            placeholder="Editar"
                            inputMode="decimal"
                          />
                        </div>
                      ) : (
                        <div className="carrito-cantidad-control">
                          <Button
                            type="button"
                            className="carrito-btn-cantidad p-button-rounded p-button-text"
                            icon="pi pi-minus"
                            onClick={() => onDisminuirProducto?.(item)}
                            aria-label="Disminuir"
                          />

                          <span className="carrito-cantidad">
                            {item.cantidad}
                          </span>

                          <Button
                            type="button"
                            className="carrito-btn-cantidad p-button-rounded p-button-text"
                            icon="pi pi-plus"
                            onClick={() => onAumentarProducto?.(item)}
                            aria-label="Aumentar"
                          />
                        </div>
                      )}

                      <div className="carrito-total-item">
                        <span className="carrito-total-item-label">
                          Importe
                        </span>
                        <span className="carrito-total-item-value">
                          $
                          {((item.precio || 0) * (item.cantidad || 0)).toFixed(
                            2
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollPanel>

        <footer className="carrito-footer">
          <div className="carrito-total">
            <div className="carrito-total-labels">
              <span className="carrito-total-title">Total</span>
              <span className="carrito-total-subtitle">
                Incluye todos los productos del carrito
              </span>
            </div>
            <span className="carrito-total-amount">${total.toFixed(2)}</span>
          </div>

          <Button
            type="button"
            className="carrito-btn-pago"
            onClick={onConfirmarPago}
            disabled={!hayProductos}
            label={hayProductos ? "Confirmar pago" : "Carrito vacío"}
            icon={hayProductos ? "pi pi-check-circle" : "pi pi-lock"}
          />
        </footer>
      </div>
    </aside>
  );
}
