import React from "react";

const MetodosPago = ({ onSelectMetodo, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">

        <h2>Métodos de pago</h2>

        <button onClick={() => onSelectMetodo("efectivo")}>
          Pago en efectivo
        </button>

        <button onClick={() => onSelectMetodo("tarjeta")}>
          Tarjeta
        </button>

        <button onClick={() => onSelectMetodo("peso")}>
          Pago por peso
        </button>

        <button className="modal-close" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default MetodosPago;
