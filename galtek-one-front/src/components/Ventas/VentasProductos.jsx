import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FaPen } from "react-icons/fa";
import VentasProductoModal from "./VentasProductoModal";
import "../../style/components/Ventas/VentasProductos.css";

const VentasProductos = ({
  productos = [],
  onAgregarProducto,
  onDisminuirProducto,
  obtenerCantidadEnCarrito,
  onConfirmPesaje,
  carrito = [],
}) => {
  const [pesajeEnEdicion, setPesajeEnEdicion] = useState({});
  const [focusPesajeId, setFocusPesajeId] = useState(null);
  const pesajeInputRefs = useRef({});

  // 🔹 Modal
  const [productoModal, setProductoModal] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 🔹 Animación al agregar
  const [animandoId, setAnimandoId] = useState(null);
  const animTimerRef = useRef({});

  useEffect(() => {
    setPesajeEnEdicion((prev) => {
      const next = { ...prev };
      const map = new Map(carrito.map((p) => [String(p.id), p]));

      Object.keys(next).forEach((id) => {
        const item = map.get(String(id));
        if (!item || !item.cantidad || item.cantidad <= 0) {
          delete next[id];
        }
      });

      carrito.forEach((item) => {
        if (!(item.esPesaje === true || item.unidad === "kg")) return;
        const id = String(item.id);
        if (focusPesajeId === id) return;

        const v = item.cantidad > 0 ? String(item.cantidad) : "";
        next[id] = v;
      });

      return next;
    });
  }, [carrito, focusPesajeId]);

  const handleAgregar = (producto) => {
    onAgregarProducto && onAgregarProducto(producto);

    // Disparar animación en la card
    const id = producto.idProducto ?? producto.id;
    setAnimandoId(id);
    if (animTimerRef.current[id]) clearTimeout(animTimerRef.current[id]);
    animTimerRef.current[id] = setTimeout(() => {
      setAnimandoId(null);
    }, 420);
  };

  const handleDisminuir = (producto) => {
    onDisminuirProducto && onDisminuirProducto(producto);
  };

  const handleChangePesaje = (id, valor) => {
    setPesajeEnEdicion((prev) => ({
      ...prev,
      [id]: valor,
    }));
  };

  const handleKeyDownPesaje = (e, productoBase, id) => {
    const key = e.key;

    if (key === "Enter" || key === "NumpadEnter" || e.keyCode === 13) {
      e.preventDefault();
      handleConfirmPesaje(productoBase, id);
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

  const handleConfirmPesaje = (productoBase, id) => {
    if (!onConfirmPesaje) return;

    const raw = (pesajeEnEdicion[id] ?? "").toString().trim();

    if (!raw) {
      onConfirmPesaje({ ...productoBase, cantidad: 0, modoPesaje: true });
      return;
    }

    const cantidad = parseFloat(raw.replace(",", "."));

    if (isNaN(cantidad) || cantidad <= 0) {
      onConfirmPesaje({ ...productoBase, cantidad: 0, modoPesaje: true });
      return;
    }

    onConfirmPesaje({ ...productoBase, cantidad, modoPesaje: true });
  };

  if (!productos || productos.length === 0) {
    return (
      <section className="v-products">
        <div className="ventas-productos-empty">
          No hay productos para mostrar.
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="v-products">
        <div className="ventas-productos-grid">
          {productos.map((producto) => {
            const id = producto.idProducto ?? producto.id;
            const nombre =
              producto.nombreProducto ?? producto.nombre ?? "Producto sin nombre";
            const precio = producto.precioVenta ?? producto.precio ?? 0;
            const unidad =
              producto.unidad?.nombreUnidad ??
              producto.unidadMedida ??
              producto.unidad ??
              "unidad";
            const imgSrc = producto.img ?? producto.imagenUrl ?? null;

            const cantidadEnCarrito = obtenerCantidadEnCarrito?.(id) ?? 0;
            const tieneCantidad = cantidadEnCarrito > 0;
            const esPesaje = producto.esPesaje === true;

            const productoBase = {
              ...producto,
              id,
              nombre,
              precio,
              unidad,
              img: imgSrc,
              esPesaje,
              descripcion:
                producto.descripcion ||
                producto.raw?.descripcion ||
                "Producto disponible para venta.",
            };

            const valorPesajeVisible =
              pesajeEnEdicion[id] ??
              (cantidadEnCarrito > 0 ? cantidadEnCarrito.toString() : "");

            return (
              <article
                key={id}
                className={`ventas-producto-card${animandoId === id ? " ventas-producto-card--agregar" : ""}`}
                onClick={() => {
                  setProductoModal(productoBase);
                  setModalVisible(true);
                }}
              >
                <div className="ventas-producto-media">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={nombre}
                      className="ventas-producto-img"
                    />
                  ) : (
                    <div className="ventas-producto-placeholder">
                      <span className="pi pi-shopping-bag" />
                    </div>
                  )}
                </div>

                <h4 className="ventas-producto-nombre">{nombre}</h4>

                <p className="ventas-producto-precio">
                  ${precio.toFixed(2)}
                  <span className="ventas-producto-unidad"> / {unidad}</span>
                </p>

                <div
                  className="ventas-producto-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  {esPesaje ? (
                    <div
                      className="ventas-pesaje-inline"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const el = pesajeInputRefs.current[String(id)];
                        el?.focus?.();
                        el?.select?.();
                      }}
                    >
                      <FaPen className="ventas-pesaje-icon" />
                      <InputText
                        ref={(el) => {
                          if (el) pesajeInputRefs.current[String(id)] = el;
                        }}
                        value={valorPesajeVisible}
                        onChange={(e) =>
                          handleChangePesaje(id, e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDownPesaje(e, productoBase, id)
                        }
                        onBlur={() => handleConfirmPesaje(productoBase, id)}
                        className="ventas-pesaje-input"
                        placeholder="Editar"
                        inputMode="decimal"
                      />
                    </div>
                  ) : !tieneCantidad ? (
                    <Button
                      type="button"
                      label="Agregar"
                      icon="pi pi-plus"
                      className="ventas-btn-agregar"
                      onClick={() => handleAgregar(productoBase)}
                    />
                  ) : (
                    <div className="ventas-producto-qty">
                      <Button
                        icon="pi pi-minus"
                        className="ventas-btn-cantidad"
                        onClick={() => handleDisminuir(productoBase)}
                      />
                      <span className="ventas-cantidad-display">
                        {cantidadEnCarrito}
                      </span>
                      <Button
                        icon="pi pi-plus"
                        className="ventas-btn-cantidad"
                        onClick={() => handleAgregar(productoBase)}
                      />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 🔹 MODAL */}
      <VentasProductoModal
        visible={modalVisible}
        onHide={() => setModalVisible(false)}
        producto={productoModal}
        onAgregarProducto={onAgregarProducto}
        onDisminuirProducto={onDisminuirProducto}
        cantidadEnCarrito={
          productoModal
            ? obtenerCantidadEnCarrito(productoModal.id)
            : 0
        }
      />
    </>
  );
};

export default VentasProductos;
