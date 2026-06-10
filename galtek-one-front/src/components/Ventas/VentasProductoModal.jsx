import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

import "../../style/components/Ventas/VentasProductoModal.css";

const VentasProductoModal = ({
  visible,
  onHide,
  producto,
  onAgregarProducto,
  onDisminuirProducto,
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
    descripcion =
    "Descripción no disponible. Aquí podrás detallar características del producto, su uso, presentación, beneficios, recomendaciones o cualquier información relevante para el cliente.",
    esPesaje,
  } = producto;

  const esProductoPesaje = esPesaje === true || unidad === "kg";

  const handleAgregar = () => {
    if (esProductoPesaje) {
      const cantidad = parseFloat(pesajeModal.replace(",", "."));
      if (!isNaN(cantidad) && cantidad > 0) {
        onAgregarProducto({
          ...producto,
          cantidad,
          modoPesaje: true,
        });
        onHide();
      }
      return;
    }

    onAgregarProducto(producto);
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
        {/* IMAGEN */}
        <div className="ventas-modal-img-wrapper">
          {img ? (
            <img src={img} alt={nombre} className="ventas-modal-img" />
          ) : (
            <div className="ventas-modal-placeholder">
              <span className="pi pi-box" />
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="ventas-modal-info">
          <div className="ventas-modal-precio">
            ${precio.toFixed(2)} <span>/ {unidad}</span>
          </div>

          <div className="ventas-modal-descripcion">f
            <p>{descripcion}</p>
          </div>
        </div>

        {/* PESAJE */}
        {esProductoPesaje && (
          <div className="ventas-modal-pesaje">
            <label>Peso (kg)</label>
            <InputText
              value={pesajeModal}
              onChange={(e) =>
                setPesajeModal(e.target.value.replace(/[^\d.,]/g, ""))
              }
              placeholder="Ej. 0.350"
              inputMode="decimal"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAgregar();
              }}
            />
          </div>
        )}

        {/* ACCIONES */}
        <div className="ventas-modal-actions">
          {!esProductoPesaje && cantidadEnCarrito > 0 ? (
            <div className="ventas-modal-qty">
              <Button
                icon="pi pi-minus"
                className="p-button-text"
                onClick={() => onDisminuirProducto(producto)}
              />
              <span>{cantidadEnCarrito}</span>
              <Button
                icon="pi pi-plus"
                className="p-button-text"
                onClick={() => onAgregarProducto(producto)}
              />
            </div>
          ) : (
            <Button
              label="Agregar al carrito"
              icon="pi pi-shopping-cart"
              className="ventas-modal-btn-agregar"
              onClick={handleAgregar}
            />
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default VentasProductoModal;
