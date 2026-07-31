import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Box, Minus, Plus, Scale } from "lucide-react";

import "../../style/components/Ventas/VentasProductoModal.css";

const VentasProductoModal = ({
  visible,
  onHide,
  producto,
  onAgregarProducto,
  onDisminuirProducto,
  onConfirmPesaje,
  cantidadEnCarrito = 0,
}) => {
  const [pesajeModal, setPesajeModal] = useState("");

  useEffect(() => {
    if (visible) setPesajeModal("");
  }, [visible]);

  if (!producto) return null;

  const {
    nombre,
    precio,
    unidad,
    img,
    descripcion = "Producto disponible para venta.",
    esPesaje,
    categoriaNombre,
    sku,
    codigoBarras,
  } = producto;

  const esProductoPesaje = esPesaje === true || unidad === "kg";
  const precioNumerico = Number(precio || 0);

  const handleAgregar = () => {
    if (esProductoPesaje) {
      const cantidad = parseFloat(pesajeModal.replace(",", "."));
      if (!Number.isNaN(cantidad) && cantidad > 0) {
        const payload = {
          ...producto,
          cantidad,
          modoPesaje: true,
        };
        if (onConfirmPesaje) {
          onConfirmPesaje(payload);
        } else {
          onAgregarProducto?.(payload);
        }
        onHide();
      }
      return;
    }

    onAgregarProducto?.(producto);
    onHide();
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      dismissableMask
      draggable={false}
      className="ventas-producto-modal"
      header={nombre}
    >
      <div className="ventas-modal-content">
        <div className="ventas-modal-img-wrapper">
          {img ? (
            <img src={img} alt={nombre} className="ventas-modal-img" />
          ) : (
            <div className="ventas-modal-placeholder">
              <Box size={42} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="ventas-modal-info">
          <div className="ventas-modal-precio">
            ${precioNumerico.toFixed(2)} <span>/ {unidad}</span>
          </div>

          <div className="ventas-modal-details">
            <div>
              <span>Categoria</span>
              <strong>{categoriaNombre || "Sin categoria"}</strong>
            </div>
            <div>
              <span>Unidad</span>
              <strong>{unidad}</strong>
            </div>
            {(sku || codigoBarras) && (
              <div>
                <span>{sku ? "SKU" : "Codigo"}</span>
                <strong>{sku || codigoBarras}</strong>
              </div>
            )}
            {cantidadEnCarrito > 0 && (
              <div>
                <span>En venta</span>
                <strong>
                  {cantidadEnCarrito} {unidad}
                </strong>
              </div>
            )}
          </div>

          <div className="ventas-modal-descripcion">
            <p>{descripcion}</p>
          </div>
        </div>

        {esProductoPesaje && (
          <label className="ventas-modal-pesaje">
            <span>
              <Scale size={15} aria-hidden="true" />
              Peso
            </span>
            <InputText
              value={pesajeModal}
              onChange={(e) =>
                setPesajeModal(e.target.value.replace(/[^\d.,]/g, ""))
              }
              placeholder="0.000 kg"
              inputMode="decimal"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAgregar();
              }}
            />
          </label>
        )}

        <div className="ventas-modal-actions">
          {!esProductoPesaje && cantidadEnCarrito > 0 ? (
            <div className="ventas-modal-qty">
              <button
                type="button"
                onClick={() => onDisminuirProducto?.(producto)}
                aria-label="Disminuir producto"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span>{cantidadEnCarrito}</span>
              <button
                type="button"
                onClick={() => onAgregarProducto?.(producto)}
                aria-label="Aumentar producto"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="ventas-modal-btn-agregar"
              onClick={handleAgregar}
            >
              <Plus size={18} aria-hidden="true" />
              <span>{esProductoPesaje ? "Agregar peso" : "Agregar producto"}</span>
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default VentasProductoModal;
