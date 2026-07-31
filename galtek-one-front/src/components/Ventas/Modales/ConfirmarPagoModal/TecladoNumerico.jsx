import React from "react";
import { Button } from "primereact/button";
import "../../../../style/components/Ventas/TecladoNumerico.css";

const teclas = [
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: ".", label: "." },
  { value: "0", label: "0" },
  { value: "delete", icon: "pi pi-delete-left", ariaLabel: "Borrar" },
];

const TecladoNumerico = ({ onInput, onDelete }) => {
  return (
    <div className="teclado-numerico">
      {teclas.map((key) => (
        <Button
          key={key.value}
          label={key.label}
          icon={key.icon}
          aria-label={key.ariaLabel || key.label}
          className={`tecla ${key.value === "delete" ? "tecla-borrar" : ""}`}
          onClick={() => (key.value === "delete" ? onDelete() : onInput(key.value))}
        />
      ))}
    </div>
  );
};

export default TecladoNumerico;
