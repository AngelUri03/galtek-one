import React, { useState } from "react";

const ModalPeso = ({ onConfirm, onClose }) => {
  const [peso, setPeso] = useState("");

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        
        <h2>Pago por peso</h2>

        <input
          type="number"
          placeholder="Ingresa peso"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
        />

        <button onClick={() => onConfirm(peso)}>
          Confirmar
        </button>

        <button className="modal-close" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ModalPeso;
