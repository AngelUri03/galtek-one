import React, { useEffect, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Box, Minus, PackageSearch, Pencil, Plus, Scale } from "lucide-react";
import VentasProductoModal from "./VentasProductoModal";
import "../../style/components/Ventas/VentasProductos.css";

const formatCantidad = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(3);
};

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

  const [productoModal, setProductoModal] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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
    onAgregarProducto?.(producto);

    const id = producto.idProducto ?? producto.id;
    setAnimandoId(id);
    if (animTimerRef.current[id]) clearTimeout(animTimerRef.current[id]);
    animTimerRef.current[id] = setTimeout(() => {
      setAnimandoId(null);
    }, 360);
  };

  const handleDisminuir = (producto) => {
    onDisminuirProducto?.(producto);
  };

  const handleChangePesaje = (id, valor) => {
    const limpio = (valor ?? "").replace(/[^\d.,]/g, "");
    setPesajeEnEdicion((prev) => ({
      ...prev,
      [id]: limpio,
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

    if (Number.isNaN(cantidad) || cantidad <= 0) {
      onConfirmPesaje({ ...productoBase, cantidad: 0, modoPesaje: true });
      return;
    }

    onConfirmPesaje({ ...productoBase, cantidad, modoPesaje: true });
  };

  if (!productos || productos.length === 0) {
    return (
      <section className="v-products">
        <div className="ventas-productos-empty">
          <PackageSearch size={30} aria-hidden="true" />
          <strong>Sin productos disponibles</strong>
          <span>No hay coincidencias en la venta actual.</span>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="v-products" aria-label="Productos disponibles">
        <div className="ventas-productos-toolbar">
          <div>
            <span>Productos</span>
            <strong>{productos.length} disponibles</strong>
          </div>
        </div>

        <div className="ventas-productos-grid">
          {productos.map((producto) => {
            const id = producto.idProducto ?? producto.id;
            const nombre =
              producto.nombreProducto ?? producto.nombre ?? "Producto sin nombre";
            const precio = Number(producto.precioVenta ?? producto.precio ?? 0);
            const unidad =
              producto.unidad?.nombreUnidad ??
              producto.unidadMedida ??
              producto.unidad ??
              "unidad";
            const imgSrc = producto.img ?? producto.imagenUrl ?? null;
            const categoria = producto.categoriaNombre || producto.raw?.categoriaNombre || "";
            const sku = producto.sku || producto.raw?.sku || "";
            const codigoBarras =
              producto.codigoBarras || producto.raw?.codigoBarras || "";

            const cantidadEnCarrito = obtenerCantidadEnCarrito?.(id) ?? 0;
            const tieneCantidad = cantidadEnCarrito > 0;
            const esPesaje = producto.esPesaje === true || unidad === "kg";

            const productoBase = {
              ...producto,
              id,
              nombre,
              precio,
              unidad,
              img: imgSrc,
              esPesaje,
              categoriaNombre: categoria,
              sku,
              codigoBarras,
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
                className={`ventas-producto-card${animandoId === id ? " ventas-producto-card--agregar" : ""}${tieneCantidad ? " ventas-producto-card--selected" : ""}${!imgSrc ? " ventas-producto-card--no-media" : ""}`}
              >
                <button
                  type="button"
                  className="ventas-producto-hit"
                  onClick={() => {
                    setProductoModal(productoBase);
                    setModalVisible(true);
                  }}
                  aria-label={`Ver informacion de ${nombre}`}
                >
                  <span className="ventas-producto-media">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={nombre}
                        className="ventas-producto-img"
                      />
                    ) : (
                      <span className="ventas-producto-placeholder">
                        <Box size={22} aria-hidden="true" />
                      </span>
                    )}
                  </span>

                  <span className="ventas-producto-info">
                    {categoria && (
                      <span className="ventas-producto-categoria">
                        {categoria}
                      </span>
                    )}
                    <strong className="ventas-producto-nombre">{nombre}</strong>
                    <span className="ventas-producto-meta-row">
                      <span className="ventas-producto-precio">
                        ${precio.toFixed(2)}
                        <small>/ {unidad}</small>
                      </span>
                      {tieneCantidad && (
                        <span className="ventas-producto-badge">
                          {formatCantidad(cantidadEnCarrito)}
                        </span>
                      )}
                    </span>
                  </span>
                </button>

                <div className="ventas-producto-actions">
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
                      <Scale size={15} className="ventas-pesaje-icon" aria-hidden="true" />
                      <InputText
                        ref={(el) => {
                          if (el) pesajeInputRefs.current[String(id)] = el;
                        }}
                        value={valorPesajeVisible}
                        onFocus={() => setFocusPesajeId(String(id))}
                        onChange={(e) => handleChangePesaje(id, e.target.value)}
                        onKeyDown={(e) => handleKeyDownPesaje(e, productoBase, id)}
                        onBlur={() => {
                          setFocusPesajeId(null);
                          handleConfirmPesaje(productoBase, id);
                        }}
                        className="ventas-pesaje-input"
                        placeholder="kg"
                        inputMode="decimal"
                      />
                      <Pencil size={13} className="ventas-pesaje-pencil" aria-hidden="true" />
                    </div>
                  ) : !tieneCantidad ? (
                    <button
                      type="button"
                      className="ventas-btn-agregar"
                      onClick={() => handleAgregar(productoBase)}
                      title={`Agregar ${nombre}`}
                      aria-label={`Agregar ${nombre}`}
                    >
                      <Plus size={18} aria-hidden="true" />
                    </button>
                  ) : (
                    <div className="ventas-producto-qty">
                      <button
                        type="button"
                        className="ventas-btn-cantidad"
                        onClick={() => handleDisminuir(productoBase)}
                        aria-label={`Quitar ${nombre}`}
                      >
                        <Minus size={15} aria-hidden="true" />
                      </button>
                      <span className="ventas-cantidad-display">
                        {formatCantidad(cantidadEnCarrito)}
                      </span>
                      <button
                        type="button"
                        className="ventas-btn-cantidad"
                        onClick={() => handleAgregar(productoBase)}
                        aria-label={`Agregar ${nombre}`}
                      >
                        <Plus size={15} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <VentasProductoModal
        visible={modalVisible}
        onHide={() => setModalVisible(false)}
        producto={productoModal}
        onAgregarProducto={onAgregarProducto}
        onDisminuirProducto={onDisminuirProducto}
        onConfirmPesaje={onConfirmPesaje}
        cantidadEnCarrito={
          productoModal ? obtenerCantidadEnCarrito(productoModal.id) : 0
        }
      />
    </>
  );
};

export default VentasProductos;
