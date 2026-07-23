import React from "react";
import { Delete } from "lucide-react";
import { appendKeypadValue } from "../../cash/cashSessionUtils";

const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "backspace"];

export default function CashNumericKeypad({ value, onChange, disabled = false, label = "Teclado numerico" }) {
  const handlePress = (key) => {
    if (disabled) return;
    onChange?.(appendKeypadValue(value, key));
  };

  return (
    <div className="cash-keypad" aria-label={label}>
      {keys.map((key) => {
        const isBackspace = key === "backspace";
        return (
          <button
            key={key}
            type="button"
            className="cash-keypad__key"
            onClick={() => handlePress(key)}
            disabled={disabled}
            aria-label={isBackspace ? "Borrar ultimo digito" : `Capturar ${key}`}
          >
            {isBackspace ? <Delete size={18} aria-hidden="true" /> : key}
          </button>
        );
      })}
    </div>
  );
}
