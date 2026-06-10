import React from "react";
import { Button } from "primereact/button";
import "../../../../style/components/Ventas/TecladoNumerico.css";

const teclas = [
  "7", "8", "9",
  "4", "5", "6",
  "1", "2", "3",
  ".", "0", "⌫"
];

const TecladoNumerico = ({ onInput, onDelete }) => {
  return (
    <div className="teclado-numerico">
      {teclas.map((key) => (
        <Button
          key={key}
          label={key}
          className={`tecla ${key === "⌫" ? "tecla-borrar" : ""}`}
          onClick={() =>
            key === "⌫" ? onDelete() : onInput(key)
          }
        />
      ))}
    </div>
  );
};

export default TecladoNumerico;
