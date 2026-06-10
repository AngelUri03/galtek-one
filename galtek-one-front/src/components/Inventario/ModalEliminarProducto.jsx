import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

export default function ModalEliminarProducto({ open, producto, onHide, onConfirm }) {
  if (!producto) {
    return (
      <Dialog visible={open} onHide={onHide} header="Eliminar producto" style={{ width: "480px" }}>
        Cargando…
      </Dialog>
    );
  }

  const footer = (
    <div className="flex justify-end gap-2">
      <Button label="Cancelar" className="p-button-text" onClick={onHide} />
      <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={() => onConfirm(producto.idProducto)} />
    </div>
  );

  return (
    <Dialog visible={open} onHide={onHide} header="Eliminar producto" style={{ width: "500px" }} footer={footer} modal>
      <p>
        ¿Seguro que deseas eliminar <strong>{producto.nombre}</strong> (SKU {producto.sku})? Esta acción no se puede deshacer.
      </p>
    </Dialog>
  );
}
